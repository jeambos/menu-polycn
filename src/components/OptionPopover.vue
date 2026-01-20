<script setup lang="ts">
import { ref, computed } from 'vue';
import { useFloating, autoUpdate, offset, flip, shift, arrow } from '@floating-ui/vue';
import { onClickOutside } from '@vueuse/core';
import type { Question, Attitude } from '../types';

const props = defineProps<{
  question: Question;
  // ✅ 核心修改：增加 attitude 字段
  selections: { avatar: string; index: number; attitude: Attitude }[]; 
  isOpen: boolean;
}>();

const emit = defineEmits(['toggle', 'close']);

const referenceRef = ref(null);
const floatingRef = ref(null);
const arrowRef = ref(null);

const { floatingStyles, middlewareData } = useFloating(referenceRef, floatingRef, {
  placement: 'top',
  whileElementsMounted: autoUpdate,
  middleware: [
    offset(10),
    flip(),
    shift({ padding: 10 }),
    arrow({ element: arrowRef }),
  ],
});

onClickOutside(floatingRef, (event) => {
  if (referenceRef.value && (referenceRef.value as HTMLElement).contains(event.target as Node)) return;
  emit('close');
});

const arrowStyle = computed(() => {
  const { x, y } = middlewareData.value.arrow || {};
  const currentSide = middlewareData.value.placement?.split('-')[0] || 'top';
  
  const sideMap: Record<string, string> = { top: 'bottom', right: 'left', bottom: 'top', left: 'right' };
  const staticSide = sideMap[currentSide] || 'bottom';

  return {
    left: x != null ? `${x}px` : '',
    top: y != null ? `${y}px` : '',
    [staticSide]: '-4px',
  };
});

// ✅ 态度图标映射
function getIcon(att: number) {
  switch (att) {
    case 4: return '⭐'; 
    case 3: return '👌'; 
    case 2: return '❔'; 
    case 1: return '⛔'; 
    default: return '';
  }
}
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
      <div class="bg-neutral text-neutral-content rounded-xl shadow-xl p-3 relative animate-in fade-in zoom-in-95 duration-200 border border-white/10">
        
        <div 
          ref="arrowRef"
          class="absolute w-2 h-2 bg-neutral rotate-45 border border-white/10"
          :style="arrowStyle"
        ></div>

        <div class="font-bold opacity-60 text-xs mb-2 border-b border-white/10 pb-1">
          {{ question.title }}
        </div>

        <div class="flex flex-col gap-1.5">
          <div 
            v-for="(opt, idx) in question.options" 
            :key="idx"
            class="relative pl-2 py-1.5 rounded transition-colors"
            :class="{ 'bg-white/10': selections.some(s => s.index === idx) }"
          >
            <div class="text-xs leading-tight pr-10 opacity-90">
              {{ typeof opt === 'string' ? opt : opt.long }}
            </div>

            <div class="absolute right-1 top-1/2 -translate-y-1/2 flex flex-col items-end gap-0.5">
              <div 
                v-for="sel in selections.filter(s => s.index === idx)" 
                :key="sel.avatar"
                class="flex items-center gap-1 bg-black/20 px-1.5 py-0.5 rounded text-[10px]"
              >
                <span>{{ getIcon(sel.attitude) }}</span>
                <span class="opacity-80">{{ sel.avatar }}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </Teleport>
</template>