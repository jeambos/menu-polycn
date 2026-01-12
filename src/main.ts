import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router' // 1. 引入路由
import './style.css'
import App from './App.vue'

const pinia = createPinia()
const app = createApp(App)

app.use(pinia)
app.use(router) // 2. 挂载路由
app.mount('#app')