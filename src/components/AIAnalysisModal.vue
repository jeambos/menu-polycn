<script setup lang="ts">
import { ref, watch } from 'vue';
import { useClipboard } from '@vueuse/core';
import BaseModal from './BaseModal.vue';
import { useAIReport, AI_TOOLS } from '../composables/useAIReport';

const props = defineProps<{
  modelValue: boolean;
  codeA: string;
  codeB?: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void;
}>();

const { copy, copied } = useClipboard();
const { generateReport, isLoading, errorMsg } = useAIReport();
const promptResult = ref('');

watch(() => props.modelValue, async (isOpen) => {
  if (isOpen && props.codeA) {
    promptResult.value = await generateReport(props.codeA, props.codeB);
  }
});

function handleCopyAndLink(url: string) {
  copy(promptResult.value);
  setTimeout(() => {
    window.open(url, '_blank');
  }, 300);
}
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    title="复制提示词"
    :show-close="true"
  >
    <div class="space-y-6">
      
      <p class="text-sm opacity-70 leading-relaxed font-medium">
        请复制以下提示词（包含您的测试结果信息）到您常用的 AI，开启一个新对话，粘贴给它，您将获得一份完整的分析报告。
      </p>

      <div class="relative group">
        
        <div v-if="isLoading" class="h-48 w-full bg-base-content/5 rounded-xl animate-pulse p-4 space-y-3">
          <div class="h-3 bg-base-content/10 rounded w-1/3"></div>
          <div class="h-3 bg-base-content/10 rounded w-full"></div>
          <div class="h-3 bg-base-content/10 rounded w-5/6"></div>
          <div class="h-3 bg-base-content/10 rounded w-4/5"></div>
        </div>

        <div v-else-if="errorMsg" class="h-48 flex flex-col items-center justify-center text-error bg-error/5 rounded-xl border border-error/10 p-4 text-center">
          <i-ph-warning-circle-bold class="text-2xl mb-2" />
          <span class="text-sm font-bold">{{ errorMsg }}</span>
        </div>

        <textarea 
          v-else
          :value="promptResult"
          readonly
          class="textarea w-full h-48 text-xs font-mono leading-relaxed p-3 bg-base-200/50 border border-base-content/10 focus:outline-none resize-none rounded-xl selection:bg-primary/20 text-base-content/60"
        ></textarea>
      </div>

      <div v-if="!isLoading && !errorMsg">
        <button 
          @click="copy(promptResult)" 
          class="btn btn-neutral w-full shadow-md gap-2 rounded-xl"
        >
          <i-ph-check-bold v-if="copied" class="text-success text-lg" />
          <i-ph-copy-bold v-else class="text-lg" />
          <span class="font-bold">{{ copied ? '已复制成功' : '一键复制提示词与结果数据' }}</span>
        </button>
      </div>

      <div v-if="!isLoading && !errorMsg" class="animate-fade-in-up border-t border-base-content/5 pt-6">
        <div class="flex items-center gap-2 mb-4 opacity-50">
          <i-ph-arrow-square-out-bold />
          <span class="text-xs font-bold uppercase tracking-wider">再点此跳转 / Copy & Go</span>
        </div>
        
        <div class="grid grid-cols-2 gap-3">
          <button 
            v-for="tool in AI_TOOLS" 
            :key="tool.name"
            @click="handleCopyAndLink(tool.url)"
            class="btn btn-outline btn-sm h-auto py-3 justify-start px-4 gap-3 border-base-content/10 hover:bg-base-content hover:text-base-100 hover:border-transparent group transition-all"
          >
            <component :is="tool.icon" class="text-xl opacity-80 group-hover:opacity-100 shrink-0" />
            <span class="text-sm font-medium opacity-80 group-hover:opacity-100 truncate">{{ tool.name }}</span>
          </button>
        </div>

        <p class="text-xs text-center mt-4 opacity-40">
          您也可以自行跳转自己常用的 AI 工具。
        </p>
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