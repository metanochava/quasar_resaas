import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

const alertError = vi.fn()
const alertSuccess = vi.fn()
vi.mock('../../../boot/alerts', () => ({ Alert: (...a) => alertError(...a), AlertSuccess: (...a) => alertSuccess(...a) }))

import AccountSessions from './AccountSessions.vue'
import SecurityActivity from './SecurityActivity.vue'
import { HTTPAuth } from '../../../services/api'
import { mountWith, unmountAll, inBody } from './_helpers'

let pinia
let get
let post

const chrome = { id: 'j1', device: 'Chrome · macOS', created_at: '2026-09-20T10:00:00Z', current: true }
const firefox = { id: 'j2', device: 'Firefox · Windows', created_at: '2026-09-19T10:00:00Z', current: false }
const iphone = { id: 'j3', device: 'Safari · iOS', created_at: '2026-09-18T10:00:00Z', current: false }

const confirmButton = (label) => [...document.body.querySelectorAll('.q-dialog .q-btn')].find(button => button.textContent.trim() === label)

async function mountSessions() {
  const wrapper = mountWith(AccountSessions, pinia)
  await flushPromises()
  return wrapper
}

afterEach(() => {
  vi.restoreAllMocks()
  unmountAll()
})

beforeEach(() => {
  pinia = createPinia()
  setActivePinia(pinia)
  get = vi.spyOn(HTTPAuth, 'get').mockResolvedValue({ data: { data: [chrome, firefox, iphone] } })
  post = vi.spyOn(HTTPAuth, 'post').mockResolvedValue({ data: {} })
  alertError.mockReset()
  alertSuccess.mockReset()
})

describe('AccountSessions', () => {
  it('lists each session with its device, marks the current one and offers to end only the others', async () => {
    const wrapper = await mountSessions()

    const rows = wrapper.findAll('[data-test="session-row"]')
    expect(rows).toHaveLength(3)
    expect(rows[0].text()).toContain('Chrome · macOS')
    expect(rows[0].find('[data-test="session-current"]').exists()).toBe(true)
    expect(rows[0].find('[data-test="session-end"]').exists()).toBe(false)
    expect(rows[1].find('[data-test="session-end"]').exists()).toBe(true)
  })

  it('shows a local skeleton while loading, an error with retry, and an empty state', async () => {
    let finish
    get.mockReturnValueOnce(new Promise(resolve => { finish = resolve }))
    const loading = mountWith(AccountSessions, pinia)
    await flushPromises()
    expect(loading.find('[data-test="sessions-loading"]').exists()).toBe(true)
    finish({ data: { data: [] } })
    await flushPromises()
    expect(loading.find('[data-test="sessions-empty"]').exists()).toBe(true)

    get.mockRejectedValueOnce(new Error('500'))
    const failed = mountWith(AccountSessions, pinia)
    await flushPromises()
    expect(failed.find('[data-test="sessions-error"]').exists()).toBe(true)

    get.mockResolvedValue({ data: { data: [chrome] } })
    await failed.find('[data-test="sessions-error"] button').trigger('click')
    await flushPromises()
    expect(failed.find('[data-test="session-row"]').exists()).toBe(true)
  })

  it('ending a session asks first, then ends exactly that one', async () => {
    const wrapper = await mountSessions()

    await wrapper.findAll('[data-test="session-end"]')[0].trigger('click')
    await flushPromises()
    expect(inBody('.q-dialog').textContent).toContain('Firefox · Windows')
    expect(post).not.toHaveBeenCalled()

    confirmButton('End session').click()
    await flushPromises()

    expect(post.mock.calls[0][0]).toContain('sessions/j2/terminate/')
    expect(alertSuccess).toHaveBeenCalledWith('Session ended.')
    expect(wrapper.findAll('[data-test="session-row"]')).toHaveLength(2)
  })

  it('cancelling the confirmation ends nothing', async () => {
    const wrapper = await mountSessions()

    await wrapper.findAll('[data-test="session-end"]')[0].trigger('click')
    await flushPromises()
    confirmButton('Cancel').click()
    await flushPromises()

    expect(post).not.toHaveBeenCalled()
  })

  it('"End all other sessions" confirms, then keeps only this one', async () => {
    const wrapper = await mountSessions()
    post.mockResolvedValue({ data: { count: 2 } })

    await wrapper.find('[data-test="sessions-end-others"]').trigger('click')
    await flushPromises()
    confirmButton('End all other sessions').click()
    await flushPromises()

    expect(post.mock.calls[0][0]).toContain('sessions/terminate_others/')
    expect(alertSuccess).toHaveBeenCalledWith('Other sessions ended.')
    expect(wrapper.findAll('[data-test="session-row"]')).toHaveLength(1)
  })

  it('there is nothing to end when this is the only session', async () => {
    get.mockResolvedValue({ data: { data: [chrome] } })
    const wrapper = await mountSessions()

    expect(wrapper.find('[data-test="sessions-end-others"]').exists()).toBe(false)
  })

  it('a refused termination is reported and the list is reloaded', async () => {
    const wrapper = await mountSessions()
    const response = { status: 404, data: { detail: 'Session not found.' } }
    post.mockRejectedValue({ response })

    await wrapper.findAll('[data-test="session-end"]')[0].trigger('click')
    await flushPromises()
    confirmButton('End session').click()
    await flushPromises()

    expect(alertError).toHaveBeenCalledWith(response)
    expect(get).toHaveBeenCalledTimes(2)
  })

  it('shows no location and no IP - only the device the browser reported', async () => {
    const wrapper = await mountSessions()

    expect(wrapper.text().toLowerCase()).not.toContain('location')
    expect(wrapper.text()).not.toMatch(/\d+\.\d+\.\d+\.\d+/)
  })
})

describe('SecurityActivity', () => {
  it('lists own sign-ins and account changes with readable labels', async () => {
    get.mockResolvedValue({ data: { data: [
      { type: 'PASSWORD_CHANGED', at: '2026-09-20T11:00:00Z', device: '' },
      { type: 'login', at: '2026-09-20T10:00:00Z', device: 'Chrome · macOS' },
      { type: 'EMAIL_CHANGED', at: '2026-09-19T10:00:00Z', device: '' }
    ] } })

    const wrapper = mountWith(SecurityActivity, pinia)
    await flushPromises()

    const rows = wrapper.findAll('[data-test="activity-row"]')
    expect(rows.map(row => row.text())).toEqual([
      expect.stringContaining('Password changed'),
      expect.stringContaining('Signed in · Chrome · macOS'),
      expect.stringContaining('Email changed')
    ])
  })

  it('has empty and error states', async () => {
    get.mockResolvedValueOnce({ data: { data: [] } })
    const empty = mountWith(SecurityActivity, pinia)
    await flushPromises()
    expect(empty.find('[data-test="activity-empty"]').exists()).toBe(true)

    get.mockRejectedValueOnce(new Error('500'))
    const failed = mountWith(SecurityActivity, pinia)
    await flushPromises()
    expect(failed.find('[data-test="activity-error"]').exists()).toBe(true)
  })
})
