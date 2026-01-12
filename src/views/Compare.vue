<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { decode } from '../logic/codec';
import questionsData from '../data/questions.json';
import type { Attitude } from '../types';

const route = useRoute();
const router = useRouter();

// --- 数据容器 ---
interface CompareItem {
  id: string;
  title: string;
  moduleName: string;
  myChoice: string;
  myAttitude: Attitude;
  partnerChoice: string;
  partnerAttitude: Attitude;
}

interface ConflictGroup {
  name: string;
  level: 'nuclear' | 'hard' | 'soft' | 'resonance';
  items: CompareItem[];
}

const nuclearConflicts = ref<CompareItem[]>([]); // 💣 核爆 (1 vs 4)
const hardConflicts = ref<CompareItem[]>([]);    // ⚠️ 困难 (1 vs 3, 2 vs 4)
const resonanceItems = ref<CompareItem[]>([]);   // ✨ 共振 (3/4 vs 3/4)
const negotiationItems = ref<CompareItem[]>([]); // 🤝 协商 (其他不一致)

const score = ref(0); // 默契度打分

// 辅助：获取态度对应的 Emoji 和 颜色类
function getAttitudeMeta(att: Attitude) {
  switch (att) {
    case 4: return { icon: '⭐', color: 'text-accent', bg: 'bg-accent/10', label: '核心' };
    case 3: return { icon: '👌', color: 'text-success', bg: 'bg-success/10', label: '同意' };
    case 2: return { icon: '❔', color: 'text-warning', bg: 'bg-warning/10', label: '犹豫' };
    case 1: return { icon: '⛔', color: 'text-error', bg: 'bg-error/10', label: '拒绝' };
    default: return { icon: '⚪', color: 'opacity-30', bg: 'bg-base-200', label: '跳过' };
  }
}

// 核心分析逻辑
function analyze(myMap: Record<string, number[]>, partnerMap: Record<string, number[]>) {
  const nList: CompareItem[] = [];
  const hList: CompareItem[] = [];
  const rList: CompareItem[] = [];
  const negList: CompareItem[] = [];
  
  let totalPoints = 0;
  let maxPoints = 0;

  questionsData.modules.forEach(m => {
    m.questions.forEach(q => {
      const myStates = myMap[q.id];
      const partnerStates = partnerMap[q.id];

      // 如果任意一方没做这题，跳过对比
      if (!myStates || !partnerStates) return;

      // 遍历选项
      q.options.forEach((optText, index) => {
        const myAtt = (myStates[index] || 0) as Attitude;
        const ptAtt = (partnerStates[index] || 0) as Attitude;

        // 双方都跳过，或者态度完全一致且不是核心，暂不重点展示
        if (myAtt === 0 && ptAtt === 0) return;

        // 构造对比项
        const item: CompareItem = {
          id: q.id + '_' + index,
          title: q.title,
          moduleName: m.name.replace(/📦 |⚛️ /g, ''),
          myChoice: optText,
          myAttitude: myAtt,
          partnerChoice: optText,
          partnerAttitude: ptAtt
        };

        // --- 判定逻辑 ---
        
        // 1. 💣 核爆冲突: (1 vs 4) 或 (4 vs 1)
        if ((myAtt === 1 && ptAtt === 4) || (myAtt === 4 && ptAtt === 1)) {
          nList.push(item);
          maxPoints += 10; // 扣分权重大
        }
        // 2. ⚠️ 困难分歧: (1 vs 3) 或 (2 vs 4)
        else if (
          (myAtt === 1 && ptAtt === 3) || (myAtt === 3 && ptAtt === 1) ||
          (myAtt === 2 && ptAtt === 4) || (myAtt === 4 && ptAtt === 2)
        ) {
          hList.push(item);
          maxPoints += 5;
        }
        // 3. ✨ 灵魂共振: (4 vs 4) 或 (4 vs 3) 或 (3 vs 3)
        // 且必须是在同一个选项上！
        else if (myAtt >= 3 && ptAtt >= 3) {
          rList.push(item);
          totalPoints += (myAtt + ptAtt); // 加分
          maxPoints += 8;
        }
        // 4. 🤝 需要协商: 剩下的不一致情况 (比如 2 vs 3, 1 vs 2)
        else if (myAtt !== ptAtt) {
          negList.push(item);
          maxPoints += 2;
        }
      });
    });
  });

  nuclearConflicts.value = nList;
  hardConflicts.value = hList;
  resonanceItems.value = rList;
  negotiationItems.value = negList;

  // 简单的默契度计算 (仅供娱乐)
  if (maxPoints === 0) score.value = 0;
  else score.value = Math.max(0, Math.min(100, Math.round((totalPoints / maxPoints) * 100)));
}

onMounted(() => {
  const myCode = route.query.my as string;
  const partnerCode = route.query.partner as string;

  if (myCode && partnerCode) {
    try {
      const myAnswers = decode(myCode);
      const partnerAnswers = decode(partnerCode);
      analyze(myAnswers, partnerAnswers);
    } catch (e) {
      console.error('对比解码失败', e);
    }
  }
});
</script>

<template>
  <div class="pb-24 pt-6 px-4 max-w-md mx-auto min-h-screen">
    
    <div class="text-center mb-8">
      <div class="text-4xl mb-2">⚔️</div>
      <h2 class="text-2xl font-bold">双人关系分析</h2>
      <div class="mt-4 inline-flex flex-col items-center">
        <div class="text-[10px] opacity-50 uppercase tracking-widest">Resonance Score</div>
        <div class="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-tr from-primary to-accent font-mono">
          {{ score }}%
        </div>
      </div>
    </div>

    <div v-if="nuclearConflicts.length > 0" class="mb-8 animate-slide-in">
      <div class="flex items-center gap-2 mb-4 text-error font-bold text-lg uppercase tracking-wider border-b-2 border-error/20 pb-1">
        <span>💣</span> 核爆冲突 ({{ nuclearConflicts.length }})
      </div>
      <div class="flex flex-col gap-3">
        <div v-for="item in nuclearConflicts" :key="item.id" class="card bg-error text-error-content shadow-xl border-2 border-white/10">
          <div class="card-body p-3">
            <div class="text-xs opacity-80 mb-1 flex justify-between">
              <span>{{ item.moduleName }}</span>
              <span>{{ item.title }}</span>
            </div>
            
            <div class="font-bold text-lg text-center border-b border-white/20 pb-2 mb-2">
              {{ item.myChoice }}
            </div>

            <div class="flex items-center justify-between text-sm font-bold">
              <div class="flex items-center gap-1">
                <span class="text-xl">{{ getAttitudeMeta(item.myAttitude).icon }}</span>
                <span>我</span>
              </div>
              <div class="text-xs opacity-50">VS</div>
              <div class="flex items-center gap-1">
                <span>Ta</span>
                <span class="text-xl">{{ getAttitudeMeta(item.partnerAttitude).icon }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="hardConflicts.length > 0" class="mb-8 animate-slide-in" style="animation-delay: 0.1s">
      <div class="flex items-center gap-2 mb-4 text-warning font-bold text-lg uppercase tracking-wider border-b-2 border-warning/20 pb-1">
        <span>⚠️</span> 重点磨合 ({{ hardConflicts.length }})
      </div>
      <div class="flex flex-col gap-2">
        <div v-for="item in hardConflicts" :key="item.id" class="bg-base-200 p-3 rounded-lg border-l-4 border-warning">
          <div class="text-[10px] opacity-40 mb-1">{{ item.title }} - {{ item.myChoice }}</div>
          <div class="flex justify-between items-center">
            <div class="flex items-center gap-2">
              <span class="text-xs opacity-50">我</span>
              <span class="badge badge-sm" :class="getAttitudeMeta(item.myAttitude).color">{{ getAttitudeMeta(item.myAttitude).label }}</span>
            </div>
            <div class="text-xs opacity-30">vs</div>
            <div class="flex items-center gap-2">
              <span class="badge badge-sm" :class="getAttitudeMeta(item.partnerAttitude).color">{{ getAttitudeMeta(item.partnerAttitude).label }}</span>
              <span class="text-xs opacity-50">Ta</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="resonanceItems.length > 0" class="mb-8 animate-slide-in" style="animation-delay: 0.2s">
      <div class="flex items-center gap-2 mb-4 text-accent font-bold text-lg uppercase tracking-wider border-b-2 border-accent/20 pb-1">
        <span>✨</span> 灵魂共振 ({{ resonanceItems.length }})
      </div>
      <div class="flex flex-wrap gap-2">
        <div v-for="item in resonanceItems" :key="item.id" class="badge badge-accent badge-outline h-auto py-2 gap-2">
          <span class="text-xs opacity-60">{{ item.myChoice }}</span>
          <span v-if="item.myAttitude === 4 && item.partnerAttitude === 4">⭐⭐</span>
          <span v-else>👌</span>
        </div>
      </div>
    </div>

    <div class="mt-8 text-center">
      <button @click="router.push('/')" class="btn btn-ghost">返回首页</button>
    </div>

  </div>
</template>

<style scoped>
.animate-slide-in {
  animation: slideIn 0.5s cubic-bezier(0.25, 1, 0.5, 1) backwards;
}
@keyframes slideIn {
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
}
</style>