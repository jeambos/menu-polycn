/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('daisyui'),
  ],
  // --- 新增以下配置 ---
  daisyui: {
    themes: ["black", "synthwave"], // 第一个是默认主题
  },
}