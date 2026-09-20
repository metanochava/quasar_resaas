import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

const alertSuccess = vi.fn()
vi.mock('../../../boot/alerts', () => ({ Alert: vi.fn(), AlertSuccess: (...args) => alertSuccess(...args) }))

import ChangePasswordDialog from './ChangePasswordDialog.vue'
import { useUserStore } from '../../../stores/UserStore'
import { mountWith, unmountAll, inBody, setInBody } from './_helpers'

let pinia
let User
let change

const SECRETS = ['Current-Pass-1', 'Brand-New-Pass-9!']

async function open(props = {}) {
  const wrapper = mountWith(ChangePasswordDialog, pinia, { props: { modelValue: true, ...props } })
  await flushPromises()
  return wrapper
}

const fill = async (current, next, confirm) => {
  await setInBody('input[data-test="current-password"]', current, flushPromises)
  await setInBody('input[data-test="next-password"]', next, flushPromises)
  await setInBody('input[data-test="confirm-password"]', confirm, flushPromises)
}

afterEach(() => {
  vi.restoreAllMocks()
  unmountAll()
})

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  pinia = createPinia()
  setActivePinia(pinia)
  User = useUserStore()
  User.data = { id: 'u1', email: 'dias@mytech.co.mz' }
  change = vi.spyOn(User, 'change_password_email').mockResolvedValue({})
  alertSuccess.mockReset()
})

describe('ChangePasswordDialog', () => {
  it('cannot submit until current, a long-enough new and a matching confirmation are given', async () => {
    await open()
    const submit = () => inBody('[data-test="password-submit"]')

    expect(submit().disabled).toBe(true)

    await fill('Current-Pass-1', 'short', 'short')
    expect(submit().disabled).toBe(true)

    await fill('Current-Pass-1', SECRETS[1], 'different')
    expect(submit().disabled).toBe(true)
    expect(inBody('[data-test="mismatch"]').textContent).toContain('do not match')

    await fill('Current-Pass-1', SECRETS[1], SECRETS[1])
    expect(submit().disabled).toBe(false)
  })

  it('shows a strength bar as a visual aid while typing', async () => {
    await open()
    expect(inBody('[data-test="strength"]')).toBeNull()

    await setInBody('input[data-test="next-password"]', 'abc', flushPromises)
    const weak = inBody('[data-test="strength-level"]').textContent

    await setInBody('input[data-test="next-password"]', 'Tr0ub4dor&3-horse-battery', flushPromises)
    const strong = inBody('[data-test="strength-level"]').textContent

    expect(weak).toContain('Very weak')
    expect(strong).toContain('Very strong')
  })

  it('sends the current and the new password through the existing endpoint, then closes and confirms', async () => {
    const wrapper = await open()
    await fill(SECRETS[0], SECRETS[1], SECRETS[1])

    inBody('[data-test="password-submit"]').click()
    await flushPromises()

    expect(change).toHaveBeenCalledWith('dias@mytech.co.mz', SECRETS[0], SECRETS[1])
    expect(alertSuccess).toHaveBeenCalledWith('Password updated.')
    expect(wrapper.emitted('update:modelValue').at(-1)).toEqual([false])
    expect(wrapper.emitted('changed')).toBeTruthy()
  })

  it('a rejection (e.g. wrong current password) keeps the dialog open for another try', async () => {
    change.mockRejectedValue({ response: { status: 400 } })
    const wrapper = await open()
    await fill(SECRETS[0], SECRETS[1], SECRETS[1])

    inBody('[data-test="password-submit"]').click()
    await flushPromises()

    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(alertSuccess).not.toHaveBeenCalled()
    expect(inBody('[data-test="password-submit"]').disabled).toBe(false)
  })

  it('wipes every field when it closes', async () => {
    const wrapper = await open()
    await fill(SECRETS[0], SECRETS[1], SECRETS[1])

    await wrapper.setProps({ modelValue: false })
    await wrapper.setProps({ modelValue: true })
    await flushPromises()

    expect(inBody('input[data-test="current-password"]').value).toBe('')
    expect(inBody('input[data-test="next-password"]').value).toBe('')
    expect(inBody('input[data-test="confirm-password"]').value).toBe('')
  })

  it('never puts a password in Pinia or any storage', async () => {
    await open()
    await fill(SECRETS[0], SECRETS[1], SECRETS[1])
    inBody('[data-test="password-submit"]').click()
    await flushPromises()

    const everywhere = JSON.stringify({ local: { ...localStorage }, session: { ...sessionStorage }, pinia: pinia.state.value })
    for (const secret of SECRETS) expect(everywhere).not.toContain(secret)
  })

  it('explains when the account has no email to change the password with', async () => {
    User.data = { id: 'u1', email: null }
    await open()

    expect(document.body.textContent).toContain('An email is required')
    expect(inBody('[data-test="password-submit"]').disabled).toBe(true)
  })
})
