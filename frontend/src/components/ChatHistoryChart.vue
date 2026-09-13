<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { DataZoomComponent, GridComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { RefreshCw } from 'lucide-vue-next'
import { api } from '../api'
import type { HistoryPoint } from '../types'

use([LineChart, GridComponent, TooltipComponent, DataZoomComponent, CanvasRenderer])

const props = defineProps<{ metric: string; minutes: number }>()

const METRICS: Record<string, { label: string; unit: string; color: string; digits: number }> = {
  temp_c: { label: '温度', unit: '℃', color: '#c96b3c', digits: 1 },
  lux_level: { label: '光照等级', unit: '档', color: '#a97721', digits: 0 },
  distance_cm: { label: '门口距离', unit: 'cm', color: '#167d8d', digits: 0 },
  fan_duty: { label: '风扇 PWM', unit: '%', color: '#366fb1', digits: 0 },
  alarm_level: { label: '报警等级', unit: '级', color: '#c34545', digits: 0 },
  crc_errors: { label: 'CRC 错误', unit: '次', color: '#6d668f', digits: 0 },
}

const points = ref<HistoryPoint[]>([])
const totalCount = ref(0)
const loading = ref(true)
const error = ref('')

const meta = computed(() => METRICS[props.metric] ?? {
  label: props.metric, unit: '', color: '#167d8d', digits: 2,
})

const values = computed(() => points.value
  .map((p) => p[props.metric])
  .filter((v): v is number => typeof v === 'number' && Number.isFinite(v)))

const stats = computed(() => {
  if (!values.value.length) return null
  const total = values.value.reduce((sum, value) => sum + value, 0)
  return {
    min: Math.min(...values.value),
    max: Math.max(...values.value),
    avg: total / values.value.length,
    latest: values.value[values.value.length - 1],
  }
})

function format(value: number) {
  return value.toFixed(meta.value.digits)
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const result = await api.history(props.minutes, [props.metric])
    points.value = result.points
    totalCount.value = result.total_count ?? result.count
  } catch {
    error.value = '历史数据暂时无法读取'
  } finally {
    loading.value = false
  }
}

const option = computed(() => ({
  animation: false,
  grid: { left: 44, right: 18, top: 18, bottom: 46 },
  tooltip: {
    trigger: 'axis',
    formatter: (params: any[]) => {
      const item = params[0]
      const time = new Date(item.value[0]).toLocaleString('zh-CN', { hour12: false })
      const value = item.value[1]
      return `${time}<br/>${item.marker} ${meta.value.label}：${value == null ? '无数据' : `${format(Number(value))} ${meta.value.unit}`}`
    },
  },
  xAxis: {
    type: 'time',
    axisLine: { lineStyle: { color: '#dfe4e8' } },
    axisTick: { show: false },
    axisLabel: { color: '#7b8795', fontSize: 10 },
  },
  yAxis: {
    type: 'value', scale: true, name: meta.value.unit,
    nameTextStyle: { color: '#7b8795', fontSize: 10 },
    axisLabel: { color: '#7b8795', fontSize: 10 },
    splitLine: { lineStyle: { color: '#edf0f3', type: 'dashed' } },
  },
  dataZoom: [
    { type: 'inside', filterMode: 'none' },
    {
      type: 'slider', height: 14, bottom: 5, borderColor: 'transparent',
      backgroundColor: '#eef2f4', fillerColor: '#167d8d24',
      handleStyle: { color: '#167d8d', borderColor: '#167d8d' },
      moveHandleStyle: { color: '#167d8d' },
      showDetail: false,
    },
  ],
  series: [{
    name: meta.value.label,
    type: 'line',
    showSymbol: values.value.length < 30,
    symbolSize: 4,
    smooth: false,
    connectNulls: false,
    lineStyle: { width: 2, color: meta.value.color },
    itemStyle: { color: meta.value.color },
    areaStyle: { color: meta.value.color, opacity: 0.06 },
    data: points.value.map((p) => [new Date(p.ts).getTime(), p[props.metric]]),
  }],
}))

watch(() => [props.metric, props.minutes], load)
onMounted(load)
</script>

<template>
  <section class="history-chart" :aria-label="`${meta.label}历史曲线`">
    <div class="chart-head">
      <div>
        <strong>{{ meta.label }}历史曲线</strong>
        <span>
          最近 {{ minutes }} 分钟，共 {{ totalCount }} 条有效记录
          <template v-if="totalCount > values.length">，抽样显示 {{ values.length }} 点</template>
        </span>
      </div>
      <button type="button" class="refresh" :disabled="loading" aria-label="刷新曲线" @click="load">
        <RefreshCw :size="13" :class="{ spinning: loading }" />
      </button>
    </div>

    <div v-if="stats" class="stats">
      <span>最新 <b>{{ format(stats.latest) }}</b> {{ meta.unit }}</span>
      <span>最低 <b>{{ format(stats.min) }}</b></span>
      <span>最高 <b>{{ format(stats.max) }}</b></span>
      <span>平均 <b>{{ format(stats.avg) }}</b></span>
    </div>

    <div v-if="loading && !points.length" class="chart-state">正在读取完整采样记录</div>
    <div v-else-if="error" class="chart-state error">{{ error }}</div>
    <div v-else-if="!values.length" class="chart-state">这段时间没有有效数据</div>
    <VChart v-else class="plot" :option="option" autoresize />

    <p v-if="values.length" class="chart-help">悬停查看数值，拖动底部滑块或滚轮缩放时间范围。</p>
  </section>
</template>

<style scoped>
.history-chart {
  margin-top: 10px; padding: 12px 12px 8px; border-radius: 10px;
  border: 1px solid color-mix(in srgb, var(--border) 82%, transparent);
  background: var(--card);
}
.chart-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.chart-head strong { display: block; color: var(--text); font-size: 12.5px; font-weight: 600; }
.chart-head span { display: block; margin-top: 2px; color: var(--muted); font-size: 10.5px; }
.refresh {
  width: 27px; height: 27px; display: grid; place-items: center; flex: 0 0 auto;
  border: 1px solid var(--border); border-radius: 8px; background: transparent;
  color: var(--muted); cursor: pointer;
}
.refresh:hover:not(:disabled) { color: var(--accent); border-color: var(--accent); }
.refresh:disabled { cursor: default; opacity: .55; }
.spinning { animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.stats { display: flex; flex-wrap: wrap; gap: 6px 16px; margin-top: 9px; color: var(--muted); font-size: 10.5px; }
.stats b { color: var(--text); font-variant-numeric: tabular-nums; font-weight: 600; }
.plot { height: 230px; width: 100%; margin-top: 3px; }
.chart-state { height: 150px; display: grid; place-items: center; color: var(--muted); font-size: 12px; }
.chart-state.error { color: #c34545; }
.chart-help { margin: -1px 2px 0; color: var(--muted); font-size: 10px; line-height: 1.5; }
@media (max-width: 640px) {
  .history-chart { padding-inline: 8px; }
  .plot { height: 205px; }
  .stats { gap: 4px 10px; }
}
@media (prefers-reduced-motion: reduce) { .spinning { animation: none; } }
</style>
