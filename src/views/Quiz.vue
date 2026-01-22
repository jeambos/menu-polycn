<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useClipboard } from '@vueuse/core';
import { useConfigStore } from '../stores/useConfigStore';
import { encode } from '../logic/codec';
import QuestionCard from '../components/QuestionCard.vue';
import BaseModal from '../components/BaseModal.vue'; // 引入通用弹窗
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
const currentProgressCode = ref(''); 

// --- 弹窗状态控制 ---
const showSaveModal = ref(false); 
const showEntryModal = ref(false);  // 新增：入场弹窗
const showGreedyModal = ref(false); // 新增：贪心弹窗状态
const entryType = ref<'newbie' | 'resume'>('newbie'); // 入场类型

const currentQuestion = computed(() => {
  if (!playlist.value || playlist.value.length === 0) return undefined;
  return playlist.value[currentIndex.value];
});

const progress = computed(() => {
  if (playlist.value.length === 0) return 0;
  return Math.round(((currentIndex.value + 1) / playlist.value.length) * 100);
});

// --- 2. 拦截逻辑 (保留原逻辑) ---
const pendingUpdate = ref<{ qId: string, optIndex: number, val: number } | null>(null);
const hasWarnedMap = ref<Record<string, boolean>>({}); 

const currentCoreCount = computed(() => {
  if (!currentQuestion.value) return 0;
  const qId = currentQuestion.value.id;
  const ans = store.answers[qId];
  if (!ans) return 0;
  return ans.filter(a => a === 4).length;
});

function handleAnswerRequest(optIndex: number, newVal: number) {
  if (!currentQuestion.value) return;
  const qId = currentQuestion.value.id;
  
  // 触发拦截条件：选核心(4)，且已有>=2个核心，且本题未警告过
  if (newVal === 4 && currentCoreCount.value >= 2 && !hasWarnedMap.value[qId]) {
    pendingUpdate.value = { qId, optIndex, val: newVal };
    showGreedyModal.value = true; // 使用 BaseModal 控制
    return;
  }

  store.setOptionAttitude(qId, optIndex, newVal as Attitude);
}

function executePendingUpdate() {
  if (pendingUpdate.value) {
    const { qId, optIndex, val } = pendingUpdate.value;
    store.setOptionAttitude(qId, optIndex, val as Attitude);
    hasWarnedMap.value[qId] = true;
    pendingUpdate.value = null;
    showGreedyModal.value = false;
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

// --- 4. 生命周期：入场检测 (Gatekeeper) ---
onMounted(() => {
  // 检测当前对象是否有存档数据
  const hasData = store.hasProfileData(store.targetAvatar || '🌏');
  const savedIndex = localStorage.getItem('quiz_index');
  const savedIdxNum = savedIndex ? parseInt(savedIndex) : 0;

  if (hasData) {
    entryType.value = 'resume';
    // 恢复题目进度
    if (savedIdxNum >= 0 && savedIdxNum < playlist.value.length) {
      currentIndex.value = savedIdxNum;
    }
  } else {
    entryType.value = 'newbie';
  }
  
  // 触发入场弹窗
  showEntryModal.value = true;
});

function handleEntryConfirm() {
  showEntryModal.value = false;
}

// --- 5. 上帝模式 (作弊) ---
function cheatFill() {
  if (!confirm('⚠️ 启用上帝模式？\n这将随机填充数据并跳转。')) return;
  
  playlist.value.forEach(q => {
    q.options.forEach((_, index) => {
      const rand = Math.random();
      let att: Attitude = 0;
      if (rand < 0.2) att = 0;      
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
    
    <div class="w-full mb-4 pt-2 sticky top-0 z-20 bg-base-200/95 backdrop-blur-sm pb-2 transition-colors border-b border-base-content/5">
      <div class="flex justify-between text-xs font-bold opacity-40 mb-1 px-4">
        <span>Q{{ currentIndex + 1 }}</span>
        <span>{{ progress }}%</span>
      </div>
      <progress class="progress progress-primary w-full h-1" :value="progress" max="100"></progress>
    </div>

    <div class="flex-1 flex flex-col items-center relative min-h-[400px] w-full max-w-2xl mx-auto px-4">
      <Transition name="slide-fade" mode="out-in">
        
        <div v-if="currentQuestion && currentQuestion.id" :key="currentQuestion.id" class="w-full">
          <QuestionCard 
            :question="currentQuestion" 
            @answer="handleAnswerRequest"
          />
        </div>

        <div v-else class="text-center opacity-50 mt-20" key="loading">
          <span class="loading loading-spinner loading-lg text-primary"></span>
        </div>

      </Transition>
    </div>

    <div class="flex justify-between items-center mt-12 px-4 max-w-2xl mx-auto w-full pb-safe">
      
      <button 
        @click="goPrev" 
        class="btn btn-ghost h-14 text-lg text-base-content/50 hover:text-base-content gap-2"
      >
        <i-ph-arrow-left-bold class="text-xl" />
        <span>上一页</span>
      </button>

      <button 
        @click="handleManualSave" 
        class="btn btn-ghost h-14 text-sm text-primary font-bold gap-2"
      >
        <i-ph-floppy-disk-bold class="text-xl" />
        
      </button>

      <button 
        @click="goNext" 
        class="btn btn-primary h-14 text-lg px-10 rounded-full shadow-lg shadow-primary/20 gap-3"
      >
        <template v-if="currentIndex === playlist.length - 1">
          <span>完成</span>
          <i-ph-flag-checkered-bold class="text-2xl" />
        </template>
        <template v-else>
          <span>继续</span>
          <i-ph-arrow-right-bold class="text-2xl" />
        </template>
      </button>

    </div>

    <button 
      @click="cheatFill" 
      class="fixed bottom-1 right-1 btn btn-xs btn-circle btn-ghost opacity-20 hover:opacity-100 text-warning z-50"
      title="上帝模式"
    >
      ⚡
    </button>

    <BaseModal 
      v-model="showEntryModal" 
      :title="entryType === 'newbie' ? '欢迎使用关系配置单' : '检测到历史进度'" 
      :persistent="true" 
      :show-close="false"
    >
      <div v-if="entryType === 'newbie'" class="space-y-4">
        <p>您只需要标记自己的态度。</p>
        <ul class="list-disc list-inside opacity-80 space-y-1 pl-2 text-sm bg-base-200/50 p-3 rounded-lg">
          <p>每一个场景下有若干小项，您可以对每一个小项表态：</p>
    <ul class="list-disc pl-5 space-y-1">
      <li><strong class="text-primary/75">不表态（跳过不选）</strong>：无所谓/没感觉/暂时不考虑这件事</li>
      <li><strong class="text-primary/75">硬性边界</strong>：绝对不行/分手警告</li>
      <li><strong class="text-primary/75">不确定 /看条件</strong>：可能行，也可能不行，具体情况双方对话沟通</li>
      <li><strong class="text-primary/75">同意/接受</strong>：接受/可以，具体程度可商量</li>
      <li><strong class="text-primary/75">核心需求</strong>：必需品/快乐源泉</li>
    </ul>
        </ul>
      </div>

      <div v-else class="space-y-4">
        <p>检测到对象 <strong class="text-primary">{{ store.targetAvatar }}</strong> 已有部分答题数据。</p>
        <p class="opacity-80">您可以继续之前的进度，或者返回设置页切换其他对象。</p>
      </div>

      <template #actions>
        <button v-if="entryType === 'resume'" class="btn btn-ghost" @click="router.push('/setup')">
          返回设置
        </button>
        <button class="btn btn-primary px-6" @click="handleEntryConfirm">
          {{ entryType === 'newbie' ? '开始配置' : '继续配置' }}
        </button>
      </template>
    </BaseModal>

    <BaseModal v-model="showSaveModal" title="进度已暂存 ✅">
      <p class="opacity-70 mb-4">
        为防止清理浏览器缓存导致数据丢失，建议您<span class="text-primary font-bold">复制下方代码</span>自行备份。
      </p>
      <div class="bg-base-200 p-3 rounded-lg font-mono text-xs break-all mb-4 border border-base-content/10 select-all">
        {{ currentProgressCode }}
      </div>
      <template #actions>
        <button @click="copy(currentProgressCode)" class="btn btn-success text-white h-14">
          {{ copied ? '已复制 ✨' : '复制代码' }}
        </button>
        <button class="btn btn-ghost h-14" @click="showSaveModal = false">继续答题</button>
      </template>
    </BaseModal>

    <BaseModal v-model="showGreedyModal">
      <div class="flex items-center gap-2 mb-4">
        <span class="text-2xl">🌟</span>
        <h3 class="font-bold text-lg bg-gradient-to-r from-warning to-error bg-clip-text text-transparent">
          核心需求贵在精简
        </h3>
      </div>
      
      <div class="space-y-3 opacity-80 text-sm">
        <p>建议您在本场景中保留 <strong>1~2 个</strong> 最关键的核心需求。</p>
        <p>如果一切都是重点，那么就没有重点了。</p>
        <p>其他的偏好，建议改为 <span class="text-success font-bold">同意 (绿色)</span> 哦。</p>
      </div>

      <template #actions>
        <button class="btn btn-warning text-white w-full" @click="executePendingUpdate">
          我已了解，继续选择
        </button>
      </template>
    </BaseModal>

  </div>
</template>

<style scoped>
.slide-fade-enter-active, .slide-fade-leave-active { transition: all 0.2s ease-out; }
.slide-fade-enter-from { transform: translateX(10px); opacity: 0; }
.slide-fade-leave-to { transform: translateX(-10px); opacity: 0; }
.pb-safe { padding-bottom: env(safe-area-inset-bottom, 20px); }
</style>