import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

const alertError = vi.fn()
const alertSuccess = vi.fn()
vi.mock('../../../boot/alerts', () => ({ Alert: (...a) => alertError(...a), AlertSuccess: (...a) => alertSuccess(...a) }))

import AccountProfile from './AccountProfile.vue'
import { HTTPAuth } from '../../../services/api'
import { useUserStore } from '../../../stores/UserStore'
import { mountWith, unmountAll } from './_helpers'

let pinia
let User
let get
let patch
let post

const person = { id: 'p1', name: 'Dias', surname: 'Metano', gender: { id: 'M', value: 'M', label: 'Masculine' }, date_of_birth: '1990-05-20', nationality: 'Moçambicana' }

async function mountProfile() {
  const wrapper = mountWith(AccountProfile, pinia)
  await flushPromises()
  return wrapper
}

const type = async (wrapper, selector, value) => {
  const input = wrapper.find(`input[data-test="${selector}"]`)
  input.element.value = value
  await input.trigger('input')
}

afterEach(() => {
  vi.restoreAllMocks()
  unmountAll()
})

beforeEach(() => {
  pinia = createPinia()
  setActivePinia(pinia)
  User = useUserStore()
  User.data = { id: 'u1', username: 'dias', email: 'dias@mytech.co.mz', profile: null }
  get = vi.spyOn(HTTPAuth, 'get').mockResolvedValue({ data: person })
  patch = vi.spyOn(HTTPAuth, 'patch').mockResolvedValue({ data: {} })
  post = vi.spyOn(HTTPAuth, 'post').mockResolvedValue({ data: { id: 'p2' } })
  vi.spyOn(User, 'updateProfile').mockResolvedValue({})
  alertError.mockReset()
  alertSuccess.mockReset()
})

describe('AccountProfile - loading and the dirty state', () => {
  it('shows a local skeleton while loading, then the person\'s data', async () => {
    let finish
    get.mockReturnValueOnce(new Promise(resolve => { finish = resolve }))

    const wrapper = mountWith(AccountProfile, pinia)
    await flushPromises()
    expect(wrapper.find('[data-test="profile-loading"]').exists()).toBe(true)

    finish({ data: person })
    await flushPromises()

    expect(wrapper.find('[data-test="profile-loading"]').exists()).toBe(false)
    expect(wrapper.find('input[data-test="f-name"]').element.value).toBe('Dias')
    expect(wrapper.find('input[data-test="f-surname"]').element.value).toBe('Metano')
  })

  it('Save and Cancel are disabled until something changes', async () => {
    const wrapper = await mountProfile()

    expect(wrapper.find('[data-test="profile-save"]').attributes('disabled')).toBeDefined()
    expect(wrapper.find('[data-test="profile-cancel"]').attributes('disabled')).toBeDefined()

    await type(wrapper, 'f-name', 'Dias Manuel')

    expect(wrapper.find('[data-test="profile-save"]').attributes('disabled')).toBeUndefined()
    expect(wrapper.emitted('update:dirty').at(-1)).toEqual([true])
  })

  it('Cancel changes restores what was loaded', async () => {
    const wrapper = await mountProfile()
    await type(wrapper, 'f-name', 'Changed')

    await wrapper.find('[data-test="profile-cancel"]').trigger('click')

    expect(wrapper.find('input[data-test="f-name"]').element.value).toBe('Dias')
    expect(wrapper.emitted('update:dirty').at(-1)).toEqual([false])
  })

  it('reports the SAVED full name, not the unsaved edits', async () => {
    const wrapper = await mountProfile()
    await type(wrapper, 'f-name', 'Unsaved')

    expect(wrapper.emitted('update:name').at(-1)).toEqual(['Dias Metano'])
  })
})

describe('AccountProfile - saving', () => {
  it('saves the username and the person, NEVER the email, and confirms', async () => {
    const wrapper = await mountProfile()
    await type(wrapper, 'f-name', 'Dias Manuel')

    await wrapper.find('[data-test="profile-save"]').trigger('click')
    await flushPromises()

    expect(User.updateProfile).toHaveBeenCalledWith({ username: 'dias' })
    expect(patch.mock.calls[0][0]).toContain('django_resaas/persons/p1/')
    expect(patch.mock.calls[0][1]).toEqual({ name: 'Dias Manuel', surname: 'Metano', gender: 'M', date_of_birth: '1990-05-20', nationality: 'Moçambicana' })
    expect(JSON.stringify([User.updateProfile.mock.calls, patch.mock.calls])).not.toContain('email')
    expect(alertSuccess).toHaveBeenCalledWith('Changes saved.')
    // saved -> clean again
    expect(wrapper.emitted('update:dirty').at(-1)).toEqual([false])
  })

  it('creates the person when the user has none yet', async () => {
    get.mockResolvedValue({ data: {} })
    const wrapper = await mountProfile()
    await type(wrapper, 'f-name', 'Novo')

    await wrapper.find('[data-test="profile-save"]').trigger('click')
    await flushPromises()

    expect(post.mock.calls[0][0]).toContain('django_resaas/persons/')
    expect(post.mock.calls[0][1]).toMatchObject({ name: 'Novo', user: 'u1' })
  })

  it('a failed save is reported and the edits are kept', async () => {
    const response = { status: 400, data: { detail: 'nope' } }
    patch.mockRejectedValue({ response })
    const wrapper = await mountProfile()
    await type(wrapper, 'f-name', 'Dias Manuel')

    await wrapper.find('[data-test="profile-save"]').trigger('click')
    await flushPromises()

    expect(alertError).toHaveBeenCalledWith(response)
    expect(alertSuccess).not.toHaveBeenCalled()
    expect(wrapper.find('input[data-test="f-name"]').element.value).toBe('Dias Manuel')
    expect(wrapper.emitted('update:dirty').at(-1)).toEqual([true])
  })
})

describe('AccountProfile - photo', () => {
  const pick = async (wrapper, file) => {
    const input = wrapper.find('[data-test="avatar-input"]')
    Object.defineProperty(input.element, 'files', { value: [file], configurable: true })
    await input.trigger('change')
  }

  beforeEach(() => {
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:preview')
  })

  it('is reachable without hovering (a real, labelled button)', async () => {
    const wrapper = await mountProfile()

    expect(wrapper.find('button[data-test="avatar-button"]').attributes('aria-label')).toBe('Change photo')
  })

  it('shows a preview, uploads with loading feedback and confirms', async () => {
    let finish
    User.updateProfile.mockReturnValueOnce(new Promise(resolve => { finish = resolve }))
    const wrapper = await mountProfile()
    User.updateProfile.mockClear()

    await pick(wrapper, new File(['x'], 'me.png', { type: 'image/png' }))
    await flushPromises()

    expect(wrapper.find('img').attributes('src')).toBe('blob:preview')
    expect(wrapper.find('button[data-test="avatar-button"]').attributes('disabled')).toBeDefined()
    expect(User.updateProfile.mock.calls[0][0]).toBeInstanceOf(FormData)

    finish({})
    await flushPromises()
    expect(alertSuccess).toHaveBeenCalledWith('Photo updated.')
  })

  it('refuses a file that is not an image, without uploading', async () => {
    const wrapper = await mountProfile()
    User.updateProfile.mockClear()

    await pick(wrapper, new File(['x'], 'doc.pdf', { type: 'application/pdf' }))
    await flushPromises()

    expect(User.updateProfile).not.toHaveBeenCalled()
    expect(wrapper.find('[data-test="avatar-error"]').text()).toBe('Choose an image file.')
  })

  it('a failed upload restores the previous photo and says so', async () => {
    User.data = { ...User.data, profile: { url: 'http://x/old.png' } }
    const wrapper = await mountProfile()
    User.updateProfile.mockRejectedValueOnce({ response: { status: 500 } })

    await pick(wrapper, new File(['x'], 'me.png', { type: 'image/png' }))
    await flushPromises()

    expect(wrapper.find('img').attributes('src')).toContain('old.png')
    expect(wrapper.find('[data-test="avatar-error"]').exists()).toBe(true)
    expect(alertError).toHaveBeenCalled()
  })
})
