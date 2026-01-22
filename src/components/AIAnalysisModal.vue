<script setup lang="ts">
import { ref, watch } from 'vue';
import { useClipboard } from '@vueuse/core';
import BaseModal from './BaseModal.vue';
import { useAIReport, AI_TOOLS } from '../composables/useAIReport';

// 定义接口，支持单人或双人模式
const props = defineProps<{
  modelValue: boolean;
  codeA: string;      // 必传：第一个人的代码
  codeB?: string;     // 可选：第二个人的代码（对比模式）
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void;
}>();

const { copy, copied } = useClipboard();
const { generateReport, isLoading, errorMsg } = useAIReport();

const promptResult = ref('');

// 监听弹窗打开状态
watch(() => props.modelValue, async (isOpen) => {
  if (isOpen && props.codeA) {
    // 每次打开时重新生成，确保数据最新
    // 如果想要缓存，可以加个判断：if (!promptResult.value)
    promptResult.value = await generateReport(props.codeA, props.codeB);
  }
});

function handleCopyAndLink(url: string) {
  copy(promptResult.value);
  // 给予用户微小的反馈延迟，体验更顺滑
  setTimeout(() => {
    window.open(url, '_blank');
  }, 300);
}
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    title="🤖 AI 深度分析报告"
    :show-close="true"
  >
    <div class="space-y-5">
      <p class="text-sm opacity-60 leading-relaxed">
        请复制下方提示词，发送给 AI 助手（如 ChatGPT/DeepSeek），获取基于心理学数据的专业分析报告。
      </p>

      <div class="relative group">
        
        <div v-if="isLoading" class="h-60 w-full bg-base-content/5 rounded-xl animate-pulse p-4 space-y-3 border border-transparent">
          <div class="h-3 bg-base-content/10 rounded w-1/4"></div>
          <div class="h-3 bg-base-content/10 rounded w-full"></div>
          <div class="h-3 bg-base-content/10 rounded w-5/6"></div>
          <div class="h-3 bg-base-content/10 rounded w-3/4"></div>
        </div>

        <div v-else-if="errorMsg" class="h-60 flex flex-col items-center justify-center text-error bg-error/5 rounded-xl border border-error/10 p-4 text-center">
          <i-ph-warning-circle-bold class="text-2xl mb-2" />
          <span class="text-sm font-bold">{{ errorMsg }}</span>
        </div>

        <textarea 
          v-else
          :value="promptResult"
          readonly
          class="textarea w-full h-60 text-xs font-mono leading-relaxed p-3 bg-base-content/5 focus:outline-none resize-none rounded-xl border border-transparent focus:bg-base-content/10 transition-colors selection:bg-primary/20"
        ></textarea>
        
        <div v-if="!isLoading && !errorMsg" class="absolute bottom-3 right-3">
           <button 
             @click="copy(promptResult)" 
             class="btn btn-xs btn-neutral shadow-sm gap-1"
           >
             <i-ph-check-bold v-if="copied" class="text-success" />
             <i-ph-copy-bold v-else />
             {{ copied ? '已复制' : '复制' }}
           </button>
        </div>
      </div>

      <div v-if="!isLoading && !errorMsg" class="animate-fade-in-up">
        <div class="flex items-center gap-2 mb-3 opacity-50">
          <i-ph-arrow-square-out-bold />
          <span class="text-xs font-bold uppercase tracking-wider">复制提示词并跳转</span>
        </div>
        
        <div class="grid grid-cols-3 gap-2">
          <button 
            v-for="tool in AI_TOOLS" 
            :key="tool.name"
            @click="handleCopyAndLink(tool.url)"
            class="btn btn-outline btn-xs h-auto py-2.5 flex-col gap-1 border-base-content/10 hover:bg-base-content hover:text-base-100 hover:border-transparent group transition-all"
          >
            <component :is="tool.icon" class="text-lg opacity-80 group-hover:opacity-100" />
            <span class="scale-90 font-normal opacity-80 group-hover:opacity-100">{{ tool.name }}</span>
          </button>
        </div>
      </div>
    </div>

    <template #actions>
      <button class="btn btn-ghost w-full" @click="emit('update:modelValue', false)">
        关闭
      </button>
    </template>
  </BaseModal>
</template>

<style scoped>
.animate-fade-in-up {
  animation: fadeInUp 0.4s ease-out backwards;
}
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>