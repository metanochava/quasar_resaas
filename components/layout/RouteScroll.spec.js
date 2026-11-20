import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

const q = { screen: { gt: { sm: true } }, platform: { is: { mobile: false } } }
vi.mock('quasar', async (original) => ({ ...(await original()), useQuasar: () => q }))
vi.mock('vue-router', () => ({ useRoute: () => ({ path: '/x' }) }))
vi.mock('../../services/translation', () => ({ tdc: t => t }))
vi.mock('../../composables/useRouteScroll', () => ({ setRouteScrollTarget: () => {} }))

import RouteScroll from './RouteScroll.vue'

function mountArea ({ client = 500, content = 2000 } = {}) {
  const w = mount(RouteScroll, { props: { scrollTop: false }, global: { stubs: { 's-btn': true, 's-tooltip': true, 'q-page-sticky': true } } })
  const el = w.find('[data-test="route-scroll"]').element
  Object.defineProperty(el, 'clientHeight', { configurable: true, get: () => client })
  Object.defineProperty(el, 'scrollHeight', { configurable: true, get: () => content })
  return { w, el }
}

beforeEach(() => {
  q.screen.gt.sm = true
  q.platform.is.mobile = false
})

describe('s-route-scroll: the bar over the content', () => {
  it('large screen, content taller than the area: a proportional bar that follows the scroll', async () => {
    const { w, el } = mountArea()
    w.vm.refresh(); await nextTick()

    const thumb = w.find('[data-test="route-scroll-thumb"]')
    expect(thumb.exists()).toBe(true)
    expect(thumb.attributes('style')).toContain('height: 125px') // 500 * 500 / 2000

    el.scrollTop = 1500 // the end
    await w.find('[data-test="route-scroll"]').trigger('scroll'); await nextTick()
    expect(w.find('[data-test="route-scroll-thumb"]').attributes('style')).toContain('translateY(375px)')
  })

  it('content that fits: no bar', async () => {
    const { w } = mountArea({ content: 500 })
    w.vm.refresh(); await nextTick()
    expect(w.find('[data-test="route-scroll-thumb"]').exists()).toBe(false)
  })

  it('a phone or a small screen: no bar at all', async () => {
    q.screen.gt.sm = false
    const small = mountArea()
    small.w.vm.refresh(); await nextTick()
    expect(small.w.find('[data-test="route-scroll-thumb"]').exists()).toBe(false)

    q.screen.gt.sm = true
    q.platform.is.mobile = true
    const phone = mountArea()
    phone.w.vm.refresh(); await nextTick()
    expect(phone.w.find('[data-test="route-scroll-thumb"]').exists()).toBe(false)
  })

  it('dragging the bar scrolls the area', async () => {
    const { w, el } = mountArea()
    w.vm.refresh(); await nextTick()

    await w.find('[data-test="route-scroll-thumb"]').trigger('pointerdown', { clientY: 100 })
    window.dispatchEvent(new MouseEvent('pointermove', { clientY: 225 })) // 125px of 375px room
    window.dispatchEvent(new MouseEvent('pointerup'))

    expect(el.scrollTop).toBe(500) // a third of 1500
  })
})
