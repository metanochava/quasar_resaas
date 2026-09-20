import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'

import { useUserGroups } from './useUserGroups'
import { useUserAdminStore } from '../stores/UserAdminStore'
import { useUserStore } from '../stores/UserStore'

let admin
let session

const nurse = { id: 'g1', name: 'Nurse', state: 'Active' }
const clerk = { id: 'g2', name: 'Clerk', state: 'Active' }

function flush() {
  return new Promise(resolve => setTimeout(resolve, 0))
}

beforeEach(() => {
  setActivePinia(createPinia())
  admin = useUserAdminStore()
  session = useUserStore()
  session.Entity = { id: 'e1', name: 'Central Hospital' }

  vi.spyOn(admin, 'fetchAssignedGroups').mockResolvedValue([nurse])
  vi.spyOn(admin, 'fetchEntityGroups').mockResolvedValue([nurse, clerk])
  vi.spyOn(admin, 'assignGroup').mockResolvedValue({})
  vi.spyOn(admin, 'unassignGroup').mockResolvedValue()
})

describe('useUserGroups', () => {
  it('loads the user\'s profiles as soon as there is a user, and counts them', async () => {
    const groups = useUserGroups(() => 'u1')
    await flush()

    expect(admin.fetchAssignedGroups).toHaveBeenCalledWith('u1')
    expect(groups.assigned.value).toEqual([nurse])
    expect(groups.count.value).toBe(1)
    expect(groups.loading.value).toBe(false)
  })

  it('a person without a user account loads nothing and never calls the API', async () => {
    const groups = useUserGroups(() => null)
    await flush()

    expect(admin.fetchAssignedGroups).not.toHaveBeenCalled()
    expect(groups.count.value).toBe(0)
  })

  it('does not load when disabled (the session cannot list profiles)', async () => {
    const groups = useUserGroups(() => 'u1', { enabled: () => false })
    await flush()

    expect(admin.fetchAssignedGroups).not.toHaveBeenCalled()
    expect(groups.count.value).toBe(0)
  })

  it('follows the user: another user reloads the list', async () => {
    const userId = ref('u1')
    useUserGroups(() => userId.value)
    await flush()

    userId.value = 'u2'
    await nextTick()
    await flush()

    expect(admin.fetchAssignedGroups).toHaveBeenLastCalledWith('u2')
  })

  it('drops the answer of a load that was overtaken by a newer one', async () => {
    let slow
    admin.fetchAssignedGroups
      .mockReturnValueOnce(new Promise(resolve => { slow = resolve }))
      .mockResolvedValueOnce([clerk])

    const userId = ref('u1')
    const groups = useUserGroups(() => userId.value)

    userId.value = 'u2'
    await nextTick()
    await flush()
    slow([nurse])
    await flush()

    expect(groups.assigned.value).toEqual([clerk])
  })

  it('reports a failed load without leaving stale data', async () => {
    admin.fetchAssignedGroups.mockRejectedValue(new Error('403'))

    const groups = useUserGroups(() => 'u1')
    await flush()

    expect(groups.failed.value).toBe(true)
    expect(groups.assigned.value).toEqual([])
  })

  it('assigning updates the list and the counter without a reload', async () => {
    const groups = useUserGroups(() => 'u1')
    await flush()

    await groups.assign(clerk)

    expect(admin.assignGroup).toHaveBeenCalledWith('u1', 'g2')
    expect(groups.count.value).toBe(2)
    expect(groups.isAssigned(clerk)).toBe(true)
    expect(admin.fetchAssignedGroups).toHaveBeenCalledTimes(1)
  })

  it('removing updates the list and the counter without a reload', async () => {
    const groups = useUserGroups(() => 'u1')
    await flush()

    await groups.unassign(nurse)

    expect(admin.unassignGroup).toHaveBeenCalledWith('u1', 'g1')
    expect(groups.count.value).toBe(0)
  })

  it('a rejected assignment leaves the list untouched and rethrows for feedback', async () => {
    admin.assignGroup.mockRejectedValue({ response: { status: 409 } })
    const groups = useUserGroups(() => 'u1')
    await flush()

    await expect(groups.assign(clerk)).rejects.toMatchObject({ response: { status: 409 } })

    expect(groups.count.value).toBe(1)
    expect(groups.isBusy(clerk)).toBe(false)
  })

  it('a group with a request in flight is not sent twice', async () => {
    let done
    admin.assignGroup.mockReturnValue(new Promise(resolve => { done = resolve }))
    const groups = useUserGroups(() => 'u1')
    await flush()

    const first = groups.assign(clerk)
    expect(groups.isBusy(clerk)).toBe(true)
    await groups.assign(clerk)
    done({})
    await first

    expect(admin.assignGroup).toHaveBeenCalledTimes(1)
  })

  it('loads the groups of the CURRENT entity (session entity id)', async () => {
    const groups = useUserGroups(() => 'u1')
    await groups.loadAvailable()

    expect(admin.fetchEntityGroups).toHaveBeenCalledWith('e1')
    expect(groups.available.value).toEqual([nurse, clerk])
  })
})
