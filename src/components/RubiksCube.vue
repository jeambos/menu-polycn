<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

// 方案 D：多汁果味 (同色系渐变)
const colors = {
  F: '#FDBA74', // 杏色 (Orange-300)
  B: '#FFFBEB', // 象牙白 (Amber-50)
  R: '#C2410C', // 血橙 (Orange-700)
  L: '#FCD34D', // 柠檬黄 (Amber-300)
  U: '#FB923C', // 甜橙 (Orange-400)
  D: '#9A3412', // 焦糖褐 (Orange-900)
};

// --- 状态管理 ---
const layerRotations = ref([0, 0, 0]); 
const isManual = ref(false); // 是否处于手动模式
const isPressed = ref(false); // 是否处于按压状态

let layerInterval: number | null = null; // 自动巡航定时器
let cooldownTimer: number | null = null; // 手动冷却定时器

// --- 旋转逻辑 ---
function rotateLayer() {
  const layerIndex = Math.floor(Math.random() * 3);
  const direction = Math.random() > 0.5 ? 90 : -90;
  
  if (layerRotations.value[layerIndex] !== undefined) {
    layerRotations.value[layerIndex] += direction;
  }
}

// --- 模式控制 ---
// 1. 启动自动巡航 (慢速、优雅)
function startAutoCruise() {
  isManual.value = false; // 恢复慢速动画，并恢复整体翻滚
  if (layerInterval) clearInterval(layerInterval);
  
  // 每 2.5 秒转动一次
  layerInterval = window.setInterval(rotateLayer, 2500);
}

// 2. 用户交互 (手动模式)
function handleInteract() {
  // A. 视觉反馈：按下缩放
  isPressed.value = true;
  setTimeout(() => isPressed.value = false, 150);

  // B. 状态切换：进入手动模式
  isManual.value = true; // ⛔️ 这会让 CSS 动画暂停
  if (layerInterval) clearInterval(layerInterval); // 停止自动层转动
  if (cooldownTimer) clearTimeout(cooldownTimer);  // 清除之前的冷却

  // C. 执行动作：立即转动
  rotateLayer();

  // D. 冷却归位：0.75秒后无操作则恢复自动
  cooldownTimer = window.setTimeout(() => {
    startAutoCruise();
  }, 750);
}

onMounted(() => {
  startAutoCruise();
});

onUnmounted(() => {
  if (layerInterval) clearInterval(layerInterval);
  if (cooldownTimer) clearTimeout(cooldownTimer);
});
</script>

<template>
  <div 
    class="cube-scene"
    @click="handleInteract"
    @mousedown="handleInteract"
    :style="{
      cursor: 'pointer',
      transition: 'transform 0.1s ease-out',
      transform: isPressed ? 'scale(0.95)' : 'scale(1)'
    }"
  >
    <div 
      class="cube-wrapper"
      :style="{ animationPlayState: isManual ? 'paused' : 'running' }"  
    >
      
      <div 
        v-for="(angle, index) in layerRotations" 
        :key="index"
        class="cube-layer"
        :style="{ 
          transform: `translateY(${(index - 1) * 36}px) rotateY(${angle}deg)`,
          zIndex: index === 1 ? 1 : 2,
          // 手动模式下 0.2s 快速响应，自动模式下 0.6s 慢速优雅
          transitionDuration: isManual ? '0.2s' : '0.6s'
        }"
      >
        <div class="face front" :style="{ '--c': colors.F }">
          <div class="sticker"></div><div class="sticker"></div><div class="sticker"></div>
        </div>
        <div class="face back" :style="{ '--c': colors.B }">
          <div class="sticker"></div><div class="sticker"></div><div class="sticker"></div>
        </div>
        <div class="face right" :style="{ '--c': colors.R }">
          <div class="sticker"></div><div class="sticker"></div><div class="sticker"></div>
        </div>
        <div class="face left" :style="{ '--c': colors.L }">
          <div class="sticker"></div><div class="sticker"></div><div class="sticker"></div>
        </div>
        
        <div v-if="index === 0" class="face top" :style="{ '--c': colors.U }">
          <div class="sticker"></div><div class="sticker"></div><div class="sticker"></div>
          <div class="sticker"></div><div class="sticker"></div><div class="sticker"></div>
          <div class="sticker"></div><div class="sticker"></div><div class="sticker"></div>
        </div>
        
        <div v-if="index === 2" class="face bottom" :style="{ '--c': colors.D }">
          <div class="sticker"></div><div class="sticker"></div><div class="sticker"></div>
          <div class="sticker"></div><div class="sticker"></div><div class="sticker"></div>
          <div class="sticker"></div><div class="sticker"></div><div class="sticker"></div>
        </div>
        
        <div v-if="index !== 0" class="face inner-cap top-cap"></div>
        <div v-if="index !== 2" class="face inner-cap bottom-cap"></div>

      </div>
    </div>
  </div>
</template>

<style scoped>
/* --- 配置参数 --- */
:root {
  --cube-size: 100px; 
  --layer-h: 34px;    
  --gap: 2px;         
}

/* --- 场景容器 --- */
.cube-scene {
  width: 140px;  
  height: 140px; 
  perspective: 1000px; 
  margin-bottom: 100px;
}

.cube-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  /* auto-tumble 动画现在会响应 animationPlayState 
    被暂停时，魔方会停在当前的空中角度
  */
  animation: auto-tumble 12s infinite linear;
}

/* 整体翻滚动画 */
@keyframes auto-tumble {
  0% { transform: rotateX(-20deg) rotateY(0deg); }
  25% { transform: rotateX(-35deg) rotateY(90deg); }
  50% { transform: rotateX(-20deg) rotateY(180deg); }
  75% { transform: rotateX(-5deg) rotateY(270deg); }
  100% { transform: rotateX(-20deg) rotateY(360deg); }
}

/* --- 切片层 --- */
.cube-layer {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100px; 
  height: 34px; 
  margin-left: -50px;
  margin-top: -17px;
  transform-style: preserve-3d;
  transition: transform 0.6s cubic-bezier(0.4, 0.0, 0.2, 1);
}

/* --- 面 (Faces) --- */
.face {
  position: absolute;
  display: grid;
  gap: 3px;
  background: #18181b; 
  border: 1px solid #18181b;
  backface-visibility: hidden; 
}

/* 侧面布局 */
.face.front, .face.back, .face.right, .face.left {
  width: 100px;
  height: 34px;
  grid-template-columns: repeat(3, 1fr);
  padding: 2px;
}

/* 顶面底面布局 */
.face.top, .face.bottom {
  width: 100px;
  height: 100px;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  padding: 2px;
}

/* 内部盖板 */
.face.inner-cap {
  width: 100px;
  height: 100px;
  background: #000;
  padding: 0;
}

/* --- 面的 3D 位置变换 --- */
.front  { transform: translateZ(50px); }
.back   { transform: rotateY(180deg) translateZ(50px); }
.right  { transform: rotateY(90deg) translateZ(50px); }
.left   { transform: rotateY(-90deg) translateZ(50px); }
.top    { transform: rotateX(90deg) translateZ(50px); }
.bottom { transform: rotateX(-90deg) translateZ(50px); }

.top-cap    { transform: rotateX(90deg) translateZ(16px); }
.bottom-cap { transform: rotateX(-90deg) translateZ(16px); }

/* --- 贴纸 --- */
.sticker {
  width: 100%;
  height: 100%;
  background-color: var(--c);
  border-radius: 4px; 
  box-shadow: inset 0 0 6px rgba(0,0,0,0.1); 
}
</style>