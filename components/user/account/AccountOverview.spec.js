import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

import AccountOverview from './AccountOverview.vue'
import { mountWith, unmountAll } from './_helpers'

let pinia

const user = {
  email: 'dias@mytech.co.mz', mobile: '+258841234567',
  is_verified_email: true, is_verified_mobile: false, last_login: '2026-09-20T10:00:00Z'
}

const mountOverview = (props = {}) => mountWith(AccountOverview, pinia, { props: { user, name: 'Dias Metano', ...props } })

afterEach(unmountAll)

beforeEach(() => {
  pinia = createPinia()
})

describe('AccountOverview', () => {
  it('greets the user and shows masked contacts (never the full values)', () => {
    const wrapper = mountOverview()

    expect(wrapper.text()).toContain('Hello, Dias Metano.')
    expect(wrapper.find('[data-test="overview-email"]').text()).toBe('di••@mytech.co.mz')
    expect(wrapper.find('[data-test="overview-phone"]').text()).toBe('+258 84 ••• ••••')
    expect(wrapper.text()).not.toContain('dias@mytech.co.mz')
    expect(wrapper.text()).not.toContain('841234567')
  })

  it('shows verification only from what the backend reported - with text, not just colour', () => {
    const wrapper = mountOverview()

    expect(wrapper.find('[data-test="email-state"]').text()).toContain('Verified')
    expect(wrapper.find('[data-test="phone-state"]').text()).toContain('Not verified')
  })

  it('shows NO verification state when the backend did not report one', () => {
    const wrapper = mountOverview({ user: { email: 'a@b.com', mobile: '+258841234567' } })

    expect(wrapper.find('[data-test="email-state"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="phone-state"]').exists()).toBe(false)
  })

  it('invents nothing else: no password age, no 2FA, no sessions', () => {
    const text = mountOverview().text().toLowerCase()

    expect(text).not.toContain('last changed')
    expect(text).not.toContain('two-factor')
    expect(text).not.toContain('2fa')
    expect(text).not.toContain('session')
  })

  it('shows when the password was last changed only when the backend says so', () => {
    expect(mountOverview().find('[data-test="overview-password-changed"]').exists()).toBe(false)
    expect(mountOverview({ user: { ...user, password_changed_at: '2026-09-01T09:00:00Z' } }).find('[data-test="overview-password-changed"]').exists()).toBe(true)
  })

  it('shows the last sign-in only when there is one', () => {
    expect(mountOverview().find('[data-test="card-last-login"]').exists()).toBe(true)
    expect(mountOverview({ user: { ...user, last_login: null } }).find('[data-test="card-last-login"]').exists()).toBe(false)
  })

  it('cards lead to their section (click and keyboard)', async () => {
    const wrapper = mountOverview()

    await wrapper.find('[data-test="card-email"]').trigger('click')
    await wrapper.find('[data-test="card-security"]').trigger('keyup.enter')
    await flushPromises()

    expect(wrapper.emitted('navigate')).toEqual([['contacts'], ['security']])
    expect(wrapper.find('[data-test="card-email"]').attributes('tabindex')).toBe('0')
  })
})
