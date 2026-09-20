import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { Quasar } from 'quasar'

const screen = { lt: { md: false } }

vi.mock('quasar', async (importOriginal) => ({
  ...(await importOriginal()),
  useQuasar: () => ({ screen })
}))

import AccountSidebar from './AccountSidebar.vue'

const SECTIONS = [
  { id: 'overview', label: 'Overview', icon: 'dashboard' },
  { id: 'profile', label: 'Profile', icon: 'person', badge: true },
  { id: 'security', label: 'Security', icon: 'shield' },
  { id: 'contacts', label: 'Contacts', icon: 'alternate_email' }
]

const mountNav = (props = {}) => mount(AccountSidebar, {
  props: { modelValue: 'overview', sections: SECTIONS, name: 'Dias Metano', username: 'dias', email: 'dias@mytech.co.mz', ...props },
  global: { plugins: [[Quasar, {}]] },
  attachTo: document.body
})

beforeEach(() => { screen.lt.md = false })

describe('AccountSidebar - wide screens', () => {
  it('shows the identity card and a vertical menu of every section', () => {
    const wrapper = mountNav()

    expect(wrapper.find('[data-test="nav-identity"]').text()).toContain('Dias Metano')
    expect(wrapper.find('[data-test="nav-identity"]').text()).toContain('@dias')
    expect(wrapper.find('[data-test="nav-identity"]').text()).toContain('dias@mytech.co.mz')
    expect(SECTIONS.every(section => wrapper.find(`[data-test="nav-${section.id}"]`).exists())).toBe(true)
    expect(wrapper.find('[data-test="nav-compact"]').exists()).toBe(false)
  })

  it('highlights the current section (also for assistive tech) and switches on click', async () => {
    const wrapper = mountNav({ modelValue: 'security' })

    expect(wrapper.find('[data-test="nav-security"]').attributes('aria-current')).toBe('page')
    expect(wrapper.find('[data-test="nav-profile"]').attributes('aria-current')).toBeUndefined()

    await wrapper.find('[data-test="nav-contacts"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')[0]).toEqual(['contacts'])
  })

  it('flags a section with unsaved changes without relying on colour alone', () => {
    const wrapper = mountNav()

    expect(wrapper.find('[data-test="nav-profile"] [aria-label="Unsaved changes"]').exists()).toBe(true)
  })

  it('falls back to initials when there is no photo, and to the username without a name', () => {
    const wrapper = mountNav({ name: '', username: 'dias' })

    expect(wrapper.find('[data-test="nav-identity"]').text()).toContain('D')
    expect(wrapper.find('[data-test="nav-identity"]').text()).toContain('dias')
  })
})

describe('AccountSidebar - narrow screens', () => {
  it('becomes a scrollable tab strip under a compact identity, never a squeezed sidebar', () => {
    screen.lt.md = true
    const wrapper = mountNav()

    expect(wrapper.find('[data-test="nav-compact"]').exists()).toBe(true)
    expect(wrapper.find('.q-tabs').exists()).toBe(true)
    expect(wrapper.find('[data-test="nav-identity"]').exists()).toBe(false)
    expect(wrapper.findAll('.q-tab')).toHaveLength(SECTIONS.length)
  })

  it('tabs switch section', async () => {
    screen.lt.md = true
    const wrapper = mountNav()

    await wrapper.find('[data-test="nav-security"]').trigger('click')

    expect(wrapper.emitted('update:modelValue')[0]).toEqual(['security'])
  })
})
