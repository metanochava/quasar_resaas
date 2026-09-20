import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('../../boot/alerts', () => ({ Alert: vi.fn(), AlertSuccess: vi.fn() }))

import TwoFactorSetupDialog from './TwoFactorSetupDialog.vue'
import { mountWith, unmountAll, inBody, setInBody, clickInBody } from './account/_helpers'

let pinia
let begin
let confirm

const SETUP = { secret: 'JBSWY3DPEHPK3PXP', otpauth_uri: 'otpauth://totp/ana?secret=JBSWY3DPEHPK3PXP', qr: 'data:image/png;base64,QQ==' }
const CODES = ['AAAAA-BBBBB', 'CCCCC-DDDDD']

async function open(props = {}) {
  const wrapper = mountWith(TwoFactorSetupDialog, pinia, { props: { modelValue: true, begin, confirm, ...props } })
  await flushPromises()
  return wrapper
}

beforeEach(() => {
  pinia = createPinia()
  setActivePinia(pinia)
  begin = vi.fn().mockResolvedValue(SETUP)
  confirm = vi.fn().mockResolvedValue(CODES)
})

afterEach(() => {
  vi.restoreAllMocks()
  unmountAll()
})

describe('TwoFactorSetupDialog', () => {
  it('starts the setup when opened and shows the QR, the manual key and the otpauth link', async () => {
    await open()

    expect(begin).toHaveBeenCalledTimes(1)
    expect(inBody('[data-test="setup-qr"]').getAttribute('src')).toBe(SETUP.qr)
    expect(inBody('[data-test="setup-secret"]').textContent).toBe(SETUP.secret)
    expect(inBody('[data-test="setup-link"]').getAttribute('href')).toBe(SETUP.otpauth_uri)
  })

  it('only accepts a 6-digit code', async () => {
    await open()
    const submit = () => inBody('[data-test="setup-submit"]')

    expect(submit().disabled).toBe(true)
    await setInBody('input[data-test="setup-code"]', '12345', flushPromises)
    expect(submit().disabled).toBe(true)
    await setInBody('input[data-test="setup-code"]', 'abcdef', flushPromises)
    expect(submit().disabled).toBe(true)
    await setInBody('input[data-test="setup-code"]', '123 456', flushPromises)
    expect(submit().disabled).toBe(false)
  })

  it('confirms the code, then shows the recovery codes and blocks closing until they are saved', async () => {
    const wrapper = await open()

    await setInBody('input[data-test="setup-code"]', '123456', flushPromises)
    await clickInBody('[data-test="setup-submit"]', flushPromises)

    expect(confirm).toHaveBeenCalledWith('123456')
    expect(inBody('[data-test="recovery-list"]').textContent).toContain('AAAAA-BBBBB')

    // "Done" needs the acknowledgement; the dialog cannot be dismissed before it
    expect(inBody('[data-test="setup-done"]').disabled).toBe(true)
    expect(inBody('[data-test="setup-close"]')).toBeNull()

    const box = inBody('[data-test="codes-saved"]')
    box.click()
    await flushPromises()
    expect(inBody('[data-test="setup-done"]').disabled).toBe(false)

    await clickInBody('[data-test="setup-done"]', flushPromises)
    expect(wrapper.emitted('finished')).toHaveLength(1)
    expect(wrapper.emitted('update:modelValue').at(-1)).toEqual([false])
  })

  it('a rejected code clears the field and stays on the scan step', async () => {
    confirm.mockRejectedValue({ response: { status: 400 } })
    await open()

    await setInBody('input[data-test="setup-code"]', '000000', flushPromises)
    await clickInBody('[data-test="setup-submit"]', flushPromises)

    expect(inBody('[data-test="setup-qr"]')).not.toBeNull()
    expect(inBody('input[data-test="setup-code"]').value).toBe('')
    expect(inBody('[data-test="recovery-codes"]')).toBeNull()
  })

  it('a failed start offers a retry', async () => {
    begin.mockRejectedValueOnce({ response: { status: 500 } })
    await open()

    expect(inBody('[data-test="setup-qr"]')).toBeNull()
    await clickInBody('[data-test="setup-retry"]', flushPromises)

    expect(begin).toHaveBeenCalledTimes(2)
    expect(inBody('[data-test="setup-qr"]')).not.toBeNull()
  })

  it('a persistent dialog (sign-in enrolment) has no close button', async () => {
    await open({ persistent: true })

    expect(inBody('[data-test="setup-close"]')).toBeNull()
  })

  it('wipes the secret when closed', async () => {
    const wrapper = await open()
    expect(inBody('[data-test="setup-secret"]')).not.toBeNull()

    await wrapper.setProps({ modelValue: false })
    await flushPromises()

    expect(wrapper.vm.$.setupState.setup).toBeNull()
  })
})
