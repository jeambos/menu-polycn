import { ref } from 'vue';

// 全局状态
const isModalOpen = ref(false);
const activeTab = ref<'save' | 'view'>('view');
const payloadCode = ref('');
const codeGenerator = ref<(() => string) | null>(null);

export function useCloudArchive() {
  
  function registerCodeGenerator(fn: () => string) {
    codeGenerator.value = fn;
  }

  // ✅ 新增：手动尝试生成代码的方法
  function tryGenerateCode() {
    if (codeGenerator.value) {
      try {
        console.log('正在重新生成代码...'); // 调试日志
        payloadCode.value = codeGenerator.value();
      } catch (e) {
        console.warn('动态生成代码失败', e);
      }
    }
  }

  function openCloudArchive(tab: 'save' | 'view' = 'view', code: string = '') {
    activeTab.value = tab;
    
    if (code) {
      // 1. 如果外部直接传入了代码（比如从 Result 页）
      payloadCode.value = code;
    } else if (tab === 'save') {
      // 2. 如果直接打开的是保存页，尝试生成
      tryGenerateCode();
    } else {
      // 3. 如果打开的是查看页，先清空（但在 Modal 内部切换时我们会再次生成）
      payloadCode.value = '';
    }

    isModalOpen.value = true;
  }

  function closeCloudArchive() {
    isModalOpen.value = false;
    setTimeout(() => {
      payloadCode.value = '';
    }, 300);
  }

  return {
    isModalOpen,
    activeTab,
    payloadCode,
    registerCodeGenerator,
    openCloudArchive,
    closeCloudArchive,
    tryGenerateCode // 👈 记得导出这个新方法
  };
}