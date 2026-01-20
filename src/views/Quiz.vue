<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useClipboard } from '@vueuse/core';
import { useConfigStore } from '../stores/useConfigStore';
import { encode } from '../logic/codec';
import QuestionCard from '../components/QuestionCard.vue';
import QuadStateButton from '../components/QuadStateButton.vue';
import questionsData from '../data/questions.json';
import type { Module, Question, Attitude } from '../types';

const router = useRouter();
const route = useRoute();
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

// 计算当前题目所属的模块（用于贪心检测统计）
const currentModule = computed(() => {
  if (!currentQuestion.value) return null;
  return allModules.find(m => m.questions.some(q => q.id === currentQuestion.value?.id));
});

const progress = computed(() => {
  if (playlist.value.length === 0) return 0;
  return Math.round(((currentIndex.value + 1) / playlist.value.length) * 100);
});

// --- 2. 贪心拦截逻辑 (Greedy Reminder) ---
// 记录暂存的操作（用于弹窗确认后恢复）
const pendingUpdate = ref<{ qId: string, optIndex: number, val: number } | null>(null);
// 记录每个模块是否已经警告过（避免重复打扰）
const hasWarnedMap = ref<Record<string, boolean>>({}); 

// 计算当前模块已选了多少个“核心需求”
const currentCoreCount = computed(() => {
  if (!currentModule.value) return 0;
  let count = 0;
  currentModule.value.questions.forEach(q => {
    // 直接读取 Store 中的数据
    const userAnswers = store.answers[q.id]; 
    if (userAnswers) {
      count += userAnswers.filter(a => a === 4).length;
    }
  });
  return count;
});

function handleOptionUpdate(qId: string, optIndex: number, newVal: number) {
  const modId = currentModule.value?.id || 'default';
  
  // 触发拦截条件：
  // 1. 用户试图选“核心需求”(4)
  // 2. 当前模块已经有 >= 2 个核心需求了 (这意味着这将是第3个)
  // 3. 本模块从未警告过
  if (newVal === 4 && currentCoreCount.value >= 2 && !hasWarnedMap.value[modId]) {
    
    // ✋ 阻断并暂存操作
    pendingUpdate.value = { qId, optIndex, val: newVal };
    
    // 呼出弹窗
    const modal = document.getElementById('greedy_modal') as HTMLDialogElement;
    modal?.showModal();
    return;
  }

  // ✅ 正常写入 Store
  store.setOptionAttitude(qId, optIndex, newVal);
  
  // 自动跳转逻辑：如果是最后一题的最后一个选项被点击，可以考虑自动跳下一题（可选，这里暂不加）
}

function executePendingUpdate() {
  if (pendingUpdate.value) {
    const { qId, optIndex, val } = pendingUpdate.value;
    
    // 1. 写入 Store (这会触发 QuadStateButton 的 watch -> 放烟花)
    store.setOptionAttitude(qId, optIndex, val);
    
    // 2. 标记本模块已警告
    const modId = currentModule.value?.id || 'default';
    hasWarnedMap.value[modId] = true;
    
    // 3. 清理暂存
    pendingUpdate.value = null;
  }
}

// --- 3. 导航逻辑 ---
function goNext() {
  if (currentIndex.value < playlist.value.length - 1) {
    currentIndex.value++;
    // 滚动回顶部
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

// --- 4. 手动保存逻辑 ---
function handleManualSave() {
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
    
    <div class="w-full mb-4 pt-2 sticky top-0 z-20 bg-base-100/95 backdrop-blur-sm pb-2">
      <div class="flex justify-between text-xs opacity-50 mb-1 px-1">
        <span>Q{{ currentIndex + 1 }}</span>
        <span>{{ progress }}%</span>
      </div>
      <progress class="progress progress-primary w-full transition-all duration-300" :value="progress" max="100"></progress>
    </div>

    <div class="flex-1 flex flex-col items-center relative min-h-[400px] w-full max-w-2xl mx-auto">
      <Transition name="slide-fade" mode="out-in">
        <div v-if="currentQuestion" :key="currentQuestion.id" class="w-full px-2">
          
          <QuestionCard :question="currentQuestion" />

          <div class="mt-6 flex flex-col gap-3 animate-fade-in-up">
            <div 
              v-for="(opt, idx) in currentQuestion.options" 
              :key="idx" 
              class="flex flex-col gap-1"
            >
              <span class="text-sm font-bold opacity-80 px-1">
                {{ typeof opt === 'string' ? opt : opt.long }}
              </span>
              
              <QuadStateButton 
                :model-value="store.getAnswer(currentQuestion.id, idx)"
                @update:model-value="(val) => handleOptionUpdate(currentQuestion.id, idx, val)"
              />
            </div>
          </div>

        </div>
        <div v-else class="text-center opacity-50 mt-20">加载中...</div>
      </Transition>
    </div>

    <div class="flex justify-between items-center mt-12 px-2 max-w-2xl mx-auto w-full">
      <button @click="goPrev" class="btn btn-ghost btn-sm">⬅️ 上一题</button>
      
      <button @click="handleManualSave" class="btn btn-outline btn-sm gap-2">
        <span>💾</span> 保存
      </button>

      <button @click="goNext" class="btn btn-primary btn-sm px-6">
        {{ currentIndex === playlist.length - 1 ? '完成 🏁' : '下一题 ➡️' }}
      </button>
    </div>

    <button @click="cheatFill" class="fixed bottom-1 right-1 btn btn-xs btn-circle btn-ghost opacity-5 hover:opacity-100 text-warning z-50">⚡</button>

    <dialog class="modal" :class="{ 'modal-open': showSaveModal }">
      <div class="modal-box">
        <h3 class="font-bold text-lg">进度已暂存 ✅</h3>
        <p class="py-4 text-sm opacity-80">
          为了防止清理缓存导致数据丢失，你可以<span class="font-bold text-primary">复制下方代码</span>。下次在首页点击“代码解读”即可恢复进度。
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

    <dialog id="greedy_modal" class="modal modal-bottom sm:modal-middle">
      <div class="modal-box border-t-4 border-[#FFD700]">
        <h3 class="font-bold text-lg text-[#FFD700] flex items-center gap-2">
          <span>🌟</span> 核心需求贵在精简
        </h3>
        <p class="py-4 text-sm opacity-80 leading-relaxed">
          建议您在本模块中保留 <strong>1~2 个</strong> 最关键的金星。<br/>
          如果一切都是重点，那么就没有重点了。
          <br/><br/>
          其他的偏好，建议改为 <span class="text-success font-bold">同意 (绿色)</span> 哦。
        </p>
        <div class="modal-action">
          <form method="dialog">
            <button class="btn btn-primary bg-[#FFD700] border-none text-black hover:bg-[#E6C200]" @click="executePendingUpdate">
              我已了解，继续选择
            </button>
          </form>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="pendingUpdate = null">close</button>
      </form>
    </dialog>

  </div>
</template>

<style scoped>
.slide-fade-enter-active, .slide-fade-leave-active { transition: all 0.25s ease-out; }
.slide-fade-enter-from { transform: translateX(20px); opacity: 0; }
.slide-fade-leave-to { transform: translateX(-20px); opacity: 0; }
</style>