<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useClipboard } from '@vueuse/core';
import { useConfigStore } from '../stores/useConfigStore';
import { encode, decode } from '../logic/codec';
import questionsData from '../data/questions.json';
import type { Attitude, Module } from '../types';
import OptionPopover from '../components/OptionPopover.vue';
import BaseModal from '../components/BaseModal.vue';

// 🌟 图标引入
import IconXBold from '~icons/ph/x-bold';
import IconCopy from '~icons/ph/copy-bold';
import IconCheck from '~icons/ph/check-bold';
import IconStarFill from '~icons/ph/star-fill';
import IconWarningCircle from '~icons/ph/warning-circle-bold';
import IconShareFat from '~icons/ph/share-fat-bold';
import IconArrowCounterClockwise from '~icons/ph/arrow-counter-clockwise-bold';
import IconFunnel from '~icons/ph/funnel-bold';

const route = useRoute();
const router = useRouter();
const store = useConfigStore();
const { copy, copied } = useClipboard();

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

// --- 状态变量 ---
const isPreviewMode = ref(false);
const displayAnswers = ref<Record<string, Attitude[]>>({});
const resultAvatar = ref('🌏');

// 筛选相关
const allModules = (questionsData.modules as unknown) as Module[];
const activeModuleIds = ref<string[]>([]);

// 结果分组
const redGroups = ref<ModuleGroup[]>([]);    
const goldGroups = ref<ModuleGroup[]>([]);   
const yellowGroups = ref<ModuleGroup[]>([]); 
const greenItems = ref<ResultItem[]>([]);    

// 弹窗与卡片控制
const showClearModal = ref(false);
const showCodeHintModal = ref(false); 
const showCodeCard = ref(true); 
const hasClosedCodeCard = ref(false); 

const activePopoverId = ref<string | null>(null);

function togglePopover(id: string) {
  activePopoverId.value = activePopoverId.value === id ? null : id;
}

// --- 计算属性 ---
const pageTitle = computed(() => {
  if (resultAvatar.value === '🌏') return '关系配置单';
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

// --- 核心逻辑 ---

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
  <div class="pb-32 pt-10 px-6 max-w-3xl mx-auto min-h-screen font-sans text-base">
    
    <div class="text-center mb-10">
      <h2 class="text-3xl font-bold text-base-content tracking-tight mb-2">
        {{ pageTitle }}
      </h2>
      <p class="text-sm text-base-content/40 uppercase tracking-widest font-medium">Manifesto Generated</p>
    </div>

    <div class="mb-10">
      <div class="flex items-center justify-center gap-2 mb-3 opacity-40">
        <IconFunnel />
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
            <IconXBold />
          </button>

          <div class="flex flex-col gap-4">
            <div class="flex items-center gap-2 text-xs font-bold text-base-content/40 uppercase tracking-wider">
              <IconShareFat class="text-sm" />
              <span>Result Code</span>
            </div>
            
            <div class="bg-base-200/50 rounded-lg p-4 font-mono text-sm break-all text-base-content/70 leading-relaxed border border-base-content/5 selection:bg-primary/20">
              {{ fullCode }}
            </div>

            <button 
              @click="copy(fullCode)" 
              class="btn btn-md w-full btn-neutral gap-2 rounded-lg text-white"
            >
              <IconCheck v-if="copied" />
              <IconCopy v-else />
              <span v-if="copied">已复制</span>
              <span v-else>复制配置代码</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <div class="space-y-10">

      <div v-if="goldGroups.length > 0" class="animate-fade-in-up">
        <div class="flex items-center gap-2 mb-4 px-1">
          <IconStarFill class="text-amber-500 text-xl" />
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
          <IconXBold class="text-error text-xl" />
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
          <span class="text-warning text-xl font-bold">?</span>
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
          <IconCheck class="text-success text-xl" />
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
            <IconXBold />
          </button>
          <div class="flex items-center gap-2 text-xs font-bold text-base-content/40 uppercase tracking-wider mb-3">
            <IconShareFat class="text-sm" />
            <span>Result Code</span>
          </div>
          <div class="bg-base-200/50 rounded-lg p-3 font-mono text-sm break-all text-base-content/70 border border-base-content/5 mb-3">
            {{ fullCode }}
          </div>
          <button @click="copy(fullCode)" class="btn btn-sm w-full btn-neutral gap-2 text-white">
            <IconCopy /> {{ copied ? '已复制' : '复制配置代码' }}
          </button>
        </div>
      </div>

      <button 
        v-if="!showCodeCard"
        @click="handleReopenCodeCard"
        class="text-sm font-bold text-primary hover:underline flex items-center justify-center gap-2 py-2"
      >
        <IconShareFat />
        <span>显示配置代码卡片</span>
      </button>

      <div class="flex justify-center gap-8 text-base font-bold text-base-content/60">
        <a @click="router.push('/')" class="cursor-pointer hover:text-primary transition-colors">返回首页</a>
        <a @click="router.push('/setup')" class="cursor-pointer hover:text-primary transition-colors flex items-center gap-1">
          <IconArrowCounterClockwise />
          继续配置
        </a>
      </div>
      
      <a @click="showClearModal = true" class="text-xs text-error/40 hover:text-error cursor-pointer transition-colors mt-2">
        🗑️ 清除所有数据
      </a>
    </div>

    <BaseModal v-model="showClearModal" title="⚠️ 危险操作">
      <div class="space-y-4">
        <div class="p-3 bg-warning/10 text-warning text-xs rounded-lg">
          一旦删除无法找回。建议先备份上方代码。
        </div>
        <p class="text-xs opacity-60">
          隐私提示：您的测试内容仅保存在浏览器缓存，不会上传到任何服务器。
        </p>
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
        <IconWarningCircle class="text-3xl text-info mb-2" />
        <h3 class="font-bold text-lg mb-2">代码已收起</h3>
        <p class="text-sm opacity-70">
          为了方便阅读，代码卡片已折叠。<br/>
          您随时可以在<strong>页面底部</strong>点击按钮重新展开。
        </p>
      </div>
      <template #actions>
        <button class="btn btn-primary btn-sm w-full" @click="showCodeHintModal = false">
          知道了
        </button>
      </template>
    </BaseModal>

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