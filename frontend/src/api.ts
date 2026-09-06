// REST 客户端。统一错误格式：后端 detail = {code, message}
import type {
  ChatReply, CommandInfo, EventInfo, HistoryPoint, SystemInfo, SystemState,
} from './types'

export class ApiError extends Error {
  constructor(public code: string, message: string, public status: number) {
    super(message)
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let resp: Response
  try {
    resp = await fetch(path, {
      headers: { 'Content-Type': 'application/json' },
      ...init,
    })
  } catch (e) {
    throw new ApiError('network', '无法连接后台服务，请确认后端已启动', 0)
  }
  if (!resp.ok) {
    let code = 'http_error'
    let message = `请求失败 (HTTP ${resp.status})`
    try {
      const body = await resp.json()
      if (body?.detail?.message) {
        code = body.detail.code ?? code
        message = body.detail.message
      } else if (Array.isArray(body?.detail)) {
        // Pydantic 校验错误
        code = 'validation_error'
        message = body.detail.map((d: any) => `${d.loc?.slice(1).join('.')}: ${d.msg}`).join('；')
      }
    } catch { /* 保持默认信息 */ }
    throw new ApiError(code, message, resp.status)
  }
  return resp.json() as Promise<T>
}

const post = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: 'POST', body: JSON.stringify(body ?? {}) })

export interface CommandAck {
  command_id: string
  status: string
  error: string | null
  target_node: string
}

export const api = {
  status: () => request<SystemState>('/api/status'),
  systemInfo: () => request<SystemInfo>('/api/system/info'),

  history: (minutes: number, metrics: string[]) =>
    request<{ minutes: number; metrics: string[]; count: number; points: HistoryPoint[] }>(
      `/api/history?minutes=${minutes}&metrics=${metrics.join(',')}`,
    ),

  events: (params: { minutes?: number; level?: string; kind?: string; node?: string } = {}) => {
    const q = new URLSearchParams({
      minutes: String(params.minutes ?? 1440),
      level: params.level ?? 'all',
      kind: params.kind ?? 'all',
      node: params.node ?? 'all',
    })
    return request<{ count: number; events: EventInfo[] }>(`/api/events?${q}`)
  },

  commands: (limit = 100) =>
    request<{ count: number; commands: CommandInfo[] }>(`/api/commands?limit=${limit}`),
  command: (id: string) => request<CommandInfo>(`/api/commands/${id}`),

  setFan: (mode: 'auto' | 'manual', duty?: number) =>
    post<CommandAck>('/api/control/fan',
      mode === 'manual' ? { mode, duty_percent: duty } : { mode }),
  setThreshold: (celsius: number) =>
    post<CommandAck>('/api/control/temperature-threshold', { celsius }),
  setNearThreshold: (cm: number) => post<CommandAck>('/api/control/near-threshold', { cm }),
  setSecurity: (mode: 'arm' | 'disarm') => post<CommandAck>('/api/control/security', { mode }),
  silence: () => post<CommandAck>('/api/control/silence'),
  setWindow: (state: 'open' | 'close' | 'auto') => post<CommandAck>('/api/control/window', { state }),

  mockDoor: (opened: boolean) => post('/api/mock/door', { opened }),
  mockVibration: () => post('/api/mock/vibration'),
  mockOffline: (node: 'B' | 'C', offline: boolean) =>
    post('/api/mock/node-offline', { node, offline }),
  mockFaultRate: (rate: number) => post('/api/mock/fault-rate', { command_fail_rate: rate }),

  aiChat: (messages: { role: string; content: string }[], confirmedTool?: unknown) =>
    post<ChatReply>('/api/ai/chat', { messages, confirmed_tool: confirmedTool ?? null }),
}
