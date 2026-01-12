<script setup lang="ts">
import { computed } from 'vue';
import confetti from 'canvas-confetti';
import type { Attitude } from '../types';

const props = defineProps<{
  modelValue: Attitude; // 当前这一项的态度 (0-4)
}>();

const emit = defineEmits(['update:modelValue']);

// 处理点击
function handleClick(val: Attitude, event?: MouseEvent) {
  // 逻辑：如果点击的是当前已选中的，则“反选”回 0
  if (props.modelValue === val) {
    emit('update:modelValue', 0);
  } else {
    emit('update:modelValue', val);
    
    // 如果是核心需求，放个烟花
    if (val === 4 && event) {
      triggerConfetti(event);
    }
  }
}

function triggerConfetti(event: MouseEvent) {
  const rect = (event.target as HTMLElement).getBoundingClientRect();
  const x = (rect.left + rect.width / 2) / window.innerWidth;
  const y = (rect.top + rect.height / 2) / window.innerHeight;
  confetti({
    particleCount: 40,
    spread: 60,
    origin: { x, y },
    colors: ['#00FFFF', '#FF00FF']
  });
}
</script>

<template>
  <div class="flex w-full h-9 rounded-md overflow-hidden border border-base-content/10 shadow-sm select-none">
    
    <button 
      class="flex-1 flex items-center justify-center transition-all active:scale-95"
      :class="modelValue === 1 ? 'bg-error text-error-content font-bold' : 'bg-base-200 hover:bg-base-300 opacity-60'"
      @click="handleClick(1)"
    >
      <span class="text-sm">⛔</span>
    </button>

    <button 
      class="flex-1 flex items-center justify-center border-l border-base-100 transition-all active:scale-95"
      :class="modelValue === 2 ? 'bg-warning text-warning-content font-bold' : 'bg-base-200 hover:bg-base-300 opacity-60'"
      @click="handleClick(2)"
    >
      <span class="text-sm">❔</span>
    </button>

    <button 
      class="flex-1 flex items-center justify-center border-l border-base-100 transition-all active:scale-95"
      :class="modelValue === 3 ? 'bg-success text-success-content font-bold' : 'bg-base-200 hover:bg-base-300 opacity-60'"
      @click="handleClick(3)"
    >
      <span class="text-sm">👌</span>
    </button>

    <button 
      class="flex-1 flex items-center justify-center border-l border-base-100 transition-all active:scale-95"
      :class="modelValue === 4 ? 'bg-accent text-accent-content font-bold' : 'bg-base-200 hover:bg-base-300 opacity-60'"
      @click="handleClick(4, $event)"
    >
      <span class="text-sm">⭐</span>
    </button>

  </div>
</template>