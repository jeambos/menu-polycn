<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useClipboard } from '@vueuse/core';
import { useConfigStore } from '../stores/useConfigStore';
import { encode, decode } from '../logic/codec';
import type { Attitude } from '../types';

const router = useRouter();
const route = useRoute();
const store = useConfigStore();
const { copy, copied } = useClipboard();

// --- 状态 ---
const showCodeModal = ref(false);
const showImportModal = ref(false);
const importCodeInput = ref('');
const currentCode = ref('');
const codeTitle = ref('');

// --- 显示设置状态 (本地持久化) ---
type ThemeMode = 'light' | 'dark' | 'system';
const currentTheme = ref<ThemeMode>((localStorage.getItem('polycn_theme') as ThemeMode) || 'system');
const fontSizePercent = ref(Number(localStorage.getItem('polycn_fontsize')) || 100);

// --- 页面标题逻辑 ---
const pageTitle = computed(() => {
  if (route.path === '/') return 'Relationship Configuration';
  if (route.path === '/quiz') return '配置中...';
  if (route.path === '/result') return '分析面板';
  if (route.path === '/compare') return '关系对照';
  return 'PolyCN';
});

// --- 显示设置逻辑 ---

// 1. 主题切换
function applyTheme(mode: ThemeMode) {
  currentTheme.value = mode;
  localStorage.setItem('polycn_theme', mode);

  const isDark = 
    mode === 'dark' || 
    (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  if (isDark) {
    document.documentElement.classList.add('dark');
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.classList.remove('dark');
    document.documentElement.setAttribute('data-theme', 'light');
  }
}

// 2. 字号调节 (85% - 115%)
function applyFontSize() {
  localStorage.setItem('polycn_fontsize', fontSizePercent.value.toString());
  document.documentElement.style.fontSize = `${fontSizePercent.value}%`;
}

// 初始化监听
onMounted(() => {
  applyTheme(currentTheme.value);
  applyFontSize();

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (currentTheme.value === 'system') applyTheme('system');
  });
});


// --- 档案与数据逻辑 ---

// 全量导出
function handleExportAll() {
  const lines: string[] = [];
  
  Object.entries(store.profiles).forEach(([avatar, answers]) => {
    lines.push(encode(answers, avatar));
  });

  if (store.targetAvatar && !store.profiles[store.targetAvatar]) {
    lines.push(encode(store.answers, store.targetAvatar));
  }

  currentCode.value = [...new Set(lines)].join('\n');
  codeTitle.value = '全量备份 (Full Backup)';
  showCodeModal.value = true;
}

// 单体分享
function handleExportCurrent() {
  currentCode.value = encode(store.answers, store.targetAvatar);
  codeTitle.value = `单体分享: ${store.targetAvatar}`;
  showCodeModal.value = true;
}

function switchProfile(avatar: string) {
  if (store.targetAvatar === avatar) return;
  store.setAvatar(avatar);
  if (route.path === '/result' || route.path === '/compare') {
    setTimeout(() => window.location.reload(), 50);
  }
}

function deleteProfile(avatar: string) {
  if (confirm(`确定要删除方案 [${avatar}] 吗？`)) {
    store.deleteProfile(avatar);
    if (store.targetAvatar === avatar) {
      store.resetCurrentProfile();
      window.location.reload();
    }
  }
}

function handleClearCurrent() {
  if (confirm(`确定要清空 [${store.targetAvatar}] 的所有配置吗？`)) {
    store.resetCurrentProfile();
    window.location.reload();
  }
}

function handleSaveAndFinish() {
  router.push('/result');
}

function handleImport() {
  try {
    const rawInput = importCodeInput.value.trim();
    if (!rawInput) return;

    const lines = rawInput.split(/\r?\n/).filter(line => line.trim().length > 0);
    let successCount = 0;

    lines.forEach(line => {
      try {
        const data = decode(line.trim());
        if (data) {
          if (!store.profiles[data.avatar]) store.profiles[data.avatar] = {};
          store.profiles[data.avatar] = data.answers as Record<string, Attitude[]>;
          
          store.answers = data.answers as Record<string, Attitude[]>;
          store.targetAvatar = data.avatar;
          
          successCount++;
        }
      } catch (e) { /* ignore */ }
    });

    if (successCount > 0) {
      showImportModal.value = false;
      alert(`已读取 ${successCount} 个方案`);
      importCodeInput.value = '';
      if (route.path === '/') router.push('/result');
      else window.location.reload();
    } else {
      alert('未识别到有效代码');
    }
  } catch (e) {
    alert('解析错误');
  }
}
</script>

<template>
  <div class="navbar bg-base-100/95 backdrop-blur-md sticky top-0 z-50 border-b border-base-content/5 px-4 h-16">
    
    <div class="flex-1">
      <div class="flex items-center gap-2 cursor-pointer select-none group" @click="router.push('/')">
        <i-ph-puzzle-piece-bold class="text-2xl group-active:scale-90 transition-transform text-primary" />
        <span class="font-bold text-lg tracking-tight hidden sm:inline-block">{{ pageTitle }}</span>
      </div>
    </div>

    <div class="flex-none">
      
      <div class="dropdown dropdown-end">
        <div tabindex="0" role="button" class="btn btn-ghost btn-circle avatar placeholder transition-transform active:scale-95 border border-base-content/10">
          <div class="bg-neutral text-neutral-content rounded-full w-9 h-9">
            <span class="text-xl">{{ store.targetAvatar }}</span>
          </div>
        </div>

        <ul tabindex="0" class="mt-3 z-[1] p-2 shadow-2xl menu menu-sm dropdown-content bg-base-100 rounded-box w-72 border border-base-content/10 max-h-[85vh] overflow-y-auto block">
          
          <li class="menu-title flex flex-row justify-between items-center px-4 py-2 bg-base-200/50 rounded-t-box">
            <span>控制台: {{ store.targetAvatar }}</span>
          </li>

          <div class="px-2 py-2">
            <div class="grid grid-cols-3 gap-1 bg-base-200 rounded-lg p-1 mb-3">
              <button 
                @click="applyTheme('light')" 
                class="btn btn-xs border-none" 
                :class="currentTheme === 'light' ? 'bg-white text-black shadow-sm' : 'btn-ghost opacity-50'"
                title="日间模式"
              >
                <i-ph-sun-bold />
              </button>
              <button 
                @click="applyTheme('dark')" 
                class="btn btn-xs border-none"
                :class="currentTheme === 'dark' ? 'bg-black text-white shadow-sm' : 'btn-ghost opacity-50'"
                title="夜间模式"
              >
                <i-ph-moon-bold />
              </button>
              <button 
                @click="applyTheme('system')" 
                class="btn btn-xs border-none"
                :class="currentTheme === 'system' ? 'bg-base-content text-base-100 shadow-sm' : 'btn-ghost opacity-50'"
                title="跟随系统"
              >
                <i-ph-desktop-bold />
              </button>
            </div>

            <div class="flex items-center gap-3 px-1">
              <i-ph-text-t-bold class="text-xs opacity-50" />
              <input 
                type="range" 
                min="85" 
                max="115" 
                step="5" 
                v-model="fontSizePercent" 
                @input="applyFontSize" 
                class="range range-xs range-primary flex-1" 
              />
              <i-ph-text-t-bold class="text-lg opacity-80" />
            </div>
          </div>

          <div class="divider my-1"></div>

          <div class="px-2 py-1 text-xs opacity-50 font-bold">档案切换 / Profiles</div>
          
          <li v-for="(_, avatar) in store.profiles" :key="avatar">
            <div class="flex justify-between items-center py-2">
              <a @click="switchProfile(avatar as string)" class="flex-1 flex items-center gap-2">
                <span class="text-lg">{{ avatar }}</span>
                <span v-if="avatar === store.targetAvatar" class="badge badge-xs badge-primary">当前</span>
              </a>
              <button 
                @click.stop="deleteProfile(avatar as string)" 
                class="btn btn-ghost btn-xs text-error opacity-50 hover:opacity-100"
                title="删除此方案"
              >
                <i-ph-x-bold />
              </button>
            </div>
          </li>
          
          <li v-if="Object.keys(store.profiles).length === 0" class="disabled text-xs opacity-50 px-4 py-1">
            暂无其他存档
          </li>

          <div class="divider my-1"></div>

          <div class="px-2 py-1 text-xs opacity-50 font-bold">数据 / Data</div>
          
          <li>
            <a @click="handleExportCurrent">
              <i-ph-share-network-bold class="text-base" />
              <span>单体分享 (Share)</span>
            </a>
          </li>
          <li>
            <a @click="handleExportAll">
              <i-ph-hard-drives-bold class="text-base" />
              <span>全量备份 (Backup)</span>
            </a>
          </li>
          <li>
            <a @click="showImportModal = true">
              <i-ph-download-simple-bold class="text-base" />
              <span>读取/恢复 (Import)</span>
            </a>
          </li>
          
          <div class="divider my-1"></div>

          <li v-if="route.path === '/quiz'">
            <a @click="handleSaveAndFinish" class="text-primary font-bold">
              <i-ph-floppy-disk-bold class="text-base" />
              <span>完成并查看结果</span>
            </a>
          </li>
          
          <li>
            <a @click="handleClearCurrent" class="text-error">
              <i-ph-trash-bold class="text-base" />
              <span>清空当前数据</span>
            </a>
          </li>
          <li>
            <a @click="router.push('/doc')" class="opacity-70">
              <i-ph-info-bold class="text-base" />
              <span>关于 / 帮助</span>
            </a>
          </li>
          
        </ul>
      </div>
    </div>

    <dialog class="modal" :class="{ 'modal-open': showCodeModal }">
      <div class="modal-box">
        <h3 class="font-bold text-lg flex items-center gap-2">
          <i-ph-code-bold />
          {{ codeTitle }}
        </h3>
        <p class="py-4 text-xs opacity-70">
          {{ codeTitle.includes('全量') ? '所有存档已用换行符分隔。请复制全文保存到记事本。' : '复制下方代码以分享当前方案。' }}
        </p>
        <div class="bg-base-200 p-3 rounded-lg font-mono text-xs break-all mb-4 select-all border border-base-content/10 max-h-60 overflow-y-auto whitespace-pre-wrap">
{{ currentCode }}
        </div>
        <div class="modal-action">
          <button @click="copy(currentCode)" class="btn btn-success btn-sm text-white gap-2">
            <i-ph-check-bold v-if="copied" />
            <i-ph-copy-bold v-else />
            {{ copied ? '已复制' : '复制' }}
          </button>
          <button class="btn btn-ghost btn-sm" @click="showCodeModal = false">关闭</button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop"><button @click="showCodeModal = false">close</button></form>
    </dialog>

    <dialog class="modal" :class="{ 'modal-open': showImportModal }">
      <div class="modal-box">
        <h3 class="font-bold text-lg flex items-center gap-2">
          <i-ph-download-simple-bold />
          恢复/导入数据
        </h3>
        <p class="text-xs opacity-60 mt-2">支持粘贴单个方案代码，或包含多个方案的全量备份文本。</p>
        <textarea 
          v-model="importCodeInput" 
          placeholder="在此粘贴 Emoji 代码..." 
          class="textarea textarea-bordered w-full mt-4 font-mono text-xs h-32 whitespace-pre" 
        ></textarea>
        <div class="modal-action">
          <button @click="handleImport" class="btn btn-primary btn-sm gap-2">
            <i-ph-check-bold />
            确认导入
          </button>
          <button class="btn btn-ghost btn-sm" @click="showImportModal = false">取消</button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop"><button @click="showImportModal = false">close</button></form>
    </dialog>

  </div>
</template>