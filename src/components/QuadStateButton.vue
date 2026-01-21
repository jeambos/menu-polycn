<script setup lang="ts">
import { watch, nextTick, getCurrentInstance } from 'vue';
import confetti from 'canvas-confetti';
import type { Attitude } from '../types';

// 引入图形符号
import IconXBold from '~icons/ph/x-bold';
import IconQuestionBold from '~icons/ph/question-bold';
import IconCheckBold from '~icons/ph/check-bold';
import IconStarFill from '~icons/ph/star-fill';
import IconStarBold from '~icons/ph/star-bold';

const props = defineProps<{
  modelValue: Attitude; 
}>();

const emit = defineEmits(['update:modelValue']);
const uid = getCurrentInstance()?.uid;

function handleClick(val: Attitude) {
  if (props.modelValue === val) {
    emit('update:modelValue', 0);
  } else {
    emit('update:modelValue', val);
  }
}

// 监听金星特效
watch(() => props.modelValue, (newVal) => {
  if (newVal === 4) {
    nextTick(() => {
      const btn = document.getElementById(`btn-star-${uid}`);
      if (btn) triggerStarConfetti(btn);
    });
  }
});

// ⚡️ 短促精致的烟花参数
function triggerStarConfetti(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  const x = (rect.left + rect.width / 2) / window.innerWidth;
  const y = (rect.top + rect.height / 2) / window.innerHeight;

  confetti({
    particleCount: 18,    
    spread: 45,           
    startVelocity: 20,    
    decay: 0.9,          
    gravity: 2.0,         
    ticks: 60,            // 极短时间
    origin: { x, y },
    shapes: ['star'],     
    colors: ['#F59E0B', '#FFFBEB', '#D97706'], 
    disableForReducedMotion: true
  });
}
</script>

<template>
  <div class="flex w-full h-14 rounded-2xl overflow-hidden bg-base-100/40 select-none relative">
    
    <button 
      class="group flex-1 relative flex items-center justify-center cursor-pointer focus:outline-none border-r border-base-content/5"
      @click="handleClick(1)"
    >
      <div 
        class="absolute w-[85%] h-[72%] rounded-xl transition-all duration-200 ease-out"
        :class="modelValue === 1 
          ? 'bg-error/10 scale-100 opacity-100' // 选中：淡红水彩
          : 'bg-transparent scale-90 opacity-0'
        "
      ></div>

      <div class="relative z-10 transition-transform duration-200" :class="{ 'animate-stamp': modelValue === 1 }">
        <IconXBold 
          class="text-xl transition-all duration-200"
          :class="modelValue === 1 
            ? 'text-error drop-shadow-sm scale-110' 
            : 'text-error/40 opacity-60 group-hover:opacity-100 group-hover:scale-110'
          "
        />
      </div>
    </button>

    <button 
      class="group flex-1 relative flex items-center justify-center cursor-pointer focus:outline-none border-r border-base-content/5"
      @click="handleClick(2)"
    >
      <div 
        class="absolute w-[85%] h-[72%] rounded-xl transition-all duration-200 ease-out"
        :class="modelValue === 2 
          ? 'bg-warning/10 scale-100 opacity-100' // 选中：淡黄水彩
          : 'bg-transparent scale-90 opacity-0'
        "
      ></div>

      <div class="relative z-10 transition-transform duration-200 active:scale-90">
        <IconQuestionBold 
          class="text-xl transition-all duration-200"
          :class="modelValue === 2 
            ? 'text-base-content drop-shadow-sm scale-110' 
            : 'text-base-content/30 opacity-60 group-hover:opacity-100 group-hover:scale-110'
          "
        />
      </div>
    </button>

    <button 
      class="group flex-1 relative flex items-center justify-center cursor-pointer focus:outline-none border-r border-base-content/5"
      @click="handleClick(3)"
    >
      <div 
        class="absolute w-[85%] h-[72%] rounded-xl transition-all duration-200 ease-out"
        :class="modelValue === 3 
          ? 'bg-success/10 scale-100 opacity-100' // 选中：淡绿水彩
          : 'bg-transparent scale-90 opacity-0'
        "
      ></div>

      <div class="relative z-10 transition-transform duration-200 active:scale-90">
        <IconCheckBold 
          class="text-xl transition-all duration-200"
          :class="modelValue === 3 
            ? 'text-success drop-shadow-sm scale-110' 
            : 'text-success/40 opacity-60 group-hover:opacity-100 group-hover:scale-110'
          "
        />
      </div>
    </button>

    <button 
      :id="`btn-star-${uid}`"
      class="group flex-1 relative flex items-center justify-center cursor-pointer focus:outline-none"
      @click="handleClick(4)"
    >
      <div 
        class="absolute w-[85%] h-[72%] rounded-xl transition-all duration-300 ease-out shadow-sm border border-white/5"
        :class="modelValue === 4 
          ? 'bg-gradient-to-br from-gray-700 via-gray-900 to-black scale-100 opacity-100' // 选中：悬浮黑曜石
          : 'bg-transparent scale-90 opacity-0'
        "
      ></div>

      <div class="relative z-10 transition-transform duration-200 active:scale-110">
        <component 
          :is="modelValue === 4 ? IconStarFill : IconStarBold"
          class="text-xl transition-all duration-200"
          :class="modelValue === 4 
            ? 'text-amber-400 drop-shadow-glow-gold scale-110' // 金色 + 发光
            : 'text-amber-500/50 opacity-60 group-hover:opacity-100 group-hover:scale-110'
          "
        />
      </div>
    </button>

  </div>
</template>

<style scoped>
/* 💥 盖章动画 */
@keyframes stamp {
  0% { transform: scale(2.5); opacity: 0; }
  40% { transform: scale(0.8); opacity: 1; }
  60% { transform: scale(1.1); }
  100% { transform: scale(1.1); } /* 保持最终放大一点的状态 */
}

.animate-stamp {
  animation: stamp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* 🔦 黑色背景下的金色光晕 */
.drop-shadow-glow-gold {
  filter: drop-shadow(0 0 4px rgba(245, 158, 11, 0.5));
}
</style>