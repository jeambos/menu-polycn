<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useClipboard } from '@vueuse/core';
import { useConfigStore } from '../stores/useConfigStore';
// ✅ 修复：同时引入 encode 和 decode
import { encode, decode } from '../logic/codec';
import LiveCodeBar from '../components/LiveCodeBar.vue';
import questionsData from '../data/questions.json';
import type { Attitude } from '../types';

const route = useRoute();
const router = useRouter();
const store = useConfigStore();
const { copy, copied } = useClipboard();

// 类型定义
interface ResultItem {
  id: string;
  title: string;
  choice: string;
  attitude: Attitude;
  moduleId: string;
  moduleName: string;
}

interface ModuleGroup {
  id: string;
  name: string;
  items: ResultItem[];
}

const isPreviewMode = ref(false);
const displayCode = ref('');
// ✅ 修复：确保定义了 displayAnswers
const displayAnswers = ref<Record<string, Attitude[]>>({});

// --- 分区数据容器 ---
const redGroups = ref<ModuleGroup[]>([]);    // ⛔ 硬边界
const goldGroups = ref<ModuleGroup[]>([]);   // ⭐ 核心需求
const yellowGroups = ref<ModuleGroup[]>([]); // ❔ 待商议
const greenItems = ref<ResultItem[]>([]);    // 👌 可接受

// 辅助：分组函数
function groupItemsByModule(items: ResultItem[]): ModuleGroup[] {
  const map = new Map<string, ModuleGroup>();
  items.forEach(item => {
    if (!map.has(item.moduleId)) {
      map.set(item.moduleId, {
        id: item.moduleId,
        name: item.moduleName,
        items: []
      });
    }
    map.get(item.moduleId)!.items.push(item);
  });
  return Array.from(map.values());
}

// 处理数据进入分区
function processZoneData(answers: Record<string, Attitude[]>) {
  const rList: ResultItem[] = [];
  const gCoreList: ResultItem[] = [];
  const yList: ResultItem[] = [];
  const greenList: ResultItem[] = [];

  questionsData.modules.forEach(m => {
    m.questions.forEach(q => {
      const states = answers[q.id];
      if (!states) return;

      states.forEach((att, optIndex) => {
        if (att === 0) return;

        // ✅ 修复：使用 || '' 防止 TS 报错 (string | undefined)
        const choiceText = q.options[optIndex] || '';

        const item: ResultItem = {
          id: q.id + '_' + optIndex,
          title: q.title,
          choice: choiceText,
          attitude: att,
          moduleId: m.id,
          moduleName: m.name.replace(/📦 |⚛️ /g, '')
        };

        if (att === 1) rList.push(item);      // 1 -> 红
        else if (att === 4) gCoreList.push(item); // 4 -> 金
        else if (att === 2) yList.push(item); // 2 -> 黄
        else if (att === 3) greenList.push(item); // 3 -> 绿
      });
    });
  });

  redGroups.value = groupItemsByModule(rList);
  goldGroups.value = groupItemsByModule(gCoreList);
  yellowGroups.value = groupItemsByModule(yList);
  greenItems.value = greenList;
}

// 手动复制处理
function handleCopy() {
  if (displayCode.value) {
    copy(displayCode.value);
  }
}

onMounted(() => {
  const codeParam = route.query.code as string;
  
  if (codeParam) {
    // A: 预览模式
    isPreviewMode.value = true;
    displayCode.value = codeParam;
    try {
      // 类型断言消除报错
      displayAnswers.value = decode(codeParam) as Record<string, Attitude[]>;
    } catch (e) { console.error(e); }
  } else {
    // B: 本机模式
    displayAnswers.value = store.answers;
    // ✅ 修复：调用 encode 生成真实代码
    displayCode.value = encode(store.answers);
  }
  processZoneData(displayAnswers.value);
});
</script>

<template>
  <div class="pb-40 pt-6 px-4 max-w-md mx-auto min-h-screen">
    
    <div class="text-center mb-10">
      <h2 class="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
        {{ isPreviewMode ? '配置解读' : '我的配置单' }}
      </h2>
      <p class="text-xs opacity-50 mt-2 font-mono break-all px-8">
        {{ isPreviewMode ? 'Code Preview' : 'Relationship Fingerprint' }}
      </p>
    </div>

    <div v-if="redGroups.length > 0" class="mb-8 animate-fade-in-up">
      <div class="flex items-center gap-2 mb-4 text-error font-bold text-lg uppercase tracking-wider border-b-2 border-error/20 pb-1">
        <span>⛔</span> 硬边界 / Deal Breakers
      </div>
      <div class="flex flex-col gap-4">
        <div v-for="group in redGroups" :key="group.id" class="card bg-error text-error-content shadow-lg">
          <div class="card-body p-4">
            <h3 class="card-title text-sm opacity-90 border-b border-white/20 pb-2 mb-2">
              {{ group.name }}
            </h3>
            <div class="flex flex-wrap gap-2">
              <div v-for="item in group.items" :key="item.id" class="badge badge-white/20 border-0 text-white font-bold h-auto py-2 px-3 gap-2">
                <span class="opacity-70 text-xs font-normal border-r border-white/30 pr-2 mr-0.5">{{ item.title }}</span>
                <span>{{ item.choice }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="goldGroups.length > 0" class="mb-8 animate-fade-in-up" style="animation-delay: 0.1s">
      <div class="flex items-center gap-2 mb-4 text-warning font-bold text-lg uppercase tracking-wider border-b-2 border-warning/20 pb-1">
        <span>⭐</span> 核心需求 / Must Haves
      </div>
      <div class="flex flex-col gap-4">
        <div v-for="group in goldGroups" :key="group.id" class="card bg-warning text-warning-content shadow-lg">
          <div class="card-body p-4">
            <h3 class="card-title text-sm opacity-80 border-b border-black/10 pb-2 mb-2 text-black">
              {{ group.name }}
            </h3>
            <div class="flex flex-wrap gap-2">
              <div v-for="item in group.items" :key="item.id" class="badge badge-neutral bg-black/10 border-0 text-black font-bold h-auto py-2 px-3 gap-2">
                <span class="opacity-60 text-xs font-normal border-r border-black/20 pr-2 mr-0.5">{{ item.title }}</span>
                <span>{{ item.choice }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="yellowGroups.length > 0" class="mb-8 animate-fade-in-up" style="animation-delay: 0.2s">
      <div class="flex items-center gap-2 mb-4 text-warning font-bold text-lg uppercase tracking-wider border-b-2 border-warning/20 pb-1">
        <span>❔</span> 待商议 / Soft Limits
      </div>
      <div class="flex flex-col gap-4">
        <div v-for="group in yellowGroups" :key="group.id" class="card bg-base-100 border-2 border-base-300 shadow-sm">
          <div class="card-body p-4">
            <h3 class="card-title text-sm opacity-60 border-b border-base-content/10 pb-2 mb-2">
              {{ group.name }}
            </h3>
            <div class="flex flex-wrap gap-2">
              <div v-for="item in group.items" :key="item.id" class="badge badge-outline border-warning text-warning h-auto py-2 px-3 gap-2 bg-warning/5">
                <span class="opacity-60 text-xs font-normal border-r border-warning/30 pr-2 mr-0.5 text-base-content">{{ item.title }}</span>
                <span class="font-bold">{{ item.choice }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="greenItems.length > 0" class="mb-8 animate-fade-in-up" style="animation-delay: 0.3s">
      <div class="flex items-center gap-2 mb-4 text-success font-bold text-lg uppercase tracking-wider border-b-2 border-success/20 pb-1">
        <span>👌</span> 可接受 / Nice to have
      </div>
      <div class="flex flex-wrap gap-2 bg-base-200/30 p-4 rounded-xl border border-base-content/5">
        <div v-for="item in greenItems" :key="item.id" class="badge badge-success badge-outline bg-success/5 h-auto py-2 px-3 gap-2">
          <span class="opacity-50 text-xs font-normal border-r border-success/30 pr-2 mr-0.5 text-base-content">{{ item.title }}</span>
          <span class="font-bold">{{ item.choice }}</span>
        </div>
      </div>
    </div>

    <div class="flex flex-col gap-3 mt-8">
      <button v-if="!isPreviewMode" @click="handleCopy" class="btn btn-primary w-full shadow-lg">
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