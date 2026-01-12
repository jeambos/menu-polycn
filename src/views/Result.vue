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
const greenZone = ref<any[]>([]);  // 🟩 舒适区
const yellowZone = ref<any[]>([]); // 🟨 协商区
const redZone = ref<any[]>([]);    // 🟥 雷区

// 辅助排序函数：核心 > 迷茫 > 普通
function sortByCertainty(a: any, b: any) {
  // 权重：核心(3) > 迷茫(1) > 普通(2)
  // 我们希望把带有特殊标记的排前面
  const weightA = a.certainty === 3 ? 10 : (a.certainty === 1 ? 5 : 0);
  const weightB = b.certainty === 3 ? 10 : (b.certainty === 1 ? 5 : 0);
  return weightB - weightA;
}

function processZoneData(answers: Record<string, any>) {
  const g: any[] = [], y: any[] = [], r: any[] = [];

  questionsData.modules.forEach(m => {
    m.questions.forEach(q => {
      const record = answers[q.id];
      if (!record || record.certainty === 0) return;

      const item = {
        id: q.id,
        title: q.title,
        choice: q.options[record.optionIndex],
        optionIndex: record.optionIndex,
        certainty: record.certainty, // 1=❔, 2=普通, 3=⭐
        moduleName: m.name.replace(/📦 |⚛️ /g, '')
      };

      // 分区逻辑 (5变3)
      if (item.optionIndex >= 3) {
        g.push(item);
      } else if (item.optionIndex === 2) {
        y.push(item);
      } else {
        r.push(item);
      }
    });
  });

  // 排序：把 星星 和 问号 排在前面
  greenZone.value = g.sort(sortByCertainty);
  yellowZone.value = y.sort(sortByCertainty);
  redZone.value = r.sort(sortByCertainty);
}

onMounted(() => {
  const codeParam = route.query.code as string;
  
  if (codeParam) {
    // A: 预览模式
    isPreviewMode.value = true;
    displayCode.value = codeParam;
    
    // 安全解码
    try {
      const decodedArr = decode(codeParam);
      const answerMap: any = {};
      
      let globalIndex = 0;
      questionsData.modules.forEach(m => {
        m.questions.forEach(q => {
          // ✅ 修复：增加非空判断，防止数组越界报错
          const item = decodedArr[globalIndex];
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
    } catch (e) {
      console.error("解码失败", e);
    }
  } else {
    // B: 本机结果
    displayAnswers.value = store.answers;
    // 这里我们只是为了让 LiveCodeBar 工作，不需要手动 set displayCode
    // LiveCodeBar 会自己从 store 读取
  }

  processZoneData(displayAnswers.value);
});
</script>

<template>
  <div class="pb-32 pt-6 px-4 max-w-md mx-auto min-h-screen">
    <div class="text-center mb-8">
      <h2 class="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
        {{ isPreviewMode ? '配置解读' : '我的配置单' }}
      </h2>
      <p class="text-xs opacity-50 mt-2 font-mono break-all px-8">
        {{ isPreviewMode ? 'Code: ' + displayCode.slice(0, 12) + '...' : '关系指纹已生成' }}
      </p>
    </div>

    <div v-if="greenZone.length > 0" class="mb-6 animate-fade-in-up">
      <div class="flex items-center gap-2 mb-3 text-success font-bold text-lg uppercase tracking-wider border-b border-success/20 pb-1">
        <span>🟩</span> 舒适圈 ({{ greenZone.length }})
      </div>
      <div class="flex flex-col gap-2">
        <div 
          v-for="item in greenZone" 
          :key="item.id"
          class="bg-base-200/40 hover:bg-base-200 p-3 rounded-lg flex justify-between items-center transition-colors"
          :class="{'border border-success/30': item.certainty === 3}"
        >
          <div>
            <div class="text-[10px] opacity-40 mb-0.5 flex items-center gap-1">
              {{ item.moduleName }}
              <span v-if="item.certainty === 3" class="text-warning">★ 核心</span>
            </div>
            <div class="font-bold text-sm">{{ item.title }}</div>
            <div class="text-xs opacity-80 mt-1 text-success font-medium">{{ item.choice }}</div>
          </div>
          <div class="text-xl">
            <span v-if="item.certainty === 3" class="animate-pulse" title="核心需求">⭐</span>
            <span v-else-if="item.certainty === 1" class="opacity-50 grayscale" title="迷茫/不确定">❔</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="yellowZone.length > 0" class="mb-6 animate-fade-in-up" style="animation-delay: 0.1s">
      <div class="flex items-center gap-2 mb-3 text-warning font-bold text-lg uppercase tracking-wider border-b border-warning/20 pb-1">
        <span>🟨</span> 待商议 ({{ yellowZone.length }})
      </div>
      <div class="flex flex-col gap-2">
        <div 
          v-for="item in yellowZone" 
          :key="item.id"
          class="bg-base-200/40 p-3 rounded-lg flex justify-between items-center"
        >
          <div>
            <div class="text-[10px] opacity-40 mb-0.5">{{ item.moduleName }}</div>
            <div class="font-bold text-sm">{{ item.title }}</div>
            <div class="text-xs opacity-80 mt-1 text-warning-content">{{ item.choice }}</div>
          </div>
          <div class="text-xl">
            <span v-if="item.certainty === 3" class="text-warning">⭐</span>
            <span v-else-if="item.certainty === 1" class="opacity-50">❔</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="redZone.length > 0" class="mb-6 animate-fade-in-up" style="animation-delay: 0.2s">
      <div class="flex items-center gap-2 mb-3 text-error font-bold text-lg uppercase tracking-wider border-b border-error/20 pb-1">
        <span>🟥</span> 硬边界 ({{ redZone.length }})
      </div>
      <div class="flex flex-col gap-2">
        <div 
          v-for="item in redZone" 
          :key="item.id"
          class="bg-base-200/40 p-3 rounded-lg flex justify-between items-center opacity-90"
          :class="{'bg-error/10': item.certainty === 3}"
        >
          <div>
            <div class="text-[10px] opacity-40 mb-0.5">{{ item.moduleName }}</div>
            <div class="font-bold text-sm text-base-content/70 line-through decoration-error/50">{{ item.title }}</div>
            <div class="text-xs opacity-100 mt-1 text-error font-bold">{{ item.choice }}</div>
          </div>
          <div class="text-xl">
            <span v-if="item.certainty === 3" title="绝对底线">⛔</span>
            <span v-else-if="item.certainty === 1" class="opacity-50">❔</span>
          </div>
        </div>
      </div>
    </div>

    <div class="flex flex-col gap-3 mt-8">
      <button v-if="!isPreviewMode" @click="copy(store.answers ? displayCode : '')" class="btn btn-primary w-full shadow-lg">
        {{ copied ? '✅ 已复制 Emoji 代码' : '📋 复制我的配置代码' }}
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