import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import router from './router'

// ✅ 1. 引入 auto-animate
import { autoAnimatePlugin } from '@formkit/auto-animate/vue'

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

const app = createApp(App)

app.use(pinia)
app.use(router)

// ✅ 2. 注册插件
app.use(autoAnimatePlugin)

app.mount('#app')