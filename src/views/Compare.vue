<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { decode } from '../logic/codec';
import questionsData from '../data/questions.json';
import type { Attitude, Module } from '../types';
import CompareDashboard from '../components/CompareDashboard.vue'; 
import OptionPopover from '../components/OptionPopover.vue';
import AIAnalysisModal from '../components/AIAnalysisModal.vue';
const showAIModal = ref(false);



const route = useRoute();
const router = useRouter();

// --- 类型定义 ---
interface CompareItem { 
  id: string; 
  title: string; 
  choice: string; 
  moduleId: string; 
  moduleName: string; 
  myAttitude: Attitude; 
  partnerAttitude: Attitude; 
  originalQuestion: any;
  myOptionIndex: number;
  partnerOptionIndex: number;
}
interface ModuleGroup { id: string; name: string; items: CompareItem[]; }

const allModules = (questionsData.modules as unknown) as Module[];
const selectedModuleIds = ref<string[]>(allModules.map(m => m.id));

const listResonance = ref<CompareItem[]>([]); 
const listCritical = ref<CompareItem[]>([]);  
const listDiscuss = ref<CompareItem[]>([]);   
const listNegotiate = ref<CompareItem[]>([]); 
const listError = ref<CompareItem[]>([]); // ✅ 新增：异常数据列表

const myAvatar = ref('😎');
const partnerAvatar = ref('😎');

// Popover 状态
const activePopoverId = ref<string | null>(null);
function togglePopover(id: string) {
  activePopoverId.value = activePopoverId.value === id ? null : id;
}

const hasData = computed(() => {
  return listResonance.value.length + listCritical.value.length + listDiscuss.value.length + listNegotiate.value.length + listError.value.length> 0;
});

// 分组与筛选逻辑
function groupAndFilter(items: CompareItem[]): ModuleGroup[] {
  const filtered = items.filter(i => selectedModuleIds.value.includes(i.moduleId));
  const map = new Map<string, ModuleGroup>();
  filtered.forEach(item => {
    if (!map.has(item.moduleId)) map.set(item.moduleId, { id: item.moduleId, name: item.moduleName, items: [] });
    map.get(item.moduleId)!.items.push(item);
  });
  return Array.from(map.values());
}

const groupsResonance = computed(() => groupAndFilter(listResonance.value));
const groupsCritical = computed(() => groupAndFilter(listCritical.value));
const groupsDiscuss = computed(() => groupAndFilter(listDiscuss.value));
const groupsNegotiate = computed(() => groupAndFilter(listNegotiate.value));
const groupsError = computed(() => groupAndFilter(listError.value)); // ✅ 新增：异常分组计算

// 滚动定位
function scrollToZone(elementId: string) {
  const el = document.getElementById(elementId);
  if (el) {
    const offset = 100; 
    const elementPosition = el.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - offset;
    window.scrollTo({ top: offsetPosition, behavior: "smooth" });
    el.classList.add('animate-flash');
    setTimeout(() => el.classList.remove('animate-flash'), 1000);
  }
}

// 核心比对逻辑
// 核心比对逻辑 (✅ 已更新适配 5 态 & 异常捕获)
function analyze(myMap: Record<string, Attitude[]>, partnerMap: Record<string, Attitude[]>) {
  // eList 用于存放异常数据
  const nList: CompareItem[] = [], hList: CompareItem[] = [], rList: CompareItem[] = [], dList: CompareItem[] = [], eList: CompareItem[] = [];
  
  allModules.forEach(m => {
    const cleanModuleName = m.name.replace(/^(模块\s*[A-J][：:]\s*)/, '').replace(/📦 |⚛️ /g, '');

    m.questions.forEach(q => {
      const myStates = myMap[q.id] || []; 
      const partnerStates = partnerMap[q.id] || [];
      
      q.options.forEach((opt, index) => {
        // 1. 获取原始数值
        let rawA = Number(myStates[index] !== undefined ? myStates[index] : 0);
        let rawB = Number(partnerStates[index] !== undefined ? partnerStates[index] : 0);

        const choiceText = typeof opt === 'string' ? opt : (opt?.short || '未知选项');

        const item: CompareItem = {
          id: q.id + '_' + index, 
          title: q.title_short || q.title, 
          choice: choiceText,             
          moduleId: m.id, 
          moduleName: cleanModuleName,
          myAttitude: rawA as Attitude, 
          partnerAttitude: rawB as Attitude,
          originalQuestion: q, 
          myOptionIndex: index, 
          partnerOptionIndex: index
        };

        // 2. 异常检测：如果不在 0-5 范围内，归入错误组
        if (isNaN(rawA) || rawA < 0 || rawA > 5 || isNaN(rawB) || rawB < 0 || rawB > 5) {
          eList.push(item);
          return;
        }

        const a = rawA as Attitude;
        const b = rawB as Attitude;

        // 双方都未表态(0)，跳过
        if (a === 0 && b === 0) return; 

        // --- 3. 新版分类矩阵 ---

        // A. 需要沟通 (Discuss)
        // 定义：一方是 2(待商议) 或 0(未表态)
        if (a === 2 || b === 2 || a === 0 || b === 0) {
           dList.push(item);
        } 
        // B. 核心冲突 (Critical)
        // 定义：严格限定为 4(Core) vs 1(No) 的死局
        else if ((a === 4 && b === 1) || (a === 1 && b === 4)) {
           nList.push(item);
        } 
        // C. 默契共振 (Resonance)
        // 定义：双正向 (>=3) 或 双负向 (1或5)
        else if ((a >= 3 && b >= 3) || ((a === 1 || a === 5) && (b === 1 || b === 5))) {
           rList.push(item);
        } 
        // D. 协商让步 (Negotiate)
        // 定义：其余所有情况 (包括 4vs5, 3vs1, 3vs5 等)
        else {
           hList.push(item);
        }
      });
    });
  });

  listResonance.value = rList;
  listCritical.value = nList;
  listDiscuss.value = dList;
  listNegotiate.value = hList;
  listError.value = eList; // ✅ 赋值错误列表
}

/// 切换模块显示状态
const toggleFilter = (id: string) => {
  // 🔒 核心逻辑修改：
  // 如果点击的是 'A' (核心内核)，直接拦截返回，不做任何改变。
  // 这样它就永远无法被取消，且视觉上保持选中状态。
  if (id === 'A') return;

  const idx = selectedModuleIds.value.indexOf(id);
  if (idx > -1) {
    // 允许取消选中（不需要再判断 length > 1，因为 A 永远在）
    selectedModuleIds.value.splice(idx, 1);
  } else {
    // 选中
    selectedModuleIds.value.push(id);
  }
};

function toggleAllFilters() {
  selectedModuleIds.value.length === allModules.length ? selectedModuleIds.value = ['A'] : selectedModuleIds.value = allModules.map(m => m.id);
}

// 双击标题返回顶部
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

onMounted(() => {
  const myCode = route.query.my as string;
  const partnerCode = route.query.partner as string;
  if (myCode && partnerCode) {
    try {
      const res1 = decode(myCode);
      const res2 = decode(partnerCode);
      
      myAvatar.value = res1.avatar || '😎';
      partnerAvatar.value = res2.avatar || '🤠';

      const myAnswers = res1.answers as Record<string, Attitude[]>;
      const partnerAnswers = res2.answers as Record<string, Attitude[]>;
      
      analyze(myAnswers, partnerAnswers);
    } catch (e) { console.error(e); }
  } else {
    router.push('/');
  }
});
</script>

<template>
  <div class="pb-32 pt-6 px-6 max-w-3xl mx-auto min-h-screen font-sans text-base">
    
    <div class="mb-8">
      <div class="bg-base-100/90 backdrop-blur-md shadow-sm border border-base-content/5 rounded-2xl p-3 flex flex-col gap-3">
        <div class="flex items-center justify-between px-1">
          <div class="flex items-center gap-2 opacity-60">
            <i-ph-funnel-bold class="text-sm" />
            <span class="text-xs font-bold uppercase tracking-wider">Filter / 筛选模块</span>
          </div>
          <button @click="toggleAllFilters" class="btn btn-xs btn-ghost text-xs h-auto py-1">
            {{ selectedModuleIds.length === allModules.length ? '取消全选' : '全选' }}
          </button>
        </div>
        
        <div class="flex flex-wrap gap-2 max-h-32 overflow-y-auto no-scrollbar">
          <button 
            v-for="mod in allModules" :key="mod.id" @click="toggleFilter(mod.id)"
            class="btn btn-xs h-7 px-3 rounded-full transition-all border"
            :class="selectedModuleIds.includes(mod.id) 
              ? 'bg-base-content text-base-100 border-base-content' 
              : 'bg-transparent text-base-content/50 border-base-content/10 hover:bg-base-200'"
          >
            {{ mod.name.replace(/^(模块\s*[A-J][：:]\s*)/, '').replace(/📦 |⚛️ /g, '') }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="hasData" class="mb-12 animate-fade-in-up">
      <div class="text-center mb-8">
        <h2 class="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent mb-2 inline-block">
          双人结果对比
        </h2>
        <div class="flex justify-center items-center gap-4 text-sm font-bold opacity-60 mt-2">
          <span class="px-2 py-1 bg-base-200 rounded-lg flex items-center gap-1">
             {{ myAvatar }} 我方
          </span>
          <span class="text-xs font-black text-base-content/30">VS</span>
          <span class="px-2 py-1 bg-base-200 rounded-lg flex items-center gap-1">
             {{ partnerAvatar }} 对方
          </span>
        </div>
      </div>
      
      <div class="flex justify-center">
        <CompareDashboard 
          :counts="{
            resonance: listResonance.length,
            critical: listCritical.length,
            discuss: listDiscuss.length,
            negotiate: listNegotiate.length
          }"
          @scroll-to="scrollToZone"
          @open-ai="showAIModal = true"
        />
      </div>
    </div>

    <div class="flex flex-col">

      <div v-if="groupsError.length > 0" id="zone-error" class="scroll-mt-32 pb-8">
        <div class="animate-fade-in-up">
          <div class="sticky top-16 z-20 bg-base-100/95 backdrop-blur-md py-4 mb-4 -mx-6 px-7 border-b border-base-content/5 flex items-center gap-2 text-error cursor-pointer hover:bg-base-100 transition-colors">
            <i-ph-exclamation-mark-fill class="text-2xl drop-shadow-sm" />
            <div>
              <h3 class="text-lg font-bold uppercase tracking-wider leading-none">Data Error</h3>
              <p class="text-xs opacity-60 font-bold mt-1">数据异常 / 版本不兼容</p>
            </div>
          </div>
          
          <div class="flex flex-col gap-6">
            <div v-for="group in groupsError" :key="group.id" class="bg-base-100 border-l-4 border-error/50 rounded-xl shadow-sm p-6 border-y border-r">
              <h4 class="text-xs font-bold opacity-40 uppercase mb-4 tracking-widest text-error">{{ group.name }}</h4>
              <div class="flex flex-wrap gap-3">
                <div v-for="item in group.items" :key="item.id">
                  <div class="badge badge-lg h-auto py-2 px-3 gap-3 bg-error/10 border border-error/20 text-error cursor-not-allowed rounded-lg">
                    <span class="text-xs opacity-70 border-r border-error/20 pr-2 mr-1">{{ item.title }}</span>
                    <span class="font-mono text-xs font-bold">
                       Err: {{ item.myAttitude }}/{{ item.partnerAttitude }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div id="zone-critical" class="scroll-mt-32 pb-16">
        <div class="animate-fade-in-up">
          <div 
            class="sticky top-16 z-20 bg-base-100/95 backdrop-blur-md py-4 mb-4 -mx-6 px-7 border-b border-base-content/5 flex items-center gap-2 text-error cursor-pointer hover:bg-base-100 transition-colors"
            @dblclick="scrollToTop"
          >
            <i-ph-sword-bold class="text-2xl drop-shadow-sm" />
            <div>
              <h3 class="text-lg font-bold uppercase tracking-wider leading-none">Critical Conflict</h3>
              <p class="text-xs opacity-60 font-bold mt-1">核心关注 / 态度截然相反</p>
            </div>
          </div>
          
          <div v-if="groupsCritical.length > 0" class="flex flex-col gap-6">
            <div 
              v-for="group in groupsCritical" 
              :key="group.id" 
              class="bg-base-100 border-l-4 border-error rounded-xl shadow-sm p-6 border-y border-r border-base-content/5"
            >
              <h4 class="text-xs font-bold opacity-40 uppercase mb-4 tracking-widest text-error">{{ group.name }}</h4>
              <div class="flex flex-wrap gap-3">
                <div v-for="item in group.items" :key="item.id">
                  <OptionPopover 
                    :question="item.originalQuestion" 
                    :selections="[
                      { avatar: myAvatar, index: item.myOptionIndex, attitude: item.myAttitude },
                      { avatar: partnerAvatar, index: item.partnerOptionIndex, attitude: item.partnerAttitude }
                    ]"
                    :is-open="activePopoverId === item.id"
                    @toggle="togglePopover(item.id)"
                    @close="activePopoverId = null"
                  >
                    <div class="badge badge-lg h-auto py-2.5 px-4 gap-3 bg-error/5 border border-error/20 text-error-content cursor-pointer hover:bg-error/10 hover:scale-105 transition-all rounded-lg shadow-sm group">
                        <span class="text-xs font-bold opacity-70 border-r border-error/20 pr-3 mr-1 group-hover:border-error/40 transition-colors">{{ item.title }}</span>
                        <div class="flex items-center gap-2 text-sm font-bold">
                            <div class="flex items-center gap-1">
                                <i-ph-star-fill v-if="item.myAttitude === 4" class="text-amber-400 drop-shadow-sm" />
                                <i-ph-x-bold v-else-if="item.myAttitude === 1" class="text-error" />
                                <i-ph-thumbs-down-bold v-else-if="item.myAttitude === 5" class="text-base-content/60" /> <i-ph-check-bold v-else-if="item.myAttitude === 3" class="text-success" />
                                <i-ph-question-bold v-else-if="item.myAttitude === 2" class="text-warning" />
                                <span v-else-if="item.myAttitude === 0" class="w-1.5 h-1.5 rounded-full bg-current opacity-40"></span>
                            </div>
                            <i-ph-lightning-fill class="text-xs text-error opacity-40 mx-0.5 animate-pulse" />
                            <div class="flex items-center gap-1">
                                <span class="text-xs">{{ partnerAvatar }}</span>
                                <i-ph-star-fill v-if="item.partnerAttitude === 4" class="text-amber-400 drop-shadow-sm" />
                                <i-ph-x-bold v-else-if="item.partnerAttitude === 1" class="text-error" />
                                <i-ph-thumbs-down-bold v-else-if="item.partnerAttitude === 5" class="text-base-content/60" /> <i-ph-check-bold v-else-if="item.partnerAttitude === 3" class="text-success" />
                                <i-ph-question-bold v-else-if="item.partnerAttitude === 2" class="text-warning" />
                                <span v-else-if="item.partnerAttitude === 0" class="w-1.5 h-1.5 rounded-full bg-current opacity-40"></span>
                            </div>
                            <span class="ml-1 opacity-90">{{ item.choice }}</span>
                        </div>
                    </div>
                  </OptionPopover>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="text-center py-10 opacity-50">
            <i-ph-confetti-bold class="text-4xl mb-2 mx-auto text-slate-300" />
            <p class="text-sm">太棒了！此处无核心冲突</p>
          </div>
        </div>
      </div>

      <div id="zone-resonance" class="scroll-mt-32 pb-16">
        <div class="animate-fade-in-up">
          <div 
            class="sticky top-16 z-20 bg-base-100/95 backdrop-blur-md py-4 mb-4 -mx-6 px-7 border-b border-base-content/5 flex items-center gap-2 text-success cursor-pointer hover:bg-base-100 transition-colors"
            @dblclick="scrollToTop"
          >
            <i-ph-handshake-bold class="text-2xl drop-shadow-sm" />
            <div>
              <h3 class="text-lg font-bold uppercase tracking-wider leading-none">Resonance</h3>
              <p class="text-xs opacity-60 font-bold mt-1">高度同频</p>
            </div>
          </div>
          
          <div v-if="groupsResonance.length > 0" class="flex flex-col gap-6">
             <div v-for="group in groupsResonance" :key="group.id" class="bg-base-100 border-l-4 border-success rounded-xl shadow-sm p-6 border-y border-r border-base-content/5">
                <h4 class="text-xs font-bold opacity-40 uppercase mb-4 tracking-widest text-success">{{ group.name }}</h4>
                <div class="flex flex-wrap gap-3">
                    <div v-for="item in group.items" :key="item.id">
                        <OptionPopover :question="item.originalQuestion" :selections="[{ avatar: myAvatar, index: item.myOptionIndex, attitude: item.myAttitude }, { avatar: partnerAvatar, index: item.partnerOptionIndex, attitude: item.partnerAttitude }]" :is-open="activePopoverId === item.id" @toggle="togglePopover(item.id)" @close="activePopoverId = null">
                             <div class="badge badge-lg h-auto py-2 px-3 gap-3 bg-success/5 border border-success/20 text-base-content/80 cursor-pointer hover:bg-success/10 transition-colors rounded-lg group">
                                <span class="text-xs opacity-60 border-r border-success/20 pr-2 mr-1">{{ item.title }}</span>
                                <div class="flex items-center gap-2 text-sm font-bold">
                                    <div class="flex items-center gap-1">
                                        <span class="text-xs">{{ myAvatar }}</span>
                                        <i-ph-star-fill v-if="item.myAttitude === 4" class="text-amber-400" />
                                        <i-ph-check-bold v-else-if="item.myAttitude === 3" class="text-success" />
                                        <i-ph-x-bold v-else-if="item.myAttitude === 1" class="text-error" />
                                        <i-ph-question-bold v-else-if="item.myAttitude === 2" class="text-warning" />
                                        <span v-else-if="item.myAttitude === 0" class="w-1.5 h-1.5 rounded-full bg-current opacity-40"></span>
                                    </div>
                                    <span class="text-success/40 text-xs font-normal">&</span>
                                    <div class="flex items-center gap-1">
                                        <span class="text-xs">{{ partnerAvatar }}</span>
                                        <i-ph-star-fill v-if="item.partnerAttitude === 4" class="text-amber-400" />
                                        <i-ph-check-bold v-else-if="item.partnerAttitude === 3" class="text-success" />
                                        <i-ph-x-bold v-else-if="item.partnerAttitude === 1" class="text-error" />
                                        <i-ph-question-bold v-else-if="item.partnerAttitude === 2" class="text-warning" />
                                        <span v-else-if="item.partnerAttitude === 0" class="w-1.5 h-1.5 rounded-full bg-current opacity-40"></span>
                                    </div>
                                    <span class="ml-1 opacity-90">{{ item.choice }}</span>
                                </div>
                             </div>
                        </OptionPopover>
                    </div>
                </div>
             </div>
          </div>

          <div v-else class="text-center py-10 opacity-50">
            <i-ph-magnifying-glass-bold class="text-4xl mb-2 mx-auto text-slate-300" />
            <p class="text-sm">暂未发现高度同频项</p>
          </div>
        </div>
      </div>

      <div id="zone-discuss" class="scroll-mt-32 pb-16">
        <div class="animate-fade-in-up">
          <div 
            class="sticky top-16 z-20 bg-base-100/95 backdrop-blur-md py-4 mb-4 -mx-6 px-7 border-b border-base-content/5 flex items-center gap-2 text-warning cursor-pointer hover:bg-base-100 transition-colors"
            @dblclick="scrollToTop"
          >
            <i-ph-chats-circle-bold class="text-2xl drop-shadow-sm" />
            <div>
              <h3 class="text-lg font-bold uppercase tracking-wider leading-none">To Discuss</h3>
              <p class="text-xs opacity-60 font-bold mt-1">需要沟通</p>
            </div>
          </div>
          
          <div v-if="groupsDiscuss.length > 0" class="flex flex-col gap-6">
             <div v-for="group in groupsDiscuss" :key="group.id" class="bg-base-100 border-l-4 border-warning rounded-xl shadow-sm p-6 border-y border-r border-base-content/5">
                <h4 class="text-xs font-bold opacity-40 uppercase mb-4 tracking-widest text-warning">{{ group.name }}</h4>
                <div class="flex flex-wrap gap-3">
                    <div v-for="item in group.items" :key="item.id">
                        <OptionPopover :question="item.originalQuestion" :selections="[{ avatar: myAvatar, index: item.myOptionIndex, attitude: item.myAttitude }, { avatar: partnerAvatar, index: item.partnerOptionIndex, attitude: item.partnerAttitude }]" :is-open="activePopoverId === item.id" @toggle="togglePopover(item.id)" @close="activePopoverId = null">
                             <div class="badge badge-lg h-auto py-2 px-3 gap-3 bg-warning/5 border border-warning/20 text-base-content/80 cursor-pointer hover:bg-warning/10 transition-colors rounded-lg group">
                                <span class="text-xs opacity-50 border-r border-warning/20 pr-2 mr-1 group-hover:border-warning/40 transition-colors">{{ item.title }}</span>
                                <div class="flex items-center gap-2 text-sm font-bold">
                                    <div class="flex items-center gap-1">
                                        <span class="text-xs">{{ myAvatar }}</span>
                                        <i-ph-question-bold v-if="item.myAttitude === 2" class="text-warning" />
                                        <i-ph-check-bold v-else-if="item.myAttitude === 3" class="text-success/70" />
                                        <i-ph-x-bold v-else-if="item.myAttitude === 1" class="text-error/70" />
                                        <i-ph-star-fill v-else-if="item.myAttitude === 4" class="text-amber-400/80" />
                                        <span v-else-if="item.myAttitude === 0" class="w-1.5 h-1.5 rounded-full bg-current opacity-40"></span>
                                    </div>
                                    <span class="text-warning/40 text-xs font-normal">?</span>
                                    <div class="flex items-center gap-1">
                                        <span class="text-xs">{{ partnerAvatar }}</span>
                                        <i-ph-question-bold v-if="item.partnerAttitude === 2" class="text-warning" />
                                        <i-ph-check-bold v-else-if="item.partnerAttitude === 3" class="text-success/70" />
                                        <i-ph-x-bold v-else-if="item.partnerAttitude === 1" class="text-error/70" />
                                        <i-ph-star-fill v-else-if="item.partnerAttitude === 4" class="text-amber-400/80" />
                                        <span v-else-if="item.partnerAttitude === 0" class="w-1.5 h-1.5 rounded-full bg-current opacity-40"></span>
                                    </div>
                                    <span class="ml-1 opacity-90">{{ item.choice }}</span>
                                </div>
                             </div>
                        </OptionPopover>
                    </div>
                </div>
             </div>
          </div>

          <div v-else class="text-center py-10 opacity-50">
            <i-ph-check-circle-bold class="text-4xl mb-2 mx-auto text-slate-300" />
            <p class="text-sm">无需要沟通项</p>
          </div>
        </div>
      </div>

      <div id="zone-negotiate" class="scroll-mt-32 pb-16">
        <div class="animate-fade-in-up">
          <div 
            class="sticky top-16 z-20 bg-base-100/95 backdrop-blur-md py-4 mb-4 -mx-6 px-7 border-b border-base-content/5 flex items-center gap-2 text-base-content/60 cursor-pointer hover:bg-base-100 transition-colors"
            @dblclick="scrollToTop"
          >
            <i-ph-arrows-left-right-bold class="text-2xl" />
            <div>
              <h3 class="text-lg font-bold uppercase tracking-wider leading-none">Negotiate</h3>
              <p class="text-xs opacity-60 font-bold mt-1">协商让步</p>
            </div>
          </div>
          
          <div v-if="groupsNegotiate.length > 0" class="flex flex-col gap-6">
             <div v-for="group in groupsNegotiate" :key="group.id" class="bg-base-100 border-l-4 rounded-xl shadow-sm p-6 border-y border-r border-base-content/5">
                <h4 class="text-xs font-bold opacity-30 uppercase mb-4 tracking-widest">{{ group.name }}</h4>
                <div class="flex flex-wrap gap-3">
                    <div v-for="item in group.items" :key="item.id">
                        <OptionPopover :question="item.originalQuestion" :selections="[{ avatar: myAvatar, index: item.myOptionIndex, attitude: item.myAttitude }, { avatar: partnerAvatar, index: item.partnerOptionIndex, attitude: item.partnerAttitude }]" :is-open="activePopoverId === item.id" @toggle="togglePopover(item.id)" @close="activePopoverId = null">
                             <div class="badge badge-lg badge-ghost h-auto py-2 px-3 gap-3 bg-base-200/50 border border-base-content/10 text-base-content/60 cursor-pointer hover:bg-base-200 transition-colors rounded-lg group">
                                <span class="text-xs opacity-50 border-r border-base-content/10 pr-2 mr-1 group-hover:border-base-content/20 transition-colors">{{ item.title }}</span>
                                <div class="flex items-center gap-2 text-sm font-bold">
                                    <div class="flex items-center gap-1">
                                        <span class="text-xs">{{ myAvatar }}</span>
                                        <i-ph-check-bold v-if="item.myAttitude === 3" class="text-success" />
                                        <i-ph-x-bold v-else-if="item.myAttitude === 1" class="text-error" />
                                        <i-ph-question-bold v-else-if="item.myAttitude === 2" class="text-warning" />
                                        <i-ph-star-fill v-else-if="item.myAttitude === 4" class="text-amber-400" />
                                        <span v-else-if="item.myAttitude === 0" class="w-1.5 h-1.5 rounded-full bg-current opacity-40"></span>
                                    </div>
                                    <span class="opacity-30 text-xs font-normal">/</span>
                                    <div class="flex items-center gap-1">
                                        <span class="text-xs">{{ partnerAvatar }}</span>
                                        <i-ph-check-bold v-if="item.partnerAttitude === 3" class="text-success" />
                                        <i-ph-x-bold v-else-if="item.partnerAttitude === 1" class="text-error" />
                                        <i-ph-question-bold v-else-if="item.partnerAttitude === 2" class="text-warning" />
                                        <i-ph-star-fill v-else-if="item.partnerAttitude === 4" class="text-amber-400" />
                                        <span v-else-if="item.partnerAttitude === 0" class="w-1.5 h-1.5 rounded-full bg-current opacity-40"></span>
                                    </div>
                                    <span class="ml-1 opacity-90">{{ item.choice }}</span>
                                </div>
                             </div>
                        </OptionPopover>
                    </div>
                </div>
             </div>
          </div>

          <div v-else class="text-center py-10 opacity-50">
            <i-ph-check-circle-bold class="text-4xl mb-2 mx-auto text-slate-300" />
            <p class="text-sm">无协商让步项</p>
          </div>
        </div>
      </div>

    </div>

    <div class="mt-16 text-center border-t border-base-content/5 pt-8">
      <button @click="router.push('/')" class="btn btn-ghost btn-sm opacity-60 hover:opacity-100">
        返回首页
      </button>
    </div>

    <AIAnalysisModal 
      v-model="showAIModal" 
      :code-a="route.query.my as string" 
      :code-b="route.query.partner as string"
    />




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

.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

.animate-flash { animation: flashHighlight 1s ease-out; }
@keyframes flashHighlight {
  0%, 100% { background-color: transparent; }
  20%, 50% { background-color: rgba(var(--p), 0.1); } 
}
</style>