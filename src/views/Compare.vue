<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from 'vue'; // 引入 nextTick
import { useRoute, useRouter } from 'vue-router';
import { decode } from '../logic/codec';
import questionsData from '../data/questions.json';
import type { Attitude, Module } from '../types';
import CompareDashboard from '../components/CompareDashboard.vue'; // 引入新组件

const route = useRoute();
const router = useRouter();

// ... (Interface 定义保持不变，略) ...
interface CompareItem {
  id: string; title: string; choice: string; moduleId: string; moduleName: string;
  myAttitude: Attitude; partnerAttitude: Attitude;
}
interface ModuleGroup {
  id: string; name: string; items: CompareItem[];
}

const allModules = questionsData.modules as Module[];
const selectedModuleIds = ref<string[]>(allModules.map(m => m.id));

const listResonance = ref<CompareItem[]>([]); 
const listCritical = ref<CompareItem[]>([]);  
const listDiscuss = ref<CompareItem[]>([]);   
const listNegotiate = ref<CompareItem[]>([]); 

// --- 辅助逻辑保持不变 ---
function getIcon(att: Attitude) {
  switch (att) {
    case 4: return '⭐'; case 3: return '👌'; case 2: return '❔'; case 1: return '⛔';
    default: return '⚪';
  }
}
function getAttitudeMeta(att: Attitude) {
  switch (att) {
    case 4: return { icon: '⭐', color: 'text-accent', bg: 'bg-accent/10', label: '核心' };
    case 3: return { icon: '👌', color: 'text-success', bg: 'bg-success/10', label: '同意' };
    case 2: return { icon: '❔', color: 'text-warning', bg: 'bg-warning/10', label: '犹豫' };
    case 1: return { icon: '⛔', color: 'text-error', bg: 'bg-error/10', label: '拒绝' };
    default: return { icon: '⚪', color: 'opacity-30', bg: 'bg-base-200', label: '跳过' };
  }
}
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

// --- 滚动跳转逻辑 ---
function scrollToZone(elementId: string) {
  const el = document.getElementById(elementId);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // 加一个高亮闪烁效果
    el.classList.add('animate-flash');
    setTimeout(() => el.classList.remove('animate-flash'), 1000);
  }
}

// --- 分析算法保持不变 ---
function analyze(myMap: Record<string, Attitude[]>, partnerMap: Record<string, Attitude[]>) {
  // ... (算法逻辑与上一版完全一致，直接复用即可) ...
  // 为节省篇幅，这里简写，请确保你保留了完整的 analyze 函数逻辑
  const nList: CompareItem[] = [], hList: CompareItem[] = [], rList: CompareItem[] = [], dList: CompareItem[] = [];
  questionsData.modules.forEach(m => {
    m.questions.forEach(q => {
      const myStates = myMap[q.id]; const partnerStates = partnerMap[q.id];
      if (!myStates || !partnerStates) return;
      q.options.forEach((optText, index) => {
        const a = (myStates[index] || 0) as Attitude;
        const b = (partnerStates[index] || 0) as Attitude;
        if (a === 0 || b === 0) return;
        const item: CompareItem = {
          id: q.id + '_' + index, title: q.title, choice: optText,
          moduleId: m.id, moduleName: m.name.replace(/📦 |⚛️ /g, ''),
          myAttitude: a, partnerAttitude: b
        };
        // 4区逻辑
        if (a === 2 || b === 2) dList.push(item); // 💬 深度探索 (犹豫)
        else if ((a === 4 && b === 1) || (a === 1 && b === 4)) nList.push(item); // ⚡ 核心关注 (冲突)
        else if ((a >= 3 && b >= 3) || (a === 1 && b === 1)) rList.push(item); // ✨ 共振
        else hList.push(item); // 🤝 协商
      });
    });
  });
  listResonance.value = rList;
  listCritical.value = nList;
  listDiscuss.value = dList;
  listNegotiate.value = hList;
}

// 筛选逻辑保持不变...
function toggleFilter(modId: string) {
  if (selectedModuleIds.value.includes(modId)) {
    if (selectedModuleIds.value.length > 1) selectedModuleIds.value = selectedModuleIds.value.filter(id => id !== modId);
  } else selectedModuleIds.value.push(modId);
}
function toggleAllFilters() {
  selectedModuleIds.value.length === allModules.length ? selectedModuleIds.value = ['core'] : selectedModuleIds.value = allModules.map(m => m.id);
}

onMounted(() => {
  const myCode = route.query.my as string;
  const partnerCode = route.query.partner as string;
  if (myCode && partnerCode) {
    try {
      const myAnswers = decode(myCode) as Record<string, Attitude[]>;
      const partnerAnswers = decode(partnerCode) as Record<string, Attitude[]>;
      analyze(myAnswers, partnerAnswers);
    } catch (e) { console.error(e); }
  }
});
</script>

<template>
  <div class="pb-24 pt-4 min-h-screen flex flex-col">
    
    <div class="sticky top-0 z-30 bg-base-100/95 backdrop-blur border-b border-base-content/5 pb-2 pt-2 mb-6">
      <div class="container mx-auto px-4">
        <div class="flex items-center justify-between mb-2">
          <h2 class="font-bold text-sm opacity-60">筛选视图</h2>
          <button @click="toggleAllFilters" class="btn btn-xs btn-ghost text-[10px]">
            {{ selectedModuleIds.length === allModules.length ? '取消全选' : '全选' }}
          </button>
        </div>
        <div class="flex overflow-x-auto gap-2 pb-1 no-scrollbar">
          <button 
            v-for="mod in allModules" :key="mod.id" @click="toggleFilter(mod.id)"
            class="btn btn-xs whitespace-nowrap transition-all"
            :class="selectedModuleIds.includes(mod.id) ? 'btn-neutral' : 'btn-ghost opacity-50'"
          >
            {{ mod.name.replace(/📦 |⚛️ /g, '') }}
          </button>
        </div>
      </div>
    </div>

    <div class="container mx-auto px-4 max-w-5xl">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10 items-center">
        <div class="text-center md:text-left">
          <div class="text-4xl mb-2 animate-bounce inline-block">⚖️</div>
          <h2 class="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent mb-2">
            关系对照表
          </h2>
          <p class="text-sm opacity-60 max-w-md mx-auto md:mx-0">
            通过下方的环形图，快速定位你们关系中的“舒适区”与“挑战区”。点击扇区即可跳转。
          </p>
        </div>
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

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        <div id="zone-critical" class="scroll-mt-24">
          <div v-if="groupsCritical.length > 0" class="animate-fade-in-up">
            <div class="flex items-center gap-2 mb-4 text-warning font-bold text-lg uppercase tracking-wider border-b-2 border-warning/20 pb-1">
              <span>⚡</span> 核心关注
            </div>
            <div class="flex flex-col gap-4">
              <div v-for="group in groupsCritical" :key="group.id" class="card bg-warning text-warning-content shadow-lg">
                <div class="card-body p-4">
                  <h3 class="text-xs font-bold opacity-80 mb-2 border-b border-black/10 pb-1">{{ group.name }}</h3>
                  <div class="flex flex-col gap-2">
                    <div v-for="item in group.items" :key="item.id" class="bg-white/20 p-2 rounded-lg flex items-center justify-between">
                      <div class="flex-1 mr-2">
                        <div class="text-[10px] opacity-60">{{ item.title }}</div>
                        <div class="font-bold text-sm">{{ item.choice }}</div>
                      </div>
                      <div class="flex items-center gap-2 bg-black/10 px-2 py-1 rounded">
                        <span class="text-lg">{{ getIcon(item.myAttitude) }}</span>
                        <span class="text-xs font-bold opacity-50">vs</span>
                        <span class="text-lg">{{ getIcon(item.partnerAttitude) }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div id="zone-resonance" class="scroll-mt-24">
          <div v-if="groupsResonance.length > 0" class="animate-fade-in-up">
            <div class="flex items-center gap-2 mb-4 text-success font-bold text-lg uppercase tracking-wider border-b-2 border-success/20 pb-1">
              <span>✨</span> 默契共振
            </div>
            <div class="flex flex-col gap-4">
              <div v-for="group in groupsResonance" :key="group.id" class="card bg-success/5 border border-success/20 shadow-sm">
                <div class="card-body p-3">
                  <h3 class="text-xs font-bold opacity-60 text-success mb-2 uppercase">{{ group.name }}</h3>
                  <div class="flex flex-wrap gap-2">
                    <div v-for="item in group.items" :key="item.id" class="badge badge-outline badge-success h-auto py-1.5 px-3 gap-2 bg-base-100/50">
                      <div class="flex flex-col text-left border-r border-success/20 pr-2 mr-1">
                        <span class="text-[10px] opacity-60 leading-tight">{{ item.title }}</span>
                        <span class="font-bold text-xs">{{ item.choice }}</span>
                      </div>
                      <div class="flex items-center gap-1 text-sm">
                        <span>{{ getIcon(item.myAttitude) }}</span>
                        <span class="opacity-30 text-[10px]">=</span>
                        <span>{{ getIcon(item.partnerAttitude) }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div id="zone-discuss" class="scroll-mt-24">
          <div v-if="groupsDiscuss.length > 0" class="animate-fade-in-up">
            <div class="flex items-center gap-2 mb-4 text-info font-bold text-lg uppercase tracking-wider border-b-2 border-info/20 pb-1">
              <span>💬</span> 待厘清 / 需要沟通
            </div>
            <div class="flex flex-col gap-4">
              <div v-for="group in groupsDiscuss" :key="group.id" class="card bg-base-200 border border-base-300">
                <div class="card-body p-3">
                  <h3 class="text-xs font-bold opacity-50 mb-2">{{ group.name }}</h3>
                  <div class="flex flex-wrap gap-2">
                    <div v-for="item in group.items" :key="item.id" class="badge badge-ghost h-auto py-1.5 px-3 gap-2 border border-base-content/10">
                      <div class="flex flex-col text-left border-r border-base-content/10 pr-2 mr-1">
                        <span class="text-[10px] opacity-50 leading-tight">{{ item.title }}</span>
                        <span class="font-bold text-xs">{{ item.choice }}</span>
                      </div>
                      <div class="flex items-center gap-1 text-sm grayscale opacity-80">
                        <span>{{ getIcon(item.myAttitude) }}</span>
                        <span class="opacity-30 text-[10px]">?</span>
                        <span>{{ getIcon(item.partnerAttitude) }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div id="zone-negotiate" class="scroll-mt-24">
          <div v-if="groupsNegotiate.length > 0" class="animate-fade-in-up">
            <div class="flex items-center gap-2 mb-4 text-base-content/60 font-bold text-lg uppercase tracking-wider border-b-2 border-base-content/10 pb-1">
              <span>🤝</span> 协商让步
            </div>
            <div class="flex flex-col gap-4">
              <div v-for="group in groupsNegotiate" :key="group.id" class="card bg-base-100 border-2 border-base-200">
                <div class="card-body p-3">
                  <h3 class="text-xs font-bold opacity-40 mb-2">{{ group.name }}</h3>
                  <div class="flex flex-wrap gap-2">
                    <div v-for="item in group.items" :key="item.id" class="badge badge-outline opacity-70 h-auto py-1.5 px-3 gap-2">
                      <div class="flex flex-col text-left border-r border-base-content/10 pr-2 mr-1">
                        <span class="text-[10px] opacity-50 leading-tight">{{ item.title }}</span>
                        <span class="font-bold text-xs">{{ item.choice }}</span>
                      </div>
                      <div class="flex items-center gap-1 text-sm">
                        <span>{{ getIcon(item.myAttitude) }}</span>
                        <span class="opacity-30 text-[10px]">/</span>
                        <span>{{ getIcon(item.partnerAttitude) }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div> </div>

    <div class="mt-12 text-center pb-8">
      <button @click="router.push('/')" class="btn btn-ghost">返回首页</button>
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

/* 闪烁高亮动画 */
.animate-flash {
  animation: flashHighlight 1s ease-out;
}
@keyframes flashHighlight {
  0%, 100% { background-color: transparent; }
  20%, 50% { background-color: rgba(255, 255, 255, 0.1); }
}
</style>