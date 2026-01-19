import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Attitude } from '../types'

export const useConfigStore = defineStore('config', () => {
  // Key: 题目ID, Value: 态度数组
  const answers = ref<Record<string, Attitude[]>>({})
  const enabledModules = ref<string[]>(['core'])
  
  // ✅ 修改：默认初始化为地球
  const targetAvatar = ref<string>('🌏');

  // 设置某个选项的态度
  function setOptionAttitude(questionId: string, optionIndex: number, attitude: Attitude) {
    if (!answers.value[questionId]) {
      answers.value[questionId] = [];
    }
    
    // Core (4) 互斥逻辑
    if (attitude === 4) {
      const currentOpts = answers.value[questionId];
      for (let i = 0; i < currentOpts.length; i++) {
        if (currentOpts[i] === 4) {
           currentOpts[i] = 3; 
        }
      }
    }
    answers.value[questionId][optionIndex] = attitude;
  }

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

  // ✅ 新增：设置头像的方法
  function setAvatar(emoji: string) {
    targetAvatar.value = emoji;
  }

  function resetAll() {
    answers.value = {}
    enabledModules.value = ['A'] // 假设你要默认 A
    targetAvatar.value = '🌏'; // ✅ 重置时也恢复为地球
  }

  return {
    answers,
    enabledModules,
    targetAvatar, // 导出
    setAvatar,    // 导出
    setOptionAttitude,
    getQuestionState,
    toggleModule,
    isModuleEnabled,
    resetAll
  }
})