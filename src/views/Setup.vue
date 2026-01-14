<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useConfigStore } from '../stores/useConfigStore';
import ModuleCard from '../components/ModuleCard.vue';
import questionsData from '../data/questions.json';
import type { Module } from '../types';
// ✅ 引入头像列表
import { AVATARS } from '../logic/codec';

const router = useRouter();
const store = useConfigStore();
const modules = questionsData.modules as Module[];

// --- 套餐定义 ---
const PRESETS: Record<string, string[]> = {
  'custom': [], 
  'all': modules.map(m => m.id), 
  'fwb': ['core', 'sex_desire', 'boundaries'], 
  'friend': ['core', 'boundaries', 'values', 'activity'], 
  'platonic': ['core', 'romance', 'values', 'living', 'assets'] 
};

const currentPreset = ref('custom');

// ✅ 代理 Store 里的头像，方便页面操作
const currentAvatar = computed({
  get: () => store.targetAvatar,
  set: (val) => store.setAvatar(val)
});

function applyPreset(key: string) {
  currentPreset.value = key;
  if (key === 'custom') return;

  const targetIds = PRESETS[key];
  if (!targetIds) return; 
  
  store.enabledModules = ['core']; 
  targetIds.forEach(id => {
    if (!store.isModuleEnabled(id)) {
      store.toggleModule(id);
    }
  });
}

// 保持你修复后的双参数逻辑
function handleManualToggle(moduleId: string, val: boolean) {
  if (val) {
    if (!store.isModuleEnabled(moduleId)) store.toggleModule(moduleId);
  } else {
    if (store.isModuleEnabled(moduleId)) store.toggleModule(moduleId);
  }
  currentPreset.value = 'custom'; // 手动操作后切回自定义
}

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
  <div class="pb-24 pt-2">
    
    <div class="mb-8 bg-base-200/50 rounded-xl p-4 border border-base-content/5">
      <h2 class="text-sm font-bold opacity-60 mb-3 uppercase tracking-wider flex items-center gap-2">
        <span class="badge badge-primary badge-xs">STEP 1</span>
        设置假想对象
      </h2>
      <p class="text-xs opacity-50 mb-4">
        这套配置是针对谁的？选一个头像代表 Ta (不涉及真实姓名)
      </p>
      
      <div class="flex flex-wrap gap-3 justify-center">
        <button 
          v-for="emoji in AVATARS" 
          :key="emoji"
          @click="currentAvatar = emoji"
          class="btn btn-circle btn-lg text-2xl transition-all duration-200 border-2"
          :class="currentAvatar === emoji ? 'btn-primary scale-110 shadow-lg border-primary' : 'btn-ghost border-transparent opacity-40 grayscale hover:grayscale-0'"
        >
          {{ emoji }}
        </button>
      </div>
    </div>

    <div class="mb-6">
      <h2 class="text-sm font-bold opacity-60 mb-3 uppercase tracking-wider flex items-center gap-2">
        <span class="badge badge-primary badge-xs">STEP 2</span>
        选择配置模块
      </h2>
      
      <div class="tabs tabs-boxed bg-base-200 p-1 mb-6 overflow-x-auto flex-nowrap justify-start sm:justify-center">
        <a class="tab transition-all duration-200" :class="{ 'tab-active': currentPreset === 'all' }" @click="applyPreset('all')">❤️ 深度伴侣</a>
        <a class="tab transition-all duration-200" :class="{ 'tab-active': currentPreset === 'fwb' }" @click="applyPreset('fwb')">🔥 炮友</a>
        <a class="tab transition-all duration-200" :class="{ 'tab-active': currentPreset === 'friend' }" @click="applyPreset('friend')">🤝 挚友</a>
        <a class="tab transition-all duration-200" :class="{ 'tab-active': currentPreset === 'custom' }" @click="applyPreset('custom')">🔧 自定义</a>
      </div>
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
.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom, 20px);
}
</style>