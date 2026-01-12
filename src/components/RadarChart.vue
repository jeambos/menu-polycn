<script setup lang="ts">
import { computed } from 'vue';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { RadarChart } from 'echarts/charts';
import { TitleComponent, TooltipComponent, LegendComponent } from 'echarts/components';
import VChart from 'vue-echarts';
import type { AnswerRecord } from '../stores/useConfigStore';
import questionsData from '../data/questions.json';

// 按需注册 ECharts 组件，减小体积
use([CanvasRenderer, RadarChart, TitleComponent, TooltipComponent, LegendComponent]);

const props = defineProps<{
  answers: Record<string, AnswerRecord>; // 接收答案字典
  compareAnswers?: Record<string, AnswerRecord>; // (可选) 对比对象的答案
}>();

// --- 核心算法：计算每个模块的得分 ---
const radarData = computed(() => {
  const modules = questionsData.modules;
  
  // 1. 定义维度 (Indicator)
  const indicators = modules.map(m => ({
    name: m.name.replace(/📦 |⚛️ /g, ''), // 去掉 emoji 让图表更干净
    max: 4 // 选项最大索引是 4
  }));

  // 2. 计算我的得分
  const myScores = modules.map(m => {
    // 找出该模块下用户已回答的题目
    const answeredQuestions = m.questions.filter(q => props.answers[q.id]);
    if (answeredQuestions.length === 0) return 0;

    // 累加选项索引 (Option Index)
    const total = answeredQuestions.reduce((sum, q) => {
      return sum + (props.answers[q.id]?.optionIndex || 0);
    }, 0);

    // 算平均分 (保留1位小数)
    return Number((total / answeredQuestions.length).toFixed(1));
  });

  // 3. 组装 Series 数据
  const seriesData = [
    {
      value: myScores,
      name: '我的配置',
      itemStyle: { color: '#FF00FF' }, // 赛博粉
      areaStyle: { opacity: 0.2 }
    }
  ];

  // 4. 如果有对比数据 (双人模式)
  if (props.compareAnswers) {
    const partnerScores = modules.map(m => {
      const answeredQuestions = m.questions.filter(q => props.compareAnswers![q.id]);
      if (answeredQuestions.length === 0) return 0;
      const total = answeredQuestions.reduce((sum, q) => sum + (props.compareAnswers![q.id]?.optionIndex || 0), 0);
      return Number((total / answeredQuestions.length).toFixed(1));
    });

    seriesData.push({
      value: partnerScores,
      name: '伴侣配置',
      itemStyle: { color: '#00FFFF' }, // 赛博蓝
      areaStyle: { opacity: 0.2 }
    });
  }

  return { indicators, seriesData };
});

// --- ECharts 配置项 ---
const option = computed(() => ({
  backgroundColor: 'transparent',
  radar: {
    indicator: radarData.value.indicators,
    shape: 'circle',
    splitNumber: 4,
    axisName: {
      color: 'rgba(255,255,255,0.7)',
      fontSize: 10
    },
    splitLine: {
      lineStyle: {
        color: ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.2)']
      }
    },
    splitArea: {
      show: false
    },
    axisLine: {
      lineStyle: { color: 'rgba(255,255,255,0.1)' }
    }
  },
  series: [
    {
      type: 'radar',
      data: radarData.value.seriesData,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: { width: 2 }
    }
  ]
}));
</script>

<template>
  <div class="w-full h-[300px]">
    <VChart class="w-full h-full" :option="option" autoresize />
  </div>
</template>