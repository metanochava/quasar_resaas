import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

const get = vi.fn()
const post = vi.fn()

vi.mock('../../../services/api', async (importOriginal) => ({
  ...(await importOriginal()),
  HTTPAuth: { get: (...args) => get(...args), post: (...args) => post(...args) }
}))
vi.mock('../../../boot/alerts', () => ({ Alert: vi.fn(), AlertSuccess: vi.fn() }))

import AccountTwoFactor from './AccountTwoFactor.vue'
import { mountWith, unmountAll, inBody, setInBody, clickInBody } from './_helpers'

let pinia

const INFO = (over = {}) => ({ state: 'not_configured', policy: 'optional', recovery_codes_remaining: 0, can_setup: true, can_disable: true, ...over })

async function open(info) {
  get.mockResolvedValue({ data: info })
  const wrapper = mountWith(AccountTwoFactor, pinia)
  await flushPromises()
  return wrapper
}

beforeEach(() => {
  pinia = createPinia()
  setActivePinia(pinia)
  get.mockReset()
  post.mockReset()
})

afterEach(() => {
  vi.restoreAllMocks()
  unmountAll()
})

describe('AccountTwoFactor', () => {
  it('shows the real state and policy and offers to enable it', async () => {
    const wrapper = await open(INFO())

    expect(get.mock.calls[0][0]).toContain('two_factor/')
    expect(wrapper.find('[data-test="two-factor-state"]').text()).toBe('Not configured')
    expect(wrapper.find('[data-test="two-factor-policy"]').text()).toBe('Optional')
    expect(wrapper.find('[data-test="two-factor-enable"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="two-factor-disable"]').exists()).toBe(false)
  })

  it('a half-finished setup still reads as not configured', async () => {
    const wrapper = await open(INFO({ state: 'pending' }))

    expect(wrapper.find('[data-test="two-factor-state"]').text()).toBe('Not configured')
  })

  it('when the organisation disabled it there is nothing to enable', async () => {
    const wrapper = await open(INFO({ policy: 'disabled', can_setup: false }))

    expect(wrapper.find('[data-test="two-factor-enable"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="two-factor-unavailable-policy"]').exists()).toBe(true)
  })

  it('a REQUIRED policy warns and, once active, offers no way to disable it', async () => {
    const missing = await open(INFO({ policy: 'required' }))
    expect(missing.find('[role="alert"]').text()).toContain('requires two-factor')
    unmountAll()

    const active = await open(INFO({ state: 'active', policy: 'required', can_disable: false, recovery_codes_remaining: 8 }))
    expect(active.find('[data-test="two-factor-state"]').text()).toBe('Active')
    expect(active.find('[data-test="two-factor-disable"]').exists()).toBe(false)
    expect(active.find('[data-test="two-factor-locked"]').exists()).toBe(true)
    expect(active.find('[data-test="two-factor-regenerate"]').exists()).toBe(true)
  })

  it('shows how many recovery codes are left', async () => {
    const wrapper = await open(INFO({ state: 'active', recovery_codes_remaining: 6 }))

    expect(wrapper.find('[data-test="recovery-remaining"]').text()).toContain('6')
  })

  it('enabling runs the whole flow: setup, confirm, recovery codes', async () => {
    const wrapper = await open(INFO())

    post.mockResolvedValueOnce({ data: { secret: 'JBSWY3DPEHPK3PXP', otpauth_uri: 'otpauth://x', qr: 'data:image/png;base64,QQ==' } })
    await wrapper.find('[data-test="two-factor-enable"]').trigger('click')
    await flushPromises()
    expect(post.mock.calls[0][0]).toContain('two_factor/setup/')

    post.mockResolvedValueOnce({ data: { recovery_codes: ['AAAAA-BBBBB'] } })
    get.mockResolvedValue({ data: INFO({ state: 'active', recovery_codes_remaining: 1 }) })
    await setInBody('input[data-test="setup-code"]', '123456', flushPromises)
    await clickInBody('[data-test="setup-submit"]', flushPromises)

    expect(post.mock.calls[1][0]).toContain('two_factor/confirm/')
    expect(post.mock.calls[1][1]).toEqual({ code: '123456' })
    expect(inBody('[data-test="recovery-list"]').textContent).toContain('AAAAA-BBBBB')
    expect(wrapper.find('[data-test="two-factor-state"]').text()).toBe('Active')
  })

  it('disabling asks for a code and sends it', async () => {
    const wrapper = await open(INFO({ state: 'active', recovery_codes_remaining: 3 }))

    await wrapper.find('[data-test="two-factor-disable"]').trigger('click')
    await flushPromises()

    post.mockResolvedValueOnce({ data: {} })
    get.mockResolvedValue({ data: INFO() })
    await setInBody('input[data-test="code-input"]', '123456', flushPromises)
    await clickInBody('[data-test="code-submit"]', flushPromises)

    expect(post.mock.calls[0][0]).toContain('two_factor/disable/')
    expect(post.mock.calls[0][1]).toEqual({ code: '123456' })
    expect(wrapper.find('[data-test="two-factor-state"]').text()).toBe('Not configured')
  })

  it('a wrong code keeps the account protected and the dialog open', async () => {
    const wrapper = await open(INFO({ state: 'active' }))

    await wrapper.find('[data-test="two-factor-disable"]').trigger('click')
    await flushPromises()

    post.mockRejectedValueOnce({ response: { status: 400 } })
    await setInBody('input[data-test="code-input"]', '000000', flushPromises)
    await clickInBody('[data-test="code-submit"]', flushPromises)

    expect(inBody('[data-test="code-input"]')).not.toBeNull()
    expect(inBody('input[data-test="code-input"]').value).toBe('')
    expect(wrapper.find('[data-test="two-factor-state"]').text()).toBe('Active')
  })

  it('regenerating shows the new codes once and forgets them when closed', async () => {
    const wrapper = await open(INFO({ state: 'active', recovery_codes_remaining: 2 }))

    await wrapper.find('[data-test="two-factor-regenerate"]').trigger('click')
    await flushPromises()

    post.mockResolvedValueOnce({ data: { recovery_codes: ['NEWNE-WCODE'] } })
    await setInBody('input[data-test="code-input"]', '123456', flushPromises)
    await clickInBody('[data-test="code-submit"]', flushPromises)

    expect(post.mock.calls[0][0]).toContain('two_factor/recovery/')
    expect(inBody('[data-test="recovery-list"]').textContent).toContain('NEWNE-WCODE')

    await clickInBody('[data-test="codes-done"]', flushPromises)
    await new Promise(resolve => setTimeout(resolve, 400))
    expect(wrapper.vm.$.setupState.freshCodes).toEqual([])
  })

  it('never keeps a secret or a recovery code in Pinia or any storage', async () => {
    const wrapper = await open(INFO())
    post.mockResolvedValueOnce({ data: { secret: 'JBSWY3DPEHPK3PXP', otpauth_uri: 'otpauth://x', qr: 'data:image/png;base64,QQ==' } })
    await wrapper.find('[data-test="two-factor-enable"]').trigger('click')
    await flushPromises()
    post.mockResolvedValueOnce({ data: { recovery_codes: ['AAAAA-BBBBB'] } })
    await setInBody('input[data-test="setup-code"]', '123456', flushPromises)
    await clickInBody('[data-test="setup-submit"]', flushPromises)

    const everywhere = JSON.stringify({ pinia: pinia.state.value, local: { ...localStorage }, session: { ...sessionStorage } })

    expect(everywhere).not.toContain('JBSWY3DPEHPK3PXP')
    expect(everywhere).not.toContain('AAAAA-BBBBB')
  })

  it('a load failure says so and can retry', async () => {
    get.mockRejectedValueOnce({ response: { status: 500 } })
    const wrapper = mountWith(AccountTwoFactor, pinia)
    await flushPromises()

    expect(wrapper.find('[data-test="two-factor-unavailable"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="two-factor-enable"]').exists()).toBe(false)
  })
})
