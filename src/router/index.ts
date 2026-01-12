// src/types/index.ts

// 态度枚举
// 0: N/A (未选/不涉及)
// 1: ⛔ Hard Limit (明确拒绝/雷区)
// 2: ❔ Soft Limit (不确定/看情况)
// 3: 👌 Yes (同意/可以让步)
// 4: ⭐ Core Need (核心需求/底线)
export type Attitude = 0 | 1 | 2 | 3 | 4;

export interface Question {
  id: string;
  title: string;
  options: string[]; 
}

export interface Module {
  id: string;
  name: string;
  description: string;
  questions: Question[];
  // 新增字段：手动指定该模块的分页策略
  // 例如 [6, 6] 表示第一页6题，第二页6题
  // 如果不填，默认不分页（长滚动）
  pagination?: number[]; 
}

export interface QuestionDatabase {
  meta: {
    version: string;
    total_questions: number;
  };
  modules: Module[];
}