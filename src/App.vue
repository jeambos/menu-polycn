<script setup lang="ts">
import AppHeader from './components/AppHeader.vue'; // 引入组件



</script>

<template>
  <div class="min-h-screen bg-base-100 text-base-content font-sans">
    <AppHeader />
    
    <div class="container mx-auto px-4 py-4 max-w-4xl">
      <router-view></router-view>
    </div>
  </div>
</template>