<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
// 引入 Waline 组件和样式
import { Waline } from '@waline/client/component';
import '@waline/client/dist/waline.css';

import questionsData from '../data/questions.json';
import BaseModal from '../components/BaseModal.vue';
import type { Module } from '../types'; // 假设你有这个类型定义，如果没有可以用 any

const router = useRouter();

// --- 1. 数据准备 ---
const allModules = (questionsData.modules as unknown) as Module[];

// --- 2. 筛选逻辑 (复用 Result/Compare 的逻辑) ---
const activeModuleIds = ref<string[]>(allModules.map(m => m.id));

function toggleModuleFilter(moduleId: string) {
  const idx = activeModuleIds.value.indexOf(moduleId);
  if (idx > -1) {
    // 允许全部取消，因为这里不是对比核心，只是查看列表
    activeModuleIds.value.splice(idx, 1);
  } else {
    activeModuleIds.value.push(moduleId);
  }
}

function toggleAllFilters() {
  if (activeModuleIds.value.length === allModules.length) {
    activeModuleIds.value = [];
  } else {
    activeModuleIds.value = allModules.map(m => m.id);
  }
}

// 计算当前显示的模块
const filteredModules = computed(() => {
  return allModules.filter(m => activeModuleIds.value.includes(m.id));
});

// --- 3. 弹窗与评论区逻辑 ---
const showModal = ref(false);
const activeQuestion = ref<any>(null); // 当前选中的题目对象

const walineServerURL = 'http://comments.polycn.org/';

// 打开弹窗
function openReview(question: any, moduleName: string) {
  activeQuestion.value = {
    ...question,
    moduleName // 把模块名也带进去，方便展示上下文
  };
  showModal.value = true;
}

// 动态计算 Path：策略 B
// 例如：/review/q_1 (加个 q_ 前缀避免纯数字 ID 可能的问题)
const currentWalinePath = computed(() => {
  if (!activeQuestion.value) return '/review/general';
  return `/review/q_${activeQuestion.value.id}`;
});

// 辅助交互：双击回顶
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
</script>

<template>
  <div class="pb-32 pt-10 px-6 max-w-3xl mx-auto min-h-screen font-sans text-base">
    
    <div class="text-center mb-10">
      <h2 class="text-3xl font-bold text-base-content tracking-tight mb-2">
        文案众包校对
      </h2>
      <p class="text-sm text-base-content/40 uppercase tracking-widest font-medium">
        Community Copy Review
      </p>
      <p class="text-xs text-base-content/60 mt-4 max-w-md mx-auto leading-relaxed">
        如果你发现文案有歧义、错别字或表意不清，请点击对应题目提交建议。<br>
        你的反馈将直接帮助我们完善这份蓝图。
      </p>
    </div>

    <div class="mb-10 sticky top-4 z-30">
      <div class="flex items-center justify-center gap-2 mb-3 opacity-40">
        <i-ph-funnel-bold />
        <span class="text-xs font-bold uppercase tracking-wider">Filter Modules</span>
      </div>
      <div class="flex flex-wrap gap-3 justify-center bg-base-100/80 backdrop-blur-sm p-4 rounded-2xl border border-base-content/5 shadow-sm">
        <button 
          @click="toggleAllFilters"
          class="btn btn-sm h-9 px-4 rounded-full transition-all border shadow-sm gap-1.5"
          :class="[
            activeModuleIds.length === allModules.length 
              ? 'bg-base-content text-base-100 border-base-content hover:bg-base-content/80' 
              : 'bg-base-100 text-base-content/60 border-base-content/10 hover:border-base-content/30 hover:bg-base-200'
          ]"
        >
          <i-ph-checks-bold />
          <span>All</span>
        </button>

        <button 
          v-for="mod in allModules" 
          :key="mod.id"
          @click="toggleModuleFilter(mod.id)"
          class="btn btn-sm h-9 px-4 rounded-full transition-all border shadow-sm"
          :class="[
            activeModuleIds.includes(mod.id) 
              ? 'bg-base-content text-base-100 border-base-content hover:bg-base-content/80' 
              : 'bg-base-100 text-base-content/60 border-base-content/10 hover:border-base-content/30 hover:bg-base-200'
          ]"
        >
          {{ mod.name.replace(/^(模块\s*[A-J][：:]\s*)/, '').replace(/📦 |⚛️ /g, '') }}
        </button>
      </div>
    </div>

    <div class="space-y-12">
      <div 
        v-for="mod in filteredModules" 
        :key="mod.id" 
        class="animate-fade-in-up"
      >
        <div 
          class="sticky top-44 z-20 bg-base-100/95 backdrop-blur-md py-4 mb-6 -mx-6 px-7 border-b border-base-content/5 flex items-center gap-2 cursor-pointer hover:bg-base-100 transition-colors text-base-content/80"
          @dblclick="scrollToTop"
        >
          <span class="font-mono text-xs opacity-40 border border-base-content/20 rounded px-1.5 py-0.5">
            {{ mod.id }}
          </span>
          <div>
            <h3 class="text-lg font-bold uppercase tracking-wider leading-none">
              {{ mod.name.replace(/^(模块\s*[A-J][：:]\s*)/, '') }}
            </h3>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-4">
          <div 
            v-for="q in mod.questions" 
            :key="q.id"
            @click="openReview(q, mod.name)"
            class="group bg-base-100 border border-base-content/10 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-primary/30 transition-all cursor-pointer relative overflow-hidden"
          >
            <div class="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity text-primary">
              <i-ph-pencil-simple-bold class="text-xl" />
            </div>

            <div class="pr-8">
              <div class="flex items-center gap-2 mb-3">
                <span class="text-xs font-mono opacity-30">#{{ q.id }}</span>
                <h4 class="font-bold text-base-content/90">{{ q.title }}</h4>
              </div>
              
              <div class="flex flex-wrap gap-2">
                <span 
                  v-for="(opt, idx) in q.options" 
                  :key="idx"
                  class="badge badge-sm badge-ghost bg-base-200/50 text-base-content/60 h-auto py-1.5 px-2.5 text-xs border-0"
                >
                  {{ typeof opt === 'string' ? opt : (opt.short || opt.long) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-16 text-center border-t border-base-content/5 pt-8">
      <button @click="router.push('/')" class="btn btn-ghost btn-sm opacity-60 hover:opacity-100">
        返回首页
      </button>
    </div>

    <BaseModal 
      v-model="showModal" 
      :title="activeQuestion ? `校对：${activeQuestion.title}` : '文案校对'"
      show-close
    >
      <div v-if="activeQuestion">
        <div class="bg-base-200/50 p-4 rounded-xl border border-base-content/5 mb-6 text-sm">
          <div class="flex items-center gap-2 text-xs opacity-50 mb-2 font-mono">
            <span>Module {{ activeQuestion.moduleName }}</span>
            <span>•</span>
            <span>ID: {{ activeQuestion.id }}</span>
          </div>
          
          <div class="grid gap-2">
            <div class="font-bold text-base-content/70 mb-1">选项列表：</div>
            <div 
              v-for="(opt, idx) in activeQuestion.options" 
              :key="idx"
              class="flex gap-2 items-start"
            >
              <span class="badge badge-xs mt-1 bg-base-content/10 text-base-content/50">{{ idx + 1 }}</span>
              <div class="flex-1">
                <span class="font-bold mr-2">{{ typeof opt === 'string' ? opt : (opt.short || '无短标题') }}</span>
                <span v-if="typeof opt !== 'string' && opt.long" class="opacity-60 text-xs">
                  ({{ opt.long }})
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="waline-container">
          <Waline 
            :serverURL="walineServerURL" 
            :path="currentWalinePath"
            placeholder="请在此提交您的修改建议或反馈..."
            :dark="false" 
          />
        </div>
      </div>
    </BaseModal>

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

/* 针对 Waline 的微调，使其更贴合你的 UI */
:deep(.wl-panel) {
  border: 1px solid rgba(0,0,0,0.05);
  border-radius: 1rem;
  padding: 1rem;
  background: white;
}
:deep(.wl-editor) {
  min-height: 5rem;
  padding: 0.5rem;
}
</style>