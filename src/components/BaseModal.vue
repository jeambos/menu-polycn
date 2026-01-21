<script setup lang="ts">
import { watch, ref } from 'vue';

const props = defineProps<{
  modelValue: boolean;
  title?: string;
  persistent?: boolean; // 是否强制（点击背景不关闭）
  showClose?: boolean;  // 是否显示右上角关闭按钮
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'close'): void;
}>();

const dialogRef = ref<HTMLDialogElement | null>(null);

// 监听 modelValue 变化来驱动 dialog 的原生方法
watch(() => props.modelValue, (val) => {
  if (!dialogRef.value) return;
  if (val) {
    dialogRef.value.showModal();
  } else {
    dialogRef.value.close();
  }
});

function handleClose() {
  if (props.persistent) return;
  emit('update:modelValue', false);
  emit('close');
}
</script>

<template>
  <dialog 
    ref="dialogRef" 
    class="modal modal-bottom sm:modal-middle backdrop-blur-sm transition-all duration-200"
    @close="handleClose"
    @cancel.prevent="handleClose"
  >
    <div class="modal-box shadow-none border border-base-content/5 relative overflow-hidden bg-base-100 p-0">
      
      <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-base-content/10 to-transparent opacity-50"></div>

      <div v-if="title || showClose" class="px-6 pt-5 pb-2 flex justify-between items-start">
        <h3 v-if="title" class="font-bold text-lg text-base-content tracking-tight">
          {{ title }}
        </h3>
        <button 
          v-if="showClose" 
          @click="handleClose" 
          class="btn btn-sm btn-circle btn-ghost absolute right-4 top-4 text-base-content/40 hover:text-base-content"
        >
          ✕
        </button>
      </div>

      <div class="px-6 py-4 text-base-content/80 text-sm leading-relaxed">
        <slot></slot>
      </div>

      <div v-if="$slots.actions" class="p-4 bg-base-200/50 border-t border-base-content/5 flex gap-3 justify-end items-center flex-wrap pb-safe">
        <slot name="actions"></slot>
      </div>
    </div>

    <form method="dialog" class="modal-backdrop" v-if="!persistent">
      <button @click="handleClose">close</button>
    </form>
  </dialog>
</template>

<style scoped>
.pb-safe {
  padding-bottom: env(safe-area-inset-bottom, 20px);
}
</style>