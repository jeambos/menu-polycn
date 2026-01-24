<script setup lang="ts">
import { ref, computed, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { Waline } from '@waline/client/component';
// 忽略 TS 检查以引入样式别名
// @ts-ignore
import '@waline/client/style'; 

import questionsData from '../data/questions.json';
import BaseModal from '../components/BaseModal.vue';
import type { Module } from '../types';

const router = useRouter();

// --- 1. 数据准备 ---
const allModules = (questionsData.modules as unknown) as Module[];

// --- 2. 筛选逻辑 ---
const activeModuleIds = ref<string[]>(allModules.map(m => m.id));

function toggleModuleFilter(moduleId: string) {
  const idx = activeModuleIds.value.indexOf(moduleId);
  if (idx > -1) {
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

const filteredModules = computed(() => {
  return allModules.filter(m => activeModuleIds.value.includes(m.id));
});

// --- 3. 弹窗与评论逻辑 ---
const showModal = ref(false);
const activeQuestion = ref<any>(null);
const walineServerURL = 'https://comments.polycn.org/';

// 计算当前评论区 Path (每题一个独立评论区)
const currentWalinePath = computed(() => {
  if (!activeQuestion.value) return '/review/general';
  return `/review/q_${activeQuestion.value.id}`;
});

/**
 * 打开校对弹窗并自动填充引用文本
 */
async function openReview(question: any, moduleName: string, optionItem?: any) {
  activeQuestion.value = {
    ...question,
    moduleName
  };
  showModal.value = true;

  // 生成引用文本
  let quoteText = '';
  if (optionItem) {
    // 针对选项
    const shortText = typeof optionItem === 'string' ? optionItem : (optionItem.short || '无');
    const longText = typeof optionItem === 'string' ? optionItem : (optionItem.long || '');
    quoteText = `> 针对选项 [${shortText}]\n> 原文：${longText}\n建议修改为：`;
  } else {
    // 针对题目
    quoteText = `> 针对题目 [${question.title}]\n建议修改为：`;
  }

  // 尝试自动填入输入框
  await nextTick();
  // 稍微延迟以确保 Waline 组件加载完毕
  setTimeout(() => {
    // 查找输入框 (注意：这是 Waline 内部的类名)
    const textarea = document.querySelector('.wl-editor') as HTMLTextAreaElement;
    if (textarea) {
      if (!textarea.value.includes(quoteText)) {
        textarea.value = quoteText + textarea.value;
        textarea.focus();
        // 移动光标到最后
        textarea.setSelectionRange(textarea.value.length, textarea.value.length);
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
  }, 300);
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
</script>

<template>
  <div class="pb-40 pt-10 px-4 sm:px-6 max-w-3xl mx-auto min-h-screen font-sans text-base text-base-content">
    
    <div class="text-center mb-10">
      <h2 class="text-3xl font-bold tracking-tight mb-3">
        文案众包校对
      </h2>
      <p class="text-sm text-base-content/40 uppercase tracking-widest font-medium">
        Community Copy Review
      </p>
      <p class="text-sm text-base-content/60 mt-4 max-w-md mx-auto leading-relaxed">
        点击任意行（题目或选项）即可提交修改建议。<br>
        您的反馈将帮助我们完善内容。
      </p>
    </div>

    <div class="mb-10 sticky top-4 z-30">
      <div class="flex flex-wrap gap-3 justify-center bg-base-100/90 backdrop-blur-md p-4 rounded-2xl border border-base-content/5 shadow-sm">
        <button 
          @click="toggleAllFilters"
          class="btn btn-sm h-10 px-5 rounded-full transition-all border shadow-sm gap-2 text-sm font-medium"
          :class="[
            activeModuleIds.length === allModules.length 
              ? 'bg-base-content text-base-100 border-base-content hover:bg-base-content/80' 
              : 'bg-base-100 text-base-content/60 border-base-content/10 hover:border-base-content/30 hover:bg-base-200'
          ]"
        >
          <i-ph-checks-bold class="text-lg"/>
          <span>All</span>
        </button>

        <button 
          v-for="mod in allModules" 
          :key="mod.id"
          @click="toggleModuleFilter(mod.id)"
          class="btn btn-sm h-10 px-5 rounded-full transition-all border shadow-sm text-sm"
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

    <div class="space-y-16">
      <div 
        v-for="mod in filteredModules" 
        :key="mod.id" 
        class="animate-fade-in-up"
      >
        <div 
          class="sticky top-28 z-20 bg-base-100/95 backdrop-blur-md py-4 mb-6 -mx-4 px-6 border-b border-base-content/5 flex items-center gap-3 cursor-pointer hover:bg-base-100 transition-colors text-base-content/80"
          @dblclick="scrollToTop"
        >
          <span class="font-mono text-sm opacity-40 border border-base-content/20 rounded px-2 py-0.5">
            {{ mod.id }}
          </span>
          <h3 class="text-xl font-bold uppercase tracking-wider leading-none">
            {{ mod.name.replace(/^(模块\s*[A-J][：:]\s*)/, '') }}
          </h3>
        </div>

        <div class="flex flex-col gap-8">
          <div 
            v-for="q in mod.questions" 
            :key="q.id"
            class="bg-base-100 border border-base-content/10 rounded-2xl overflow-hidden shadow-sm"
          >
            <div 
              @click="openReview(q, mod.name)"
              class="p-5 bg-base-200/30 border-b border-base-content/5 flex items-start gap-4 cursor-pointer active:bg-base-200/60 transition-colors"
            >
              <div class="shrink-0 mt-0.5 text-primary">
                 <i-ph-pencil-simple-bold class="text-xl" />
              </div>

              <div class="flex-1 flex flex-col gap-2">
                <div class="flex items-baseline gap-2">
                  <span class="font-mono text-sm text-base-content/40">#{{ q.id }}</span>
                  <h4 class="text-lg font-bold text-base-content leading-snug">
                    {{ q.title_long || q.title }}
                  </h4>
                </div>
                <div class="flex items-center gap-2 text-sm">
                  <span class="opacity-50">短标题预览:</span>
                  <span class="badge badge-lg bg-base-content/5 border-base-content/10 text-base-content/70 h-auto py-1 px-3">
                    {{ q.title_short || q.title }}
                  </span>
                </div>
              </div>
            </div>

            <div class="divide-y divide-base-content/5">
              <div 
                v-for="(opt, idx) in q.options" 
                :key="idx"
                @click="openReview(q, mod.name, opt)"
                class="p-4 pl-5 flex items-start gap-4 cursor-pointer active:bg-base-content/[0.04] hover:bg-base-content/[0.02] transition-colors"
              >
                <div class="shrink-0 mt-1 text-primary/40">
                  <i-ph-pencil-simple-bold class="text-lg" />
                </div>

                <div class="flex-1 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div class="flex flex-col gap-1.5">
                    <div class="text-base font-medium text-base-content/90 leading-relaxed">
                      {{ typeof opt === 'string' ? opt : (opt.long || opt.short) }}
                    </div>
                    <div class="flex items-center gap-2 text-sm text-base-content/50">
                      <i-ph-arrow-elbow-down-right class="opacity-50" />
                      <span>缩略为: {{ typeof opt === 'string' ? opt : (opt.short || '同上') }}</span>
                    </div>
                  </div>

                  <div class="shrink-0 sm:self-center self-start mt-1 sm:mt-0">
                    <div class="badge h-auto py-2.5 px-4 gap-2 bg-success/10 border border-success/20 rounded-lg whitespace-nowrap pointer-events-none">
                      <span class="text-success/70 text-sm font-normal border-r border-success/20 pr-2 mr-0.5">
                        {{ q.title_short || q.title }}
                      </span>
                      <span class="text-success font-bold text-sm">
                        {{ typeof opt === 'string' ? opt : (opt.short || opt.long) }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-20 text-center border-t border-base-content/5 pt-10">
      <button @click="router.push('/')" class="btn btn-ghost btn-md gap-2 text-base-content/60 hover:text-base-content">
        <i-ph-arrow-left-bold />
        返回首页
      </button>
    </div>

    <BaseModal 
      v-model="showModal" 
      :title="activeQuestion ? `校对：${activeQuestion.title}` : '文案校对'"
      show-close
    >
      <div v-if="activeQuestion">
        <div class="bg-base-200/50 p-3 rounded-lg border border-base-content/5 mb-4">
          <div class="flex items-center gap-2 text-sm opacity-50 font-mono">
            <span class="badge badge-sm badge-ghost">Module {{ activeQuestion.moduleName }}</span>
            <span>ID: {{ activeQuestion.id }}</span>
          </div>
        </div>

        <div class="waline-custom-container">
          <Waline 
            :serverURL="walineServerURL" 
            :path="currentWalinePath"
            placeholder="请在此提交您的修改建议..."
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

/* --- Waline 样式深度定制 --- */

/* 1. 隐藏多余的 Action 工具栏 (表情、图片等) */
:deep(.wl-actions) {
  display: none !important;
}

/* 2. 调整外层容器边距 */
:deep(.wl-panel) {
  margin: 0 !important;
  padding: 0 !important;
  border: none !important;
  background: transparent !important;
}

/* 3. 输入框定制：扩大高度，减小内边距 */
:deep(.wl-editor) {
  min-height: 10rem !important; /* 扩大输入区域 */
  padding: 0.75rem !important;   /* 减小 Padding */
  margin-bottom: 0.75rem !important;
  border: 1px solid rgba(0,0,0,0.1);
  border-radius: 0.75rem;
  font-size: 1rem; /* 保证字号舒适 */
  line-height: 1.6;
  background: rgba(255,255,255,0.8);
}
:deep(.wl-editor:focus) {
  background: white;
  border-color: currentColor;
}

/* 4. 提交按钮区域微调 */
:deep(.wl-footer) {
  margin: 0 !important;
  padding: 0 !important;
}
:deep(.wl-btn) {
  border-radius: 0.5rem;
  padding: 0.5rem 1.5rem;
  font-size: 0.875rem;
  font-weight: bold;
}

/* 5. 评论列表微调 */
:deep(.wl-cards) {
  margin-top: 1.5rem;
}
:deep(.wl-item) {
  padding-bottom: 1rem;
  border-bottom: 1px dashed rgba(0,0,0,0.05);
}
</style>