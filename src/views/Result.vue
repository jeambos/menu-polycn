<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useClipboard } from '@vueuse/core';
import { useConfigStore } from '../stores/useConfigStore';
import { encode, decode } from '../logic/codec';
import RadarChart from '../components/RadarChart.vue';
import LiveCodeBar from '../components/LiveCodeBar.vue'; // 我们稍后补这个
import questionsData from '../data/questions.json';

const route = useRoute();
const router = useRouter();
const store = useConfigStore();
const { copy, copied } = useClipboard();

// 当前展示的答案 (可能是 Store 里的，也可能是从 URL 解析的)
const displayAnswers = ref({});
const displayCode = ref('');
const isPreviewMode = ref(false);

onMounted(() => {
  const codeParam = route.query.code as string;
  
  if (codeParam) {
    // 模式 A: 预览模式 (从首页解读进来)
    isPreviewMode.value = true;
    displayCode.value = codeParam;
    
    // 解码 Emoji -> 数组 -> 字典对象
    const decodedArr = decode(codeParam);
    const answerMap: any = {};
    
    // 将数组映射回 questionID (需要遍历题目表)
    let globalIndex = 0;
    questionsData.modules.forEach(m => {
      m.questions.forEach(q => {
        if (decodedArr[globalIndex]) {
          answerMap[q.id] = {
            optionIndex: decodedArr[globalIndex].option,
            certainty: decodedArr[globalIndex].certainty
          };
        }
        globalIndex++;
      });
    });
    displayAnswers.value = answerMap;

  } else {
    // 模式 B: 本机结果 (刚做完题)
    // 1. 将 Store 里的字典转为数组 (为了编码)
    // 注意：这里需要严格按照题目顺序转换
    const answerArr: any[] = [];
    questionsData.modules.forEach(m => {
      m.questions.forEach(q => {
        const record = store.getAnswer(q.id);
        if (record) {
          answerArr.push({ option: record.optionIndex, certainty: record.certainty });
        } else {
          answerArr.push({ option: 0, certainty: 0 }); // 没做填0
        }
      });
    });

    displayAnswers.value = store.answers;
    displayCode.value = encode(answerArr);
  }
});

// 复制功能
function handleCopy() {
  copy(displayCode.value);
}
</script>

<template>
  <div class="pb-24">
    <div class="text-center mb-6">
      <div class="text-6xl mb-2">{{ isPreviewMode ? '🔍' : '🎉' }}</div>
      <h2 class="text-2xl font-bold">
        {{ isPreviewMode ? '配置解读' : '配置已生成' }}
      </h2>
      <p class="opacity-60 text-sm mt-1">
        {{ isPreviewMode ? '这是读取到的关系画像' : '独一无二的关系指纹' }}
      </p>
    </div>

    <div class="card bg-base-200 shadow-xl mb-6">
      <div class="card-body p-2 relative overflow-hidden">
        <RadarChart :answers="displayAnswers" />
        
        <div class="absolute inset-0 bg-gradient-to-b from-transparent to-base-200 pointer-events-none"></div>
      </div>
    </div>

    <div class="card bg-neutral text-neutral-content shadow-xl mb-6">
      <div class="card-body p-4">
        <h3 class="text-sm font-bold opacity-70 uppercase tracking-wider mb-2">
          BASE1024 CODE
        </h3>
        
        <div class="bg-black/30 rounded-lg p-3 break-all font-mono text-lg leading-relaxed tracking-widest text-primary border border-white/10 relative group">
          {{ displayCode }}
          
          <div v-if="copied" class="absolute inset-0 flex items-center justify-center bg-success/90 text-success-content font-bold backdrop-blur-sm rounded-lg transition-all">
            已复制到剪贴板! ✨
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3 mt-4">
          <button @click="handleCopy" class="btn btn-primary w-full">
            📋 复制代码
          </button>
          
          <button class="btn btn-outline w-full" disabled>
            🖼️ 生成长图 (施工中)
          </button>
        </div>
        
        <p class="text-xs text-center opacity-40 mt-3">
          请将此代码发送给伴侣，让 Ta 在首页点击“双人对比”
        </p>
      </div>
    </div>

    <div class="flex justify-center">
      <button @click="router.push('/')" class="btn btn-ghost btn-sm opacity-60">
        返回首页
      </button>
    </div>

  </div>
</template>