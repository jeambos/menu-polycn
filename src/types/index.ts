// src/types/index.ts

export type Attitude = 0 | 1 | 2 | 3 | 4;

// ✅ 新增：选项的结构（长文案 + 短标签）
export interface OptionItem {
  long: string;  // 做题时显示的详细描述
  short: string; // 结果页显示的简短标签
}

export interface Question {
  id: string;
  title: string;       // 兼容旧代码，对应 title_short
  title_long: string;  // 新增：做题用
  title_short: string; // 新增：结果用
  // ✅ 关键修改：选项改为对象数组
  // 为了兼容过渡期，这里允许它是 string 或 OptionItem
  description?: string;
  options: (string | OptionItem)[]; 
}

export interface Module {
  id: string;
  name: string;
  description: string;
  questions: Question[];
}

// ✅ 这是一个好习惯：保留根类型，描述整个 JSON 文件
export interface QuestionDatabase {
  modules: Module[];
}