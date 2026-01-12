<script setup lang="ts">
import { computed } from 'vue';
import confetti from 'canvas-confetti';
import type { Certainty } from '../types';

// 定义属性
const props = defineProps<{
  label: string;
  modelValue: { optionIndex: number; certainty: Certainty } | undefined;
  myIndex: number; // 这个按钮代表第几个选项
}>();

// 定义事件
const emit = defineEmits(['update']);

// 计算当前是否被选中
const isSelected = computed(() => props.modelValue?.optionIndex === props.myIndex);
// 计算当前的坚定度 (0=没选, 1=迷茫, 2=普通, 3=坚定)
const currentCertainty = computed(() => isSelected.value ? (props.modelValue?.certainty || 0) : 0);

// --- 动作逻辑 ---

// 1. 点击左侧 (迷茫)
function clickUnsure() {
  emit('update', { optionIndex: props.myIndex, certainty: 1 });
}

// 2. 点击中间 (普通意向)
function clickNormal() {
  // 如果已经是普通选中，则取消(设为0)？ 或者不做操作？这里我们设为普通选中
  // 你之前的逻辑：点击已选中的 -> 取消。
  if (isSelected.value && currentCertainty.value === 2) {
     // 如果你想支持取消，可以在这里 emit null。但 V5.0 逻辑通常是单选切换。
     // 这里我们保持简单的“选中”逻辑
  }
  emit('update', { optionIndex: props.myIndex, certainty: 2 });
}

// 3. 点击右侧 (核心/坚定)
function clickCore(event: MouseEvent) {
  emit('update', { optionIndex: props.myIndex, certainty: 3 });
  
  // 💥 放烟花！
  const rect = (event.target as HTMLElement).getBoundingClientRect();
  const x = (rect.left + rect.width / 2) / window.innerWidth;
  const y = (rect.top + rect.height / 2) / window.innerHeight;
  
  confetti({
    particleCount: 60,
    spread: 70,
    origin: { x, y },
    colors: ['#FF00FF', '#00FFFF', '#FFFF00'] // 赛博配色
  });
}
</script>

<template>
  <div 
    class="relative flex items-center justify-between w-full h-12 rounded-lg border-2 transition-all duration-200 select-none overflow-hidden my-2"
    :class="[
      isSelected 
        ? (currentCertainty === 3 ? 'border-accent bg-accent/20' : 'border-primary bg-primary/20') 
        : 'border-base-content/20 bg-base-100 hover:border-base-content/40'
    ]"
  >
    <button 
      @click.stop="clickUnsure"
      class="h-full w-[15%] flex items-center justify-center border-r border-white/10 hover:bg-white/10 active:scale-90 transition"
    >
      <span class="text-lg" :class="currentCertainty === 1 ? 'opacity-100' : 'opacity-30'">
        ❔
      </span>
    </button>

    <button 
      @click.stop="clickNormal"
      class="h-full w-[70%] flex items-center justify-center px-2 hover:bg-white/5"
    >
      <span 
        class="text-sm font-medium transition-all"
        :class="[
          isSelected ? 'text-white' : 'text-base-content/70',
          currentCertainty === 3 ? 'font-bold drop-shadow-md' : ''
        ]"
      >
        {{ label }}
      </span>
    </button>

    <button 
      @click.stop="clickCore"
      class="h-full w-[15%] flex items-center justify-center border-l border-white/10 hover:bg-white/10 active:scale-125 transition"
    >
      <span class="text-lg transition-all" :class="currentCertainty === 3 ? 'scale-125' : 'opacity-30 grayscale'">
        ⭐
      </span>
    </button>
    
    <div 
      v-if="isSelected" 
      class="absolute inset-0 -z-10 opacity-30"
      :class="currentCertainty === 3 ? 'bg-accent' : 'bg-primary'"
    ></div>
  </div>
</template>