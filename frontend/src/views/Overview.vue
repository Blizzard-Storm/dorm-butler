<script setup lang="ts">
import { computed } from 'vue'
import { NAlert, NSpin, NTag } from 'naive-ui'
import {
  Clock, DoorClosed, Fan, Gauge, Radio, Ruler, ShieldCheck, Sun, Thermometer, Wind,
} from 'lucide-vue-next'
import StatCard from '../components/StatCard.vue'
import {
  SEC_STATE_TEXT, fmtTime, luxText, overallStatus, relTime, state,
} from '../store'

const s = computed(() => state.value)

const tempTone = computed(() => {
  const t = s.value?.env.temp_c
  if (t === null || t === undefined) return 'normal'
  const th = s.value?.settings.temp_threshold ?? 28
  if (t >= th + 3) return 'bad'
  if (t >= th) return 'warn'
  return 'good'
})

const alarmTone = computed(() => {
  const lv = s.value?.security.alarm_level
  if (lv === null || lv === undefined) return 'normal'
  return lv >= 2 ? 'bad' : lv === 1 ? 'warn' : 'good'
})

const alarmText = computed(() => {
  const lv = s.value?.security.alarm_level
  if (lv === null || lv === undefined) return null
  return ['无报警', '提示', '报警'][lv] ?? '未知'
})

const secTone = computed(() => {
  const st = s.value?.security.security_state
  if (st === 'alarm') return 'bad'
  if (st === 'armed' || st === 'arming') return 'warn'
  return 'normal'
})

const doorTone = computed(() =>
  s.value?.security.door_state === 'open'
    ? (s.value?.security.security_state === 'armed' ? 'bad' : 'warn')
    : 'normal')

const nodeList = computed(() => [
  { key: 'A', name: '节点A 主控网关', place: '书桌', info: s.value?.nodes.A },
  { key: 'B', name: '节点B 环境节点', place: '窗台', info: s.value?.nodes.B },
  { key: 'C', name: '节点C 安防节点', place: '门口', info: s.value?.nodes.C },
])

const countdown = computed(() => s.value?.link.arm_countdown ?? 0)
</script>

<template>
  <div class="page">
    <div v-if="!s" class="loading"><NSpin size="large" /><p>正在连接后台…</p></div>

    <template v-else>
      <!-- 头部状态条 -->
      <div class="hero" :class="`hero-${overallStatus.type}`">
        <div>
          <div class="hero-status">{{ overallStatus.text }}</div>
          <div class="hero-sub">
            板上时间 {{ s.board_time ?? '—' }} ·
            最近更新 {{ relTime(s.link.last_frame_at) }}
            <span v-if="s.link.last_frame_at">（{{ fmtTime(s.link.last_frame_at) }}）</span>
          </div>
        </div>
        <Clock :size="26" class="hero-icon" />
      </div>

      <NAlert v-if="countdown > 0" type="warning" :bordered="false" style="margin-bottom:14px">
        布防退出延时中，剩余 {{ countdown }} 秒 —— 请在倒计时结束前离开
      </NAlert>

      <NAlert
        v-if="s.link.readonly" type="info" :bordered="false" style="margin-bottom:14px"
        title="当前为只读监控模式"
      >
        {{ s.link.readonly_reason }}
      </NAlert>

      <!-- 环境 -->
      <div class="section-title">环境 · 节点B</div>
      <div class="grid">
        <StatCard
          label="温度" :value="s.env.temp_c" unit="℃" :icon="Thermometer" :tone="tempTone"
          :note="s.env.temp_saturated ? '读数已达固件上限 99.9℃' : `风扇阈值 ${s.settings.temp_threshold}℃`"
        />
        <StatCard
          label="光照" :value="s.env.lux_level === null ? null : luxText(s.env.lux_level)"
          :icon="Sun" note="未标定等级 0-4，不是 lux"
        />
        <StatCard
          label="风扇输出" :value="s.env.fan_duty" unit="%" :icon="Fan"
          :tone="(s.env.fan_duty ?? 0) > 0 ? 'good' : 'normal'"
          :note="`PWM 占空比，非实测转速 · ${s.env.fan_mode === 'manual' ? '手动' : '自动'}模式`"
        />
        <StatCard
          label="通风窗" :icon="Wind"
          :value="s.env.window_state === null ? null : (s.env.window_state === 'open' ? '已打开' : '已关闭')"
          note="软件状态，无位置反馈"
        />
      </div>

      <!-- 安防 -->
      <div class="section-title">安防 · 节点C</div>
      <div class="grid">
        <StatCard
          label="安防状态" :icon="ShieldCheck" :tone="secTone"
          :value="s.security.security_state === null ? null : SEC_STATE_TEXT[s.security.security_state]"
          :note="s.security.lock_state === null ? '' : `门锁 ${s.security.lock_state === 'locked' ? '已上锁' : '未上锁'}（软件状态）`"
        />
        <StatCard
          label="门磁" :icon="DoorClosed" :tone="doorTone"
          :value="s.security.door_state === null ? null : (s.security.door_state === 'open' ? '门已打开' : '门已关闭')"
          :note="s.security.door_count === null ? '' : `累计开门 ${s.security.door_count} 次`"
        />
        <StatCard
          label="门口距离" :value="s.security.distance_cm" unit="cm" :icon="Ruler" :digits="0"
          :tone="s.security.near ? 'warn' : 'normal'"
          :note="s.security.distance_valid
            ? (s.security.near ? `低于接近阈值 ${s.settings.near_threshold}cm` : `接近阈值 ${s.settings.near_threshold}cm`)
            : '超声波无有效回波'"
        />
        <StatCard
          label="报警等级" :value="alarmText" :icon="Gauge" :tone="alarmTone"
          :note="s.security.vib_count === null ? '' : `累计异动 ${s.security.vib_count} 次`"
        />
      </div>

      <!-- 节点 -->
      <div class="section-title">节点在线状态</div>
      <div class="nodes">
        <div v-for="n in nodeList" :key="n.key" class="node" :class="{ off: !n.info?.online }">
          <div class="node-left">
            <Radio :size="17" />
            <div>
              <div class="node-name">{{ n.name }}</div>
              <div class="node-place">{{ n.place }} · 最后通信 {{ relTime(n.info?.last_seen) }}</div>
            </div>
          </div>
          <NTag :type="n.info?.online ? 'success' : 'error'" size="small" round>
            {{ n.info?.online ? '在线' : '离线' }}
          </NTag>
        </div>
      </div>

      <div class="footnote">
        485 总线 CRC 累计错误 <b>{{ s.diagnostics.crc_errors }}</b> ·
        已解析报文 {{ s.diagnostics.frames_ok }} 行 ·
        坏行 {{ s.diagnostics.frames_bad }} 行
      </div>
    </template>
  </div>
</template>

<style scoped>
.loading { display: grid; place-items: center; gap: 12px; padding: 80px 0; color: var(--muted); }

.hero {
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 20px; border-radius: 16px; margin-bottom: 6px;
  border: 1px solid var(--border); background: var(--card);
}
.hero-success { border-color: #2f9e6b44; background: linear-gradient(135deg, #2f9e6b12, transparent); }
.hero-warning { border-color: #c8891f55; background: linear-gradient(135deg, #c8891f14, transparent); }
.hero-error   { border-color: #d8434366; background: linear-gradient(135deg, #d8434314, transparent); }
.hero-status { font-size: 21px; font-weight: 660; letter-spacing: -.01em; }
.hero-sub { font-size: 12px; color: var(--muted); margin-top: 3px; }
.hero-icon { color: var(--muted); opacity: .6; }

.nodes { display: flex; flex-direction: column; gap: 8px; }
.node {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 15px; border-radius: 12px;
  background: var(--card); border: 1px solid var(--border);
}
.node.off { opacity: .68; border-style: dashed; }
.node-left { display: flex; align-items: center; gap: 11px; color: var(--muted); }
.node-name { font-size: 14px; font-weight: 550; color: var(--text); }
.node-place { font-size: 11.5px; color: var(--muted); }

.footnote { margin-top: 22px; font-size: 11.5px; color: var(--muted); }
</style>
