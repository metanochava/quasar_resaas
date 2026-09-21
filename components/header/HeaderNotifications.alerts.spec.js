import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

// no Firebase in a unit test: the support side sees an empty database
vi.mock('quasar_resaas', () => ({ getFirebase: () => ({ fireDataBase: null }) }))

import HeaderNotifications from './HeaderNotifications.vue'
import { useAlertStore } from '../../stores/AlertStore'
import { mountWith, unmountAll, inBody } from '../user/account/_helpers'

let pinia
let Alerts

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  pinia = createPinia()
  setActivePinia(pinia)
  Alerts = useAlertStore()
})

afterEach(() => {
  vi.restoreAllMocks()
  unmountAll()
})

const mountHeader = () => mountWith(HeaderNotifications, pinia)

describe('the header Notification shows the request alerts', () => {
  it('there is ONE notification button, and it has no badge while nothing is unread', () => {
    const wrapper = mountHeader()

    expect(wrapper.findAll('.q-btn')).toHaveLength(1)
    expect(wrapper.find('.q-badge').exists()).toBe(false)
  })

  it('the badge counts the unread alerts', async () => {
    Alerts.add({ level: 'error', message: 'One.' })
    Alerts.add({ level: 'warning', message: 'Two.' })
    const wrapper = mountHeader()
    await flushPromises()

    expect(wrapper.find('.q-badge').text()).toBe('2')
  })

  it('reading an alert lowers the badge', async () => {
    const item = Alerts.add({ level: 'error', message: 'One.' })
    Alerts.add({ level: 'warning', message: 'Two.' })
    const wrapper = mountHeader()
    await flushPromises()

    Alerts.markAsRead(item)
    await flushPromises()

    expect(wrapper.find('.q-badge').text()).toBe('1')
  })

  it('a message that appears after the toast is gone is still there in the history', async () => {
    const wrapper = mountHeader()

    Alerts.add({ level: 'warning', message: 'The employee has no profile yet.' })
    await flushPromises()

    await wrapper.find('.q-btn').trigger('click')
    await flushPromises()

    expect(inBody('[data-test="alert-history"]')).not.toBeNull()
    expect(inBody('[data-test="alert-message"]').textContent).toContain('The employee has no profile yet.')
  })

  it('opens on the Alerts tab and can switch to Support & Feedback', async () => {
    const wrapper = mountHeader()
    await wrapper.find('.q-btn').trigger('click')
    await flushPromises()

    expect(inBody('[data-test="alert-history"]')).not.toBeNull()

    inBody('[data-test="tab-support"]').click()
    await flushPromises()

    expect(inBody('[data-test="alert-history"]')).toBeNull()
    expect(inBody('.chat-body')).not.toBeNull()
  })

  it('marking everything as read in the dialog clears the badge', async () => {
    Alerts.add({ level: 'error', message: 'One.' })
    const wrapper = mountHeader()
    await wrapper.find('.q-btn').trigger('click')
    await flushPromises()

    inBody('[data-test="alert-mark-all"]').click()
    await flushPromises()

    expect(wrapper.find('.q-badge').exists()).toBe(false)
  })

  it('the tabs are centred and use the whole width of the dialog', async () => {
    Alerts.add({ level: 'error', message: 'One.' })
    const wrapper = mountHeader()
    await wrapper.find('.q-btn').trigger('click')
    await flushPromises()

    const tabs = inBody('[data-test="notification-tabs"]')
    expect(tabs.className).toContain('q-tabs--dense')
    // "justify" = every tab takes an equal share of the full width
    expect(tabs.querySelector('.q-tabs__content').className).toContain('q-tabs__content--align-justify')
    // the sub-header itself has no padding, so the tabs run edge to edge
    expect(inBody('[data-test="modal-subheader"]').className).toContain('s-modal-card__subheader--flush')
    expect(tabs.querySelectorAll('.q-tab')).toHaveLength(2)
  })

  it('each tab shows its own unread count next to the label', async () => {
    Alerts.add({ level: 'error', message: 'One.' })
    Alerts.add({ level: 'info', message: 'Two.' })
    const wrapper = mountHeader()
    await wrapper.find('.q-btn').trigger('click')
    await flushPromises()

    expect(inBody('[data-test="tab-alerts-badge"]').textContent.trim()).toBe('2')
    expect(inBody('[data-test="tab-support-badge"]')).toBeNull()
  })
})
