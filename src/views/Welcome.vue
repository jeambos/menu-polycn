<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useClipboard } from '@vueuse/core';
import { useConfigStore } from '../stores/useConfigStore';
import { decode } from '../logic/codec';

const router = useRouter();
const store = useConfigStore();
const { text, isSupported } = useClipboard();

// --- 状态 ---
const activeTab = ref<'import' | 'compare'>('import');
const singleCode = ref('');
const compareMyCode = ref('');
const comparePartnerCode = ref('');
const isShaking = ref(false);
const errorMsg = ref('');

// --- 缓存概览弹窗 ---
const showCacheModal = ref(false);
const cacheStats = ref<{ avatar: string; count: number }[]>([]);

// --- 辅助函数 ---
function isValidCode(code: string): boolean {
  if (!code || code.trim().length === 0) return false;
  try {
    const result = decode(code);
    return Object.keys(result.answers || result).length > 0;
  } catch (e) {
    return false;
  }
}

function triggerError(msg: string) {
  errorMsg.value = msg;
  isShaking.value = true;
  setTimeout(() => {
    isShaking.value = false;
  }, 500);
}

async function pasteFromClipboard(targetRef: any) {
  if (navigator.clipboard && navigator.clipboard.readText) {
    try {
      const clipText = await navigator.clipboard.readText();
      if (clipText) targetRef.value = clipText;
    } catch (e) {
      console.error('无法读取剪贴板:', e);
      triggerError('无法访问剪贴板，请手动粘贴');
    }
  } else if (isSupported.value && text.value) {
    targetRef.value = text.value;
  }
}

// --- 业务逻辑 ---

// ✅ 点击开始配置时的拦截逻辑
function handleStartConfig() {
  const stats = store.getProfileStats();
  if (stats.length > 0) {
    // 如果有缓存，展示概览
    cacheStats.value = stats;
    showCacheModal.value = true;
  } else {
    // 无缓存，直接进
    router.push('/setup');
  }
}

function proceedToSetup() {
  showCacheModal.value = false;
  router.push('/setup');
}

function handleImport() {
  if (!isValidCode(singleCode.value)) {
    triggerError('代码无法识别，请检查是否完整');
    return;
  }
  router.push({ path: '/result', query: { code: singleCode.value, mode: 'preview' } });
}

function handleCompare() {
  if (!isValidCode(compareMyCode.value) || !isValidCode(comparePartnerCode.value)) {
    triggerError('代码无效，请确保双方代码都已填入');
    return;
  }
  router.push({ path: '/compare', query: { my: compareMyCode.value, partner: comparePartnerCode.value } });
}

watch([singleCode, compareMyCode, comparePartnerCode], () => {
  if (errorMsg.value) errorMsg.value = '';
});
</script>

<template>
  <div class="hero min-h-[75vh] bg-base-100">
    <div class="hero-content text-center w-full max-w-md px-4">
      <div class="w-full flex flex-col items-center">
        
        <div class="text-6xl mb-4 animate-bounce">🧬</div>
        <h1 class="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary mb-2">
          关系配置单
        </h1>
        <p class="text-sm opacity-60 mb-8">
          Build Your Relationship Like Code.
        </p>

        <button 
          @click="handleStartConfig"
          class="btn btn-primary btn-lg w-full shadow-xl hover:scale-[1.02] transition-transform mb-8"
        >
          🚀 开始配置
        </button>

        <div class="w-full bg-base-200/50 rounded-xl p-1 border border-base-content/5">
          <div class="tabs tabs-boxed bg-transparent mb-4">
            <a 
              class="tab w-1/2 transition-all duration-300"
              :class="{ 'tab-active bg-base-100 shadow-sm': activeTab === 'import' }"
              @click="activeTab = 'import'"
            >
              🔍 代码解读
            </a>
            <a 
              class="tab w-1/2 transition-all duration-300"
              :class="{ 'tab-active bg-base-100 shadow-sm': activeTab === 'compare' }"
              @click="activeTab = 'compare'"
            >
              ⚔️ 双人对比
            </a>
          </div>

          <div class="px-2 pb-2">
            <div v-if="activeTab === 'import'" class="form-control w-full">
              <div class="relative">
                <textarea 
                  v-model="singleCode"
                  class="textarea textarea-bordered w-full h-24 text-lg pr-10 leading-relaxed" 
                  placeholder="长按粘贴 Emoji 代码..."
                ></textarea>
                <button v-if="isSupported" @click="pasteFromClipboard(singleCode)" class="absolute right-2 top-2 btn btn-xs btn-ghost opacity-50">📋</button>
              </div>
              <div class="h-6 mt-1 text-error text-s font-bold transition-opacity duration-200" :class="errorMsg ? 'opacity-100' : 'opacity-0'">{{ errorMsg }}</div>
              <button @click="handleImport" class="btn btn-neutral w-full mt-1" :class="{ 'animate-shake': isShaking }">确定解读</button>
            </div>

            <div v-if="activeTab === 'compare'" class="form-control w-full space-y-3">
              <div class="relative">
                <input v-model="compareMyCode" type="text" class="input input-bordered w-full pr-10" placeholder="粘贴你的代码" />
                <button v-if="isSupported" @click="pasteFromClipboard(compareMyCode)" class="absolute right-2 top-2 btn btn-xs btn-ghost opacity-50">📋</button>
              </div>
              <div class="relative">
                <input v-model="comparePartnerCode" type="text" class="input input-bordered w-full pr-10" placeholder="粘贴伴侣的代码" />
                <button v-if="isSupported" @click="pasteFromClipboard(comparePartnerCode)" class="absolute right-2 top-2 btn btn-xs btn-ghost opacity-50">📋</button>
              </div>
              <div class="h-6 text-error text-s font-bold transition-opacity duration-200 flex items-center justify-center" :class="errorMsg ? 'opacity-100' : 'opacity-0'">{{ errorMsg }}</div>
              <button @click="handleCompare" class="btn btn-secondary w-full" :class="{ 'animate-shake': isShaking }">开始对比</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <dialog class="modal modal-bottom sm:modal-middle" :class="{ 'modal-open': showCacheModal }">
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">📁 发现历史存档</h3>
        <p class="text-s opacity-60 mb-4">
          检测到您有以下对象的配置草稿，您可以在设置页点击对应头像切换：
        </p>
        
        <div class="flex flex-wrap gap-3 mb-6">
          <div v-for="stat in cacheStats" :key="stat.avatar" class="badge badge-lg gap-2 py-4 pl-3 pr-4 shadow-sm border border-base-content/10">
            <span class="text-xl">{{ stat.avatar }}</span>
            <div class="flex flex-col items-start leading-none">
              <span class="text-xs opacity-50 uppercase font-bold">已答</span>
              <span class="font-mono font-bold">{{ stat.count }}</span>
            </div>
          </div>
        </div>

        <div class="modal-action">
          <button class="btn btn-primary w-full" @click="proceedToSetup">
            知道了，进入配置页
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="proceedToSetup">close</button>
      </form>
    </dialog>
  </div>
</template>

<style scoped>
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  50% { transform: translateX(5px); }
  75% { transform: translateX(-5px); }
}
.animate-shake {
  animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
}
</style>