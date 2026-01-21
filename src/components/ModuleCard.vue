<script setup lang="ts">
import { ref } from 'vue';
import type { Module } from '../types';

const props = defineProps<{
  module: Module;
  modelValue: boolean; // 是否选中
  disabled?: boolean;  // 是否禁用交互 (例如 A 模块强制开启)
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
}>();

const showModal = ref(false);

// 切换选中状态
function toggleSelection() {
  if (props.disabled) return;
  emit('update:modelValue', !props.modelValue);
}

// 弹窗内的“加入/移除并关闭”
function handleModalSelect() {
  // 保持原有逻辑：点击切换状态并关闭
  toggleSelection();
  showModal.value = false;
}

// 打开弹窗
function openModal() {
  showModal.value = true;
}
</script>

<template>
  <div>
    <div 
      class="relative group rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden select-none"
      :class="[
        // 选中态：品牌色 Ring + 淡色背景
        modelValue 
          ? 'bg-primary/5 border-transparent ring-2 ring-inset ring-primary' 
          // 未选中态：白底 + 浅灰边框 + 悬停微高亮
          : 'bg-base-100 border-base-200 hover:border-primary/30',
        
        // 禁用态 vs 激活态动效
        disabled ? 'opacity-60 cursor-not-allowed' : 'active:scale-[0.98]'
      ]"
      @click="openModal"
    >
      <div class="p-4 flex items-center justify-between gap-3 h-full">
        
        <div class="flex-1 min-w-0 flex flex-col gap-0.5">
          <h3 
            class="font-bold text-sm leading-tight transition-colors"
            :class="modelValue ? 'text-primary' : 'text-base-content'"
          >
            {{ module.name }}
          </h3>
          <p class="text-xs text-base-content/40 font-medium">
            {{ module.questions.length }} 个场景
          </p>
        </div>

        <div class="form-control flex-shrink-0" @click.stop>
          <input 
            type="checkbox" 
            class="toggle toggle-primary toggle-sm"
            :checked="modelValue"
            :disabled="disabled"
            @change="toggleSelection"
          />
        </div>
      </div>
    </div>

    <dialog class="modal modal-bottom sm:modal-middle" :class="{ 'modal-open': showModal }">
      <div class="modal-box bg-base-100 p-0 overflow-hidden max-h-[85vh] flex flex-col">
        
        <div class="px-6 pt-6 pb-2 shrink-0">
          <h3 class="font-bold text-lg text-base-content flex items-center gap-2">
            {{ module.name }}
            <span v-if="modelValue" class="text-xs font-normal text-primary bg-primary/10 px-2 py-0.5 rounded-full">已启用</span>
          </h3>
          <p class="text-xs text-base-content/40 mt-1 font-bold uppercase tracking-wider">
            场景清单 ({{ module.questions.length }})
          </p>
        </div>
        
        <div class="flex-1 overflow-y-auto px-6 py-2">
          <ul class="flex flex-col">
            <li 
              v-for="(q, idx) in module.questions" 
              :key="q.id" 
              class="py-3 border-b border-base-200/50 last:border-none flex gap-3 group"
            >
              <span class="text-xs font-mono text-base-content/30 mt-1 w-5 flex-shrink-0 select-none">{{ idx + 1 }}.</span>
              <span class="text-sm text-base-content/80 leading-relaxed group-hover:text-base-content transition-colors">
                {{ q.title_long }}
              </span>
            </li>
          </ul>
        </div>

        <div class="p-4 bg-base-100/95 border-t border-base-200 flex justify-between gap-3 shrink-0 pb-safe">
          
          <button 
            @click="handleModalSelect"
            class="btn flex-1 no-animation shadow-none font-bold"
            :class="modelValue ? 'btn-outline btn-error hover:bg-error hover:text-white' : 'btn-primary text-primary-content'"
            :disabled="disabled"
          >
            <span v-if="modelValue">移除配置</span>
            <span v-else>加入配置</span>
          </button>

          <button class="btn btn-ghost flex-1 text-base-content/60 font-normal hover:bg-base-200" @click="showModal = false">
            返回
          </button>
        </div>
      </div>
      
      <form method="dialog" class="modal-backdrop bg-base-content/20 backdrop-blur-sm">
        <button @click="showModal = false">close</button>
      </form>
    </dialog>
  </div>
</template>

<style scoped>
.pb-safe {
  padding-bottom: env(safe-area-inset-bottom, 20px);
}
</style>