<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useClipboard } from '@vueuse/core';
import { useConfigStore } from '../stores/useConfigStore';
import { encode } from '../logic/codec';
import BaseModal from './BaseModal.vue';

import { useCloudArchive } from '../composables/useCloudArchive'; // 引入钩子
const { openCloudArchive } = useCloudArchive();

const router = useRouter();
const route = useRoute();
const store = useConfigStore();
const { copy, copied } = useClipboard();

// --- 弹窗状态 ---
const showCodeModal = ref(false);
const showClearModal = ref(false);
const showHomeConfirm = ref(false); // 控制确认弹窗

// --- 数据状态 ---
const currentCode = ref('');
const codeTitle = ref('');

// --- 显示设置状态 (本地持久化) ---
type ThemeMode = 'light' | 'dark' | 'system';
const currentTheme = ref<ThemeMode>((localStorage.getItem('polycn_theme') as ThemeMode) || 'system');
const fontSizePercent = ref(Number(localStorage.getItem('polycn_fontsize')) || 100);

// --- 页面标题逻辑 ---
const pageTitle = computed(() => {
  if (route.path === '/') return 'DIY 关系配置单';
  if (route.path === '/quiz') return '配置中...';
  if (route.path === '/result') return '结果展示';
  if (route.path === '/compare') return '双人对照';
  if (route.path === '/setup') return '准备中...';
  if (route.path === '/doc') return '使用文档';
  return 'DIY 关系配置单';
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
  
  // 遍历已有存档
  Object.entries(store.profiles).forEach(([avatar, answers]) => {
    lines.push(encode(answers, avatar));
  });

  // 如果当前正在编辑的数据还没存入 profiles，也加上
  if (store.targetAvatar && !store.profiles[store.targetAvatar]) {
    lines.push(encode(store.answers, store.targetAvatar));
  }

  // 去重并拼接
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

// 清空逻辑：先备份，再弹窗
function handleClearCurrent() {
  // 预先生成备份代码
  currentCode.value = encode(store.answers, store.targetAvatar);
  showClearModal.value = true;
}

function confirmClear() {
  store.resetCurrentProfile();
  showClearModal.value = false;
  window.location.reload();
}

function handleSaveAndFinish() {
  router.push('/result');
}
</script>

<template>
  <div class="navbar bg-base-100/95 backdrop-blur-md sticky top-0 z-50 border-b border-base-content/5 px-4 h-16">
    
    <div class="flex-1">
  <div 
    class="flex items-center gap-2 select-none group cursor-pointer" 
    @click="showHomeConfirm = true"
  >
    <i-ph-cube-duotone class="text-2xl group-active:scale-90 transition-transform text-primary" />
    <span class="font-bold text-lg tracking-tight inline-block max-w-[240px] truncate">{{ pageTitle }}</span>
  </div>
</div>

<BaseModal 
  v-model="showHomeConfirm" 
  title="返回首页？" 
  :show-close="true"
>
  <div class="space-y-2">
    <p>点击标题栏可以快速返回首页。</p>
    
    <p>确认返回首页？</p>
  </div>

  <template #actions>
    <button class="btn btn-ghost" @click="showHomeConfirm = false">
      关闭弹窗
    </button>
    <button class="btn btn-primary px-6" @click="router.push('/'); showHomeConfirm = false;">
      返回首页
    </button>
  </template>
</BaseModal>

    <div class="flex-none">
      
      <div class="dropdown dropdown-end">
        <div tabindex="0" role="button" class="btn btn-ghost btn-circle transition-transform active:scale-95">
          <i-ph-list-bold class="text-xl" />
        </div>

        <ul tabindex="0" class="mt-3 z-[1] p-2 shadow-2xl menu menu-sm dropdown-content bg-base-100 rounded-box w-72 border border-base-content/10 max-h-[85vh] overflow-y-auto block">
          
          <li class="menu-title flex flex-row justify-between items-center px-4 py-2 text-base-content rounded-t-box">
            <span>控制台 | 当前在为 {{ store.targetAvatar }} 填写问卷</span>
          </li>
          
          
          <div class="divider my-1 opacity-50"></div>

          <li v-if="route.path === '/quiz'">
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

          <div class="px-2 py-1 text-xs opacity-50 font-bold">假想对象切换 / Profiles</div>
          
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

          <div class="px-2 py-1 text-xs opacity-50 font-bold">数据备份 / Backup</div>
          
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
          <div class="divider my-1"></div>
          <li>
            <a @click="openCloudArchive()" >
              <i-ph-cloud-bold class="text-base" />
              <span>云端存档 (beta) 管理</span>
            </a>
          </li>
          <li>
            <a @click="router.push('/doc')" class="opacity-70">
              <i-ph-info-bold class="text-base" />
              <span>关于 / 帮助</span>
            </a>
          </li>

           <div class="divider my-1"></div>
           <li v-if="route.path !== '/'">
            <a @click="router.push('/')" class="hover:bg-primary/10 transition-colors">
              <i-ph-house-line-bold class="text-base text-primary" />
              <span class="font-medium">返回首页</span>
            </a>
          </li>

         
        </ul>
      </div>
    </div>

    <BaseModal v-model="showCodeModal" :title="codeTitle">
      <div class="flex items-center gap-2 mb-3 text-xs opacity-60">
        <i-ph-info-bold />
        <span>{{ codeTitle.includes('全量') ? '所有存档已换行分隔，请全选复制保存。' : '复制下方代码以分享当前方案。' }}</span>
      </div>
      <div class="bg-base-200 p-3 rounded-lg font-mono text-xs break-all mb-4 select-all border border-base-content/10 max-h-60 overflow-y-auto whitespace-pre-wrap">
{{ currentCode }}
      </div>
      <template #actions>
        <button @click="copy(currentCode)" class="btn btn-success btn-sm text-white gap-2">
          <i-ph-check-bold v-if="copied" />
          <i-ph-copy-bold v-else />
          {{ copied ? '已复制' : '复制' }}
        </button>
        <button class="btn btn-ghost btn-sm" @click="showCodeModal = false">关闭</button>
      </template>
    </BaseModal>

    <BaseModal v-model="showClearModal" title="⚠️ 危险操作">
      <div class="space-y-4">
        <div class="p-4 bg-base-100 border border-base-content/10 rounded-xl relative">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-bold text-base-content/40 uppercase tracking-wider">最后备份机会</span>
            <button 
              @click="copy(currentCode)"
              class="btn btn-xs btn-ghost text-base-content/40 hover:text-base-content"
            >
              <i-ph-copy-bold v-if="!copied"/>
              <i-ph-check-bold v-else class="text-success"/>
              <span class="ml-1">{{ copied ? '已复制' : '复制' }}</span>
            </button>
          </div>
          <div class="w-full bg-base-200 text-xs p-2 rounded border-none font-mono opacity-60 max-h-24 overflow-y-auto break-all">
            {{ currentCode }}
          </div>
        </div>

        <div class="p-3 bg-error/10 text-error text-xs rounded-lg flex items-start gap-2">
          <i-ph-warning-circle-bold class="text-lg shrink-0" />
          <span>确认清空当前方案 [{{ store.targetAvatar }}] 的所有数据？此操作不可撤销。</span>
        </div>
      </div>
      <template #actions>
        <button class="btn btn-error btn-sm text-white" @click="confirmClear">
          确认清空
        </button>
        <button class="btn btn-ghost btn-sm" @click="showClearModal = false">
          取消
        </button>
      </template>
    </BaseModal>

  </div>
</template>