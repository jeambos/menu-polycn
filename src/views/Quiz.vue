<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useConfigStore } from '../stores/useConfigStore';
import QuestionCard from '../components/QuestionCard.vue';
import questionsData from '../data/questions.json';
import type { Module, Question, Certainty } from '../types';

const router = useRouter();
const store = useConfigStore();

// --- 1. 数据准备：生成题目播放列表 ---
const allModules = questionsData.modules as Module[];

// 计算出所有需要回答的题目（拍平数组）
const playlist = computed(() => {
  // 只保留 store 里开启的模块
  const enabledModules = allModules.filter(m => store.isModuleEnabled(m.id));
  
  // 将模块里的 questions 数组合并成一个巨大的题目数组
  let list: Question[] = [];
  enabledModules.forEach(m => {
    list = list.concat(m.questions);
  });
  return list;
});

// 当前做到第几题了 (Index)
const currentIndex = ref(0);

// 获取当前题目对象
const currentQuestion = computed(() => {
  if (playlist.value.length === 0) return null;
  return playlist.value[currentIndex.value];
});

// 计算进度百分比 (0 - 100)
const progress = computed(() => {
  if (playlist.value.length === 0) return 0;
  return Math.round(((currentIndex.value + 1) / playlist.value.length) * 100);
});

// --- 2. 导航逻辑 ---

function goNext() {
  if (currentIndex.value < playlist.value.length - 1) {
    currentIndex.value++;
    saveProgress(); // 自动存档
  } else {
    // 最后一题，去结果页
    finishQuiz();
  }
}

function goPrev() {
  if (currentIndex.value > 0) {
    currentIndex.value--;
    saveProgress();
  } else {
    //如果在第一题按后退，返回配置页
    router.back();
  }
}

function finishQuiz() {
  saveProgress();
  router.push('/result');
}

// 简单的本地存档，防止刷新丢失当前题号
function saveProgress() {
  localStorage.setItem('quiz_index', currentIndex.value.toString());
}

// 初始化：尝试恢复上次的题号
onMounted(() => {
  const savedIndex = localStorage.getItem('quiz_index');
  if (savedIndex) {
    const idx = parseInt(savedIndex);
    // 只有当 idx 合法时才恢复
    if (idx >= 0 && idx < playlist.value.length) {
      currentIndex.value = idx;
    }
  }
});

// --- 3. 😈 测试后门 (God Mode) ---
function cheatFill() {
  if (!confirm('⚠️ 启用上帝模式？\n这将随机填充所有题目并直接跳转结果页。')) return;

  playlist.value.forEach(q => {
    // 随机生成 0-4 的选项索引 (假设每题5个选项)
    const randomOpt = Math.floor(Math.random() * 5);
    // 随机生成 1-3 的坚定度
    const randomCert = (Math.floor(Math.random() * 3) + 1) as Certainty;
    
    store.setAnswer(q.id, randomOpt, randomCert);
  });

  // 这里的 setTimeout 是为了让你看到一点视觉反馈，非必须
  setTimeout(() => {
    router.push('/result');
  }, 200);
}
</script>

<template>
  <div class="min-h-[80vh] flex flex-col justify-between pb-6 relative">
    
    <div class="w-full mb-4 pt-2">
      <div class="flex justify-between text-xs opacity-50 mb-1 px-1">
        <span>Q{{ currentIndex + 1 }}</span>
        <span>{{ progress }}%</span>
        <span>Total {{ playlist.length }}</span>
      </div>
      <progress 
        class="progress progress-primary w-full transition-all duration-300" 
        :value="progress" 
        max="100"
      ></progress>
    </div>

    <div class="flex-1 flex items-center justify-center relative min-h-[400px]">
      <Transition name="slide-fade" mode="out-in">
        <QuestionCard 
          v-if="currentQuestion" 
          :key="currentQuestion.id"
          :question="currentQuestion" 
        />
        <div v-else class="text-center opacity-50">
          加载题目中...<br/>
          (如果没有显示，请返回 Setup 检查是否开启了模块)
        </div>
      </Transition>
    </div>

    <div class="flex justify-between items-center mt-6 px-2">
      <button @click="goPrev" class="btn btn-ghost">
        ⬅️ 上一题
      </button>

      <button 
        @click="cheatFill" 
        class="btn btn-xs btn-circle btn-ghost opacity-20 hover:opacity-100 text-warning"
        title="上帝模式：随机填满"
      >
        ⚡
      </button>

      <button @click="goNext" class="btn btn-primary px-8">
        {{ currentIndex === playlist.length - 1 ? '生成配置 🏁' : '下一题 ➡️' }}
      </button>
    </div>

  </div>
</template>

<style scoped>
/* 卡片切换动画：向左滑动并淡出 */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.25s ease-out;
}

.slide-fade-enter-from {
  transform: translateX(20px);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateX(-20px);
  opacity: 0;
}
</style>