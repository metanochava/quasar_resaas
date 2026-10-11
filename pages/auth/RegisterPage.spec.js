import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { Quasar } from 'quasar'
import { createPinia, setActivePinia } from 'pinia'

const http = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }))

vi.mock('../../services/api', () => ({
  url: ({ url, params }) => (params ? `${url}?${new URLSearchParams(params)}` : url),
  HTTPClient: http,
  HTTPAuth: http
}))
vi.mock('../../composables/useShowLoginLogo', () => ({ useShowLoginLogo: () => ({ showLoginLogo: false }) }))

import RegisterPage from './RegisterPage.vue'

// the backend: every name is free unless listed here
let taken = new Set()
function answerAvailability (path) {
  const names = decodeURIComponent(path.split('candidates=')[1] || '').split(',').filter(Boolean)
  return Promise.resolve({
    data: { results: names.map(username => ({ username, valid: true, available: !taken.has(username) })) }
  })
}

const SInput = {
  name: 's-input',
  props: ['modelValue', 'label'],
  emits: ['update:modelValue'],
  template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />'
}

async function mountPage () {
  const wrapper = mount(RegisterPage, {
    global: {
      plugins: [Quasar],
      stubs: {
        QPage: { template: '<div><slot /></div>' },
        QDialog: { props: ['modelValue'], template: '<div v-if="modelValue"><slot /></div>' },
        's-modal-card': { template: '<div><slot /><slot name="footer" /></div>' },
        's-card': { template: '<div><slot /></div>' },
        's-btn': { template: '<button><slot /></button>' },
        's-select': true,
        's-input': SInput,
        AllLogo: true,
        OtpInput: true,
        RouterLink: true
      }
    }
  })
  await flushPromises()
  return wrapper
}

const input = (wrapper, test) => wrapper.find(`[data-test="${test}"]`)
const settle = async () => { vi.advanceTimersByTime(500); await flushPromises() }

beforeEach(() => {
  setActivePinia(createPinia())
  vi.useFakeTimers()
  taken = new Set()
  http.get.mockReset().mockImplementation(answerAvailability)
  http.post.mockReset()
})

describe('RegisterPage - username suggestions', () => {
  it('suggests a username from the name and confirms it with the backend', async () => {
    const wrapper = await mountPage()

    await input(wrapper, 'register-name').setValue('Dias Chavana')
    await settle()

    expect(wrapper.vm.username).toBe('dias.chavana')
    expect(http.get).toHaveBeenCalledTimes(1)
    expect(wrapper.vm.usernameStatus).toBe('available')
    expect(input(wrapper, 'register-suggestions').text()).toContain('diaschavana')
  })

  it('skips a suggestion the backend says is taken', async () => {
    taken = new Set(['dias.chavana'])
    const wrapper = await mountPage()

    await input(wrapper, 'register-name').setValue('Dias Chavana')
    await settle()

    expect(wrapper.vm.username).toBe('diaschavana')
    expect(wrapper.vm.visibleSuggestions).not.toContain('dias.chavana')
  })

  it('never replaces a username the user typed, and can go back to the suggestion', async () => {
    const wrapper = await mountPage()
    await input(wrapper, 'register-username').setValue('My.Own')
    await input(wrapper, 'register-name').setValue('Dias Chavana')
    await settle()

    expect(wrapper.vm.username).toBe('my.own')

    await input(wrapper, 'register-username-auto').trigger('click')
    expect(wrapper.vm.username).toBe('dias.chavana')
  })

  it('a failing availability check does not block registration', async () => {
    http.get.mockRejectedValue(new Error('network'))
    const wrapper = await mountPage()

    await input(wrapper, 'register-name').setValue('Dias Chavana')
    await settle()
    Object.assign(wrapper.vm, { email: 'dias@example.com', password: 'Strong-pass-1', confirmPassword: 'Strong-pass-1' })

    expect(wrapper.vm.usernameStatus).toBe('unknown')
    expect(wrapper.vm.canRequestOtp).toBe(true)
  })

  it('a username taken at submit goes back to the form with every field kept', async () => {
    const wrapper = await mountPage()
    await input(wrapper, 'register-name').setValue('Dias Chavana')
    await settle()
    Object.assign(wrapper.vm, { email: 'dias@example.com', password: 'Strong-pass-1', confirmPassword: 'Strong-pass-1' })
    http.post.mockResolvedValueOnce({ data: { sent: true } })
    await wrapper.vm.requestOtp()

    http.post.mockRejectedValueOnce({
      response: { data: { error: { message: 'Please correct the highlighted fields.', details: { username: ['This username is already taken'] } } } }
    })
    await wrapper.vm.completeRegistration('123456')

    expect(wrapper.vm.showOtpDialog).toBe(false)
    expect(wrapper.vm.fieldErrors.username).toBe('This username is already taken')
    expect(wrapper.vm.usernameStatus).toBe('taken')
    expect([wrapper.vm.name, wrapper.vm.email, wrapper.vm.password]).toEqual(['Dias Chavana', 'dias@example.com', 'Strong-pass-1'])
    expect(http.post.mock.calls[1][1]).toMatchObject({ name: 'Dias Chavana', username: 'dias.chavana' })
  })

  it('a wrong code stays in the code dialog', async () => {
    const wrapper = await mountPage()
    wrapper.vm.showOtpDialog = true
    http.post.mockRejectedValueOnce({ response: { data: { error: { details: { otp: ['Invalid or expired verification code'] } } } } })

    await wrapper.vm.completeRegistration('000000')

    expect(wrapper.vm.showOtpDialog).toBe(true)
    expect(wrapper.vm.otpError).toBe('Invalid or expired verification code')
  })
})
