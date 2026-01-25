<script setup lang="ts">
import { watch, nextTick, getCurrentInstance } from 'vue';
import confetti from 'canvas-confetti';
import type { Attitude } from '../types';

// --- 1. 引入图形符号 (更新为五态方案) ---
import IconProhibitBold from '~icons/ph/prohibit-bold'; // 状态 1: 禁止 (Hard No)
import IconThumbsDownBold from '~icons/ph/thumbs-down-bold'; // 状态 5: 不喜欢 (Soft No)
import IconQuestionBold from '~icons/ph/question-bold'; // 状态 2: 犹豫 (Neutral)
import IconCheckBold from '~icons/ph/check-bold'; // 状态 3: 同意 (Soft Yes)
import IconStarFill from '~icons/ph/star-fill'; // 状态 4: 喜爱 (Hard Yes - 实心)
import IconStarBold from '~icons/ph/star-bold'; // 状态 4: 喜爱 (Hard Yes - 空心)

const props = defineProps<{
  // 支持 0(无), 1(红), 2(蓝灰), 3(绿), 4(金), 5(黑)
  modelValue: Attitude; 
}>();

const emit = defineEmits(['update:modelValue']);
const uid = getCurrentInstance()?.uid;

// 处理点击：支持反选（点击已选中的值则重置为0）
function handleClick(val: Attitude) {
  if (props.modelValue === val) {
    emit('update:modelValue', 0);
  } else {
    emit('update:modelValue', val);
  }
}

// 监听金星特效：仅当切换到状态 4 (喜爱) 时触发
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
  <div class="grid grid-cols-5 gap-1 w-full h-14 rounded-2xl p-1 bg-base-100/40 select-none relative">
    
    <button 
      class="relative flex items-center justify-center cursor-pointer focus:outline-none rounded-xl transition-all duration-200 active:scale-95"
      @click="handleClick(1)"
    >
      <div 
        class="absolute inset-0 rounded-xl transition-all duration-200 ease-out"
        :class="modelValue === 1 
          ? 'bg-red-600 scale-100 opacity-100 shadow-sm' // 选中：深红实心
          : 'bg-transparent scale-90 opacity-0'
        "
      ></div>

      <div class="relative z-10 transition-transform duration-200" :class="{ 'animate-stamp': modelValue === 1 }">
        <IconProhibitBold 
          class="text-xl transition-all duration-200"
          :class="modelValue === 1 
            ? 'text-white scale-110' // 选中：纯白
            : 'text-red-600 opacity-60 hover:opacity-100 hover:scale-110' // 未选中：红字半透
          "
        />
      </div>
    </button>

    <button 
      class="relative flex items-center justify-center cursor-pointer focus:outline-none rounded-xl transition-all duration-200 active:scale-95"
      @click="handleClick(5)"
    >
      <div 
        class="absolute inset-0 rounded-xl transition-all duration-200 ease-out"
        :class="modelValue === 5 
          ? 'bg-base-300 scale-100 opacity-100 shadow-sm' // 选中：浅灰实心
          : 'bg-transparent scale-90 opacity-0'
        "
      ></div>

      <div class="relative z-10 transition-transform duration-200">
        <IconThumbsDownBold 
          class="text-xl transition-all duration-200"
          :class="modelValue === 5 
            ? 'text-black scale-110' // 选中：纯黑
            : 'text-black opacity-60 hover:opacity-100 hover:scale-110' // 未选中：黑字半透
          "
        />
      </div>
    </button>

    <button 
      class="relative flex items-center justify-center cursor-pointer focus:outline-none rounded-xl transition-all duration-200 active:scale-95"
      @click="handleClick(2)"
    >
      <div 
        class="absolute inset-0 rounded-xl transition-all duration-200 ease-out"
        :class="modelValue === 2 
          ? 'bg-slate-100 scale-100 opacity-100 shadow-sm' // 选中：淡蓝灰
          : 'bg-transparent scale-90 opacity-0'
        "
      ></div>

      <div class="relative z-10 transition-transform duration-200">
        <IconQuestionBold 
          class="text-xl transition-all duration-200"
          :class="modelValue === 2 
            ? 'text-slate-600 scale-110' // 选中：深蓝灰
            : 'text-slate-500 opacity-60 hover:opacity-100 hover:scale-110' // 未选中：蓝灰半透
          "
        />
      </div>
    </button>

    <button 
      class="relative flex items-center justify-center cursor-pointer focus:outline-none rounded-xl transition-all duration-200 active:scale-95"
      @click="handleClick(3)"
    >
      <div 
        class="absolute inset-0 rounded-xl transition-all duration-200 ease-out"
        :class="modelValue === 3 
          ? 'bg-emerald-50 scale-100 opacity-100 shadow-sm' // 选中：浅绿水彩
          : 'bg-transparent scale-90 opacity-0'
        "
      ></div>

      <div class="relative z-10 transition-transform duration-200">
        <IconCheckBold 
          class="text-xl transition-all duration-200"
          :class="modelValue === 3 
            ? 'text-emerald-600 scale-110' // 选中：深绿
            : 'text-emerald-500 opacity-60 hover:opacity-100 hover:scale-110' // 未选中：草绿半透
          "
        />
      </div>
    </button>

    <button 
      :id="`btn-star-${uid}`"
      class="relative flex items-center justify-center cursor-pointer focus:outline-none rounded-xl transition-all duration-200 active:scale-95"
      @click="handleClick(4)"
    >
      <div 
        class="absolute inset-0 rounded-xl transition-all duration-300 ease-out shadow-sm border border-white/5"
        :class="modelValue === 4 
          ? 'bg-gradient-to-br from-gray-700 via-gray-900 to-black scale-100 opacity-100' // 选中：黑曜石渐变
          : 'bg-transparent scale-90 opacity-0'
        "
      ></div>

      <div class="relative z-10 transition-transform duration-200 active:scale-110">
        <component 
          :is="modelValue === 4 ? IconStarFill : IconStarBold"
          class="text-xl transition-all duration-200"
          :class="modelValue === 4 
            ? 'text-amber-400 drop-shadow-glow-gold scale-110' // 选中：金色+发光
            : 'text-amber-500 opacity-60 hover:opacity-100 hover:scale-110' // 未选中：琥珀金半透
          "
        />
      </div>
    </button>

  </div>
</template>

<style scoped>
/* 💥 盖章动画：状态 1 专用 */
@keyframes stamp {
  0% { transform: scale(2.5); opacity: 0; }
  40% { transform: scale(0.8); opacity: 1; }
  60% { transform: scale(1.1); }
  100% { transform: scale(1.1); } /* 保持最终放大一点的状态 */
}

.animate-stamp {
  animation: stamp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* 🔦 黑色背景下的金色光晕：状态 4 专用 */
.drop-shadow-glow-gold {
  filter: drop-shadow(0 0 4px rgba(245, 158, 11, 0.5));
}
</style>