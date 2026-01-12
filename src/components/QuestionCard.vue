<script setup lang="ts">
import type { Question } from '../types';
import TriStateButton from './TriStateButton.vue';
import { useConfigStore } from '../stores/useConfigStore';

// 接收父组件传来的“题目数据”
const props = defineProps<{
  question: Question;
}>();

const store = useConfigStore();

// 处理子组件传来的更新
function handleUpdate(val: { optionIndex: number; certainty: any }) {
  store.setAnswer(props.question.id, val.optionIndex, val.certainty);
}
</script>

<template>
  <div class="card w-full bg-base-300 shadow-xl mb-6">
    <div class="card-body p-4">
      <div class="flex items-start justify-between mb-2">
        <h3 class="card-title text-lg">{{ question.title }}</h3>
        <div class="badge badge-outline text-xs opacity-50">{{ question.id }}</div>
      </div>

      <div class="flex flex-col">
        <TriStateButton
          v-for="(opt, index) in question.options"
          :key="index"
          :label="opt"
          :my-index="index"
          :model-value="store.getAnswer(question.id)"
          @update="handleUpdate"
        />
      </div>
    </div>
  </div>
</template>