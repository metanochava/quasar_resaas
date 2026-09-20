import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

const alertSuccess = vi.fn()
vi.mock('../../../boot/alerts', () => ({ Alert: vi.fn(), AlertSuccess: (...args) => alertSuccess(...args) }))

import ChangePhoneDialog from './ChangePhoneDialog.vue'
import { HTTPAuth } from '../../../services/api'
import { useUserStore } from '../../../stores/UserStore'
import { mountWith, unmountAll, inBody, setInBody } from './_helpers'

let pinia
let User
let post

async function open() {
  const wrapper = mountWith(ChangePhoneDialog, pinia, { props: { modelValue: true } })
  await flushPromises()
  return wrapper
}

const fillCode = async (code) => {
  const box = document.body.querySelectorAll('.otp-box')
  ;[...code].forEach((digit, i) => {
    box[i].value = digit
    box[i].dispatchEvent(new Event('input', { bubbles: true }))
  })
  await flushPromises()
}

afterEach(() => {
  vi.restoreAllMocks()
  unmountAll()
})

beforeEach(() => {
  pinia = createPinia()
  setActivePinia(pinia)
  User = useUserStore()
  User.data = { id: 'u1', mobile: '+258841234567' }
  post = vi.spyOn(HTTPAuth, 'post').mockResolvedValue({ data: {} })
  alertSuccess.mockReset()
})

describe('ChangePhoneDialog - E.164 + OTP', () => {
  it('builds the full international number and validates it (E.164)', async () => {
    await open()

    expect(inBody('[data-test="full-number"]').textContent).toContain('—')
    expect(inBody('[data-test="send-phone-code"]').disabled).toBe(true)

    await setInBody('input[data-test="new-phone"]', '84 999 8888', flushPromises)
    expect(inBody('[data-test="full-number"]').textContent).toContain('+258849998888')
    expect(inBody('[data-test="send-phone-code"]').disabled).toBe(false)

    await setInBody('input[data-test="new-phone"]', '12', flushPromises)
    expect(inBody('[data-test="send-phone-code"]').disabled).toBe(true)
    expect(document.body.textContent).toContain('Invalid phone number')
  })

  it('cannot "change" to the number the account already has', async () => {
    await open()

    await setInBody('input[data-test="new-phone"]', '841234567', flushPromises)

    expect(inBody('[data-test="send-phone-code"]').disabled).toBe(true)
  })

  it('sends the code to the NEW number and only applies it after confirmation', async () => {
    const wrapper = await open()
    await setInBody('input[data-test="new-phone"]', '849998888', flushPromises)
    inBody('[data-test="send-phone-code"]').click()
    await flushPromises()

    expect(post.mock.calls[0][0]).toContain('profile/contact/otp/request/')
    expect(post.mock.calls[0][1]).toEqual({ channel: 'mobile', identifier: '+258849998888' })
    expect(User.data.mobile).toBe('+258841234567')
    expect(inBody('[data-test="otp-target"]').textContent).toBe('+258 84 ••• ••••')

    post.mockResolvedValueOnce({ data: { id: 'u1', mobile: '+258849998888', is_verified_mobile: true } })
    await fillCode('654321')

    expect(post.mock.calls.at(-1)[1]).toEqual({ channel: 'mobile', identifier: '+258849998888', otp: '654321' })
    expect(User.data.mobile).toBe('+258849998888')
    expect(alertSuccess).toHaveBeenCalledWith('Phone number updated.')
    expect(wrapper.emitted('update:modelValue').at(-1)).toEqual([false])
  })

  it('a wrong code keeps the old number', async () => {
    await open()
    await setInBody('input[data-test="new-phone"]', '849998888', flushPromises)
    inBody('[data-test="send-phone-code"]').click()
    await flushPromises()

    post.mockRejectedValueOnce({ response: { status: 400 } })
    await fillCode('000000')

    expect(User.data.mobile).toBe('+258841234567')
    expect(inBody('[data-test="otp-invalid"]')).toBeTruthy()
  })
})
