import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

const alertSuccess = vi.fn()
vi.mock('../../../boot/alerts', () => ({ Alert: vi.fn(), AlertSuccess: (...args) => alertSuccess(...args) }))

import ChangeEmailDialog from './ChangeEmailDialog.vue'
import { HTTPAuth } from '../../../services/api'
import { useUserStore } from '../../../stores/UserStore'
import { mountWith, unmountAll, inBody, setInBody } from './_helpers'

let pinia
let User
let post

async function open() {
  const wrapper = mountWith(ChangeEmailDialog, pinia, { props: { modelValue: true } })
  await flushPromises()
  return wrapper
}

const send = async () => { inBody('[data-test="send-email-code"]').click(); await flushPromises() }

afterEach(() => {
  vi.restoreAllMocks()
  unmountAll()
})

beforeEach(() => {
  localStorage.clear()
  pinia = createPinia()
  setActivePinia(pinia)
  User = useUserStore()
  User.data = { id: 'u1', email: 'old@example.com' }
  post = vi.spyOn(HTTPAuth, 'post').mockResolvedValue({ data: {} })
  alertSuccess.mockReset()
})

describe('ChangeEmailDialog - a code goes to the NEW address before anything changes', () => {
  it('cannot send for an empty, invalid or unchanged email', async () => {
    await open()
    const disabled = () => inBody('[data-test="send-email-code"]').disabled

    expect(disabled()).toBe(true)
    await setInBody('input[data-test="new-email"]', 'not-an-email', flushPromises)
    expect(disabled()).toBe(true)
    expect(document.body.textContent).toContain('Invalid email')
    await setInBody('input[data-test="new-email"]', 'OLD@example.com', flushPromises)
    expect(disabled()).toBe(true)
    await setInBody('input[data-test="new-email"]', 'new@example.com', flushPromises)
    expect(disabled()).toBe(false)
  })

  it('requests the code for the normalised new email, then shows the code step - nothing changed yet', async () => {
    await open()
    await setInBody('input[data-test="new-email"]', '  New@Example.com ', flushPromises)
    await send()

    const [target, body] = post.mock.calls[0]
    expect(target).toContain('profile/contact/otp/request/')
    expect(body).toEqual({ channel: 'email', identifier: 'new@example.com' })
    expect(User.data.email).toBe('old@example.com')
    expect(inBody('[data-test="otp-target"]').textContent).toBe('ne••@example.com')
    expect(document.body.textContent).toContain('Verify your email')
  })

  it('applies the email only after the backend accepts the code, then closes', async () => {
    const wrapper = await open()
    await setInBody('input[data-test="new-email"]', 'new@example.com', flushPromises)
    await send()

    post.mockResolvedValueOnce({ data: { id: 'u1', email: 'new@example.com', is_verified_email: true } })
    const box = document.body.querySelectorAll('.otp-box')
    ;[...'123456'].forEach((digit, i) => {
      box[i].value = digit
      box[i].dispatchEvent(new Event('input', { bubbles: true }))
    })
    await flushPromises()

    expect(post.mock.calls.at(-1)[0]).toContain('profile/contact/otp/confirm/')
    expect(post.mock.calls.at(-1)[1]).toEqual({ channel: 'email', identifier: 'new@example.com', otp: '123456' })
    expect(User.data.email).toBe('new@example.com')
    expect(alertSuccess).toHaveBeenCalledWith('Email updated.')
    expect(wrapper.emitted('update:modelValue').at(-1)).toEqual([false])
    expect(wrapper.emitted('changed')).toBeTruthy()
  })

  it('a wrong code says so, keeps the old email and offers another try', async () => {
    await open()
    await setInBody('input[data-test="new-email"]', 'new@example.com', flushPromises)
    await send()

    post.mockRejectedValueOnce({ response: { status: 400 } })
    inBody('.otp-box').value = '1'
    const box = document.body.querySelectorAll('.otp-box')
    ;[...'000000'].forEach((digit, i) => {
      box[i].value = digit
      box[i].dispatchEvent(new Event('input', { bubbles: true }))
    })
    await flushPromises()

    expect(User.data.email).toBe('old@example.com')
    expect(inBody('[data-test="otp-invalid"]').textContent).toContain('Invalid or expired code')
  })

  it('"Resend code" asks for a new code for the same address', async () => {
    await open()
    await setInBody('input[data-test="new-email"]', 'new@example.com', flushPromises)
    await send()
    post.mockClear()

    inBody('[data-test="otp-resend"]').click()
    await flushPromises()

    expect(post.mock.calls[0][1]).toEqual({ channel: 'email', identifier: 'new@example.com' })
  })

  it('cancelling the code step forgets everything and closes', async () => {
    const wrapper = await open()
    await setInBody('input[data-test="new-email"]', 'new@example.com', flushPromises)
    await send()

    inBody('[data-test="otp-cancel"]').click()
    await flushPromises()

    expect(wrapper.emitted('update:modelValue').at(-1)).toEqual([false])
    expect(User.data.email).toBe('old@example.com')
  })

  it('never stores the code', async () => {
    await open()
    await setInBody('input[data-test="new-email"]', 'new@example.com', flushPromises)
    await send()
    post.mockResolvedValueOnce({ data: { id: 'u1', email: 'new@example.com' } })
    const box = document.body.querySelectorAll('.otp-box')
    ;[...'482913'].forEach((digit, i) => {
      box[i].value = digit
      box[i].dispatchEvent(new Event('input', { bubbles: true }))
    })
    await flushPromises()

    expect(JSON.stringify({ ...localStorage, ...sessionStorage, pinia: pinia.state.value })).not.toContain('482913')
  })
})
