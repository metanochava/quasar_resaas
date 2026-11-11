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
        ? { apps: [{ name: 'billing', models: 2 }, { name: 'django_resaas.saas', models: 40 }, { name: 'shop.core', models: 1 }, { name: 'django_resaas', models: 3 }] }
        : { results: [{ id: 'a1', name: 'billing', state: 'Active', description: 'Invoices and payments' }] }
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

describe('AppCreatePage - what each module is for (App.description)', () => {
  it('has a button beside the state that opens the module\'s description', async () => {
    const wrapper = await mountPage(['list_app'])

    const button = wrapper.find('[data-test="app-description-billing"]')
    expect(button.exists()).toBe(true)

    await button.trigger('click')
    await flushPromises()

    expect(document.body.textContent).toContain('Invoices and payments')
  })

  it('every button on the page has a tooltip', async () => {
    const wrapper = await mountPage(['list_app', 'view_app', 'add_app', 'change_app', 'delete_app'])

    for (const button of wrapper.findAll('.q-btn')) {
      expect(button.findComponent(TooltipComponent).exists()).toBe(true)
    }
  })
})

describe('AppCreatePage - order', () => {
  it('lists the modules starting with django_resaas or with a dot first', async () => {
    const wrapper = await mountPage(['list_app'])

    const names = wrapper.findAll('.app-card .text-subtitle1').map(n => n.text())
    expect(names).toEqual(['django_resaas.saas', 'shop.core', 'django_resaas', 'billing'])
  })
})
