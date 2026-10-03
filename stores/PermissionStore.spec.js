import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const post = vi.fn().mockResolvedValue({ data: {} })
vi.mock('../services/api', () => ({
  HTTPAuth: { post: (...args) => post(...args) },
  HTTPClient: {},
  url: ({ url }) => url
}))

import { usePermissionStore } from './PermissionStore'

const p = (id) => ({ id, codename: `perm_${id}`, content_type: { label: 'App | Model' } })

let Permission

beforeEach(() => {
  setActivePinia(createPinia())
  post.mockClear()
  Permission = usePermissionStore()
})

describe('PermissionStore.saveGroupPermissions - only the changes', () => {
  it('sends what was ticked as add and what was unticked as remove', async () => {
    Permission.initPermissions([p(1), p(2), p(3)], [p(1), p(2)], { id: 'g1' })
    Permission.toggle(p(2))
    Permission.toggle(p(3))

    await Permission.saveGroupPermissions()

    expect(post).toHaveBeenCalledWith('auth/permissions/setGroupPermissions/', { group: 'g1', add: [3], remove: [2] })
    expect(Permission.originalGroupPermissions.map(x => x.id)).toEqual([1, 3])
  })

  it('an editor that started empty only adds - it never sends the group\'s other permissions to remove', async () => {
    Permission.initPermissions([p(1), p(2)], [], { id: 'g1' })
    Permission.toggle(p(1))

    await Permission.saveGroupPermissions()

    expect(post).toHaveBeenCalledWith('auth/permissions/setGroupPermissions/', { group: 'g1', add: [1], remove: [] })
  })

  it('nothing changed: nothing is sent', async () => {
    Permission.initPermissions([p(1)], [p(1)], { id: 'g1' })

    expect(await Permission.saveGroupPermissions()).toBe(true)
    expect(post).not.toHaveBeenCalled()
  })
})
