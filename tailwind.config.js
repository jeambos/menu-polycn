import daisyui from 'daisyui'

/** @type {import('tailwindcss').Config} */
export default {
  // 1. 扫描文件范围
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  
  // 2. 暗黑模式策略
  // 支持通过 class 或 data-theme 属性手动切换
  // 同时 DaisyUI 会自动根据系统偏好应用 darkTheme 设置
  darkMode: ['class', '[data-theme="dark"]'],

  theme: {
    extend: {
      // 3. 字体栈 (Typography) - 中文环境优先
      // 优先调用系统自带的高质量黑体
      fontFamily: {
        sans: [
          'PingFang SC',      // iOS/Mac 中文首选
          'Hiragino Sans GB', // Mac 旧版兼容
          'Microsoft YaHei',  // Windows 微软雅黑
          'Inter',            // 现代西文数字
          'Roboto',           // Android
          'Helvetica Neue',   // 经典西文
          'Arial', 
          'sans-serif'
        ],
      },
      // 4. 字号覆写 (保留您原有的高可读性设置)
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

  // 5. 插件列表 (ESM 导入方式)
  plugins: [
    daisyui,
  ],

  // 6. DaisyUI 深度定制 (v4 语法)
  daisyui: {
    themes: [
      {
        // --- 🌞 浅色主题 (Light: Vitality Orange) ---
        light: {
          "primary": "#eb781a",   // 🔥 活力橙
          "primary-content": "#ffffff", 

          "secondary": "#ffbf00", // 🌻 琥珀金
          "accent": "#fde047",    // 🍋 柠檬黄
          "neutral": "#1c1917",   // 🪨 暖黑 (Stone-900)
          "neutral-content": "#ffffff",
          
          "base-100": "#ffffff",  // 纯白卡片
          "base-200": "#f5f5f4",  // 暖灰背景 (Stone-100)
          "base-300": "#e7e5e4",  // 边框色
          "base-content": "#1c1917", // 正文色
          
          "info": "#3ABFF8",
          "success": "#10b981",   
          "warning": "#f59e0b",   
          "error": "#ef4444",     
          
          // --- 物理手感与形态 ---
          "--rounded-box": "1.2rem",   // ✅ 加大圆角
          "--rounded-btn": "0.6rem",   // ✅ 按钮圆角
          "--rounded-badge": "1.9rem", 
          "--animation-btn": "0.1s",   // ✅ 极速响应
          "--animation-input": "0.2s", 
          "--btn-focus-scale": "0.98", // ✅ 微缩放
          "--border-btn": "1px",
          "--tab-border": "1px",
          "--tab-radius": "0.5rem",
        },
      },
      {
        // --- 🌚 深色主题 (Dark: Black Gold Warmth) ---
        dark: {
          "primary": "#ff7300",   // 保持活力橙
          "primary-content": "#ffffff",
          
          "secondary": "#ffbf00", 
          "accent": "#fde047",
          "neutral": "#292524",   // 浅暖灰
          "neutral-content": "#ffffff",
          
          "base-100": "#1c1917",  // 🌑 暖黑背景 (Stone-900)
          "base-200": "#0c0a09",  // 🌌 深邃黑 (Stone-950)
          "base-300": "#000000",  
          "base-content": "#e7e5e4", // 暖灰白文字
          
          "info": "#3abff8",
          "success": "#2dd4bf",
          "warning": "#fcd34d",
          "error": "#ff8080",
          
          // 保持一致的物理手感
          "--rounded-box": "1.2rem", 
          "--rounded-btn": "0.6rem",
          "--rounded-badge": "1.9rem",
          "--animation-btn": "0.1s",
          "--animation-input": "0.2s",
          "--btn-focus-scale": "0.98",
          "--border-btn": "1px",
          "--tab-border": "1px",
          "--tab-radius": "0.5rem",
        },
      },
    ],
    // 自动跟随系统策略：如果系统是 dark，自动应用名为 "dark" 的主题
    darkTheme: "dark", 
    base: true,
    styled: true,
    utils: true,
    prefix: "",
    logs: false,
  },
}