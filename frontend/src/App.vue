<script setup lang="ts">
import {computed,onMounted} from 'vue'
import {useRoute,useRouter} from 'vue-router'
import {NConfigProvider,NDialogProvider,NGlobalStyle,NMessageProvider,zhCN,dateZhCN} from 'naive-ui'
import {Activity,BarChart3,Bot,LayoutDashboard,ScrollText,SlidersHorizontal,House,ChevronRight} from 'lucide-vue-next'
import {alarmActive,bootstrap,online,overallStatus,state,wsConnected} from './store'
const route=useRoute(),router=useRouter()
const navItems=[{path:'/',label:'总览',title:'宿舍总览',description:'环境、设备与安防状态',icon:LayoutDashboard},{path:'/control',label:'控制',title:'设备控制',description:'调整运行模式与设备参数',icon:SlidersHorizontal},{path:'/analytics',label:'分析',title:'数据分析',description:'查看历史采样与环境变化',icon:BarChart3},{path:'/events',label:'事件',title:'事件记录',description:'报警信息与操作回执',icon:ScrollText},{path:'/assistant',label:'AI',title:'AI 助手',description:'通过对话查询数据和控制设备',icon:Bot},{path:'/system',label:'诊断',title:'系统诊断',description:'连接状态、能力与测试工具',icon:Activity}]
const current=computed(()=>navItems.find(n=>n.path===route.path)??navItems[0]!)
const modeLabel=computed(()=>!state.value?'等待连接':state.value.link.mode==='serial'?'串口监控':'模拟演示')
const themeOverrides={common:{primaryColor:'#167d8d',primaryColorHover:'#2096a7',primaryColorPressed:'#106675',borderRadius:'6px',textColorBase:'#202b3b',bodyColor:'#f5f6f8',fontFamily:'"Segoe UI", "Microsoft YaHei", sans-serif'},Card:{borderRadius:'8px',titleFontSizeMedium:'15px'}}
onMounted(bootstrap)
</script>
<template>
<NConfigProvider :theme-overrides="themeOverrides" :locale="zhCN" :date-locale="dateZhCN"><NGlobalStyle/><NMessageProvider><NDialogProvider>
<div class="shell">
<aside class="sidenav">
<div class="brand"><span class="logo"><House :size="22"/></span><div class="title">寝室管家<small>宿舍测控平台</small></div></div>
<div class="nav-label">工作空间</div>
<nav aria-label="主导航"><button v-for="item in navItems" :key="item.path" class="navbtn" :class="{active:route.path===item.path}" @click="router.push(item.path)"><component :is="item.icon" :size="19"/><span>{{item.title}}</span><ChevronRight v-if="route.path===item.path" :size="14" class="chevron"/></button></nav>
<div class="nav-footer"><span class="status-dot" :class="overallStatus.type"/><span>{{overallStatus.text}}</span><small>STC-B · 三节点系统</small></div>
</aside>
<div class="workspace">
<header class="topbar"><div class="breadcrumb"><House :size="16"/><span>我的宿舍</span><ChevronRight :size="13"/><strong>{{current.label}}</strong></div><div class="topbar-right"><span class="mode-label">{{modeLabel}}</span><span class="connection" :class="{ok:online}"><i/>{{wsConnected?(online?'实时连接':'设备断开'):'正在重连'}}</span></div></header>
<div v-if="!wsConnected" class="banner">实时连接已断开，正在重连。下方为最后收到的记录，当前设备状态尚未确认。</div>
<div v-else-if="alarmActive" class="banner alarm">安防报警中，请查看门口状态及事件记录。</div>
<div class="page-heading"><div><h1>{{current.title}}</h1><p>{{current.description}}</p></div><span v-if="state?.board_time" class="board-clock">板上时间 <b>{{state.board_time}}</b></span></div>
<main><RouterView/></main>
</div>
<nav class="tabbar" aria-label="移动端导航"><button v-for="item in navItems" :key="item.path" :class="{active:route.path===item.path}" @click="router.push(item.path)"><component :is="item.icon" :size="20"/><span>{{item.label}}</span></button></nav>
</div>
</NDialogProvider></NMessageProvider></NConfigProvider>
</template>
<style scoped>
.shell{min-height:100dvh}.sidenav{position:fixed;inset:0 auto 0 0;width:224px;background:#fff;border-right:1px solid var(--border);display:flex;flex-direction:column;padding:28px 16px;z-index:30}.brand{display:flex;align-items:center;gap:11px;padding:0 8px 35px}.logo{display:grid;place-items:center;width:38px;height:38px;border-radius:9px;background:var(--accent);color:white}.title{font-size:19px;font-weight:650;letter-spacing:1px}.title small{display:block;font-size:11px;letter-spacing:0;color:var(--muted);font-weight:400;margin-top:2px}.nav-label{color:#929baa;font-size:11px;padding:0 14px 12px}.navbtn{display:flex;gap:12px;align-items:center;width:100%;border:0;background:none;padding:12px 14px;margin-bottom:5px;border-radius:6px;color:#68768a;cursor:pointer;text-align:left}.navbtn:hover{background:#f5f7f8}.navbtn.active{background:#eaf4f5;color:#116e7c;font-weight:600}.chevron{margin-left:auto}.nav-footer{margin-top:auto;border-top:1px solid var(--border);padding:20px 12px 0;font-size:12px}.nav-footer small{display:block;color:var(--muted);margin-top:8px}.status-dot,.connection i{display:inline-block;width:7px;height:7px;border-radius:50%;background:#9ca8b5;margin-right:7px}.status-dot.success,.connection.ok i{background:#299477}.status-dot.error{background:#d14a4a}.status-dot.warning{background:#c78c27}.workspace{margin-left:224px}.topbar{height:64px;border-bottom:1px solid var(--border);background:white;display:flex;align-items:center;justify-content:space-between;padding:0 32px;gap:16px}.breadcrumb{display:flex;align-items:center;gap:12px;color:var(--muted);font-size:12px}.breadcrumb strong{font-weight:500;color:var(--text)}.topbar-right{display:flex;gap:20px;align-items:center;font-size:12px}.mode-label{border:1px solid #e7dbc3;background:#fffaf0;color:#927131;padding:3px 9px;border-radius:4px}.connection{color:var(--muted)}.page-heading{max-width:1500px;margin:auto;padding:30px 32px 0;display:flex;align-items:center;justify-content:space-between}.page-heading h1{font-size:25px;line-height:1.4;margin:0;font-weight:650;letter-spacing:-.6px}.page-heading p{color:var(--muted);font-size:13px;margin:6px 0 0}.board-clock{font-size:12px;color:var(--muted)}.board-clock b{font-weight:500;color:var(--text);margin-left:8px;font-variant-numeric:tabular-nums}.banner{padding:10px 32px;background:#fff6e5;color:#916517;font-size:12px;border-bottom:1px solid #efdfbe}.banner.alarm{background:#fff0ef;color:#b53a37}.tabbar{display:none}
@media(max-width:859px){.sidenav{display:none}.workspace{margin-left:0}.topbar{height:56px;padding:0 16px}.breadcrumb{gap:6px}.topbar-right{gap:8px;font-size:11px}.page-heading{padding:22px 16px 0}.page-heading h1{font-size:23px}.board-clock{display:none}.tabbar{display:flex;position:fixed;bottom:0;left:0;right:0;background:white;border-top:1px solid var(--border);z-index:40;padding:7px 4px calc(7px + env(safe-area-inset-bottom))}.tabbar button{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;border:0;background:none;color:var(--muted);font-size:10px;padding:5px}.tabbar button.active{color:var(--accent)}.banner{padding:10px 16px}}
</style>
