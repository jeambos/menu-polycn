<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useConfigStore } from '../stores/useConfigStore';
import ModuleCard from '../components/ModuleCard.vue';
import questionsData from '../data/questions.json';
import type { Module } from '../types';
import { AVATARS } from '../logic/codec';

const router = useRouter();
const store = useConfigStore();
const modules = questionsData.modules as Module[];

// --- 套餐定义 (映射你的 5 种场景) ---
const PRESETS: Record<string, string[]> = {
  'custom': [], 
  // 1. 新手练习: 只做核心 A
  'practice': ['A'], 
  // 2. 全面测试: A-J 全选
  'all': ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'], 
  // 3. 身体/激情: 核心+浪漫+性+边界+BDSM
  'passion': ['A', 'B', 'C', 'D', 'E'], 
  // 4. 长期朋友: 核心+边界+生活+活动+价值+财富
  'friend': ['A', 'D', 'F', 'G', 'H', 'I'], 
  // 5. 日常玩伴: 核心+边界+活动+价值
  'playmate': ['A', 'D', 'G', 'H'] 
};

// 默认选中“新手练习”
const currentPreset = ref('practice');

// 代理 Store 里的头像
const currentAvatar = computed({
  get: () => store.targetAvatar,
  set: (val) => store.setAvatar(val)
});

// 应用套餐逻辑
function applyPreset(key: string) {
  currentPreset.value = key;
  if (key === 'custom') return;

  const targetIds = PRESETS[key];
  if (!targetIds) return; 
  
  // 1. 先重置：只保留 Core (A) 或者完全清空？
  // 你的需求是：套餐1兼具一键清除功能。
  // 所以逻辑是：先清空所有，然后根据 targetIds 逐个开启。
  
  // 先把 enabledModules 清空，或者重置为 targetIds 的第一个?
  // 简单粗暴的做法：直接赋值 (Store 需要支持直接赋值会更方便，但 toggle 也可以)
  
  // 比较稳妥的做法：
  // 1. 获取当前所有开启的
  const currentEnabled = [...store.enabledModules];
  // 2. 关掉所有不在 targetIds 里的 (除了 A, A 永远开启)
  currentEnabled.forEach(id => {
    if (!targetIds.includes(id) && id !== 'A') {
      store.toggleModule(id);
    }
  });
  // 3. 开启所有在 targetIds 里的
  targetIds.forEach(id => {
    if (!store.isModuleEnabled(id)) {
      store.toggleModule(id);
    }
  });
}

// 手动切换处理
function handleManualToggle(moduleId: string, val: boolean) {
  // A 模块 (Core) 不允许关闭
  if (moduleId === 'A' && !val) return;

  if (val) {
    if (!store.isModuleEnabled(moduleId)) store.toggleModule(moduleId);
  } else {
    if (store.isModuleEnabled(moduleId)) store.toggleModule(moduleId);
  }
  currentPreset.value = 'custom'; // 切回自定义
}

// 统计题目总数
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
        这套配置是针对谁的？选一个头像代表 Ta
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
        选择场景套餐
      </h2>
      
      <div class="tabs tabs-boxed bg-base-200 p-1 mb-6 overflow-x-auto flex-nowrap justify-start sm:justify-center no-scrollbar">
        <a class="tab transition-all duration-200 whitespace-nowrap" :class="{ 'tab-active': currentPreset === 'practice' }" @click="applyPreset('practice')">🌱 新手练习</a>
        <a class="tab transition-all duration-200 whitespace-nowrap" :class="{ 'tab-active': currentPreset === 'all' }" @click="applyPreset('all')">❤️ 全面测试</a>
        <a class="tab transition-all duration-200 whitespace-nowrap" :class="{ 'tab-active': currentPreset === 'passion' }" @click="applyPreset('passion')">🔥 激情导向</a>
        <a class="tab transition-all duration-200 whitespace-nowrap" :class="{ 'tab-active': currentPreset === 'friend' }" @click="applyPreset('friend')">🤝 长期朋友</a>
        <a class="tab transition-all duration-200 whitespace-nowrap" :class="{ 'tab-active': currentPreset === 'playmate' }" @click="applyPreset('playmate')">🏸 日常玩伴</a>
        <a class="tab transition-all duration-200 whitespace-nowrap" :class="{ 'tab-active': currentPreset === 'custom' }" @click="applyPreset('custom')">🔧 自定义</a>
      </div>
    </div>

    <div class="space-y-4">
      <ModuleCard
        v-for="mod in modules"
        :key="mod.id"
        :module="mod"
        :model-value="store.isModuleEnabled(mod.id)"
        :disabled="mod.id === 'A'" 
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
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>