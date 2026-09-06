<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { NAlert, NButton, NInput, NSpin, useDialog, useMessage } from 'naive-ui'
import {
  AlarmClock, ArrowUp, Bell, Bot, CheckCircle2, CircleAlert,
  SlidersHorizontal, Thermometer, TrendingUp, Wrench, XCircle,
} from 'lucide-vue-next'
import { ApiError, api } from '../api'
import type { ToolCallCard } from '../types'
import { CMD_NAME_TEXT, state } from '../store'
import BotMascot from '../components/BotMascot.vue'

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
const pageEl = ref<HTMLElement | null>(null)

/* 让聊天页正好填满视口剩余空间。

   不能写成 height: calc(100vh - 常数)：这一页上面还有顶栏、页面标题，
   离线时又会多出一条告警横条，任何写死的常数都会在某种组合下算错 ——
   实测就出现过输入框被顶到视口外面 92px（正好是标题块的高度），
   打字前得先往下滚。改成按元素实际位置量，多几层布局都不会错。 */
function fitHeight() {
  const el = pageEl.value
  if (!el) return
  const top = el.getBoundingClientRect().top
  el.style.height = `${Math.max(320, window.innerHeight - top - 8)}px`
}

const SUGGESTIONS = [
  { icon: Thermometer, text: '现在宿舍多少度？' },
  { icon: AlarmClock, text: '闹钟改到 7 点整' },
  { icon: TrendingUp, text: '最近 10 分钟温度怎么变化的？' },
  { icon: Bell, text: '有没有报警记录？' },
  { icon: SlidersHorizontal, text: '把温度阈值调到 30 度' },
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

/* 极简 Markdown 渲染。

   模型爱用 **加粗**、`代码`、- 列表，纯文本显示会把星号原样打出来。
   这里不引第三方库：先把整段做 HTML 转义，再只放行几个固定标签。
   顺序很重要 —— 先转义后套标签，模型输出里就算带 <script> 也只会
   变成字面文字，不可能被当成 HTML 执行。 */
function renderMd(src: string): string {
  const esc = (src ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  const inline = (t: string) => t
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')

  const out: string[] = []
  let inList = false
  for (const raw of esc.split(/\r?\n/)) {
    const li = raw.match(/^\s*[-*]\s+(.*)$/)
    if (li) {
      if (!inList) { out.push('<ul>'); inList = true }
      out.push(`<li>${inline(li[1])}</li>`)
      continue
    }
    if (inList) { out.push('</ul>'); inList = false }
    out.push(raw.trim() ? `<p>${inline(raw)}</p>` : '')
  }
  if (inList) out.push('</ul>')
  return out.join('')
}

/* 工具卡片三态：成功 / 待用户确认 / 未成功。
   未成功不能被淡化 —— 用户必须一眼看出这条命令没生效。 */
function toolState(t: ToolCallCard) {
  if (t.needs_confirmation) return 'pending'
  return t.ok ? 'ok' : 'bad'
}

const empty = computed(() => history.value.length === 0 && !sending.value)
const offline = computed(() => !state.value?.link.connected)

let ro: ResizeObserver | undefined

onMounted(() => {
  void loadStatus()
  fitHeight()
  window.addEventListener('resize', fitHeight)
  // 告警横条出现/消失会把整页往下推，这里跟着重算
  ro = new ResizeObserver(fitHeight)
  if (pageEl.value?.parentElement) ro.observe(pageEl.value.parentElement)
})

onUnmounted(() => {
  window.removeEventListener('resize', fitHeight)
  ro?.disconnect()
})

// 顶部提示条是根据状态显隐的，变化后要重新量
watch([offline, llmEnabled], () => void nextTick(fitHeight))
</script>

<template>
  <!-- 空对话时整页垂直居中，输入框跟标题在一起；开始对话后才沉到底部 -->
  <div ref="pageEl" class="page chat-page" :class="{ empty }">
    <div class="notices">
      <NAlert v-if="llmEnabled === false" type="info" :bordered="false" title="AI 助手未配置">
        {{ llmReason ?? '请在后端 .env 中填写 LLM_API_KEY 后重启服务。' }}
        监控、图表和手动控制不受影响，可以正常使用。
      </NAlert>
      <NAlert v-if="offline" type="warning" :bordered="false">
        设备链路当前离线，AI 只能读到最后一次的数据，控制命令不会生效。
      </NAlert>
    </div>

    <div ref="listEl" class="chat">
      <div class="column">
        <div v-if="empty" class="hero">
          <BotMascot :size="86" :awake="!offline" />
          <p class="hero-sub">
            {{ offline ? '设备链路断开了，我暂时读不到实时数据' : '问我宿舍现在怎么样，或者直接让我改设置' }}
          </p>
        </div>

        <template v-for="(b, i) in history" :key="i">
          <div v-if="b.role === 'user'" class="turn user">
            <div class="user-msg">{{ b.content }}</div>
          </div>

          <div v-else class="turn">
            <div class="reply">
              <div class="reply-mark"><Bot :size="14" /></div>
              <div class="reply-body">
                <!-- 内容已在 renderMd 里做过 HTML 转义，只放行 p/ul/li/strong/code -->
                <div class="text" v-html="renderMd(b.content)"></div>

                <!-- 工具调用卡片：让用户看见 AI 到底调了什么、结果如何 -->
                <div v-if="b.tools?.length" class="tools">
                  <div v-for="(t, j) in b.tools" :key="j" class="tool" :class="toolState(t)">
                    <div class="tool-head">
                      <Wrench :size="12" class="tool-icon" />
                      <span class="tool-name">{{ CMD_NAME_TEXT[t.tool] ?? t.tool }}</span>
                      <span class="pill">
                        <CheckCircle2 v-if="toolState(t) === 'ok'" :size="11" />
                        <CircleAlert v-else-if="toolState(t) === 'pending'" :size="11" />
                        <XCircle v-else :size="11" />
                        {{ toolState(t) === 'ok' ? '成功' : (toolState(t) === 'pending' ? '待确认' : '未成功') }}
                      </span>
                    </div>
                    <code v-if="Object.keys(t.args).length" class="tool-args">{{ JSON.stringify(t.args) }}</code>
                    <div class="tool-verdict">{{ t.verdict }}</div>
                    <div v-if="t.command_id" class="tool-id">命令 {{ t.command_id }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>

        <div v-if="sending" class="turn">
          <div class="reply">
            <div class="reply-mark"><Bot :size="14" /></div>
            <div class="reply-body thinking"><NSpin size="small" /> 正在查设备…</div>
          </div>
        </div>
      </div>
    </div>

    <div class="composer-wrap">
      <div class="composer">
        <NInput
          v-model:value="draft" type="textarea" placeholder="问点什么，或者直接下指令…"
          :autosize="{ minRows: 1, maxRows: 6 }" :disabled="sending" :bordered="false"
          @keydown.enter.exact.prevent="send()"
        />
        <NButton circle type="primary" size="small" :loading="sending"
                 :disabled="!draft.trim()" @click="send()">
          <template #icon><ArrowUp :size="16" /></template>
        </NButton>
      </div>

      <div v-if="empty" class="sugs">
        <button v-for="s in SUGGESTIONS" :key="s.text" class="sug" @click="send(s.text)">
          <component :is="s.icon" :size="15" class="sug-icon" />
          <span>{{ s.text }}</span>
        </button>
      </div>
      <p v-else class="hint">回车发送 · 敏感操作会弹窗确认 · 执行结果以设备回执为准</p>
    </div>
  </div>
</template>

<style scoped>
/* 高度由 fitHeight() 按实际位置算，见 script。这里只留个兜底值 */
.chat-page { display: flex; flex-direction: column; height: calc(100dvh - 160px); padding-bottom: 10px; }

/* 空对话：整页居中，输入框跟着标题上来，不再孤零零吊在页面最底下 */
.chat-page.empty { justify-content: center; padding-bottom: 8vh; }
.chat-page.empty .chat { flex: 0 0 auto; overflow: visible; }

.notices { display: flex; flex-direction: column; gap: 8px; }
.notices:not(:empty) { margin-bottom: 12px; }

.chat { flex: 1; overflow-y: auto; padding: 4px 0 4px; }
.column { max-width: 720px; margin: 0 auto; display: flex; flex-direction: column; gap: 24px; padding: 0 6px; }

.hero { display: flex; flex-direction: column; align-items: center; gap: 14px; margin-bottom: 4px; }
.hero-sub { margin: 0; font-size: 14px; color: var(--muted); text-align: center; line-height: 1.6; }

/* style.css 里给 .page .chat 统一加了白底和边框，在这一页上像是从页面里
   抠出来一块白板，和周围的浅灰背景割裂。对话本来就该躺在页面底色上，
   让用户气泡和工具卡片成为唯一的"面"。 */
.chat-page :deep(.chat) { border: 0; background: transparent; padding: 0; }

/* ---- 用户消息 ---- */
.turn.user { display: flex; justify-content: flex-end; }
.user-msg {
  max-width: 74%; padding: 10px 16px; border-radius: 18px;
  background: color-mix(in srgb, var(--accent) 10%, var(--card));
  color: var(--text); font-size: 14.5px; line-height: 1.7;
  white-space: pre-wrap; word-break: break-word;
}

/* ---- 助手消息：无气泡，纯文本流 ---- */
.reply { display: flex; gap: 12px; align-items: flex-start; }
.reply-mark {
  width: 26px; height: 26px; border-radius: 9px; flex-shrink: 0; margin-top: 2px;
  display: grid; place-items: center;
  background: color-mix(in srgb, var(--accent) 10%, transparent); color: var(--accent);
}
.reply-body { flex: 1; min-width: 0; font-size: 14.5px; line-height: 1.8; }
.text { word-break: break-word; }
.text :deep(p) { margin: 0 0 10px; }
.text :deep(p:last-child) { margin-bottom: 0; }
.text :deep(ul) { margin: 6px 0 10px; padding-left: 20px; }
.text :deep(li) { margin: 3px 0; }
.text :deep(strong) { font-weight: 600; color: var(--text); }
.text :deep(code) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: .88em; padding: 1.5px 5px; border-radius: 5px;
  background: color-mix(in srgb, var(--border) 40%, transparent);
}
.thinking { display: flex; align-items: center; gap: 9px; color: var(--muted); font-size: 13px; }

/* ---- 工具卡片 ---- */
.tools { display: flex; flex-direction: column; gap: 8px; margin-top: 14px; }
.tool {
  border-radius: 12px; padding: 10px 13px; font-size: 12px;
  border: 1px solid var(--border); border-left: 3px solid var(--border);
  background: color-mix(in srgb, var(--border) 10%, transparent);
}
.tool.ok      { border-left-color: #1a9c6b; }
.tool.pending { border-left-color: #d99a2b; }
.tool.bad     { border-left-color: #d84343; background: #d8434308; }

.tool-head { display: flex; align-items: center; gap: 7px; }
.tool-icon { color: var(--muted); flex-shrink: 0; }
.tool-name { font-weight: 600; color: var(--text); font-size: 12.5px; }
.pill {
  display: inline-flex; align-items: center; gap: 3px; margin-left: auto;
  padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 500; white-space: nowrap;
}
.tool.ok      .pill { background: #1a9c6b1a; color: #148057; }
.tool.pending .pill { background: #d99a2b1f; color: #a8741a; }
.tool.bad     .pill { background: #d843431a; color: #c0392b; }

.tool-args {
  display: block; margin-top: 6px; color: var(--muted); word-break: break-all;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 11.5px;
}
.tool-verdict { margin-top: 5px; color: var(--text); }
.tool.bad .tool-verdict { color: #c0392b; }
.tool-id {
  margin-top: 5px; color: var(--muted); opacity: .7; font-size: 11px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}

/* ---- 输入区 ---- */
.composer-wrap { max-width: 720px; width: 100%; margin: 0 auto; padding: 14px 6px 0; }
.composer {
  display: flex; gap: 8px; align-items: flex-end; padding: 8px 8px 8px 6px;
  border-radius: 26px; background: var(--card);
  border: 1px solid color-mix(in srgb, var(--border) 70%, transparent);
  box-shadow: 0 1px 2px rgba(0, 0, 0, .03), 0 10px 30px rgba(0, 0, 0, .045);
  transition: box-shadow .18s, border-color .18s;
}
.composer:focus-within {
  border-color: color-mix(in srgb, var(--accent) 45%, var(--border));
  box-shadow: 0 1px 2px rgba(0, 0, 0, .03), 0 12px 34px rgba(0, 0, 0, .07);
}
.composer :deep(.n-input__textarea-el) { font-size: 14.5px; line-height: 1.6; }

/* ---- 建议：仿 ChatGPT 的行式列表，比一堆胶囊干净 ---- */
.sugs { display: flex; flex-direction: column; margin-top: 18px; }
.sug {
  display: flex; align-items: center; gap: 11px; width: 100%;
  padding: 11px 14px; border: 0; border-radius: 12px; background: transparent;
  cursor: pointer; font: inherit; font-size: 13.5px; color: var(--text);
  text-align: left; transition: background .14s;
}
.sug:hover { background: color-mix(in srgb, var(--border) 26%, transparent); }
.sug-icon { color: var(--muted); flex-shrink: 0; }

.hint { text-align: center; font-size: 11px; color: var(--muted); margin: 10px 0 0; opacity: .75; }
</style>
