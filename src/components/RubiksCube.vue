<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

// --- 低饱和度莫兰迪配色 ---
const colors = {
  F: '#E5989B', // Muted Pink
  B: '#F4A261', // Muted Orange
  R: '#8ECAE6', // Muted Blue
  L: '#84A98C', // Sage Green
  U: '#F4F1DE', // Cream
  D: '#495057', // Charcoal
};

// --- 状态管理 ---
// 仅控制三层 (上中下) 的水平旋转
const layerRotations = ref([0, 0, 0]); 
let layerInterval: number | null = null;

// --- 动画逻辑 ---
function rotateLayer() {
  // 随机选择一层 (0, 1, 2)
  const layerIndex = Math.floor(Math.random() * 3);
  // 随机顺时针或逆时针
  const direction = Math.random() > 0.5 ? 90 : -90;
  
  layerRotations.value[layerIndex] += direction;
}

onMounted(() => {
  // 每 2.5 秒转动一次内部，慢一点显得优雅
  layerInterval = window.setInterval(rotateLayer, 2500);
  setTimeout(rotateLayer, 500);
});

onUnmounted(() => {
  if (layerInterval) clearInterval(layerInterval);
});
</script>

<template>
  <div class="cube-scene">
    <div class="cube-wrapper">
      
      <div 
        v-for="(angle, index) in layerRotations" 
        :key="index"
        class="cube-layer"
        :style="{ 
          // 36px 是单层高度 + 间隙
          transform: `translateY(${(index - 1) * 36}px) rotateY(${angle}deg)`,
          // 关键修复：给中间层更低的 z-index，防止透视 Bug
          zIndex: index === 1 ? 1 : 2 
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
/* 魔方整体大小由此控制 */
:root {
  --cube-size: 100px; /* 单个面的宽度 */
  --layer-h: 34px;    /* 单层高度 */
  --gap: 2px;         /* 贴纸间隙 */
}

/* --- 场景容器 --- */
.cube-scene {
  width: 140px;  /* 容器宽度 */
  height: 140px; /* 容器高度 */
  perspective: 1000px; /* 透视深度 */
  margin-bottom: 20px;
}

.cube-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  /* 这里的动画让魔方整体在空间中缓慢翻滚 */
  animation: auto-tumble 12s infinite linear;
}

/* 优雅的整体翻滚动画：绕X轴和Y轴同时旋转 */
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
  width: 100px; /* 宽度加大 */
  height: 34px; /* 高度加大 */
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
  background: #18181b; /* Zinc-900 黑色基底 */
  border: 1px solid #18181b;
  backface-visibility: hidden; /* 关键：防止背面闪烁 */
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

/* 内部盖板 (纯黑) */
.face.inner-cap {
  width: 100px;
  height: 100px;
  background: #000;
  padding: 0;
}

/* --- 面的 3D 位置变换 (基于宽100px -> 半径50px) --- */
.front  { transform: translateZ(50px); }
.back   { transform: rotateY(180deg) translateZ(50px); }
.right  { transform: rotateY(90deg) translateZ(50px); }
.left   { transform: rotateY(-90deg) translateZ(50px); }
.top    { transform: rotateX(90deg) translateZ(50px); }
.bottom { transform: rotateX(-90deg) translateZ(50px); }

/* 内部盖板位置 (稍微向内收一点点 16px，避免接触) */
.top-cap    { transform: rotateX(90deg) translateZ(16px); }
.bottom-cap { transform: rotateX(-90deg) translateZ(16px); }

/* --- 贴纸 --- */
.sticker {
  width: 100%;
  height: 100%;
  background-color: var(--c);
  border-radius: 4px; /* 更圆润一点 */
  /* 内发光增加质感 */
  box-shadow: inset 0 0 6px rgba(0,0,0,0.1); 
}
</style>