<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { NAlert, NButton, NInput, NSpin, NTag, useDialog, useMessage } from 'naive-ui'
import { Bot, Send, User, Wrench } from 'lucide-vue-next'
import { ApiError, api } from '../api'
import type { ToolCallCard } from '../types'
import { CMD_NAME_TEXT, state } from '../store'

interface Bubble {
  role: 'user' | 'assistant'
  content: string
  tools?: ToolCallCard[]
}

const message = useMessage()
const dialog = useDialog()

const history = ref<Bubble[]>([])
const draft = ref('')
const sending = ref(false)
const llmEnabled = ref<boolean | null>(null)
const llmReason = ref<string | null>(null)
const listEl = ref<HTMLElement | null>(null)

const SUGGESTIONS = [
  '现在宿舍多少度？',
  '把风扇设为手动 50%',
  '最近 10 分钟温度怎么变化的？',
  '有没有报警记录？',
  '把温度阈值调到 30 度',
]

async function loadStatus() {
  try {
    const st = await api.aiChat([]).catch(() => null)
    if (st) {
      llmEnabled.value = st.enabled
      if (!st.enabled) llmReason.value = st.reply
    }
  } catch { /* 忽略 */ }
}

async function scrollDown() {
  await nextTick()
  listEl.value?.scrollTo({ top: listEl.value.scrollHeight, behavior: 'smooth' })
}

async function send(text?: string) {
  const content = (text ?? draft.value).trim()
  if (!content || sending.value) return

  history.value.push({ role: 'user', content })
  draft.value = ''
  sending.value = true
  void scrollDown()

  try {
    const payload = history.value.map((b) => ({ role: b.role, content: b.content }))
    const reply = await api.aiChat(payload)
    llmEnabled.value = reply.enabled
    history.value.push({ role: 'assistant', content: reply.reply, tools: reply.tool_calls })

    // 敏感操作：由用户在界面上二次确认，模型说了不算
    const need = reply.tool_calls?.find((t) => t.needs_confirmation)
    if (need) askConfirm(need)
  } catch (e) {
    const msg = e instanceof ApiError ? e.message : String(e)
    history.value.push({ role: 'assistant', content: `出错了：${msg}` })
  } finally {
    sending.value = false
    void scrollDown()
  }
}

function askConfirm(tool: ToolCallCard) {
  dialog.warning({
    title: '需要你确认的敏感操作',
    content: `AI 请求执行「${CMD_NAME_TEXT[tool.tool] ?? tool.tool}」，参数 ${JSON.stringify(tool.args)}。确认后才会真正下发到设备。`,
    positiveText: '确认执行',
    negativeText: '取消',
    onPositiveClick: async () => {
      sending.value = true
      try {
        const payload = history.value.map((b) => ({ role: b.role, content: b.content }))
        const reply = await api.aiChat(payload, { tool: tool.tool, args: tool.args })
        history.value.push({ role: 'assistant', content: reply.reply, tools: reply.tool_calls })
      } catch (e) {
        message.error(e instanceof ApiError ? e.message : String(e))
      } finally {
        sending.value = false
        void scrollDown()
      }
    },
  })
}

const offline = computed(() => !state.value?.link.connected)

onMounted(loadStatus)
</script>

<template>
  <div class="page chat-page">
    <NAlert v-if="llmEnabled === false" type="info" :bordered="false" style="margin-bottom:12px"
            title="AI 助手未配置">
      {{ llmReason ?? '请在后端 .env 中填写 LLM_API_KEY 后重启服务。' }}
      监控、图表和手动控制不受影响，可以正常使用。
    </NAlert>

    <NAlert v-if="offline" type="warning" :bordered="false" style="margin-bottom:12px">
      设备链路当前离线，AI 只能读到最后一次的数据，控制命令不会生效。
    </NAlert>

    <div ref="listEl" class="chat">
      <div v-if="!history.length" class="welcome">
        <Bot :size="34" />
        <h3>问点什么吧</h3>
        <p>我可以查当前状态和历史数据，也可以帮你改参数。所有读数都来自设备，不会编造。</p>
        <div class="suggestions">
          <button v-for="s in SUGGESTIONS" :key="s" class="sug" @click="send(s)">{{ s }}</button>
        </div>
      </div>

      <div v-for="(b, i) in history" :key="i" class="bubble-row" :class="b.role">
        <div class="avatar">
          <User v-if="b.role === 'user'" :size="15" />
          <Bot v-else :size="15" />
        </div>
        <div class="bubble">
          <div class="text">{{ b.content }}</div>

          <!-- 工具调用小卡片：让用户看见 AI 到底做了什么 -->
          <div v-if="b.tools?.length" class="tools">
            <div v-for="(t, j) in b.tools" :key="j" class="tool" :class="{ bad: !t.ok }">
              <div class="tool-head">
                <Wrench :size="13" />
                <span class="tool-name">{{ CMD_NAME_TEXT[t.tool] ?? t.tool }}</span>
                <NTag size="tiny" round :type="t.ok ? 'success' : (t.needs_confirmation ? 'warning' : 'error')">
                  {{ t.ok ? '成功' : (t.needs_confirmation ? '待确认' : '未成功') }}
                </NTag>
              </div>
              <div v-if="Object.keys(t.args).length" class="tool-args mono">
                {{ JSON.stringify(t.args) }}
              </div>
              <div class="tool-verdict">{{ t.verdict }}</div>
              <div v-if="t.command_id" class="tool-id mono">命令 {{ t.command_id }}</div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="sending" class="bubble-row assistant">
        <div class="avatar"><Bot :size="15" /></div>
        <div class="bubble thinking"><NSpin size="small" /> 正在查设备…</div>
      </div>
    </div>

    <div class="composer">
      <NInput
        v-model:value="draft" type="textarea" placeholder="用一句话提问或下指令…"
        :autosize="{ minRows: 1, maxRows: 4 }" :disabled="sending"
        @keydown.enter.exact.prevent="send()"
      />
      <NButton type="primary" :loading="sending" :disabled="!draft.trim()" @click="send()">
        <template #icon><Send :size="15" /></template>
      </NButton>
    </div>
  </div>
</template>

<style scoped>
.chat-page { display: flex; flex-direction: column; height: calc(100vh - 64px); padding-bottom: 12px; }
@media (max-width: 859px) { .chat-page { height: calc(100vh - 128px); } }

.chat { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 14px; padding: 4px 2px 12px; }

.welcome { text-align: center; color: var(--muted); padding: 40px 16px; }
.welcome h3 { margin: 12px 0 6px; color: var(--text); font-size: 17px; }
.welcome p { font-size: 13px; margin: 0 auto 18px; max-width: 380px; line-height: 1.6; }
.suggestions { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }
.sug {
  padding: 7px 13px; border-radius: 999px; cursor: pointer; font-size: 12.5px;
  background: var(--card); border: 1px solid var(--border); color: var(--text);
  font-family: inherit;
}
.sug:hover { border-color: var(--accent); color: var(--accent); }

.bubble-row { display: flex; gap: 9px; align-items: flex-start; }
.bubble-row.user { flex-direction: row-reverse; }
.avatar {
  width: 27px; height: 27px; border-radius: 8px; flex-shrink: 0;
  display: grid; place-items: center;
  background: var(--card); border: 1px solid var(--border); color: var(--muted);
}
.bubble {
  max-width: min(680px, 82%); padding: 10px 13px; border-radius: 13px;
  background: var(--card); border: 1px solid var(--border); font-size: 14px; line-height: 1.65;
}
.bubble-row.user .bubble {
  background: color-mix(in srgb, var(--accent) 12%, var(--card));
  border-color: color-mix(in srgb, var(--accent) 26%, var(--border));
}
.text { white-space: pre-wrap; word-break: break-word; }
.thinking { display: flex; align-items: center; gap: 8px; color: var(--muted); font-size: 13px; }

.tools { display: flex; flex-direction: column; gap: 7px; margin-top: 10px; }
.tool {
  border: 1px solid var(--border); border-radius: 9px; padding: 8px 10px;
  background: color-mix(in srgb, var(--accent) 4%, transparent); font-size: 12px;
}
.tool.bad { border-color: #d8434355; background: #d8434309; }
.tool-head { display: flex; align-items: center; gap: 6px; color: var(--muted); }
.tool-name { font-weight: 600; color: var(--text); font-size: 12.5px; }
.tool-args { color: var(--muted); margin-top: 4px; word-break: break-all; }
.tool-verdict { margin-top: 4px; }
.tool-id { color: var(--muted); margin-top: 3px; opacity: .8; }

.composer { display: flex; gap: 8px; align-items: flex-end; padding-top: 10px;
  border-top: 1px solid var(--border); }
</style>
