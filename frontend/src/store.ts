// 全局状态：WebSocket 实时流 + 命令跟踪。
// 断线时把 wsConnected 置 false，页面必须明确显示离线，而不是停在旧数据上。
import { computed, reactive, ref } from 'vue'
import { api } from './api'
import type { CommandInfo, EventInfo, SystemState } from './types'

const MAX_EVENTS = 300
const MAX_COMMANDS = 100

export const state = ref<SystemState | null>(null)
export const events = ref<EventInfo[]>([])
export const commands = ref<CommandInfo[]>([])
export const wsConnected = ref(false)
export const lastError = ref<string | null>(null)

export const ui = reactive({
  // 命令 id -> 最近一次状态，用于按钮旁边的即时反馈
  tracking: {} as Record<string, CommandInfo>,
})

let socket: WebSocket | null = null
let retry = 0
let retryTimer: number | undefined
let pingTimer: number | undefined

function wsUrl(): string {
  const proto = location.protocol === 'https:' ? 'wss' : 'ws'
  return `${proto}://${location.host}/ws`
}

export function connect(): void {
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    return
  }
  socket = new WebSocket(wsUrl())

  socket.onopen = () => {
    wsConnected.value = true
    lastError.value = null
    retry = 0
    pingTimer = window.setInterval(() => {
      if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: 'ping' }))
    }, 20000)
    // 重连后补齐历史，避免断线期间的事件缺失
    void refreshEvents()
    void refreshCommands()
  }

  socket.onmessage = (ev) => {
    try {
      const { topic, payload } = JSON.parse(ev.data)
      if (topic === 'state') {
        state.value = payload as SystemState
      } else if (topic === 'event') {
        events.value = [payload as EventInfo, ...events.value].slice(0, MAX_EVENTS)
      } else if (topic === 'command') {
        const cmd = payload as CommandInfo
        ui.tracking[cmd.id] = cmd
        const idx = commands.value.findIndex((c) => c.id === cmd.id)
        if (idx >= 0) commands.value[idx] = cmd
        else commands.value = [cmd, ...commands.value].slice(0, MAX_COMMANDS)
      }
    } catch {
      // 单条消息解析失败不影响连接
    }
  }

  socket.onclose = () => {
    wsConnected.value = false
    window.clearInterval(pingTimer)
    scheduleReconnect()
  }

  socket.onerror = () => {
    wsConnected.value = false
  }
}

function scheduleReconnect(): void {
  window.clearTimeout(retryTimer)
  const delay = Math.min(1000 * 2 ** retry, 15000)   // 指数退避，上限 15 秒
  retry += 1
  retryTimer = window.setTimeout(connect, delay)
}

export async function bootstrap(): Promise<void> {
  try {
    state.value = await api.status()
    await Promise.all([refreshEvents(), refreshCommands()])
  } catch (e) {
    lastError.value = e instanceof Error ? e.message : String(e)
  }
  connect()
}

export async function refreshEvents(): Promise<void> {
  try {
    events.value = (await api.events({ minutes: 1440 })).events
  } catch { /* 断线时保留现有列表 */ }
}

export async function refreshCommands(): Promise<void> {
  try {
    commands.value = (await api.commands(MAX_COMMANDS)).commands
  } catch { /* 同上 */ }
}

// ---------------------------------------------------------------- 派生状态

export const online = computed(() => wsConnected.value && !!state.value?.link.connected)

export const alarmActive = computed(() => (state.value?.security.alarm_level ?? 0) >= 2)

export const overallStatus = computed<{ text: string; type: 'success' | 'warning' | 'error' | 'info' }>(() => {
  if (!wsConnected.value) return { text: '后台离线', type: 'error' }
  if (!state.value?.link.connected) return { text: '设备链路断开', type: 'error' }
  if (alarmActive.value) return { text: '安防报警中', type: 'error' }
  const s = state.value
  if (!s) return { text: '加载中', type: 'info' }
  const off = Object.entries(s.nodes).filter(([, n]) => !n.online).map(([k]) => k)
  if (off.length) return { text: `节点 ${off.join('/')} 离线`, type: 'warning' }
  if (s.security.alarm_level === 1) return { text: '有提示事件', type: 'warning' }
  return { text: '一切正常', type: 'success' }
})

// ---------------------------------------------------------------- 格式化

export function fmtNum(v: number | null | undefined, unit = '', digits = 1): string {
  if (v === null || v === undefined) return '未知'
  return `${Number(v).toFixed(digits)}${unit}`
}

export function fmtInt(v: number | null | undefined, unit = ''): string {
  if (v === null || v === undefined) return '未知'
  return `${v}${unit}`
}

export function fmtTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleTimeString('zh-CN', { hour12: false })
}

export function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('zh-CN', { hour12: false })
}

export function relTime(iso: string | null | undefined): string {
  if (!iso) return '从未'
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 2) return '刚刚'
  if (diff < 60) return `${Math.floor(diff)} 秒前`
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`
  return `${Math.floor(diff / 3600)} 小时前`
}

export const LUX_TEXT = ['很暗', '偏暗', '正常', '明亮', '很亮']

export function luxText(level: number | null): string {
  if (level === null || level === undefined) return '未知'
  return `${LUX_TEXT[level] ?? '?'}（${level} 档）`
}

export const SEC_STATE_TEXT: Record<string, string> = {
  disarmed: '已撤防',
  arming: '布防倒计时',
  armed: '已布防',
  alarm: '报警中',
}

export const CMD_STATUS_TEXT: Record<string, string> = {
  pending: '待下发',
  sent: '已下发，等待回执',
  confirmed: '已确认',
  failed: '执行失败',
  timeout: '超时未回执',
  unsupported: '固件不支持',
}

export const CMD_NAME_TEXT: Record<string, string> = {
  set_fan: '设置风扇',
  set_temperature_threshold: '设置温度阈值',
  set_near_threshold: '设置接近阈值',
  set_security_mode: '布防/撤防',
  silence_alarm: '报警静音',
  set_window: '控制通风窗',
}

export function statusType(s: string): 'default' | 'info' | 'success' | 'warning' | 'error' {
  return ({
    pending: 'default', sent: 'info', confirmed: 'success',
    failed: 'error', timeout: 'warning', unsupported: 'warning',
  } as const)[s] ?? 'default'
}
