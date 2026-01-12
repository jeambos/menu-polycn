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
  // 必须严格按照题目顺序构建数组
  const answerArr: any[] = [];
  questionsData.modules.forEach(m => {
    m.questions.forEach(q => {
      const record = store.getAnswer(q.id);
      if (record) {
        answerArr.push({ option: record.optionIndex, certainty: record.certainty });
      } else {
        answerArr.push({ option: 0, certainty: 0 }); // 没做填0
      }
    });
  });
  return encode(answerArr);
});

// 计算完成度
const progress = computed(() => {
  const total = questionsData.meta.total_questions;
  const answered = Object.keys(store.answers).length;
  return Math.round((answered / total) * 100);
});
</script>

<template>
  <div class="fixed bottom-0 left-0 right-0 z-40 px-4 pb-4 pt-2 pointer-events-none flex justify-center">
    <div class="pointer-events-auto bg-black/80 backdrop-blur-md text-primary rounded-full px-4 py-2 shadow-2xl border border-primary/30 flex items-center gap-3 max-w-sm w-full animate-slide-up">
      
      <div class="radial-progress text-[10px] text-accent" :style="`--value:${progress}; --size:2rem;`">
        {{ progress }}%
      </div>

      <div class="flex-1 font-mono text-sm tracking-widest overflow-hidden whitespace-nowrap opacity-80">
        <span class="opacity-30">...</span>{{ currentCode.slice(-8) }}
      </div>

      <button 
        @click="copy(currentCode)" 
        class="btn btn-circle btn-xs btn-primary"
        :class="copied ? 'btn-success' : ''"
      >
        <span v-if="copied">✔</span>
        <span v-else>📋</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.animate-slide-up {
  animation: slideUp 0.5s ease-out;
}
@keyframes slideUp {
  from { transform: translateY(100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
</style>