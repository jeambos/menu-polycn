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
    class="modal modal-middle backdrop-blur-md transition-all duration-300"
    @close="handleClose"
    @cancel.prevent="handleClose"
  >
    <div class="modal-box w-[92%] max-w-md shadow-2xl border border-base-content/10 relative overflow-hidden bg-base-100 p-0 rounded-[2rem]">
      
      <div v-if="title || showClose" class="px-6 pt-6 pb-4 flex justify-between items-center">
        <h3 v-if="title" class="font-black text-xl text-base-content tracking-tighter">
          {{ title }}
        </h3>
        <button 
          v-if="showClose" 
          @click="handleClose" 
          class="btn btn-sm btn-circle btn-ghost text-base-content/40 hover:bg-base-content/10 hover:text-base-content transition-all"
        >
          <i-ph-x-bold class="text-lg" />
        </button>
      </div>

      <div class="px-6 pb-6 text-base-content/70 text-base leading-relaxed font-medium break-words">
        <slot></slot>
      </div>

      <div 
        v-if="$slots.actions" 
        class="px-6 py-5 sm:py-4 bg-base-content/[0.02] border-t border-base-content/5 flex gap-3 justify-end items-center flex-wrap"
      >
        <div class="flex gap-3 justify-end items-center w-full mb-safe-offset-4"> 
          <div class="flex gap-3 justify-end items-center w-full pb-4 sm:pb-0">
            <slot name="actions"></slot>
          </div>
        </div>
      </div>
    </div>

    <form method="dialog" class="modal-backdrop bg-black/20" v-if="!persistent">
      <button @click="handleClose">close</button>
    </form>
  </dialog>
</template>
<style scoped>
.pb-safe {
  padding-bottom: env(safe-area-inset-bottom, 20px);
}
</style>