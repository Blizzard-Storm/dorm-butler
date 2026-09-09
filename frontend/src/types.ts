// 与后端 app/devices/base.py 的 SystemState.as_dict() 一一对应。
// 约定：字段为 null 一律表示"未知/不可信"，界面必须显示为未知，不能补 0。

export interface NodeInfo {
  online: boolean
  last_seen: string | null
  poll_miss: number | null
}

export interface Capability {
  supported: boolean
  reason: string
}

export interface SystemState {
  ts: string
  board_time: string | null
  link: {
    mode: 'mock' | 'serial'
    connected: boolean
    last_frame_at: string | null
    port?: string
    baud?: number
    readonly?: boolean
    readonly_reason?: string
    paused?: boolean
    /** 暂停期间的阶段：waiting_isp = 等 STC-ISP 接手；burning = 端口已从系统移除，烧录中 */
    pause_phase?: 'waiting_isp' | 'burning' | null
    /** 连的是哪块板。靠固件的串口特征认出来的，不是假定 */
    board_role?: 'A' | 'B' | 'C' | null
    board_role_confidence?: 'unknown' | 'probable' | 'confirmed'
    board_role_reason?: string
    simulated?: boolean
    frames_ok?: number
    frames_bad?: number
    status_lines?: number
    bytes_dropped?: number
    last_bad_line?: string
    arm_countdown?: number
    silenced?: boolean
    fault_injection?: {
      command_fail_rate: number
      node_b_offline: boolean
      node_c_offline: boolean
    }
  }
  nodes: { A: NodeInfo; B: NodeInfo; C: NodeInfo }
  env: {
    temp_c: number | null
    temp_saturated: boolean
    temp_high: boolean | null
    lux_level: number | null
    lux_adc: number | null
    fan_duty: number | null
    fan_mode: 'auto' | 'manual' | null
    window_state: string | null
    window_mode: 'auto' | 'manual' | null
  }
  security: {
    distance_cm: number | null
    distance_valid: boolean
    door_state: string | null
    security_state: string | null
    alarm_level: number | null
    lock_state: string | null
    vib_count: number | null
    door_count: number | null
    near: boolean | null
    silenced: boolean | null
  }
  settings: { temp_threshold: number; near_threshold: number; fan_mode: string }
  diagnostics: {
    crc_errors: number
    main_loops: number | null
    master_reply_miss_b: number | null
    master_reply_miss_c: number | null
    frames_ok: number
    frames_bad: number
  }
  capabilities: Record<string, Capability>
}

export type CommandStatus =
  | 'pending' | 'sent' | 'confirmed' | 'failed' | 'timeout' | 'unsupported'

export interface CommandInfo {
  id: string
  name: string
  params: Record<string, unknown>
  target_node: string
  source: 'user' | 'ai' | 'system'
  status: CommandStatus
  created_at: string
  sent_at: string | null
  settled_at: string | null
  attempts: number
  error: string | null
}

export interface EventInfo {
  id?: number
  ts: string
  level: 'info' | 'warning' | 'alarm'
  kind: string
  node: string
  message: string
}

export interface HistoryPoint {
  ts: string
  [metric: string]: string | number | null
}

export interface ToolCallCard {
  tool: string
  args: Record<string, unknown>
  ok: boolean
  status?: string
  verdict: string
  command_id?: string
  needs_confirmation: boolean
}

export interface ChatReply {
  reply: string
  tool_calls: ToolCallCard[]
  enabled: boolean
  error?: string
}

export interface SystemInfo {
  mode: string
  configured_port: string
  configured_baud: number
  available_ports: { device: string; description: string; hwid: string }[]
  database: string
  llm: { enabled: boolean; model: string | null; base_url: string | null; reason: string | null }
  telemetry_period_s: number
  capabilities: Record<string, Capability>
}
