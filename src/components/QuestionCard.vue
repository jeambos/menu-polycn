<script setup lang="ts">
import { useConfigStore } from '../stores/useConfigStore';
import QuadStateButton from './QuadStateButton.vue';
import type { Question, Attitude } from '../types';

const props = defineProps<{
  question?: Question; // ⚠️ 改为可选，防止父组件传空时直接炸裂
}>();

const emit = defineEmits<{
  (e: 'answer', optIndex: number, value: Attitude): void
}>();

const store = useConfigStore();

// ✅ 修复：严谨的空值检查，解决 TS 报错
function getLocalAnswer(idx: number): Attitude {
  // 如果没有题目信息，或者 store 里没数据，直接返回 0
  if (!props.question || !store.answers) return 0;
  
  const qId = props.question.id;
  const qAnswers = store.answers[qId];
  
  // 如果这道题没答过
  if (!qAnswers) return 0;
  
  return qAnswers[idx] || 0;
}
</script>

<template>
  <div v-if="question" class="card bg-base-100 shadow-xl border border-base-200 overflow-visible">
    <div class="card-body p-5">
      
      <h2 class="card-title text-xl font-bold mb-2">{{ question.title }}</h2>
      
      <p 
        v-if="question.description" 
        class="text-sm opacity-70 mb-6 leading-relaxed"
      >
        {{ question.description }}
      </p>

      <div class="flex flex-col gap-4 animate-fade-in-up">
        <div 
          v-for="(opt, idx) in question.options" 
          :key="idx" 
          class="flex flex-col gap-1.5"
        >
          <span class="text-sm font-bold opacity-80 px-1 ml-1">
            {{ typeof opt === 'string' ? opt : opt.long }}
          </span>
          
          <QuadStateButton 
            :model-value="getLocalAnswer(idx)"
            @update:model-value="(val) => emit('answer', idx, val)"
          />
        </div>
      </div>

    </div>
  </div>
  <div v-else class="text-center p-10 opacity-50">
    题目数据加载异常...
  </div>
</template>

<style scoped>
.animate-fade-in-up {
  animation: fadeInUp 0.4s ease-out forwards;
}
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>