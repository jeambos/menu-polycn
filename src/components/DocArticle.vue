<template>
  <article class="prose prose-slate prose-sm max-w-none bg-slate-50 rounded-2xl p-6 border border-slate-100 text-left">
    
    <h3>👋 关于 PolyCN</h3>
    <p>
      这里可以放置您的介绍文案。比如：
      <strong>PolyCN</strong> 是一个探索亲密关系源代码的工具...
    </p>

    <h4>🛠 使用指南</h4>
    <ul>
      <li>单人模式：分析自我...</li>
      <li>双人模式：寻找共鸣...</li>
    </ul>

    <blockquote>
      "引用一段富有哲理的话..."
    </blockquote>

  </article>
</template>

<style scoped>
/* 简单的排版微调，让它看起来更像文档 */
.prose h3 { @apply text-lg font-bold text-slate-800 mb-3 mt-0; }
.prose h4 { @apply text-base font-bold text-slate-700 mb-2 mt-4; }
.prose p { @apply text-slate-600 mb-3 leading-relaxed; }
.prose ul { @apply list-disc list-inside text-slate-600 mb-3 pl-2; }
.prose strong { @apply text-slate-900; }
.prose blockquote { @apply border-l-4 border-slate-300 pl-4 italic text-slate-500 my-4; }
</style>