<script setup lang="ts">
import type { Module } from '../types';

defineProps<{
  module: Module;
  modelValue: boolean; // 开关状态
}>();

defineEmits(['update:modelValue']); // 允许父组件修改开关
</script>

<template>
  <div class="card bg-base-200 shadow-sm border border-base-content/10 mb-4 transition-all hover:border-primary/50">
    <div class="card-body p-4 flex flex-row items-center justify-between">
      <div class="flex-1 pr-4">
        <h3 class="card-title text-base">
          {{ module.name }}
          <span v-if="module.id === 'core'" class="badge badge-xs badge-primary">必选</span>
        </h3>
        <p class="text-xs opacity-60 mt-1">{{ module.description }}</p>
        <div class="text-[10px] opacity-40 mt-2">包含 {{ module.questions.length }} 道题</div>
      </div>

      <div class="flex-none">
        <input 
          type="checkbox" 
          class="toggle toggle-primary"
          :checked="modelValue"
          :disabled="module.id === 'core'" 
          @change="$emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
        />
      </div>
    </div>
  </div>
</template>