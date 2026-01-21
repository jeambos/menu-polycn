<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

// --- 低饱和度配色方案 (Morandi Palette) ---
// F(前): 玫瑰粉, B(后): 蜜桃橘, R(右): 雾霾蓝, L(左): 鼠尾草绿, U(上): 奶油白, D(下): 高级灰
const colors = {
  F: '#E5989B', // Muted Pink
  B: '#F4A261', // Muted Orange
  R: '#8ECAE6', // Muted Blue
  L: '#84A98C', // Sage Green
  U: '#F4F1DE', // Cream
  D: '#495057', // Charcoal
};

// --- 状态管理 ---
const rotations = ref([0, 0, 0]); // 存储三层 (上中下) 的旋转角度 [y1, y2, y3]
let intervalId: number | null = null;

// --- 动画逻辑 ---
function randomRotate() {
  // 1. 随机选择一层 (0: Top, 1: Mid, 2: Bot)
  const layerIndex = Math.floor(Math.random() * 3);
  
  // 2. 随机决定顺时针还是逆时针 (90度 或 -90度)
  const direction = Math.random() > 0.5 ? 90 : -90;
  
  // 3. 更新该层的角度
  rotations.value[layerIndex] += direction;
}

onMounted(() => {
  // 启动随机旋转循环 (每2.5秒转一次，慢一点更优雅)
  intervalId = window.setInterval(randomRotate, 2500);
  
  // 初始化先转一下，避免太死板
  setTimeout(randomRotate, 500);
});

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId);
});
</script>

<template>
  <div class="cube-container">
    <div class="cube-wrapper">
      
      <div 
        v-for="(angle, index) in rotations" 
        :key="index"
        class="cube-layer"
        :style="{ 
          transform: `translateY(${(index - 1) * 22}px) rotateY(${angle}deg)`,
          zIndex: 2 - index 
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
        
        <div v-if="index !== 0" class="face inner-top"></div>
        <div v-if="index !== 2" class="face inner-bottom"></div>

      </div>
    </div>
  </div>
</template>

<style scoped>
/* --- 容器与透视 --- */
.cube-container {
  width: 100px;
  height: 100px;
  perspective: 800px;
  /* 整体微调位置 */
  margin-bottom: 20px;
}

.cube-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  /* 整体自带一个优雅的倾斜角度，展示立体感 */
  transform: rotateX(-25deg) rotateY(-30deg);
  animation: float-rotate 20s infinite linear;
}

/* 整体缓慢自转，展示所有面 */
@keyframes float-rotate {
  0% { transform: rotateX(-25deg) rotateY(-30deg); }
  50% { transform: rotateX(-25deg) rotateY(-50deg); }
  100% { transform: rotateX(-25deg) rotateY(-30deg); }
}

/* --- 切片层 (Layers) --- */
.cube-layer {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 60px; /* 魔方宽度 */
  height: 20px; /* 单层高度 */
  margin-left: -30px;
  margin-top: -10px;
  transform-style: preserve-3d;
  transition: transform 0.6s cubic-bezier(0.4, 0.0, 0.2, 1); /* 丝滑转动 */
}

/* --- 面 (Faces) --- */
.face {
  position: absolute;
  display: grid;
  gap: 2px;
  background: #1e1e1e; /* 黑色塑料基底 */
  border: 1px solid #1e1e1e;
  /* 默认背面不可见，防止视觉干扰 */
  backface-visibility: hidden; 
}

/* 侧面贴纸布局: 1行3列 */
.face.front, .face.back, .face.right, .face.left {
  width: 60px;
  height: 20px;
  grid-template-columns: repeat(3, 1fr);
  padding: 1px;
}

/* 顶面底面贴纸布局: 3行3列 */
.face.top, .face.bottom {
  width: 60px;
  height: 60px;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  padding: 1px;
}

/* --- 面的位置变换 --- */
.front  { transform: translateZ(30px); }
.back   { transform: rotateY(180deg) translateZ(30px); }
.right  { transform: rotateY(90deg) translateZ(30px); }
.left   { transform: rotateY(-90deg) translateZ(30px); }
.top    { transform: rotateX(90deg) translateZ(30px); }
.bottom { transform: rotateX(-90deg) translateZ(30px); }

/* 内部补肉层 */
.inner-top { 
  width: 60px; height: 60px; background: #000; 
  transform: rotateX(90deg) translateZ(10px); 
}
.inner-bottom { 
  width: 60px; height: 60px; background: #000; 
  transform: rotateX(-90deg) translateZ(10px); 
}

/* --- 贴纸 (Stickers) --- */
.sticker {
  width: 100%;
  height: 100%;
  background-color: var(--c);
  border-radius: 2px; /* 小圆角，增加精致感 */
  /* 给贴纸加一点内阴影，增加质感 */
  box-shadow: inset 0 0 2px rgba(0,0,0,0.2); 
}
</style>