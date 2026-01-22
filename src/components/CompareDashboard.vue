<script setup lang="ts">
import { computed } from 'vue';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { PieChart } from 'echarts/charts';
import { TooltipComponent, LegendComponent } from 'echarts/components';
import VChart from 'vue-echarts';

// 注册 ECharts 组件
use([CanvasRenderer, PieChart, TooltipComponent, LegendComponent]);

const props = defineProps<{
  counts: {
    resonance: number; // ✨
    critical: number;  // ⚡
    discuss: number;   // 💬
    negotiate: number; // 🤝
  }
}>();

const emit = defineEmits(['scrollTo']);

// ECharts 配置
const option = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: {
    trigger: 'item',
    formatter: '{b}: {c} ({d}%)'
  },
  legend: {
    bottom: '0%',
    left: 'center',
    textStyle: { color: '#9ca3af' } // 适配深色/浅色通用的灰色
  },
  series: [
    {
      name: '关系构成',
      type: 'pie',
      radius: ['40%', '70%'], // 环形
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 5,
        borderColor: 'rgba(0,0,0,0)', 
        borderWidth: 2
      },
      label: {
        show: false,
        position: 'center'
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 16,
          fontWeight: 'bold',
          color: 'inherit' // 跟随文字颜色
        },
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      },
      labelLine: { show: false },
      data: [
        // 注意：这里的 name 需要和下方的点击逻辑对应
        { value: props.counts.critical, name: '核心关注', itemStyle: { color: '#f87272' } }, // error (red)
        { value: props.counts.resonance, name: '默契共振', itemStyle: { color: '#36d399' } }, // success (green)
        { value: props.counts.discuss, name: '深度探索', itemStyle: { color: '#3abff8' } },   // info (blue)
        { value: props.counts.negotiate, name: '协商让步', itemStyle: { color: '#a6adbb' } }  // gray
      ]
    }
  ]
}));

// 处理点击跳转
function handleClick(params: any) {
  let targetId = '';
  switch (params.name) {
    case '核心关注': targetId = 'zone-critical'; break;
    case '默契共振': targetId = 'zone-resonance'; break;
    case '深度探索': targetId = 'zone-discuss'; break;
    case '协商让步': targetId = 'zone-negotiate'; break;
  }
  
  if (targetId) {
    emit('scrollTo', targetId);
  }
}
</script>

<template>
  <div class="card bg-base-200 shadow-xl mb-8 w-full">
    <div class="card-body p-4 items-center">
      <h3 class="card-title text-sm opacity-60 uppercase tracking-widest mb-2">
        对比结果概览
      </h3>
      
      <div class="w-full h-[250px] relative">
        <VChart 
          class="w-full h-full" 
          :option="option" 
          autoresize 
          @click="handleClick" 
        />
        <div class="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30 text-xs">
          点击扇区跳转
        </div>
      </div>
    </div>
  </div>
</template>