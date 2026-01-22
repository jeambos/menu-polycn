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
# Role: 资深亲密关系咨询师 & 心理分析专家

## Task
请根据我提供的【DIY Relation 关系配置数据】，为我撰写一份深度的《个人关系形态分析报告》。

## Context
这是一套包含 10 个维度、97 个具体场景的关系测试。
我的选择代表了以下权重：
- ⭐ (Core): 核心需求，我的快乐源泉，不可或缺。
- ⛔ (Limit): 硬性边界，我的底线，触碰即熔断。
- ✅ (Yes): 同意/接受，属于舒适区。
- ❌ (No): 拒绝/不喜欢，但可商量。
- ❓ (Maybe): 不确定/看情况。
- [跳过]: 不在乎或未作答。

## Analysis Guidelines (分析准则)
1. **去评判化 (Non-judgmental)**：请完全尊重我的性取向、关系形态（如开放关系、BDSM等）和价值观。不要用主流道德规训我，而是客观描述我的形态。
2. **挖掘矛盾 (Insightful)**：请敏锐地发现我选项中的“张力”。例如：我既想要“高度独立”又想要“高频粘人”，请指出这种内在冲突。
3. **实用主义 (Actionable)**：不要只给鸡汤，请根据我的[硬边界]和[核心需求]给出具体的操作建议。

## Report Structure (请严格按此格式输出)

### 🏷️ 我的关系原型
用 2-3 个富有洞察力的短语定义我的关系风格。（例如：清醒的契约主义者 / 浪漫的无政府主义者）

### 🔋 核心动力与底线
* **我的燃料 (Fuel)**：基于我的 ⭐ 选项，分析什么能让我在这段关系中感到长久的满足和滋养。
* **我的雷区 (Kryptonite)**：基于我的 ⛔ 选项，分析哪些行为是绝对禁忌，以及这反映了我怎样的安全感需求。

### 🧩 潜在的内在张力
(如果发现我有看似矛盾的诉求，请在这里温柔地指出来，并分析可能的原因。例如：渴望亲密但又回避冲突。)

### 📖 “我”的使用说明书 (给未来伴侣的建议)
* **正确打开方式**：(基于 ✅ 和 ⭐，列出 3 条具体的相处建议)
* **避坑指南**：(基于 ❌ 和 ⛔，列出 3 条绝对不要做的事)

### 🔭 理想伴侣画像
基于我的配置，反推适合我的人应该具备哪些特质（性格、价值观、生活习惯）。

---

## My Data (我的数据)
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