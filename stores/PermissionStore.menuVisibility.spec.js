import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

// the Permissions modal shows / hides a module in the edited profile's menu
// (POST auth/groups/{id}/menu_visibility/); the permissions are untouched
const post = vi.fn()
const get = vi.fn()
vi.mock('../services/api', () => ({
  HTTPAuth: { post: (...a) => post(...a), get: (...a) => get(...a) },
  url: ({ url }) => url,
}))

import { usePermissionStore } from './PermissionStore'

const perms = [
  { id: 1, codename: 'list_paciente', app_label: 'saude', content_type: { label: 'Saude | paciente' } },
  { id: 2, codename: 'list_item', app_label: 'inventory', content_type: { label: 'Inventory | item' } },
]

beforeEach(() => {
  setActivePinia(createPinia())
  post.mockReset()
  get.mockReset().mockResolvedValue({ data: { hidden_menu_apps: ['inventory'] } })
})

describe('PermissionStore menu visibility', () => {
  it('reads the hidden modules of the group and the app label of a section', async () => {
    const store = usePermissionStore()
    store.initPermissions(perms, [], { id: 'g1' })
    await store.loadMenuVisibility()

    expect(store.appLabelOf(store.apps.Saude)).toBe('saude')
    expect(store.isMenuVisible('saude')).toBe(true)
    expect(store.isMenuVisible('inventory')).toBe(false)
  })

  it('hides a module and keeps the permissions unchanged', async () => {
    post.mockResolvedValue({ data: { hidden_menu_apps: ['inventory', 'saude'] } })
    const store = usePermissionStore()
    store.initPermissions(perms, [perms[0]], { id: 'g1' })

    await store.setMenuVisible('saude', false)

    expect(post).toHaveBeenCalledWith('auth/groups/g1/menu_visibility/', { app_label: 'saude', visible: false })
    expect(store.isMenuVisible('saude')).toBe(false)
    expect(store.groupPermissions).toEqual([perms[0]])
    expect(store.dirty).toBe(false)
  })
})

describe('PermissionStore menu visibility per permission', () => {
  it('knows which permissions have a menu entry and which are hidden', async () => {
    get.mockResolvedValue({ data: {
      hidden_menu_apps: [],
      hidden_menu_permissions: ['list_item'],
      menu_permissions: ['list_item', 'list_paciente'],
    } })
    const store = usePermissionStore()
    store.initPermissions(perms, [], { id: 'g1' })
    await store.loadMenuVisibility()

    expect(store.hasMenuEntry('list_paciente')).toBe(true)
    expect(store.hasMenuEntry('delete_paciente')).toBe(false)
    expect(store.isPermissionMenuVisible('list_paciente')).toBe(true)
    expect(store.isPermissionMenuVisible('LIST_ITEM')).toBe(false)
  })

  it('hides one permission from the menu and keeps it granted', async () => {
    post.mockResolvedValue({ data: { hidden_menu_apps: [], hidden_menu_permissions: ['list_paciente'] } })
    const store = usePermissionStore()
    store.initPermissions(perms, [perms[0]], { id: 'g1', menu_permissions: ['list_paciente'] })

    await store.setPermissionMenuVisible('list_paciente', false)

    expect(post).toHaveBeenCalledWith('auth/groups/g1/menu_visibility/', { permission: 'list_paciente', visible: false })
    expect(store.isPermissionMenuVisible('list_paciente')).toBe(false)
    expect(store.group.hidden_menu_permissions).toEqual(['list_paciente'])
    expect(store.groupPermissions).toEqual([perms[0]])
    expect(store.dirty).toBe(false)
    expect(store.savingMenuPermission).toBe(null)
  })
})
