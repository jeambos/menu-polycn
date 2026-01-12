// src/types/index.ts

// 0=未选(N/A), 1=拒绝(Hard No), 2=迷茫(Soft), 3=同意(Yes), 4=核心(Core)
export type Attitude = 0 | 1 | 2 | 3 | 4;

export interface Question {
  id: string;
  title: string;
  options: string[]; // 选项列表
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