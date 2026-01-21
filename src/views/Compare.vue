<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { decode } from '../logic/codec';
import questionsData from '../data/questions.json';
import type { Attitude, Module } from '../types';
import CompareDashboard from '../components/CompareDashboard.vue'; 
import OptionPopover from '../components/OptionPopover.vue';

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

const myAvatar = ref('😎');
const partnerAvatar = ref('😎');

// Popover 状态
const activePopoverId = ref<string | null>(null);
function togglePopover(id: string) {
  activePopoverId.value = activePopoverId.value === id ? null : id;
}

const hasData = computed(() => {
  return listResonance.value.length + listCritical.value.length + listDiscuss.value.length + listNegotiate.value.length > 0;
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
function analyze(myMap: Record<string, Attitude[]>, partnerMap: Record<string, Attitude[]>) {
  const nList: CompareItem[] = [], hList: CompareItem[] = [], rList: CompareItem[] = [], dList: CompareItem[] = [];
  
  allModules.forEach(m => {
    const cleanModuleName = m.name.replace(/^(模块\s*[A-J][：:]\s*)/, '').replace(/📦 |⚛️ /g, '');

    m.questions.forEach(q => {
      const myStates = myMap[q.id]; 
      const partnerStates = partnerMap[q.id];
      
      if (!myStates || !partnerStates) return;
      
      q.options.forEach((opt, index) => {
        const a = (myStates[index] || 0) as Attitude;
        const b = (partnerStates[index] || 0) as Attitude;
        
        if (a === 0 || b === 0) return;

        const choiceText = typeof opt === 'string' ? opt : (opt?.short || '未知选项');

        const item: CompareItem = {
          id: q.id + '_' + index, 
          title: q.title_short || q.title, 
          choice: choiceText,             
          moduleId: m.id, 
          moduleName: cleanModuleName,
          myAttitude: a, 
          partnerAttitude: b,
          originalQuestion: q, 
          myOptionIndex: index, 
          partnerOptionIndex: index
        };

        // 逻辑分类
        if (a === 2 || b === 2) dList.push(item); // 任意一方是"?" -> 待厘清
        else if ((a === 4 && b === 1) || (a === 1 && b === 4)) nList.push(item); // 金星撞红线 -> 核心冲突
        else if ((a >= 3 && b >= 3) || (a === 1 && b === 1)) rList.push(item); // 都是接受或都是拒绝 -> 共振
        else hList.push(item); // 其他 -> 协商
      });
    });
  });

  listResonance.value = rList;
  listCritical.value = nList;
  listDiscuss.value = dList;
  listNegotiate.value = hList;
}

// 筛选控制
function toggleFilter(modId: string) {
  if (selectedModuleIds.value.includes(modId)) {
    if (selectedModuleIds.value.length > 1) selectedModuleIds.value = selectedModuleIds.value.filter(id => id !== modId);
  } else selectedModuleIds.value.push(modId);
}
function toggleAllFilters() {
  selectedModuleIds.value.length === allModules.length ? selectedModuleIds.value = ['A'] : selectedModuleIds.value = allModules.map(m => m.id);
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
    
    <div class="sticky top-4 z-40 mb-8">
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
          关系对照协议
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
        />
      </div>
    </div>

    <div class="flex flex-col gap-10">

      <div id="zone-critical" class="scroll-mt-32">
        <div v-if="groupsCritical.length > 0" class="animate-fade-in-up">
          <div class="flex items-center gap-2 mb-4 px-1 text-error">
            <i-ph-sword-bold class="text-2xl drop-shadow-sm" />
            <div>
              <h3 class="text-lg font-bold uppercase tracking-wider leading-none">Critical Conflict</h3>
              <p class="text-xs opacity-60 font-bold mt-1">核心关注 / 态度截然相反</p>
            </div>
          </div>
          
          <div class="flex flex-col gap-6">
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
                      <span class="text-xs font-bold opacity-70 border-r border-error/20 pr-3 mr-1 group-hover:border-error/40 transition-colors">
                        {{ item.title }}
                      </span>
                      
                      <div class="flex items-center gap-2 text-sm font-bold">
                        <div class="flex items-center gap-1" title="我方态度">
                          <i-ph-star-fill v-if="item.myAttitude === 4" class="text-amber-400 drop-shadow-sm" />
                          <i-ph-x-bold v-else-if="item.myAttitude === 1" class="text-error" />
                          <span class="text-xs">{{ myAvatar }}</span>
                        </div>

                        <i-ph-lightning-fill class="text-xs text-error opacity-40 mx-0.5" />

                        <div class="flex items-center gap-1" title="对方态度">
                          <span class="text-xs">{{ partnerAvatar }}</span>
                          <i-ph-star-fill v-if="item.partnerAttitude === 4" class="text-amber-400 drop-shadow-sm" />
                          <i-ph-x-bold v-else-if="item.partnerAttitude === 1" class="text-error" />
                        </div>
                      </div>
                    </div>
                  </OptionPopover>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-8 opacity-30 border-2 border-dashed border-base-content/10 rounded-xl">
          <i-ph-check-bold class="text-3xl mx-auto mb-2 text-success" />
          <p class="text-xs font-bold">完美！无核心冲突</p>
        </div>
      </div>

      <div id="zone-resonance" class="scroll-mt-32">
        <div v-if="groupsResonance.length > 0" class="animate-fade-in-up">
          <div class="flex items-center gap-2 mb-4 px-1 text-success">
            <i-ph-handshake-bold class="text-2xl drop-shadow-sm" />
            <div>
              <h3 class="text-lg font-bold uppercase tracking-wider leading-none">Resonance</h3>
              <p class="text-xs opacity-60 font-bold mt-1">默契共振 / 双方高度一致</p>
            </div>
          </div>
          
          <div class="flex flex-col gap-6">
            <div 
              v-for="group in groupsResonance" 
              :key="group.id" 
              class="bg-base-100 border-l-4 border-success rounded-xl shadow-sm p-6 border-y border-r border-base-content/5"
            >
              <h4 class="text-xs font-bold opacity-40 uppercase mb-4 tracking-widest text-success">{{ group.name }}</h4>
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
                    <div class="badge badge-lg h-auto py-2 px-3 gap-2 bg-success/5 border border-success/20 text-base-content/80 cursor-pointer hover:bg-success/10 transition-colors rounded-lg">
                      <span class="text-xs opacity-60 border-r border-success/20 pr-2 mr-1">
                        {{ item.title }}
                      </span>
                      
                      <div class="flex items-center gap-1.5 font-bold">
                        <i-ph-check-bold v-if="item.myAttitude === 3" class="text-success" />
                        <i-ph-star-fill v-else-if="item.myAttitude === 4" class="text-amber-400" />
                        <i-ph-x-bold v-else-if="item.myAttitude === 1" class="text-error" />
                        
                        <span class="text-sm">{{ item.choice }}</span>
                        
                        <div class="flex -space-x-1 ml-1 opacity-70 scale-90">
                          <span>{{ myAvatar }}</span>
                          <span>{{ partnerAvatar }}</span>
                        </div>
                      </div>
                    </div>
                  </OptionPopover>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div id="zone-discuss" class="scroll-mt-32">
        <div v-if="groupsDiscuss.length > 0" class="animate-fade-in-up">
          <div class="flex items-center gap-2 mb-4 px-1 text-warning">
            <i-ph-chats-circle-bold class="text-2xl drop-shadow-sm" />
            <div>
              <h3 class="text-lg font-bold uppercase tracking-wider leading-none">To Discuss</h3>
              <p class="text-xs opacity-60 font-bold mt-1">待厘清 / 需要进一步沟通</p>
            </div>
          </div>
          
          <div class="flex flex-col gap-6">
            <div 
              v-for="group in groupsDiscuss" 
              :key="group.id" 
              class="bg-base-100 border-l-4 border-warning rounded-xl shadow-sm p-6 border-y border-r border-base-content/5"
            >
              <h4 class="text-xs font-bold opacity-40 uppercase mb-4 tracking-widest text-warning">{{ group.name }}</h4>
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
                    <div class="badge badge-lg h-auto py-2 px-3 gap-2 bg-warning/5 border border-warning/20 text-base-content/80 cursor-pointer hover:bg-warning/10 transition-colors rounded-lg">
                      <span class="text-xs opacity-50 border-r border-warning/20 pr-2 mr-1">
                        {{ item.title }}
                      </span>
                      
                      <div class="flex items-center gap-2">
                        <div class="flex items-center gap-1">
                          <span v-if="item.myAttitude === 2">{{ myAvatar }}</span>
                          <span v-if="item.partnerAttitude === 2">{{ partnerAvatar }}</span>
                          <i-ph-question-bold class="text-warning text-sm" />
                        </div>
                        <span class="font-medium text-sm">{{ item.choice }}</span>
                      </div>
                    </div>
                  </OptionPopover>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div id="zone-negotiate" class="scroll-mt-32">
        <div v-if="groupsNegotiate.length > 0" class="animate-fade-in-up">
          <div class="flex items-center gap-2 mb-4 px-1 text-base-content/60">
            <i-ph-arrows-left-right-bold class="text-2xl" />
            <div>
              <h3 class="text-lg font-bold uppercase tracking-wider leading-none">Negotiate</h3>
              <p class="text-xs opacity-60 font-bold mt-1">协商让步 / 寻找中间地带</p>
            </div>
          </div>
          
          <div class="flex flex-col gap-6">
            <div 
              v-for="group in groupsNegotiate" 
              :key="group.id" 
              class="bg-base-100 border-l-4 border-base-content/20 rounded-xl shadow-sm p-6 border-y border-r border-base-content/5"
            >
              <h4 class="text-xs font-bold opacity-30 uppercase mb-4 tracking-widest">{{ group.name }}</h4>
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
                    <div class="badge badge-lg badge-ghost h-auto py-2 px-3 gap-2 bg-base-200/50 border border-base-content/5 text-base-content/60 cursor-pointer hover:bg-base-200 transition-colors rounded-lg">
                      <span class="text-xs opacity-50 border-r border-base-content/10 pr-2 mr-1">
                        {{ item.title }}
                      </span>
                      <div class="flex items-center gap-1 text-sm">
                        <span class="text-xs">{{ myAvatar }}</span>
                        <span class="text-xs">/</span>
                        <span class="text-xs">{{ partnerAvatar }}</span>
                        <span class="font-medium ml-1">{{ item.choice }}</span>
                      </div>
                    </div>
                  </OptionPopover>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>

    <div class="mt-16 text-center border-t border-base-content/5 pt-8">
      <button @click="router.push('/')" class="btn btn-ghost btn-sm opacity-60 hover:opacity-100">
        返回首页
      </button>
    </div>

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