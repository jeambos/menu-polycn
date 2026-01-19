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

// --- 套餐定义 ---
const PRESETS: Record<string, string[]> = {
  // 1. 新手练习: A
  'practice': ['A'], 
  // 2. 全面测试: A-J 全选
  'all': ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'], 
  // 3. 身体/激情: A+B+C+D+E
  'passion': ['A', 'B', 'C', 'D', 'E'], 
  // 4. 长期朋友: A+D+F+G+H+I
  'friend': ['A', 'D', 'F', 'G', 'H', 'I'], 
  // 5. 日常玩伴: A+D+G+H
  'playmate': ['A', 'D', 'G', 'H'] 
};

// --- 实时高亮逻辑 ---
// 计算当前选中的状态最符合哪个套餐
const activePresetKey = computed(() => {
  const currentIds = [...store.enabledModules].sort();
  
  // 遍历所有套餐进行比对
  for (const [key, presetIds] of Object.entries(PRESETS)) {
    const sortedPreset = [...presetIds].sort();
    if (JSON.stringify(currentIds) === JSON.stringify(sortedPreset)) {
      return key;
    }
  }
  return 'custom'; // 都不匹配则为自定义
});

// 应用套餐
function applyPreset(key: string) {
  if (key === 'custom') return;
  const targetIds = PRESETS[key];
  if (!targetIds) return; 
  
  // 逻辑：先开启 targetIds 里的，再关闭不在 targetIds 里的 (除了 A)
  targetIds.forEach(id => {
    if (!store.isModuleEnabled(id)) store.toggleModule(id);
  });
  
  // 反向检查，关闭多余的
  [...store.enabledModules].forEach(id => {
    if (!targetIds.includes(id) && id !== 'A') {
      store.toggleModule(id);
    }
  });
}

// 手动切换
function handleManualToggle(moduleId: string, val: boolean) {
  if (moduleId === 'A' && !val) return; // A 不可关
  if (val && !store.isModuleEnabled(moduleId)) store.toggleModule(moduleId);
  if (!val && store.isModuleEnabled(moduleId)) store.toggleModule(moduleId);
}

// --- 头像逻辑 (4+1 模式) ---
const DEFAULT_AVATAR = '🌏';
const FIXED_AVATARS = ['🦊', '🐰', '🐱']; // 固定显示的快捷头像
const showAvatarModal = ref(false);

// 代理 Store 头像
const currentAvatar = computed({
  get: () => store.targetAvatar || DEFAULT_AVATAR,
  set: (val) => store.setAvatar(val)
});


function handleAvatarClick(emoji: string) {
  if (currentAvatar.value === emoji) {
    // 反选逻辑：如果点的是当前选中的，重置回地球
    currentAvatar.value = DEFAULT_AVATAR;
  } else {
    currentAvatar.value = emoji;
  }
}

// 统计
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
        这套配置是针对谁的？选一个头像代表 Ta。如无，请保持默认。
      </p>
      
      <div class="flex items-center justify-center gap-3">
        <button 
          @click="handleAvatarClick(currentAvatar)"
          class="btn btn-circle btn-lg text-4xl border-4 border-primary shadow-lg bg-base-100"
        >
          {{ currentAvatar }}
        </button>
        
        <div class="w-px h-8 bg-base-content/10 mx-1"></div>

        <button 
          v-for="emoji in FIXED_AVATARS" 
          :key="emoji"
          @click="handleAvatarClick(emoji)"
          class="btn btn-circle btn-lg text-2xl bg-base-100 border-base-200 hover:border-primary/50"
        >
          {{ emoji }}
        </button>

        <button 
          @click="showAvatarModal = true"
          class="btn btn-circle btn-lg bg-base-100 border-base-200 font-bold text-xl"
        >
          •••
        </button>
      </div>
    </div>

    <dialog class="modal modal-bottom sm:modal-middle" :class="{ 'modal-open': showAvatarModal }">
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4 text-center">选择一个头像</h3>
        <div class="grid grid-cols-5 gap-3 justify-items-center">
          <button 
            v-for="emoji in AVATARS" 
            :key="emoji"
            @click="handleAvatarClick(emoji); showAvatarModal = false"
            class="btn btn-circle text-2xl border-2"
            :class="currentAvatar === emoji ? 'btn-primary border-primary' : 'btn-ghost border-transparent'"
          >
            {{ emoji }}
          </button>
        </div>
        <form method="dialog" class="modal-backdrop mt-6">
          <button class="btn btn-ghost w-full" @click="showAvatarModal = false">取消</button>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="showAvatarModal = false">close</button>
      </form>
    </dialog>

    <div class="mb-6">
      <h2 class="text-sm font-bold opacity-60 mb-3 uppercase tracking-wider flex items-center gap-2">
        <span class="badge badge-primary badge-xs">STEP 2</span>
        选择场景套餐
      </h2>
      
      <div class="tabs tabs-boxed bg-base-200 p-1 mb-6 overflow-x-auto flex-nowrap justify-start sm:justify-center no-scrollbar">
        <a class="tab transition-all duration-200 whitespace-nowrap" :class="{ 'tab-active': activePresetKey === 'practice' }" @click="applyPreset('practice')">🌱 新手练习</a>
        <a class="tab transition-all duration-200 whitespace-nowrap" :class="{ 'tab-active': activePresetKey === 'all' }" @click="applyPreset('all')">❤️ 全面测试</a>
        <a class="tab transition-all duration-200 whitespace-nowrap" :class="{ 'tab-active': activePresetKey === 'passion' }" @click="applyPreset('passion')">🔥 激情导向</a>
        <a class="tab transition-all duration-200 whitespace-nowrap" :class="{ 'tab-active': activePresetKey === 'friend' }" @click="applyPreset('friend')">🤝 长期朋友</a>
        <a class="tab transition-all duration-200 whitespace-nowrap" :class="{ 'tab-active': activePresetKey === 'playmate' }" @click="applyPreset('playmate')">🏸 日常玩伴</a>
        <a class="tab transition-all duration-200 whitespace-nowrap" :class="{ 'tab-active': activePresetKey === 'custom' }">🔧 自定义</a>
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