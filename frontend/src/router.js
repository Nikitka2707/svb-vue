import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import DictionaryView from '@/views/DictionaryView.vue'
import StudyView from '@/views/StudyView.vue'
import StatisticsView from '@/views/StatisticsView.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
  },
  {
    path: '/dictionary',
    name: 'dictionary',
    component: DictionaryView,
  },
  {
    path: '/study',
    name: 'study',
    component: StudyView,
  },
  {
    path: '/statistics',
    name: 'statistics',
    component: StatisticsView,
  },
]

export default createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})
