<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  NConfigProvider, NDialogProvider, NGlobalStyle, NMessageProvider,
  darkTheme, zhCN, dateZhCN,
} from 'naive-ui'
import {
  Activity, BarChart3, Bot, LayoutDashboard, ScrollText, SlidersHorizontal,
} from 'lucide-vue-next'
import { alarmActive, bootstrap, online, overallStatus, state, wsConnected } from './store'

const route = useRoute()
const router = useRouter()

const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
const theme = computed(() => (prefersDark ? darkTheme : null))

const navItems = [
  { key: 'overview', path: '/', label: '总览', icon: LayoutDashboard },
  { key: 'control', path: '/control', label: '控制', icon: SlidersHorizontal },
  { key: 'analytics', path: '/analytics', label: '分析', icon: BarChart3 },
  { key: 'events', path: '/events', label: '事件', icon: ScrollText },
  { key: 'assistant', path: '/assistant', label: 'AI', icon: Bot },
  { key: 'system', path: '/system', label: '诊断', icon: Activity },
]

const modeLabel = computed(() =>
  state.value?.link.mode === 'serial' ? '真实串口' : '模拟设备')

onMounted(bootstrap)
</script>

<template>
  <NConfigProvider :theme="theme" :locale="zhCN" :date-locale="dateZhCN">
    <NGlobalStyle />
    <NMessageProvider>
      <NDialogProvider>
        <div class="shell">
          <!-- 顶栏 -->
          <header class="topbar">
            <div class="brand">
              <span class="logo">寝</span>
              <div>
                <div class="title">寝室管家</div>
                <div class="subtitle">STC-B 三节点智能宿舍系统</div>
              </div>
            </div>

            <div class="topbar-right">
              <span class="chip" :class="state?.link.mode === 'serial' ? 'chip-serial' : 'chip-mock'">
                {{ modeLabel }}
              </span>
              <span class="chip" :class="online ? 'chip-ok' : 'chip-bad'">
                <i class="dot" /> {{ wsConnected ? (online ? '在线' : '后台在线 / 链路断开') : '连接断开' }}
              </span>
            </div>
          </header>

          <!-- 断线横幅：绝不让页面停在旧数据上却看着像正常 -->
          <div v-if="!wsConnected" class="banner banner-error">
            实时连接已断开，正在自动重连。当前显示的是最后一次收到的数据，不代表现在的状态。
          </div>
          <div v-else-if="alarmActive" class="banner banner-alarm">
            安防报警中 —— {{ state?.security.door_state === 'open' ? '门被打开' : '检测到异常' }}
          </div>

          <!-- 桌面侧边导航 -->
          <div class="body">
            <nav class="sidenav">
              <button
                v-for="item in navItems" :key="item.key"
                class="navbtn" :class="{ active: route.path === item.path }"
                @click="router.push(item.path)"
              >
                <component :is="item.icon" :size="18" />
                <span>{{ item.label }}</span>
              </button>
              <div class="nav-footer">
                <div class="status-pill" :class="`pill-${overallStatus.type}`">
                  {{ overallStatus.text }}
                </div>
              </div>
            </nav>

            <main class="content">
              <RouterView />
            </main>
          </div>

          <!-- 手机底部导航 -->
          <nav class="tabbar">
            <button
              v-for="item in navItems" :key="item.key"
              class="tabbtn" :class="{ active: route.path === item.path }"
              @click="router.push(item.path)"
            >
              <component :is="item.icon" :size="19" />
              <span>{{ item.label }}</span>
            </button>
          </nav>
        </div>
      </NDialogProvider>
    </NMessageProvider>
  </NConfigProvider>
</template>

<style scoped>
.shell { min-height: 100vh; display: flex; flex-direction: column; }

.topbar {
  display: flex; align-items: center; justify-content: space-between;
  gap: 12px; padding: 12px 16px;
  background: var(--card); border-bottom: 1px solid var(--border);
  position: sticky; top: 0; z-index: 20;
}
.brand { display: flex; align-items: center; gap: 10px; }
.logo {
  width: 34px; height: 34px; border-radius: 10px;
  background: linear-gradient(135deg, var(--accent), #7aa2ff);
  color: #fff; display: grid; place-items: center;
  font-weight: 700; font-size: 16px;
}
.title { font-weight: 650; font-size: 16px; line-height: 1.2; }
.subtitle { font-size: 11px; color: var(--muted); }
@media (max-width: 520px) { .subtitle { display: none; } }

.topbar-right { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.chip {
  font-size: 11px; padding: 4px 9px; border-radius: 999px;
  border: 1px solid var(--border); color: var(--muted);
  display: inline-flex; align-items: center; gap: 5px; white-space: nowrap;
}
.chip-mock { border-color: #d8a13a55; color: #c8891f; }
.chip-serial { border-color: #2f9e6b55; color: #2f9e6b; }
.chip-ok { border-color: #2f9e6b55; color: #2f9e6b; }
.chip-bad { border-color: #d8434355; color: #d84343; }
.dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }

.banner { padding: 9px 16px; font-size: 13px; font-weight: 500; }
.banner-error { background: #d8434318; color: #d84343; border-bottom: 1px solid #d8434333; }
.banner-alarm { background: #e5484d20; color: #e5484d; border-bottom: 1px solid #e5484d44;
  animation: pulse 1.4s ease-in-out infinite; }
@keyframes pulse { 50% { opacity: .6; } }

.body { display: flex; flex: 1; min-height: 0; }

.sidenav {
  display: none; width: 176px; flex-shrink: 0; padding: 14px 10px;
  border-right: 1px solid var(--border); background: var(--card);
  flex-direction: column; gap: 3px;
}
@media (min-width: 860px) { .sidenav { display: flex; } }

.navbtn {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 12px; border-radius: 9px; border: none;
  background: transparent; color: var(--muted);
  font-size: 14px; cursor: pointer; text-align: left; width: 100%;
  font-family: inherit; transition: background .15s, color .15s;
}
.navbtn:hover { background: color-mix(in srgb, var(--accent) 8%, transparent); }
.navbtn.active { background: color-mix(in srgb, var(--accent) 14%, transparent);
  color: var(--accent); font-weight: 600; }

.nav-footer { margin-top: auto; padding: 8px 4px 0; }
.status-pill {
  font-size: 11.5px; text-align: center; padding: 7px;
  border-radius: 8px; border: 1px solid var(--border);
}
.pill-success { color: #2f9e6b; border-color: #2f9e6b44; background: #2f9e6b10; }
.pill-warning { color: #c8891f; border-color: #c8891f44; background: #c8891f10; }
.pill-error   { color: #d84343; border-color: #d8434344; background: #d8434310; }
.pill-info    { color: var(--muted); }

.content { flex: 1; min-width: 0; }

.tabbar {
  position: fixed; bottom: 0; left: 0; right: 0; z-index: 30;
  display: flex; background: var(--card);
  border-top: 1px solid var(--border);
  padding-bottom: env(safe-area-inset-bottom);
}
@media (min-width: 860px) { .tabbar { display: none; } }

.tabbtn {
  flex: 1; border: none; background: transparent; color: var(--muted);
  padding: 8px 2px 7px; font-size: 10.5px; cursor: pointer;
  display: flex; flex-direction: column; align-items: center; gap: 3px;
  font-family: inherit;
}
.tabbtn.active { color: var(--accent); font-weight: 600; }
</style>
