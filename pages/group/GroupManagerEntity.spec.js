import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { Quasar } from 'quasar'
import { createPinia, setActivePinia } from 'pinia'

const get = vi.fn()
vi.mock('../../services/api', () => ({
  HTTPAuth: { get: (...args) => get(...args) },
  url: ({ url }) => url
}))

import GroupManagerEntity from './GroupManagerEntity.vue'
import { useEntityStore } from '../../stores/EntityStore'
import { useEntityTypeStore } from '../../stores/EntityTypeStore'
import { useGroupStore } from '../../stores/GroupStore'

// the dialog's body is rendered while open; the editor is a stub that shows its props
const stubs = {
  'q-dialog': { props: ['modelValue'], template: '<div v-if="modelValue" data-test="dialog"><slot /></div>' },
  's-modal-card': { template: '<div><slot /><slot name="bar-actions" /></div>' },
  's-btn': { template: '<button data-test="open-permissions" @click="$attrs.onClick"></button>', inheritAttrs: false },
  PermissionManager: { name: 'PermissionManager', props: ['AllPermissions', 'GroupPermissionsRe', 'Group'], template: '<div data-test="editor" />' },
  's-input': true,
  's-tooltip': true
}

let Group

beforeEach(() => {
  setActivePinia(createPinia())
  get.mockReset()

  const Entity = useEntityStore()
  Entity.row = { id: 'e1', name: 'Clinic', entity_type: { id: 't1' } }
  Entity.form = Entity.row
  Entity.loadGroups = vi.fn()
  Entity.groups = [{ id: 'g1', name: 'Doctor' }]
  Entity.selectedGroups = [{ id: 'g1', name: 'Doctor' }]
  Entity.groupFilter = 'all'
  useEntityTypeStore().loadGroups = vi.fn()

  Group = useGroupStore()
  Group.init = vi.fn().mockResolvedValue()
  Group.getById = vi.fn().mockImplementation(async (id) => { Group.row = { id, name: 'Doctor', editable: true } })
})

const mountManager = () => mount(GroupManagerEntity, {
  props: { entityId: 'e1' },
  global: { plugins: [[Quasar, {}]], stubs }
})

describe('GroupManagerEntity - permissions of a profile', () => {
  it('opens with the permissions the profile already has (not an empty set)', async () => {
    const own = [{ id: 7, codename: 'view_paciente', name: 'Can view paciente' }]
    get.mockImplementation(async (path) => path === 'auth/groups/g1/permissions/'
      ? { data: own }
      : { data: [{ id: 7 }, { id: 8 }] })

    const w = mountManager()
    await w.find('[data-test="open-permissions"]').trigger('click')
    await flushPromises()

    expect(get).toHaveBeenCalledWith('auth/groups/g1/permissions/')
    const editor = w.findComponent({ name: 'PermissionManager' })
    expect(editor.props('GroupPermissionsRe')).toEqual(own)
    expect(editor.props('AllPermissions')).toEqual([{ id: 7 }, { id: 8 }])
  })

  it('closes the editor when the permissions cannot be loaded, so a save cannot wipe them', async () => {
    get.mockImplementation(async (path) => {
      if (path === 'auth/groups/g1/permissions/') throw new Error('403')
      return { data: [] }
    })

    const w = mountManager()
    await w.find('[data-test="open-permissions"]').trigger('click')
    await flushPromises()

    expect(w.find('[data-test="dialog"]').exists()).toBe(false)
  })
})
