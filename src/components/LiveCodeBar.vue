<script setup lang="ts">
import { computed } from 'vue';
import { useClipboard } from '@vueuse/core';
import { useConfigStore } from '../stores/useConfigStore';
import { encode } from '../logic/codec';
import questionsData from '../data/questions.json';

const store = useConfigStore();
const { copy, copied } = useClipboard();

// 实时计算当前的 Emoji 代码
const currentCode = computed(() => {
  // ✅ 修复点：直接把 store.answers 传给新版 encode 函数即可
  // 新版 encode 会自动遍历 JSON 题目表，如果 store 里没有的题会自动补 0
  return encode(store.answers);
});

// 计算完成度
const progress = computed(() => {
  const total = questionsData.meta.total_questions;
  // 只要 store.answers 里有记录，就算答过了 (无论选的是拒绝还是同意)
  const answered = Object.keys(store.answers).length;
  // 防止溢出 100%
  return Math.min(Math.round((answered / total) * 100), 100);
});
</script>

<template>
  <div class="fixed bottom-0 left-0 right-0 z-40 px-4 pb-6 pt-2 pointer-events-none flex justify-center safe-area-bottom">
    <div class="pointer-events-auto bg-black/80 backdrop-blur-md text-primary rounded-full px-4 py-2 shadow-2xl border border-primary/30 flex items-center gap-3 max-w-sm w-full animate-slide-up hover:border-primary transition-colors">
      
      <div 
        class="radial-progress text-[10px] font-bold transition-all duration-500" 
        :class="progress === 100 ? 'text-success' : 'text-accent'"
        :style="`--value:${progress}; --size:2rem; --thickness: 3px;`"
      >
        {{ progress }}%
      </div>

      <div class="flex-1 font-mono text-sm tracking-widest overflow-hidden whitespace-nowrap opacity-90 flex flex-col justify-center">
        <div class="text-[8px] opacity-40 leading-none mb-0.5">RELATIONSHIP CODE</div>
        <div class="leading-none">
          <span class="opacity-30">...</span>{{ currentCode.slice(-8) }}
        </div>
      </div>

      <button 
        @click="copy(currentCode)" 
        class="btn btn-circle btn-sm btn-primary border-none shadow-lg group relative overflow-hidden"
        :class="copied ? 'btn-success' : ''"
      >
        <span v-if="copied" class="scale-110">✔</span>
        <span v-else class="group-hover:scale-110 transition-transform">📋</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.animate-slide-up {
  animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes slideUp {
  from { transform: translateY(120%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
/* 适配 iPhone 底部黑条 */
.safe-area-bottom {
  padding-bottom: max(1.5rem, env(safe-area-inset-bottom));
}
</style>