import { computed, onBeforeUnmount } from 'vue'
import { useUserStore } from '../stores/UserStore'

// The current Entity's own website (Entity.site), shared by the header brand
// (HeaderBrand.vue) and the site button (HeaderSite.vue):
//   one click     -> the site in this tab
//   double click  -> the site in a new tab (only - the single click is dropped)
// A click waits DOUBLE_CLICK_MS for a possible second one. Only an absolute
// http(s) URL is followed (never javascript:, data:, a relative path...).

export const DOUBLE_CLICK_MS = 250

export function safeSiteUrl (value) {
  const text = String(value || '').trim()
  if (!text) return null
  try {
    const parsed = new URL(text)
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : null
  } catch {
    return null
  }
}

export function useEntitySite () {
  const User = useUserStore()
  let timer = null

  const site = computed(() => safeSiteUrl(User?.Entity?.site))

  function openHere () {
    if (site.value) window.open(site.value, '_self')
  }

  function openNewTab () {
    if (site.value) window.open(site.value, '_blank', 'noopener')
  }

  function onClick () {
    clearTimeout(timer)
    timer = setTimeout(openHere, DOUBLE_CLICK_MS)
  }

  function onDoubleClick () {
    clearTimeout(timer)
    openNewTab()
  }

  onBeforeUnmount(() => clearTimeout(timer))

  return { site, openHere, openNewTab, onClick, onDoubleClick }
}
