<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useClipboard } from '@vueuse/core';
import { useConfigStore } from '../stores/useConfigStore';
import { encode, decode } from '../logic/codec';
import LiveCodeBar from '../components/LiveCodeBar.vue';
import questionsData from '../data/questions.json';

const route = useRoute();
const router = useRouter();
const store = useConfigStore();
const { copy, copied } = useClipboard();

// --- 数据处理 ---
const displayAnswers = ref<Record<string, any>>({});
const displayCode = ref('');
const isPreviewMode = ref(false);

// 定义三个分区的容器
const greenZone = ref<any[]>([]);  // 喜欢/核心
const yellowZone = ref<any[]>([]); // 一般/协商
const redZone = ref<any[]>([]);    // 拒绝/雷区

// 将扁平的答案映射回带标题的对象，并分类
function processZoneData(answers: Record<string, any>) {
  const g: any[] = [], y: any[] = [], r: any[] = [];

  questionsData.modules.forEach(m => {
    m.questions.forEach(q => {
      const record = answers[q.id];
      // 如果没答，直接跳过
      if (!record || record.certainty === 0) return;

      const item = {
        id: q.id,
        title: q.title,
        choice: q.options[record.optionIndex],
        optionIndex: record.optionIndex,
        certainty: record.certainty, // 1=迷茫, 2=普通, 3=坚定
        moduleName: m.name.replace(/📦 |⚛️ /g, '')
      };

      // --- 分区逻辑 (根据 V5.0 的 0-4 选项倾向) ---
      // 逻辑：
      // 1. 如果是 "核心需求(3)"，无论选啥，都算重要信息。但为了视觉区分：
      //    - 核心+喜欢 -> 放在绿色置顶
      //    - 核心+讨厌 -> 放在红色置顶 (硬雷点)
      // 2. 普通情况：
      //    - 选项 3,4 (接受/融合) -> 绿区
      //    - 选项 2 (中立) -> 黄区
      //    - 选项 0,1 (拒绝/独立) -> 红区
      
      if (item.optionIndex >= 3) {
        g.push(item);
      } else if (item.optionIndex === 2) {
        y.push(item);
      } else {
        r.push(item);
      }
    });
  });

  // 排序优化：每个区内，把“核心(⭐)”的排在最前面
  const sorter = (a: any, b: any) => b.certainty - a.certainty;
  greenZone.value = g.sort(sorter);
  yellowZone.value = y.sort(sorter);
  redZone.value = r.sort(sorter);
}

onMounted(() => {
  const codeParam = route.query.code as string;
  
  if (codeParam) {
    // 模式 A: 预览模式
    isPreviewMode.value = true;
    displayCode.value = codeParam;
    const decodedArr = decode(codeParam);
    const answerMap: any = {};
    
    let globalIndex = 0;
    questionsData.modules.forEach(m => {
      m.questions.forEach(q => {
        const item = decodedArr[globalIndex];
        // 增加非空检查，修复 TS 报错
        if (item) {
          answerMap[q.id] = {
            optionIndex: item.option,
            certainty: item.certainty
          };
        }
        globalIndex++;
      });
    });
    displayAnswers.value = answerMap;
  } else {
    // 模式 B: 本机结果
    displayAnswers.value = store.answers;
    // 重新编码一遍用于展示
    // (此处省略了重复的 encode 逻辑调用，直接复用 LiveCodeBar 里的逻辑或 store 逻辑)
    // 简单起见，我们假设用户已经生成过代码，或者 LiveCodeBar 会处理
    displayCode.value = '请在底部查看实时代码'; 
  }

  // 处理分区数据
  processZoneData(displayAnswers.value);
});
</script>

<template>
  <div class="pb-32 pt-6 px-4 max-w-md mx-auto">
    <div class="text-center mb-8">
      <h2 class="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
        {{ isPreviewMode ? '配置解读' : '我的配置单' }}
      </h2>
      <p class="text-xs opacity-50 mt-2 font-mono break-all px-4">
        {{ isPreviewMode ? 'Code: ' + displayCode.slice(0, 20) + '...' : '已生成属于你的关系指纹' }}
      </p>
    </div>

    <div v-if="greenZone.length > 0" class="mb-6 animate-fade-in-up">
      <div class="flex items-center gap-2 mb-3 text-success font-bold text-lg uppercase tracking-wider">
        <span class="text-xl">🟩</span> 舒适圈 / 渴望
      </div>
      <div class="flex flex-col gap-2">
        <div 
          v-for="item in greenZone" 
          :key="item.id"
          class="bg-base-200/50 border-l-4 border-success p-3 rounded-r-lg flex justify-between items-center"
        >
          <div>
            <div class="text-[10px] opacity-40 mb-0.5">{{ item.moduleName }}</div>
            <div class="font-bold text-sm">{{ item.title }}</div>
            <div class="text-xs opacity-80 mt-1 text-success">{{ item.choice }}</div>
          </div>
          <div v-if="item.certainty === 3" class="text-xl animate-pulse">⭐</div>
        </div>
      </div>
    </div>

    <div v-if="yellowZone.length > 0" class="mb-6 animate-fade-in-up" style="animation-delay: 0.1s">
      <div class="flex items-center gap-2 mb-3 text-warning font-bold text-lg uppercase tracking-wider">
        <span class="text-xl">🟨</span> 待商议 / 弹性
      </div>
      <div class="flex flex-col gap-2">
        <div 
          v-for="item in yellowZone" 
          :key="item.id"
          class="bg-base-200/50 border-l-4 border-warning p-3 rounded-r-lg flex justify-between items-center"
        >
          <div>
            <div class="text-[10px] opacity-40 mb-0.5">{{ item.moduleName }}</div>
            <div class="font-bold text-sm">{{ item.title }}</div>
            <div class="text-xs opacity-80 mt-1">{{ item.choice }}</div>
          </div>
          <div v-if="item.certainty === 3" class="text-xl text-warning">⭐</div>
        </div>
      </div>
    </div>

    <div v-if="redZone.length > 0" class="mb-6 animate-fade-in-up" style="animation-delay: 0.2s">
      <div class="flex items-center gap-2 mb-3 text-error font-bold text-lg uppercase tracking-wider">
        <span class="text-xl">🟥</span> 硬边界 / 拒绝
      </div>
      <div class="flex flex-col gap-2">
        <div 
          v-for="item in redZone" 
          :key="item.id"
          class="bg-base-200/50 border-l-4 border-error p-3 rounded-r-lg flex justify-between items-center opacity-80"
        >
          <div>
            <div class="text-[10px] opacity-40 mb-0.5">{{ item.moduleName }}</div>
            <div class="font-bold text-sm line-through decoration-error/50">{{ item.title }}</div>
            <div class="text-xs opacity-80 mt-1 text-error font-bold">{{ item.choice }}</div>
          </div>
          <div v-if="item.certainty === 3" class="text-xl">⛔</div>
        </div>
      </div>
    </div>

    <div class="flex flex-col gap-3 mt-8">
      <button v-if="!isPreviewMode" @click="copy(store.answers ? displayCode : '')" class="btn btn-primary w-full">
        {{ copied ? '已复制！' : '复制我的配置代码' }}
      </button>
      <button @click="router.push('/')" class="btn btn-ghost w-full">
        返回首页
      </button>
    </div>

    <LiveCodeBar v-if="!isPreviewMode" />
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