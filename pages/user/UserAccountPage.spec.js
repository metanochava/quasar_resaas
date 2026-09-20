import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { Quasar, Dialog, QLayout, QPageContainer } from 'quasar'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('../../boot/alerts', () => ({ Alert: vi.fn(), AlertSuccess: vi.fn() }))

import UserAccountPage from './UserAccountPage.vue'
import BtnComponent from '../../components/engine/BtnComponent.vue'
import InputComponent from '../../components/engine/InputComponent.vue'
import CardComponent from '../../components/engine/CardComponent.vue'
import TooltipComponent from '../../components/engine/TooltipComponent.vue'
import { HTTPAuth } from '../../services/api'
import { useUserStore } from '../../stores/UserStore'

let pinia
let User
let replace
let host

const select = { name: 's-select', props: ['modelValue'], template: '<div class="stub-select" />' }

function mountPage({ query = {} } = {}) {
  replace = vi.fn()

  host = mount(
    {
      components: { UserAccountPage, QLayout, QPageContainer },
      template: '<QLayout view="hHh lpR fFf"><QPageContainer><UserAccountPage /></QPageContainer></QLayout>'
    },
    {
      global: {
        plugins: [[Quasar, { plugins: { Dialog } }], pinia],
        components: { 's-btn': BtnComponent, 's-input': InputComponent, 's-card': CardComponent, 's-tooltip': TooltipComponent, 's-select': select },
        config: { globalProperties: { $route: { query, fullPath: '/account', path: '/account', matched: [] }, $router: { replace } } }
      },
      attachTo: document.body
    }
  )

  return host.findComponent(UserAccountPage)
}

afterEach(() => {
  vi.restoreAllMocks()
  host?.unmount()
  document.body.innerHTML = ''
})

beforeEach(() => {
  pinia = createPinia()
  setActivePinia(pinia)
  User = useUserStore()
  User.data = {
    id: 'u1', username: 'dias', email: 'dias@mytech.co.mz', mobile: '+258841234567',
    is_verified_email: true, is_verified_mobile: true
  }
  vi.spyOn(HTTPAuth, 'get').mockResolvedValue({ data: { id: 'p1', name: 'Dias', surname: 'Metano', data: [] } })
  vi.spyOn(HTTPAuth, 'patch').mockResolvedValue({ data: {} })
})

const go = async (page, section) => {
  await page.find(`[data-test="nav-${section}"]`).trigger('click')
  await flushPromises()
}

describe('UserAccountPage - the Account Center', () => {
  it('is a layout: sidebar + the overview first', async () => {
    const page = mountPage()
    await flushPromises()

    expect(page.find('[data-test="account-nav"]').exists()).toBe(true)
    expect(page.find('[data-test="account-overview"]').exists()).toBe(true)
  })

  it('offers exactly the sections the backend can serve (sessions yes, two-factor no)', async () => {
    const page = mountPage()
    await flushPromises()

    const ids = ['overview', 'profile', 'security', 'contacts', 'sessions', 'preferences']
    expect(ids.every(id => page.find(`[data-test="nav-${id}"]`).exists())).toBe(true)
    expect(page.text().toLowerCase()).not.toContain('two-factor')
  })

  it('the sessions section lists the account\'s sessions', async () => {
    HTTPAuth.get.mockResolvedValue({ data: { data: [{ id: 'j1', device: 'Chrome · macOS', created_at: '2026-09-20T10:00:00Z', current: true }] } })
    const page = mountPage()
    await flushPromises()

    await go(page, 'sessions')

    expect(page.find('[data-test="account-sessions"]').exists()).toBe(true)
    expect(page.text()).toContain('Chrome · macOS')
  })

  it('the security section shows when the password was last changed, and recent activity', async () => {
    User.data = { ...User.data, password_changed_at: '2026-09-01T09:00:00Z' }
    const page = mountPage()
    await flushPromises()

    await go(page, 'security')

    expect(page.find('[data-test="password-changed-at"]').exists()).toBe(true)
    expect(page.find('[data-test="security-activity"]').exists()).toBe(true)
  })

  it('navigates between sections', async () => {
    const page = mountPage()
    await flushPromises()

    await go(page, 'security')
    expect(page.find('[data-test="account-security"]').exists()).toBe(true)
    expect(page.find('[data-test="open-password"]').exists()).toBe(true)

    await go(page, 'contacts')
    expect(page.find('[data-test="account-contacts"]').exists()).toBe(true)
    expect(page.find('[data-test="open-email"]').exists()).toBe(true)
    expect(page.find('[data-test="open-phone"]').exists()).toBe(true)

    await go(page, 'preferences')
    expect(page.find('[data-test="account-preferences"]').exists()).toBe(true)
  })

  it('the overview cards lead to their sections', async () => {
    const page = mountPage()
    await flushPromises()

    await page.find('[data-test="card-email"]').trigger('click')
    await flushPromises()

    expect(page.find('[data-test="account-contacts"]').exists()).toBe(true)
  })

  it('opens on the section named in the URL (?section=) and keeps the URL in step', async () => {
    const page = mountPage({ query: { section: 'security' } })
    await flushPromises()

    expect(page.find('[data-test="account-security"]').exists()).toBe(true)

    await go(page, 'contacts')
    expect(replace).toHaveBeenCalledWith({ query: { section: 'contacts' } })
  })

  it('ignores an unknown ?section= value', async () => {
    const page = mountPage({ query: { section: 'nope' } })
    await flushPromises()

    expect(page.find('[data-test="account-overview"]').exists()).toBe(true)
  })

  it('unsaved profile edits survive a trip to another section', async () => {
    const page = mountPage()
    await flushPromises()

    await go(page, 'profile')
    const name = page.find('input[data-test="f-name"]')
    name.element.value = 'Edited'
    await name.trigger('input')

    await go(page, 'security')
    await go(page, 'profile')

    expect(page.find('input[data-test="f-name"]').element.value).toBe('Edited')
  })

  it('flags the profile as unsaved in the navigation, and warns before the tab closes', async () => {
    const page = mountPage()
    await flushPromises()
    await go(page, 'profile')

    const leave = () => {
      const event = new Event('beforeunload', { cancelable: true })
      window.dispatchEvent(event)
      return event.defaultPrevented
    }

    expect(leave()).toBe(false)

    const name = page.find('input[data-test="f-name"]')
    name.element.value = 'Edited'
    await name.trigger('input')
    await flushPromises()

    expect(page.find('[data-test="nav-profile"] [aria-label="Unsaved changes"]').exists()).toBe(true)
    expect(leave()).toBe(true)
  })

  it('stops warning once the page is gone', async () => {
    const page = mountPage()
    await flushPromises()
    await go(page, 'profile')
    const name = page.find('input[data-test="f-name"]')
    name.element.value = 'Edited'
    await name.trigger('input')

    host.unmount()
    host = null

    const event = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(false)
  })
})

describe('UserAccountPage - sensitive data', () => {
  it('nothing sensitive is written to storage just by using the page', async () => {
    const page = mountPage()
    await flushPromises()
    await go(page, 'security')
    await go(page, 'contacts')

    const stored = JSON.stringify({ ...localStorage, ...sessionStorage })
    expect(stored).not.toContain('password')
    expect(stored).not.toContain('otp')
  })
})
