<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useClipboard } from '@vueuse/core';
import { useConfigStore } from '../stores/useConfigStore';
import { decode } from '../logic/codec'; // 引入解码器
import LiveCodeBar from '../components/LiveCodeBar.vue';
import questionsData from '../data/questions.json';
import type { Attitude } from '../types';

const route = useRoute();
const router = useRouter();
const store = useConfigStore();
const { copy, copied } = useClipboard();

const displayAnswers = ref<Record<string, Attitude[]>>({});
const displayCode = ref('');
const isPreviewMode = ref(false);

// 分区数据容器
const greenZone = ref<any[]>([]);  
const yellowZone = ref<any[]>([]); 
const redZone = ref<any[]>([]);    

// 辅助排序：核心(4) > 拒绝(1) > 同意(3) > 犹豫(2)
function sortItems(a: any, b: any) {
  // 自定义权重
  const getWeight = (att: number) => {
    if (att === 4) return 100; // 核心置顶
    if (att === 1) return 80;  // 强拒绝其次
    if (att === 3) return 60;
    if (att === 2) return 40;
    return 0;
  };
  return getWeight(b.attitude) - getWeight(a.attitude);
}

// 处理数据进入分区
function processZoneData(answers: Record<string, Attitude[]>) {
  const g: any[] = [], y: any[] = [], r: any[] = [];

  questionsData.modules.forEach(m => {
    m.questions.forEach(q => {
      const states = answers[q.id];
      if (!states) return;

      // 遍历该题的每一个选项
      states.forEach((att, optIndex) => {
        if (att === 0) return; // N/A 跳过

        const item = {
          id: q.id + '_' + optIndex,
          title: q.title,
          choice: q.options[optIndex],
          attitude: att, // 1,2,3,4
          moduleName: m.name.replace(/📦 |⚛️ /g, '')
        };

        // 分区逻辑：
        // 4 (Core) -> 绿区 (因为是必须的)
        // 3 (Yes)  -> 绿区
        // 2 (Soft) -> 黄区
        // 1 (Hard) -> 红区
        if (att >= 3) {
          g.push(item);
        } else if (att === 2) {
          y.push(item);
        } else if (att === 1) {
          r.push(item);
        }
      });
    });
  });

  greenZone.value = g.sort(sortItems);
  yellowZone.value = y.sort(sortItems);
  redZone.value = r.sort(sortItems);
}

onMounted(() => {
  const codeParam = route.query.code as string;
  
  if (codeParam) {
    // 预览模式
    isPreviewMode.value = true;
    displayCode.value = codeParam;
    try {
      displayAnswers.value = decode(codeParam); // 新版 decode 直接返回正确结构
    } catch (e) {
      console.error("解码失败", e);
    }
  } else {
    // 本机模式
    displayAnswers.value = store.answers;
    // 代码由 LiveCodeBar 生成
  }

  processZoneData(displayAnswers.value);
});
</script>

<template>
  <div class="pb-32 pt-6 px-4 max-w-md mx-auto min-h-screen">
    <div class="text-center mb-8">
      <h2 class="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
        {{ isPreviewMode ? '配置解读' : '我的配置单' }}
      </h2>
      <p class="text-xs opacity-50 mt-2 font-mono break-all px-8">
        {{ isPreviewMode ? 'Code: ' + displayCode.slice(0, 12) + '...' : '关系指纹已生成' }}
      </p>
    </div>

    <div v-if="greenZone.length > 0" class="mb-6 animate-fade-in-up">
      <div class="flex items-center gap-2 mb-3 text-success font-bold text-lg uppercase tracking-wider border-b border-success/20 pb-1">
        <span>🟩</span> 舒适圈 ({{ greenZone.length }})
      </div>
      <div class="flex flex-col gap-2">
        <div 
          v-for="item in greenZone" 
          :key="item.id"
          class="bg-base-200/40 hover:bg-base-200 p-3 rounded-lg flex justify-between items-center transition-colors"
          :class="{'border border-accent/40 bg-accent/5': item.attitude === 4}"
        >
          <div>
            <div class="text-[10px] opacity-40 mb-0.5 flex items-center gap-1">
              {{ item.moduleName }}
              <span v-if="item.attitude === 4" class="text-accent font-bold">★ CORE</span>
            </div>
            <div class="font-bold text-sm">{{ item.choice }}</div>
            <div class="text-[10px] opacity-60">{{ item.title }}</div>
          </div>
          <div class="text-xl">
            <span v-if="item.attitude === 4" class="animate-pulse">⭐</span>
            <span v-else>👌</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="yellowZone.length > 0" class="mb-6 animate-fade-in-up" style="animation-delay: 0.1s">
      <div class="flex items-center gap-2 mb-3 text-warning font-bold text-lg uppercase tracking-wider border-b border-warning/20 pb-1">
        <span>🟨</span> 待商议 ({{ yellowZone.length }})
      </div>
      <div class="flex flex-col gap-2">
        <div v-for="item in yellowZone" :key="item.id" class="bg-base-200/40 p-3 rounded-lg flex justify-between items-center">
          <div>
            <div class="text-[10px] opacity-40 mb-0.5">{{ item.moduleName }}</div>
            <div class="font-bold text-sm">{{ item.choice }}</div>
            <div class="text-[10px] opacity-60">{{ item.title }}</div>
          </div>
          <div class="text-xl opacity-80">❔</div>
        </div>
      </div>
    </div>

    <div v-if="redZone.length > 0" class="mb-6 animate-fade-in-up" style="animation-delay: 0.2s">
      <div class="flex items-center gap-2 mb-3 text-error font-bold text-lg uppercase tracking-wider border-b border-error/20 pb-1">
        <span>🟥</span> 硬边界 ({{ redZone.length }})
      </div>
      <div class="flex flex-col gap-2">
        <div v-for="item in redZone" :key="item.id" class="bg-base-200/40 p-3 rounded-lg flex justify-between items-center bg-error/5">
          <div>
            <div class="text-[10px] opacity-40 mb-0.5">{{ item.moduleName }}</div>
            <div class="font-bold text-sm line-through decoration-error/50">{{ item.choice }}</div>
            <div class="text-[10px] opacity-60">{{ item.title }}</div>
          </div>
          <div class="text-xl">⛔</div>
        </div>
      </div>
    </div>

    <div class="flex flex-col gap-3 mt-8">
      <button v-if="!isPreviewMode" @click="copy(store.answers ? displayCode : '')" class="btn btn-primary w-full shadow-lg">
        {{ copied ? '✅ 已复制' : '📋 复制配置代码' }}
      </button>
      <button @click="router.push('/')" class="btn btn-ghost w-full">返回首页</button>
    </div>

    <LiveCodeBar v-if="!isPreviewMode" />
  </div>
</template>

<style scoped>
.animate-fade-in-up {
  animation: fadeInUp 0.5s ease-out backwards;
}
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>