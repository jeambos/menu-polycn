import { ref } from 'vue';

// 全局状态 (单例模式)
const isModalOpen = ref(false);
const activeTab = ref<'save' | 'view'>('view');
const payloadCode = ref(''); // 待保存的代码

export function useCloudArchive() {
  /**
   * 打开云存档弹窗
   * @param tab - 'save' (存) 或 'view' (取)
   * @param code - (可选) 需要保存的配置代码
   */
  function openCloudArchive(tab: 'save' | 'view' = 'view', code: string = '') {
    activeTab.value = tab;
    payloadCode.value = code;
    isModalOpen.value = true;
  }

  function closeCloudArchive() {
    isModalOpen.value = false;
    // 关闭时清空暂存代码，防止下次打开显示旧数据
    setTimeout(() => {
      payloadCode.value = '';
    }, 300);
  }

  return {
    isModalOpen,
    activeTab,
    payloadCode,
    openCloudArchive,
    closeCloudArchive
  };
}