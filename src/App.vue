<script setup lang="ts">
import MainLayout from './components/MainLayout.vue';
import QuestionCard from './components/QuestionCard.vue';
import { useConfigStore } from './stores/useConfigStore';

// 临时造一个假题目用来测试
const demoQuestion = {
  id: "q_test",
  title: "测试题目：你喜欢什么颜色？",
  options: ["红色", "绿色", "蓝色 - 核心需求", "不知道", "无所谓"]
};
</script>

<template>
  <MainLayout>
    <div class="text-center mb-6">
      <h2 class="text-2xl font-bold">组件测试场</h2>
      <p class="opacity-70">试着点点下面的按钮，看看有没有烟花？</p>
    </div>

    <QuestionCard :question="demoQuestion" />
  </MainLayout>
</template>