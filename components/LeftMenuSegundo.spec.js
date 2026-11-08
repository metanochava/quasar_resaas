import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { Quasar } from 'quasar'
import { createRouter, createMemoryHistory } from 'vue-router'

// a top-level menu entry that is a direct link (sidebar ROUTE + ROLE,
// UserAPIView.menus) opens its route; a group keeps its submenu
const User = {
  search: '',
  Menus: [
    { menu: 'Saude', icon: 'local_hospital', submenu: [{ menu: 'Patient', route: 'list_paciente' }] },
    { menu: 'Patients', icon: 'groups', route: 'list_paciente', submenu: [] },
  ],
  LayoutSettings: {},
}

vi.mock('../stores/UserStore', () => ({ useUserStore: () => User }))
vi.mock('../stores/EntityTypeStore', () => ({ useEntityTypeStore: () => ({}) }))
vi.mock('../services/translation', () => ({ tdc: s => s, toPlural: s => s }))
vi.mock('./SubMenu.vue', () => ({ default: { props: ['Dados'], template: '<div class="submenu" />' } }))
vi.mock('./engine/HighlightText.vue', () => ({ default: { props: ['text'], template: '<span>{{ text }}</span>' } }))

import LeftMenuSegundo from './LeftMenuSegundo.vue'
import { isMenuLink } from '../services/routing'

function router() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: { template: '<div />' } },
      { path: '/list_paciente', name: 'list_paciente', component: { template: '<div />' } },
    ],
  })
}

describe('isMenuLink', () => {
  it('a route without a submenu is a link; a group is not', () => {
    expect(isMenuLink({ route: 'list_paciente', submenu: [] })).toBe(true)
    expect(isMenuLink({ route: 'x', submenu: [{ menu: 'a' }] })).toBe(false)
    expect(isMenuLink({ submenu: [] })).toBe(false)
  })
})

describe('LeftMenuSegundo direct link', () => {
  it('the top-level link opens list_paciente in one click', async () => {
    const r = router()
    r.push('/')
    await r.isReady()
    const wrapper = mount(LeftMenuSegundo, {
      global: { plugins: [Quasar, r], stubs: { 's-tooltip': true, 'q-scroll-area': { template: '<div><slot /></div>' } } },
    })

    const link = wrapper.find('[data-test="menu-link-list_paciente"]')
    expect(link.exists()).toBe(true)
    expect(link.text()).toContain('Patients')

    await link.trigger('click')
    await flushPromises()
    expect(r.currentRoute.value.name).toBe('list_paciente')

    // the Saude group is still there (with its own Patient entry)
    expect(wrapper.text()).toContain('Saude')
  })
})
