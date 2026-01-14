<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useClipboard } from '@vueuse/core';
import { decode } from '../logic/codec'; // 引入解码器用于验证

const router = useRouter();
const { text, isSupported } = useClipboard(); // VueUse 的剪贴板工具

// --- 状态管理 ---
const activeTab = ref<'import' | 'compare'>('import'); // 当前标签页
const singleCode = ref(''); // 代码解读的输入
const compareMyCode = ref(''); // 对比模式-我的代码
const comparePartnerCode = ref(''); // 对比模式-伴侣代码

// 错误处理状态
const isShaking = ref(false); // 控制抖动动画
const errorMsg = ref(''); // 错误提示文字

// --- 辅助函数 ---

// 验证代码是否合法
function isValidCode(code: string): boolean {
  if (!code || code.trim().length === 0) return false;
  try {
    const result = decode(code);
    
    // 🔴 旧代码 (错误): return result.length > 0;
    // 🟢 新代码 (修复): 判断对象的 Key 数量是否大于 0
    return Object.keys(result).length > 0;
    
  } catch (e) {
    return false;
  }
}

// 触发错误动画
function triggerError(msg: string) {
  errorMsg.value = msg;
  isShaking.value = true;
  // 500ms 后移除抖动类，以便下次还能触发
  setTimeout(() => {
    isShaking.value = false;
  }, 500);
}

// 读取剪贴板 (使用原生 API)
async function pasteFromClipboard(targetRef: any) {
  // 优先使用原生 API 读取
  if (navigator.clipboard && navigator.clipboard.readText) {
    try {
      const clipText = await navigator.clipboard.readText();
      if (clipText) {
        targetRef.value = clipText;
      }
    } catch (e) {
      console.error('无法读取剪贴板:', e);
      triggerError('无法访问剪贴板，请手动粘贴');
    }
  } else if (isSupported.value && text.value) {
    // 降级方案：尝试读取 VueUse 监听到的内容
    targetRef.value = text.value;
  }
}

// --- 核心业务逻辑 ---

// 1. 处理“代码解读”提交
function handleImport() {
  if (!isValidCode(singleCode.value)) {
    triggerError('代码无法识别，请检查是否完整');
    return;
  }
  // 验证通过，跳转到 Result 页，并通过 URL 参数传递代码
  // 注意：我们这里不覆盖用户的 LocalStorage，而是通过 URL 预览
  router.push({ 
    path: '/result', 
    query: { code: singleCode.value, mode: 'preview' } 
  });
}

// 2. 处理“双人对比”提交
function handleCompare() {
  if (!isValidCode(compareMyCode.value) || !isValidCode(comparePartnerCode.value)) {
    triggerError('代码无效，请确保双方代码都已填入');
    return;
  }
  // 跳转到对比页
  router.push({ 
    path: '/compare', 
    query: { my: compareMyCode.value, partner: comparePartnerCode.value } 
  });
}

// --- 监听输入变动，自动消除错误 ---
watch([singleCode, compareMyCode, comparePartnerCode], () => {
  if (errorMsg.value) {
    errorMsg.value = '';
  }
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

        <router-link 
          to="/setup" 
          class="btn btn-primary btn-lg w-full shadow-xl hover:scale-[1.02] transition-transform mb-8"
        >
          🚀 开始配置
        </router-link>

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
                <button 
                  v-if="isSupported"
                  @click="pasteFromClipboard(singleCode)"
                  class="absolute right-2 top-2 btn btn-xs btn-ghost opacity-50"
                  title="粘贴"
                >📋</button>
              </div>
              
              <div class="h-6 mt-1 text-error text-xs font-bold transition-opacity duration-200" :class="errorMsg ? 'opacity-100' : 'opacity-0'">
                {{ errorMsg }}
              </div>

              <button 
                @click="handleImport"
                class="btn btn-neutral w-full mt-1"
                :class="{ 'animate-shake': isShaking }"
              >
                确定解读
              </button>
            </div>

            <div v-if="activeTab === 'compare'" class="form-control w-full space-y-3">
              <div class="relative">
                <input 
                  v-model="compareMyCode"
                  type="text" 
                  class="input input-bordered w-full pr-10" 
                  placeholder="粘贴你的代码" 
                />
                <button v-if="isSupported" @click="pasteFromClipboard(compareMyCode)" class="absolute right-2 top-2 btn btn-xs btn-ghost opacity-50">📋</button>
              </div>

              <div class="relative">
                <input 
                  v-model="comparePartnerCode"
                  type="text" 
                  class="input input-bordered w-full pr-10" 
                  placeholder="粘贴伴侣的代码" 
                />
                <button v-if="isSupported" @click="pasteFromClipboard(comparePartnerCode)" class="absolute right-2 top-2 btn btn-xs btn-ghost opacity-50">📋</button>
              </div>

              <div class="h-6 text-error text-xs font-bold transition-opacity duration-200 flex items-center justify-center" :class="errorMsg ? 'opacity-100' : 'opacity-0'">
                {{ errorMsg }}
              </div>

              <button 
                @click="handleCompare"
                class="btn btn-secondary w-full"
                :class="{ 'animate-shake': isShaking }"
              >
                开始对比
              </button>
            </div>

          </div>
        </div>
        
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 左右横向抖动动画 */
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