import { createRouter, createWebHistory } from 'vue-router'
import Welcome from '../views/Welcome.vue'
import Setup from '../views/Setup.vue'
import Quiz from '../views/Quiz.vue'
import Result from '../views/Result.vue'
import Compare from '../views/Compare.vue'
import Import from '../views/Import.vue'
import Review from '../views/Result.vue'
import Doc from '../views/Doc.vue'

const router = createRouter({
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
    },
    {
      path: '/compare',
      name: 'compare',
      component: Compare
    },
    {
      path: '/import',
      name: 'import',
      component: Import
    },
    {
      path: '/doc',
      name: 'doc',
      component: Doc
    },
    {
      path: '/review',
      name: 'review',
      component: Review
    }
  ]
})

// 👇 就是这一行，必须要有！
export default router