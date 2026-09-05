<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  NAlert, NButton, NCard, NCode, NDescriptions, NDescriptionsItem,
  NSlider, NSpace, NSwitch, NTag, useMessage,
} from 'naive-ui'
import { api } from '../api'
import type { SystemInfo } from '../types'
import { fmtDateTime, relTime, state, wsConnected } from '../store'

const message = useMessage()
const info = ref<SystemInfo | null>(null)
const s = computed(() => state.value)
const isMock = computed(() => s.value?.link.mode === 'mock')

const faultRate = ref(0)
const bOffline = ref(false)
const cOffline = ref(false)

async function load() {
  info.value = await api.systemInfo()
  const fi = s.value?.link.fault_injection
  if (fi) {
    faultRate.value = Math.round(fi.command_fail_rate * 100)
    bOffline.value = fi.node_b_offline
    cOffline.value = fi.node_c_offline
  }
}

async function applyFaultRate(v: number) {
  await api.mockFaultRate(v / 100)
  message.info(`命令失败率已设为 ${v}%`)
}

async function toggleOffline(node: 'B' | 'C', off: boolean) {
  await api.mockOffline(node, off)
}

onMounted(load)
</script>

<template>
  <div class="page">
    <div class="section-title">运行模式</div>
    <NCard :bordered="false" class="c">
      <NDescriptions :column="1" label-placement="left" size="small">
        <NDescriptionsItem label="设备模式">
          <NTag :type="isMock ? 'warning' : 'success'" size="small" round>
            {{ isMock ? '模拟设备 (DEVICE_MODE=mock)' : '真实串口 (DEVICE_MODE=serial)' }}
          </NTag>
        </NDescriptionsItem>
        <NDescriptionsItem label="串口">
          <span class="mono">{{ info?.configured_port }} @ {{ info?.configured_baud }} 8N1</span>
        </NDescriptionsItem>
        <NDescriptionsItem label="链路状态">
          <NTag :type="s?.link.connected ? 'success' : 'error'" size="small" round>
            {{ s?.link.connected ? '已连接' : '未连接' }}
          </NTag>
          <span class="dim">　最后收帧 {{ relTime(s?.link.last_frame_at) }}</span>
        </NDescriptionsItem>
        <NDescriptionsItem label="WebSocket">
          <NTag :type="wsConnected ? 'success' : 'error'" size="small" round>
            {{ wsConnected ? '已连接' : '断开重连中' }}
          </NTag>
        </NDescriptionsItem>
        <NDescriptionsItem label="数据库">
          <span class="mono small">{{ info?.database }}</span>
        </NDescriptionsItem>
        <NDescriptionsItem label="AI 助手">
          <NTag :type="info?.llm.enabled ? 'success' : 'default'" size="small" round>
            {{ info?.llm.enabled ? `已配置 · ${info.llm.model}` : '未配置' }}
          </NTag>
        </NDescriptionsItem>
      </NDescriptions>

      <div class="acts">
        <NButton size="small" @click="load">刷新</NButton>
      </div>
    </NCard>

    <div class="section-title">可用串口</div>
    <NCard :bordered="false" class="c">
      <div v-if="!info?.available_ports.length" class="dim">没有检测到串口设备。</div>
      <div v-else class="ports">
        <div v-for="p in info.available_ports" :key="p.device" class="port">
          <b class="mono">{{ p.device }}</b>
          <span class="dim">{{ p.description }}</span>
        </div>
      </div>
      <div class="tip">
        改用真实硬件：在 <span class="mono">backend/.env</span> 里把
        <span class="mono">DEVICE_MODE</span> 改成 <span class="mono">serial</span>，
        <span class="mono">SERIAL_PORT</span> 填 CH340 对应的口，然后重启后端。
      </div>
    </NCard>

    <div class="section-title">通信诊断</div>
    <NCard :bordered="false" class="c">
      <NDescriptions :column="2" label-placement="top" size="small">
        <NDescriptionsItem label="485 CRC 累计错误">
          <b :class="{ bad: (s?.diagnostics.crc_errors ?? 0) > 0 }">
            {{ s?.diagnostics.crc_errors ?? 0 }}
          </b>
        </NDescriptionsItem>
        <NDescriptionsItem label="已解析报文行">{{ s?.diagnostics.frames_ok ?? 0 }}</NDescriptionsItem>
        <NDescriptionsItem label="解析失败行">
          <b :class="{ bad: (s?.diagnostics.frames_bad ?? 0) > 0 }">
            {{ s?.diagnostics.frames_bad ?? 0 }}
          </b>
        </NDescriptionsItem>
        <NDescriptionsItem label="丢弃噪声字节">{{ s?.link.bytes_dropped ?? 0 }}</NDescriptionsItem>
      </NDescriptions>

      <div v-if="s?.link.last_bad_line" class="badline">
        最近一条无法解析的行：
        <NCode :code="s.link.last_bad_line" word-wrap />
      </div>
      <div class="tip">
        CRC 错误长期为 0 才算总线健康。持续增长时先把三块板的 BUS_BAUD 一起降到 1200
        重新下载，再检查 485 的 A/B 是否接反。
      </div>
    </NCard>

    <template v-if="isMock">
      <div class="section-title">故障注入（仅模拟模式）</div>
      <NCard :bordered="false" class="c">
        <NAlert type="info" :bordered="false" style="margin-bottom:16px">
          用来演示"命令失败/超时"和"节点掉线"这两类异常路径。默认全部关闭，保证演示可复现。
        </NAlert>

        <NSpace vertical size="large">
          <div>
            <div class="lbl">命令失败率：{{ faultRate }}%</div>
            <NSlider v-model:value="faultRate" :min="0" :max="100" :step="10"
                     @update:value="applyFaultRate" />
          </div>
          <NSpace align="center">
            <span class="lbl">节点B 强制离线</span>
            <NSwitch v-model:value="bOffline" @update:value="(v: boolean) => toggleOffline('B', v)" />
            <span class="lbl" style="margin-left:16px">节点C 强制离线</span>
            <NSwitch v-model:value="cOffline" @update:value="(v: boolean) => toggleOffline('C', v)" />
          </NSpace>
          <NSpace>
            <NButton size="small" @click="api.mockDoor(true)">模拟开门</NButton>
            <NButton size="small" @click="api.mockDoor(false)">模拟关门</NButton>
            <NButton size="small" @click="api.mockVibration()">模拟一次振动</NButton>
          </NSpace>
          <div class="tip">
            布防状态下开门会立刻触发报警；振动需要在 2 秒窗口内累计 3 次才触发，
            这两条规则都与 NodeC 固件一致。
          </div>
        </NSpace>
      </NCard>
    </template>

    <div class="section-title">固件能力</div>
    <NCard :bordered="false" class="c">
      <div v-for="(cap, name) in s?.capabilities" :key="name" class="cap">
        <NTag :type="cap.supported ? 'success' : 'warning'" size="small" round>
          {{ cap.supported ? '可用' : '不可用' }}
        </NTag>
        <span class="cap-name mono">{{ name }}</span>
        <span v-if="cap.reason" class="dim">{{ cap.reason }}</span>
      </div>
    </NCard>

    <div class="footnote">
      状态时间戳 {{ fmtDateTime(s?.ts) }}
    </div>
  </div>
</template>

<style scoped>
.c { margin-bottom: 4px; border-radius: 14px; background: var(--card);
  border: 1px solid var(--border) !important; }
.dim { color: var(--muted); font-size: 12.5px; }
.small { font-size: 11px; word-break: break-all; }
.acts { margin-top: 14px; }
.ports { display: flex; flex-direction: column; gap: 7px; }
.port { display: flex; gap: 10px; align-items: baseline; }
.tip { margin-top: 14px; font-size: 11.5px; color: var(--muted); line-height: 1.65; }
.lbl { font-size: 12.5px; color: var(--muted); }
.bad { color: #d84343; }
.badline { margin-top: 12px; font-size: 12px; color: var(--muted); }
.cap { display: flex; align-items: center; gap: 9px; padding: 7px 0; flex-wrap: wrap;
  border-bottom: 1px solid var(--border); }
.cap:last-child { border-bottom: none; }
.cap-name { font-size: 12.5px; color: var(--text); }
.footnote { margin-top: 18px; font-size: 11.5px; color: var(--muted); }
</style>
