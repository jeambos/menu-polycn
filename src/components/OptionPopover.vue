<script setup lang="ts">
import { ref, computed } from 'vue';
import { useFloating, autoUpdate, offset, flip, shift, arrow } from '@floating-ui/vue';
import { onClickOutside } from '@vueuse/core';
import type { Question, Attitude } from '../types';

// ❌ 移除 AttitudeIcon 引用，减少依赖
// import AttitudeIcon from './AttitudeIcon.vue';

const props = defineProps<{
  question: Question;
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

// 辅助函数：判断某选项是否有被选
function hasSelection(idx: number) {
  return props.selections.some(s => s.index === idx);
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
      class="z-[9999] w-72 text-sm font-sans"
    >
      <div class="bg-neutral text-neutral-content rounded-xl shadow-xl p-3 relative animate-in fade-in zoom-in-95 duration-200 border border-white/10">
        
        <div 
          ref="arrowRef"
          class="absolute w-2 h-2 bg-neutral rotate-45 border border-white/10"
          :style="arrowStyle"
        ></div>

        <div class="font-bold opacity-60 text-xs mb-3 border-b border-white/10 pb-2">
          {{ question.title }}
        </div>

        <div class="flex flex-col gap-2">
          <div 
            v-for="(opt, idx) in question.options" 
            :key="idx"
            class="relative p-2 rounded transition-colors flex flex-col gap-1.5"
            :class="{ 'bg-white/5': hasSelection(idx) }"
          >
            <div 
              class="text-xs leading-relaxed"
              :class="hasSelection(idx) ? 'opacity-100 font-bold text-white' : 'opacity-50'"
            >
              {{ typeof opt === 'string' ? opt : opt.long }}
            </div>

            <div v-if="hasSelection(idx)" class="flex flex-wrap gap-2 mt-0.5">
              <div 
                v-for="(sel, sIdx) in selections.filter(s => s.index === idx)" 
                :key="sIdx"
                class="flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-bold border border-white/5"
                :class="[
                  // 🎨 诊断染色法：根据 attitude 强制变色
                  Number(sel.attitude) === 4 ? 'bg-warning/20 text-amber-300' :
                  Number(sel.attitude) === 1 ? 'bg-error/20 text-red-300' :
                  Number(sel.attitude) === 3 ? 'bg-success/20 text-green-300' :
                  Number(sel.attitude) === 2 ? 'bg-info/20 text-blue-300' : 
                  'bg-white/10 text-gray-300'
                ]"
              >
                <span class="opacity-90">{{ sel.avatar }}</span>
                
                <i-ph-star-fill      v-if="Number(sel.attitude) === 4" class="text-xs" />
                <i-ph-x-bold         v-else-if="Number(sel.attitude) === 1" class="text-xs" />
                <i-ph-check-bold     v-else-if="Number(sel.attitude) === 3" class="text-xs" />
                <i-ph-question-bold  v-else-if="Number(sel.attitude) === 2" class="text-xs" />
                
                <span v-else class="w-1.5 h-1.5 rounded-full bg-current opacity-50"></span>
              </div>
            </div>
            
          </div>
        </div>

      </div>
    </div>
  </Teleport>
</template>