<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useClipboard } from '@vueuse/core';
import { useConfigStore } from '../stores/useConfigStore';
import { decode } from '../logic/codec';
import type { Attitude } from '../types'; // ✅ 引入类型
import DocArticle from '../components/DocArticle.vue';

const router = useRouter();
const store = useConfigStore();
const { text, isSupported } = useClipboard();

// --- 状态 ---
const activeTab = ref<'single' | 'dual'>('single');
const singleCode = ref('');
const myCode = ref('');
const partnerCode = ref('');
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
    if (target === 'single') singleCode.value = content;
    if (target === 'my') myCode.value = content;
    if (target === 'partner') partnerCode.value = content;
  } else {
    triggerError('无法读取剪贴板');
  }
}

function goSystem() {
  router.push('/setup'); 
}

function handleSingleView() {
  if (!isValid(singleCode.value)) return triggerError('请输入代码');
  
  const data = decode(singleCode.value);
  if (data) {
    // ✅ 修复：强制类型断言
    store.answers = data.answers as Record<string, Attitude[]>;
    store.targetAvatar = data.avatar;
    router.push('/result');
  } else {
    triggerError('代码无效');
  }
}

function handleSingleContinue() {
  if (!isValid(singleCode.value)) return triggerError('请输入代码');
  
  const data = decode(singleCode.value);
  if (data) {
    store.targetAvatar = data.avatar;
    
    // ✅ 修复：强制类型断言
    const typedAnswers = data.answers as Record<string, Attitude[]>;
    
    store.answers = typedAnswers;
    
    if (!store.profiles[data.avatar]) {
      store.profiles[data.avatar] = {};
    }
    // ✅ 修复：这里也使用断言后的数据
    store.profiles[data.avatar] = typedAnswers;
    
    router.push('/setup');
  } else {
    triggerError('代码无效');
  }
}

function handleCompare() {
  const hasMy = isValid(myCode.value);
  const hasPartner = isValid(partnerCode.value);

  if (hasMy && hasPartner) {
    // 两个都有：进入双人对比
    router.push({
      path: '/compare',
      query: { my: myCode.value, partner: partnerCode.value }
    });
  } else if (hasMy || hasPartner) {
    // 只有一个：进入单人结果页
    router.push({
      path: '/result',
      query: { code: hasMy ? myCode.value : partnerCode.value }
    });
  } else {
    // 都没有
    triggerError('需填入代码');
  }
}

</script>

<template>
  <div class="min-h-screen bg-base-100 text-base-content flex flex-col font-sans selection:bg-primary selection:text-primary-content transition-colors duration-300">

    <div class="flex-1 flex flex-col items-center justify-center px-6 w-full max-w-2xl mx-auto mt-6 space-y-12">
      
        
      

      <div class="w-full animate-fade">
        <DocArticle />
      </div>

      <div class="w-full space-y-10">
        
        <button 
  @click="goSystem"
  class="group w-full max-w-sm mx-auto h-16 bg-primary text-primary-content rounded-2xl text-xl font-bold flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/20"
>
  <span>进入系统</span>
  <i-ph-arrow-right-bold class="text-2xl group-hover:translate-x-1 transition-transform" />
</button>

        <div class="relative flex items-center py-2 max-w-sm mx-auto ">
          <div class="flex-grow border-t border-slate-100"></div>
          <span class="flex-shrink-0 mx-4 text-xs font-bold text-slate-300 uppercase tracking-widest">Import</span>
          <div class="flex-grow border-t border-slate-100"></div>
        </div>

        <div class="w-full max-w-sm mx-auto ">
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
        v-model="singleCode" 
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
        <button @click="$emit('open-ai')" class="h-12 flex items-center justify-center gap-2 rounded-xl border border-slate-200 text-base font-bold text-slate-600 hover:bg-slate-50 hover:text-base-content hover:border-slate-300 transition-all">
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
      <input v-model="myCode" placeholder="你的结果代码..." class="w-full h-14 bg-base-100 border border-slate-200 rounded-xl px-4 text-base font-mono focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all placeholder:text-slate-300" />
      <button @click="handlePaste('my')" class="absolute right-2 top-2 p-2 text-slate-300 hover:text-base-content"><i-ph-clipboard-text class="text-xl"/></button>
    </div>
    <div class="relative">
      <input v-model="partnerCode" placeholder="另一位的代码..." class="w-full h-14 bg-base-100 border border-slate-200 rounded-xl px-4 text-base font-mono focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all placeholder:text-slate-300" />
      <button @click="handlePaste('partner')" class="absolute right-2 top-2 p-2 text-slate-300 hover:text-base-content"><i-ph-clipboard-text class="text-xl"/></button>
    </div>
    
    <div class="space-y-3 pt-2">
      <button @click="handleCompare" class="w-full h-12 bg-slate-900 text-white rounded-xl text-base font-bold hover:bg-black transition-colors shadow-sm">
        对比结果
      </button>
      
      <button @click="$emit('open-ai')" class="w-full h-12 flex items-center justify-center gap-2 rounded-xl border border-slate-200 text-base font-bold text-slate-600 hover:bg-slate-50 hover:text-base-content hover:border-slate-300 transition-all">
        <i-ph-sparkle-bold class="text-lg" />
        AI分析报告
      </button>
    </div>
  </div>
</div>

            
          </div>
        </div>
      </div>
    </div>

    <div class="py-8 text-center mt-16">
      <p class="text-xs text-slate-400 font-mono font-medium tracking-widest uppercase">
        CC BY-NC-SA 4.0 · PolyCN
      </p>
    </div>


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