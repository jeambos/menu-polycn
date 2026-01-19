import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate' // ✅ 引入插件
import './style.css' // 假设你有样式文件，如果没有请忽略这一行
import App from './App.vue'
import router from './router'

const app = createApp(App)
const pinia = createPinia()

// ✅ 注册持久化插件
pinia.use(piniaPluginPersistedstate)

app.use(pinia)
app.use(router)

app.mount('#app')