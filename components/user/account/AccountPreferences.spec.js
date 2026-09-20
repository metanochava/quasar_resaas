import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { Dark } from 'quasar'

vi.mock('../../../boot/alerts', () => ({ Alert: vi.fn(), AlertSuccess: vi.fn() }))

import AccountPreferences from './AccountPreferences.vue'
import { useUserStore } from '../../../stores/UserStore'
import { useLanguageStore } from '../../../stores/LanguageStore'
import { mountWith, unmountAll } from './_helpers'

let pinia
let User
let Language

const mountPrefs = () => mountWith(AccountPreferences, pinia)

afterEach(() => {
  vi.restoreAllMocks()
  unmountAll()
  localStorage.clear()
})

beforeEach(() => {
  pinia = createPinia()
  setActivePinia(pinia)
  User = useUserStore()
  User.data = { id: 'u1', ui_config: { layout: { sidebar_mini: false, menu_rtl: false } } }
  Language = useLanguageStore()
  Language.rows = [{ id: 1, name: 'Português', code: 'pt-pt' }, { id: 2, name: 'English', code: 'en-us' }]
  Language.current = Language.rows[0]
  vi.spyOn(Language, 'change').mockImplementation(() => {})
  vi.spyOn(User, 'setLanguage').mockImplementation(() => {})
  vi.spyOn(User, 'toggleSidebarMini').mockResolvedValue({})
  vi.spyOn(User, 'toggleMenuRtl').mockResolvedValue({})
  Dark.set(false)
})

describe('AccountPreferences - reuses what the app already has', () => {
  it('lists the app languages with the current one selected, and switches through the existing store calls', async () => {
    const wrapper = mountPrefs()
    await flushPromises()

    const radios = wrapper.findAll('[data-test="pref-language"] .q-radio')
    expect(radios).toHaveLength(2)
    expect(radios[0].attributes('aria-checked')).toBe('true')

    await radios[1].trigger('click')

    expect(Language.change).toHaveBeenCalledWith(Language.rows[1])
    expect(User.setLanguage).toHaveBeenCalledWith(Language.rows[1])
  })

  it('appearance drives $q.dark and the same storage key the header button uses', async () => {
    const wrapper = mountPrefs()
    await flushPromises()

    await wrapper.findAll('[data-test="pref-appearance"] .q-radio')[1].trigger('click')

    expect(Dark.isActive).toBe(true)
    expect(localStorage.getItem('dark')).toBe('true')
  })

  it('the menu switches reflect the resolved layout and only call the backend when they change', async () => {
    User.data = { id: 'u1', ui_config: { layout: { sidebar_mini: true, menu_rtl: false } } }
    const wrapper = mountPrefs()
    await flushPromises()

    expect(wrapper.find('[data-test="pref-mini"]').attributes('aria-checked')).toBe('true')
    expect(wrapper.find('[data-test="pref-rtl"]').attributes('aria-checked')).toBe('false')

    await wrapper.find('[data-test="pref-rtl"]').trigger('click')
    expect(User.toggleMenuRtl).toHaveBeenCalledTimes(1)
    expect(User.toggleSidebarMini).not.toHaveBeenCalled()
  })

  it('stores no new setting of its own (only the dark key)', async () => {
    const wrapper = mountPrefs()
    await flushPromises()
    await wrapper.findAll('[data-test="pref-appearance"] .q-radio')[1].trigger('click')

    expect(Object.keys(localStorage)).toEqual(['dark'])
  })
})
