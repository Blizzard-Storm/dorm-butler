import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import './style.css'

const routes = [
  { path: '/', name: 'overview', component: () => import('./views/Overview.vue'), meta: { title: '总览' } },
  { path: '/control', name: 'control', component: () => import('./views/Control.vue'), meta: { title: '设备控制' } },
  { path: '/analytics', name: 'analytics', component: () => import('./views/Analytics.vue'), meta: { title: '数据分析' } },
  { path: '/events', name: 'events', component: () => import('./views/Events.vue'), meta: { title: '事件记录' } },
  { path: '/assistant', name: 'assistant', component: () => import('./views/Assistant.vue'), meta: { title: 'AI 助手' } },
  { path: '/system', name: 'system', component: () => import('./views/System.vue'), meta: { title: '系统诊断' } },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({ history: createWebHistory(), routes })

createApp(App).use(router).mount('#app')
