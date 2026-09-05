<script setup lang="ts">
// 单个指标卡。value 为 null 时显示"未知"而不是 0 —— 这条规则贯穿全站。
import type { Component } from 'vue'
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  label: string
  value: number | string | null | undefined
  unit?: string
  digits?: number
  icon?: Component
  tone?: 'normal' | 'good' | 'warn' | 'bad'
  note?: string          // 物理量口径说明，例如"PWM 输出，非实测转速"
  hint?: string          // 次要信息，例如更新时间
}>(), { tone: 'normal', digits: 1, unit: '' })

const known = computed(() => props.value !== null && props.value !== undefined)

const display = computed(() => {
  if (!known.value) return '未知'
  if (typeof props.value === 'number') {
    return Number.isInteger(props.value) ? String(props.value) : props.value.toFixed(props.digits)
  }
  return String(props.value)
})
</script>

<template>
  <div class="card" :class="[`tone-${tone}`, { dim: !known }]">
    <div class="head">
      <span class="label">{{ label }}</span>
      <component :is="icon" v-if="icon" :size="16" class="icon" />
    </div>
    <div class="value">
      <span :class="{ unknown: !known }">{{ display }}</span>
      <span v-if="known && unit" class="unit">{{ unit }}</span>
    </div>
    <div v-if="note" class="note">{{ note }}</div>
    <div v-if="hint" class="hint">{{ hint }}</div>
  </div>
</template>

<style scoped>
.card {
  background: var(--card); border: 1px solid var(--border);
  border-radius: 14px; padding: 14px 15px;
  display: flex; flex-direction: column; gap: 5px; min-height: 104px;
  transition: border-color .2s;
}
.card.dim { opacity: .72; }
.head { display: flex; align-items: center; justify-content: space-between; }
.label { font-size: 12.5px; color: var(--muted); font-weight: 500; }
.icon { color: var(--muted); flex-shrink: 0; }
.value {
  font-size: 27px; font-weight: 650; line-height: 1.15;
  display: flex; align-items: baseline; gap: 4px; letter-spacing: -.01em;
}
.value .unknown { font-size: 19px; font-weight: 500; color: var(--muted); }
.unit { font-size: 13px; font-weight: 500; color: var(--muted); }
.note { font-size: 10.5px; color: var(--muted); opacity: .85; margin-top: auto; }
.hint { font-size: 10.5px; color: var(--muted); }

.tone-good  { border-color: #2f9e6b44; }
.tone-good  .value { color: #2f9e6b; }
.tone-warn  { border-color: #c8891f55; }
.tone-warn  .value { color: #c8891f; }
.tone-bad   { border-color: #d8434366; background: #d8434309; }
.tone-bad   .value { color: #d84343; }
</style>
