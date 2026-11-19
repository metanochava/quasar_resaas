import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('../services/api', () => ({
  HTTPAuth: { get: vi.fn(), post: vi.fn() },
  HTTPClient: { get: vi.fn(), post: vi.fn() },
  url: ({ url }) => url
}))

const { HTTPAuth } = await import('../services/api')
const { bootSession } = await import('./login_boot')
const { useUserStore } = await import('../stores/UserStore')
const { useEntityStore } = await import('../stores/EntityStore')
const { useBranchStore } = await import('../stores/BranchStore')
const { useGroupStore } = await import('../stores/GroupStore')

const entity = { id: 'e1', name: 'Clinic' }
const branch = { id: 'b1', name: 'Main' }
const group = { id: 'g1', name: 'Doctor', state: 'Active' }
const context = { token: 'ctx-token', expires_in: 3600, context: {} }

let User, Entity, Branch, Group

beforeEach(() => {
  setActivePinia(createPinia())
  localStorage.clear()
  sessionStorage.clear()
  vi.clearAllMocks()
  User = useUserStore()
  User.data = { id: 'u1' }
  Entity = useEntityStore()
  Branch = useBranchStore()
  Group = useGroupStore()
  vi.spyOn(User, 'me').mockResolvedValue({})
  vi.spyOn(Entity, 'getLayoutSettings').mockResolvedValue()
  vi.spyOn(Branch, 'getUserBranchs_').mockResolvedValue()
  vi.spyOn(Group, 'getGroups_').mockResolvedValue()
})

describe('bootSession - the sign-in boot in one request', () => {
  it('everything resolved: context, permissions, menus and tabs from one answer, no step requests', async () => {
    HTTPAuth.post.mockResolvedValueOnce({ data: {
      entities: [entity], entity, branches: [branch], branch, groups: [group], group, context,
      permissions: ['list_branch'], menus: [{ menu: 'Engine' }], mobile_tabs: [{ route: 'list_branch' }]
    } })

    expect(await bootSession()).toBe(true)

    expect(HTTPAuth.post).toHaveBeenCalledTimes(1)
    expect(HTTPAuth.get).not.toHaveBeenCalled()
    expect(User.Entity).toEqual(entity)
    expect(User.Branch).toEqual(branch)
    expect(User.Group).toEqual(group)
    expect(sessionStorage.getItem('resaasContext')).toBe('ctx-token')
    expect(User.can('list_branch')).toBe(true)
    expect(User.Menus).toEqual([{ menu: 'Engine' }])
    expect(User.MobileTabs).toEqual([{ route: 'list_branch' }])
    expect(JSON.parse(localStorage.getItem('userGroups'))).toEqual([group])
    expect(User.redirect).toBe('welcome')
    expect(Branch.getUserBranchs_).not.toHaveBeenCalled()
    expect(Group.getGroups_).not.toHaveBeenCalled()
  })

  it("sends this site's last choices as hints", async () => {
    localStorage.setItem('userEntity', JSON.stringify(entity))
    localStorage.setItem('userBranch', JSON.stringify(branch))
    localStorage.setItem('userGroup', JSON.stringify(group))
    HTTPAuth.post.mockResolvedValueOnce({ data: { entities: [] } })

    await bootSession()

    const [, body] = HTTPAuth.post.mock.calls[0]
    expect(body).toMatchObject({ entity_id: 'e1', branch_id: 'b1', group_id: 'g1' })
  })

  it('a profile to choose: the Group step (its dialog) takes over with the Branch context', async () => {
    HTTPAuth.post.mockResolvedValueOnce({ data: {
      entities: [entity], entity, branches: [branch], branch, groups: [group, { id: 'g2', name: 'Nurse' }], group: null, context
    } })

    expect(await bootSession()).toBe(true)
    expect(User.Branch).toEqual(branch)
    expect(User.Group).toBeNull()
    expect(sessionStorage.getItem('resaasContext')).toBe('ctx-token')
    expect(Group.getGroups_).toHaveBeenCalledTimes(1)
    expect(User.redirect).not.toBe('welcome')
  })

  it('a Branch to choose: the Branch step takes over', async () => {
    HTTPAuth.post.mockResolvedValueOnce({ data: { entities: [entity], entity, branches: [branch, { id: 'b2' }], branch: null, context } })

    expect(await bootSession()).toBe(true)
    expect(Branch.getUserBranchs_).toHaveBeenCalledTimes(1)
  })

  it('no Entity resolved, or the boot failed: false (the step-by-step chain runs)', async () => {
    HTTPAuth.post.mockResolvedValueOnce({ data: { entities: [entity, { id: 'e2' }], entity: null } })
    expect(await bootSession()).toBe(false)

    HTTPAuth.post.mockRejectedValueOnce(new Error('offline'))
    expect(await bootSession()).toBe(false)
  })
})
