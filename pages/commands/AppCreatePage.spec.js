import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { Quasar } from 'quasar'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }) }))

vi.mock('../../services/api', () => ({
  url: ({ url }) => url,
  HTTPAuth: {
    get: vi.fn((path) => Promise.resolve({
      data: path.includes('resaasapps')
        ? { apps: [{ name: 'billing', models: 2 }] }
        : { results: [{ id: 'a1', name: 'billing', state: 'Active' }] }
    })),
    patch: vi.fn(),
    post: vi.fn(),
    delete: vi.fn()
  }
}))

import AppCreatePage from './AppCreatePage.vue'
import BtnComponent from '../../components/engine/BtnComponent.vue'
import CardComponent from '../../components/engine/CardComponent.vue'
import TooltipComponent from '../../components/engine/TooltipComponent.vue'
import { useUserStore } from '../../stores/UserStore'

let pinia

async function mountPage (permissions) {
  useUserStore().Permissions = new Set(permissions)
  const wrapper = mount(AppCreatePage, {
    global: {
      plugins: [Quasar, pinia],
      components: { 's-btn': BtnComponent, 's-card': CardComponent, 's-tooltip': TooltipComponent },
      stubs: { QPage: { template: '<div><slot /></div>' }, FormSection: { template: '<div><slot /></div>' }, 's-input': true, AppModelsDialog: true, AppEntityTypesDialog: true }
    }
  })
  await flushPromises()
  return wrapper
}

const icons = (wrapper) => wrapper.findAll('.q-icon').map(icon => icon.text())

beforeEach(() => {
  pinia = createPinia()
  setActivePinia(pinia)
})

describe('AppCreatePage (the App catalogue is Root-only)', () => {
  it('shows every action to a profile that holds the app permissions', async () => {
    const wrapper = await mountPage(['list_app', 'view_app', 'add_app', 'change_app', 'delete_app'])

    expect(wrapper.find('.create-card').exists()).toBe(true)
    expect(icons(wrapper)).toEqual(expect.arrayContaining(['table_chart', 'category', 'delete']))
    expect(icons(wrapper).some(icon => icon.startsWith('toggle_'))).toBe(true)
  })

  it('only lists the modules for list_app alone - no create, toggle, delete or details', async () => {
    const wrapper = await mountPage(['list_app'])

    expect(wrapper.text()).toContain('billing')
    expect(wrapper.find('.create-card').exists()).toBe(false)
    for (const icon of ['table_chart', 'category', 'toggle_on', 'toggle_off', 'delete']) {
      expect(icons(wrapper)).not.toContain(icon)
    }
  })
})
