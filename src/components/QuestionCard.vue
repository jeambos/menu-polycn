<script setup lang="ts">
import type { Question, Attitude } from '../types';
import QuadStateButton from './QuadStateButton.vue';
import { useConfigStore } from '../stores/useConfigStore';

const props = defineProps<{
  question: Question;
}>();

const store = useConfigStore();

// 获取当前态度的辅助函数
function getAttitude(optIndex: number): Attitude {
  const states = store.getQuestionState(props.question.id);
  return states[optIndex] || 0;
}

// 更新态度的辅助函数
function updateAttitude(optIndex: number, val: number) {
  store.setOptionAttitude(props.question.id, optIndex, val as Attitude);
}
</script>

<template>
  <div class="card w-full bg-base-100 shadow-xl border border-base-content/5">
    <div class="card-body p-4">
      <div class="flex items-start justify-between mb-4">
        <h3 class="font-bold text-lg">{{ question.title }}</h3>
        <span class="text-[10px] opacity-30 font-mono">{{ question.id }}</span>
      </div>

      <div class="space-y-5"> <div v-for="(opt, index) in question.options" :key="index">
          
          <div class="text-sm mb-1.5 px-1 opacity-90">
            {{ opt }}
          </div>

          <QuadStateButton
            :model-value="getAttitude(index)"
            @update:model-value="(val) => updateAttitude(index, val)"
          />

        </div>
      </div>

    </div>
  </div>
</template>