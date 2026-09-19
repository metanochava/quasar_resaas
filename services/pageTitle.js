import { reactive, computed, watchEffect, onBeforeUnmount, unref } from 'vue'
import { tdc } from './translation'

// Browser tab title: follows the route (meta.title) and can be overridden by
// any page, component or modal while it is on screen. The most recently
// activated override wins (a modal opened over a page shows the modal's
// title); when it closes/unmounts the previous one - ultimately the route's
// - comes back.
//
//   route      meta: { title: 'Edit patient' }        (string, or (route) => string)
//   page       usePageTitle(() => `${patient.name} - ${tdc('Patient')}`)
//   modal      <s-page-title :title="tdc('We found possible matches')" :active="open" />
//              usePageTitle(() => tdc('We found possible matches'), { active: () => open.value })
//
// Route titles are static keys/phrases and get translated when applied (and
// again on a language switch). Titles passed to an override are used AS IS:
// they usually contain data (a patient's name) that must never be looked up
// as a translation key - translate the fixed parts yourself with tdc().

// ---------------- pure pieces (unit-tested) ----------------

// Route titles are often built as tdc('View of') + ' ' + tdc('employee') at
// module load - i.e. BEFORE the dictionary is loaded, so they arrive in
// English. Re-translate at display time: the whole phrase when it is a
// known key, otherwise the longest known word-sequences from the left.
export function translateTitle(text, translate = tdc) {
  const phrase = String(text ?? '').trim()

  if (!phrase) return ''

  const whole = translate(phrase)

  if (whole !== phrase) return whole

  const words = phrase.split(/\s+/)
  const parts = []
  let i = 0

  while (i < words.length) {
    let end = words.length

    while (end > i + 1 && translate(words.slice(i, end).join(' ')) === words.slice(i, end).join(' ')) {
      end--
    }

    parts.push(translate(words.slice(i, end).join(' ')))
    i = end
  }

  return parts.join(' ')
}

export function composeTitle(title, appName, separator = ' | ') {
  const t = String(title ?? '').trim()

  if (!t) return appName || ''

  return appName && t !== appName ? `${t}${separator}${appName}` : t
}

export function createPageTitleState() {
  const state = reactive({ routeTitle: '', entries: [] })
  let seq = 0

  return {
    state,
    setRouteTitle(title) { state.routeTitle = title || '' },

    // set or update an override in place (keeps its position in the stack,
    // so a title that just finished loading does not jump above a modal
    // that was opened later)
    setEntry(id, title) {
      const existing = state.entries.find(entry => entry.id === id)

      if (existing) existing.title = title
      else state.entries.push({ id, order: ++seq, title })
    },

    removeEntry(id) {
      const index = state.entries.findIndex(entry => entry.id === id)

      if (index !== -1) state.entries.splice(index, 1)
    },

    // override title when there is one, otherwise null (use the route's)
    overrideTitle() {
      const top = state.entries[state.entries.length - 1]

      return top ? top.title : null
    }
  }
}

// ---------------- singleton wired to the router ----------------

export const pageTitle = createPageTitleState()

let entrySeq = 0

// Registers an override for as long as the calling component is mounted (and
// `active` is true). `source` may be a string, a ref or a getter.
export function usePageTitle(source, { active = true } = {}) {
  const id = ++entrySeq
  const read = () => (typeof source === 'function' ? source() : unref(source))
  const on = () => (typeof active === 'function' ? active() : unref(active))

  const stop = watchEffect(() => {
    const title = read()

    if (on() && title) pageTitle.setEntry(id, String(title))
    else pageTitle.removeEntry(id)
  })

  onBeforeUnmount(() => {
    stop()
    pageTitle.removeEntry(id)
  })
}

export function resolveRouteTitle(route) {
  const title = route?.meta?.title

  return typeof title === 'function' ? title(route) : title
}

export function installPageTitle(router, { appName, separator = ' | ', translate = tdc } = {}) {
  if (typeof document === 'undefined') return

  const baseName = appName || document.title || ''

  router.afterEach(to => {
    pageTitle.setRouteTitle(resolveRouteTitle(to) || '')
  })

  // watchEffect tracks the translated route title too (tdc reads the
  // reactive dictionary), so the tab re-translates on a language switch.
  const shown = computed(() => {
    const override = pageTitle.overrideTitle()
    const title = override ?? translateTitle(pageTitle.state.routeTitle, translate)

    return composeTitle(title, baseName, separator)
  })

  watchEffect(() => {
    document.title = shown.value
  })
}
