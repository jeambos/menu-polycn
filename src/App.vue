<script setup lang="ts">
import AppHeader from './components/AppHeader.vue';
import CloudArchiveModal from './components/CloudArchiveModal.vue';
import { useConfigStore } from './stores/useConfigStore';
import { encode } from './logic/codec'; 
import { useCloudArchive } from './composables/useCloudArchive';

const configStore = useConfigStore();
// 1. 解构出 isModalOpen 状态
const { registerCodeGenerator, isModalOpen } = useCloudArchive();

registerCodeGenerator(() => {
  return encode(configStore.answers, configStore.targetAvatar);
});
</script>

<template>
  <div class="min-h-screen bg-base-100 text-base-content font-sans">
    <AppHeader />
    
    <div class="container mx-auto px-4 py-4 max-w-4xl">
  <router-view></router-view>
  
  <Teleport to="body">
    <div 
      class="fixed inset-0 z-[9999] transition-all duration-200"
      :class="isModalOpen ? 'visible pointer-events-auto' : 'invisible pointer-events-none'"
    >
      <CloudArchiveModal />
    </div>
  </Teleport>
      
    </div>
  </div>
</template>