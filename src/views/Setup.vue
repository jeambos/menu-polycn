<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useConfigStore } from '../stores/useConfigStore';
import ModuleCard from '../components/ModuleCard.vue';
import questionsData from '../data/questions.json';
import type { Module } from '../types';

const router = useRouter();
const store = useConfigStore();
const modules = questionsData.modules as Module[];

// --- 套餐定义 ---
const PRESETS: Record<string, string[]> = {
  'custom': [], // 自定义模式（占位）
  'all': modules.map(m => m.id), // 全选 (深度伴侣)
  'fwb': ['core', 'sex_desire', 'boundaries'], // 炮友: 核心+性+边界
  'friend': ['core', 'boundaries', 'values', 'activity'], // 挚友: 核心+边界+三观+活动
  'platonic': ['core', 'romance', 'values', 'living', 'assets'] // 柏拉图: 无性+生活+资产
};

// 当前选中的套餐 (默认自定义，或者根据当前选中项反推? 简单起见默认自定义)
const currentPreset = ref('custom');

// 应用套餐逻辑
function applyPreset(key: string) {
  currentPreset.value = key;
  if (key === 'custom') return;

  const targetIds = PRESETS[key];
  
  // ✅ 新增这一行：如果取不到套餐数据，直接返回，不再往下执行
  if (!targetIds) return; 
  
  // 1. 先清空所有
  store.enabledModules = ['core']; 
  
  // 2. 逐个添加
  targetIds.forEach(id => {
    if (!store.isModuleEnabled(id)) {
      store.toggleModule(id);
    }
  });
}

// 监听手动开关：如果用户手动动了开关，就变成“自定义”模式
function handleManualToggle(moduleId: string) {
  store.toggleModule(moduleId);
  currentPreset.value = 'custom';
}

// 计算统计
const totalQuestions = computed(() => {
  return modules
    .filter(m => store.isModuleEnabled(m.id))
    .reduce((sum, m) => sum + m.questions.length, 0);
});

function startQuiz() {
  router.push('/quiz');
}
</script>

<template>
  <div class="pb-24">
    <div class="mb-6">
      <h2 class="text-2xl font-bold">配置关系模式</h2>
      <p class="opacity-60 text-sm mt-1">选择一个预设套餐，或自由组装。</p>
    </div>

    <div class="tabs tabs-boxed bg-base-200 p-1 mb-6 overflow-x-auto flex-nowrap justify-start sm:justify-center">
      <a 
        class="tab transition-all duration-200"
        :class="{ 'tab-active': currentPreset === 'all' }"
        @click="applyPreset('all')"
      >❤️ 深度伴侣</a>
      <a 
        class="tab transition-all duration-200"
        :class="{ 'tab-active': currentPreset === 'fwb' }"
        @click="applyPreset('fwb')"
      >🔥 炮友</a>
      <a 
        class="tab transition-all duration-200"
        :class="{ 'tab-active': currentPreset === 'friend' }"
        @click="applyPreset('friend')"
      >🤝 挚友</a>
      <a 
        class="tab transition-all duration-200"
        :class="{ 'tab-active': currentPreset === 'custom' }"
        @click="applyPreset('custom')"
      >🔧 自定义</a>
    </div>

    <div class="space-y-4">
      <ModuleCard
        v-for="mod in modules"
        :key="mod.id"
        :module="mod"
        :model-value="store.isModuleEnabled(mod.id)"
        @update:model-value="(val) => handleManualToggle(mod.id, val)"
      />
    </div>

    <div class="fixed bottom-0 left-0 right-0 p-4 bg-base-100/80 backdrop-blur-md border-t border-base-content/10 flex justify-center z-20 safe-area-bottom">
      <button @click="startQuiz" class="btn btn-primary w-full max-w-md shadow-lg text-lg animate-pulse hover:animate-none">
        进入答题 ({{ totalQuestions }}题) 🚀
      </button>
    </div>
  </div>
</template>

<style scoped>
/* 适配一下 iPhone底部的安全距离 */
.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom, 20px);
}
</style>