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
const allModules = ((questionsData as any).modules || []) as Module[];

const playlist = computed(() => {
  if (!allModules || allModules.length === 0) return [];
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
  if (!playlist.value || playlist.value.length === 0) return undefined;
  return playlist.value[currentIndex.value];
});

const progress = computed(() => {
  if (playlist.value.length === 0) return 0;
  return Math.round(((currentIndex.value + 1) / playlist.value.length) * 100);
});

// --- 2. 拦截逻辑 (修正版：基于单题计数) ---
const pendingUpdate = ref<{ qId: string, optIndex: number, val: number } | null>(null);

// ⚠️ 锁的映射表：Key 是题目 ID (qId)，而不是模块 ID
const hasWarnedMap = ref<Record<string, boolean>>({}); 

// ⚠️ 计数器：只统计“当前这道题”选了几个星星
const currentCoreCount = computed(() => {
  if (!currentQuestion.value) return 0;
  
  const qId = currentQuestion.value.id;
  // 直接从 store 获取当前题目的答案数组
  const ans = store.answers[qId];
  
  if (!ans) return 0;
  // 统计值为 4 的数量
  return ans.filter(a => a === 4).length;
});

function handleAnswerRequest(optIndex: number, newVal: number) {
  if (!currentQuestion.value) return;
  
  const qId = currentQuestion.value.id;
  
  // 触发拦截条件：
  // 1. 用户试图选星星 (4)
  // 2. 当前这道题已经有 >= 2 个星星了 (这将是第3个)
  // 3. 当前这道题还没弹过警告 (hasWarnedMap[qId] 为 false)
  if (newVal === 4 && currentCoreCount.value >= 2 && !hasWarnedMap.value[qId]) {
    pendingUpdate.value = { qId, optIndex, val: newVal };
    const modal = document.getElementById('greedy_modal') as HTMLDialogElement;
    modal?.showModal();
    return;
  }

  store.setOptionAttitude(qId, optIndex, newVal as Attitude);
}

function executePendingUpdate() {
  if (pendingUpdate.value) {
    const { qId, optIndex, val } = pendingUpdate.value;
    
    store.setOptionAttitude(qId, optIndex, val as Attitude);
    
    // ⚠️ 锁定：标记“这道题”已经警告过了
    // 当用户翻到下一题时，qId 变了，hasWarnedMap[newQId] 是 false，计数器也会重置
    hasWarnedMap.value[qId] = true;
    
    pendingUpdate.value = null;
  }
}

// --- 3. 导航与保存 ---
function goNext() {
  if (currentIndex.value < playlist.value.length - 1) {
    currentIndex.value++;
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

function handleManualSave() {
  currentProgressCode.value = encode(store.answers, store.targetAvatar);
  showSaveModal.value = true;
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

function cheatFill() {
  if (!confirm('⚠️ 启用上帝模式？\n这将随机填充数据并跳转。')) return;
  
  // 遍历所有题目
  playlist.value.forEach(q => {
    q.options.forEach((_, index) => {
      const rand = Math.random();
      let att: Attitude = 0;
      // 随机生成概率分布
      if (rand < 0.2) att = 0;      // 20% 未选
      else if (rand < 0.5) att = 3; // 30% 同意
      else if (rand < 0.7) att = 2; // 20% 待商议
      else if (rand < 0.9) att = 1; // 20% 硬边界
      else att = 4;                 // 10% 核心需求
      
      // 直接写入 Store
      store.setOptionAttitude(q.id, index, att);
    });
  });
  
  // 稍微延迟后跳转，让 store 反应一下
  setTimeout(() => router.push('/result'), 200);
}
</script>

<template>
  <div class="min-h-[80vh] flex flex-col justify-between pb-6 relative">
    
    <div class="w-full mb-4 pt-2 sticky top-0 z-20 bg-base-100/95 backdrop-blur-sm pb-2 transition-colors">
      <div class="flex justify-between text-xs opacity-50 mb-1 px-1">
        <span>Q{{ currentIndex + 1 }}</span>
        <span>{{ progress }}%</span>
      </div>
      <progress class="progress progress-primary w-full transition-all duration-300" :value="progress" max="100"></progress>
    </div>

    <div class="flex-1 flex flex-col items-center relative min-h-[400px] w-full max-w-2xl mx-auto px-2">
      <Transition name="slide-fade" mode="out-in">
        
        <div v-if="currentQuestion && currentQuestion.id" :key="currentQuestion.id" class="w-full">
          <QuestionCard 
            :question="currentQuestion" 
            @answer="handleAnswerRequest"
          />
        </div>

        <div v-else class="text-center opacity-50 mt-20" key="loading">
          <span class="loading loading-spinner loading-lg"></span>
          <p class="mt-4 text-sm">加载中...</p>
        </div>

      </Transition>
    </div>

    <div class="flex justify-between items-center mt-12 px-2 max-w-2xl mx-auto w-full">
      <button @click="goPrev" class="btn btn-ghost btn-sm">⬅️ 上一题</button>
      <button @click="handleManualSave" class="btn btn-outline btn-sm gap-2"><span>💾</span> 保存</button>
      <button @click="goNext" class="btn btn-primary btn-sm px-6">
        {{ currentIndex === playlist.length - 1 ? '完成 🏁' : '下一题 ➡️' }}
      </button>
    </div>

    <button 
      @click="cheatFill" 
      class="fixed bottom-1 right-1 btn btn-xs btn-circle btn-ghost opacity-50 hover:opacity-100 text-warning z-50"
      title="上帝模式：自动答题"
    >
      ⚡
    </button>

    <dialog class="modal" :class="{ 'modal-open': showSaveModal }">
       <div class="modal-box">
        <h3 class="font-bold text-lg">进度已暂存 ✅</h3>
        <p class="py-4 text-sm opacity-80">
          为了防止清理缓存导致数据丢失，你可以<span class="font-bold text-primary">复制下方代码</span>。
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
      <form method="dialog" class="modal-backdrop"><button @click="showSaveModal = false">close</button></form>
    </dialog>

    <dialog id="greedy_modal" class="modal modal-bottom sm:modal-middle">
      <div class="modal-box p-0 border-t-4 border-transparent overflow-hidden" style="background: linear-gradient(#fff, #fff) padding-box, linear-gradient(to right, #B45309, #F59E0B, #B45309) border-box;">
        <div class="bg-base-100 p-6">
            <h3 class="font-bold text-lg flex items-center gap-2">
              <span class="text-2xl drop-shadow-sm">🌟</span> 
              <span class="bg-gradient-to-r from-[#B45309] to-[#F59E0B] bg-clip-text text-transparent uppercase tracking-wide">核心需求贵在精简</span>
            </h3>
            <p class="py-4 text-sm opacity-80 leading-relaxed">
              建议您在本模块中保留 <strong>1~2 个</strong> 最关键的金星。<br/>
              如果一切都是重点，那么就没有重点了。<br/><br/>
              其他的偏好，建议改为 <span class="text-[#0EA5E9] font-bold">同意 (蓝色)</span> 哦。
            </p>
            <div class="modal-action">
              <form method="dialog">
                <button 
                  class="btn border-none text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
                  style="background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);"
                  @click="executePendingUpdate"
                >
                  我已了解，继续选择
                </button>
              </form>
            </div>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop"><button @click="pendingUpdate = null">close</button></form>
    </dialog>
  </div>
</template>

<style scoped>
.slide-fade-enter-active, .slide-fade-leave-active { transition: all 0.25s ease-out; }
.slide-fade-enter-from { transform: translateX(20px); opacity: 0; }
.slide-fade-leave-to { transform: translateX(-20px); opacity: 0; }
</style>