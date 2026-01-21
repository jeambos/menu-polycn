<script setup lang="ts">
import { watch, nextTick, getCurrentInstance } from 'vue';
import confetti from 'canvas-confetti';
import type { Attitude } from '../types';

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

// 监听变更为 4 时触发烟花
watch(() => props.modelValue, (newVal) => {
  if (newVal === 4) {
    nextTick(() => {
      const btn = document.getElementById(`btn-star-${uid}`);
      if (btn) triggerStarConfetti(btn);
    });
  }
});

function triggerStarConfetti(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  const x = (rect.left + rect.width / 2) / window.innerWidth;
  const y = (rect.top + rect.height / 2) / window.innerHeight;

  confetti({
    particleCount: 25,    
    spread: 60,           
    startVelocity: 30,    
    decay: 0.9,          
    gravity: 1.5,         
    origin: { x, y },
    shapes: ['star'],     
    colors: ['#F59E0B', '#FCD34D', '#FFFFFF', '#B45309'], 
    disableForReducedMotion: true
  });
}
</script>

<template>
  <div class="flex w-full h-11 rounded-xl overflow-hidden border border-base-content/10 shadow-sm select-none bg-base-100/50">
    
    <button 
      class="flex-1 flex items-center justify-center transition-all duration-300 active:scale-95 group relative overflow-hidden"
      @click="handleClick(1)"
    >
      <div 
        class="absolute inset-0 bg-gradient-to-br from-rose-400 to-red-600 transition-opacity duration-300"
        :class="modelValue === 1 ? 'opacity-100' : 'opacity-0 group-hover:opacity-10'"
      ></div>

      <div class="relative z-10">
        <i-ph-prohibit-inset-fill v-if="modelValue === 1" class="text-xl text-white drop-shadow-md animate-bounce-short" />
        <i-ph-prohibit v-else class="text-xl opacity-30 group-hover:opacity-100 text-red-500 transition-opacity" />
      </div>
    </button>

    <button 
      class="flex-1 flex items-center justify-center border-l border-base-content/5 transition-all duration-300 active:scale-95 group relative overflow-hidden"
      @click="handleClick(2)"
    >
      <div 
        class="absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-500 transition-opacity duration-300"
        :class="modelValue === 2 ? 'opacity-100' : 'opacity-0 group-hover:opacity-10'"
      ></div>

      <div class="relative z-10">
        <i-ph-question-fill v-if="modelValue === 2" class="text-xl text-white drop-shadow-md animate-bounce-short" />
        <i-ph-question v-else class="text-xl opacity-30 group-hover:opacity-100 text-amber-500 transition-opacity" />
      </div>
    </button>

    <button 
      class="flex-1 flex items-center justify-center border-l border-base-content/5 transition-all duration-300 active:scale-95 group relative overflow-hidden"
      @click="handleClick(3)"
    >
      <div 
        class="absolute inset-0 bg-gradient-to-br from-emerald-400 to-green-600 transition-opacity duration-300"
        :class="modelValue === 3 ? 'opacity-100' : 'opacity-0 group-hover:opacity-10'"
      ></div>

      <div class="relative z-10">
        <i-ph-check-circle-fill v-if="modelValue === 3" class="text-xl text-white drop-shadow-md animate-bounce-short" />
        <i-ph-check-circle v-else class="text-xl opacity-30 group-hover:opacity-100 text-emerald-500 transition-opacity" />
      </div>
    </button>

    <button 
      :id="`btn-star-${uid}`"
      class="flex-1 flex items-center justify-center border-l border-base-content/5 transition-all duration-300 active:scale-95 group relative overflow-hidden"
      @click="handleClick(4)"
    >
      <div 
        class="absolute inset-0 bg-gradient-to-br from-[#FCD34D] via-[#F59E0B] to-[#D97706] transition-opacity duration-300"
        :class="modelValue === 4 ? 'opacity-100' : 'opacity-0 group-hover:opacity-10'"
      ></div>

      <div class="relative z-10">
        <i-ph-star-fill v-if="modelValue === 4" class="text-xl text-white drop-shadow-md animate-bounce-short" />
        <i-ph-star v-else class="text-xl opacity-30 group-hover:opacity-100 text-[#D97706] transition-opacity" />
      </div>
    </button>

  </div>
</template>

<style scoped>
/* 点击时的微小弹跳动画 */
@keyframes bounce-short {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}
.animate-bounce-short {
  animation: bounce-short 0.3s ease-out;
}
</style>