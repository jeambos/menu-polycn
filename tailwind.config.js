/** @type {import('tailwindcss').Config} */
export default {
  // 1. 扫描文件
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // 2. 字号覆写 (保持你喜欢的“大字号、高可读性”设置)
      fontSize: {
        'xs': ['0.85rem', { lineHeight: '1.2rem' }], 
        'sm': ['0.95rem', { lineHeight: '1.4rem' }], 
        'base': ['1.05rem', { lineHeight: '1.75rem' }], 
        'lg': ['1.25rem', { lineHeight: '1.75rem' }],
        'xl': ['1.5rem', { lineHeight: '2rem' }],
        '2xl': ['1.75rem', { lineHeight: '2.25rem' }],
      },
      spacing: {
        '128': '32rem',
      }
    },
  },
  // 3. 插件
  plugins: [require("daisyui")],

  // 4. DaisyUI 配置
  daisyui: {
    //在这里我们不再尝试 require 内部文件，而是直接定义
    themes: [
      {
        // --- 🌞 浅色主题 (Light) ---
        // 这是一个自洽的温润主题配置
        light: {
          "primary": "#4F46E5",   // 靛蓝
          "secondary": "#EC4899", // 玫粉
          "accent": "#06B6D4",    // 青色
          "neutral": "#2a323c",   // 中性灰
          
          "base-100": "#fcfcfc",  // 极淡暖白背景
          "base-200": "#f3f4f6",  // 浅灰
          "base-300": "#e5e7eb",  // 边框
          "base-content": "#1f2937", // 正文深灰
          
          "info": "#3ABFF8",
          "success": "#10b981",   // 翡翠绿
          "warning": "#f59e0b",   // 琥珀黄
          "error": "#ef4444",     // 鲜红
          
          // 圆角设置
          "--rounded-box": "1rem", 
          "--rounded-btn": "0.5rem",
          "--rounded-badge": "1.9rem",
          "--animation-btn": "0.25s",
          "--animation-input": "0.2s",
          "--btn-focus-scale": "0.95",
          "--border-btn": "1px",
          "--tab-border": "1px",
          "--tab-radius": "0.5rem",
        },
      },
      {
        // --- 🌚 深色主题 (Dark) ---
        dark: {
          "primary": "#6366f1",
          "secondary": "#d926a9",
          "accent": "#1fb2a6",
          "neutral": "#2a323c",
          
          "base-100": "#1e1e2e",  // 深蓝灰背景
          "base-200": "#181825",
          "base-300": "#11111b",
          "base-content": "#dce0e8", // 灰白文字
          
          "info": "#3abff8",
          "success": "#2dd4bf",
          "warning": "#fcd34d",
          "error": "#ff8080",
          
          "--rounded-box": "1rem", 
          "--rounded-btn": "0.5rem",
          "--rounded-badge": "1.9rem",
          "--animation-btn": "0.25s",
          "--animation-input": "0.2s",
          "--btn-focus-scale": "0.95",
          "--border-btn": "1px",
          "--tab-border": "1px",
          "--tab-radius": "0.5rem",
        },
      },
    ],
    darkTheme: "dark",
    base: true,
    styled: true,
    utils: true,
    prefix: "",
    logs: false,
  },
}