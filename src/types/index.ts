// src/types/index.ts

// 坚定程度：0=未选/跳过, 1=迷茫(问号), 2=意向(普通), 3=坚定(星星)
export type Certainty = 0 | 1 | 2 | 3;

// 单个题目
export interface Question {
  id: string;          // 题目ID，如 "q_01"
  title: string;       // 题目内容
  options: string[];   // 5-6个选项文字的数组
  // 我们不需要在这里存用户的答案，答案存 Pinia 里
}

// 题目模块 (如 "核心内核", "性与欲望")
export interface Module {
  id: string;          // 模块ID，如 "core"
  name: string;        // 模块名
  description: string; // 模块描述
  questions: Question[]; // 该模块下的所有题目
}

// 整个问卷的数据库结构
export interface QuestionDatabase {
  meta: {
    version: string;
    total_questions: number;
  };
  modules: Module[];
}