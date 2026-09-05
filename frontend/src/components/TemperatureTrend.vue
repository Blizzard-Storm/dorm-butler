<script setup lang="ts">
import {computed,onMounted,onUnmounted,ref} from 'vue'
import VChart from 'vue-echarts'
import {use} from 'echarts/core'
import {LineChart} from 'echarts/charts'
import {GridComponent,TooltipComponent} from 'echarts/components'
import {CanvasRenderer} from 'echarts/renderers'
import {api} from '../api'
import type {HistoryPoint} from '../types'
use([LineChart,GridComponent,TooltipComponent,CanvasRenderer])
const points=ref<HistoryPoint[]>([]),error=ref(''),loading=ref(true)
let timer:number|undefined
async function load(){try{points.value=(await api.history(10,['temp_c'])).points;error.value=''}catch{error.value='历史数据暂时不可用'}finally{loading.value=false}}
const option=computed(()=>({animation:false,grid:{left:42,right:20,top:20,bottom:30},tooltip:{trigger:'axis'},xAxis:{type:'time',axisLine:{show:false},axisTick:{show:false},axisLabel:{color:'#8490a0',fontSize:11}},yAxis:{type:'value',scale:true,name:'℃',nameTextStyle:{color:'#8490a0'},axisLabel:{color:'#8490a0',fontSize:11},splitLine:{lineStyle:{color:'#edf0f3',type:'dashed'}}},series:[{type:'line',showSymbol:false,connectNulls:false,smooth:false,lineStyle:{color:'#167d8d',width:2},itemStyle:{color:'#167d8d'},areaStyle:{color:'#167d8d',opacity:.055},data:points.value.map(p=>[new Date(p.ts).getTime(),p.temp_c])}]}))
const hasData=computed(()=>points.value.some(p=>p.temp_c!=null))
onMounted(()=>{void load();timer=window.setInterval(load,10000)})
onUnmounted(()=>window.clearInterval(timer))
</script>
<template><div class="trend"><p v-if="loading||error||!hasData" class="placeholder">{{loading?'正在读取采样记录…':error||'暂无有效温度采样'}}</p><VChart v-else :option="option" autoresize class="plot"/></div></template>
<style scoped>.trend,.plot{height:238px;width:100%}.placeholder{height:100%;display:grid;place-items:center;color:var(--muted);font-size:13px;margin:0}</style>
