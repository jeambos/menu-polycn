<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useClipboard } from '@vueuse/core';
import { useConfigStore } from '../stores/useConfigStore';
import { encode, decode } from '../logic/codec';
import questionsData from '../data/questions.json';
import type { Attitude, Module } from '../types';
import OptionPopover from '../components/OptionPopover.vue'; // ✅ 引入新组件

const route = useRoute();
const router = useRouter();
const store = useConfigStore();
const { copy, copied } = useClipboard();

// --- 类型定义 ---
// 增加 originalQuestion 字段，方便传给 Popover
interface ResultItem { 
  id: string; 
  title: string; 
  choice: string; 
  attitude: Attitude; 
  moduleId: string; 
  moduleName: string; 
  questionId: string;
  originalQuestion: any; // ✅ 新增
  optionIndex: number;   // ✅ 新增
}
interface ModuleGroup { id: string; name: string; items: ResultItem[]; }
interface QuestionGroup { questionId: string; title: string; items: ResultItem[]; }

// --- 状态变量 ---
const isPreviewMode = ref(false);
const displayAnswers = ref<Record<string, Attitude[]>>({});
const resultAvatar = ref('🌏');

// 筛选相关
const allModules = (questionsData.modules as unknown) as Module[];
const activeModuleIds = ref<string[]>([]);

// 结果分组数据
const redGroups = ref<ModuleGroup[]>([]);    
const goldGroups = ref<ModuleGroup[]>([]);   
const yellowGroups = ref<ModuleGroup[]>([]); 
const greenItems = ref<ResultItem[]>([]);    

// 模态框控制
const showClearModal = ref(false);

// ✅ Popover 互斥锁
const activePopoverId = ref<string | null>(null);

function togglePopover(id: string) {
  if (activePopoverId.value === id) {
    activePopoverId.value = null;
  } else {
    activePopoverId.value = id;
  }
}

// --- 计算属性 ---
const pageTitle = computed(() => {
  if (resultAvatar.value === '🌏') return '我的配置单';
  return `我和 ${resultAvatar.value} 的配置单`;
});

const availableModules = computed(() => {
  if (isPreviewMode.value) {
    return allModules.filter(m => 
      m.questions.some(q => displayAnswers.value[q.id] !== undefined)
    );
  } else {
    return allModules.filter(m => store.isModuleEnabled(m.id));
  }
});

const fullCode = computed(() => {
  if (isPreviewMode.value) return route.query.code as string || '';
  return encode(store.answers, resultAvatar.value);
});

const filteredCode = computed(() => {
  if (activeModuleIds.value.length === availableModules.value.length) return '';
  const filteredAnswers: Record<string, Attitude[]> = {};
  allModules.forEach(m => {
    if (activeModuleIds.value.includes(m.id)) {
      m.questions.forEach(q => {
        const ans = displayAnswers.value[q.id];
        if (ans) filteredAnswers[q.id] = ans;
      });
    }
  });
  return encode(filteredAnswers, resultAvatar.value);
});

// --- 核心逻辑 ---

function toggleModuleFilter(moduleId: string) {
  if (moduleId === 'A') return;
  const idx = activeModuleIds.value.indexOf(moduleId);
  if (idx > -1) activeModuleIds.value.splice(idx, 1);
  else activeModuleIds.value.push(moduleId);
}

// 聚合逻辑微调：按题目聚合，保留完整 Item 信息
function getQuestionGroups(items: ResultItem[]): QuestionGroup[] {
  const map = new Map<string, QuestionGroup>();
  items.forEach(item => {
    if (!map.has(item.questionId)) {
      map.set(item.questionId, { questionId: item.questionId, title: item.title, items: [] });
    }
    map.get(item.questionId)!.items.push(item);
  });
  return Array.from(map.values());
}

function groupItemsByModule(items: ResultItem[]): ModuleGroup[] {
  const map = new Map<string, ModuleGroup>();
  items.forEach(item => {
    if (!map.has(item.moduleId)) map.set(item.moduleId, { id: item.moduleId, name: item.moduleName, items: [] });
    map.get(item.moduleId)!.items.push(item);
  });
  return Array.from(map.values());
}

function processZoneData(answers: Record<string, Attitude[]>) {
  const rList: ResultItem[] = [], gCoreList: ResultItem[] = [], yList: ResultItem[] = [], greenList: ResultItem[] = [];
  const targetModules = allModules.filter(m => activeModuleIds.value.includes(m.id));

  targetModules.forEach(m => {
    const cleanModuleName = m.name.replace(/^(模块\s*[A-J][：:]\s*)/, '').replace(/📦 |⚛️ /g, '');

    m.questions.forEach(q => {
      const states = answers[q.id];
      if (!states) return;

      states.forEach((att, optIndex) => {
        if (att === 0) return;
        const opt = q.options[optIndex];
        const choiceText = typeof opt === 'string' ? opt : (opt?.short || '未知选项');

        const item: ResultItem = {
          id: q.id + '_' + optIndex,
          questionId: q.id,
          title: q.title_short || q.title, 
          choice: choiceText,
          attitude: att,
          moduleId: m.id,
          moduleName: cleanModuleName,
          originalQuestion: q, // ✅ 传入原题
          optionIndex: optIndex // ✅ 传入索引
        };

        if (att === 1) rList.push(item);
        else if (att === 4) gCoreList.push(item);
        else if (att === 2) yList.push(item);
        else if (att === 3) greenList.push(item);
      });
    });
  });

  redGroups.value = groupItemsByModule(rList);
  goldGroups.value = groupItemsByModule(gCoreList);
  yellowGroups.value = groupItemsByModule(yList);
  greenItems.value = greenList;
}

function handleClearData() {
  store.resetAll();
  localStorage.removeItem('config_store');
  localStorage.removeItem('quiz_index');
  showClearModal.value = false;
  router.push('/');
}

watch(activeModuleIds, () => {
  processZoneData(displayAnswers.value);
}, { deep: true });

onMounted(() => {
  const codeParam = route.query.code as string;
  if (codeParam) {
    isPreviewMode.value = true;
    try {
      const res = decode(codeParam);
      displayAnswers.value = res.answers as Record<string, Attitude[]>;
      resultAvatar.value = res.avatar; 
    } catch (e) { console.error(e); }
  } else {
    displayAnswers.value = store.answers;
    if (store.targetAvatar) resultAvatar.value = store.targetAvatar;
  }
  activeModuleIds.value = availableModules.value.map(m => m.id);
  processZoneData(displayAnswers.value);
});
</script>

<template>
  <div class="pb-40 pt-10 px-4 max-w-md mx-auto min-h-screen">
    
    <div class="text-center mb-8">
      <h2 class="text-2xl font-bold text-base-content/80">
        {{ pageTitle }}
      </h2>
    </div>

    <div class="mb-8">
      <div class="flex flex-wrap gap-2 justify-center">
        <button 
          v-for="mod in availableModules" 
          :key="mod.id"
          @click="toggleModuleFilter(mod.id)"
          class="btn btn-xs transition-all"
          :class="[
            activeModuleIds.includes(mod.id) ? 'btn-neutral' : 'btn-ghost opacity-50',
            mod.id === 'A' ? 'cursor-not-allowed opacity-100' : ''
          ]"
        >
          <span v-if="activeModuleIds.includes(mod.id)">✅</span>
          <span v-else class="opacity-0">✅</span>
          {{ mod.name.replace(/^(模块\s*[A-J][：:]\s*)/, '').replace(/📦 |⚛️ /g, '') }}
        </button>
      </div>
      <p class="text-xs text-center mt-2 opacity-40">点击上方标签可隐藏/显示对应结果</p>
    </div>

    <div class="mb-10 space-y-6">
      <div class="text-center">
        <h3 class="text-xs font-bold uppercase tracking-widest opacity-40 mb-2">您的全部问卷答案</h3>
        <div class="font-mono text-xs break-all opacity-60 leading-tight select-all mb-2 px-4">
          {{ fullCode }}
        </div>
        <button @click="copy(fullCode)" class="btn btn-xs btn-ghost gap-1 opacity-70 hover:opacity-100">
          {{ copied ? '✅ 已复制' : '📄 复制全部代码' }}
        </button>
      </div>

      <div v-if="filteredCode" class="border border-base-content/10 rounded-xl p-4 bg-base-200/30 text-center relative overflow-hidden">
        <div class="absolute top-0 left-0 bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-br-lg font-bold">Filtered</div>
        <h3 class="text-xs font-bold uppercase tracking-widest opacity-60 mb-2 text-primary">筛选后的问卷答案</h3>
        <div class="font-mono text-xs break-all opacity-80 leading-tight select-all mb-3 text-primary-content/80">
          {{ filteredCode }}
        </div>
        <button @click="copy(filteredCode)" class="btn btn-xs btn-primary btn-outline gap-1">
          📋 复制筛选代码
        </button>
      </div>
    </div>

    <div v-if="redGroups.length > 0" class="mb-8 animate-fade-in-up">
      <div class="flex items-center gap-2 mb-4 text-error font-bold text-lg uppercase tracking-wider border-b-2 border-error/20 pb-1"><span>⛔</span> 硬边界 / Deal Breakers</div>
      <div class="flex flex-col gap-4">
        <div v-for="group in redGroups" :key="group.id" class="card bg-error text-error-content shadow-lg">
          <div class="card-body p-4">
            <h3 class="card-title text-sm opacity-90 border-b border-white/20 pb-2 mb-2">{{ group.name }}</h3>
            <div class="flex flex-wrap gap-2">
              <div v-for="q in getQuestionGroups(group.items)" :key="q.questionId" class="flex">
                <OptionPopover 
                  :question="q.items[0]?.originalQuestion" 
                  :selections="q.items.map(i => ({ avatar: resultAvatar, index: i.optionIndex }))"
                  :is-open="activePopoverId === q.questionId"
                  @toggle="togglePopover(q.questionId)"
                  @close="activePopoverId = null"
                >
                  <div class="badge bg-white text-error font-bold h-auto py-2 px-3 gap-2 border-0 shadow-sm cursor-pointer hover:scale-105 transition-transform">
                    <span class="opacity-80 text-xs font-normal border-r border-error/20 pr-2 mr-0.5">{{ q.title }}</span>
                    <div class="flex flex-wrap gap-1">
                      <span v-for="(item, idx) in q.items" :key="idx">{{ item.choice }}</span>
                    </div>
                  </div>
                </OptionPopover>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="goldGroups.length > 0" class="mb-8 animate-fade-in-up" style="animation-delay: 0.1s">
      <div class="flex items-center gap-2 mb-4 text-warning font-bold text-lg uppercase tracking-wider border-b-2 border-warning/20 pb-1"><span>⭐</span> 核心需求 / Must Haves</div>
      <div class="flex flex-col gap-4">
        <div v-for="group in goldGroups" :key="group.id" class="card bg-warning text-warning-content shadow-lg">
          <div class="card-body p-4">
            <h3 class="card-title text-sm opacity-80 border-b border-black/10 pb-2 mb-2 text-black">{{ group.name }}</h3>
            <div class="flex flex-wrap gap-2">
              <div v-for="q in getQuestionGroups(group.items)" :key="q.questionId" class="flex">
                <OptionPopover 
                  :question="q.items[0]?.originalQuestion" 
                  :selections="q.items.map(i => ({ avatar: resultAvatar, index: i.optionIndex }))"
                  :is-open="activePopoverId === q.questionId"
                  @toggle="togglePopover(q.questionId)"
                  @close="activePopoverId = null"
                >
                  <div class="badge badge-neutral bg-black/10 border-0 text-black font-bold h-auto py-2 px-3 gap-2 cursor-pointer hover:scale-105 transition-transform">
                    <span class="opacity-60 text-xs font-normal border-r border-black/20 pr-2 mr-0.5">{{ q.title }}</span>
                    <div class="flex flex-wrap gap-1">
                      <span v-for="(item, idx) in q.items" :key="idx">{{ item.choice }}</span>
                    </div>
                  </div>
                </OptionPopover>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="yellowGroups.length > 0" class="mb-8 animate-fade-in-up" style="animation-delay: 0.2s">
      <div class="flex items-center gap-2 mb-4 text-warning font-bold text-lg uppercase tracking-wider border-b-2 border-warning/20 pb-1"><span>❔</span> 待商议 / Soft Limits</div>
      <div class="flex flex-col gap-4">
        <div v-for="group in yellowGroups" :key="group.id" class="card bg-base-100 border-2 border-base-300 shadow-sm">
          <div class="card-body p-4">
            <h3 class="card-title text-sm opacity-60 border-b border-base-content/10 pb-2 mb-2">{{ group.name }}</h3>
            <div class="flex flex-wrap gap-2">
              <div v-for="q in getQuestionGroups(group.items)" :key="q.questionId" class="flex">
                <OptionPopover 
                  :question="q.items[0]?.originalQuestion" 
                  :selections="q.items.map(i => ({ avatar: resultAvatar, index: i.optionIndex }))"
                  :is-open="activePopoverId === q.questionId"
                  @toggle="togglePopover(q.questionId)"
                  @close="activePopoverId = null"
                >
                  <div class="badge badge-outline border-warning text-warning h-auto py-2 px-3 gap-2 bg-warning/5 cursor-pointer hover:bg-warning/10 transition-colors">
                    <span class="opacity-60 text-xs font-normal border-r border-warning/30 pr-2 mr-0.5 text-base-content">{{ q.title }}</span>
                    <div class="flex flex-wrap gap-1">
                      <span v-for="(item, idx) in q.items" :key="idx" class="font-bold">{{ item.choice }}</span>
                    </div>
                  </div>
                </OptionPopover>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="greenItems.length > 0" class="mb-8 animate-fade-in-up" style="animation-delay: 0.3s">
      <div class="flex items-center gap-2 mb-4 text-success font-bold text-lg uppercase tracking-wider border-b-2 border-success/20 pb-1"><span>👌</span> 可接受 / Nice to have</div>
      <div class="flex flex-wrap gap-2 bg-base-200/30 p-4 rounded-xl border border-base-content/5">
        <div v-for="q in getQuestionGroups(greenItems)" :key="q.questionId" class="flex">
          <OptionPopover 
            :question="q.items[0]?.originalQuestion" 
            :selections="q.items.map(i => ({ avatar: resultAvatar, index: i.optionIndex }))"
            :is-open="activePopoverId === q.questionId"
            @toggle="togglePopover(q.questionId)"
            @close="activePopoverId = null"
          >
            <div class="badge badge-success badge-outline bg-success/5 h-auto py-2 px-3 gap-2 cursor-pointer hover:bg-success/10 transition-colors">
              <span class="opacity-50 text-xs font-normal border-r border-success/30 pr-2 mr-0.5 text-base-content">{{ q.title }}</span>
              <div class="flex flex-wrap gap-1">
                <span v-for="(item, idx) in q.items" :key="idx" class="font-bold">{{ item.choice }}</span>
              </div>
            </div>
          </OptionPopover>
        </div>
      </div>
    </div>

    <div class="flex flex-col gap-4 mt-12 text-center">
      <div class="flex justify-center gap-8 text-sm font-bold text-primary">
        <a @click="router.push('/')" class="cursor-pointer hover:underline">返回首页</a>
        <span class="opacity-20">|</span>
        <a @click="router.push('/setup')" class="cursor-pointer hover:underline">继续答题</a>
      </div>
      <a @click="showClearModal = true" class="text-xs text-error/50 hover:text-error cursor-pointer mt-4 transition-colors">
        🗑️ 清除答题数据
      </a>
    </div>

    <dialog class="modal" :class="{ 'modal-open': showClearModal }">
      <div class="modal-box border-t-4 border-error">
        <h3 class="font-bold text-lg text-error">⚠️ 危险操作</h3>
        <div class="py-4 space-y-4">
          <div class="alert alert-warning text-xs shadow-sm">
            <span>一旦删除无法找回，建议先复制下方的数据代码。</span>
          </div>
          <p class="text-xs opacity-60">
            隐私提示：您的测试内容仅保存在浏览器缓存，不会也不可能传输到本站后台。
          </p>
          <div class="form-control">
            <label class="label">
              <span class="label-text text-xs font-bold">备份全部数据：</span>
            </label>
            <div class="flex gap-2">
              <input type="text" :value="fullCode" readonly class="input input-sm input-bordered w-full font-mono text-xs" />
              <button @click="copy(fullCode)" class="btn btn-sm btn-neutral">
                {{ copied ? '已复制' : '复制' }}
              </button>
            </div>
          </div>
        </div>
        <div class="modal-action flex justify-between items-center mt-6">
          <button class="btn btn-error btn-sm text-white" @click="handleClearData">
            确认清除数据
          </button>
          <button class="btn btn-ghost btn-sm" @click="showClearModal = false">
            返回
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="showClearModal = false">close</button>
      </form>
    </dialog>

  </div>
</template>

<style scoped>
.animate-fade-in-up {
  animation: fadeInUp 0.5s ease-out backwards;
}
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>