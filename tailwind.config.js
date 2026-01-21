/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    // 强制把这个新主题设为暗黑模式的 fallback（防止系统深色模式捣乱）
    darkTheme: "vitality", 
    themes: [
      {
        // 🔥 自定义主题名：vitality
        vitality: {
          "primary": "#ff7300",   
          "primary-content": "#ffffff", 

          "secondary": "#ffbf00", 
          "accent": "#fde047",    
          "neutral": "#1c1917",   
          "neutral-content": "#ffffff",

          "base-100": "#ffffff", 
          "base-200": "#f5f5f4", 
          "base-300": "#e7e5e4",  
          "base-content": "#1c1917", 

          "info": "#3ABFF8",
          "success": "#10b981",   
          "warning": "#f59e0b",   
          "error": "#ef4444",     

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
  },
}