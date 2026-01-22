<script setup lang="ts">
import type { Attitude } from '../types';

// 定义接收的参数
defineProps<{
  attitude: Attitude | number; // 接收态度数值
  size?: string;      // 选填：自定义大小，例如 'text-lg', 'text-xl'
}>();
</script>

<template>
  <span :class="['inline-flex items-center justify-center align-middle', size || 'text-base']">
    
    <i-ph-star-fill v-if="attitude === 4" class="text-warning drop-shadow-sm" />
    
    <i-ph-check-circle-fill v-if="attitude === 3" class="text-success" />
    
    <i-ph-question-fill v-if="attitude === 2" class="text-warning opacity-80" />
    
    <i-ph-prohibit-inset-fill v-if="attitude === 1" class="text-error" />
    
    <i-ph-circle v-if="attitude === 0" class="opacity-20" />
    
  </span>
</template>