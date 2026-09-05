<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { NButton, NCard, NEmpty, NRadioButton, NRadioGroup, NSpin } from 'naive-ui'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { LineChart } from 'echarts/charts'
import {
  DataZoomComponent, GridComponent, LegendComponent, TitleComponent, TooltipComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { api } from '../api'
import type { HistoryPoint } from '../types'

use([LineChart, GridComponent, TooltipComponent, LegendComponent, TitleComponent,
  DataZoomComponent, CanvasRenderer])

const RANGES = [
  { label: '10 分钟', value: 10 },
  { label: '1 小时', value: 60 },
  { label: '6 小时', value: 360 },
  { label: '24 小时', value: 1440 },
]

const SERIES = [
  { key: 'temp_c', name: '温度', unit: '℃', color: '#e5773e', axis: 0 },
  { key: 'fan_duty', name: '风扇 PWM', unit: '%', color: '#2f6df6', axis: 1 },
  { key: 'distance_cm', name: '门口距离', unit: 'cm', color: '#2f9e6b', axis: 1 },
  { key: 'lux_level', name: '光照等级', unit: '档', color: '#c8891f', axis: 1 },
]

const minutes = ref(10)
const active = ref<string[]>(['temp_c', 'fan_duty'])
const points = ref<HistoryPoint[]>([])
const loading = ref(false)
const dark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
let timer: number | undefined

async function load() {
  loading.value = true
  try {
    const res = await api.history(minutes.value, SERIES.map((s) => s.key))
    points.value = res.points
  } finally {
    loading.value = false
  }
}

function toggle(key: string) {
  active.value = active.value.includes(key)
    ? active.value.filter((k) => k !== key)
    : [...active.value, key]
}

const hasData = computed(() =>
  points.value.some((p) => active.value.some((k) => p[k] !== null && p[k] !== undefined)))

const option = computed(() => {
  const chosen = SERIES.filter((s) => active.value.includes(s.key))
  const axisColor = dark ? '#8b93a3' : '#6b7484'
  const splitColor = dark ? '#262b35' : '#eceff4'

  return {
    backgroundColor: 'transparent',
    grid: { left: 46, right: 46, top: 28, bottom: 44 },
    tooltip: {
      trigger: 'axis',
      valueFormatter: (v: number | null) => (v === null ? '无数据' : String(v)),
    },
    legend: { show: false },
    xAxis: {
      type: 'time',
      axisLine: { lineStyle: { color: splitColor } },
      axisLabel: { color: axisColor, fontSize: 11 },
    },
    yAxis: [
      {
        type: 'value', name: '℃', position: 'left', scale: true,
        nameTextStyle: { color: axisColor, fontSize: 11 },
        axisLabel: { color: axisColor, fontSize: 11 },
        splitLine: { lineStyle: { color: splitColor } },
      },
      {
        type: 'value', name: '%/cm/档', position: 'right', scale: true,
        nameTextStyle: { color: axisColor, fontSize: 11 },
        axisLabel: { color: axisColor, fontSize: 11 },
        splitLine: { show: false },
      },
    ],
    dataZoom: [{ type: 'inside' }],
    series: chosen.map((s) => ({
      name: `${s.name}(${s.unit})`,
      type: 'line',
      yAxisIndex: s.axis,
      showSymbol: false,
      smooth: 0.25,
      connectNulls: false,        // 数据缺口如实断开，不要连成一条假的直线
      lineStyle: { width: 2, color: s.color },
      itemStyle: { color: s.color },
      areaStyle: s.key === 'temp_c'
        ? { color: `${s.color}1f` }
        : undefined,
      data: points.value.map((p) => [new Date(p.ts).getTime(), p[s.key] as number | null]),
    })),
  }
})

watch(minutes, load)
onMounted(() => {
  void load()
  timer = window.setInterval(load, 10000)     // 10 秒刷新一次，避免频繁重绘
})
onUnmounted(() => window.clearInterval(timer))
</script>

<template>
  <div class="page">
    <div class="toolbar">
      <NRadioGroup v-model:value="minutes" size="small">
        <NRadioButton v-for="r in RANGES" :key="r.value" :value="r.value">{{ r.label }}</NRadioButton>
      </NRadioGroup>
      <NButton size="small" :loading="loading" @click="load">刷新</NButton>
    </div>

    <div class="chips">
      <button
        v-for="s in SERIES" :key="s.key"
        class="chip" :class="{ on: active.includes(s.key) }"
        :style="active.includes(s.key) ? { borderColor: s.color, color: s.color } : {}"
        @click="toggle(s.key)"
      >
        <i class="swatch" :style="{ background: s.color }" /> {{ s.name }}
      </button>
    </div>

    <NCard :bordered="false" class="chart-card">
      <div v-if="loading && !points.length" class="ph"><NSpin /></div>
      <NEmpty v-else-if="!hasData" description="这段时间没有有效数据">
        <template #extra>
          <span class="empty-hint">
            后台每 {{ 1 }} 秒记录一条遥测。刚启动或节点离线时曲线为空是正常的。
          </span>
        </template>
      </NEmpty>
      <VChart v-else class="chart" :option="option" autoresize />
    </NCard>

    <div class="footnote">
      共 {{ points.length }} 个采样点。曲线在数据缺失处会断开，那表示该时段节点离线或读数无效，
      不会用插值把缺口连起来。
    </div>
  </div>
</template>

<style scoped>
.toolbar { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; margin-bottom: 12px; }
.chips { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
.chip {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 5px 11px; border-radius: 999px; cursor: pointer;
  background: var(--card); border: 1px solid var(--border); color: var(--muted);
  font-size: 12.5px; font-family: inherit;
}
.chip.on { font-weight: 600; }
.swatch { width: 8px; height: 8px; border-radius: 2px; }

.chart-card { border-radius: 14px; border: 1px solid var(--border) !important; background: var(--card); }
.chart { height: 380px; width: 100%; }
@media (max-width: 640px) { .chart { height: 300px; } }
.ph { height: 380px; display: grid; place-items: center; }
.empty-hint { font-size: 12px; color: var(--muted); }
.footnote { margin-top: 14px; font-size: 11.5px; color: var(--muted); line-height: 1.6; }
</style>
