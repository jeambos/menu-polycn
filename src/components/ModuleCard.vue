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

// 弹窗内的“加入配置并关闭”
function handleModalSelect() {
  // 只有当当前未选中时，点击才执行“加入”操作
  // 如果已经选中了，点击其实就是保持选中。
  // 按照需求：点击后切换状态。
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
      class="card bg-base-100 border transition-all duration-200 cursor-pointer hover:shadow-md active:scale-[0.99]"
      :class="modelValue ? 'border-primary/50 bg-primary/5' : 'border-base-content/10'"
      @click="openModal"
    >
      <div class="card-body p-4 flex flex-row items-center justify-between gap-4">
        
        <div class="flex-1 min-w-0">
          <h3 class="font-bold text-base flex items-center gap-2">
            {{ module.name }}
            <span v-if="modelValue" class="badge badge-primary badge-xs">已启用</span>
          </h3>
          <p class="text-xs opacity-50 mt-1 truncate">
            包含 {{ module.questions.length }} 个场景
          </p>
        </div>

        <div class="form-control" @click.stop>
          <input 
            type="checkbox" 
            class="toggle toggle-primary"
            :checked="modelValue"
            :disabled="disabled"
            @change="toggleSelection"
          />
        </div>
      </div>
    </div>

    <dialog class="modal modal-bottom sm:modal-middle" :class="{ 'modal-open': showModal }">
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">{{ module.name }} - 场景清单</h3>
        
        <ul class="menu bg-base-200 rounded-box overflow-y-auto max-h-[60vh] flex-nowrap">
          <li v-for="(q, idx) in module.questions" :key="q.id" class="disabled">
            <a class="flex items-start gap-3 py-3 cursor-default">
              <span class="badge badge-ghost badge-sm mt-0.5">{{ idx + 1 }}</span>
              <span class="text-sm opacity-80 leading-relaxed">{{ q.title_long }}</span>
            </a>
          </li>
        </ul>

        <div class="modal-action flex justify-between items-center mt-6">
          
          <button 
            @click="handleModalSelect"
            class="btn gap-2"
            :class="modelValue ? 'btn-error btn-outline' : 'btn-primary'"
            :disabled="disabled"
          >
            <input 
              type="checkbox" 
              class="checkbox checkbox-sm pointer-events-none" 
              :checked="modelValue" 
            />
            <span>加入配置</span>
          </button>

          <button class="btn btn-ghost" @click="showModal = false">
            返回
          </button>
        </div>
      </div>
      
      <form method="dialog" class="modal-backdrop">
        <button @click="showModal = false">close</button>
      </form>
    </dialog>
  </div>
</template>