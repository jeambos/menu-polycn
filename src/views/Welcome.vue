<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useClipboard } from '@vueuse/core';
import { useConfigStore } from '../stores/useConfigStore';
import { decode } from '../logic/codec';
import type { Attitude } from '../types'; // ✅ 引入类型

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
  <div class="min-h-screen bg-white text-slate-900 flex flex-col font-sans selection:bg-black selection:text-white">

    <div class="flex-1 flex flex-col items-center justify-center px-6 w-full max-w-md mx-auto space-y-12">
      
      <div class="text-center space-y-6">
        <div class="inline-flex items-center justify-center w-auto h-auto mb-6 opacity-90 hover:opacity-100 transition-opacity duration-500">
          <svg width="480" height="360" viewBox="0 0 320 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <filter id="fader-shadow" x="-50%" y="-20%" width="200%" height="150%">
                <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.1"/>
              </filter>
            </defs>

            <path d="M0 40H320 M0 100H320 M0 160H320" stroke="#F1F5F9" stroke-width="1" stroke-dasharray="4 4"/>

            <g id="tracks">
              <line x1="60" y1="30" x2="60" y2="170" stroke="#E2E8F0" stroke-width="4" stroke-linecap="round"/>
              <g fill="#94A3B8">
                 <rect x="45" y="40" width="6" height="1"/>
                 <rect x="45" y="70" width="6" height="1"/>
                 <rect x="45" y="100" width="10" height="1"/> <rect x="45" y="130" width="6" height="1"/>
                 <rect x="45" y="160" width="6" height="1"/>
              </g>

              <line x1="130" y1="30" x2="130" y2="170" stroke="#E2E8F0" stroke-width="4" stroke-linecap="round"/>
              <g fill="#94A3B8">
                 <rect x="115" y="40" width="6" height="1"/>
                 <rect x="115" y="70" width="6" height="1"/>
                 <rect x="115" y="100" width="10" height="1"/>
                 <rect x="115" y="130" width="6" height="1"/>
                 <rect x="115" y="160" width="6" height="1"/>
              </g>

              <line x1="200" y1="30" x2="200" y2="170" stroke="#E2E8F0" stroke-width="4" stroke-linecap="round"/>
              <g fill="#94A3B8">
                 <rect x="185" y="40" width="6" height="1"/>
                 <rect x="185" y="70" width="6" height="1"/>
                 <rect x="185" y="100" width="10" height="1"/>
                 <rect x="185" y="130" width="6" height="1"/>
                 <rect x="185" y="160" width="6" height="1"/>
              </g>

              <line x1="270" y1="30" x2="270" y2="170" stroke="#E2E8F0" stroke-width="4" stroke-linecap="round"/>
              <g fill="#94A3B8">
                 <rect x="255" y="40" width="6" height="1"/>
                 <rect x="255" y="70" width="6" height="1"/>
                 <rect x="255" y="100" width="10" height="1"/>
                 <rect x="255" y="130" width="6" height="1"/>
                 <rect x="255" y="160" width="6" height="1"/>
              </g>
            </g>

            <g transform="translate(60, 140)" filter="url(#fader-shadow)">
              <rect x="-14" y="-8" width="28" height="16" rx="4" fill="white" stroke="#1E293B" stroke-width="2"/>
              <line x1="-6" y1="0" x2="6" y2="0" stroke="#1E293B" stroke-width="2" stroke-linecap="round"/>
            </g>

            <g transform="translate(130, 60)" filter="url(#fader-shadow)">
              <rect x="-14" y="-8" width="28" height="16" rx="4" fill="#1E293B" stroke="#1E293B" stroke-width="2"/>
              <line x1="-6" y1="0" x2="6" y2="0" stroke="white" stroke-width="2" stroke-linecap="round"/>
            </g>

            <g transform="translate(200, 100)" filter="url(#fader-shadow)">
               <rect x="-14" y="-8" width="28" height="16" rx="4" fill="white" stroke="#1E293B" stroke-width="2"/>
               <line x1="-6" y1="0" x2="6" y2="0" stroke="#1E293B" stroke-width="2" stroke-linecap="round"/>
            </g>

            <g transform="translate(270, 50)" filter="url(#fader-shadow)">
               <rect x="-14" y="-8" width="28" height="16" rx="4" fill="white" stroke="#1E293B" stroke-width="2"/>
               <line x1="-6" y1="0" x2="6" y2="0" stroke="#1E293B" stroke-width="2" stroke-linecap="round"/>
            </g>
            
          </svg>
        </div>
        
        <div class="space-y-3">
          <h1 class="text-4xl font-black tracking-tighter text-black">
            关系配置单
          </h1>
          <p class="text-slate-500 font-medium text-base tracking-wide">
            探索自身需求 / 理解彼此偏好
          </p>
        </div>
      </div>

      <div class="w-full space-y-10">
        
        <button 
          @click="goSystem"
          class="group w-full h-16 bg-black text-white rounded-2xl text-xl font-bold flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-black/10"
        >
          <span>进入系统</span>
          <icon-ph-arrow-right class="text-2xl group-hover:translate-x-1 transition-transform" />
        </button>

        <div class="relative flex items-center py-2">
          <div class="flex-grow border-t border-slate-100"></div>
          <span class="flex-shrink-0 mx-4 text-xs font-bold text-slate-300 uppercase tracking-widest">Import</span>
          <div class="flex-grow border-t border-slate-100"></div>
        </div>

        <div class="w-full">
          <div class="grid grid-cols-2 p-1.5 bg-slate-50 rounded-2xl mb-6">
            <button 
              class="py-3 text-base font-bold rounded-xl transition-all duration-200"
              :class="activeTab === 'single' ? 'bg-white text-black shadow-sm' : 'text-slate-400 hover:text-slate-600'"
              @click="activeTab = 'single'"
            >
              单人导入
            </button>
            <button 
              class="py-3 text-base font-bold rounded-xl transition-all duration-200"
              :class="activeTab === 'dual' ? 'bg-white text-black shadow-sm' : 'text-slate-400 hover:text-slate-600'"
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
                  placeholder="粘贴结果代码...(一串Emoji)" 
                  class="w-full h-14 bg-white border border-slate-200 rounded-xl px-4 text-base font-mono focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all placeholder:text-slate-300"
                  :class="{ 'border-red-500 text-red-500': errorMsg }"
                />
                <button @click="handlePaste('single')" class="absolute right-3 top-3 p-2 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-black transition-colors">
                  <icon-ph-clipboard-text class="text-xl"/>
                </button>
              </div>
              
              <div class="grid grid-cols-2 gap-4">
                <button @click="handleSingleView" class="h-12 rounded-xl border border-slate-200 text-base font-bold text-slate-600 hover:bg-slate-50 hover:text-black hover:border-slate-300 transition-all">
                  仅解读
                </button>
                <button @click="handleSingleContinue" class="h-12 rounded-xl border border-slate-200 text-base font-bold text-slate-600 hover:bg-slate-50 hover:text-black hover:border-slate-300 transition-all">
                  继续答题
                </button>
              </div>
            </div>

            <div v-if="activeTab === 'dual'" class="space-y-4 animate-fade">
              <div class="relative">
                <input v-model="myCode" placeholder="你的结果代码" class="w-full h-12 bg-white border border-slate-200 rounded-xl px-4 text-base font-mono focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all placeholder:text-slate-300" />
                <button @click="handlePaste('my')" class="absolute right-2 top-2 p-2 text-slate-300 hover:text-black"><icon-ph-clipboard-text class="text-xl"/></button>
              </div>
              <div class="relative">
                <input v-model="partnerCode" placeholder="另一位的代码" class="w-full h-12 bg-white border border-slate-200 rounded-xl px-4 text-base font-mono focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all placeholder:text-slate-300" />
                <button @click="handlePaste('partner')" class="absolute right-2 top-2 p-2 text-slate-300 hover:text-black"><icon-ph-clipboard-text class="text-xl"/></button>
              </div>
              <button @click="handleCompare" class="w-full h-12 mt-2 bg-slate-900 text-white rounded-xl text-base font-bold hover:bg-black transition-colors">
                开始对比分析
              </button>
            </div>
            
            <div v-if="errorMsg" class="absolute -bottom-10 left-0 right-0 text-center text-red-500 text-sm font-bold animate-shake">
              {{ errorMsg }}
            </div>

           

        <div class="w-full flex justify-center">
  <div 
    @click="router.push('/doc')"
    class="mt-12 inline-flex items-center justify-center gap-2 text-sm font-bold text-slate-400 hover:text-black cursor-pointer transition-all duration-300 group"
  >
    <div class="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
      <i-ph-read-cv-logo-bold class="text-lg" />
    </div>
    <span class="border-b border-transparent group-hover:border-black pb-0.5">帮助 / 关于</span>
  </div>
</div>


          </div>
        </div>
      </div>
    </div>

    <div class="py-8 text-center">
      <p class="text-xs text-slate-400 font-mono font-medium tracking-widest uppercase">
        CC BY-NC-SA 4.0 · PolyCN
      </p>
    </div>

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