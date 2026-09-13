<script setup lang="ts">
import {computed} from 'vue'
import {NAlert,NSpin} from 'naive-ui'
import {Fan,Sun,Thermometer,Ruler,ArrowUpRight,ShieldCheck,Radio,Activity} from 'lucide-vue-next'
import StatCard from '../components/StatCard.vue'
import TemperatureTrend from '../components/TemperatureTrend.vue'
import {SEC_STATE_TEXT,fmtTime,luxText,overallStatus,relTime,state,events,online} from '../store'
const s=computed(()=>state.value)
const recent=computed(()=>events.value.slice(0,4))
const nodeList=computed(()=>[{key:'A',name:'主控网关',role:'数据汇总 / RS485 主站',info:s.value?.nodes.A},{key:'B',name:'环境节点',role:'温度 / 光照 / 通风',info:s.value?.nodes.B},{key:'C',name:'安防节点',role:'门磁 / 距离 / 报警',info:s.value?.nodes.C}])
const tempTone=computed(()=>{const t=s.value?.env.temp_c;if(t==null)return 'normal';const th=s.value?.settings.temp_threshold??28;return t>=th+3?'bad':t>=th?'warn':'normal'})
const securityText=computed(()=>s.value?.security.security_state?SEC_STATE_TEXT[s.value.security.security_state]:'未知')
const alarmText=computed(()=>s.value?.security.alarm_level==null?'未知':['无报警','接近提示','报警中'][s.value.security.alarm_level]??'未知')
</script>
<template>
<div class="page">
<div v-if="!s" class="loading"><NSpin/><p>正在读取设备状态…</p></div>
<template v-else>
<div class="status-line"><span :class="overallStatus.type"><i/>{{overallStatus.text}}</span><span>最近通信 {{relTime(s.link.last_frame_at)}}</span><RouterLink to="/system">查看连接<ArrowUpRight :size="14"/></RouterLink></div>
<NAlert v-if="s.link.readonly" type="info" :bordered="false" style="margin-bottom:16px" title="只读监控">{{s.link.readonly_reason}}</NAlert>
<NAlert v-if="(s.link.arm_countdown??0)>0" type="warning" :bordered="false" style="margin-bottom:16px">布防将在 {{s.link.arm_countdown}} 秒后生效，请及时离开。</NAlert>
<div class="grid">
<StatCard label="室内温度" :value="s.env.temp_c" unit="℃" :icon="Thermometer" :tone="tempTone" :note="s.env.temp_saturated?'读数达到固件上限':s.link.mode==='serial'?'环境节点 · 温度采样':'自动控制阈值 '+s.settings.temp_threshold+'℃'"/>
<StatCard label="光照等级" :value="s.env.lux_level===null?null:luxText(s.env.lux_level)" :icon="Sun" note="0–4 档 · 未进行照度标定"/>
<StatCard label="风扇 PWM" :value="s.env.fan_duty" unit="%" :icon="Fan" :note="(s.env.fan_mode==null?'模式未知':s.env.fan_mode==='manual'?'手动模式':'自动模式')+' · 输出占空比，非实测转速'"/>
<StatCard label="门口距离" :value="s.security.distance_cm" unit="cm" :digits="0" :icon="Ruler" :tone="s.security.near?'warn':'normal'" :note="s.security.distance_valid?'超声波有效读数':'暂无有效回波'"/>
</div>
<div class="dashboard-columns">
<section class="panel"><div class="panel-head"><h2>温度趋势</h2><RouterLink to="/analytics">全部数据<ArrowUpRight :size="14"/></RouterLink></div><div class="chart-sub"><span class="legend-mark"/>室内温度<span class="range">最近 10 分钟</span></div><TemperatureTrend/></section>
<section class="panel"><div class="panel-head"><h2><ShieldCheck :size="17"/>安防与设备</h2><RouterLink to="/control">控制<ArrowUpRight :size="14"/></RouterLink></div><dl class="device-list">
<div><dt>布防状态</dt><dd>{{securityText}}</dd></div>
<div><dt>门磁</dt><dd>{{s.security.door_state===null?'未知':s.security.door_state==='open'?'门已打开':'门已关闭'}}</dd></div>
<div><dt>报警</dt><dd :class="{danger:(s.security.alarm_level??0)>=2}">{{alarmText}}</dd></div>
<div><dt>通风窗<small>软件状态</small></dt><dd>{{s.env.window_state===null?'未知':s.env.window_state==='open'?'打开':'关闭'}}</dd></div>
</dl></section>
<section class="panel"><div class="panel-head"><h2>最近事件</h2><RouterLink to="/events">全部记录<ArrowUpRight :size="14"/></RouterLink></div><div v-if="!recent.length" class="empty"><Activity :size="24"/><span>暂无事件记录</span></div><div v-for="(e,i) in recent" :key="e.id??i" class="event-item"><span class="event-marker" :class="e.level"/><div><p>{{e.message}}</p><small>节点 {{e.node}} · {{fmtTime(e.ts)}}</small></div></div></section>
<section class="panel"><div class="panel-head"><h2>节点连接</h2><span class="muted">RS485 总线</span></div><div v-for="n in nodeList" :key="n.key" class="node-row"><span class="node-avatar">{{n.key}}</span><div><strong>{{n.name}}</strong><small>{{n.role}}</small></div><span class="node-state" :class="{connected:online&&n.info?.online}"><Radio :size="13"/>{{online?(n.info?.online?'在线':'离线'):'未确认'}}</span></div></section>
</div>
<div class="footnote">已解析 {{s.diagnostics.frames_ok}} 条报文 <span>解析异常 {{s.diagnostics.frames_bad}}</span><span>总线 CRC 错误 {{s.diagnostics.crc_errors}}</span></div>
</template></div>
</template>
<style scoped>
.loading{padding:80px;text-align:center;color:var(--muted)}.status-line{display:flex;align-items:center;gap:20px;font-size:12px;color:var(--muted);margin-bottom:18px}.status-line>span:first-child{color:var(--text);font-weight:500}.status-line i{display:inline-block;width:7px;height:7px;border-radius:50%;background:#2a9275;margin-right:7px}.status-line .error i{background:#d14a4a}.status-line .warning i{background:#c78c27}a{display:inline-flex;align-items:center;gap:4px;text-decoration:none;color:var(--accent);font-size:12px}.status-line a{margin-left:auto}.dashboard-columns{display:grid;grid-template-columns:minmax(0,1.65fr) minmax(280px,1fr);gap:20px;margin-top:22px}.panel{background:white;border:1px solid var(--border);border-radius:8px;overflow:hidden}.panel-head{padding:18px 20px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #edf0f3}.panel h2{margin:0;font-size:14px;font-weight:600;display:flex;align-items:center;gap:8px}.chart-sub{display:flex;align-items:center;padding:15px 20px 0;gap:6px;font-size:11px;color:var(--muted)}.legend-mark{width:14px;height:2px;background:var(--accent)}.range{margin-left:auto}.device-list{margin:0;padding:0 20px}.device-list>div{display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid #f0f2f5;font-size:13px}.device-list>div:last-child{border:0}.device-list dt{color:var(--muted)}.device-list small{font-size:10px;margin-left:7px;color:#96a0ad}.device-list dd{margin:0;font-weight:500}.danger{color:#c34545}.event-item{display:flex;gap:12px;padding:14px 20px;border-bottom:1px solid #f0f2f5}.event-item:last-child{border:0}.event-marker{margin-top:7px;width:6px;height:6px;border-radius:50%;background:#a0aab5;flex-shrink:0}.event-marker.alarm{background:#d14a4a}.event-marker.warning{background:#c78c27}.event-item p{font-size:13px;margin:0 0 4px}.event-item small,.node-row small{font-size:11px;color:var(--muted)}.node-row{display:flex;align-items:center;gap:11px;margin:0 20px;padding:15px 0;border-bottom:1px solid #f0f2f5}.node-row:last-child{border:0}.node-avatar{width:33px;height:33px;background:#f1f4f7;display:grid;place-items:center;color:#738294;border-radius:6px;font-size:13px}.node-row strong{font-size:13px;font-weight:500;display:block}.node-row small{display:block;margin-top:2px}.node-state{margin-left:auto;display:flex;align-items:center;gap:5px;font-size:11px;color:#9aa3af}.node-state.connected{color:#299477}.muted{font-size:11px;color:var(--muted)}.empty{min-height:160px;display:flex;align-items:center;justify-content:center;gap:10px;color:#8b96a5;font-size:13px}.footnote{margin-top:20px;color:var(--muted);font-size:11px}.footnote span{margin-left:22px}
@media(max-width:1050px){.dashboard-columns{grid-template-columns:1fr}}@media(max-width:520px){.status-line{gap:10px;font-size:11px}.status-line a{display:none}.footnote span{margin-left:12px}.panel-head{padding:16px}.device-list small{display:none}}
</style>
