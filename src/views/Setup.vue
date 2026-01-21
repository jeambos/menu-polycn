<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useClipboard } from '@vueuse/core';
import { useConfigStore } from '../stores/useConfigStore';
import ModuleCard from '../components/ModuleCard.vue';
import questionsData from '../data/questions.json';
import { AVATARS, encode } from '../logic/codec';
import type { Module } from '../types';

// --- 类型定义 ---
type PresetKey = 'practice' | 'all' | 'passion' | 'friend' | 'playmate' | 'custom';

const router = useRouter();
const store = useConfigStore();
const { copy, copied } = useClipboard();
const modules = questionsData.modules as Module[];

// --- 状态管理 ---
const showManageModal = ref(false);
const showDeleteAllConfirm = ref(false);
const isAvatarExpanded = ref(false); // 控制头像展开/收起

// --- 头像逻辑 (Persona Picker) ---
const DEFAULT_AVATAR = '🌏';
const allAvatars = AVATARS; 

const currentAvatar = computed({
  get: () => store.targetAvatar || DEFAULT_AVATAR,
  set: (val: string) => store.setAvatar(val)
});

// 计算当前显示的头像列表
const visibleAvatars = computed(() => {
  if (isAvatarExpanded.value) return allAvatars;

  // 智能行显示逻辑
  const currentIndex = allAvatars.indexOf(currentAvatar.value);
  const safeIndex = currentIndex === -1 ? 0 : currentIndex;
  const itemsPerRow = 5;
  const rowIndex = Math.floor(safeIndex / itemsPerRow);
  const start = rowIndex * itemsPerRow;
  return allAvatars.slice(start, start + itemsPerRow);
});

function handleAvatarSelect(avatar: string) {
  store.setAvatar(avatar);
  isAvatarExpanded.value = false; // 选中后自动收起
}

// 点击卡片空白处展开
function handleCardClick() {
  if (!isAvatarExpanded.value) {
    isAvatarExpanded.value = true;
  }
}

// 切换展开/收起
function toggleExpand() {
  isAvatarExpanded.value = !isAvatarExpanded.value;
}

// 获取当前对象的答题数量
const answeredCount = computed(() => {
  // 假设 store.answers 存储的是当前 profile 的答案
  return Object.keys(store.answers).length;
});

// --- 套餐逻辑 (Presets) ---
const PRESET_ORDER: PresetKey[] = ['practice', 'all', 'passion', 'friend', 'playmate', 'custom'];
const PRESETS: Record<Exclude<PresetKey, 'custom'>, string[]> = {
  'practice': ['A'],
  'all': ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'],
  'passion': ['A', 'B', 'C', 'D', 'E'],
  'friend': ['A', 'D', 'F', 'G', 'H', 'I'],
  'playmate': ['A', 'D', 'G', 'H']
};
const PRESET_LABELS: Record<PresetKey, string> = {
  'practice': '🌱 新手练习',
  'all': '❤️ 全面测试',
  'passion': '🔥 激情导向',
  'friend': '🤝 长期朋友',
  'playmate': '🏸 日常玩伴',
  'custom': '🔧 自定义'
};

const activePresetKey = computed<PresetKey>(() => {
  const currentIds = [...store.enabledModules].sort().join(',');
  for (const [key, ids] of Object.entries(PRESETS)) {
    if ([...ids].sort().join(',') === currentIds) return key as PresetKey;
  }
  return 'custom';
});

function applyPreset(key: PresetKey) {
  if (key === 'custom') return;
  const targetIds = PRESETS[key as Exclude<PresetKey, 'custom'>];
  store.enabledModules = [...targetIds];
  if (!store.isModuleEnabled('A')) store.toggleModule('A');
}

// --- 模块逻辑 ---
function handleManualToggle(moduleId: string, val: boolean) {
  if (moduleId === 'A' && !val) return;
  if (val && !store.isModuleEnabled(moduleId)) store.toggleModule(moduleId);
  if (!val && store.isModuleEnabled(moduleId)) store.toggleModule(moduleId);
}

// --- 统计与跳转 ---
const totalQuestions = computed(() => {
  return modules
    .filter(m => store.isModuleEnabled(m.id))
    .reduce((sum, m) => sum + m.questions.length, 0);
});

function startQuiz() {
  router.push('/quiz');
}

// --- 数据管理 ---
const currentBackupCode = computed(() => {
  return encode(store.answers, currentAvatar.value);
});

function handleDeleteCurrent() {
  if (confirm(`确定要清空 ${currentAvatar.value} 的所有答题数据吗？`)) {
    store.resetCurrentProfile();
    showManageModal.value = false;
  }
}

function handleDeleteAll() {
  showDeleteAllConfirm.value = true;
}

function confirmDeleteAll() {
  store.resetAll();
  localStorage.removeItem('config_store');
  localStorage.removeItem('quiz_index');
  showDeleteAllConfirm.value = false;
  showManageModal.value = false;
  router.push('/');
}
</script>

<template>
  <div class="min-h-screen bg-base-200 text-base-content font-sans pb-32 relative">
    
    <div class="absolute top-4 right-4 z-20 w-auto h-auto">
      <button 
        @click.stop="showManageModal = true"
        class="btn btn-sm btn-primary text-base-content/40 hover:text-base-content hover:bg-base-200"
      >
        <span class="text-xs">🗑️ 数据管理</span>
      </button>
    </div>

    <div class="pt-12 pb-6 px-6 max-w-3xl mx-auto">
      <h1 class="text-3xl font-bold tracking-tight text-base-content">
        建立档案
      </h1>
      <p class="text-base-content/60 text-sm mt-2 font-medium">
        选择假想对象，并配置话题范围。
      </p>
    </div>

    <div class="px-4 space-y-4 max-w-3xl mx-auto">
      
      <div 
        class="bg-base-100 rounded-2xl p-5 transition-all duration-300 cursor-pointer hover:bg-base-100/80"
        @click="handleCardClick"
      >
        <div class="flex justify-between items-center mb-4">
          <label class="text-xs font-bold text-base-content/40 uppercase tracking-wider">
            Target Persona
          </label>
        </div>

        <div class="grid grid-cols-5 gap-y-6 gap-x-2 justify-items-center mb-2">
          <button
            v-for="avatar in visibleAvatars"
            :key="avatar"
            @click.stop="handleAvatarSelect(avatar)"
            class="relative group"
          >
            <div 
              class="w-12 h-12 rounded-full flex items-center justify-center text-3xl transition-all duration-300"
              :class="currentAvatar === avatar 
                ? 'scale-110 ring-2 ring-offset-2 ring-primary bg-base-100' 
                : 'hover:scale-110 hover:bg-base-200'"
            >
              {{ avatar }}
            </div>

            <div 
              v-if="store.hasProfileData(avatar)" 
              class="absolute -top-1 -right-1 z-10 shadow-sm"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="12" fill="#1f2937" />
                <path d="M17.25 6.75L9.375 14.625L6.75 12" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </button>
        </div>

        <div class="flex flex-col items-center justify-center gap-2 mt-4 pt-2 border-t border-base-200/50">
           <button 
             @click.stop="toggleExpand"
             class="flex items-center gap-1 text-xs font-bold text-primary/80 hover:text-primary transition-colors py-1 px-3 rounded-full hover:bg-primary/5"
           >
             {{ isAvatarExpanded ? '收起列表' : '展开全部头像' }}
             <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="currentColor" 
              class="w-3 h-3 transition-transform duration-300"
              :class="{ 'rotate-180': isAvatarExpanded }"
            >
              <path d="M12 15a1 1 0 0 1-.707-.293l-4-4a1 1 0 1 1 1.414-1.414L12 12.586l3.293-3.293a1 1 0 1 1 1.414 1.414l-4 4A1 1 0 0 1 12 15z"/>
            </svg>
           </button>

           <span class="text-xs text-base-content/40 font-medium">
             当前对象: <span class="text-base-content font-bold ml-1">{{ currentAvatar }}</span>
             <span v-if="currentAvatar === '🌏'" class="mx-1 opacity-60">(默认配置)</span>
             <span class="ml-2 text-primary/80 font-mono">已答 {{ answeredCount }} 题</span>
           </span>
        </div>
      </div>

      <div class="bg-base-100 rounded-2xl p-5">
        <label class="text-xs font-bold text-base-content/40 uppercase tracking-wider block mb-4">
          Presets
        </label>
        
        <div class="flex flex-wrap gap-2">
          <button
            v-for="key in PRESET_ORDER"
            :key="key"
            @click="applyPreset(key)"
            class="px-4 py-2 rounded-full text-sm font-bold transition-all border select-none"
            :class="[
              activePresetKey === key
                ? 'bg-primary border-primary text-primary-content shadow-sm scale-105'
                : key === 'custom'
                  ? 'bg-transparent border-dashed border-base-content/20 text-base-content/40 cursor-default'
                  : 'bg-base-100 border-base-200 text-base-content/60 hover:border-base-content/20 hover:bg-base-200'
            ]"
          >
            {{ PRESET_LABELS[key] }}
          </button>
        </div>
      </div>

      <div class="bg-base-100 rounded-2xl p-5">
        <div class="flex justify-between items-end mb-4">
          <label class="text-xs font-bold text-base-content/40 uppercase tracking-wider">
            Modules
          </label>
          <span class="text-xs font-mono font-bold text-base-content/40">
            {{ store.enabledModules.length }} / {{ modules.length }}
          </span>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <ModuleCard
            v-for="mod in modules"
            :key="mod.id"
            :module="mod"
            :model-value="store.isModuleEnabled(mod.id)"
            :disabled="mod.id === 'A'"
            @update:model-value="(val) => handleManualToggle(mod.id, val)"
            class="w-full"
          />
        </div>
      </div>

    </div>

    <div class="fixed bottom-0 left-0 right-0 p-4 bg-base-100/90 backdrop-blur border-t border-base-200 z-50 pb-safe">
      <div class="max-w-3xl mx-auto">
        <button 
          @click="startQuiz"
          class="btn btn-primary w-full h-12 rounded-xl text-lg font-bold shadow-none no-animation"
        >
          进入答题
          <span class="text-primary-content/60 text-sm ml-1 font-normal">
            ({{ totalQuestions }} 题)
          </span>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-5 h-5 ml-1">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </button>
      </div>
    </div>

    <dialog class="modal modal-bottom sm:modal-middle" :class="{ 'modal-open': showManageModal }">
      <div class="modal-box bg-base-100">
        <h3 class="font-bold text-lg mb-4 text-base-content">🔧 数据管理</h3>
        
        <div class="bg-base-200 rounded-lg p-3 mb-6">
          <div class="flex justify-between items-center mb-2">
            <span class="text-xs font-bold opacity-50 uppercase">Code Backup ({{ currentAvatar }})</span>
          </div>
          <div class="flex gap-2">
            <input type="text" :value="currentBackupCode" readonly class="input input-sm input-bordered w-full font-mono text-xs bg-base-100" />
            <button @click="copy(currentBackupCode)" class="btn btn-sm btn-primary">
              {{ copied ? '已复制' : '复制' }}
            </button>
          </div>
        </div>

        <div class="flex flex-col gap-3">
          <button class="btn btn-outline btn-error w-full" @click="handleDeleteCurrent">
            🗑️ 清空当前对象 ({{ currentAvatar }}) 数据
          </button>
          <button class="btn btn-primary text-error/60 btn-sm hover:bg-error/10" @click="handleDeleteAll">
            ⚠️ 删除所有缓存数据
          </button>
        </div>

        <div v-if="showDeleteAllConfirm" class="absolute inset-0 bg-base-100 flex flex-col items-center justify-center p-6 text-center animate-fade-in z-20">
          <h4 class="text-error font-bold text-xl mb-2">⚠️ 最终确认</h4>
          <p class="text-sm opacity-70 mb-6 max-w-xs">这将彻底清除浏览器内保存的所有对象进度，且无法恢复。</p>
          <div class="flex gap-4 w-full">
            <button class="btn btn-primary flex-1" @click="showDeleteAllConfirm = false">取消</button>
            <button class="btn btn-error flex-1 text-white" @click="confirmDeleteAll">确认删除</button>
          </div>
        </div>

        <form method="dialog" class="modal-backdrop mt-4">
           <button class="btn btn-primary w-full" @click="showManageModal = false">关闭</button>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="showManageModal = false">close</button>
      </form>
    </dialog>

  </div>
</template>

<style scoped>
.pb-safe {
  padding-bottom: env(safe-area-inset-bottom, 20px);
}
.animate-fade-in {
  animation: fadeIn 0.2s ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.98); }
  to { opacity: 1; transform: scale(1); }
}
</style>