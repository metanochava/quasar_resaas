import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { Quasar, Dialog } from 'quasar'
import { createPinia, setActivePinia } from 'pinia'

const alertError = vi.fn()
const alertSuccess = vi.fn()

vi.mock('../../boot/alerts', () => ({
  Alert: (...args) => alertError(...args),
  AlertSuccess: (...args) => alertSuccess(...args)
}))

import UserSecurityPanel from './UserSecurityPanel.vue'
import BtnComponent from '../engine/BtnComponent.vue'
import CardComponent from '../engine/CardComponent.vue'
import TooltipComponent from '../engine/TooltipComponent.vue'
import ModalCard from '../engine/ModalCard.vue'
import { useUserAdminStore } from '../../stores/UserAdminStore'
import { useUserStore } from '../../stores/UserStore'

const SECRET = 'R7@mK9#pQ2xL'

let admin
let session
let pinia

const temporary = { state: 'temporary', must_change_password: true, expires_at: '2026-09-22T15:30:00Z', can_reveal: true }
const permanent = { state: 'permanent', must_change_password: false, expires_at: null, can_reveal: false }
const expired = { state: 'expired', must_change_password: true, expires_at: '2026-09-20T10:00:00Z', can_reveal: false }

const inBody = (selector) => document.body.querySelector(selector)

function mountPanel(props = {}) {
  return mount(UserSecurityPanel, {
    props: { userId: 'u1', username: 'joao.manuel', ...props },
    global: {
      plugins: [[Quasar, { plugins: { Dialog } }], pinia],
      components: { 's-btn': BtnComponent, 's-card': CardComponent, 's-tooltip': TooltipComponent, 's-modal-card': ModalCard }
    },
    attachTo: document.body
  })
}

beforeEach(() => {
  document.body.innerHTML = ''
  pinia = createPinia()
  setActivePinia(pinia)
  admin = useUserAdminStore()
  session = useUserStore()
  session.data = { id: 'admin-1' }
  session.Permissions = new Set(['view_temporary_password', 'regenerate_temporary_password'])

  vi.spyOn(admin, 'fetchPasswordSecurity').mockResolvedValue(temporary)
  vi.spyOn(admin, 'viewTemporaryPassword').mockResolvedValue({ password: SECRET, ...temporary })
  vi.spyOn(admin, 'regenerateTemporaryPassword').mockResolvedValue(temporary)

  Object.defineProperty(navigator, 'clipboard', { value: { writeText: vi.fn().mockResolvedValue() }, configurable: true })
  alertError.mockReset()
  alertSuccess.mockReset()
})

describe('UserSecurityPanel - state', () => {
  it('shows a masked password, the state and the expiry - never the password itself', async () => {
    const wrapper = mountPanel()
    await flushPromises()

    expect(wrapper.text()).toContain('••••••••••••')
    expect(wrapper.find('[data-test="security-state"]').text()).toBe('Temporary password')
    expect(wrapper.find('[data-test="security-expires"]').exists()).toBe(true)
    expect(wrapper.text()).not.toContain(SECRET)
    expect(admin.viewTemporaryPassword).not.toHaveBeenCalled()
  })

  it('a password chosen by the user has no view action, only an explanation', async () => {
    admin.fetchPasswordSecurity.mockResolvedValue(permanent)
    const wrapper = mountPanel()
    await flushPromises()

    expect(wrapper.find('[data-test="security-state"]').text()).toBe('Password set by the user')
    expect(wrapper.find('[data-test="security-view"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="security-copy"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('cannot be viewed')
    expect(wrapper.find('[data-test="security-expires"]').exists()).toBe(false)
  })

  it('an expired password is announced and cannot be viewed - only regenerated', async () => {
    admin.fetchPasswordSecurity.mockResolvedValue(expired)
    const wrapper = mountPanel()
    await flushPromises()

    expect(wrapper.find('[data-test="security-state"]').text()).toBe('Temporary password expired')
    expect(wrapper.find('[data-test="security-view"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="security-regenerate"]').exists()).toBe(true)
  })

  it('shows an error with retry when the details cannot be loaded', async () => {
    admin.fetchPasswordSecurity.mockRejectedValueOnce(new Error('403'))
    const wrapper = mountPanel()
    await flushPromises()

    expect(wrapper.find('[data-test="security-error"]').exists()).toBe(true)

    await wrapper.find('[data-test="security-error"] button').trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-test="security-state"]').exists()).toBe(true)
  })
})

describe('UserSecurityPanel - permission-driven buttons (UX only)', () => {
  it('View/Copy need view_temporary_password; Generate needs regenerate_temporary_password', async () => {
    session.Permissions = new Set()
    let wrapper = mountPanel()
    await flushPromises()
    expect(wrapper.find('[data-test="security-view"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="security-copy"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="security-regenerate"]').exists()).toBe(false)

    session.Permissions = new Set(['view_temporary_password'])
    wrapper = mountPanel()
    await flushPromises()
    expect(wrapper.find('[data-test="security-view"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="security-regenerate"]').exists()).toBe(false)

    session.Permissions = new Set(['regenerate_temporary_password'])
    wrapper = mountPanel()
    await flushPromises()
    expect(wrapper.find('[data-test="security-view"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="security-regenerate"]').exists()).toBe(true)
  })

  it('you cannot regenerate your own password from here', async () => {
    const wrapper = mountPanel({ userId: 'admin-1' })
    await flushPromises()

    expect(wrapper.find('[data-test="security-regenerate"]').exists()).toBe(false)
  })
})

describe('UserSecurityPanel - viewing', () => {
  it('View asks the backend explicitly and shows the password only in the dialog', async () => {
    const wrapper = mountPanel()
    await flushPromises()

    expect(admin.viewTemporaryPassword).not.toHaveBeenCalled()
    await wrapper.find('[data-test="security-view"]').trigger('click')
    await flushPromises()

    expect(admin.viewTemporaryPassword).toHaveBeenCalledWith('u1')
    expect(inBody('[data-test="revealed-password"]').textContent).toBe(SECRET)
    expect(inBody('[data-test="modal-card"]').textContent).toContain('This is a sensitive credential.')
    // never on the page itself, never in the store
    expect(wrapper.text()).not.toContain(SECRET)
    expect(JSON.stringify(admin.$state)).not.toContain(SECRET)
    expect(JSON.stringify(session.$state)).not.toContain(SECRET)
  })

  it('closing the dialog wipes the password', async () => {
    const wrapper = mountPanel()
    await flushPromises()
    await wrapper.find('[data-test="security-view"]').trigger('click')
    await flushPromises()

    inBody('[data-test="reveal-close"]').click()
    await flushPromises()
    await new Promise(resolve => setTimeout(resolve, 400))

    expect(wrapper.vm.revealed).toBe('')
    expect(document.body.textContent).not.toContain(SECRET)
  })

  it('Copy in the dialog puts the password on the clipboard', async () => {
    const wrapper = mountPanel()
    await flushPromises()
    await wrapper.find('[data-test="security-view"]').trigger('click')
    await flushPromises()

    inBody('[data-test="reveal-copy"]').click()
    await flushPromises()

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(SECRET)
    expect(alertSuccess).toHaveBeenCalledWith('Password copied.')
  })

  it('Copy on the card is also an explicit, audited request and copies without showing', async () => {
    const wrapper = mountPanel()
    await flushPromises()

    await wrapper.find('[data-test="security-copy"]').trigger('click')
    await flushPromises()

    expect(admin.viewTemporaryPassword).toHaveBeenCalledTimes(1)
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(SECRET)
    expect(inBody('[data-test="revealed-password"]')).toBeNull()
  })

  it('a refusal (no permission / expired / other entity) is shown and reveals nothing', async () => {
    const response = { status: 403, data: { detail: 'Permission denied' } }
    admin.viewTemporaryPassword.mockRejectedValue({ response })
    const wrapper = mountPanel()
    await flushPromises()

    await wrapper.find('[data-test="security-view"]').trigger('click')
    await flushPromises()

    expect(alertError).toHaveBeenCalledWith(response)
    expect(inBody('[data-test="revealed-password"]')).toBeNull()
    // the state is refreshed (e.g. it expired meanwhile)
    expect(admin.fetchPasswordSecurity).toHaveBeenCalledTimes(2)
  })
})

describe('UserSecurityPanel - regenerate', () => {
  it('confirms, regenerates, then shows the new password through the audited view', async () => {
    const wrapper = mountPanel()
    await flushPromises()

    await wrapper.find('[data-test="security-regenerate"]').trigger('click')
    await flushPromises()
    expect(admin.regenerateTemporaryPassword).not.toHaveBeenCalled()

    ;[...document.body.querySelectorAll('.q-dialog .q-btn')].find(button => button.textContent.trim() === 'Generate').click()
    await flushPromises()

    expect(admin.regenerateTemporaryPassword).toHaveBeenCalledWith('u1')
    expect(admin.viewTemporaryPassword).toHaveBeenCalledWith('u1')
    expect(alertSuccess).toHaveBeenCalledWith('A new temporary password was generated.')
    expect(inBody('[data-test="revealed-password"]').textContent).toBe(SECRET)
  })

  it('cancelling the confirmation changes nothing', async () => {
    const wrapper = mountPanel()
    await flushPromises()

    await wrapper.find('[data-test="security-regenerate"]').trigger('click')
    await flushPromises()
    ;[...document.body.querySelectorAll('.q-dialog .q-btn')].find(button => button.textContent.trim() === 'Cancel').click()
    await flushPromises()

    expect(admin.regenerateTemporaryPassword).not.toHaveBeenCalled()
  })

  it('an error is reported and nothing is shown', async () => {
    const response = { status: 403, data: { detail: 'Permission denied' } }
    admin.regenerateTemporaryPassword.mockRejectedValue({ response })
    const wrapper = mountPanel()
    await flushPromises()

    await wrapper.find('[data-test="security-regenerate"]').trigger('click')
    await flushPromises()
    ;[...document.body.querySelectorAll('.q-dialog .q-btn')].find(button => button.textContent.trim() === 'Generate').click()
    await flushPromises()

    expect(alertError).toHaveBeenCalledWith(response)
    expect(admin.viewTemporaryPassword).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// state x permission matrix
// ---------------------------------------------------------------------------
const VIEW = 'view_temporary_password'
const REGENERATE = 'regenerate_temporary_password'

const MATRIX = [
  // state, permissions, [view, copy, regenerate]
  ['temporary', temporary, [VIEW, REGENERATE], [true, true, true]],
  ['temporary', temporary, [VIEW], [true, true, false]],
  ['temporary', temporary, [REGENERATE], [false, false, true]],
  ['temporary', temporary, [], [false, false, false]],
  ['expired', expired, [VIEW, REGENERATE], [false, false, true]],
  ['expired', expired, [VIEW], [false, false, false]],
  ['expired', expired, [], [false, false, false]],
  ['permanent', permanent, [VIEW, REGENERATE], [false, false, true]],
  ['permanent', permanent, [], [false, false, false]]
]

describe('UserSecurityPanel - which actions each password state offers', () => {
  it.each(MATRIX)('%s with %j offers view/copy/regenerate = %j', async (_state, details, permissions, expected) => {
    admin.fetchPasswordSecurity.mockResolvedValue(details)
    session.Permissions = new Set(permissions)

    const wrapper = mountPanel()
    await flushPromises()

    const offered = ['security-view', 'security-copy', 'security-regenerate'].map(id => wrapper.find(`[data-test="${id}"]`).exists())
    expect(offered).toEqual(expected)
  })

  it('an expired password says so and never offers to reveal the old one', async () => {
    admin.fetchPasswordSecurity.mockResolvedValue(expired)
    const wrapper = mountPanel()
    await flushPromises()

    expect(wrapper.text()).toContain('Temporary password expired')
    expect(admin.viewTemporaryPassword).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// the secret never leaves the dialog
// ---------------------------------------------------------------------------
describe('UserSecurityPanel - the revealed password stays ephemeral', () => {
  const everywhere = () => JSON.stringify({
    local: { ...localStorage },
    session: { ...sessionStorage },
    cookie: document.cookie,
    url: window.location.href
  })

  it('is written to no storage, cookie or URL, and no Pinia store', async () => {
    const wrapper = mountPanel()
    await flushPromises()
    await wrapper.find('[data-test="security-view"]').trigger('click')
    await flushPromises()

    expect(inBody('[data-test="revealed-password"]').textContent).toBe(SECRET)
    expect(everywhere()).not.toContain(SECRET)

    for (const store of Object.values(pinia.state.value)) {
      expect(JSON.stringify(store)).not.toContain(SECRET)
    }
  })

  it('is not logged to the console', async () => {
    const spies = ['log', 'info', 'debug', 'warn', 'error'].map(level => vi.spyOn(console, level).mockImplementation(() => {}))

    const wrapper = mountPanel()
    await flushPromises()
    await wrapper.find('[data-test="security-view"]').trigger('click')
    await flushPromises()
    inBody('[data-test="reveal-copy"]').click()
    await flushPromises()

    for (const spy of spies) {
      expect(JSON.stringify(spy.mock.calls)).not.toContain(SECRET)
    }
  })

  it('the copy confirmation never contains the password', async () => {
    const wrapper = mountPanel()
    await flushPromises()
    await wrapper.find('[data-test="security-copy"]').trigger('click')
    await flushPromises()

    expect(alertSuccess).toHaveBeenCalledWith('Password copied.')
    expect(JSON.stringify(alertSuccess.mock.calls)).not.toContain(SECRET)
  })

  it('is wiped when the component goes away', async () => {
    const wrapper = mountPanel()
    await flushPromises()
    await wrapper.find('[data-test="security-view"]').trigger('click')
    await flushPromises()
    expect(wrapper.vm.revealed).toBe(SECRET)

    const vm = wrapper.vm
    wrapper.unmount()

    expect(vm.revealed).toBe('')
  })
})

// ---------------------------------------------------------------------------
// errors and stale state
// ---------------------------------------------------------------------------
describe('UserSecurityPanel - failures', () => {
  it.each([400, 401, 403, 404, 409, 410])('a %s while viewing is shown and the state is reloaded', async (status) => {
    const response = { status, data: { detail: 'nope' } }
    admin.viewTemporaryPassword.mockRejectedValue({ response })
    const wrapper = mountPanel()
    await flushPromises()

    await wrapper.find('[data-test="security-view"]').trigger('click')
    await flushPromises()

    expect(alertError).toHaveBeenCalledWith(response)
    expect(inBody('[data-test="revealed-password"]')).toBeNull()
    expect(admin.fetchPasswordSecurity).toHaveBeenCalledTimes(2)
  })

  it('a failed regeneration reloads the state too', async () => {
    admin.regenerateTemporaryPassword.mockRejectedValue({ response: { status: 404, data: {} } })
    const wrapper = mountPanel()
    await flushPromises()

    await wrapper.find('[data-test="security-regenerate"]').trigger('click')
    await flushPromises()
    ;[...document.body.querySelectorAll('.q-dialog .q-btn')].find(button => button.textContent.trim() === 'Generate').click()
    await flushPromises()

    expect(admin.fetchPasswordSecurity).toHaveBeenCalledTimes(2)
  })

  it('the buttons are disabled while a request is in flight', async () => {
    let finish
    admin.viewTemporaryPassword.mockReturnValue(new Promise(resolve => { finish = resolve }))
    const wrapper = mountPanel()
    await flushPromises()

    await wrapper.find('[data-test="security-view"]').trigger('click')

    expect(wrapper.find('[data-test="security-copy"]').attributes('disabled')).toBeDefined()
    expect(wrapper.find('[data-test="security-regenerate"]').attributes('disabled')).toBeDefined()

    finish({ password: SECRET, ...temporary })
    await flushPromises()
  })
})

// ---------------------------------------------------------------------------
// two-factor block (prepared - renders only when the backend reports it)
// ---------------------------------------------------------------------------
describe('UserSecurityPanel - two-factor block', () => {
  it('is absent while the backend reports no two-factor data', async () => {
    const wrapper = mountPanel()
    await flushPromises()

    expect(wrapper.find('[data-test="two-factor"]').exists()).toBe(false)
  })

  it('shows the organisation policy and the account state as two separate things', async () => {
    admin.fetchPasswordSecurity.mockResolvedValue({ ...permanent, two_factor: { policy: 'required', state: 'not_configured' } })
    const wrapper = mountPanel()
    await flushPromises()

    expect(wrapper.find('[data-test="two-factor-policy"]').text()).toBe('Required')
    expect(wrapper.find('[data-test="two-factor-state"]').text()).toBe('Not configured')
  })
})
