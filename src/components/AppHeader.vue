<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useClipboard } from '@vueuse/core';
import { useConfigStore } from '../stores/useConfigStore';
import { encode, decode } from '../logic/codec';
import questionsData from '../data/questions.json'; 
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

// 获取所有模块的定义
const allModules = questionsData.modules;

// --- 页面标题逻辑 ---
const pageTitle = computed(() => {
  if (route.path === '/') return 'Relationship Configuration';
  if (route.path === '/quiz') return '配置中...';
  if (route.path === '/result') return '分析面板';
  return 'PolyCN';
});

// --- 功能实现 ---

function handleShowCode(type: 'full' | 'filtered' = 'full') {
  currentCode.value = encode(store.answers, store.targetAvatar);
  codeTitle.value = type === 'filtered' ? '当前结果代码' : '完整配置代码';
  showCodeModal.value = true;
}

function switchProfile(avatar: string) {
  if (store.targetAvatar === avatar) return;
  store.setAvatar(avatar);
  if (route.path === '/result') {
    window.location.reload(); 
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
    const data = decode(importCodeInput.value);
    if (data) {
      // ✅ 修复类型报错：强制断言
      store.answers = data.answers as Record<string, Attitude[]>;
      store.targetAvatar = data.avatar;
      showImportModal.value = false;
      alert(`✅ 已读取方案 [${data.avatar}]`);
      importCodeInput.value = '';
      if (route.path === '/') router.push('/quiz');
    } else {
      alert('代码无效');
    }
  } catch (e) {
    alert('解析错误');
  }
}

const isResultPage = computed(() => route.path === '/result');

</script>

<template>
  <div class="navbar bg-base-100/95 backdrop-blur-md sticky top-0 z-50 border-b border-base-content/5 px-4 h-16">
    
    <div class="flex-1">
      <div class="flex items-center gap-2 cursor-pointer select-none" @click="router.push('/')">
        <span class="text-2xl">🧩</span>
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

        <ul tabindex="0" class="mt-3 z-[1] p-2 shadow-2xl menu menu-sm dropdown-content bg-base-100 rounded-box w-72 border border-base-content/10 max-h-[80vh] overflow-y-auto block">
          
          <li class="menu-title flex flex-row justify-between items-center px-4 py-2 bg-base-200/50 rounded-t-box">
            <span>当前方案: {{ store.targetAvatar }}</span>
          </li>

          <div class="px-2 py-1 text-xs opacity-50 font-bold mt-1">切换方案 / Switch</div>
          
          <li v-for="(_, avatar) in store.profiles" :key="avatar">
            <div class="flex justify-between items-center py-2">
              <a @click="switchProfile(avatar as string)" class="flex-1 flex items-center gap-2">
                <span class="text-lg">{{ avatar }}</span>
                <span v-if="avatar === store.targetAvatar" class="badge badge-xs badge-primary">使用中</span>
              </a>
              <button 
                @click.stop="deleteProfile(avatar as string)" 
                class="btn btn-ghost btn-xs text-error opacity-50 hover:opacity-100"
                title="删除此方案"
              >✕</button>
            </div>
          </li>
          
          <li v-if="Object.keys(store.profiles).length === 0" class="disabled text-xs opacity-50 px-4 py-1">
            暂无其他存档
          </li>

          <div class="divider my-1"></div>

          <template v-if="isResultPage">
            <div class="px-2 py-1 text-xs opacity-50 font-bold">模块显示 / Modules</div>
            <li v-for="mod in allModules" :key="mod.id">
              <label class="label cursor-pointer justify-start gap-3 py-2">
                <input 
                  type="checkbox" 
                  class="checkbox checkbox-xs checkbox-primary" 
                  :checked="store.isModuleEnabled(mod.id)"
                  @change="store.toggleModule(mod.id)" 
                />
                <span class="flex-1 truncate">{{ mod.name }}</span>
              </label>
            </li>
            <div class="divider my-1"></div>
          </template>

          <div class="px-2 py-1 text-xs opacity-50 font-bold">操作 / Actions</div>
          
          <li v-if="route.path === '/quiz'">
            <a @click="handleSaveAndFinish" class="text-primary font-bold">
              💾 完成并查看结果
            </a>
          </li>

          <li><a @click="handleShowCode('full')">📤 导出当前代码 (Export)</a></li>
          <li><a @click="showImportModal = true">📥 导入代码 (Import)</a></li>
          
          <li v-if="isResultPage">
             <a @click="handleShowCode('filtered')">📊 导出结果代码</a>
          </li>

          <div class="divider my-1"></div>

          <li><a @click="handleClearCurrent" class="text-error">🗑️ 清空当前方案数据</a></li>
          
        </ul>
      </div>
    </div>

    <dialog class="modal" :class="{ 'modal-open': showCodeModal }">
      <div class="modal-box">
        <h3 class="font-bold text-lg">{{ codeTitle }}</h3>
        <p class="py-4 text-xs opacity-70">复制下方代码以保存或分享。</p>
        <div class="bg-base-200 p-3 rounded-lg font-mono text-xs break-all mb-4 select-all border border-base-content/10 max-h-40 overflow-y-auto">
          {{ currentCode }}
        </div>
        <div class="modal-action">
          <button @click="copy(currentCode)" class="btn btn-success btn-sm text-white">
            {{ copied ? '已复制 ✨' : '复制' }}
          </button>
          <button class="btn btn-ghost btn-sm" @click="showCodeModal = false">关闭</button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop"><button @click="showCodeModal = false">close</button></form>
    </dialog>

    <dialog class="modal" :class="{ 'modal-open': showImportModal }">
      <div class="modal-box">
        <h3 class="font-bold text-lg">恢复/导入数据</h3>
        <textarea 
          v-model="importCodeInput" 
          placeholder="在此粘贴 Emoji 代码..." 
          class="textarea textarea-bordered w-full mt-4 font-mono text-xs h-24" 
        ></textarea>
        <div class="modal-action">
          <button @click="handleImport" class="btn btn-primary btn-sm">确认导入</button>
          <button class="btn btn-ghost btn-sm" @click="showImportModal = false">取消</button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop"><button @click="showImportModal = false">close</button></form>
    </dialog>

  </div>
</template>