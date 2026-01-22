import { ref } from 'vue';
import { decode } from '../logic/codec';
import questionsData from '../data/questions.json';
import type { Attitude, Module } from '../types';

// 定义题目数据的类型映射
const allModules = (questionsData.modules as unknown) as Module[];

// 态度映射表 (用于翻译给 AI 看)
const ATTITUDE_MAP: Record<number, string> = {
  0: "未表态/跳过",
  1: "硬性边界(绝不)",
  2: "待商议/看情况",
  3: "接受/愿意",
  4: "核心需求(必须)"
};

// --- ✅ 新增：AI 工具列表 (这就是缺失的部分) ---
export const AI_TOOLS = [
  { name: 'ChatGPT', url: 'https://chat.openai.com/', icon: 'i-ph-robot-bold' },
  { name: 'Claude', url: 'https://claude.ai/new', icon: 'i-ph-brain-bold' },
  { name: 'DeepSeek', url: 'https://chat.deepseek.com/', icon: 'i-ph-magnifying-glass-bold' },
  { name: 'Gemini', url: 'https://gemini.google.com/', icon: 'i-ph-sparkle-bold' },
  { name: '豆包', url: 'https://www.doubao.com/', icon: 'i-ph-chat-circle-dots-bold' },
  { name: 'Kimi', url: 'https://kimi.moonshot.cn/', icon: 'i-ph-moon-stars-bold' },
];

// --- Prompt 模板 (占位符) ---

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

  // 辅助：获取选项文本
  function getOptionText(q: any, idx: number) {
    const opt = q.options[idx];
    return typeof opt === 'string' ? opt : (opt?.long || opt?.short || '未知选项');
  }

  // --- 生成单人报告数据 ---
  function generateSingleContent(answers: Record<string, Attitude[]>) {
    let content = "";
    
    allModules.forEach(m => {
      let moduleContent = "";
      m.questions.forEach(q => {
        const states = answers[q.id];
        if (!states) return;
        
        states.forEach((att, idx) => {
          if (att === 0) return; // 跳过未选
          const optText = getOptionText(q, idx);
          moduleContent += `  - 题目：${q.title}\n    选项：${optText}\n    态度：${ATTITUDE_MAP[att]}\n`;
        });
      });

      if (moduleContent) {
        content += `\n### ${m.name}\n${moduleContent}`;
      }
    });
    return content;
  }

  // --- 生成对比报告数据 (复用 Compare.vue 逻辑) ---
  function generateCompareContent(myMap: Record<string, Attitude[]>, partnerMap: Record<string, Attitude[]>) {
    let critical = "", resonance = "", discuss = "", negotiate = "";

    allModules.forEach(m => {
      m.questions.forEach(q => {
        const aList = myMap[q.id];
        const bList = partnerMap[q.id];
        if (!aList || !bList) return;

        q.options.forEach((opt, idx) => {
          const a = Number(aList[idx] || 0) as Attitude;
          const b = Number(bList[idx] || 0) as Attitude;
          if (a === 0 && b === 0) return;

          const optText = getOptionText(q, idx);
          const line = `  - 场景：${q.title} [${optText}]\n    我：${ATTITUDE_MAP[a]} | 对方：${ATTITUDE_MAP[b]}\n`;

          // 逻辑复用 Compare.vue
          if ((a === 4 && b === 1) || (a === 1 && b === 4)) {
            critical += line;
          } else if (a === 2 || b === 2 || (a === 0 && b !== 0) || (a !== 0 && b === 0)) {
            discuss += line;
          } else if ((a >= 3 && b >= 3) || (a === 1 && b === 1)) {
            resonance += line;
          } else {
            negotiate += line;
          }
        });
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

  // --- 主入口：生成 Prompt ---
  async function generateReport(code1: string, code2?: string) {
    isLoading.value = true;
    errorMsg.value = '';
    
    try {
      // 模拟一点延迟，让Loading展示出来，体验更好
      await new Promise(resolve => setTimeout(resolve, 500));

      if (!code1) throw new Error("代码为空");

      // 1. 解码 Code A
      const res1 = decode(code1);
      const answers1 = res1.answers as Record<string, Attitude[]>;

      if (code2) {
        // --- 双人对比模式 ---
        const res2 = decode(code2);
        const answers2 = res2.answers as Record<string, Attitude[]>;
        const content = generateCompareContent(answers1, answers2);
        return COMPARE_TEMPLATE.replace('{{CONTENT}}', content);
      } else {
        // --- 单人分析模式 ---
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