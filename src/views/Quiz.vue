<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useClipboard } from '@vueuse/core';
import { useConfigStore } from '../stores/useConfigStore';
import { encode } from '../logic/codec';
import QuestionCard from '../components/QuestionCard.vue';
import questionsData from '../data/questions.json';
import type { Module, Question, Attitude } from '../types';

const router = useRouter();
const store = useConfigStore();
const { copy, copied } = useClipboard();

// --- 1. 数据准备 ---
// 🛡️ 强制类型断言：适配新的 JSON 结构 (含 meta 字段)
const allModules = (questionsData.modules as unknown) as Module[];

const playlist = computed(() => {
  const enabledModules = allModules.filter(m => store.isModuleEnabled(m.id));
  let list: Question[] = [];
  enabledModules.forEach(m => {
    list = list.concat(m.questions);
  });
  return list;
});

const currentIndex = ref(0);
const showSaveModal = ref(false); 
const currentProgressCode = ref(''); 

const currentQuestion = computed(() => {
  if (playlist.value.length === 0) return null;
  return playlist.value[currentIndex.value];
});

const progress = computed(() => {
  if (playlist.value.length === 0) return 0;
  return Math.round(((currentIndex.value + 1) / playlist.value.length) * 100);
});

// --- 2. 导航逻辑 ---
function goNext() {
  if (currentIndex.value < playlist.value.length - 1) {
    currentIndex.value++;
    saveLocal();
  } else {
    finishQuiz();
  }
}

function goPrev() {
  if (currentIndex.value > 0) {
    currentIndex.value--;
    saveLocal();
  } else {
    router.back();
  }
}

function finishQuiz() {
  saveLocal();
  router.push('/result');
}

function saveLocal() {
  localStorage.setItem('quiz_index', currentIndex.value.toString());
}

// --- 3. 手动保存逻辑 ---
function handleManualSave() {
  // ✅ 修复：编码时传入当前选中的头像，确保存档完整
  // 如果没有 store.targetAvatar，默认使用 '🌏' (由 codec 处理)
  currentProgressCode.value = encode(store.answers, store.targetAvatar);
  showSaveModal.value = true;
}

// 初始化
onMounted(() => {
  const savedIndex = localStorage.getItem('quiz_index');
  if (savedIndex) {
    const idx = parseInt(savedIndex);
    if (idx >= 0 && idx < playlist.value.length) {
      currentIndex.value = idx;
    }
  }
});

// 😈 上帝模式
function cheatFill() {
  if (!confirm('⚠️ 启用上帝模式？\n这将随机填充数据并跳转。')) return;
  playlist.value.forEach(q => {
    q.options.forEach((_, index) => {
      const rand = Math.random();
      let att: Attitude = 0;
      if (rand < 0.3) att = 0;
      else if (rand < 0.5) att = 3;
      else if (rand < 0.7) att = 2;
      else if (rand < 0.9) att = 1;
      else att = 4;
      store.setOptionAttitude(q.id, index, att);
    });
  });
  setTimeout(() => router.push('/result'), 200);
}
</script>

<template>
  <div class="min-h-[80vh] flex flex-col justify-between pb-6 relative">
    
    <div class="w-full mb-4 pt-2">
      <div class="flex justify-between text-xs opacity-50 mb-1 px-1">
        <span>Q{{ currentIndex + 1 }}</span>
        <span>{{ progress }}%</span>
      </div>
      <progress class="progress progress-primary w-full transition-all duration-300" :value="progress" max="100"></progress>
    </div>

    <div class="flex-1 flex items-start justify-center relative min-h-[400px]">
      <Transition name="slide-fade" mode="out-in">
        <QuestionCard 
          v-if="currentQuestion" 
          :key="currentQuestion.id"
          :question="currentQuestion" 
        />
        <div v-else class="text-center opacity-50 mt-20">加载中...</div>
      </Transition>
    </div>

    <div class="flex justify-between items-center mt-6 px-2">
      <button @click="goPrev" class="btn btn-ghost btn-sm">⬅️ 上一题</button>
      
      <button @click="handleManualSave" class="btn btn-outline btn-sm gap-2">
        <span>💾</span> 保存
      </button>

      <button @click="goNext" class="btn btn-primary btn-sm px-6">
        {{ currentIndex === playlist.length - 1 ? '完成 🏁' : '下一题 ➡️' }}
      </button>
    </div>

    <button @click="cheatFill" class="absolute bottom-0 left-1/2 -translate-x-1/2 btn btn-xs btn-circle btn-ghost opacity-10 hover:opacity-100 text-warning">⚡</button>

    <dialog class="modal" :class="{ 'modal-open': showSaveModal }">
      <div class="modal-box">
        <h3 class="font-bold text-lg">进度已暂存 ✅</h3>
        <p class="py-4 text-sm opacity-80">
          系统会自动缓存你的进度。但为了防止清理缓存导致数据丢失，你可以<span class="font-bold text-primary">复制下方代码</span>。下次在首页点击“代码解读”即可恢复进度。
        </p>
        
        <div class="bg-base-200 p-3 rounded-lg font-mono text-xs break-all mb-4 border border-base-content/10">
          {{ currentProgressCode }}
        </div>

        <div class="modal-action flex justify-between items-center">
          <button @click="copy(currentProgressCode)" class="btn btn-success btn-sm text-white">
            {{ copied ? '已复制 ✨' : '复制代码 📋' }}
          </button>
          <button class="btn btn-ghost btn-sm" @click="showSaveModal = false">继续答题</button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="showSaveModal = false">close</button>
      </form>
    </dialog>

  </div>
</template>

<style scoped>
.slide-fade-enter-active, .slide-fade-leave-active { transition: all 0.25s ease-out; }
.slide-fade-enter-from { transform: translateX(20px); opacity: 0; }
.slide-fade-leave-to { transform: translateX(-20px); opacity: 0; }
</style>