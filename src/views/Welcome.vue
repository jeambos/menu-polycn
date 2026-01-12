<template>
  <div class="hero min-h-[70vh] bg-base-100">
    <div class="hero-content text-center">
      <div class="max-w-md">
        <div class="text-6xl mb-4 animate-bounce">🧬</div>
        
        <h1 class="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
          关系配置单
        </h1>
        <p class="py-6 text-lg opacity-80">
          不像谈恋爱的恋爱，<br/>
          像装电脑一样组装你的亲密关系。
        </p>

        <div class="flex flex-col gap-4 items-center w-full">
          
          <router-link 
            to="/setup" 
            class="btn btn-primary btn-lg w-full max-w-xs shadow-xl hover:scale-105 transition-transform"
          >
            🚀 开始配置
          </router-link>

          <div class="divider text-xs opacity-50 px-10 w-full">或者</div>

          <div class="flex flex-row gap-3 w-full justify-center">
            <router-link 
              to="/compare" 
              class="btn btn-outline btn-secondary flex-1 max-w-[140px]"
            >
              ⚔️ 双人对比
            </router-link>
            
            <router-link 
              to="/import" 
              class="btn btn-outline flex-1 max-w-[140px]"
            >
              🔍 解读代码
            </router-link>
          </div>
          
        </div>

        <div class="mt-12 text-xs opacity-30">
          Core v5.0 | App v1.0
        </div>
      </div>
    </div>
  </div>
</template>