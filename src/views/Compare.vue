<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { decode } from '../logic/codec';
import questionsData from '../data/questions.json';
import type { Attitude, Module } from '../types';

const route = useRoute();
const router = useRouter();

// --- 类型定义 ---
interface CompareItem {
  id: string;
  title: string;
  choice: string;       // 选项文字
  moduleId: string;
  moduleName: string;
  myAttitude: Attitude;
  partnerAttitude: Attitude;
}

interface ModuleGroup {
  id: string;
  name: string;
  items: CompareItem[];
}

// --- 状态 ---
const allModules = questionsData.modules as Module[];
const selectedModuleIds = ref<string[]>(allModules.map(m => m.id)); // 默认全选

// 四个区域的原始数据
const listResonance = ref<CompareItem[]>([]); // ✨
const listCritical = ref<CompareItem[]>([]);  // ⚡
const listDiscuss = ref<CompareItem[]>([]);   // 💬
const listNegotiate = ref<CompareItem[]>([]); // 🤝

// --- 辅助：图标映射 ---
function getIcon(att: Attitude) {
  switch (att) {
    case 4: return '⭐';
    case 3: return '👌';
    case 2: return '❔';
    case 1: return '⛔';
    default: return '⚪';
  }
}

// --- 核心逻辑：按模块分组 + 过滤 ---
function groupAndFilter(items: CompareItem[]): ModuleGroup[] {
  // 1. 过滤：只保留用户选中的模块
  const filtered = items.filter(i => selectedModuleIds.value.includes(i.moduleId));
  
  // 2. 分组
  const map = new Map<string, ModuleGroup>();
  filtered.forEach(item => {
    if (!map.has(item.moduleId)) {
      map.set(item.moduleId, {
        id: item.moduleId,
        name: item.moduleName,
        items: []
      });
    }
    map.get(item.moduleId)!.items.push(item);
  });
  
  return Array.from(map.values());
}

// 计算属性：给模板渲染用
const groupsResonance = computed(() => groupAndFilter(listResonance.value));
const groupsCritical = computed(() => groupAndFilter(listCritical.value));
const groupsDiscuss = computed(() => groupAndFilter(listDiscuss.value));
const groupsNegotiate = computed(() => groupAndFilter(listNegotiate.value));

// --- 分析算法 ---
function analyze(myMap: Record<string, Attitude[]>, partnerMap: Record<string, Attitude[]>) {
  const rList: CompareItem[] = [];
  const cList: CompareItem[] = [];
  const dList: CompareItem[] = [];
  const nList: CompareItem[] = [];

  questionsData.modules.forEach(m => {
    m.questions.forEach(q => {
      const myStates = myMap[q.id];
      const partnerStates = partnerMap[q.id];
      if (!myStates || !partnerStates) return;

      q.options.forEach((optText, index) => {
        const a = (myStates[index] || 0) as Attitude;
        const b = (partnerStates[index] || 0) as Attitude;

        // 双方都未做(0)，或者一方未做，暂时跳过对比 (交集逻辑)
        if (a === 0 || b === 0) return;

        const item: CompareItem = {
          id: q.id + '_' + index,
          title: q.title,
          choice: optText,
          moduleId: m.id,
          moduleName: m.name.replace(/📦 |⚛️ /g, ''),
          myAttitude: a,
          partnerAttitude: b
        };

        // --- 重新定义的四区逻辑 ---

        // 3. 💬 深度探索区 (To Be Discussed)
        // 任何一方是 2 (犹豫)
        if (a === 2 || b === 2) {
          dList.push(item);
        }
        // 2. ⚡ 核心关注区 (Critical Focus)
        // (4 vs 1) 或 (1 vs 4)
        else if ((a === 4 && b === 1) || (a === 1 && b === 4)) {
          cList.push(item);
        }
        // 1. ✨ 默契共振区 (Resonance)
        // (4+4), (4+3), (3+4), (3+3), (1+1)
        else if ((a >= 3 && b >= 3) || (a === 1 && b === 1)) {
          rList.push(item);
        }
        // 4. 🤝 协商让步区 (Negotiation)
        // 剩下的情况：(3 vs 1) 或 (1 vs 3)
        else {
          nList.push(item);
        }
      });
    });
  });

  listResonance.value = rList;
  listCritical.value = cList;
  listDiscuss.value = dList;
  listNegotiate.value = nList;
}

// 切换筛选
function toggleFilter(modId: string) {
  if (selectedModuleIds.value.includes(modId)) {
    // 如果只剩一个，就不让取消了(防止空屏)
    if (selectedModuleIds.value.length > 1) {
      selectedModuleIds.value = selectedModuleIds.value.filter(id => id !== modId);
    }
  } else {
    selectedModuleIds.value.push(modId);
  }
}

// 全选/反选
function toggleAllFilters() {
  if (selectedModuleIds.value.length === allModules.length) {
    selectedModuleIds.value = ['core']; // 留一个核心
  } else {
    selectedModuleIds.value = allModules.map(m => m.id);
  }
}

onMounted(() => {
  const myCode = route.query.my as string;
  const partnerCode = route.query.partner as string;

  if (myCode && partnerCode) {
    try {
      // 这里的 decode 已经适配了新算法，返回 Record<string, number[]>
      // 我们断言为 Attitude[]
      const myAnswers = decode(myCode) as Record<string, Attitude[]>;
      const partnerAnswers = decode(partnerCode) as Record<string, Attitude[]>;
      analyze(myAnswers, partnerAnswers);
    } catch (e) {
      console.error('对比解码失败', e);
    }
  }
});
</script>

<template>
  <div class="pb-24 pt-4 px-2 max-w-md mx-auto min-h-screen flex flex-col">
    
    <div class="sticky top-0 z-30 bg-base-100/95 backdrop-blur border-b border-base-content/5 pb-2 pt-2 -mx-2 px-2 mb-6">
      <div class="flex items-center justify-between mb-2 px-1">
        <h2 class="font-bold text-sm opacity-60">筛选题包</h2>
        <button @click="toggleAllFilters" class="btn btn-xs btn-ghost text-[10px]">
          {{ selectedModuleIds.length === allModules.length ? '取消全选' : '全选' }}
        </button>
      </div>
      <div class="flex overflow-x-auto gap-2 pb-1 no-scrollbar">
        <button 
          v-for="mod in allModules" 
          :key="mod.id"
          @click="toggleFilter(mod.id)"
          class="btn btn-xs whitespace-nowrap transition-all"
          :class="selectedModuleIds.includes(mod.id) ? 'btn-neutral' : 'btn-ghost opacity-50'"
        >
          {{ mod.name.replace(/📦 |⚛️ /g, '') }}
        </button>
      </div>
    </div>

    <div class="text-center mb-8">
      <div class="text-4xl mb-2 animate-bounce">⚖️</div>
      <h2 class="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
        关系对照表
      </h2>
      <p class="text-xs opacity-50 mt-1">
        不打分，只呈现。看见差异是理解的开始。
      </p>
    </div>

    <div v-if="groupsResonance.length > 0" class="mb-8 animate-fade-in-up">
      <div class="flex items-center gap-2 mb-4 text-success font-bold text-lg uppercase tracking-wider border-b-2 border-success/20 pb-1">
        <span>✨</span> 默契共振
      </div>
      
      <div class="flex flex-col gap-4">
        <div v-for="group in groupsResonance" :key="group.id" class="card bg-success/5 border border-success/20 shadow-sm">
          <div class="card-body p-3">
            <h3 class="text-xs font-bold opacity-60 text-success mb-2 uppercase">{{ group.name }}</h3>
            <div class="flex flex-wrap gap-2">
              <div 
                v-for="item in group.items" 
                :key="item.id"
                class="badge badge-outline badge-success h-auto py-1.5 px-3 gap-2 bg-base-100/50"
              >
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

    <div v-if="groupsCritical.length > 0" class="mb-8 animate-fade-in-up" style="animation-delay: 0.1s">
      <div class="flex items-center gap-2 mb-4 text-warning font-bold text-lg uppercase tracking-wider border-b-2 border-warning/20 pb-1">
        <span>⚡</span> 核心关注
      </div>
      
      <div class="flex flex-col gap-4">
        <div v-for="group in groupsCritical" :key="group.id" class="card bg-warning text-warning-content shadow-lg">
          <div class="card-body p-4">
            <h3 class="text-xs font-bold opacity-80 mb-2 border-b border-black/10 pb-1">{{ group.name }}</h3>
            <div class="flex flex-col gap-2">
              <div 
                v-for="item in group.items" 
                :key="item.id"
                class="bg-white/20 p-2 rounded-lg flex items-center justify-between"
              >
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

    <div v-if="groupsDiscuss.length > 0" class="mb-8 animate-fade-in-up" style="animation-delay: 0.2s">
      <div class="flex items-center gap-2 mb-4 text-info font-bold text-lg uppercase tracking-wider border-b-2 border-info/20 pb-1">
        <span>💬</span> 待厘清 / 需要沟通
      </div>
      
      <div class="flex flex-col gap-4">
        <div v-for="group in groupsDiscuss" :key="group.id" class="card bg-base-200 border border-base-300">
          <div class="card-body p-3">
            <h3 class="text-xs font-bold opacity-50 mb-2">{{ group.name }}</h3>
            <div class="flex flex-wrap gap-2">
              <div 
                v-for="item in group.items" 
                :key="item.id"
                class="badge badge-ghost h-auto py-1.5 px-3 gap-2 border border-base-content/10"
              >
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

    <div v-if="groupsNegotiate.length > 0" class="mb-8 animate-fade-in-up" style="animation-delay: 0.3s">
      <div class="flex items-center gap-2 mb-4 text-base-content/60 font-bold text-lg uppercase tracking-wider border-b-2 border-base-content/10 pb-1">
        <span>🤝</span> 协商让步
      </div>
      
      <div class="flex flex-col gap-4">
        <div v-for="group in groupsNegotiate" :key="group.id" class="card bg-base-100 border-2 border-base-200">
          <div class="card-body p-3">
            <h3 class="text-xs font-bold opacity-40 mb-2">{{ group.name }}</h3>
            <div class="flex flex-wrap gap-2">
              <div 
                v-for="item in group.items" 
                :key="item.id"
                class="badge badge-outline opacity-70 h-auto py-1.5 px-3 gap-2"
              >
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

    <div class="mt-8 text-center pb-8">
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
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none; 
  scrollbar-width: none; 
}
</style>