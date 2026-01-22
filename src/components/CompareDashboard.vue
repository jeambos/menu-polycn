<script setup lang="ts">
import { computed, ref } from 'vue';

const props = defineProps<{
  counts: {
    resonance: number;
    critical: number;
    discuss: number;
    negotiate: number;
  }
}>();

const emit = defineEmits<{
  (e: 'scrollTo', id: string): void;
  (e: 'open-ai'): void;
}>();

// --- 1. 数据计算与排序 ---

const total = computed(() => 
  props.counts.resonance + 
  props.counts.critical + 
  props.counts.discuss + 
  props.counts.negotiate
);

const segments = computed(() => {
  const t = total.value || 1;
  
  // 按照您的要求调整顺序：核心 -> 默契 -> 沟通 -> 协商
  const configs = [
    { 
      key: 'critical', 
      label: '核心冲突', 
      target: 'zone-critical', 
      count: props.counts.critical,
      bgClass: 'bg-error', 
      shadowClass: 'shadow-error/50', // 专属阴影色
      textClass: 'text-error',
      icon: '⚡'
    },
    { 
      key: 'resonance', 
      label: '默契共振', 
      target: 'zone-resonance', 
      count: props.counts.resonance,
      bgClass: 'bg-success', 
      shadowClass: 'shadow-success/50',
      textClass: 'text-success',
      icon: '🤝'
    },
    { 
      key: 'discuss', 
      label: '需要沟通', // 文案已修改
      target: 'zone-discuss', 
      count: props.counts.discuss,
      bgClass: 'bg-warning', 
      shadowClass: 'shadow-warning/50',
      textClass: 'text-warning',
      icon: '💬'
    },
    { 
      key: 'negotiate', 
      label: '协商让步', 
      target: 'zone-negotiate', 
      count: props.counts.negotiate,
      bgClass: 'bg-base-content/20',
      shadowClass: 'shadow-base-content/20',
      textClass: 'text-base-content/60',
      icon: '⚖️'
    }
  ];

  // 过滤掉数量为0的项，并计算百分比
  // 我们需要过滤掉0的项，否则圆角逻辑会乱
  const validItems = configs.filter(c => c.count > 0);

  return validItems.map((item, index) => ({
    ...item,
    percent: (item.count / t) * 100,
    // 动态计算圆角：第一个左圆，最后一个右圆
    roundedClass: 
      validItems.length === 1 ? 'rounded-full' :
      index === 0 ? 'rounded-l-full' : 
      index === validItems.length - 1 ? 'rounded-r-full' : 'rounded-none'
  }));
});

// --- 2. 交互逻辑 ---

const activeSegmentKey = ref<string | null>(null);

function handleSegmentClick(key: string, targetId: string) {
  if (activeSegmentKey.value === key) {
    emit('scrollTo', targetId);
  } else {
    activeSegmentKey.value = key;
  }
}

// 鼠标移出重置（可选）
function handleMouseLeave() {
  activeSegmentKey.value = null;
}

const activeInfo = computed(() => 
  segments.value.find(s => s.key === activeSegmentKey.value)
);
</script>

<template>
  <div class="w-full mb-12 px-2">
    
    <div class="h-10 mb-3 flex items-end justify-between">
      <h3 class="text-sm font-bold uppercase tracking-widest opacity-40">
        Overview / 概览
      </h3>
      
      <transition name="fade" mode="out-in">
        <div v-if="activeInfo" :key="activeInfo.key" class="flex items-center gap-2 text-base font-bold animate-fade-in-right">
          <span :class="activeInfo.textClass" class="flex items-center gap-1">
            {{ activeInfo.icon }} {{ activeInfo.label }}
          </span>
          <span class="opacity-20 text-xl">|</span>
          <span class="font-mono text-lg">{{ activeInfo.count }}</span>
          
          <span class="text-xs px-2 py-1 bg-base-content/10 rounded-md text-base-content/60 ml-2 font-normal">
            再次点击跳转
          </span>
        </div>
        <div v-else class="text-sm font-mono opacity-40 font-bold">
          Total: {{ total }} Items
        </div>
      </transition>
    </div>

    <div 
      class="flex w-full h-6 relative isolate select-none"
      @mouseleave="handleMouseLeave"
    >
      <div class="absolute inset-0 bg-base-content/5 rounded-full -z-10"></div>

      <div 
        v-for="seg in segments" 
        :key="seg.key"
        class="h-full relative transition-all duration-300 ease-out cursor-pointer flex items-center justify-center group"
        :class="[
          seg.bgClass,
          seg.roundedClass,
          activeSegmentKey === seg.key 
            ? `z-20 scale-y-150 shadow-lg ${seg.shadowClass} brightness-105` 
            : 'z-10 opacity-90 hover:opacity-100 hover:scale-y-125 hover:z-20'
        ]"
        :style="{ width: `${seg.percent}%` }"
        @click.stop="handleSegmentClick(seg.key, seg.target)"
      >
        <div v-if="activeSegmentKey === seg.key" class="w-1 h-1 bg-white/50 rounded-full shadow-sm"></div>
      </div>
    </div>

    <div class="grid grid-cols-4 gap-3 mt-6">
      <div 
        v-for="seg in segments" 
        :key="seg.key"
        class="flex flex-col items-center gap-1 p-2 rounded-xl border border-transparent transition-all duration-300"
        :class="activeSegmentKey === seg.key ? 'bg-base-content/5 border-base-content/5 scale-105' : 'opacity-60 grayscale-[0.3]'"
      >
        <div class="flex items-center gap-1.5">
          <div class="w-2.5 h-2.5 rounded-full shadow-sm" :class="seg.bgClass"></div>
          <span class="text-xs font-bold uppercase tracking-wider whitespace-nowrap">{{ seg.label }}</span>
        </div>
        <span class="text-lg font-mono font-black leading-none mt-1">{{ seg.count }}</span>
      </div>
    </div>

    <div class="mt-8 flex justify-center">
      <button 
        @click="$emit('open-ai')"
        class="btn btn-sm h-10 px-6 rounded-full bg-base-100 border border-base-content/10 shadow-sm hover:shadow-md hover:border-primary/30 hover:text-primary transition-all group gap-2"
      >
        <i-ph-sparkle-fill class="text-lg text-primary/70 group-hover:text-primary group-hover:scale-110 transition-transform duration-300" />
        <span class="text-sm font-bold opacity-80 group-hover:opacity-100">AI 深度分析此结果</span>
        <i-ph-caret-right-bold class="text-xs opacity-30 group-hover:translate-x-1 transition-transform" />
      </button>
    </div>

  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(4px);
}

.animate-fade-in-right {
  animation: fadeInRight 0.3s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
}

@keyframes fadeInRight {
  from { opacity: 0; transform: translateX(-8px); }
  to { opacity: 1; transform: translateX(0); }
}
</style>