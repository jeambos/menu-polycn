<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue';
import { Waline } from '@waline/client/component';
// @ts-ignore
import '@waline/client/style'; 
import BaseModal from './BaseModal.vue';
import { useCloudArchive } from '../composables/useCloudArchive';

// --- 全局状态 ---
const { isModalOpen, activeTab, payloadCode, closeCloudArchive } = useCloudArchive();

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

// --- 2. 路径计算 ---
const userStoragePath = computed(() => {
  if (!currentUser.value || !currentUser.value.objectId) return '/temp_storage';
  return `/user_storage/${currentUser.value.objectId}`;
});

// --- 3. 提交逻辑 (Save Tab) ---
async function handleSave() {
  if (!payloadCode.value) return;

  // A. 正则校验 (防止被篡改)
  // 假设配置代码主要是 Emoji，或者您可以根据实际格式修改此正则
  // 这里做一个宽松示例：不能为空，且不包含 script 等危险标签
  const code = payloadCode.value.trim();
  if (code.length < 2 || /<script/i.test(code)) {
    alert('数据格式校验失败，禁止提交非法内容。');
    return;
  }

  isSubmitting.value = true;

  try {
    // B. 获取 Token
    const token = localStorage.getItem('WALINE_TOKEN');
    if (!token) throw new Error('未获取到登录凭证');

    // C. 构造内容 (添加云存档标签)
    const finalContent = `【☁️云存档】\n--------------\n${code}`;

    // D. 调用 API (fetch 方式)
    const response = await fetch(`${walineServerURL}api/comment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        path: userStoragePath.value,
        comment: finalContent,
        nick: currentUser.value.nick_name,
        mail: currentUser.value.email,
        link: currentUser.value.link,
        ua: navigator.userAgent,
      })
    });

    const resData = await response.json();

    if (resData.errno) {
      throw new Error(resData.errmsg || '提交失败');
    }

    // E. 成功后处理
    // 自动切到查看 Tab，清空暂存区，触发列表刷新
    activeTab.value = 'view';
    payloadCode.value = ''; 
    // 注意：Waline 组件在 Key 变化时会重载，我们利用 activeTab 切换来间接刷新
  } catch (err) {
    alert(`存档失败: ${err instanceof Error ? err.message : '未知错误'}`);
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
              <span class="label-text font-bold">待保存配置 (只读预览)</span>
            </div>
            <textarea 
              class="textarea textarea-bordered h-32 font-mono text-xs leading-relaxed bg-base-200 text-base-content/70 cursor-not-allowed resize-none" 
              readonly
              :value="payloadCode"
            ></textarea>
            <div class="label">
              <span class="label-text-alt text-warning">
                <i-ph-lock-key-fill class="inline align-text-bottom"/> 内容已锁定，禁止修改
              </span>
            </div>
          </div>

          <div class="alert bg-base-100 border border-base-content/10 text-xs mb-6">
            <i-ph-info-bold class="text-primary"/>
            <span>点击确认后，该配置将永久存储至您的个人名下。</span>
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
</style>