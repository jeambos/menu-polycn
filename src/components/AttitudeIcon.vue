<script setup lang="ts">
import type { Attitude } from '../types';

defineProps<{
  attitude: Attitude;
  size?: string; // 允许自定义大小，如 'text-lg'
}>();

// 图标映射逻辑
// 我们使用 Phosphor Icons (ph)
// 4 (核心): Star (Fill) - 实心星星
// 3 (可接受): CheckCircle - 圆圈对勾
// 2 (待商议): Question - 问号
// 1 (硬边界): Prohibit - 禁止符号
</script>

<template>
  <span :class="['inline-flex items-center justify-center', size || 'text-base']">
    
    <icon-ph-star-fill v-if="attitude === 4" class="text-warning drop-shadow-sm" />
    
    <icon-ph-check-circle-fill v-if="attitude === 3" class="text-success" />
    
    <icon-ph-question-fill v-if="attitude === 2" class="text-warning opacity-80" />
    
    <icon-ph-prohibit-inset-fill v-if="attitude === 1" class="text-error" />
    
    <icon-ph-circle v-if="attitude === 0" class="opacity-20" />
    
  </span>
</template>