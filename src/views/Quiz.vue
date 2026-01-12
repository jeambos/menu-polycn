<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useConfigStore } from '../stores/useConfigStore';
import QuestionCard from '../components/QuestionCard.vue';
import questionsData from '../data/questions.json';
import type { Module, Question, Attitude } from '../types';

const router = useRouter();
const store = useConfigStore();

// 1. 数据准备
const allModules = questionsData.modules as Module[];

const playlist = computed(() => {
  const enabledModules = allModules.filter(m => store.isModuleEnabled(m.id));
  let list: Question[] = [];
  enabledModules.forEach(m => {
    list = list.concat(m.questions);
  });
  return list;
});

const currentIndex = ref(0);

const currentQuestion = computed(() => {
  if (playlist.value.length === 0) return null;
  return playlist.value[currentIndex.value];
});

const progress = computed(() => {
  if (playlist.value.length === 0) return 0;
  return Math.round(((currentIndex.value + 1) / playlist.value.length) * 100);
});

// 2. 导航逻辑
function goNext() {
  if (currentIndex.value < playlist.value.length - 1) {
    currentIndex.value++;
    saveProgress();
  } else {
    finishQuiz();
  }
}

function goPrev() {
  if (currentIndex.value > 0) {
    currentIndex.value--;
    saveProgress();
  } else {
    router.back();
  }
}

function finishQuiz() {
  saveProgress();
  router.push('/result');
}

function saveProgress() {
  localStorage.setItem('quiz_index', currentIndex.value.toString());
}

onMounted(() => {
  const savedIndex = localStorage.getItem('quiz_index');
  if (savedIndex) {
    const idx = parseInt(savedIndex);
    if (idx >= 0 && idx < playlist.value.length) {
      currentIndex.value = idx;
    }
  }
});

// 3. 😈 新版上帝模式 (适配四态逻辑)
function cheatFill() {
  if (!confirm('⚠️ 启用上帝模式？\n这将随机填充数据并跳转。')) return;

  playlist.value.forEach(q => {
    // 遍历该题的每个选项
    q.options.forEach((_, index) => {
      // 随机生成态度 0-4
      // 为了模拟真实情况，让 0(N/A) 的概率大一点，4(Core) 的概率小一点
      const rand = Math.random();
      let att: Attitude = 0;
      
      if (rand < 0.3) att = 0;       // 30% 未选
      else if (rand < 0.5) att = 3;  // 20% 同意
      else if (rand < 0.7) att = 2;  // 20% 犹豫
      else if (rand < 0.9) att = 1;  // 20% 拒绝
      else att = 4;                  // 10% 核心

      store.setOptionAttitude(q.id, index, att);
    });
  });

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
      </div>
      <progress 
        class="progress progress-primary w-full transition-all duration-300" 
        :value="progress" 
        max="100"
      ></progress>
    </div>

    <div class="flex-1 flex items-start justify-center relative min-h-[400px]">
      <Transition name="slide-fade" mode="out-in">
        <QuestionCard 
          v-if="currentQuestion" 
          :key="currentQuestion.id"
          :question="currentQuestion" 
        />
        <div v-else class="text-center opacity-50 mt-20">
          加载中...
        </div>
      </Transition>
    </div>

    <div class="flex justify-between items-center mt-6 px-2">
      <button @click="goPrev" class="btn btn-ghost">⬅️ 上一题</button>
      
      <button @click="cheatFill" class="btn btn-xs btn-circle btn-ghost opacity-20 hover:opacity-100 text-warning">⚡</button>

      <button @click="goNext" class="btn btn-primary px-8">
        {{ currentIndex === playlist.length - 1 ? '生成配置 🏁' : '下一题 ➡️' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
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