import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Attitude } from '../types'

export const useConfigStore = defineStore('config', () => {
  // --- State ---
  const answers = ref<Record<string, Attitude[]>>({})
  const targetAvatar = ref<string>('🌏');
  const profiles = ref<Record<string, Record<string, Attitude[]>>>({});
  const enabledModules = ref<string[]>(['A'])

  // --- Getters ---

  function getQuestionState(questionId: string): Attitude[] {
    return answers.value[questionId] || [];
  }

  function isModuleEnabled(moduleId: string) {
    return enabledModules.value.includes(moduleId)
  }

  // 判断某个头像是否有存档
  function hasProfileData(avatar: string): boolean {
    const profile = profiles.value[avatar];
    return !!profile && Object.keys(profile).length > 0;
  }

  // ✅ 新增：获取所有存档的统计信息 (用于 Welcome 页展示)
  function getProfileStats() {
    const stats: { avatar: string; count: number }[] = [];
    for (const [avatar, data] of Object.entries(profiles.value)) {
      // 统计该 Profile 下有多少个题目有答案 (数组长度 > 0 且不全是 0)
      let count = 0;
      Object.values(data).forEach(arr => {
        if (arr.some(v => v !== 0)) count++;
      });
      if (count > 0) {
        stats.push({ avatar, count });
      }
    }
    return stats;
  }

  // --- Actions ---

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

    // 实时同步到 profiles
    if (!profiles.value[targetAvatar.value]) {
      profiles.value[targetAvatar.value] = {};
    }
    // 非空断言确保安全
    profiles.value[targetAvatar.value]![questionId] = [...answers.value[questionId]];
  }

  function toggleModule(moduleId: string) {
    if (moduleId === 'A') return;
    const index = enabledModules.value.indexOf(moduleId)
    if (index > -1) {
      enabledModules.value.splice(index, 1)
    } else {
      enabledModules.value.push(moduleId)
    }
  }

  function setAvatar(newAvatar: string) {
    if (newAvatar === targetAvatar.value) return;

    // 1. 存旧
    if (targetAvatar.value) {
      profiles.value[targetAvatar.value] = JSON.parse(JSON.stringify(answers.value));
    }

    // 2. 换人
    targetAvatar.value = newAvatar;

    // 3. 读新
    if (profiles.value[newAvatar]) {
      answers.value = JSON.parse(JSON.stringify(profiles.value[newAvatar]));
    } else {
      answers.value = {};
    }
  }

  function resetCurrentProfile() {
    answers.value = {};
    if (profiles.value[targetAvatar.value]) {
      delete profiles.value[targetAvatar.value];
    }
  }

  function resetAll() {
    answers.value = {}
    profiles.value = {}
    enabledModules.value = ['A'] 
    targetAvatar.value = '🌏'; 
  }

  return {
    answers,
    enabledModules,
    targetAvatar,
    profiles, 
    setAvatar,
    setOptionAttitude,
    getQuestionState,
    toggleModule,
    isModuleEnabled,
    hasProfileData, 
    getProfileStats, // ✅ 记得导出这个新函数
    resetCurrentProfile,
    resetAll
  }
}, {
  persist: true
} as any)