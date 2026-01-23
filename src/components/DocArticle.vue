<template>
  <article class="prose prose-lg prose-slate max-w-none text-base-content/90">

    <div class="flex justify-center my-12 px-6">
  <a 
    href="https://polycn.org" 
    target="_blank"
    class="group w-full max-w-xl py-8 flex flex-col items-center justify-center gap-4 border-4 border-primary rounded-[2rem] bg-transparent transition-all duration-300 hover:bg-primary/5 hover:scale-[1.01] active:scale-95"
  >
    <i-ph-cube-duotone class="text-4xl text-primary group-hover:opacity-100 transition-opacity" />
    <sup class="text-[14px] font-bold tracking-normal opacity-40 px-1 py-0.5 border border-black/10 rounded ml-1 bg-slate-50 uppercase leading-none dark:text-white/80 dark:border-white/10 dark:bg-slate-800 ">
    v0.72 
  </sup>
    
    <div class="text-center">
      <p class="text-xl font-black text-base-content/90">
        关系配置单是 PolyCN 的作品
      </p>
      <p class="text-sm font-bold text-primary/80 group-hover:text-primary transition-colors mt-1 uppercase tracking-widest">
        点此跳转主站：polycn.org
      </p>
    </div>
  </a>
</div> 
        
    <h2 class="text-primary dark:text-orange-400 border-b border-primary/10 pb-2">关系配置单是什么？</h2>
    <p>你好！</p>
    <p>如果你也厌倦了整齐划一的社会剧本，欢迎来到 DIY Relationship（关系配置单）。</p>
    <p>这是一个可以适用于所有友情和亲密关系、帮助大家探索需求和边界的自助工具。</p>
    <p>你需要做的就是：标记自己的态度。</p>
    <p>我们编制了10个模块，覆盖97个场景，561个小项，其中一定有你在乎的事情。</p>
    <p>我们对你的配置结果<strong class="text-primary/75 dark:text-orange-300">不做任何评价</strong>，只有一条可爱的 Emoji 结果代码，您可以分享给任何人查看，或者<strong class="text-primary/75 dark:text-orange-300">请AI出具分析报告（功能开发中）</strong>。</p>

    <h2 class="text-primary dark:text-orange-400 border-b border-primary/10 pb-2">如何答题（重要！）</h2>
    <p>每一个场景下有若干小项，您可以对每一个小项表态：</p>
    <ul class="list-disc pl-5 space-y-1">
      <li><strong class="text-primary/75 dark:text-orange-300">不表态（跳过不选）</strong>：无所谓/没感觉/暂时不考虑这件事</li>
      <li><strong class="text-primary/75 dark:text-orange-300">硬性边界</strong>：绝对不行/分手警告</li>
      <li><strong class="text-primary/75 dark:text-orange-300">不确定 /看条件</strong>：可能行，也可能不行，具体情况双方对话沟通</li>
      <li><strong class="text-primary/75 dark:text-orange-300">同意/接受</strong>：接受/可以，具体程度可商量</li>
      <li><strong class="text-primary/75 dark:text-orange-300">核心需求</strong>：必需品/快乐源泉</li>
    </ul>

    <p><strong class="text-primary/75 dark:text-orange-300">为什么没有“不行/不喜欢”？ </strong></p>
    <ul class="list-disc pl-5 space-y-1">
      <li>比起喜欢和不喜欢，我们更在意的是接受和不接受。</li>
      <li>如果讨厌或者喜欢<strong class="text-primary/75 dark:text-orange-300">不能接受对方与自己相反</strong>的程度，请选“<strong class="text-primary/75 dark:text-orange-300">硬边界</strong>”（红色×）或者“<strong class="text-primary/75 dark:text-orange-300">核心需求</strong>”（金色五角星）</li>
      <li>如果喜欢/讨厌程度是在中间的灰色地带，请在<strong class="text-primary/75 dark:text-orange-300">不确定/看条件</strong>、和<strong class="text-primary/75 dark:text-orange-300">同意/接受</strong>之间选一个。</li>
    </ul>

    <h2 class="text-primary dark:text-orange-400 border-b border-primary/10 pb-2">功能介绍</h2>

    <h4 class="text-primary/80 text-lg font-bold mt-6 mb-2">首页</h4>
    <p>这里是欢迎页。您可以在这里</p>
    <ul class="list-disc pl-5 space-y-1">
      <li>进入配置单页面</li>
      <li>粘贴自己的代码，<strong class="text-primary/75 dark:text-orange-300">继续做题</strong>或者<strong class="text-primary/75 dark:text-orange-300">直接查看结果</strong></li>
      <li>粘贴两份代码，对比查看。<strong class="text-primary/75 dark:text-orange-300">建议两人同时在场的时候进行对比</strong>，这样可以当面认真聊天。</li>
    </ul>

    <h4 class="text-primary/80 text-lg font-bold mt-6 mb-2">配置单页面</h4>
    <p>您需要根据自己的需求选择模块，然后进入做题页面。</p>
    <ul class="list-disc pl-5 space-y-1">
      <li>在这里<strong class="text-primary/75 dark:text-orange-300">为你的假想目标选择头像</strong>（默认头像是地球，意思是不针对任何人） 。我们对每个人的需求和边界都可能是不一样的。</li>
      <li>针对你假想的关系选择组合套餐（也可以不选）</li>
      <li>按下模块卡片可以预览本模块的场景清单。</li>
    </ul>

    <h4 class="text-primary/80 text-lg font-bold mt-6 mb-2">做题页面</h4>
    <p>这是本系统的主体，您在这里对您所选的模块中的各个场景表明态度。</p>
    <ul class="list-disc pl-5 space-y-1">
      <li><strong class="text-primary/75 dark:text-orange-300">不选也是态度</strong>，可以跳过</li>
      <li>每页推荐只<strong class="text-primary/75 dark:text-orange-300">选1-2个核心需求</strong>，太多了没有实际意义</li>
      <li>随时可以暂停。进度自动保存至浏览器缓存，您也可以在底部手动保存并复制结果代码，之后再回来接续完成。</li>
    </ul>

    <h4 class="text-primary/80 text-lg font-bold mt-6 mb-2">★ 做题心法</h4>
    <ul class="list-disc pl-5 space-y-1">
      <li><strong class="text-primary/75 dark:text-orange-300">区分【愿望】与【底线】</strong>：请点选你现实中 <strong class="text-primary/75 dark:text-orange-300">“实际能接受”</strong> 的程度，而不是自己的愿望。</li>
      <li><strong class="text-primary/75 dark:text-orange-300">光谱型表态</strong>：有些场景列出的事件，严重程度是层层递进的，你可以按照你的接受范围为它们标记不同的态度，并非只能选择其一。</li>
      <li><strong class="text-primary/75 dark:text-orange-300">允许内心冲突</strong>：人生不是非黑即白的。某些选项看似互斥，但如果你都很在意，可以都选。</li>
    </ul>

    <h4 class="text-primary/80 text-lg font-bold mt-6 mb-2">结果页和对比页</h4>
    <p>这里是您所有结果的展示页、或者两人结果的对比展示页</p>
    <ul class="list-disc pl-5 space-y-1">
      <li><strong class="text-primary/75 dark:text-orange-300">按态度分区</strong>，您可以清楚地看到自己或者他人（可以读取任何人的代码）的核心需求和硬性边界等</li>
      <li>我们为您提供一条<strong class="text-primary/75 dark:text-orange-300">Emoji代码</strong>，可以发送给任何人查看，也可以自己保存。</li>
      <li><strong class="text-primary/75 dark:text-orange-300">数据安全提示</strong>：我们是一个静态站，<strong class="text-primary/75 dark:text-orange-300">不存储您的任何结果</strong>。请妥善保存您的结果代码。</li>
      <li>请注意：这条Emoji代码<strong class="text-primary/75 dark:text-orange-300">无容错机制</strong>，请确定您保存的代码无误，如误删了其中内容，或者粘贴不完整，系统将显示错误的结果。</li>
    </ul>

    <h4 class="text-primary/80 text-lg font-bold mt-6 mb-2">右上角菜单</h4>
    <p>这里是一个简单的控制中心，您可以在这里</p>
    <ul class="list-disc pl-5 space-y-1">
      <li>切换夜间模式</li>
      <li>切换字号</li>
      <li>查看 / 删除浏览器缓存中的问卷信息</li>
      <li>备份数据</li>
      <li>清空数据</li>
      <li>返回首页</li>
    </ul>

    <h2 class="text-primary dark:text-orange-400 border-b border-primary/10 pb-2">目前不考虑做的功能</h2>
    <ul class="list-disc pl-5 space-y-1">
      <li><strong class="text-primary/75 dark:text-orange-300">帐号系统</strong>：我们是静态站，无法实现此功能。</li>
      <li><strong class="text-primary/75 dark:text-orange-300">结果页生产长图</strong>：这项功能比较费您的系统资源，而且不同的浏览器对这一功能支持程度不一，待我学习一下，能确保效果再做。</li>
      <li><strong class="text-primary/75 dark:text-orange-300">短口令</strong>：短口令并不是压缩算法，而是对服务器上保存的资料提供的编号。我们是静态站，无法保存您的资料并对其编号。</li>
      <li><strong class="text-primary/75 dark:text-orange-300">个性化分析报告</strong>：这需要提前撰写天量的文案，并根据测试数据的细微差异进行排列组合。开发者表示自己精力有限。</li>
      <li><strong class="text-primary/75 dark:text-orange-300">AI分析</strong>：为了弥补没有分析报告的遗憾，本站会给您生成一份提示词和结果文本，您拿给自己信得过的AI，粘贴进去让它给您生产一份报告。<strong class="text-primary/75 dark:text-orange-300">为什么不自己内嵌AI？</strong>因为注册国内的AI服务商，拿到它们的API，需要交出我的实名手机号。然后为了防范滥用，您也需要在本站注册，交出您的手机号（收验证码），这太麻烦了，遂放弃。</li>
    </ul>

    <h2 class="text-primary dark:text-orange-400 border-b border-primary/10 pb-2">关于我们</h2>
    <p>PolyCN（中文多元关系文库）是致力于<strong class="text-primary/75 dark:text-orange-300">汇集多元亲密关系的思考与实践</strong>的文库型站点，旨在为开放关系、多边恋、关系安那其、酷儿柏拉图关系等<strong class="text-primary/75 dark:text-orange-300">非主流关系模式</strong>的人群提供资源。</p>

    <p>目前收集了《道德浪女》（三种中文版）、《超越单偶制的世界》（独家中文版）、《Polysecure》等经典非单偶制书籍。</p>

    <p>本站还有独家的关系形态倾向测试、复杂关系适应力评估、开放关系准备度测试、嫉妒类型测试等互动问卷。</p>

    <p>本站建立于2025年12月，还很年轻，非常需要大家的支持！资料不全还请大家海涵！</p>

    <p>本配置单系统由 Jeambo 原创，并首发于 PolyCN。</p>

    <p>本站内容（问卷设计、题目文本说明文案、Logo 设计等，含 src\data\questions.json）采用 CC BY-NC-SA 4.0 协议。您可以自由复制、发性本作品，可以修改、转换或以本作品为基础进行创作，但是不得用于商业目的，必须署名（PolyCN），且不得更改许可协议（这意味着您的衍生作品也必须允许他人复制和修改）</p>

    <p>本站代码开源在 <a href="https://github.com/jeambos/menu-polycn" target="_blank" >github.com/jeambos/menu-polycn</a>，采用 MIT 许可证。</p>

    <p>关于配置单系统，有任何修改意见，请通过以下渠道反馈，谢谢！</p>

    <div class="flex flex-wrap gap-4 mt-6 mb-6">
      <a href="https://polycn.org" target="_blank" class="btn btn-sm btn-outline btn-primary">访问PolyCN</a>
      <a href="https://t.me/polycn" target="_blank" class="btn btn-sm btn-outline btn-primary">加入电报频道</a>
      <a href="https://x.com/polycn_org" target="_blank" class="btn btn-sm btn-outline btn-primary">在 X.com 关注本站</a>
    </div>

    

    <p class="text-sm opacity-60 mt-8 pt-4 border-t border-base-content/10">
      👇 文档已结束，您无需回到首页，可以从这里开始 👇
    </p>


  </article>
</template>

<style scoped>
/* 针对 prose 内部元素的样式微调 */
h2 {
  @apply text-2xl font-bold mt-10 mb-6;
}
p {
  @apply mb-4 leading-relaxed;
}
ul {
  @apply mb-6;
}
li {
  @apply mb-1;
}
</style>