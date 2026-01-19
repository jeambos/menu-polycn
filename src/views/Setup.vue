<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useClipboard } from '@vueuse/core'; // 引入剪贴板
import { useConfigStore } from '../stores/useConfigStore';
import ModuleCard from '../components/ModuleCard.vue';
import questionsData from '../data/questions.json';
import type { Module } from '../types';
import { AVATARS, encode } from '../logic/codec'; // 引入 encode

const router = useRouter();
const store = useConfigStore();
const { copy, copied } = useClipboard();
const modules = questionsData.modules as Module[];

// --- 套餐定义 ---
const PRESETS: Record<string, string[]> = {
  'practice': ['A'], 
  'all': ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'], 
  'passion': ['A', 'B', 'C', 'D', 'E'], 
  'friend': ['A', 'D', 'F', 'G', 'H', 'I'], 
  'playmate': ['A', 'D', 'G', 'H'] 
};

// --- 实时高亮逻辑 ---
const activePresetKey = computed(() => {
  const currentIds = [...store.enabledModules].sort();
  for (const [key, presetIds] of Object.entries(PRESETS)) {
    const sortedPreset = [...presetIds].sort();
    if (JSON.stringify(currentIds) === JSON.stringify(sortedPreset)) {
      return key;
    }
  }
  return 'custom'; 
});

function applyPreset(key: string) {
  if (key === 'custom') return;
  const targetIds = PRESETS[key];
  if (!targetIds) return; 
  
  targetIds.forEach(id => {
    if (!store.isModuleEnabled(id)) store.toggleModule(id);
  });
  
  [...store.enabledModules].forEach(id => {
    if (!targetIds.includes(id) && id !== 'A') {
      store.toggleModule(id);
    }
  });
}

function handleManualToggle(moduleId: string, val: boolean) {
  if (moduleId === 'A' && !val) return; 
  if (val && !store.isModuleEnabled(moduleId)) store.toggleModule(moduleId);
  if (!val && store.isModuleEnabled(moduleId)) store.toggleModule(moduleId);
}

// --- 头像逻辑 ---
const DEFAULT_AVATAR = '🌏';
const SHORTCUT_POOL = ['🦊', '🐰', '🐱', '🐶'];
const showAvatarModal = ref(false);

const currentAvatar = computed({
  get: () => store.targetAvatar || DEFAULT_AVATAR,
  set: (val) => store.setAvatar(val) 
});

const visibleShortcuts = computed(() => {
  return SHORTCUT_POOL.filter(a => a !== currentAvatar.value).slice(0, 3);
});

function handleAvatarClick(emoji: string) {
  if (currentAvatar.value === emoji) {
    store.setAvatar(DEFAULT_AVATAR);
  } else {
    store.setAvatar(emoji);
  }
}

const totalQuestions = computed(() => {
  return modules
    .filter(m => store.isModuleEnabled(m.id))
    .reduce((sum, m) => sum + m.questions.length, 0);
});

function startQuiz() {
  router.push('/quiz');
}

// --- 🗑️ 数据管理逻辑 (新增) ---
const showManageModal = ref(false);
const showDeleteAllConfirm = ref(false); // 二次确认

// 获取当前代码用于备份
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
  // 仅切换显示二次确认 UI
  showDeleteAllConfirm.value = true;
}

function confirmDeleteAll() {
  store.resetAll();
  localStorage.removeItem('config_store');
  localStorage.removeItem('quiz_index');
  showDeleteAllConfirm.value = false;
  showManageModal.value = false;
  router.push('/'); // 重置后回首页
}
</script>

<template>
  <div class="pb-24 pt-2 relative">
    
    <button 
      @click="showManageModal = true"
      class="absolute top-0 right-0 btn btn-xs btn-ghost gap-1 opacity-50 hover:opacity-100 z-10"
    >
      <span>🗑️</span> 管理数据
    </button>

    <div class="mb-8 bg-base-200/50 rounded-xl p-4 border border-base-content/5 mt-6">
      <h2 class="text-sm font-bold opacity-60 mb-3 uppercase tracking-wider flex items-center gap-2">
        <span class="badge badge-primary badge-xs">STEP 1</span>
        设置假想对象
      </h2>
      <p class="text-xs opacity-50 mb-4">
        点击头像可直接读取该对象的存档。
      </p>
      
      <div class="flex items-center justify-center gap-3">
        <div class="indicator">
          <span v-if="store.hasProfileData(currentAvatar)" class="indicator-item badge badge-success badge-xs border-2 border-base-100 scale-75 shadow-sm"></span>
          <button 
            @click="handleAvatarClick(currentAvatar)"
            class="btn btn-circle btn-lg text-4xl border-4 border-primary shadow-lg bg-base-100"
          >
            {{ currentAvatar }}
          </button>
        </div>
        
        <div class="w-px h-8 bg-base-content/10 mx-1"></div>

        <div v-for="emoji in visibleShortcuts" :key="emoji" class="indicator">
          <span v-if="store.hasProfileData(emoji)" class="indicator-item badge badge-success badge-xs border-2 border-base-100 scale-75 shadow-sm"></span>
          <button 
            @click="handleAvatarClick(emoji)"
            class="btn btn-circle btn-lg text-2xl bg-base-100 border-base-200 hover:border-primary/50"
          >
            {{ emoji }}
          </button>
        </div>

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
          <div v-for="emoji in AVATARS" :key="emoji" class="indicator">
            <span v-if="store.hasProfileData(emoji)" class="indicator-item badge badge-success badge-xs border-white"></span>
            <button 
              @click="handleAvatarClick(emoji); showAvatarModal = false"
              class="btn btn-circle text-2xl border-2"
              :class="currentAvatar === emoji ? 'btn-primary border-primary' : 'btn-ghost border-transparent'"
            >
              {{ emoji }}
            </button>
          </div>
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

    <dialog class="modal modal-bottom sm:modal-middle" :class="{ 'modal-open': showManageModal }">
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">🔧 数据管理</h3>
        
        <div class="bg-base-200 rounded-lg p-3 mb-6">
          <div class="flex justify-between items-center mb-2">
            <span class="text-xs font-bold opacity-70">当前存档 ({{ currentAvatar }}) 备份</span>
          </div>
          <div class="flex gap-2">
            <input type="text" :value="currentBackupCode" readonly class="input input-sm input-bordered w-full font-mono text-[10px]" />
            <button @click="copy(currentBackupCode)" class="btn btn-sm btn-neutral">
              {{ copied ? '已复制' : '复制' }}
            </button>
          </div>
        </div>

        <div class="flex flex-col gap-3">
          <button class="btn btn-outline btn-error w-full" @click="handleDeleteCurrent">
            🗑️ 清空当前对象 ({{ currentAvatar }}) 数据
          </button>

          <button class="btn btn-ghost text-error/60 btn-sm" @click="handleDeleteAll">
            ⚠️ 删除所有缓存数据 (慎用)
          </button>
        </div>

        <div v-if="showDeleteAllConfirm" class="absolute inset-0 bg-base-100 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
          <h4 class="text-error font-bold text-xl mb-2">⚠️ 最终确认</h4>
          <p class="text-sm opacity-70 mb-6">这将彻底清除浏览器内保存的所有对象进度，且无法恢复。</p>
          <div class="flex gap-4 w-full">
            <button class="btn btn-ghost flex-1" @click="showDeleteAllConfirm = false">取消</button>
            <button class="btn btn-error flex-1 text-white" @click="confirmDeleteAll">确认删除</button>
          </div>
        </div>

        <form method="dialog" class="modal-backdrop mt-4">
           <button class="btn btn-ghost w-full" @click="showManageModal = false">关闭</button>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="showManageModal = false">close</button>
      </form>
    </dialog>

  </div>
</template>

<style scoped>
.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom, 20px);
}
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
.indicator-item {
  top: 5px;
  right: 5px;
  z-index: 10;
}
.animate-fade-in {
  animation: fadeIn 0.2s ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
</style>