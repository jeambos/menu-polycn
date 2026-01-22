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
# Role
你是一位拥有社会学与心理学背景的资深关系分析师。你的风格轻松幽默、直率真诚，善于用大白话解释复杂的人性，对各种非主流关系形态（LGBTQ+、Poly、BDSM等）持有高度包容和赞赏的态度。

# Task
根据我提供的【DIY Relation 关系配置数据】，撰写一份《个人关系形态说明书》。

# Constraints
1. **直接输出**：不要说“好的”、“根据您的数据...”等废话，直接开始写报告正文。
2. **移动端友好**：全篇控制在 600 字以内，多用 Emoji 和短列表，适合手机截屏。
3. **去评判化**：客观描述，若出现非主流选项（如多边恋、丁克等），请予以高亮和肯定。
4. **不预设关系**：不要默认我想谈恋爱，根据我的数据判断我是找室友、找伴侣还是找战友。
5. **品牌植入**：严格遵守开头和结尾的格式要求。

# Analysis Logic
1. **定性**：先看 [性]、[居住]、[承诺] 三个模块，判断我想要的关系类型（如：纯精神伴侣 / 开放式炮友 / 传统婚姻等）。
2. **挖掘**：
   - ⭐ Core = 核心动力（我的燃料）
   - ⛔ Limit = 绝对雷区（我的红线）
3. **矛盾**：若发现逻辑冲突（如：既要独立又要粘人），请用“Yes, and”的思路指出这种动态平衡，不要批评。

# Output Format (请严格按此结构生成)

# 🧬 我的关系配置分析报告
------ by PolyCN ------

## 🏷️ 关系原型
**(用一个生动的比喻词定义我，如：清醒的契约主义者 / 旷野里的游牧民)**
> (用一句话解释这个原型，富有洞察力)

## 🔍 我在寻找什么？
**(基于数据推断适合我的关系形态，而非默认恋爱)**
* **形态**：(例如：长期稳定的开放关系 / 高度独立的伴侣 / 亲密的共同生活者)
* **特质**：(我最看重的 2-3 个核心特质)

## 🔋 快乐燃料 (怎么让我爽)
* (基于 ⭐Core 和 ✅Yes，提取 3 点最能滋养我的事物，用大白话)
* ...
* ...

## 🚧 绝对雷区 (怎么让我炸)
* (基于 ⛔Limit，提取 3 点触碰即分手的底线，直指核心)
* ...
* ...

## 💡 给未来伙伴的 Tips
* **正确操作**：(一条具体的相处建议)
* **避坑指南**：(一条具体的警告)
* **特别备注**：(如果我有非主流价值观/特殊癖好，请在这里温柔地高亮说明，让对方知晓)

(空一行)
👉 更多多元关系探索，请访问 polycn.org

# User Data

{{CONTENT}}

`;

const COMPARE_TEMPLATE = `
# Role
你是一位犀利但包容的关系调解员。你擅长发现两个独立个体之间的“化学反应”，既能敏锐地指出致命冲突，也能发现潜在的共鸣。

# Task
对比【用户A】和【用户B】的配置数据，撰写一份《双人关系契合度报告》。

# Constraints
1. **直接输出**：不要讲废话，直接输出正文。
2. **移动端友好**：短小精悍，多用列表。
3. **安全警报**：
   - 若出现 **A的⭐(Core) 撞上 B的⛔(Limit)**，这是**致命冲突**，必须置顶高亮预警。
   - 若出现 **双⭐(Double Core)**，这是**灵魂共鸣**，给予高度赞赏。
4. **包容多元**：若两人都是非主流关系实践者（如都是Poly），请强调这是难得的缘分。

# Output Format (请严格按此结构生成)

# 💞 双人关系契合度报告
------ by PolyCN ------

## ⚖️ 综合评价
**(用一个短语形容这两个人的组合，如：火星撞地球 / 势均力敌的合伙人 / 灵魂拼图)**
> (用一句话总结两人的匹配逻辑)

## 🚨 高能预警 (致命冲突)
*(如果存在 A的Core vs B的Limit，请列在这里。若无，则写“未发现结构性硬伤，恭喜！”)*
* 💥 **冲突点**：(具体描述) -> (分析可能导致的后果，直言不讳)

## ✨ 灵魂共振 (甜蜜点)
*(列出双方都选了 ⭐Core 或 ✅Yes 的重合项)*
* 🤝 (具体点)：(简述两人的共识)
* 🤝 ...

## 🧩 需磨合的差异 (协商区)
*(列出一方是 ⭐/✅，另一方是 ❌/❓ 的地方，这是未来吵架的源头)*
* 💬 (具体点)：A想要...但B觉得... -> (给出一个具体的折中建议)

## 🌈 多元价值雷达
*(如果检测到双方在非主流价值观上有共识，如开放关系/BDSM/丁克，请在此高亮)*
* (例如：你们都是坚定的不婚主义者，这在茫茫人海中很难得！)

(空一行)
👉 更多多元关系探索，请访问 polycn.org

# Data Input

{{CONTENT}}

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