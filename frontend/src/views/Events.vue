<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { NButton, NEmpty, NSelect, NSpin, NTabPane, NTabs, NTag } from 'naive-ui'
import { api } from '../api'
import {
  CMD_NAME_TEXT, CMD_STATUS_TEXT, commands, events, fmtDateTime,
  refreshCommands, refreshEvents, statusType,
} from '../store'

const loading = ref(false)
const level = ref('all')
const node = ref('all')
const kind = ref('all')

const levelOpts = [
  { label: '全部级别', value: 'all' },
  { label: '仅报警', value: 'alarm' },
  { label: '仅警告', value: 'warning' },
  { label: '仅信息', value: 'info' },
]
const nodeOpts = [
  { label: '全部节点', value: 'all' },
  { label: '节点A', value: 'A' },
  { label: '节点B', value: 'B' },
  { label: '节点C', value: 'C' },
]
const kindOpts = [
  { label: '全部类型', value: 'all' },
  { label: '安防', value: 'security' },
  { label: '门磁', value: 'door' },
  { label: '振动', value: 'vibration' },
  { label: '通风窗', value: 'window' },
  { label: '节点上下线', value: 'node' },
  { label: '总线', value: 'bus' },
  { label: '串口链路', value: 'link' },
]

const KIND_TEXT: Record<string, string> = {
  security: '安防', door: '门磁', vibration: '振动', window: '通风窗',
  node: '节点', bus: '总线', link: '链路', command: '命令',
}

async function load() {
  loading.value = true
  try {
    const res = await api.events({
      minutes: 1440,
      level: level.value,
      node: node.value,
      kind: kind.value,
    })
    events.value = res.events
  } finally {
    loading.value = false
  }
}

const tagType = (lv: string) =>
  ({ alarm: 'error', warning: 'warning', info: 'default' } as const)[lv] ?? 'default'

const cmdList = computed(() => commands.value)

onMounted(() => {
  void refreshEvents()
  void refreshCommands()
})
</script>

<template>
  <div class="page">
    <NTabs type="line" animated>
      <NTabPane name="events" tab="事件记录">
        <div class="filters">
          <NSelect v-model:value="level" :options="levelOpts" size="small" style="width:130px"
                   @update:value="load" />
          <NSelect v-model:value="node" :options="nodeOpts" size="small" style="width:120px"
                   @update:value="load" />
          <NSelect v-model:value="kind" :options="kindOpts" size="small" style="width:130px"
                   @update:value="load" />
          <NButton size="small" :loading="loading" @click="load">刷新</NButton>
        </div>

        <div v-if="loading && !events.length" class="ph"><NSpin /></div>
        <NEmpty v-else-if="!events.length" description="最近 24 小时没有符合条件的事件" />
        <div v-else class="list">
          <div v-for="(e, i) in events" :key="e.id ?? `${e.ts}-${i}`" class="row" :class="e.level">
            <div class="row-main">
              <NTag :type="tagType(e.level)" size="small" round>
                {{ { alarm: '报警', warning: '警告', info: '信息' }[e.level] ?? e.level }}
              </NTag>
              <span class="kind">{{ KIND_TEXT[e.kind] ?? e.kind }}</span>
              <span v-if="e.node !== '-'" class="node">节点{{ e.node }}</span>
              <span class="msg">{{ e.message }}</span>
            </div>
            <span class="ts mono">{{ fmtDateTime(e.ts) }}</span>
          </div>
        </div>
      </NTabPane>

      <NTabPane name="commands" tab="操作记录">
        <div class="filters">
          <NButton size="small" @click="refreshCommands">刷新</NButton>
          <span class="hint">包含用户和 AI 发出的全部控制命令及其执行结果</span>
        </div>

        <NEmpty v-if="!cmdList.length" description="还没有任何控制命令" />
        <div v-else class="list">
          <div v-for="c in cmdList" :key="c.id" class="row">
            <div class="row-main">
              <NTag :type="statusType(c.status)" size="small" round>
                {{ CMD_STATUS_TEXT[c.status] ?? c.status }}
              </NTag>
              <NTag v-if="c.source === 'ai'" type="info" size="small" round>AI</NTag>
              <span class="kind">{{ CMD_NAME_TEXT[c.name] ?? c.name }}</span>
              <span v-if="c.target_node !== '-'" class="node">→ 节点{{ c.target_node }}</span>
              <span class="msg mono">{{ JSON.stringify(c.params) }}</span>
              <span v-if="c.error" class="err">{{ c.error }}</span>
            </div>
            <span class="ts mono">{{ fmtDateTime(c.created_at) }}</span>
          </div>
        </div>
      </NTabPane>
    </NTabs>
  </div>
</template>

<style scoped>
.filters { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin: 12px 0 14px; }
.hint { font-size: 11.5px; color: var(--muted); }
.ph { display: grid; place-items: center; padding: 50px; }

.list { display: flex; flex-direction: column; gap: 6px; }
.row {
  display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;
  padding: 11px 14px; border-radius: 11px;
  background: var(--card); border: 1px solid var(--border);
}
.row.alarm { border-color: #d8434355; background: #d8434309; }
.row.warning { border-color: #c8891f44; }
.row-main { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; min-width: 0; }
.kind { font-size: 13px; font-weight: 550; }
.node { font-size: 11.5px; color: var(--muted); }
.msg { font-size: 13px; color: var(--text); word-break: break-word; }
.err { font-size: 11.5px; color: #d84343; }
.ts { color: var(--muted); white-space: nowrap; flex-shrink: 0; padding-top: 3px; }

@media (max-width: 640px) {
  .row { flex-direction: column; gap: 6px; }
  .ts { padding-top: 0; }
}
</style>
