<script setup lang="ts">
import { ref, computed } from 'vue';
import { useFloating, autoUpdate, offset, flip, shift, arrow } from '@floating-ui/vue';
import { onClickOutside } from '@vueuse/core';
import type { Question } from '../types';

const props = defineProps<{
  question: Question;
  selections: { avatar: string; index: number }[]; // 谁选了哪个选项
  isOpen: boolean; // 由父组件控制开关
}>();

const emit = defineEmits(['toggle', 'close']);

const referenceRef = ref(null); // 触发源（Badge）
const floatingRef = ref(null);  // 浮窗
const arrowRef = ref(null);     // 箭头

// 配置 Floating UI
const { floatingStyles, middlewareData } = useFloating(referenceRef, floatingRef, {
  placement: 'top', // 默认在上方
  whileElementsMounted: autoUpdate, // 滚动时自动更新位置
  middleware: [
    offset(10), // 间距 10px
    flip(),     // 空间不足自动翻转到下方
    shift({ padding: 10 }), // 防止贴边
    arrow({ element: arrowRef }), // 箭头计算
  ],
});

// 点击外部关闭
onClickOutside(floatingRef, (event) => {
  // 如果点击的是触发源本身，不要触发这里（避免冲突）
  if (referenceRef.value && (referenceRef.value as HTMLElement).contains(event.target as Node)) return;
  emit('close');
});

// 箭头样式计算
// 修复 src/components/OptionPopover.vue 中的 arrowStyle

const arrowStyle = computed(() => {
  const { x, y } = middlewareData.value.arrow || {};
  
  // 1. 获取当前侧边 (top/bottom/left/right)
  const currentSide = middlewareData.value.placement?.split('-')[0] || 'top';

  // 2. 定义映射对象，并显式标注类型为 Record<string, string> 以消除 "any" 报错
  const sideMap: Record<string, string> = {
    top: 'bottom',
    right: 'left',
    bottom: 'top',
    left: 'right',
  };

  // ✅ 核心修复：加上 || 'bottom' 兜底
  // 这样 TS 就知道 staticSide 既然有兜底，那它 100% 是 string，不再是 string | undefined
  const staticSide = sideMap[currentSide] || 'bottom';

  return {
    left: x != null ? `${x}px` : '',
    top: y != null ? `${y}px` : '',
    [staticSide]: '-4px', // 箭头外突位置
  };
});
</script>

<template>
  <div 
    ref="referenceRef" 
    @click.stop="emit('toggle')" 
    class="inline-block cursor-pointer active:scale-95 transition-transform"
  >
    <slot></slot>
  </div>

  <Teleport to="body">
    <div 
      v-if="isOpen"
      ref="floatingRef"
      :style="floatingStyles"
      class="z-[9999] w-64 text-sm font-sans"
    >
      <div class="bg-neutral text-neutral-content rounded-xl shadow-xl p-3 relative animate-in fade-in zoom-in-95 duration-200">
        
        <div 
          ref="arrowRef"
          class="absolute w-2 h-2 bg-neutral rotate-45"
          :style="arrowStyle"
        ></div>

        <div class="font-bold opacity-60 text-xs mb-2 border-b border-white/10 pb-1">
          {{ question.title }}
        </div>

        <div class="flex flex-col gap-1.5">
          <div 
            v-for="(opt, idx) in question.options" 
            :key="idx"
            class="relative pl-2 py-1 rounded"
            :class="{ 'bg-white/10 font-bold': selections.some(s => s.index === idx) }"
          >
            <div class="text-xs leading-tight pr-6">
              {{ typeof opt === 'string' ? opt : opt.long }}
            </div>

            <div class="absolute right-1 top-1/2 -translate-y-1/2 flex -space-x-1">
              <span 
                v-for="sel in selections.filter(s => s.index === idx)" 
                :key="sel.avatar"
                class="text-sm drop-shadow-md"
              >
                {{ sel.avatar }}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  </Teleport>
</template>