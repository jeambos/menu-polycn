<script setup lang="ts">
import { ref, watch, computed} from 'vue';
import { Waline } from '@waline/client/component';
// @ts-ignore
import '@waline/client/style'; 
import BaseModal from './BaseModal.vue';
import { useCloudArchive } from '../composables/useCloudArchive';

// --- 全局状态 ---
const { isModalOpen, activeTab, payloadCode, closeCloudArchive, tryGenerateCode } = useCloudArchive();

// --- 本地状态 ---
const walineServerURL = 'https://comments.polycn.org/';
const currentUser = ref<any>(null);
const isSubmitting = ref(false);

// --- 1. 登录检测逻辑 ---
function checkLogin() {
  try {
    // 尝试从 Waline 默认存储中读取用户信息
    const localUser = localStorage.getItem('WALINE_USER');
    if (localUser) {
      currentUser.value = JSON.parse(localUser);
    } else {
      currentUser.value = null;
    }
  } catch (e) {
    console.error('Login check failed', e);
    currentUser.value = null;
  }
}

// 监听弹窗打开，每次打开都检查一次登录态
watch(isModalOpen, (val) => {
  if (val) checkLogin();
});

// 处理 Waline 登录成功回调
function onWalineLogin(userInfo: any) {
  currentUser.value = userInfo;
  // 登录后如果是 'save' 模式且有代码，保持在 save tab；否则去 view
}

// --- 2. 路径计算 (带混淆保护) ---
const userStoragePath = computed(() => {
  // 确保用户已登录
  const id = currentUser.value?.objectId || currentUser.value?.id || currentUser.value?.ID;
  if (!id) return '/temp_storage';

  /**
   * 🔐 混淆逻辑说明：
   * 直接用 ID (如 '1') 太容易被遍历。
   * 我们将 ID 加上一段只有我们知道的“盐值”，再转为 Base64。
   * 结果：'1' -> 'MHBvbHljbl9zYWZlXzIwMjY'
   */
  const salt = "9f3c7a2d84b1e6a05d2fcb7814e93a6c7b50f4d2e9a1c8b63d0e57a4c2f1b89"; // 你可以随意修改这段字符串
  const rawString = `${id}_${salt}`;
  
  // 使用 btoa 转为 Base64，并去掉可能引起 URL 问题的字符（如 =）
  const obfuscatedId = btoa(rawString).replace(/[+/=]/g, '');
  
  return `/user_storage/${obfuscatedId}`;
});

// 👇 2. 新增监听：当切换到 'save' 标签时，自动生成代码
watch(activeTab, (newTab) => {
  if (newTab === 'save') {
    // 只要切过来，就强制刷新一次最新代码
    tryGenerateCode(); 
  }
});


// --- 3. 提交逻辑 (Save Tab) ---
async function handleSave() {
  if (!payloadCode.value) return;

  // A. 正则校验 (防止被篡改)
  const code = payloadCode.value.trim();
  if (code.length < 2 || /<script/i.test(code)) {
    alert('数据格式校验失败，禁止提交非法内容。');
    return;
  }

  isSubmitting.value = true;

  try {
    // 🔍 调试步骤 1: 获取 Token
    let token = localStorage.getItem('WALINE_TOKEN');
    
    // 如果没有单独的 Token，尝试从 WALINE_USER 里面拿
    if (!token) {
      try {
        const userStr = localStorage.getItem('WALINE_USER');
        if (userStr) {
          const userObj = JSON.parse(userStr);
          token = userObj.token; // Waline 通常把 token 放在这里
          console.log('从 WALINE_USER 中获取到 Token:', token ? '成功' : '失败');
        }
      } catch (e) {
        console.warn('解析 WALINE_USER 失败', e);
      }
    }

    if (!token) {
      throw new Error('是否尚未登录？请到云存档管理标签页进行登录，或退出登录后重新登录。');
    }

    // 🔍 调试步骤 2: 发送请求
    console.log('正在向服务器提交...');
    const finalContent = `【☁️云存档】\n--------------\n${code}`;
    
    const response = await fetch(`${walineServerURL}api/comment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` // 注意这里的格式
      },
      body: JSON.stringify({
        url: userStoragePath.value,
        comment: finalContent,
        nick: currentUser.value.nick_name,
        mail: currentUser.value.email,
        // link: currentUser.value.link,
        ua: navigator.userAgent,
      })
    });

    // 🔍 调试步骤 3: 解析响应
    const resData = await response.json();
    console.log('服务器响应:', resData);

    // Waline 接口如果出错，errno 会大于 0
    // 或者是 code != 200 (取决于版本，通常看 errno)
    if (resData.errno) {
      // 如果 errmsg 是对象，强制转字符串，防止 [object Object]
      const errorMsg = typeof resData.errmsg === 'object' 
        ? JSON.stringify(resData.errmsg) 
        : (resData.errmsg || '未知错误');
      throw new Error(errorMsg);
    }

    // E. 成功后处理
    console.log('存档成功');
    activeTab.value = 'view';
    payloadCode.value = ''; 

  } catch (err: any) {
    console.error('提交过程出错:', err);
    // 强制转为字符串显示，彻底解决 [object Object] 问题
    const displayMsg = err instanceof Error ? err.message : JSON.stringify(err);
    alert(`存档失败: ${displayMsg}`);
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <BaseModal 
    :model-value="isModalOpen" 
    @update:model-value="closeCloudArchive"
    :title="activeTab === 'save' ? '存入云端' : '我的云存档'"
    show-close
  >
    <div v-if="!currentUser" class="py-4 text-center">
      <div class="alert alert-warning shadow-sm mb-6 text-left text-sm items-start">
        <i-ph-warning-circle-bold class="text-xl shrink-0 mt-0.5" />
        <div>
          <h3 class="font-bold">使用前必读 (Disclaimer)</h3>
          <ul class="list-disc list-inside opacity-80 mt-1 space-y-1 text-xs">
            <li>本功能基于留言板技术，数据<strong>明文存储</strong>。</li>
            <li>管理员后台可见您的存档，<strong>切勿存储敏感信息</strong>。</li>
            <li>服务可能随时终止，请务必使用本地记事本作为主备份。</li>
          </ul>
        </div>
      </div>

      <div class="flex flex-col items-center gap-4">
        <p class="text-sm font-bold opacity-60">请登录后继续</p>
        <div class="w-full max-w-[200px] pointer-events-auto relative z-10">
          <Waline 
            :serverURL="walineServerURL" 
            path="/login_gate"
            mode="login"
            @login="onWalineLogin"
          />
        </div>
      </div>
    </div>

    <div v-else class="min-h-[300px]">
      <div class="tabs tabs-boxed bg-base-200/50 p-1 mb-6 grid grid-cols-2">
        <a 
          class="tab transition-all" 
          :class="{ 'tab-active bg-primary text-primary-content shadow-sm': activeTab === 'save' }"
          @click="activeTab = 'save'"
        >
          <i-ph-floppy-disk-bold class="mr-2"/> 存入新配置
        </a>
        <a 
          class="tab transition-all" 
          :class="{ 'tab-active bg-primary text-primary-content shadow-sm': activeTab === 'view' }"
          @click="activeTab = 'view'"
        >
          <i-ph-archive-box-bold class="mr-2"/> 历史存档
        </a>
      </div>

      <div v-if="activeTab === 'save'" class="animate-fade-in">
        <div v-if="!payloadCode" class="text-center py-10 opacity-50">
          <i-ph-ghost-bold class="text-4xl mx-auto mb-2"/>
          <p>暂无待存档的配置</p>
          <p class="text-xs mt-1">请先去生成结果，然后点击保存。</p>
        </div>

        <div v-else>
          <div class="form-control mb-4">
            <div class="label">
              <span class="label-text font-bold">当前可保存配置</span>
            </div>
            <textarea 
              class="textarea textarea-bordered h-32 font-mono text-xs leading-relaxed bg-base-200 text-base-content/70 cursor-not-allowed resize-none" 
              readonly
              :value="payloadCode"
            ></textarea>
            </div>

          <div class="alert bg-base-100 border border-base-content/10 text-xs mb-6">
            <ul class="list-disc list-inside opacity-80 mt-1 space-y-1 text-xs">

            <h3 class="font-bold">使用前必读 (Disclaimer)</h3>
          
            <li>本功能基于留言板技术，数据<strong>明文存储</strong>。</li>
            <li>管理员后台可见您的存档，<strong>切勿存储敏感信息</strong>。</li>
            <li>服务可能随时终止，请务必使用本地记事本作为主备份。</li>
          </ul>
        
          </div>

          <button 
            @click="handleSave" 
            class="btn btn-primary w-full" 
            :disabled="isSubmitting"
          >
            <span v-if="isSubmitting" class="loading loading-spinner loading-xs"></span>
            {{ isSubmitting ? '正在上传...' : '确认存入云端' }}
          </button>
        </div>
      </div>

      <div v-else class="animate-fade-in relative">
        <div class="flex items-center gap-3 mb-4 px-2 opacity-50 text-xs">
          <img :src="currentUser.avatar" class="w-6 h-6 rounded-full">
          <span>{{ currentUser.nick_name }} 的存档空间</span>
        </div>

        <div class="waline-readonly-list">
          <Waline 
            :key="`view-${activeTab}`"
            :serverURL="walineServerURL" 
            :path="userStoragePath"
            :dark="false"
          />
        </div>
      </div>
    </div>
  </BaseModal>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}

/* --- Waline CSS 魔改 (只读模式) --- */
/* 1. 隐藏发布框 (核心) */
:deep(.wl-editor-container),
:deep(.wl-header) {
  display: none !important;
}

/* 2. 隐藏无关元素 */
:deep(.wl-power),    /* 版权脚标 */
:deep(.wl-reaction), /* 表情表态 */
:deep(.wl-meta),     /* 浏览器/系统信息 */
:deep(.wl-reply),    /* 回复按钮 */
:deep(.wl-like),     /* 点赞按钮 */
:deep(.wl-edit),     /* 编辑按钮 */
:deep(.wl-delete)    /* 删除按钮 (如果你希望用户能删，可以保留这个) */
{
  display: none !important;
}

/* 3. 列表样式微调 */
:deep(.wl-cards) {
  margin-top: 0 !important;
}
:deep(.wl-item) {
  background: rgba(0,0,0,0.02);
  border-radius: 0.5rem;
  margin-bottom: 0.75rem;
  padding: 0.75rem !important;
  border: 1px solid rgba(0,0,0,0.05);
}
:deep(.wl-content) {
  font-family: monospace;
  font-size: 0.85rem !important;
  color: currentColor;
  margin-top: 0.5rem;
}

/* 🚫 新增：彻底隐藏评论输入框容器 (wl-comment) 和 顶部统计栏 (wl-meta-head) */
/* :deep(.wl-comment), */
:deep(.wl-meta-head) {
  display: none !important;
}

/* 确保列表紧贴顶部，没有多余间隙 */
:deep(.wl-cards) {
  margin-top: 0 !important;
  padding-top: 0 !important;
}

</style>