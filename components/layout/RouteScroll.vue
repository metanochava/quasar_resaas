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
  <!-- the native scrollbar of this area is hidden (it took 14px of width):
       on a large screen a thin bar is drawn OVER the content instead, shown
       while scrolling or hovering; on a phone or a small screen, none (touch
       scrolls). The element that scrolls is still the native one. -->
  <div
    class="route-scroll-wrap"
    @mouseenter="hovering = true; reveal()"
    @mouseleave="hovering = false; reveal()"
  >
    <div
      ref="area"
      class="route-scroll scroll-y"
      data-test="route-scroll"
      @scroll.passive="onScroll"
    >
      <slot />
    </div>

    <div
      v-if="overlayOn && thumb.size"
      class="route-scroll-thumb"
      :class="{ 'route-scroll-thumb--shown': shown || dragging }"
      :style="{ height: thumb.size + 'px', transform: `translateY(${thumb.offset}px)` }"
      data-test="route-scroll-thumb"
      @pointerdown.prevent="startDrag"
    />
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
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { tdc } from '../../services/translation'
import { setRouteScrollTarget } from '../../composables/useRouteScroll'

const props = defineProps({
  // show the "back to top" button once scrolled
  scrollTop: { type: Boolean, default: true },
  topOffset: { type: Array, default: () => [18, 18] },
  // a new route starts at its top
  resetOnRoute: { type: Boolean, default: true },
  // localStorage key: the position is saved on unload and restored on load
  restoreKey: { type: String, default: '' },
  // the thin bar over the content on large screens (false: no bar at all)
  overlayScrollbar: { type: Boolean, default: true }
})

const emit = defineEmits(['scroll'])

const area = ref(null)
const showTop = ref(false)
const route = useRoute()

/* -------- the overlay bar -------- */
const $q = useQuasar()
const MIN_THUMB = 32
// large screens only: a phone or a small screen keeps all its width
const overlayOn = computed(() => props.overlayScrollbar && !$q.platform?.is?.mobile && !!$q.screen?.gt?.sm)
const thumb = reactive({ size: 0, offset: 0 })
const shown = ref(false)
const hovering = ref(false)
const dragging = ref(false)
let hideTimer = null
let observer = null

function refresh () {
  const el = area.value
  if (!el) return
  const { clientHeight, scrollHeight, scrollTop } = el
  if (!clientHeight || scrollHeight <= clientHeight + 1) {
    thumb.size = 0
    thumb.offset = 0
    return
  }
  const size = Math.max(MIN_THUMB, Math.round(clientHeight * clientHeight / scrollHeight))
  const room = clientHeight - size
  thumb.size = size
  thumb.offset = Math.round(room * scrollTop / (scrollHeight - clientHeight))
}

// visible while scrolling or hovering, fades a second later
function reveal () {
  shown.value = true
  clearTimeout(hideTimer)
  hideTimer = setTimeout(() => { if (!hovering.value) shown.value = false }, 1000)
}

let drag = null
function startDrag (event) {
  const el = area.value
  if (!el) return
  dragging.value = true
  drag = { y: event.clientY, top: el.scrollTop }
  window.addEventListener('pointermove', onDrag)
  window.addEventListener('pointerup', endDrag)
}
function onDrag (event) {
  const el = area.value
  if (!el || !drag) return
  const room = el.clientHeight - thumb.size
  if (room <= 0) return
  el.scrollTop = drag.top + (event.clientY - drag.y) * (el.scrollHeight - el.clientHeight) / room
  refresh()
}
function endDrag () {
  dragging.value = false
  drag = null
  window.removeEventListener('pointermove', onDrag)
  window.removeEventListener('pointerup', endDrag)
  reveal()
}

// the content grows when a route loads its data: watch the area and its children
function observe () {
  if (!observer || !area.value) return
  observer.disconnect()
  observer.observe(area.value)
  for (const child of area.value.children) observer.observe(child)
  refresh()
}

function onScroll (event) {
  showTop.value = event.target.scrollTop > 50
  if (overlayOn.value) {
    refresh()
    reveal()
  }
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
watch(() => route?.path, () => nextTick(observe))

onMounted(() => {
  document.documentElement.classList.add('resaas-route-scroll')
  setRouteScrollTarget(area.value)
  if (typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver(refresh)
    observe()
  } else {
    refresh()
  }

  if (props.restoreKey) {
    let saved = null
    try { saved = localStorage.getItem(props.restoreKey) } catch { /* storage unavailable */ }
    if (saved) setTimeout(() => area.value?.scrollTo(0, parseInt(saved, 10) || 0), 100)
    window.addEventListener('beforeunload', savePosition)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', savePosition)
  observer?.disconnect()
  clearTimeout(hideTimer)
  endDrag()
  document.documentElement.classList.remove('resaas-route-scroll')
  setRouteScrollTarget(null)
})

defineExpose({ el: area, toTop, refresh })
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

/* holds the area and its overlay bar; takes the area's old place in the
   page container's column */
.route-scroll-wrap {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.route-scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  /* no native bar: it took 14px of width and showed as a strip beside the
     content (the overlay bar below replaces it on large screens) */
  scrollbar-width: none;
}

.route-scroll::-webkit-scrollbar {
  display: none;
}

/* the overlay bar: over the content, in the menus' accent colour */
.route-scroll-thumb {
  position: absolute;
  top: 0;
  right: 3px;
  width: 6px;
  border-radius: 6px;
  background: var(--scrollbar-accent, var(--q-primary));
  opacity: 0;
  transition: opacity .3s, width .15s;
  cursor: pointer;
  z-index: 5;
  touch-action: none;
}

.route-scroll-thumb--shown {
  opacity: .55;
}

.route-scroll-thumb:hover,
.route-scroll-thumb:active {
  opacity: .85;
  width: 8px;
}

/* q-page sets its min-height from the WINDOW (innerHeight - header - footer,
   whole pixels), which can be a pixel or two taller than this area (zoom,
   fractional sizes): an empty page scrolled. Here the page fills the area
   and only grows with its content. */
.route-scroll > .q-page {
  min-height: 0 !important;
  flex: 1 0 auto;
}
</style>
