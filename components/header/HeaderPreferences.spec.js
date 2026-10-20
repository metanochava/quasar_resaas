import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { Quasar, Dark, Screen } from 'quasar'
import { createPinia, setActivePinia } from 'pinia'

import HeaderPreferences from './HeaderPreferences.vue'
import HeaderUser from './HeaderUser.vue'
import BtnComponent from '../engine/BtnComponent.vue'
import TooltipComponent from '../engine/TooltipComponent.vue'
import { useUserStore } from '../../stores/UserStore'
import { useLanguageStore } from '../../stores/LanguageStore'

// q-menu / q-expansion-item content is only rendered when it opens - inline it
const inline = { template: '<div><slot /></div>' }
const global = {
  plugins: [[Quasar, {}]],
  components: { 's-btn': BtnComponent, 's-tooltip': TooltipComponent },
  mocks: { $router: { push: vi.fn() }, $route: { fullPath: '/', path: '/', matched: [] } },
  stubs: { QMenu: inline, QExpansionItem: inline, RegisterEntity: true, GroupSelector: true },
}

let Language
let User

beforeEach(() => {
  setActivePinia(createPinia())
  localStorage.clear()
  Dark.set(false)
  User = useUserStore()
  Language = useLanguageStore()
  Language.rows = [{ id: 1, name: 'Português' }, { id: 2, name: 'English' }]
  Language.current = { id: 1, name: 'Português' }
  Language.change = vi.fn()
  User.setLanguage = vi.fn()
})

describe('HeaderPreferences - dark mode, full screen and language as menu items', () => {
  it('switches dark mode and keeps it, as HeaderDarkMode does', async () => {
    const wrapper = mount(HeaderPreferences, { global })

    await wrapper.find('[data-test="header-pref-dark"]').trigger('click')

    expect(Dark.isActive).toBe(true)
    expect(localStorage.getItem('dark')).toBe('true')
  })

  it('changes the language, as HeaderLanguage does', async () => {
    const wrapper = mount(HeaderPreferences, { global })

    const english = wrapper.findAll('.header-preferences__option').find((item) => item.text().includes('English'))
    await english.trigger('click')

    expect(Language.change).toHaveBeenCalledWith({ id: 2, name: 'English' })
    expect(User.setLanguage).toHaveBeenCalledWith({ id: 2, name: 'English' })
  })

  it('offers full screen only where the browser can do it', () => {
    Object.defineProperty(document, 'fullscreenEnabled', { configurable: true, value: false })
    expect(mount(HeaderPreferences, { global }).find('[data-test="header-pref-fullscreen"]').exists()).toBe(false)

    Object.defineProperty(document, 'fullscreenEnabled', { configurable: true, value: true })
    expect(mount(HeaderPreferences, { global }).find('[data-test="header-pref-fullscreen"]').exists()).toBe(true)
  })
})

describe('HeaderUser - the preferences on very small screens', () => {
  it('are in the user menu only below 600px (xs), signed in or not', async () => {
    Screen.xs = false
    expect(mount(HeaderUser, { global }).find('[data-test="header-preferences"]').exists()).toBe(false)

    Screen.xs = true
    expect(mount(HeaderUser, { global }).find('[data-test="header-preferences"]').exists()).toBe(true)

    User.data = { id: 'u1', username: 'joao' }
    expect(mount(HeaderUser, { global }).find('[data-test="header-preferences"]').exists()).toBe(true)
    Screen.xs = false
  })
})
