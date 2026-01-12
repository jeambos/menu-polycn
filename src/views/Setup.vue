<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useConfigStore } from '../stores/useConfigStore';
import ModuleCard from '../components/ModuleCard.vue';
import questionsData from '../data/questions.json'; // 导入我们的大数据库
import type { Module } from '../types';

const router = useRouter();
const store = useConfigStore();

// 从 JSON 中读取所有模块列表
const modules = questionsData.modules as Module[];

// 计算选了多少题
const totalQuestions = computed(() => {
  return modules
    .filter(m => store.isModuleEnabled(m.id))
    .reduce((sum, m) => sum + m.questions.length, 0);
});

function startQuiz() {
  // 这里可以加一个重置当前进度的逻辑，或者直接开始
  router.push('/quiz');
}
</script>

<template>
  <div class="pb-20"> <div class="mb-6">
      <h2 class="text-2xl font-bold">配置模块</h2>
      <p class="opacity-60 text-sm mt-1">
        已选 {{ totalQuestions }} 道题。关闭不感兴趣的模块可缩短时间。
      </p>
    </div>

    <div>
      <ModuleCard
        v-for="mod in modules"
        :key="mod.id"
        :module="mod"
        :model-value="store.isModuleEnabled(mod.id)"
        @update:model-value="store.toggleModule(mod.id)"
      />
    </div>

    <div class="fixed bottom-0 left-0 right-0 p-4 bg-base-100/80 backdrop-blur-md border-t border-base-content/10 flex justify-center z-20">
      <button @click="startQuiz" class="btn btn-primary w-full max-w-md shadow-lg text-lg">
        进入答题 ({{ totalQuestions }}题) 🚀
      </button>
    </div>
  </div>
</template>