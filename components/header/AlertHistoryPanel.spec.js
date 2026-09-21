import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

import AlertHistoryPanel from './AlertHistoryPanel.vue'
import { useAlertStore } from '../../stores/AlertStore'
import { mountWith, unmountAll } from '../user/account/_helpers'

let pinia
let Alerts

const mountPanel = () => mountWith(AlertHistoryPanel, pinia)

beforeEach(() => {
  pinia = createPinia()
  setActivePinia(pinia)
  Alerts = useAlertStore()
})

afterEach(() => unmountAll())

const seed = () => {
  Alerts.add({ level: 'error', message: 'Permission denied.', code: 'permission_denied', request: { method: 'POST', path: '/api/hr/employees/' } })
  Alerts.add({ level: 'warning', message: 'No profile yet.' })
  Alerts.add({ level: 'success', message: 'Employee created.' })
}

describe('AlertHistoryPanel', () => {
  it('shows an empty state', () => {
    const wrapper = mountPanel()

    expect(wrapper.find('[data-test="alert-empty"]').exists()).toBe(true)
    expect(wrapper.findAll('[data-test="alert-item"]')).toHaveLength(0)
  })

  it('lists the history newest first, with code and request', async () => {
    seed()
    const wrapper = mountPanel()
    await flushPromises()

    const messages = wrapper.findAll('[data-test="alert-message"]').map(node => node.text())
    expect(messages).toEqual(['Employee created.', 'No profile yet.', 'Permission denied.'])
    expect(wrapper.find('[data-test="alert-code"]').text()).toBe('permission_denied')
    expect(wrapper.find('[data-test="alert-request"]').text()).toBe('POST /api/hr/employees/')
  })

  it('shows a message as plain text - tags in it are not rendered', async () => {
    Alerts.add({ level: 'error', message: "Module <b>'hr'</b> is not active.<img src=x onerror=alert(1)>" })
    const wrapper = mountPanel()
    await flushPromises()

    expect(wrapper.find('[data-test="alert-message"]').text()).toBe("Module 'hr' is not active.")
    expect(wrapper.html()).not.toContain('<img')
  })

  it('filters: unread, errors, warnings, success', async () => {
    seed()
    Alerts.markAsRead(Alerts.data[0])
    const wrapper = mountPanel()
    await flushPromises()

    const shown = async (filter) => {
      await wrapper.find(`[data-test="alert-filter-${filter}"]`).trigger('click')
      return wrapper.findAll('[data-test="alert-message"]').map(node => node.text())
    }

    expect(await shown('unread')).toEqual(['Employee created.', 'No profile yet.'])
    expect(await shown('error')).toEqual(['Permission denied.'])
    expect(await shown('warning')).toEqual(['No profile yet.'])
    expect(await shown('success')).toEqual(['Employee created.'])
    expect(await shown('all')).toHaveLength(3)
  })

  it('the filter chips show their counts', async () => {
    seed()
    const wrapper = mountPanel()
    await flushPromises()

    expect(wrapper.find('[data-test="alert-filter-all"]').text()).toContain('(3)')
    expect(wrapper.find('[data-test="alert-filter-unread"]').text()).toContain('(3)')
    expect(wrapper.find('[data-test="alert-filter-error"]').text()).toContain('(1)')
  })

  it('clicking an item, or its check, marks it as read', async () => {
    seed()
    const wrapper = mountPanel()
    await flushPromises()

    await wrapper.findAll('[data-test="alert-item"]')[0].trigger('click')
    expect(Alerts.unreadCount).toBe(2)

    await wrapper.findAll('[data-test="alert-read"]')[0].trigger('click')
    expect(Alerts.unreadCount).toBe(1)
  })

  it('mark all as read', async () => {
    seed()
    const wrapper = mountPanel()
    await flushPromises()

    await wrapper.find('[data-test="alert-mark-all"]').trigger('click')

    expect(Alerts.unreadCount).toBe(0)
    expect(Alerts.data).toHaveLength(3)
  })

  it('remove one, and clear all', async () => {
    seed()
    const wrapper = mountPanel()
    await flushPromises()

    await wrapper.findAll('[data-test="alert-remove"]')[0].trigger('click')
    expect(Alerts.data).toHaveLength(2)

    await wrapper.find('[data-test="alert-clear"]').trigger('click')
    expect(Alerts.data).toEqual([])
    expect(wrapper.find('[data-test="alert-empty"]').exists()).toBe(true)
  })
})
