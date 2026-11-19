import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { Quasar, QLayout } from 'quasar'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import { h } from 'vue'

import MobileTabBar from './MobileTabBar.vue'
import { useUserStore } from '../../stores/UserStore'

const tabs = Array.from({ length: 6 }, (_, i) => ({ route: `r${i}`, label: `Tab ${i}`, icon: 'star' }))

function mountBar() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: tabs.map(t => ({ path: `/${t.route}`, name: t.route, component: { render: () => h('div') } }))
  })
  // q-footer needs a layout: render it inside one
  return mount({ render: () => h(QLayout, { view: 'hHh lpr fFf' }, () => h(MobileTabBar)) }, {
    global: { plugins: [Quasar, router] },
    attachTo: document.body
  })
}

beforeEach(() => {
  document.body.innerHTML = ''
  setActivePinia(createPinia())
})

describe('MobileTabBar', () => {
  it('shows at most 5 tabs and no "More" tab (the header ☰ opens the menu)', () => {
    useUserStore().MobileTabs = tabs

    const html = document.body.innerHTML + mountBar().html()

    expect(html.match(/data-test="mobile-tab-r\d"/g)?.length).toBe(5)
    expect(html).not.toContain('mobile-tab-more')
  })
})
