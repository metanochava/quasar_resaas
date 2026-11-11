<template>
  <!-- the area where a layout renders its routes: it scrolls INSIDE, between
       the header, the footer and the drawers (like a card), instead of the
       page running the device's full height. Put it as the only child of the
       layout's <q-page-container class="resaas-page-container">:

         <q-page-container class="resaas-page-container">
           <s-route-scroll restore-key="scroll_position">
             <router-view />
           </s-route-scroll>
         </q-page-container>

       html/body do not scroll while it is mounted (html.resaas-route-scroll);
       code that used window.scrollY / window.scrollTo / window 'scroll' uses
       composables/useRouteScroll.js. -->
  <div
    ref="area"
    class="route-scroll scroll-y"
    data-test="route-scroll"
    @scroll.passive="onScroll"
  >
    <slot />
  </div>

  <!-- back to the top of this area (q-page-scroller only follows the page's
       scroll, which no longer moves) -->
  <q-page-sticky v-if="scrollTop && showTop" position="bottom-right" :offset="topOffset">
    <s-btn icon="keyboard_arrow_up" color="primary" round data-test="route-scroll-top" @click="toTop">
      <s-tooltip>{{ tdc('Back to top') }}</s-tooltip>
    </s-btn>
  </q-page-sticky>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { tdc } from '../../services/translation'
import { setRouteScrollTarget } from '../../composables/useRouteScroll'

const props = defineProps({
  // show the "back to top" button once scrolled
  scrollTop: { type: Boolean, default: true },
  topOffset: { type: Array, default: () => [18, 18] },
  // a new route starts at its top
  resetOnRoute: { type: Boolean, default: true },
  // localStorage key: the position is saved on unload and restored on load
  restoreKey: { type: String, default: '' }
})

const emit = defineEmits(['scroll'])

const area = ref(null)
const showTop = ref(false)
const route = useRoute()

function onScroll (event) {
  showTop.value = event.target.scrollTop > 50
  emit('scroll', event)
}

function toTop () {
  area.value?.scrollTo({ top: 0, behavior: 'smooth' })
}

function savePosition () {
  if (!props.restoreKey) return
  try { localStorage.setItem(props.restoreKey, String(area.value?.scrollTop || 0)) } catch { /* storage unavailable */ }
}

if (props.resetOnRoute) {
  watch(() => route?.path, () => area.value?.scrollTo(0, 0))
}

onMounted(() => {
  document.documentElement.classList.add('resaas-route-scroll')
  setRouteScrollTarget(area.value)

  if (props.restoreKey) {
    let saved = null
    try { saved = localStorage.getItem(props.restoreKey) } catch { /* storage unavailable */ }
    if (saved) setTimeout(() => area.value?.scrollTo(0, parseInt(saved, 10) || 0), 100)
    window.addEventListener('beforeunload', savePosition)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', savePosition)
  document.documentElement.classList.remove('resaas-route-scroll')
  setRouteScrollTarget(null)
})

defineExpose({ el: area, toTop })
</script>

<style>
/* the routes' own scroll area: html/body do not scroll, the page container
   takes the viewport (its padding is the header / footer room Quasar gives
   it) and the inner area scrolls */
html.resaas-route-scroll,
html.resaas-route-scroll body {
  height: 100%;
  overflow: hidden;
}

.resaas-page-container {
  height: 100vh;
  height: 100dvh;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.route-scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
}
</style>
