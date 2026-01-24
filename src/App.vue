<script setup lang="ts">
import AppHeader from './components/AppHeader.vue'; // 引入组件
import CloudArchiveModal from './components/CloudArchiveModal.vue';

// 1. 引入 Store
import { useConfigStore } from './stores/useConfigStore';

// 2. 引入你的编码逻辑
import { encode } from './logic/codec'; 

// 3. 引入刚才写的云存档钩子
import { useCloudArchive } from './composables/useCloudArchive';


// --- 初始化 ---
const configStore = useConfigStore(); // 获取 Store 实例
const { registerCodeGenerator } = useCloudArchive();

// --- ✅ 关键步骤：注册生成器 ---
// 当弹窗需要代码时，它会执行这个函数
registerCodeGenerator(() => {
  // Pinia 的神奇之处：
  // 在组件里使用 configStore.answers 会自动解包，
  // 也就是说这里拿到的就是点击那一瞬间最新的 answers 对象，不需要写 .value
  return encode(configStore.answers, configStore.targetAvatar);
});

</script>

<template>
  <div class="min-h-screen bg-base-100 text-base-content font-sans">
    <AppHeader />
    
    <div class="container mx-auto px-4 py-4 max-w-4xl">
      <router-view></router-view>
      <CloudArchiveModal />
    </div>
  </div>
</template>