<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useClipboard } from '@vueuse/core';
import { useConfigStore } from '../stores/useConfigStore';
import { encode, decode } from '../logic/codec';
import questionsData from '../data/questions.json';
import type { Attitude, Module } from '../types';
import OptionPopover from '../components/OptionPopover.vue';

import AIAnalysisModal from '../components/AIAnalysisModal.vue';
const showAIModal = ref(false);

const route = useRoute();
const router = useRouter();
const store = useConfigStore();
const { copy, copied } = useClipboard();

// --- 输入模式相关状态 ---
const showInputMode = ref(false);
const inputMyCode = ref('');
const inputPartnerCode = ref('');

// --- 类型定义 ---
interface ResultItem { 
  id: string; 
  title: string; 
  choice: string; 
  attitude: Attitude; 
  moduleId: string; 
  moduleName: string; 
  questionId: string;
  originalQuestion: any;
  optionIndex: number;
}
interface ModuleGroup { id: string; name: string; items: ResultItem[]; }

const allModules = (questionsData.modules as unknown) as Module[];
const activeModuleIds = ref<string[]>([]);

// --- 结果数据状态 ---
const displayAnswers = ref<Record<string, Attitude[]>>({});
const resultAvatar = ref('🌏');

// 结果分组
const redGroups = ref<ModuleGroup[]>([]);    
const goldGroups = ref<ModuleGroup[]>([]);   
const yellowGroups = ref<ModuleGroup[]>([]); 
const greenItems = ref<ResultItem[]>([]);    

// 界面控制
const showClearModal = ref(false);
const showCodeHintModal = ref(false); 
const showCodeCard = ref(true); 
const hasClosedCodeCard = ref(false); 
const activePopoverId = ref<string | null>(null);

// --- 计算属性 ---
const pageTitle = computed(() => {
  if (showInputMode.value) return '查看关系配置';
  if (resultAvatar.value === '🌏') return '关系配置单';
  return `我和 ${resultAvatar.value} 的配置单`;
});

const availableModules = computed(() => {
  if (Object.keys(displayAnswers.value).length > 0) {
    return allModules.filter(m => 
      m.questions.some(q => displayAnswers.value[q.id] !== undefined)
    );
  } else {
    return allModules.filter(m => store.isModuleEnabled(m.id));
  }
});

const fullCode = computed(() => {
  const currentCode = route.query.code as string || Object.keys(route.query)[0];
  if (currentCode) return currentCode;
  return encode(store.answers, resultAvatar.value);
});

// 判断本地是否有数据（用于控制"继续配置"按钮显示）
const hasStoreData = computed(() => Object.keys(store.answers).length > 0);

// --- 核心逻辑 ---

function togglePopover(id: string) {
  activePopoverId.value = activePopoverId.value === id ? null : id;
}

function toggleModuleFilter(moduleId: string) {
  if (moduleId === 'A') return; 
  const idx = activeModuleIds.value.indexOf(moduleId);
  if (idx > -1) activeModuleIds.value.splice(idx, 1);
  else activeModuleIds.value.push(moduleId);
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
  
  // 关键修复：只处理 activeModuleIds 中包含的模块
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
          originalQuestion: q, 
          optionIndex: optIndex 
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

// --- 数据加载与路由处理 ---

function loadDataFromCode(code: string) {
  if (!code) return false;
  try {
    const res = decode(code);
    displayAnswers.value = res.answers as Record<string, Attitude[]>;
    resultAvatar.value = res.avatar || '🌏';
    showInputMode.value = false; 
    activeModuleIds.value = availableModules.value.map(m => m.id);
    processZoneData(displayAnswers.value);
    return true;
  } catch (e) {
    console.error("代码解析失败", e);
    return false;
  }
}

function initPage() {
  // 1. 优先检查 URL 参数
  let codeParam = route.query.code as string;
  
  if (!codeParam) {
    const keys = Object.keys(route.query);
    // 修复点：先提取 firstKey，通过 && 检查确保它不为 undefined，消除 TS 报错
    const firstKey = keys[0];
    if (firstKey && firstKey.length > 10) { 
      codeParam = firstKey;
    }
  }

  if (codeParam) {
    const success = loadDataFromCode(codeParam);
    if (success) return;
  }

  // 2. 检查本地 Store
  if (Object.keys(store.answers).length > 0) {
    displayAnswers.value = store.answers;
    if (store.targetAvatar) resultAvatar.value = store.targetAvatar;
    showInputMode.value = false;
    activeModuleIds.value = availableModules.value.map(m => m.id);
    processZoneData(displayAnswers.value);
    return;
  }

  // 3. 都没有，显示输入框
  showInputMode.value = true;
}

// --- 输入框交互逻辑 ---

async function handlePaste(target: 'my' | 'partner') {
  try {
    const text = await navigator.clipboard.readText();
    if (text) {
      if (target === 'my') inputMyCode.value = text;
      else inputPartnerCode.value = text;
    }
  } catch (err) {
    console.error('粘贴失败:', err);
  }
}

function handleAnalyze() {
  if (inputMyCode.value && inputPartnerCode.value) {
    router.push({
      path: '/compare',
      query: { my: inputMyCode.value, partner: inputPartnerCode.value }
    });
    return;
  }

  const code = inputMyCode.value || inputPartnerCode.value;
  if (code) {
    router.push({ query: { code } });
  }
}

// --- 监听器 ---

// 修复点 1：监听 activeModuleIds 变化，实时更新下方显示
watch(activeModuleIds, () => {
  processZoneData(displayAnswers.value);
}, { deep: true });

watch(() => route.query, () => {
  initPage();
}, { deep: true });

onMounted(() => {
  initPage();
});

// --- 其他 UI 处理 ---

function handleCloseCodeCard() {
  showCodeCard.value = false;
  if (!hasClosedCodeCard.value) {
    showCodeHintModal.value = true;
    hasClosedCodeCard.value = true;
  }
}

function handleReopenCodeCard() {
  showCodeCard.value = true;
  hasClosedCodeCard.value = true;
  setTimeout(() => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }, 100);
}

function handleClearData() {
  store.resetAll();
  localStorage.removeItem('config_store');
  localStorage.removeItem('quiz_index');
  showClearModal.value = false;
  router.push('/');
}
</script>

<template>
  <div class="pb-32 pt-10 px-6 max-w-3xl mx-auto min-h-screen font-sans text-base">
    
    <div class="text-center mb-10">
      <h2 class="text-3xl font-bold text-base-content tracking-tight mb-2">
        {{ pageTitle }}
      </h2>
      <p class="text-sm text-base-content/40 uppercase tracking-widest font-medium">Manifesto Generated</p>
    </div>

    <div v-if="showInputMode" class="animate-fade-in-up max-w-md mx-auto">
      <div class="space-y-4">
        <div class="p-6 bg-base-100 border border-base-content/10 rounded-2xl shadow-sm text-center mb-6">
          <p class="text-base font-bold mb-2">🔭 查看或对比配置</p>
          <p class="text-sm opacity-60">
            请输入一段配置代码以查看结果。<br>
            同时输入两段代码，将直接开启对比模式。
          </p>
        </div>

        <div class="relative">
          <input v-model="inputMyCode" placeholder="粘贴你的代码 / Code A" class="w-full h-12 bg-base-100 border border-base-content/20 rounded-xl px-4 text-base font-mono focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all placeholder:text-base-content/30" />
          <button @click="handlePaste('my')" class="absolute right-2 top-2 p-2 text-base-content/30 hover:text-black transition-colors">
            <i-ph-clipboard-text-bold class="text-xl"/>
          </button>
        </div>

        <div class="relative">
          <input v-model="inputPartnerCode" placeholder="粘贴伴侣的代码 / Code B (可选)" class="w-full h-12 bg-base-100 border border-base-content/20 rounded-xl px-4 text-base font-mono focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all placeholder:text-base-content/30" />
          <button @click="handlePaste('partner')" class="absolute right-2 top-2 p-2 text-base-content/30 hover:text-black transition-colors">
            <i-ph-clipboard-text-bold class="text-xl"/>
          </button>
        </div>

        <button 
          @click="handleAnalyze" 
          class="w-full h-12 mt-4 bg-neutral text-neutral-content rounded-xl text-base font-bold hover:bg-neutral-focus hover:scale-[1.02] active:scale-95 transition-all shadow-md"
          :disabled="!inputMyCode && !inputPartnerCode"
        >
          {{ inputMyCode && inputPartnerCode ? '⚔️ 开始对比分析' : '📄 解析代码' }}
        </button>
        
        <div class="text-center mt-6">
          <a @click="router.push('/')" class="text-sm text-base-content/40 hover:text-primary cursor-pointer transition-colors">
            返回首页创建新配置
          </a>
        </div>
      </div>
    </div>

    <div v-else class="animate-fade-in-up">

      <div class="mb-10">
        <div class="flex items-center justify-center gap-2 mb-3 opacity-40">
          <i-ph-funnel-bold />
          <span class="text-xs font-bold uppercase tracking-wider">显示模块 / Filter Modules</span>
        </div>
        <div class="flex flex-wrap gap-3 justify-center">
          <button 
            v-for="mod in availableModules" 
            :key="mod.id"
            @click="toggleModuleFilter(mod.id)"
            class="btn btn-sm h-9 px-4 rounded-full transition-all border shadow-sm"
            :class="[
              activeModuleIds.includes(mod.id) 
                ? 'bg-base-content text-base-100 border-base-content hover:bg-base-content/80' 
                : 'bg-base-100 text-base-content/60 border-base-content/10 hover:border-base-content/30 hover:bg-base-200',
              mod.id === 'A' ? 'cursor-not-allowed opacity-80' : ''
            ]"
          >
            {{ mod.name.replace(/^(模块\s*[A-J][：:]\s*)/, '').replace(/📦 |⚛️ /g, '') }}
          </button>
        </div>
      </div>

      <Transition name="fade">
        <div v-if="showCodeCard && !hasClosedCodeCard" class="mb-12 relative group animate-fade-in-up">
          <div class="bg-base-100 border border-base-content/10 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <button 
              @click="handleCloseCodeCard"
              class="absolute top-3 right-3 btn btn-xs btn-circle btn-ghost text-base-content/30 hover:text-base-content z-10"
              title="关闭卡片"
            >
              <i-ph-x-bold />
            </button>

            <div class="flex flex-col gap-4">
  <div class="flex items-center gap-2 text-xs font-bold text-base-content/40 uppercase tracking-wider">
    <i-ph-share-fat-bold class="text-sm" />
    <span>Result Code</span>
  </div>
  
  <div class="bg-base-200/50 rounded-lg p-4 font-mono text-sm break-all text-base-content/70 leading-relaxed border border-base-content/5 selection:bg-primary/20">
    {{ fullCode }}
  </div>

  <div class="flex gap-3">
    
    <button 
      @click="copy(fullCode)" 
      class="btn btn-md flex-1 btn-neutral gap-2 rounded-lg text-white shadow-sm"
    >
      <i-ph-check-bold v-if="copied" />
      <i-ph-copy-bold v-else />
      <span v-if="copied">已复制</span>
      <span v-else>复制代码</span>
    </button>

    <button 
      @click="showAIModal = true" 
      class="btn btn-md flex-1 btn-outline gap-2 rounded-lg border-base-content/10 hover:bg-base-content hover:text-base-100 hover:border-transparent transition-all group"
    >
      <i-ph-robot-bold class="text-xl group-hover:scale-110 transition-transform" />
      <span>AI 分析</span>
    </button>
    
  </div>
</div>
          </div>
        </div>
      </Transition>

      <div class="space-y-10">

        <div v-if="goldGroups.length > 0" class="animate-fade-in-up">
          <div class="flex items-center gap-2 mb-4 px-1">
            <i-ph-star-fill class="text-amber-500 text-xl" />
            <span class="text-base font-bold uppercase tracking-wider text-base-content/80">Must Haves / 核心需求</span>
          </div>
          
          <div class="flex flex-col gap-6">
            <div 
              v-for="group in goldGroups" 
              :key="group.id" 
              class="bg-base-100 border-l-4 border-amber-500 rounded-xl shadow-sm p-6 border-y border-r border-base-content/5"
            >
              <h3 class="text-xs font-bold opacity-40 uppercase mb-4 tracking-widest">{{ group.name }}</h3>
              <div class="flex flex-wrap gap-3">
                <div v-for="item in group.items" :key="item.id">
                  <OptionPopover 
                    :question="item.originalQuestion" 
                    :selections="[{ avatar: resultAvatar, index: item.optionIndex, attitude: item.attitude }]"
                    :is-open="activePopoverId === item.id"
                    @toggle="togglePopover(item.id)"
                    @close="activePopoverId = null"
                  >
                    <div class="badge h-auto py-2.5 px-4 gap-2 cursor-pointer hover:scale-105 transition-transform bg-gradient-to-br from-neutral to-black border border-white/10 shadow-sm rounded-lg">
                      <span class="text-white/60 text-sm font-normal border-r border-white/10 pr-2 mr-0.5">
                        {{ item.title }}
                      </span>
                      <span class="text-amber-400 font-bold text-sm flex items-center gap-1">
                        {{ item.choice }}
                      </span>
                    </div>
                  </OptionPopover>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="redGroups.length > 0" class="animate-fade-in-up delay-100">
          <div class="flex items-center gap-2 mb-4 px-1">
            <i-ph-x-bold class="text-error text-xl" />
            <span class="text-base font-bold uppercase tracking-wider text-base-content/80">Deal Breakers / 硬边界</span>
          </div>
          
          <div class="flex flex-col gap-6">
            <div 
              v-for="group in redGroups" 
              :key="group.id" 
              class="bg-base-100 border-l-4 border-error rounded-xl shadow-sm p-6 border-y border-r border-base-content/5"
            >
              <h3 class="text-xs font-bold opacity-40 uppercase mb-4 tracking-widest">{{ group.name }}</h3>
              <div class="flex flex-wrap gap-3">
                <div v-for="item in group.items" :key="item.id">
                  <OptionPopover 
                    :question="item.originalQuestion" 
                    :selections="[{ avatar: resultAvatar, index: item.optionIndex, attitude: item.attitude }]"
                    :is-open="activePopoverId === item.id"
                    @toggle="togglePopover(item.id)"
                    @close="activePopoverId = null"
                  >
                    <div class="badge badge-outline border-error/50 text-error h-auto py-2.5 px-4 gap-2 cursor-pointer hover:bg-error/5 transition-colors bg-base-100 rounded-lg">
                      <span class="opacity-70 text-sm font-normal border-r border-error/20 pr-2 mr-0.5">
                        {{ item.title }}
                      </span>
                      <span class="font-bold text-sm">{{ item.choice }}</span>
                    </div>
                  </OptionPopover>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="yellowGroups.length > 0" class="animate-fade-in-up delay-200">
          <div class="flex items-center gap-2 mb-4 px-1">
            <i-ph-question-bold class="text-warning text-xl" />
            <span class="text-base font-bold uppercase tracking-wider text-base-content/80">Soft Limits / 待商议</span>
          </div>
          
          <div class="flex flex-col gap-6">
            <div 
              v-for="group in yellowGroups" 
              :key="group.id" 
              class="bg-base-100 border-l-4 border-warning/50 rounded-xl shadow-sm p-6 border-y border-r border-base-content/5"
            >
              <h3 class="text-xs font-bold opacity-40 uppercase mb-4 tracking-widest">{{ group.name }}</h3>
              <div class="flex flex-wrap gap-3">
                <div v-for="item in group.items" :key="item.id">
                  <OptionPopover 
                    :question="item.originalQuestion" 
                    :selections="[{ avatar: resultAvatar, index: item.optionIndex, attitude: item.attitude }]"
                    :is-open="activePopoverId === item.id"
                    @toggle="togglePopover(item.id)"
                    @close="activePopoverId = null"
                  >
                    <div class="badge border-none text-base-content/80 h-auto py-2.5 px-4 gap-2 bg-warning/20 cursor-pointer hover:bg-warning/30 transition-colors rounded-lg">
                      <span class="opacity-50 text-sm font-normal border-r border-base-content/10 pr-2 mr-0.5">
                        {{ item.title }}
                      </span>
                      <span class="font-medium text-sm">{{ item.choice }}</span>
                    </div>
                  </OptionPopover>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="greenItems.length > 0" class="animate-fade-in-up delay-300">
          <div class="flex items-center gap-2 mb-4 px-1">
            <i-ph-check-bold class="text-success text-xl" />
            <span class="text-base font-bold uppercase tracking-wider text-base-content/80">Nice to Have / 可接受</span>
          </div>
          
          <div class="bg-base-100 border border-base-content/10 rounded-xl p-6 shadow-sm">
            <div class="flex flex-wrap gap-3">
              <div v-for="item in greenItems" :key="item.id">
                <OptionPopover 
                  :question="item.originalQuestion" 
                  :selections="[{ avatar: resultAvatar, index: item.optionIndex, attitude: item.attitude }]"
                  :is-open="activePopoverId === item.id"
                  @toggle="togglePopover(item.id)"
                  @close="activePopoverId = null"
                >
                  <div class="badge badge-ghost h-auto py-2 px-3 gap-2 text-base-content/60 bg-base-200 hover:bg-base-300 cursor-pointer rounded-lg">
                    <span class="opacity-50 text-xs font-normal border-r border-base-content/10 pr-2 mr-0.5">
                      {{ item.title }}
                    </span>
                    <span class="text-sm">{{ item.choice }}</span>
                  </div>
                </OptionPopover>
              </div>
            </div>
          </div>
        </div>

      </div>

      <div class="flex flex-col gap-8 mt-20 text-center border-t border-base-content/5 pt-10">
        
        <div v-if="showCodeCard && hasClosedCodeCard" class="animate-fade-in-up">
          <div class="bg-base-100 border border-base-content/10 rounded-xl p-5 shadow-sm text-left relative">
            <button 
              @click="showCodeCard = false"
              class="absolute top-3 right-3 btn btn-xs btn-circle btn-ghost text-base-content/30 hover:text-base-content"
            >
              <i-ph-x-bold />
            </button>
            <div class="flex items-center gap-2 text-xs font-bold text-base-content/40 uppercase tracking-wider mb-3">
              <i-ph-share-fat-bold class="text-sm" />
              <span>Result Code</span>
            </div>
            <div class="bg-base-200/50 rounded-lg p-3 font-mono text-sm break-all text-base-content/70 border border-base-content/5 mb-3">
              {{ fullCode }}
            </div>
            <button @click="copy(fullCode)" class="btn btn-sm w-full btn-neutral gap-2 text-white">
              <i-ph-copy-bold /> {{ copied ? '已复制' : '复制配置代码' }}
            </button>
          </div>
        </div>

        <button 
          v-if="!showCodeCard"
          @click="handleReopenCodeCard"
          class="text-sm font-bold text-primary hover:underline flex items-center justify-center gap-2 py-2"
        >
          <i-ph-share-fat-bold />
          <span>显示配置代码卡片</span>
        </button>

        <div class="flex flex-wrap justify-center gap-8 text-base font-bold text-base-content/60">
          <a @click="router.push('/')" class="cursor-pointer hover:text-primary transition-colors">返回首页</a>
          
          <a v-if="hasStoreData" @click="router.push('/setup')" class="cursor-pointer hover:text-primary transition-colors flex items-center gap-1">
             <i-ph-arrow-counter-clockwise-bold />
             继续配置
          </a>

          <a @click="showInputMode = true" class="cursor-pointer hover:text-primary transition-colors flex items-center gap-1 opacity-70">
             <i-ph-magnifying-glass-bold />
             输入其他代码
          </a>
        </div>
        
        <a @click="showClearModal = true" class="text-xs text-error/40 hover:text-error cursor-pointer transition-colors mt-2">
          🗑️ 清除所有数据
        </a>
      </div>

    </div>

    <BaseModal v-model="showClearModal" title="⚠️ 危险操作">
      <div class="space-y-4">
        <div class="p-4 bg-base-100 border border-base-content/10 rounded-xl relative">
          <div class="text-xs font-bold text-base-content/40 uppercase tracking-wider mb-2">Code Backup</div>
          <input 
            :value="fullCode" 
            readonly
            class="w-full bg-base-200 text-xs p-2 rounded border-none font-mono opacity-60 focus:outline-none"
          />
          <button 
            @click="copy(fullCode)"
            class="absolute top-3 right-3 btn btn-xs btn-ghost text-base-content/40 hover:text-base-content"
          >
            <i-ph-copy-bold v-if="!copied"/>
            <i-ph-check-bold v-else class="text-success"/>
          </button>
        </div>

        <div class="p-3 bg-warning/10 text-warning text-xs rounded-lg">
          一旦删除无法找回。建议先点击上方按钮复制备份代码。
        </div>
      </div>
      <template #actions>
        <button class="btn btn-error btn-sm text-white" @click="handleClearData">
          确认清除
        </button>
        <button class="btn btn-ghost btn-sm" @click="showClearModal = false">
          取消
        </button>
      </template>
    </BaseModal>

    <BaseModal v-model="showCodeHintModal">
      <div class="flex flex-col items-center text-center py-2">
        <i-ph-warning-circle-bold class="text-3xl text-info mb-2" />
        <h3 class="font-bold text-lg mb-2">已收起</h3>
        <p class="text-sm opacity-70">
        您随时可以在<strong>页面底部</strong>找到这段代码卡片的链接。
        </p>
      </div>
      <template #actions>
        <button class="btn btn-primary btn-sm w-full" @click="showCodeHintModal = false">
          知道了
        </button>
      </template>
    </BaseModal>

    <AIAnalysisModal 
      v-model="showAIModal" 
      :code-a="fullCode" 
    />

  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.animate-fade-in-up { animation: fadeInUp 0.5s ease-out backwards; }
.delay-100 { animation-delay: 0.1s; }
.delay-200 { animation-delay: 0.2s; }
.delay-300 { animation-delay: 0.3s; }

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(15px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>