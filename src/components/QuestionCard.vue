<script setup lang="ts">
import { useConfigStore } from '../stores/useConfigStore';
import QuadStateButton from './QuadStateButton.vue';
import type { Question, Attitude } from '../types';

const props = defineProps<{
  question?: Question; // ⚠️ 改为可选
}>();

const emit = defineEmits<{
  (e: 'answer', optIndex: number, value: Attitude): void
}>();

const store = useConfigStore();

// ✅ 严谨的空值检查
function getLocalAnswer(idx: number): Attitude {
  if (!props.question || !store.answers) return 0;
  
  const qId = props.question.id;
  const qAnswers = store.answers[qId];
  
  if (!qAnswers) return 0;
  
  return qAnswers[idx] || 0;
}
</script>

<template>
  <div v-if="question" class="card bg-base-100 border border-base-content/10 rounded-[2rem] overflow-visible">
    <div class="card-body p-2">
      
      <h2 class="card-title text-xl font-bold mb-3 text-base-content px-2">
        {{ question.title }}
      </h2>
      
      <p 
        v-if="question.description" 
        class="text-base opacity-80 mb-8 leading-7"
      >
        {{ question.description }}
      </p>

      <div class="flex flex-col gap-8 animate-fade-in-up">
        <div 
          v-for="(opt, idx) in question.options" 
          :key="idx" 
          class="flex flex-col gap-3"
        >
          <span class="text-lg font-bold text-base-content px-1 ml-1">
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