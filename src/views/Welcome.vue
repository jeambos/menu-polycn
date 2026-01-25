<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useClipboard } from '@vueuse/core';
import { useConfigStore } from '../stores/useConfigStore';
import { decode } from '../logic/codec';
import type { Attitude } from '../types'; // ✅ 引入类型
import RubiksCube from '../components/RubiksCube.vue';
import BaseModal from '../components/BaseModal.vue';
import AIAnalysisModal from '../components/AIAnalysisModal.vue';

// --- 状态 ---
const showOverwriteWarning = ref(false); // ✅ 控制覆盖警告弹窗
const pendingImportData = ref<any>(null); // ✅ 暂存待导入的数据
const pendingImportAction = ref<'view' | 'continue'>('view'); // ✅ 记录用户意图

const showAIModal = ref(false);

const router = useRouter();
const store = useConfigStore();
const { text, isSupported } = useClipboard();

const activeTab = ref<'single' | 'dual'>('single');
// ✅ 修改：统一变量名，实现单人/双人数据互通
const codeA = ref(''); // 对应：单人代码 / 我的代码
const codeB = ref(''); // 对应：对方代码
const errorMsg = ref('');
const isShaking = ref(false);

// --- 逻辑 ---
function triggerError(msg: string) {
  errorMsg.value = msg;
  isShaking.value = true;
  setTimeout(() => isShaking.value = false, 500);
}

function isValid(code: string) {
  return code && code.trim().length > 0;
}

async function handlePaste(target: 'single' | 'my' | 'partner') {
  let content = '';
  if (navigator.clipboard?.readText) {
    try {
      content = await navigator.clipboard.readText();
    } catch (e) { /* ignore */ }
  }
  if (!content && isSupported.value) content = text.value;

  if (content) {
    // ✅ 修改：统一粘贴逻辑
    if (target === 'single' || target === 'my') codeA.value = content;
    if (target === 'partner') codeB.value = content;
  } else {
    triggerError('无法读取剪贴板');
  }
}

function goSystem() {
  router.push('/setup'); 
}

// ✅ 重构：统一的导入尝试函数 (核心逻辑)
function attemptImport(action: 'view' | 'continue') {
  // 使用 codeA 进行单人操作
  if (!isValid(codeA.value)) return triggerError('请输入代码');

  try {
    const data = decode(codeA.value);

    // 检查冲突：如果本地已有该头像的存档
    if (store.profiles[data.avatar]) {
      pendingImportData.value = data;
      pendingImportAction.value = action; // 👈 记住用户的意图(是查看还是继续)
      showOverwriteWarning.value = true;  // 👈 触发弹窗
    } else {
      // 无冲突，直接执行
      executeImport(data, action);
    }
  } catch (e) {
    triggerError('代码无效');
  }
}

// ✅ 重构：执行导入 (被弹窗确认或直接调用)
function executeImport(data: any, action: 'view' | 'continue') {
  store.targetAvatar = data.avatar;
  const typedAnswers = data.answers as Record<string, Attitude[]>;
  store.answers = typedAnswers;

  if (action === 'continue') {
    // 如果是“继续答题”，强制写入存档并去设置页
    store.profiles[data.avatar] = typedAnswers;
    router.push('/setup');
  } else {
    // 如果是“查看结果”，只更新当前 answers，去结果页
    router.push('/result');
  }
  
  // 清理状态
  showOverwriteWarning.value = false;
  pendingImportData.value = null;
}

// ✅ 绑定按钮事件到新的逻辑
const handleSingleView = () => attemptImport('view');
const handleSingleContinue = () => attemptImport('continue');

function handleCompare() {
  // ✅ 修改：使用 codeA 和 codeB
  const hasMy = isValid(codeA.value);
  const hasPartner = isValid(codeB.value);

  if (hasMy && hasPartner) {
    // 两个都有：进入双人对比
    router.push({
      path: '/compare',
      query: { my: codeA.value, partner: codeB.value }
    });
  } else if (hasMy || hasPartner) {
    // 只有一个：进入单人结果页
    router.push({
      path: '/result',
      query: { code: hasMy ? codeA.value : codeB.value }
    });
  } else {
    // 都没有
    triggerError('需填入代码');
  }
}
</script>

<template>
  <div class="min-h-screen bg-base-100 text-base-content flex flex-col font-sans selection:bg-primary selection:text-primary-content transition-colors duration-300">

    <div class="flex-1 flex flex-col items-center justify-start px-6 w-full max-w-md mx-auto space-y-12 pt-[15vh]">
      
      <div class="text-center space-y-6">
        
        <div class="flex items-center justify-center w-full h-32 mb-4 overflow-visible">
   <RubiksCube />
</div>
        
        <div class="space-y-3">
          <h1 class="text-4xl font-black tracking-tighter text-base-content flex items-center justify-center gap-1">
  关系配置单
  <sup class="text-[12px] font-bold tracking-normal opacity-30 px-1 py-0.5 border border-black/10 rounded ml-1 bg-slate-50 uppercase leading-none">
    v0.8.1 
  </sup>
</h1>
          <p class="text-slate-500 font-medium text-base tracking-wide">
            探索自身需求 / 理解彼此偏好
          </p>
        </div>
      </div>

      <div class="w-full space-y-10">
        
        <button 
  @click="goSystem"
  class="group w-full h-16 bg-primary text-primary-content rounded-2xl text-xl font-bold flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/20"
>
  <span>进入系统</span>
  <i-ph-arrow-right-bold class="text-2xl group-hover:translate-x-1 transition-transform" />
</button>

        <div class="relative flex items-center py-2">
          <div class="flex-grow border-t border-slate-100"></div>
          <span class="flex-shrink-0 mx-4 text-xs font-bold text-slate-300 uppercase tracking-widest">Import</span>
          <div class="flex-grow border-t border-slate-100"></div>
        </div>

        <div class="w-full">
          <div class="grid grid-cols-2 p-1.5 bg-base-200 rounded-2xl mb-6 border border-base-content/5">
  <button 
    class="py-3 text-base font-bold rounded-xl transition-all duration-200"
    :class="activeTab === 'single' ? 'bg-base-100 text-base-content shadow-md' : 'text-base-content/40 hover:text-base-content/70'"
    @click="activeTab = 'single'"
  >
    单人导入
  </button>
  <button 
    class="py-3 text-base font-bold rounded-xl transition-all duration-200"
    :class="activeTab === 'dual' ? 'bg-base-100 text-base-content shadow-md' : 'text-base-content/40 hover:text-base-content/70'"
    @click="activeTab = 'dual'"
  >
    双人对比
  </button>
</div>

  <div class="relative min-h-[160px]">
         <div v-if="activeTab === 'single'" class="space-y-4 animate-fade">
               <div class="relative">
      <input 
        v-model="codeA" 
        type="text" 
        placeholder="粘贴结果代码...（一串Emoji）" 
        class="w-full h-14 bg-base-100 border border-slate-200 rounded-xl px-4 text-base font-mono focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all placeholder:text-slate-300"
        :class="{ 'border-red-500 text-red-500': errorMsg }"
      />
      <button @click="handlePaste('single')" class="absolute right-2 top-2 p-2 text-slate-300 hover:text-base-content">
        <i-ph-clipboard-text class="text-xl"/>
      </button>
    </div>
    
    <div class="space-y-3">
      <button @click="handleSingleView" class="w-full h-12 rounded-xl bg-slate-900 text-white text-base font-bold hover:bg-black transition-colors shadow-sm">
        查看结果
      </button>

      <div class="grid grid-cols-2 gap-3">
        <button @click="showAIModal = true"  class="h-12 flex items-center justify-center gap-2 rounded-xl border border-slate-200 text-base font-bold text-slate-600 hover:bg-slate-50 hover:text-base-content hover:border-slate-300 transition-all">
          <i-ph-sparkle-bold class="text-lg" />
          AI分析报告
        </button>
        <button @click="handleSingleContinue" class="h-12 rounded-xl border border-slate-200 text-base font-bold text-slate-600 hover:bg-slate-50 hover:text-base-content hover:border-slate-300 transition-all">
          继续答题
        </button>
      </div>
    </div>
  </div>

  <div v-if="activeTab === 'dual'" class="space-y-4 animate-fade">
    <div class="relative">
      <input v-model="codeA" placeholder="你的结果代码..." class="w-full h-14 bg-base-100 border border-slate-200 rounded-xl px-4 text-base font-mono focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all placeholder:text-slate-300" />
      <button @click="handlePaste('my')" class="absolute right-2 top-2 p-2 text-slate-300 hover:text-base-content"><i-ph-clipboard-text class="text-xl"/></button>
    </div>
    <div class="relative">
      <input v-model="codeB" placeholder="另一位的代码..." class="w-full h-14 bg-base-100 border border-slate-200 rounded-xl px-4 text-base font-mono focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all placeholder:text-slate-300" />
      <button @click="handlePaste('partner')" class="absolute right-2 top-2 p-2 text-slate-300 hover:text-base-content"><i-ph-clipboard-text class="text-xl"/></button>
    </div>
    
    <div class="space-y-3 pt-2">
      <button @click="handleCompare" class="w-full h-12 bg-slate-900 text-white rounded-xl text-base font-bold hover:bg-black transition-colors shadow-sm">
        对比结果
      </button>
      
      <button @click="showAIModal = true" class="w-full h-12 flex items-center justify-center gap-2 rounded-xl border border-slate-200 text-base font-bold text-slate-600 hover:bg-slate-50 hover:text-base-content hover:border-slate-300 transition-all">
        <i-ph-sparkle-bold class="text-lg" />
        AI分析报告
      </button>
    </div>
  </div>
</div>

           

        <div class="w-full flex justify-center">
  <div 
    @click="router.push('/doc')"
    class="mt-12 inline-flex items-center justify-center gap-2 text-sm font-bold text-slate-400 hover:text-base-content cursor-pointer transition-all duration-300 group"
  >
    <div class="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
      <i-ph-read-cv-logo-bold class="text-lg" />
    </div>
    <span class="border-b border-transparent group-hover:border-base-content pb-0.5">帮助 / 关于</span>
  </div>
</div>

<div class="w-full flex justify-center">
  <div 
    @click="router.push('/review')"
    class="mt-6 inline-flex items-center justify-center gap-2 text-sm font-bold text-primary hover:text-primary cursor-pointer transition-all duration-300 group"
  >
    <div class="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
      <i-ph-hand-heart-duotone class="text-lg" />
    </div>
    <span class="border-b border-transparent group-hover:border-primary pb-0.5">文案纠错！</span>
  </div>
</div>


          </div>
        </div>
      </div>
    </div>

    <div class="py-8 text-center">
      <p class="text-xs text-slate-400 font-mono font-medium tracking-widest uppercase">
        <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh-hans" target="_blank" class="text-slate-400 hover:text-base-content">CC BY-NC-SA 4.0</a> · <a href="https://polycn.org" target="_blank" class="text-slate-400 hover:text-base-content">PolyCN</a>
      </p>
    </div>

    <AIAnalysisModal 
      v-model="showAIModal" 
      :code-a="codeA" 
      :code-b="activeTab === 'single' ? '' : codeB"
    />

<BaseModal 
    v-model="showOverwriteWarning" 
    title="存档冲突提示"
  >
    <div class="space-y-4">
      <div class="flex items-start gap-4 p-4 bg-warning/10 rounded-2xl text-warning-content border border-warning/20">
        <i-ph-warning-circle-bold class="text-2xl shrink-0 mt-0.5" />
        <div class="text-sm text-left">
          <p class="font-bold mb-1">检测到相同头像的存档</p>
          <p class="opacity-90">
            您的本地记录中已经存在头像为 
            <span class="font-bold text-lg mx-1">{{ pendingImportData?.avatar }}</span> 
            的档案。
          </p>
        </div>
      </div>
      <p class="text-sm text-base-content/70 text-left">
        <span v-if="pendingImportAction === 'continue'">
          继续操作将用新代码<span class="font-bold text-error">覆盖</span>您的原有存档。
        </span>
        <span v-else>
          查看结果将<span class="font-bold text-error">替换</span>您当前正在编辑的该头像数据。
        </span>
        如果您希望保留原数据，请先取消。
      </p>
    </div>

    <template #actions>
      <button 
        @click="showOverwriteWarning = false" 
        class="btn btn-ghost text-base-content/60"
      >
        我再想想
      </button>
      <button 
        @click="executeImport(pendingImportData, pendingImportAction)" 
        class="btn btn-error text-white shadow-lg shadow-error/30"
      >
        确认覆盖并{{ pendingImportAction === 'continue' ? '继续' : '查看' }}
      </button>
    </template>
  </BaseModal>
  
</template>

<style scoped>
.animate-fade {
  animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-shake {
  animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
}
@keyframes shake {
  10%, 90% { transform: translate3d(-1px, 0, 0); }
  20%, 80% { transform: translate3d(2px, 0, 0); }
  30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
  40%, 60% { transform: translate3d(4px, 0, 0); }
}
</style>
```:)