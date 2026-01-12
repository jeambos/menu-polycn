import { createRouter, createWebHistory } from 'vue-router'
import Welcome from '../views/Welcome.vue'
import Setup from '../views/Setup.vue'
import Quiz from '../views/Quiz.vue'
import Result from '../views/Result.vue'

const router = createRouter({
  // 使用 WebHistory 模式 (URL 不带 # 号，更美观)
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'welcome',
      component: Welcome
    },
    {
      path: '/setup',
      name: 'setup',
      component: Setup
    },
    {
      path: '/quiz',
      name: 'quiz',
      component: Quiz
    },
    {
      path: '/result',
      name: 'result',
      component: Result
    }
  ]
})

export default router