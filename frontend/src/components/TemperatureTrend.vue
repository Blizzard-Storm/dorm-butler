<script setup lang="ts">
import {computed,onMounted,onUnmounted,ref} from 'vue'
import VChart from 'vue-echarts'
import {use} from 'echarts/core'
import {LineChart} from 'echarts/charts'
import {GridComponent,TooltipComponent,MarkLineComponent} from 'echarts/components'
import {CanvasRenderer} from 'echarts/renderers'
import {api} from '../api'
import type {HistoryPoint} from '../types'
use([LineChart,GridComponent,TooltipComponent,MarkLineComponent,CanvasRenderer])

/* 采样是 1Hz，间隔超过这个秒数就算一次断连 */
const GAP_S=5

const points=ref<HistoryPoint[]>([]),error=ref(''),loading=ref(true)
const compact=ref(false)          // false=真实时间轴  true=跳过断连时段
let timer:number|undefined

async function load(){try{points.value=(await api.history(10,['temp_c'])).points;error.value=''}catch{error.value='历史数据暂时不可用'}finally{loading.value=false}}

const AXIS='#8490a0',LINE='#167d8d'
const hhmmss=(t:string)=>new Date(t).toLocaleTimeString('zh-CN',{hour12:false})

/* 紧凑模式：只保留有读数的点顺序排开，断连处记一条竖虚线标出断了多久。
   横轴因此【不是等间隔时间】，界面上必须写明，不能让人误读成连续采样。 */
const packed=computed(()=>{
  const kept=points.value.filter(p=>p.temp_c!=null)
  const gaps:{idx:number,mins:number}[]=[]
  kept.forEach((p,i)=>{
    if(i===0)return
    const dt=(new Date(p.ts).getTime()-new Date(kept[i-1].ts).getTime())/1000
    if(dt>GAP_S)gaps.push({idx:i,mins:Math.max(1,Math.round(dt/60))})
  })
  return {kept,gaps}
})

const option=computed(()=>{
  const base={animation:false,grid:{left:42,right:20,top:20,bottom:30},
    yAxis:{type:'value',scale:true,name:'℃',nameTextStyle:{color:AXIS},
      axisLabel:{color:AXIS,fontSize:11},splitLine:{lineStyle:{color:'#edf0f3',type:'dashed'}}}}
  const series={type:'line',showSymbol:false,smooth:false,
    lineStyle:{color:LINE,width:2},itemStyle:{color:LINE},
    areaStyle:{color:LINE,opacity:.055}}

  if(!compact.value){
    /* 真实时间轴：connectNulls 关闭，缺口如实断开，绝不插值连成假直线 */
    return {...base,tooltip:{trigger:'axis'},
      xAxis:{type:'time',axisLine:{show:false},axisTick:{show:false},
        axisLabel:{color:AXIS,fontSize:11}},
      series:[{...series,connectNulls:false,
        data:points.value.map(p=>[new Date(p.ts).getTime(),p.temp_c])}]}
  }

  const {kept,gaps}=packed.value
  return {...base,
    tooltip:{trigger:'axis',formatter:(ps:any[])=>{
      const i=ps[0].dataIndex
      return `${hhmmss(kept[i].ts)}<br/>${ps[0].marker} ${ps[0].value} ℃`}},
    xAxis:{type:'category',boundaryGap:false,data:kept.map(p=>hhmmss(p.ts)),
      axisLine:{show:false},axisTick:{show:false},
      axisLabel:{color:AXIS,fontSize:11,
        interval:Math.max(0,Math.floor(kept.length/5))}},
    series:[{...series,data:kept.map(p=>p.temp_c),
      markLine:{silent:true,symbol:'none',
        label:{formatter:(p:any)=>`断连 ${gaps[p.dataIndex]?.mins??0} 分钟`,
          color:'#c05621',fontSize:10,position:'insideEndTop'},
        lineStyle:{color:'#e6a15c',type:'dashed',width:1},
        data:gaps.map(g=>({xAxis:g.idx}))}}]}
})

const hasData=computed(()=>points.value.some(p=>p.temp_c!=null))
const gapCount=computed(()=>packed.value.gaps.length)

onMounted(()=>{void load();timer=window.setInterval(load,10000)})
onUnmounted(()=>window.clearInterval(timer))
</script>

<template>
  <div class="trend">
    <p v-if="loading||error||!hasData" class="placeholder">
      {{loading?'正在读取采样记录…':error||'暂无有效温度采样'}}
    </p>
    <template v-else>
      <div class="bar">
        <span class="hint">
          {{compact
            ? '横轴已跳过断连时段，不是等间隔时间'
            : (gapCount ? `区间内有 ${gapCount} 段断连` : '采样连续')}}
        </span>
        <button class="toggle" @click="compact=!compact">
          {{compact?'紧凑':'真实时间'}}
        </button>
      </div>
      <VChart :option="option" autoresize class="plot"/>
    </template>
  </div>
</template>

<style scoped>
.trend{height:238px;width:100%;display:flex;flex-direction:column}
.plot{flex:1;min-height:0;width:100%}
.placeholder{height:100%;display:grid;place-items:center;color:var(--muted);font-size:13px;margin:0}
.bar{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:0 2px 4px}
.hint{font-size:11px;color:var(--muted)}
.toggle{font:inherit;font-size:11px;padding:2px 9px;border-radius:999px;cursor:pointer;
  border:1px solid var(--border,#dfe3e8);background:transparent;color:var(--muted)}
.toggle:hover{border-color:#167d8d;color:#167d8d}
</style>
