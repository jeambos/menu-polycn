<script setup lang="ts">
import AppHeader from './components/AppHeader.vue'; // 引入组件
import { onMounted } from 'vue';

// --- 强制注入主题 ---
onMounted(() => {
  // 强制给 html 标签加上 data-theme="light"
  document.documentElement.setAttribute('data-theme', 'light');
  console.log('主题已强制设置为 light (浅色)');
});

</script>

<template>
  <div class="min-h-screen bg-base-100 text-base-content font-sans">
    <AppHeader />
    
    <div class="container mx-auto px-4 py-4 max-w-4xl">
      <router-view></router-view>
    </div>
  </div>
</template>