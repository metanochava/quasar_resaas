import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { Quasar } from 'quasar'
import { createPinia, setActivePinia } from 'pinia'

// the real children pull app-level deps (vue-router) this package doesn't install
vi.mock('./DashboardRenderer.vue', () => ({
  default: { name: 'DashboardRenderer', props: ['name'], template: '<div data-test="renderer">{{ name }}</div>' }
}))
vi.mock('../DashboardComponent.vue', () => ({ default: { name: 'DashboardComponent', template: '<div />' } }))

import HomeDashboards from './HomeDashboards.vue'
import { useUserStore } from '../../stores/UserStore'
import { useDashboardStore } from '../../stores/DashboardStore'

function setup(dashboards) {
  const User = useUserStore()
  User.Entity = { entity_type: { label: 'saude' }, dashboard: { value: 'Auto' } }
  User.refreshResaasContext = vi.fn().mockResolvedValue()

  const Dashboard = useDashboardStore()
  Dashboard.loadDashboardList = vi.fn().mockResolvedValue()
  Dashboard.dashboards = dashboards

  return mount(HomeDashboards, {
    global: {
      plugins: [[Quasar, {}]]
    }
  })
}

beforeEach(() => {
  setActivePinia(createPinia())
  try { localStorage.clear() } catch { /* storage unavailable */ }
})

describe('HomeDashboards - dashboards of the EntityType module', () => {
  it('renders the single module dashboard without tabs (previous behaviour)', async () => {
    const w = setup([{ name: 'saude', module: 'saude', label: 'Clinic', order: 10 }])
    await flushPromises()

    expect(w.find('[data-test="home-dashboard-tabs"]').exists()).toBe(false)
    expect(w.find('[data-test="renderer"]').text()).toBe('saude')
  })

  it('shows every authorized dashboard of the module as tabs, the first by order selected', async () => {
    const w = setup([
      { name: 'saude', module: 'saude', label: 'Clinic', order: 10 },
      { name: 'saude_reception', module: 'saude', label: 'Reception', order: 1 },
      { name: 'hr', module: 'hr', label: 'HR', order: 5 }
    ])
    await flushPromises()

    const tabs = w.findAll('[data-test="home-dashboard-tabs"] .q-tab')
    expect(tabs.map((t) => t.text())).toEqual(['Reception', 'Clinic'])
    expect(w.find('[data-test="renderer"]').text()).toBe('saude_reception')
  })

  it('never offers a dashboard of another module', async () => {
    const w = setup([{ name: 'hr', module: 'hr', label: 'HR', order: 1 }])
    await flushPromises()

    expect(w.find('[data-test="renderer"]').text()).toBe('')
  })
})
