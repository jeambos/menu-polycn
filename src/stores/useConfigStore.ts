// src/stores/useConfigStore.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Attitude } from '../types'

export const useConfigStore = defineStore('config', () => {
  // Key: 题目ID
  // Value: 数组，对应每个选项的态度。例如 [0, 1, 3, 4, 0]
  const answers = ref<Record<string, Attitude[]>>({})
  
  const enabledModules = ref<string[]>(['core'])

  // 设置某个选项的态度
  function setOptionAttitude(questionId: string, optionIndex: number, attitude: Attitude) {
    // 1. 初始化数组 (如果还没做过这题)
    if (!answers.value[questionId]) {
      answers.value[questionId] = [];
    }
    
    // 2. 互斥逻辑：一道题只能有一个 Core (4)
    if (attitude === 4) {
      const currentOpts = answers.value[questionId];
      // 遍历该题所有选项，把旧的 4 降级为 3
      for (let i = 0; i < currentOpts.length; i++) {
        if (currentOpts[i] === 4) {
           currentOpts[i] = 3; 
        }
      }
    }

    // 3. 写入新状态
    // 注意：我们要确保数组长度足够，防止跳跃赋值
    // 虽然 options 长度固定，但 JS 数组可以直接赋值
    answers.value[questionId][optionIndex] = attitude;
  }

  // 获取某题的所有选项状态
  function getQuestionState(questionId: string): Attitude[] {
    return answers.value[questionId] || [];
  }

  function toggleModule(moduleId: string) {
    const index = enabledModules.value.indexOf(moduleId)
    if (index > -1) {
      enabledModules.value.splice(index, 1)
    } else {
      enabledModules.value.push(moduleId)
    }
  }

  function isModuleEnabled(moduleId: string) {
    return enabledModules.value.includes(moduleId)
  }

  function resetAll() {
    answers.value = {}
    enabledModules.value = ['core']
  }

  return {
    answers,
    enabledModules,
    setOptionAttitude,
    getQuestionState,
    toggleModule,
    isModuleEnabled,
    resetAll
  }
})