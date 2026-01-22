<script setup lang="ts">
import { computed, ref } from 'vue';

// 定义属性，保持原有接口不变
const props = defineProps<{
  counts: {
    resonance: number; // 🤝 默契
    critical: number;  // ⚡ 冲突
    discuss: number;   // 💬 待议
    negotiate: number; // ⚖️ 协商
  }
}>();

const emit = defineEmits<{
  (e: 'scrollTo', id: string): void;
  (e: 'open-ai'): void; // 新增：通知父组件打开 AI 弹窗
}>();

// --- 核心数据计算 ---

const total = computed(() => 
  props.counts.resonance + 
  props.counts.critical + 
  props.counts.discuss + 
  props.counts.negotiate
);

// 定义数据段配置（颜色、排序、对应的跳转ID）
const segments = computed(() => {
  const t = total.value || 1; // 防止除以0
  
  // 定义基础配置
  const configs = [
    { 
      key: 'critical', 
      label: '核心冲突', 
      target: 'zone-critical', 
      count: props.counts.critical,
      bgClass: 'bg-error', 
      textClass: 'text-error',
      icon: '⚡'
    },
    { 
      key: 'discuss', 
      label: '待厘清', 
      target: 'zone-discuss', 
      count: props.counts.discuss,
      bgClass: 'bg-warning', 
      textClass: 'text-warning',
      icon: '💬'
    },
    { 
      key: 'negotiate', 
      label: '协商让步', 
      target: 'zone-negotiate', 
      count: props.counts.negotiate,
      bgClass: 'bg-base-content/20', // 中性灰
      textClass: 'text-base-content/60',
      icon: '⚖️'
    },
    { 
      key: 'resonance', 
      label: '默契共振', 
      target: 'zone-resonance', 
      count: props.counts.resonance,
      bgClass: 'bg-success', 
      textClass: 'text-success',
      icon: '🤝'
    }
  ];

  // 计算百分比并过滤掉数量为0的项（为了进度条美观，不显示0宽度的条）
  return configs.map(item => ({
    ...item,
    percent: (item.count / t) * 100
  }));
});

// --- 交互逻辑 ---

const activeSegmentKey = ref<string | null>(null);

// 处理点击：适配移动端的“两次点击”逻辑
function handleSegmentClick(key: string, targetId: string) {
  // 如果当前已经是激活状态，则第二次点击触发跳转
  if (activeSegmentKey.value === key) {
    emit('scrollTo', targetId);
  } else {
    // 第一次点击（或切换），仅激活显示状态
    activeSegmentKey.value = key;
  }
}

// 鼠标移出区域时重置状态（可选，为了体验更像原生 tooltip）
function handleMouseLeave() {
  activeSegmentKey.value = null;
}

// 获取当前激活段的详细信息，用于显示动态标题
const activeInfo = computed(() => 
  segments.value.find(s => s.key === activeSegmentKey.value)
);

</script>

<template>
  <div class="w-full mb-10 px-1">
    
    <div class="h-8 mb-2 flex items-end justify-between">
      <h3 class="text-xs font-bold uppercase tracking-widest opacity-40">
        Overview / 概览
      </h3>
      
      <transition name="fade" mode="out-in">
        <div v-if="activeInfo" :key="activeInfo.key" class="flex items-center gap-2 text-sm font-bold animate-fade-in-right">
          <span :class="activeInfo.textClass">{{ activeInfo.icon }} {{ activeInfo.label }}</span>
          <span class="opacity-30">|</span>
          <span class="font-mono">{{ activeInfo.count }}项</span>
          <span class="font-mono opacity-50 text-xs">({{ activeInfo.percent.toFixed(1) }}%)</span>
          <span class="text-[10px] px-1.5 py-0.5 bg-base-content/5 rounded text-base-content/40 ml-1">
            再次点击跳转
          </span>
        </div>
        <div v-else class="text-xs font-mono opacity-30">
          Total: {{ total }} Items
        </div>
      </transition>
    </div>

    <div 
      class="flex w-full h-4 rounded-full overflow-hidden cursor-pointer relative isolate"
      @mouseleave="handleMouseLeave"
    >
      <div class="absolute inset-0 bg-base-content/5 -z-10"></div>

      <div 
        v-for="seg in segments" 
        :key="seg.key"
        class="h-full transition-all duration-300 ease-out flex items-center justify-center relative group"
        :class="[
          seg.bgClass,
          // 激活时：高度拉伸 (通过 scaleY 实现，不影响布局)
          activeSegmentKey === seg.key ? 'scale-y-[1.4] z-10 brightness-110 shadow-sm' : 'hover:brightness-110 hover:scale-y-[1.2] hover:z-10 opacity-90'
        ]"
        :style="{ width: `${seg.percent}%` }"
        @click.stop="handleSegmentClick(seg.key, seg.target)"
        @mouseenter="activeSegmentKey = seg.key"
      >
        </div>
    </div>

    <div class="grid grid-cols-4 gap-2 mt-4">
      <div 
        v-for="seg in segments" 
        :key="seg.key"
        class="flex flex-col items-center gap-1 p-2 rounded-lg border border-transparent transition-colors"
        :class="activeSegmentKey === seg.key ? 'bg-base-content/5 border-base-content/5' : 'opacity-60'"
      >
        <div class="flex items-center gap-1.5">
          <div class="w-2 h-2 rounded-full" :class="seg.bgClass"></div>
          <span class="text-[10px] font-bold uppercase tracking-wider">{{ seg.label }}</span>
        </div>
        <span class="text-sm font-mono font-bold leading-none">{{ seg.count }}</span>
      </div>
    </div>

    <div class="mt-6 flex justify-center">
      <button 
        @click="$emit('open-ai')"
        class="btn btn-sm btn-ghost gap-2 text-base-content/40 hover:text-base-content hover:bg-base-content/5 transition-all font-normal group"
      >
        <i-ph-sparkle-bold class="group-hover:text-primary transition-colors" />
        <span class="text-xs">AI 深度分析此结果</span>
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
  transform: translateY(2px);
}

.animate-fade-in-right {
  animation: fadeInRight 0.3s ease-out forwards;
}

@keyframes fadeInRight {
  from { opacity: 0; transform: translateX(-5px); }
  to { opacity: 1; transform: translateX(0); }
}
</style>