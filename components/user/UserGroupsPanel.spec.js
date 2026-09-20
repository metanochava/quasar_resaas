import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { Quasar, Dialog } from 'quasar'
import { createPinia, setActivePinia } from 'pinia'
import { ref, computed } from 'vue'

const alertError = vi.fn()
const alertSuccess = vi.fn()

vi.mock('../../boot/alerts', () => ({
  Alert: (...args) => alertError(...args),
  AlertSuccess: (...args) => alertSuccess(...args)
}))

import UserGroupsPanel from './UserGroupsPanel.vue'
import BtnComponent from '../engine/BtnComponent.vue'
import InputComponent from '../engine/InputComponent.vue'
import CardComponent from '../engine/CardComponent.vue'
import TooltipComponent from '../engine/TooltipComponent.vue'
import { useUserStore } from '../../stores/UserStore'

const nurse = { id: 'g1', name: 'Nurse', state: 'Active' }
const clerk = { id: 'g2', name: 'Clerk', state: 'Active' }

// a hand-made controller with the same shape useUserGroups() returns
function makeController({ assigned = [nurse], available = [nurse, clerk], ...state } = {}) {
  const assignedRef = ref(assigned)

  return {
    assigned: assignedRef,
    available: ref(available),
    count: computed(() => assignedRef.value.length),
    loading: ref(false),
    loadingAvailable: ref(false),
    failed: ref(false),
    availableFailed: ref(false),
    load: vi.fn(),
    loadAvailable: vi.fn(),
    assign: vi.fn(async (group) => { assignedRef.value = [...assignedRef.value, group] }),
    unassign: vi.fn(async (group) => { assignedRef.value = assignedRef.value.filter(g => g.id !== group.id) }),
    isAssigned: (group) => assignedRef.value.some(g => g.id === group.id),
    isBusy: () => false,
    ...state
  }
}

let pinia
let session

// q-dialog teleports its content to <body>: wrapper.find() cannot see it
const inBody = (selector) => document.body.querySelector(selector)
const clickInBody = async (selector) => {
  inBody(selector).click()
  await flushPromises()
}
const confirmButton = (label) =>
  [...document.body.querySelectorAll('.q-dialog .q-btn')].find(button => button.textContent.trim() === label)

const grantAll = () => { session.Permissions = new Set(['list_branchusergroup', 'add_branchusergroup', 'delete_branchusergroup']) }

function mountPanel(props = {}, controller = makeController()) {
  const wrapper = mount(UserGroupsPanel, {
    props: { controller, subjectName: 'Joao Manuel', ...props },
    global: {
      plugins: [[Quasar, { plugins: { Dialog } }], pinia],
      components: { 's-btn': BtnComponent, 's-input': InputComponent, 's-card': CardComponent, 's-tooltip': TooltipComponent }
    },
    attachTo: document.body
  })

  return { wrapper, controller }
}

beforeEach(() => {
  document.body.innerHTML = ''
  pinia = createPinia()
  setActivePinia(pinia)
  session = useUserStore()
  session.Entity = { id: 'e1', name: 'Central Hospital' }
  grantAll()
  alertError.mockReset()
  alertSuccess.mockReset()
})

describe('UserGroupsPanel - states', () => {
  it('lists the assigned profiles inside the current entity', () => {
    const { wrapper } = mountPanel()

    expect(wrapper.text()).toContain('Central Hospital')
    expect(wrapper.findAll('[data-test="profile-row"]')).toHaveLength(1)
    expect(wrapper.text()).toContain('Nurse')
  })

  it('shows the empty state when nothing is assigned', () => {
    const { wrapper } = mountPanel({}, makeController({ assigned: [] }))

    expect(wrapper.find('[data-test="state-empty"]').exists()).toBe(true)
  })

  it('a person without a user account gets an explanation and no assign button', () => {
    const { wrapper } = mountPanel({ hasUser: false })

    expect(wrapper.find('[data-test="state-no-user"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="assign-open"]').exists()).toBe(false)
  })

  it('shows loading and error states, and the error can be retried', async () => {
    const loading = mountPanel({}, makeController({ loading: ref(true) }))
    expect(loading.wrapper.find('[data-test="state-loading"]').exists()).toBe(true)

    const controller = makeController({ failed: ref(true) })
    const { wrapper } = mountPanel({}, controller)
    await wrapper.find('[data-test="retry"]').trigger('click')

    expect(controller.load).toHaveBeenCalled()
  })

  it('without the list permission it says so and never shows profiles', () => {
    session.Permissions = new Set()
    const { wrapper } = mountPanel()

    expect(wrapper.find('[data-test="state-forbidden"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="profile-list"]').exists()).toBe(false)
  })
})

describe('UserGroupsPanel - permission-driven buttons (UX only)', () => {
  it('"Assign profile" and "Remove" appear only with their capability', () => {
    session.Permissions = new Set(['list_branchusergroup'])
    let { wrapper } = mountPanel()
    expect(wrapper.find('[data-test="assign-open"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="profile-remove"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('Nurse')

    session.Permissions = new Set(['list_branchusergroup', 'add_branchusergroup'])
    ;({ wrapper } = mountPanel())
    expect(wrapper.find('[data-test="assign-open"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="profile-remove"]').exists()).toBe(false)

    session.Permissions = new Set(['list_branchusergroup', 'delete_branchusergroup'])
    ;({ wrapper } = mountPanel())
    expect(wrapper.find('[data-test="assign-open"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="profile-remove"]').exists()).toBe(true)
  })
})

describe('UserGroupsPanel - assign modal', () => {
  it('opens in place, loads the entity\'s groups and marks the ones already assigned', async () => {
    const { wrapper, controller } = mountPanel()

    await wrapper.find('[data-test="assign-open"]').trigger('click')
    await flushPromises()

    expect(controller.loadAvailable).toHaveBeenCalled()

    const rows = wrapper.findAllComponents({ name: 'QItem' }).filter(item => item.attributes('data-test') === 'assign-row')
    expect(rows).toHaveLength(2)
    expect(rows[0].text()).toContain('Already assigned')
    expect(rows[0].find('[data-test="assign-btn"]').exists()).toBe(false)
    expect(rows[1].find('[data-test="assign-btn"]').exists()).toBe(true)
  })

  it('assigning calls the controller, confirms, and the list grows', async () => {
    const { wrapper, controller } = mountPanel()

    await wrapper.find('[data-test="assign-open"]').trigger('click')
    await flushPromises()
    await clickInBody('[data-test="assign-btn"]')

    expect(controller.assign).toHaveBeenCalledWith(clerk)
    expect(alertSuccess).toHaveBeenCalledWith('Profile assigned successfully.')
    expect(wrapper.findAll('[data-test="profile-row"]')).toHaveLength(2)
  })

  it('an API error is shown to the user and the list is left alone', async () => {
    const response = { status: 409, data: { detail: 'This profile is already assigned to the user.' } }
    const controller = makeController({ assign: vi.fn().mockRejectedValue({ response }) })
    const { wrapper } = mountPanel({}, controller)

    await wrapper.find('[data-test="assign-open"]').trigger('click')
    await flushPromises()
    await clickInBody('[data-test="assign-btn"]')

    expect(alertError).toHaveBeenCalledWith(response)
    expect(alertSuccess).not.toHaveBeenCalled()
    expect(wrapper.findAll('[data-test="profile-row"]')).toHaveLength(1)
  })

  it('shows an error state when the entity\'s groups cannot be loaded', async () => {
    const { wrapper } = mountPanel({}, makeController({ availableFailed: ref(true) }))

    await wrapper.find('[data-test="assign-open"]').trigger('click')
    await flushPromises()

    expect(inBody('[data-test="assign-error"]')).toBeTruthy()
  })

  it('filters the groups by the search text', async () => {
    const { wrapper } = mountPanel({}, makeController({ assigned: [] }))

    await wrapper.find('[data-test="assign-open"]').trigger('click')
    await flushPromises()
    wrapper.vm.search = 'cler'
    await flushPromises()

    const rows = wrapper.findAllComponents({ name: 'QItem' }).filter(item => item.attributes('data-test') === 'assign-row')
    expect(rows).toHaveLength(1)
    expect(rows[0].text()).toContain('Clerk')
  })
})

describe('UserGroupsPanel - remove', () => {
  it('asks for confirmation naming the profile, the person and the entity, then removes', async () => {
    const { wrapper, controller } = mountPanel()

    await wrapper.find('[data-test="profile-remove"]').trigger('click')
    await flushPromises()

    const dialogText = inBody('.q-dialog').textContent
    expect(dialogText).toContain('"Nurse"')
    expect(dialogText).toContain('Joao Manuel')
    expect(dialogText).toContain('Central Hospital')
    expect(controller.unassign).not.toHaveBeenCalled()

    confirmButton('Remove').click()
    await flushPromises()

    expect(controller.unassign).toHaveBeenCalledWith(nurse)
    expect(alertSuccess).toHaveBeenCalledWith('Profile removed successfully.')
    expect(wrapper.find('[data-test="state-empty"]').exists()).toBe(true)
  })

  it('cancelling the confirmation removes nothing', async () => {
    const { wrapper, controller } = mountPanel()

    await wrapper.find('[data-test="profile-remove"]').trigger('click')
    await flushPromises()
    confirmButton('Cancel').click()
    await flushPromises()

    expect(controller.unassign).not.toHaveBeenCalled()
    expect(wrapper.findAll('[data-test="profile-row"]')).toHaveLength(1)
  })

  it('a failed removal is reported and nothing changes', async () => {
    const response = { status: 400, data: { detail: 'You cannot remove the profile you are currently using.' } }
    const controller = makeController({ unassign: vi.fn().mockRejectedValue({ response }) })

    const { wrapper } = mountPanel({}, controller)
    await wrapper.find('[data-test="profile-remove"]').trigger('click')
    await flushPromises()
    confirmButton('Remove').click()
    await flushPromises()

    expect(alertError).toHaveBeenCalledWith(response)
    expect(wrapper.findAll('[data-test="profile-row"]')).toHaveLength(1)
  })
})

describe('UserGroupsPanel - stays on the page', () => {
  it('assigning and removing never navigate (the panel has no router at all)', async () => {
    const push = vi.fn()
    const wrapper = mount(UserGroupsPanel, {
      props: { controller: makeController(), subjectName: 'Joao' },
      global: {
        plugins: [[Quasar, { plugins: { Dialog } }], pinia],
        components: { 's-btn': BtnComponent, 's-input': InputComponent, 's-card': CardComponent, 's-tooltip': TooltipComponent },
        mocks: { $router: { push } }
      },
      attachTo: document.body
    })

    await wrapper.find('[data-test="assign-open"]').trigger('click')
    await flushPromises()
    await clickInBody('[data-test="assign-btn"]')

    expect(push).not.toHaveBeenCalled()
  })
})
