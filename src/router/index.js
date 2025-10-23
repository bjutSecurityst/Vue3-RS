import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ChangeDetectionView from '../views/ChangeDetectionView.vue'
import DetectionResultView from '../views/DetectionResultView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      redirect: '/change-detection'
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue'),
    },
    {
      path: '/change-detection',
      name: 'changeDetection',
      component: ChangeDetectionView,
    },
    {
      path: '/detection-result',
      name: 'detectionResult',
      component: DetectionResultView,
    },
  ],
})

export default router