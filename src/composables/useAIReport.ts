import { ref } from 'vue';
import { decode } from '../logic/codec';
import questionsData from '../data/questions.json';
import type { Attitude, Module } from '../types';

// 定义题目数据的类型映射
const allModules = (questionsData.modules as unknown) as Module[];

// 态度映射表
const ATTITUDE_MAP: Record<number, string> = {
  0: "未表态/跳过",
  1: "硬性边界(绝不)",
  2: "待商议/看情况",
  3: "接受/愿意",
  4: "核心需求(必须)"
};

// --- ✅ 更新：AI 工具列表 (按要求：一行两个，包含指定国内AI) ---
export const AI_TOOLS = [
  { name: '豆包 (Doubao)', url: 'https://www.doubao.com/', icon: 'i-ph-chat-circle-dots-bold' },
  { name: 'DeepSeek', url: 'https://chat.deepseek.com/', icon: 'i-ph-magnifying-glass-bold' },
  { name: 'ChatGPT', url: 'https://chat.openai.com/', icon: 'i-ph-robot-bold' },
  { name: 'Gemini', url: 'https://gemini.google.com/', icon: 'i-ph-sparkle-bold' },
  { name: 'Claude', url: 'https://claude.ai/new', icon: 'i-ph-brain-bold' },
  { name: 'Grok', url: 'https://x.ai/', icon: 'i-ph-x-logo-bold' }, // 使用 X logo 代替 Grok
  { name: '腾讯元宝', url: 'https://yuanbao.tencent.com/', icon: 'i-ph-chat-teardrop-text-bold' },
  { name: 'Kimi', url: 'https://kimi.moonshot.cn/', icon: 'i-ph-moon-stars-bold' },
];

// --- Prompt 模板 ---
// (模板内容保持不变，仅占位符等待替换)

const SINGLE_TEMPLATE = `
[角色设定]
你是一位专业的亲密关系咨询师和心理分析师，擅长通过行为数据分析人格特质与依恋类型。

[任务目标]
请根据以下“关系配置单”的用户自测数据，生成一份深度的个人关系画像分析报告。

[用户数据]
{{CONTENT}}

[分析要求]
1. **风格**：温和、专业、具有洞察力，避免冷冰冰的评判。
2. **核心画像**：分析该用户的恋爱观关键词（如：独立型、焦虑型、服务型等）。
3. **雷点预警**：指出该用户在关系中绝对不能触碰的底线。
4. **需求分析**：解读其核心快乐源泉是什么。
5. **匹配建议**：什么样的伴侣最适合Ta？
6. **字数**：500字左右。
`;

const COMPARE_TEMPLATE = `
[角色设定]
你是一位资深的婚恋与关系调解专家，擅长处理伴侣间的价值观差异与冲突。

[任务目标]
请根据以下两位用户（“我”与“对方”）的“关系配置单”比对数据，生成一份关系匹配度与经营建议报告。

[比对数据分类说明]
- **⚠️ 核心冲突 (Critical Conflict)**：一方的核心需求(必须)撞上了另一方的硬性边界(绝不)。这是高危雷区。
- **🤝 默契共振 (Resonance)**：双方态度高度一致。这是关系的基石。
- **💬 待厘清 (To Discuss)**：有一方选择了“看情况”或态度模糊，需要沟通细节。
- **⚖️ 协商让步 (Negotiate)**：双方意见不完全一致，但没有触及底线，需要磨合。

[详细数据]
{{CONTENT}}

[分析要求]
1. **整体评分**：给这段关系的匹配度打一个直观的分数（0-100），并简述理由。
2. **危机干预**：针对“核心冲突”部分，给出具体的调解或共存方案（如果无法调解，请直言）。
3. **优势强化**：指出这段关系最坚固的部分是什么。
4. **经营建议**：针对“待厘清”和“协商让步”的部分，给出一至两条具体的沟通话术建议。
5. **结语**：一句温暖的祝福或提醒。
`;

export function useAIReport() {
  const isLoading = ref(false);
  const errorMsg = ref('');

  function getOptionText(q: any, idx: number) {
    const opt = q.options[idx];
    return typeof opt === 'string' ? opt : (opt?.long || opt?.short || '未知选项');
  }

  // --- ✅ 修改：生成单人报告数据 (合并同场景) ---
  function generateSingleContent(answers: Record<string, Attitude[]>) {
    let content = "";
    
    allModules.forEach(m => {
      let moduleContent = "";
      m.questions.forEach(q => {
        const states = answers[q.id];
        if (!states) return;
        
        // 1. 检查该场景下有没有有效选项（非0）
        const activeOptions = states.map((att, idx) => ({ att, idx })).filter(item => item.att !== 0);
        
        if (activeOptions.length > 0) {
          // 2. 输出场景标题
          moduleContent += `  - 场景：${q.title}\n`;
          // 3. 循环输出该场景下的所有项目
          activeOptions.forEach(item => {
            const optText = getOptionText(q, item.idx);
            moduleContent += `    项目：${optText} | 态度：${ATTITUDE_MAP[item.att]}\n`;
          });
        }
      });

      if (moduleContent) {
        content += `\n### ${m.name}\n${moduleContent}`;
      }
    });
    return content;
  }

  // --- ✅ 修改：生成对比报告数据 (合并同场景) ---
  function generateCompareContent(myMap: Record<string, Attitude[]>, partnerMap: Record<string, Attitude[]>) {
    let critical = "", resonance = "", discuss = "", negotiate = "";

    allModules.forEach(m => {
      m.questions.forEach(q => {
        const aList = myMap[q.id];
        const bList = partnerMap[q.id];
        if (!aList || !bList) return;

        // 收集该问题下的所有有效条目
        const entries: { text: string, type: 'critical' | 'resonance' | 'discuss' | 'negotiate' }[] = [];

        q.options.forEach((_opt, idx) => {
          const a = Number(aList[idx] || 0) as Attitude;
          const b = Number(bList[idx] || 0) as Attitude;
          if (a === 0 && b === 0) return;

          const optText = getOptionText(q, idx);
          // 生成单行描述： "    项目：xxx | 我：xxx 对方：xxx"
          const line = `    项目：${optText} | 我：${ATTITUDE_MAP[a]} VS 对方：${ATTITUDE_MAP[b]}\n`;

          if ((a === 4 && b === 1) || (a === 1 && b === 4)) {
            entries.push({ text: line, type: 'critical' });
          } else if (a === 2 || b === 2 || (a === 0 && b !== 0) || (a !== 0 && b === 0)) {
            entries.push({ text: line, type: 'discuss' });
          } else if ((a >= 3 && b >= 3) || (a === 1 && b === 1)) {
            entries.push({ text: line, type: 'resonance' });
          } else {
            entries.push({ text: line, type: 'negotiate' });
          }
        });

        // 只有当该题目下有内容时，才追加标题和内容
        if (entries.length > 0) {
           const titleLine = `  - 场景：${q.title}\n`;
           
           entries.forEach(e => {
             if(e.type === 'critical') critical += (titleLine + e.text);
             if(e.type === 'discuss') discuss += (titleLine + e.text);
             if(e.type === 'resonance') resonance += (titleLine + e.text);
             if(e.type === 'negotiate') negotiate += (titleLine + e.text);
           });
        }
      });
    });

    return `
### ⚠️ 核心冲突 (Critical Conflict)
${critical || "（无核心冲突）"}

### 💬 待厘清 (To Discuss)
${discuss || "（无待厘清项）"}

### ⚖️ 协商让步 (Negotiate)
${negotiate || "（无协商项）"}

### 🤝 默契共振 (Resonance)
${resonance || "（无共振项）"}
`;
  }

  // --- 主入口 ---
  async function generateReport(code1: string, code2?: string) {
    isLoading.value = true;
    errorMsg.value = '';
    
    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      if (!code1) throw new Error("代码为空");

      const res1 = decode(code1);
      const answers1 = res1.answers as Record<string, Attitude[]>;

      if (code2) {
        const res2 = decode(code2);
        const answers2 = res2.answers as Record<string, Attitude[]>;
        const content = generateCompareContent(answers1, answers2);
        return COMPARE_TEMPLATE.replace('{{CONTENT}}', content);
      } else {
        const content = generateSingleContent(answers1);
        return SINGLE_TEMPLATE.replace('{{CONTENT}}', content);
      }

    } catch (e) {
      console.error(e);
      errorMsg.value = "代码解析失败，请检查代码是否完整";
      return "";
    } finally {
      isLoading.value = false;
    }
  }

  return {
    generateReport,
    isLoading,
    errorMsg
  };
}