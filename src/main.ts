import { createApp } from 'vue'
import { createPinia } from 'pinia' // 1. 引入 Pinia
import './style.css'
import App from './App.vue'

const pinia = createPinia() // 2. 创建实例
const app = createApp(App)

app.use(pinia) // 3. 挂载到 App
app.mount('#app')