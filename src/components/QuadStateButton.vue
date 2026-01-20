<script setup lang="ts">
import { watch, nextTick } from 'vue';
import confetti from 'canvas-confetti';
import type { Attitude } from '../types';

const props = defineProps<{
  modelValue: Attitude; // 当前这一项的态度 (0-4)
}>();

const emit = defineEmits(['update:modelValue']);

// 处理点击
function handleClick(val: Attitude) {
  // 如果点击当前已选的，则反选回 0
  if (props.modelValue === val) {
    emit('update:modelValue', 0);
  } else {
    emit('update:modelValue', val);
  }
}

// 监听值变化，如果是变成了“核心需求”，则触发烟花
// 这样设计是为了配合父组件的“拦截弹窗”逻辑：
// 点击 -> 父组件拦截 -> 弹窗 -> 用户确认 -> 父组件更新 props -> 触发这里的 watch -> 放烟花
watch(() => props.modelValue, (newVal) => {
  if (newVal === 4) {
    nextTick(() => {
      const btn = document.getElementById(`btn-star-${getCurrentInstance()?.uid}`);
      if (btn) triggerStarConfetti(btn);
    });
  }
});

import { getCurrentInstance } from 'vue';
const uid = getCurrentInstance()?.uid;

function triggerStarConfetti(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  // 计算元素中心在屏幕的相对位置
  const x = (rect.left + rect.width / 2) / window.innerWidth;
  const y = (rect.top + rect.height / 2) / window.innerHeight;

  confetti({
    particleCount: 20,    // 减少数量，更精致
    spread: 70,           // 扩散范围
    startVelocity: 25,    // 喷射速度更快
    decay: 0.92,          // 消失更快
    gravity: 1.2,         // 重力感更强
    origin: { x, y },
    shapes: ['star'],     // ⭐ 关键：使用星星形状
    colors: ['#FFD700', '#FFA500', '#FFFFFF'], // 金、橙、白
    disableForReducedMotion: true
  });
}
</script>

<template>
  <div class="flex w-full h-11 rounded-xl overflow-hidden border border-base-content/10 shadow-sm select-none bg-base-100">
    
    <button 
      class="flex-1 flex items-center justify-center transition-all duration-200 active:scale-90 group"
      :class="modelValue === 1 ? 'bg-error text-error-content' : 'hover:bg-error/10'"
      @click="handleClick(1)"
    >
      <icon-ph-prohibit-inset-fill v-if="modelValue === 1" class="text-xl" />
      <icon-ph-prohibit v-else class="text-xl opacity-40 group-hover:opacity-100 text-error transition-opacity" />
    </button>

    <button 
      class="flex-1 flex items-center justify-center border-l border-base-content/5 transition-all duration-200 active:scale-90 group"
      :class="modelValue === 2 ? 'bg-warning text-warning-content' : 'hover:bg-warning/10'"
      @click="handleClick(2)"
    >
      <icon-ph-question-fill v-if="modelValue === 2" class="text-xl" />
      <icon-ph-question v-else class="text-xl opacity-40 group-hover:opacity-100 text-warning transition-opacity" />
    </button>

    <button 
      class="flex-1 flex items-center justify-center border-l border-base-content/5 transition-all duration-200 active:scale-90 group"
      :class="modelValue === 3 ? 'bg-success text-success-content' : 'hover:bg-success/10'"
      @click="handleClick(3)"
    >
      <icon-ph-check-circle-fill v-if="modelValue === 3" class="text-xl" />
      <icon-ph-check-circle v-else class="text-xl opacity-40 group-hover:opacity-100 text-success transition-opacity" />
    </button>

    <button 
      :id="`btn-star-${uid}`"
      class="flex-1 flex items-center justify-center border-l border-base-content/5 transition-all duration-200 active:scale-90 group"
      :class="modelValue === 4 ? 'bg-[#FFD700] text-white' : 'hover:bg-[#FFD700]/10'"
      @click="handleClick(4)"
    >
      <icon-ph-star-fill v-if="modelValue === 4" class="text-xl drop-shadow-sm" />
      <icon-ph-star v-else class="text-xl opacity-40 group-hover:opacity-100 text-[#FFD700] transition-opacity" />
    </button>

  </div>
</template>