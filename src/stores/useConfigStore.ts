import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Attitude } from '../types'

export const useConfigStore = defineStore('config', () => {
  // --- State ---
  const answers = ref<Record<string, Attitude[]>>({})
  const targetAvatar = ref<string>('🌏');
  const profiles = ref<Record<string, Record<string, Attitude[]>>>({});
  const enabledModules = ref<string[]>(['A'])

  // --- Persistence Helper (放在最前面，确保都能访问) ---
  function saveState() {
    localStorage.setItem('poly_answers', JSON.stringify(answers.value));
    localStorage.setItem('poly_modules', JSON.stringify(enabledModules.value));
    localStorage.setItem('poly_avatar', targetAvatar.value);
    localStorage.setItem('poly_profiles', JSON.stringify(profiles.value));
  }

  // --- Getters ---

  function getQuestionState(questionId: string): Attitude[] {
    return answers.value[questionId] || [];
  }

  function isModuleEnabled(moduleId: string) {
    return enabledModules.value.includes(moduleId)
  }

  function hasProfileData(avatar: string): boolean {
    const profile = profiles.value[avatar];
    return !!profile && Object.keys(profile).length > 0;
  }

  function getProfileStats() {
    const stats: { avatar: string; count: number }[] = [];
    for (const [avatar, data] of Object.entries(profiles.value)) {
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
    
    // Core (4) 互斥逻辑已移除，允许同题多选核心需求

    answers.value[questionId][optionIndex] = attitude;

    // 实时同步到 profiles
    if (!profiles.value[targetAvatar.value]) {
      profiles.value[targetAvatar.value] = {};
    }
    profiles.value[targetAvatar.value]![questionId] = [...answers.value[questionId]];
    
    saveState(); // 每次修改都保存
  }

  function toggleModule(moduleId: string) {
    if (moduleId === 'A') return;
    const index = enabledModules.value.indexOf(moduleId)
    if (index > -1) {
      enabledModules.value.splice(index, 1)
    } else {
      enabledModules.value.push(moduleId)
    }
    saveState();
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
    saveState();
  }

  function resetCurrentProfile() {
    answers.value = {};
    if (profiles.value[targetAvatar.value]) {
      delete profiles.value[targetAvatar.value];
    }
    saveState();
  }

  function resetAll() {
    answers.value = {}
    profiles.value = {}
    enabledModules.value = ['A'] 
    targetAvatar.value = '🌏'; 
    saveState();
  }

  // ✅ 新增：删除指定存档
  function deleteProfile(avatar: string) {
    if (profiles.value[avatar]) {
      delete profiles.value[avatar];
      saveState(); // 现在能找到了
    }
  }

  // 初始化加载
  function loadState() {
    const savedAnswers = localStorage.getItem('poly_answers');
    if (savedAnswers) answers.value = JSON.parse(savedAnswers);

    const savedModules = localStorage.getItem('poly_modules');
    if (savedModules) enabledModules.value = JSON.parse(savedModules);

    const savedAvatar = localStorage.getItem('poly_avatar');
    if (savedAvatar) targetAvatar.value = savedAvatar;

    const savedProfiles = localStorage.getItem('poly_profiles');
    if (savedProfiles) profiles.value = JSON.parse(savedProfiles);
  }

  loadState();

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
    getProfileStats,
    resetCurrentProfile,
    resetAll,
    deleteProfile // ✅ 导出
  }
}, {
  persist: true
} as any)