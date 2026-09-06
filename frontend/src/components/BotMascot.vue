<script setup lang="ts">
/* 「寝室管家」吉祥物。
   造型来自这套系统本身：一个方头方脑的小管家，头顶天线代表 485 与无线链路，
   两侧的小耳朵是三个节点上的传感器，胸口那盏灯跟着连接状态走。
   纯内联 SVG，不引资源文件，颜色全部走主题变量，深浅色都能用。 */
withDefaults(defineProps<{ size?: number; awake?: boolean }>(), {
  size: 88,
  awake: true,
})
</script>

<template>
  <svg :width="size" :height="size" viewBox="0 0 96 96" fill="none"
       class="mascot" :class="{ sleeping: !awake }" aria-hidden="true">
    <defs>
      <linearGradient id="mascotBody" x1="24" y1="26" x2="72" y2="82" gradientUnits="userSpaceOnUse">
        <stop offset="0" class="g-from" />
        <stop offset="1" class="g-to" />
      </linearGradient>
    </defs>

    <!-- 天线 -->
    <path d="M48 24V15" class="stroke-accent" stroke-width="3.2" stroke-linecap="round" />
    <circle cx="48" cy="11" r="4.4" class="fill-accent antenna-dot" />

    <!-- 两侧的小耳朵 -->
    <rect x="14" y="46" width="7" height="15" rx="3.5" class="fill-accent ear" opacity=".45" />
    <rect x="75" y="46" width="7" height="15" rx="3.5" class="fill-accent ear" opacity=".45" />

    <!-- 头 -->
    <rect x="20" y="24" width="56" height="52" rx="17" fill="url(#mascotBody)" />

    <!-- 面板：留白多一点，显得干净 -->
    <rect x="27" y="33" width="42" height="27" rx="11" class="fill-face" />

    <!-- 眼睛 -->
    <circle cx="39.5" cy="45" r="3.9" class="fill-eye eye" />
    <circle cx="56.5" cy="45" r="3.9" class="fill-eye eye" />

    <!-- 嘴：一条克制的弧线 -->
    <path d="M42.5 53.5c2.2 2 8.8 2 11 0" class="stroke-eye" stroke-width="2.4"
          stroke-linecap="round" fill="none" />

    <!-- 胸口的状态灯 -->
    <circle cx="48" cy="68" r="3.4" class="fill-face" opacity=".55" />
  </svg>
</template>

<style scoped>
.mascot { display: block; }

.g-from { stop-color: color-mix(in srgb, var(--accent) 88%, white); }
.g-to   { stop-color: var(--accent); }

.fill-accent  { fill: var(--accent); }
.stroke-accent { stroke: var(--accent); }
.fill-face    { fill: #fff; }
.fill-eye     { fill: var(--accent); }
.stroke-eye   { stroke: var(--accent); }

/* 天线呼吸：暗示它在联网、在听 */
.antenna-dot { animation: blip 2.6s ease-in-out infinite; transform-origin: 48px 11px; }
@keyframes blip {
  0%, 70%, 100% { opacity: 1; transform: scale(1); }
  85%           { opacity: .5; transform: scale(.82); }
}

/* 偶尔眨一下眼 */
.eye { animation: blink 6.5s infinite; transform-origin: center; }
@keyframes blink {
  0%, 92%, 100% { transform: scaleY(1); }
  95%           { transform: scaleY(.12); }
}

/* 链路断开时让它睡着，界面上就有了一个不用读文字的状态提示 */
.sleeping .antenna-dot,
.sleeping .eye { animation: none; }
.sleeping { filter: saturate(.35); opacity: .75; }

@media (prefers-reduced-motion: reduce) {
  .antenna-dot, .eye { animation: none; }
}
</style>
