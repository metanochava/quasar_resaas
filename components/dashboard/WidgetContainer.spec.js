import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { Quasar } from 'quasar'
import { createPinia, setActivePinia } from 'pinia'

const push = vi.fn()
vi.mock('vue-router', () => ({ useRouter: () => ({ push }) }))
const resolve = vi.fn()
vi.mock('../../services/dashboardActions', () => ({ resolveDashboardAction: (...args) => resolve(...args) }))

import WidgetContainer from './WidgetContainer.vue'

// a plain button standing in for s-btn: same click / dblclick events
const stubs = {
  's-btn': { inheritAttrs: false, template: '<button :data-test="$attrs[\'data-test\']" @click="$attrs.onClick" @dblclick="$attrs.onDblclick"><slot /></button>' },
  's-tooltip': true,
  's-card': { template: '<div><slot /></div>' },
}

const list = { name: 'patients', type: 'route', route: { name: 'list_paciente' } }
const dialog = { name: 'patients_dialog', type: 'dialog', dialog: 'saude.patient_list' }

function mountWith (action) {
  return mount(WidgetContainer, {
    props: { widget: { name: 'w', type: 'stat', label: 'Queue', actions: [action] } },
    global: { plugins: [[Quasar, {}]], stubs },
  })
}

beforeEach(() => { setActivePinia(createPinia()); resolve.mockClear(); vi.useFakeTimers() })
afterEach(() => vi.useRealTimers())

const ran = () => resolve.mock.calls.map(([action]) => action.name)

describe('WidgetContainer - header action with dblclick_action', () => {
  it('one click runs the action (after the double-click window)', async () => {
    const w = mountWith({ ...list, dblclick_action: dialog })

    await w.find('[data-test="widget-action-patients"]').trigger('click')
    expect(ran()).toEqual([])
    vi.advanceTimersByTime(300)

    expect(ran()).toEqual(['patients'])
  })

  it('a double click runs only the dblclick_action', async () => {
    const w = mountWith({ ...list, dblclick_action: dialog })
    const button = w.find('[data-test="widget-action-patients"]')

    await button.trigger('click')
    await button.trigger('click')
    await button.trigger('dblclick')
    vi.advanceTimersByTime(300)

    expect(ran()).toEqual(['patients_dialog'])
  })

  it('an action without dblclick_action runs at once, and a double click does nothing more', async () => {
    const w = mountWith(list)
    const button = w.find('[data-test="widget-action-patients"]')

    await button.trigger('click')
    expect(ran()).toEqual(['patients'])
    await button.trigger('dblclick')
    vi.advanceTimersByTime(300)

    expect(ran()).toEqual(['patients'])
  })
})
