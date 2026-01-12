<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useClipboard } from '@vueuse/core';
import { useConfigStore } from '../stores/useConfigStore';
import { decode } from '../logic/codec';
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

// --- 分区容器 ---
// 绿区被拆分为两部分：核心(重点展示) 和 普通同意(标签展示)
const greenCore = ref<any[]>([]);   // ⭐ 核心
const greenNormal = ref<any[]>([]); // 👌 同意
const yellowZone = ref<any[]>([]);  // ❔ 犹豫
const redZone = ref<any[]>([]);     // ⛔ 拒绝

// 控制折叠状态
const showAllGreen = ref(false);

// 辅助排序
function sortItems(a: any, b: any) {
  // 按照 模块顺序 或者 题目ID 排序可能更符合阅读习惯
  return a.id.localeCompare(b.id);
}

function processZoneData(answers: Record<string, Attitude[]>) {
  const gCore: any[] = [], gNorm: any[] = [], y: any[] = [], r: any[] = [];

  questionsData.modules.forEach(m => {
    m.questions.forEach(q => {
      const states = answers[q.id];
      if (!states) return;

      states.forEach((att, optIndex) => {
        if (att === 0) return;

        const item = {
          id: q.id + '_' + optIndex,
          title: q.title,
          choice: q.options[optIndex],
          attitude: att,
          moduleName: m.name.replace(/📦 |⚛️ /g, '')
        };

        if (att === 4) {
          gCore.push(item);     // ⭐ 进核心区
        } else if (att === 3) {
          gNorm.push(item);     // 👌 进普通区
        } else if (att === 2) {
          y.push(item);         // ❔ 进黄区
        } else if (att === 1) {
          r.push(item);         // ⛔ 进红区
        }
      });
    });
  });

  greenCore.value = gCore.sort(sortItems);
  greenNormal.value = gNorm.sort(sortItems);
  yellowZone.value = y.sort(sortItems);
  redZone.value = r.sort(sortItems);
}

onMounted(() => {
  const codeParam = route.query.code as string;
  if (codeParam) {
    isPreviewMode.value = true;
    displayCode.value = codeParam;
    try {
      displayAnswers.value = decode(codeParam) as Record<string, Attitude[]>;
    } catch (e) {
      console.error("解码失败", e);
    }
  } else {
    displayAnswers.value = store.answers;
  }
  processZoneData(displayAnswers.value);
});
</script>

<template>
  <div class="pb-40 pt-6 px-4 max-w-md mx-auto min-h-screen">
    
    <div class="text-center mb-8">
      <h2 class="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
        {{ isPreviewMode ? '配置解读' : '我的配置单' }}
      </h2>
      <p class="text-xs opacity-50 mt-2 font-mono px-8">
        {{ isPreviewMode ? 'Code Preview Mode' : 'Fingerprint Generated' }}
      </p>
    </div>

    <div v-if="redZone.length > 0" class="mb-8 animate-fade-in-up">
      <div class="flex items-center justify-between mb-3 border-b border-error/20 pb-1">
        <div class="flex items-center gap-2 text-error font-bold text-lg uppercase tracking-wider">
          <span>⛔</span> 硬边界
        </div>
        <div class="badge badge-error badge-sm">{{ redZone.length }}</div>
      </div>
      
      <div class="flex flex-col gap-2">
        <div 
          v-for="item in redZone" 
          :key="item.id"
          class="bg-error/10 border border-error/20 p-3 rounded-lg flex justify-between items-center"
        >
          <div class="flex-1 min-w-0">
            <div class="text-[10px] opacity-60 mb-0.5">{{ item.moduleName }}</div>
            <div class="font-bold text-sm text-error break-words">{{ item.choice }}</div>
            <div class="text-[10px] opacity-50 line-through truncate">{{ item.title }}</div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="greenCore.length > 0" class="mb-8 animate-fade-in-up" style="animation-delay: 0.1s">
      <div class="flex items-center justify-between mb-3 border-b border-accent/20 pb-1">
        <div class="flex items-center gap-2 text-accent font-bold text-lg uppercase tracking-wider">
          <span>⭐</span> 核心需求
        </div>
        <div class="badge badge-accent badge-sm">{{ greenCore.length }}</div>
      </div>

      <div class="flex flex-col gap-2">
        <div 
          v-for="item in greenCore" 
          :key="item.id"
          class="bg-accent/10 border border-accent/30 p-3 rounded-lg flex justify-between items-center relative overflow-hidden"
        >
          <div class="flex-1 min-w-0 z-10">
            <div class="text-[10px] opacity-60 mb-0.5 text-accent">{{ item.moduleName }}</div>
            <div class="font-bold text-sm text-white break-words">{{ item.choice }}</div>
            <div class="text-[10px] opacity-50 truncate">{{ item.title }}</div>
          </div>
          <div class="absolute -right-4 -bottom-4 text-6xl opacity-10 rotate-12">⭐</div>
        </div>
      </div>
    </div>

    <div v-if="yellowZone.length > 0" class="mb-8 animate-fade-in-up" style="animation-delay: 0.2s">
      <div class="flex items-center justify-between mb-3 border-b border-warning/20 pb-1">
        <div class="flex items-center gap-2 text-warning font-bold text-lg uppercase tracking-wider">
          <span>❔</span> 待商议
        </div>
        <div class="badge badge-warning badge-sm">{{ yellowZone.length }}</div>
      </div>

      <div class="flex flex-col gap-2">
        <div v-for="item in yellowZone" :key="item.id" class="bg-warning/5 border border-warning/10 p-2 rounded-lg flex items-center gap-3">
          <span class="text-xl">🤔</span>
          <div class="flex-1 min-w-0">
             <div class="font-bold text-sm text-warning-content/80">{{ item.choice }}</div>
             <div class="text-[10px] opacity-40">{{ item.title }}</div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="greenNormal.length > 0" class="mb-8 animate-fade-in-up" style="animation-delay: 0.3s">
      <div class="flex items-center justify-between mb-3 border-b border-success/20 pb-1">
        <div class="flex items-center gap-2 text-success font-bold text-lg uppercase tracking-wider">
          <span>👌</span> 可以接受
        </div>
        <div class="badge badge-success badge-sm">{{ greenNormal.length }}</div>
      </div>

      <div class="flex flex-wrap gap-2">
        <div 
          v-for="(item, index) in (showAllGreen ? greenNormal : greenNormal.slice(0, 10))" 
          :key="item.id"
          class="badge badge-success badge-outline gap-1 py-3 h-auto"
        >
          <span class="font-bold opacity-80">{{ item.choice }}</span>
        </div>
        
        <button 
          v-if="greenNormal.length > 10 && !showAllGreen" 
          @click="showAllGreen = true"
          class="badge badge-ghost gap-1 py-3 cursor-pointer hover:bg-base-content/10"
        >
          +{{ greenNormal.length - 10 }} 更多...
        </button>
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