<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import {
  NAlert, NButton, NCard, NInputNumber, NRadioButton, NRadioGroup,
  NSlider, NSpace, NTag, NTooltip, useMessage,
} from 'naive-ui'
import { DoorOpen, Fan, Lock, ShieldOff, Thermometer, VolumeX, Wind } from 'lucide-vue-next'
import { ApiError, api, type CommandAck } from '../api'
import { CMD_STATUS_TEXT, state, statusType, ui, online } from '../store'

const message = useMessage()
const s = computed(() => state.value)

// 每个控件独立跟踪自己那条命令，避免互相覆盖
const pending = reactive<Record<string, string>>({})   // slot -> command_id

function cmdOf(slot: string) {
  const id = pending[slot]
  return id ? ui.tracking[id] : undefined
}

function statusText(slot: string): string | null {
  const c = cmdOf(slot)
  if (!c) return null
  return CMD_STATUS_TEXT[c.status] ?? c.status
}

function busy(slot: string): boolean {
  const c = cmdOf(slot)
  return !!c && (c.status === 'pending' || c.status === 'sent')
}

async function run(slot: string, fn: () => Promise<CommandAck>) {
  try {
    const ack = await fn()
    pending[slot] = ack.command_id
    // 已提交，交还控制权给服务端状态
    if (slot in touched) touched[slot as keyof typeof touched] = false
    if (ack.status === 'unsupported') {
      message.warning(ack.error ?? '当前固件不支持该操作')
    }
  } catch (e) {
    const msg = e instanceof ApiError ? e.message : String(e)
    message.error(msg)
  }
}

// 命令进入终态时给一次提示
watch(() => ({ ...ui.tracking }), (now, before) => {
  for (const [id, cmd] of Object.entries(now)) {
    const prev = before?.[id]
    if (prev && prev.status === cmd.status) continue
    if (cmd.status === 'confirmed') message.success('设备已确认执行')
    else if (cmd.status === 'failed') message.error(`执行失败：${cmd.error ?? '未知原因'}`)
    else if (cmd.status === 'timeout') message.warning('已下发但未收到回执，请勿视为已生效')
  }
}, { deep: true })

// ---- 表单本地值 ----
const fanMode = ref<'auto' | 'manual'>('auto')
const fanDuty = ref(50)
const threshold = ref(28)
const nearCm = ref(60)

// 状态每秒推送一次。用户一旦动过某个控件，就不再用服务端值覆盖它，
// 否则输入框里的数字会被 1Hz 的状态刷新不停冲掉，根本改不动。
const touched = reactive({ fan: false, th: false, near: false })

watch(s, (v) => {
  if (!v) return
  if (!touched.fan) {
    if (v.env.fan_mode != null) fanMode.value = v.env.fan_mode
    if (v.env.fan_mode === 'manual' && v.env.fan_duty !== null) fanDuty.value = v.env.fan_duty
  }
  if (!touched.th) threshold.value = v.settings.temp_threshold
  if (!touched.near) nearCm.value = v.settings.near_threshold
}, { immediate: true })

const cap = (name: string) => s.value?.capabilities[name]
const canDo = (name: string) => online.value && cap(name)?.supported === true

const armed = computed(() =>
  ['armed', 'arming', 'alarm'].includes(s.value?.security.security_state ?? ''))

const alarming = computed(() => (s.value?.security.alarm_level ?? 0) >= 2)
</script>

<template>
  <div class="page">
    <NAlert v-if="s?.link.readonly" type="warning" :bordered="false" style="margin-bottom:16px"
            title="只读模式：所有控制均不可用">
      {{ s.link.readonly_reason }}
    </NAlert>

    <div class="section-title">环境控制 · 节点B</div>

    <NCard :bordered="false" class="ctrl-card">
      <template #header>
        <div class="ch"><Fan :size="17" /> 风扇</div>
      </template>
      <template #header-extra>
        <NTag v-if="statusText('fan')" size="small" :type="statusType(cmdOf('fan')!.status)" round>
          {{ statusText('fan') }}
        </NTag>
      </template>

      <NSpace vertical size="large">
        <div>
          <div class="lbl">运行模式</div>
          <NRadioGroup v-model:value="fanMode" :disabled="!canDo('set_fan')" size="medium"
                       @update:value="touched.fan = true">
            <NRadioButton value="auto">自动（由 NodeB 温度闭环）</NRadioButton>
            <NRadioButton value="manual">手动指定</NRadioButton>
          </NRadioGroup>
        </div>

        <div v-if="fanMode === 'manual'">
          <div class="lbl">PWM 占空比：{{ fanDuty }}%</div>
          <NSlider v-model:value="fanDuty" :min="0" :max="100" :step="5"
                   :disabled="!canDo('set_fan')" :marks="{ 0: '0', 50: '50', 100: '100' }"
                   @update:value="touched.fan = true" />
        </div>

        <div class="row">
          <NButton type="primary" :disabled="!canDo('set_fan')" :loading="busy('fan')"
                   @click="run('fan', () => api.setFan(fanMode, fanDuty))">
            应用风扇设置
          </NButton>
          <span class="cur">
            当前：{{ s?.env.fan_duty ?? '未知' }}<template v-if="s?.env.fan_duty !== null">%</template>
            · {{ s?.env.fan_mode == null ? '模式未知' : (s.env.fan_mode === 'manual' ? '手动' : '自动') }}
          </span>
        </div>
        <div class="note">显示的是 PWM 输出占空比，板上没有转速传感器，不代表实测转速。</div>
      </NSpace>
    </NCard>

    <NCard :bordered="false" class="ctrl-card">
      <template #header>
        <div class="ch"><Thermometer :size="17" /> 温度阈值</div>
      </template>
      <template #header-extra>
        <NTag v-if="statusText('th')" size="small" :type="statusType(cmdOf('th')!.status)" round>
          {{ statusText('th') }}
        </NTag>
      </template>
      <NSpace align="center">
        <NInputNumber v-model:value="threshold" :min="10" :max="40" :step="1"
                      :disabled="!canDo('set_temperature_threshold')" style="width:150px"
                      @update:value="touched.th = true">
          <template #suffix>℃</template>
        </NInputNumber>
        <NButton :disabled="!canDo('set_temperature_threshold')" :loading="busy('th')"
                 @click="run('th', () => api.setThreshold(threshold!))">保存</NButton>
        <span class="cur">当前 {{ s?.settings.temp_threshold }}℃</span>
      </NSpace>
      <div class="note">允许 10–40℃，与固件 NodeB 的 SETCFG 校验区间一致。保存后刷新页面仍然保持。</div>
    </NCard>

    <NCard :bordered="false" class="ctrl-card">
      <template #header>
        <div class="ch"><Wind :size="17" /> 通风窗</div>
      </template>
      <NSpace align="center">
        <NTooltip :disabled="canDo('set_window')">
          <template #trigger>
            <span>
              <NButton :disabled="!canDo('set_window')" @click="run('win', () => api.setWindow('open'))">
                开窗
              </NButton>
            </span>
          </template>
          {{ cap('set_window')?.reason }}
        </NTooltip>
        <NTooltip :disabled="canDo('set_window')">
          <template #trigger>
            <span>
              <NButton :disabled="!canDo('set_window')" @click="run('win', () => api.setWindow('close'))">
                关窗
              </NButton>
            </span>
          </template>
          {{ cap('set_window')?.reason }}
        </NTooltip>
        <NTooltip :disabled="canDo('set_window')">
          <template #trigger>
            <span>
              <NButton :disabled="!canDo('set_window')" @click="run('win', () => api.setWindow('auto'))">
                自动
              </NButton>
            </span>
          </template>
          {{ cap('set_window')?.reason }}
        </NTooltip>
        <NTag v-if="!canDo('set_window')" type="warning" size="small" round>固件不支持</NTag>
        <span class="cur">当前：{{ s?.env.window_state === null ? '未知' : (s?.env.window_state === 'open' ? '打开' : '关闭') }} · {{ s?.env.window_mode === 'manual' ? '手动' : (s?.env.window_mode === 'auto' ? '自动' : '模式未知') }}</span>
      </NSpace>
      <div class="note">自动模式由 NodeB 根据温度阈值闭环控制；开窗、关窗会保持手动模式，直到点击“自动”。</div>
    </NCard>

    <div class="section-title">安防控制 · 节点C</div>

    <NCard :bordered="false" class="ctrl-card">
      <template #header>
        <div class="ch"><Lock :size="17" /> 布防</div>
      </template>
      <template #header-extra>
        <NTag v-if="statusText('sec')" size="small" :type="statusType(cmdOf('sec')!.status)" round>
          {{ statusText('sec') }}
        </NTag>
      </template>
      <NSpace align="center">
        <NButton type="primary" :disabled="!canDo('set_security_mode') || armed" :loading="busy('sec')"
                 @click="run('sec', () => api.setSecurity('arm'))">
          <template #icon><Lock :size="15" /></template>
          布防
        </NButton>
        <NButton :disabled="!canDo('set_security_mode') || !armed" :loading="busy('sec')"
                 @click="run('sec', () => api.setSecurity('disarm'))">
          <template #icon><ShieldOff :size="15" /></template>
          撤防
        </NButton>
        <span class="cur">
          当前：{{ s?.security.security_state ? ({ disarmed: '已撤防', arming: '布防倒计时', armed: '已布防', alarm: '报警中' } as Record<string, string>)[s.security.security_state] : '未知' }}
        </span>
      </NSpace>
      <div class="note">布防后有 10 秒退出延时，倒计时结束才真正生效（对应 NodeC 的 ARM_DELAY_S）。</div>
    </NCard>

    <NCard :bordered="false" class="ctrl-card">
      <template #header>
        <div class="ch"><VolumeX :size="17" /> 报警静音</div>
      </template>
      <template #header-extra>
        <NTag v-if="statusText('sil')" size="small" :type="statusType(cmdOf('sil')!.status)" round>
          {{ statusText('sil') }}
        </NTag>
      </template>
      <NSpace align="center">
        <NButton :type="alarming ? 'error' : 'default'" :disabled="!canDo('silence_alarm')"
                 :loading="busy('sil')" @click="run('sil', () => api.silence())">
          静音当前报警
        </NButton>
        <span class="cur">静音只停声音，安防状态保持不变。</span>
        <NTag v-if="s?.security.silenced" type="success" size="small" round>已静音</NTag>
      </NSpace>
    </NCard>

    <NCard :bordered="false" class="ctrl-card">
      <template #header>
        <div class="ch"><DoorOpen :size="17" /> 接近提示阈值</div>
      </template>
      <template #header-extra>
        <NTag v-if="statusText('near')" size="small" :type="statusType(cmdOf('near')!.status)" round>
          {{ statusText('near') }}
        </NTag>
      </template>
      <NSpace align="center">
        <NInputNumber v-model:value="nearCm" :min="10" :max="200" :step="10"
                      :disabled="!canDo('set_near_threshold')" style="width:150px"
                      @update:value="touched.near = true">
          <template #suffix>cm</template>
        </NInputNumber>
        <NButton :disabled="!canDo('set_near_threshold')" :loading="busy('near')"
                 @click="run('near', () => api.setNearThreshold(nearCm!))">保存</NButton>
        <span class="cur">当前 {{ s?.settings.near_threshold }}cm</span>
      </NSpace>
      <div class="note">超声波读数低于该值即判定门口有人靠近。允许 10–200cm。</div>
    </NCard>
  </div>
</template>

<style scoped>
.ctrl-card { margin-bottom: 12px; border-radius: 14px; background: var(--card);
  border: 1px solid var(--border) !important; }
.ch { display: flex; align-items: center; gap: 8px; font-size: 14.5px; font-weight: 600; }
.lbl { font-size: 12.5px; color: var(--muted); margin-bottom: 8px; }
.row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.cur { font-size: 12.5px; color: var(--muted); }
.note { font-size: 11.5px; color: var(--muted); margin-top: 10px; line-height: 1.5; }
</style>
