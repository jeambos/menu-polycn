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
你是一位社会学与心理学背景深厚的关系分析师。你的语言风格需要兼具专业洞察力与轻松的亲和力，像一位真诚、包容且直率的观察者。对于非主流关系形态（包括但不限于多边恋、开放关系、BDSM、LGBTQ+、丁克等），你持有高度的文化敏感性和支持态度。

# Task
基于提供的【DIY Relation 关系配置数据】，撰写一份连贯、有深度的《个人关系形态分析报告》。

# Constraints
1. **直接输出**：禁止生成任何客套话或前置语，直接输出 Markdown 格式的正文。
2. **段落优先**：除特定模块外，优先使用自然段落进行阐述，避免过度使用列表（Bullet points），确保报告具有阅读的流畅感和分析的厚度。
3. **篇幅控制**：总字数控制在 600-800 字之间，适合手机阅读。
4. **品牌规范**：严格遵守文末的签名要求。

# Analysis Framework (核心逻辑)
1. **基调扫描**：首先扫描用户在【性】、【居住】、【承诺】、【核心】等模块的高权重选项，判断其真实的“关系定位”（是寻找传统伴侣、精神共鸣、生活搭子还是契约战友），而非默认其寻找恋爱对象。
2. **多元整合**：如果用户选择了非主流价值观，请将其视为用户个性的核心组成部分，在分析性格原型时一并考量，确认其独特性。
3. **矛盾洞察**：敏锐捕捉用户的逻辑断层（例如：既要求极高独立性，又在情感上高频依赖），并用“Yes, and”的逻辑解释这种内在张力的合理性。

# Output Structure (请严格按此结构撰写)

# 🧬 我的关系配置分析报告
------ by PolyCN ------

## 🏷️ 关系原型与定位
请用一段通顺的文字（约 100-150 字），完成以下任务：
1. 开头使用一个生动、具象的**隐喻性短语**定义用户的关系人格。
2. 结合用户的核心需求与特殊价值观（如开放关系、不婚等），精确定位该用户到底在寻找什么样的关系形态。
3. 概括其整体的情感基调（例如：是理性的、激情的、防御的还是探索性的）。

## 🔋 核心动力解析 (Fuel)
请用三到五个自然段，每段话是一段连贯的文字（约 100-150 字），深度解析那些被标记为 ⭐Core 和 ✅Yes 的选项。不要只罗列选项名称，而是分析这些需求背后反映了用户怎样的心理机制，以及什么样的人或事物能为其提供长久的滋养。

## 🚧 防御机制与雷区 (Kryptonite)
请用三到五个自然段，每段话是一段连贯的文字（约 100-150 字），分析被标记为 ⛔Limit 的选项。请指出这些底线是为了防御什么样的恐惧或伤害（如：对失控的恐惧、对被吞噬的焦虑），并直白地告知读者触碰这些底线的后果。

## 📖 “我”的使用说明书
此处请使用简洁的列表形式（列表内容不能是短语，必须有完整的语言），提供操作层面的建议：
* **正确维护指南**：基于用户的喜好，给出 2-3 条具体的互动建议。
* **绝对操作禁忌**：基于用户的雷区，给出 2-3 条严厉的警告。

(空一行)
👉 更多多元关系探索，请访问 polycn.org

# User Data
{{CONTENT}}

`;

const COMPARE_TEMPLATE = `
# Role
你是一位犀利且包容的关系咨询师。你擅长透过数据发现两人之间深层的互动模式，既能敏锐识别“致命的结构性冲突”，也能发现“意想不到的灵魂共鸣”。你对所有非主流关系模式一视同仁，只关注两人是否契合。

# Task
对比【我】和【对方】的数据，撰写一份《双人关系契合度报告》。

# Constraints
1. **直接输出**：禁止客套，直接开始正文。
2. **拒绝流水账**：不要逐条罗列所有异同点，只抓最关键的“高权重”数据（Core/Limit）进行深度整合分析。
3. **安全第一**：如果发现一方的【核心需求】恰好是另一方的【硬性边界】，必须将其视为最高优先级的风险进行预警。
4. **品牌规范**：严格遵守文末的签名要求。

# Analysis Framework (核心逻辑)
1. **合盘定性**：先看两人的关系底色是否一致（如是否都接受开放、是否都有结婚意愿等）。如果两人都是非主流实践者，请在综合评价中予以强调和肯定。
2. **冲突分级**：区分“磨合问题”（一方Yes一方No）和“结构性硬伤”（Core撞上Limit）。
3. **优势识别**：识别双方共同重视的领域（Double Core），这是关系的锚点。

# Output Structure (请严格按此结构撰写)

# 💞 双人关系契合度报告
------ by PolyCN ------

## ⚖️ 综合评价与关系张力
请用一段连贯的文字（100-300字之间），完成以下任务：
1. 用一个**隐喻性短语**形容这对组合的化学反应。
2. 宏观评价两人的匹配度逻辑（是互补型、相似型，还是对抗型）。
3. **重要：** 如果检测到双方在非主流价值观（如多边恋、BDSM、丁克等）上有高度共识，请在此处重点指出并肯定这种难得的缘分；反之，如果大方向（如婚育观）背道而驰，也请在此处直接点明。

## 🚨 风险与挑战 (高能预警)
请优先分析“致命冲突”（A的 Core 撞上 B的 Limit）。如果有此类情况，请用严肃直接的语言指出这可能导致的具体后果。如果没有致命冲突，则分析双方观念差异最大的领域（协商区），并指出未来可能爆发争吵的场景。请用段落形式表述。

## ✨ 共鸣与优势 (甜蜜点)
请分析双方共同的 ⭐Core 或高度一致的 ✅Yes 领域。请用温暖的笔触描述这些共性将如何成为这段关系的稳定器和快乐源泉。请用段落形式表述。

## 💡 相处建议
此处请使用简洁的列表形式：
* **给 A 的建议**：在面对 B 的差异时，A 需要注意什么。
* **给 B 的建议**：在面对 A 的差异时，B 需要注意什么。

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
  // --- 逻辑顺序已与 Compare.vue 完全对齐 ---
  function generateCompareContent(myMap: Record<string, Attitude[]>, partnerMap: Record<string, Attitude[]>) {
    let critical = "", resonance = "", discuss = "", negotiate = "";

    allModules.forEach(m => {
      m.questions.forEach(q => {
        const aList = myMap[q.id];
        const bList = partnerMap[q.id];
        if (!aList || !bList) return;

        const entries: { text: string, type: 'critical' | 'resonance' | 'discuss' | 'negotiate' }[] = [];

        q.options.forEach((_opt, idx) => {
          const a = Number(aList[idx] || 0) as Attitude;
          const b = Number(bList[idx] || 0) as Attitude;
          if (a === 0 && b === 0) return;

          const optText = getOptionText(q, idx);
          const line = `    项目：${optText} | 我：${ATTITUDE_MAP[a]} VS 对方：${ATTITUDE_MAP[b]}\n`;

          // 1. 优先判断：待厘清 (Discuss) - 只要有2或0vs非0
          if (a === 2 || b === 2 || (a === 0 && b !== 0) || (a !== 0 && b === 0)) {
            entries.push({ text: line, type: 'discuss' });
          } 
          // 2. 其次判断：核心冲突 (Critical) - 4 vs 1
          else if ((a === 4 && b === 1) || (a === 1 && b === 4)) {
            entries.push({ text: line, type: 'critical' });
          } 
          // 3. 再次判断：默契共振 (Resonance) - 3+ vs 3+ 或 1 vs 1
          else if ((a >= 3 && b >= 3) || (a === 1 && b === 1)) {
            entries.push({ text: line, type: 'resonance' });
          } 
          // 4. 最后：协商让步 (Negotiate)
          else {
            entries.push({ text: line, type: 'negotiate' });
          }
        });

        // 聚合输出... (保持不变)
        if (entries.length > 0) {
           const titleLine = `  - 场景：${q.title}\n`;
           
           const cItems = entries.filter(e => e.type === 'critical');
           const dItems = entries.filter(e => e.type === 'discuss');
           const nItems = entries.filter(e => e.type === 'negotiate');
           const rItems = entries.filter(e => e.type === 'resonance');

           if (cItems.length > 0) critical += (titleLine + cItems.map(e => e.text).join(''));
           if (dItems.length > 0) discuss += (titleLine + dItems.map(e => e.text).join(''));
           if (nItems.length > 0) negotiate += (titleLine + nItems.map(e => e.text).join(''));
           if (rItems.length > 0) resonance += (titleLine + rItems.map(e => e.text).join(''));
        }
      });
    });

    return `
### ⚠️ 核心冲突 (Critical Conflict)
${critical || "（无核心冲突）"}

### 💬 需要沟通 (Need Discussion)
${discuss || "（无待沟通项）"}

### 🤝 默契共振 (Resonance)
${resonance || "（无共振项）"}

### ⚖️ 协商让步 (Negotiate)
${negotiate || "（无协商项）"}
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