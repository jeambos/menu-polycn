// src/stores/useConfigStore.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Certainty } from '../types' // 引入我们定义的类型

// 定义单题答案的结构
interface AnswerRecord {
  optionIndex: number; // 选了第几个选项 (0-5)
  certainty: Certainty; // 坚定度 (1-3)
}

export const useConfigStore = defineStore('config', () => {
  // --- STATE (数据状态) ---

  // 1. 用户的答案字典
  // Key是题目ID (如 "q_01"), Value是答案对象
  const answers = ref<Record<string, AnswerRecord>>({})

  // 2. 启用的模块ID列表
  // 默认启用 'core'，其他可选
  const enabledModules = ref<string[]>(['core'])

  // --- ACTIONS (操作方法) ---

  // 设置答案
  // 就像是数据库的 UPDATE 操作
  function setAnswer(questionId: string, optionIndex: number, certainty: Certainty) {
    // 如果 certainty 为 0 (未选)，我们依然记录，或者你可以选择 delete 删除
    answers.value[questionId] = {
      optionIndex,
      certainty
    }
  }

  // 获取某一题的答案 (方便组件回显)
  function getAnswer(questionId: string) {
    return answers.value[questionId]
  }

  // 切换模块开关
  function toggleModule(moduleId: string) {
    const index = enabledModules.value.indexOf(moduleId)
    if (index > -1) {
      // 存在则删除 (关)
      enabledModules.value.splice(index, 1)
    } else {
      // 不存在则添加 (开)
      enabledModules.value.push(moduleId)
    }
  }

  // 判断模块是否开启
  function isModuleEnabled(moduleId: string) {
    return enabledModules.value.includes(moduleId)
  }

  // 重置所有 (用于清空重来)
  function resetAll() {
    answers.value = {}
    enabledModules.value = ['core'] // 核心模块默认保留
  }

  // --- RETURN (导出给组件用) ---
  return {
    answers,
    enabledModules,
    setAnswer,
    getAnswer,
    toggleModule,
    isModuleEnabled,
    resetAll
  }
})