import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { Quasar } from 'quasar'
import { createPinia, setActivePinia } from 'pinia'

const push = vi.fn()
vi.mock('vue-router', () => ({ useRouter: () => ({ push }) }))
vi.mock('../../services/api', () => ({
  HTTPAuth: { get: vi.fn(), post: vi.fn() },
  url: ({ url, params }) => ({ url, params })
}))
const alertSuccess = vi.fn()
vi.mock('../../boot/alerts', () => ({ Alert: vi.fn(), AlertSuccess: (...a) => alertSuccess(...a) }))

import { HTTPAuth } from '../../services/api'
import Panel from './EntityTypeMobileTabsPanel.vue'
import BtnComponent from '../../components/engine/BtnComponent.vue'
import TooltipComponent from '../../components/engine/TooltipComponent.vue'
import { useUserStore } from '../../stores/UserStore'

const rows = [
  { id: 't1', label: 'Lessons', icon: 'history_edu', route: 'list_lesson', permission: 'list_lesson', active: true },
  { id: 't2', label: 'Grades', icon: 'grade', route: 'list_grade', permission: 'list_grade', active: false }
]

const mountPanel = () => mount(Panel, {
  props: { entityTypeId: 'et1' },
  global: {
    plugins: [Quasar],
    components: { 's-btn': BtnComponent, 's-tooltip': TooltipComponent },
    stubs: { 's-card': { template: '<div><slot /></div>' } }
  }
})

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
  HTTPAuth.get.mockResolvedValue({ data: { results: rows } })
})

describe('EntityTypeMobileTabsPanel', () => {
  it("lists this entity type's tabs (?entity_type=)", async () => {
    const wrapper = mountPanel()
    await flushPromises()

    expect(HTTPAuth.get.mock.calls[0][0].params.entity_type).toBe('et1')
    expect(wrapper.findAll('[data-test="mobile-tab-row"]')).toHaveLength(2)
    expect(wrapper.text()).toContain('list_lesson')
  })

  it('without permissions shows no buttons', async () => {
    useUserStore().Permissions = new Set()
    const wrapper = mountPanel()
    await flushPromises()

    expect(wrapper.find('[data-test="mobile-tabs-seed"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="mobile-tab-edit"]').exists()).toBe(false)
  })

  it('suggests tabs and reloads; edits a tab on its own page', async () => {
    useUserStore().Permissions = new Set(['add_entitytypemobiletab', 'change_entitytypemobiletab'])
    HTTPAuth.post.mockResolvedValue({ data: { created: 2 } })
    const wrapper = mountPanel()
    await flushPromises()

    await wrapper.find('[data-test="mobile-tabs-seed"]').trigger('click')
    await flushPromises()
    expect(HTTPAuth.post).toHaveBeenCalledWith(
      expect.objectContaining({ url: 'django_resaas/entitytypemobiletabs/seed/' }), { entity_type: 'et1' }
    )
    expect(alertSuccess).toHaveBeenCalled()
    expect(HTTPAuth.get).toHaveBeenCalledTimes(2)

    await wrapper.find('[data-test="mobile-tab-edit"]').trigger('click')
    expect(push).toHaveBeenCalledWith({ name: 'change_entitytypemobiletab', params: { id: 't1' } })
  })

  it('says so when there are no tabs', async () => {
    HTTPAuth.get.mockResolvedValue({ data: { results: [] } })
    const wrapper = mountPanel()
    await flushPromises()

    expect(wrapper.find('[data-test="mobile-tabs-empty"]').exists()).toBe(true)
  })
})
