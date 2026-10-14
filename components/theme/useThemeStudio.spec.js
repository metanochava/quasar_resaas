import { describe, it, expect, vi, beforeEach } from 'vitest'
import { nextTick } from 'vue'

const post = vi.fn()
const patch = vi.fn()
vi.mock('../../services/api', () => ({
  HTTPAuth: { post: (...args) => post(...args), patch: (...args) => patch(...args) },
  url: ({ url }) => url,
}))
vi.mock('../../services/translation', () => ({ tdc: text => text }))
vi.mock('quasar', () => ({ Notify: { create: vi.fn() } }))

const { useThemeStudio } = await import('./useThemeStudio.js')

const TEMPLATE = { id: 't1', name: 'Ocean', primary: '#1E3A8A', owner_scope: 'template' }
const MINE = { id: 'u-theme', name: 'Mine', primary: '#0E7C86', owner_scope: 'user', owner_user: 'u1' }
const ENTITY_THEME = { id: 'e-theme', name: 'Clinic', owner_scope: 'entity', owner_entity: 'e1' }

function studio (scope, extra = {}) {
  const emit = vi.fn()
  const props = {
    scope,
    entityType: { id: 'et1', name: 'Saude' },
    entity: { id: 'e1', name: 'Amal' },
    user: { id: 'u1', username: 'ana' },
    themes: [TEMPLATE, MINE, ENTITY_THEME],
    layouts: [], typographies: [], animations: [],
    ...extra,
  }
  return { api: useThemeStudio(props, emit), emit }
}

beforeEach(() => { post.mockReset(); patch.mockReset() })

describe('useThemeStudio - the level is fixed and described', () => {
  it('describes each level in its own words', () => {
    expect(studio('entity_type').api.scopeDescription.value).toContain('every Entity of this type')
    expect(studio('entity').api.scopeDescription.value).toContain('this organisation')
    expect(studio('user').api.scopeDescription.value).toContain('only you see it')
  })

  it('splits the themes of this level from the templates', () => {
    const user = studio('user').api
    expect(user.ownThemes.value.map(t => t.id)).toEqual(['u-theme'])
    expect(user.templateThemes.value.map(t => t.id)).toEqual(['t1'])

    const entity = studio('entity').api
    expect(entity.ownThemes.value.map(t => t.id)).toEqual(['e-theme'])
  })
})

describe('useThemeStudio - customize and edit', () => {
  it('customizes a template for this level and applies the copy', async () => {
    const { api, emit } = studio('entity')
    post.mockResolvedValue({ data: { id: 'copy', name: 'Ocean (Amal)', owner_scope: 'entity', owner_entity: 'e1' } })

    api.openCustomize(TEMPLATE)
    expect(api.editor.name).toBe('Ocean (Amal)')
    expect(api.editor.values.primary).toBe('#1E3A8A')
    api.editor.values.primary = '#15803D'
    await api.saveEditor()

    expect(post).toHaveBeenCalledWith('django_resaas/themes/t1/customize/', expect.objectContaining({
      scope: 'entity', target: 'e1', name: 'Ocean (Amal)', values: expect.objectContaining({ primary: '#15803D' }),
    }))
    expect(api.form.theme).toBe('copy')
    expect(api.dirty.value).toBe(false)
    expect(api.ownThemes.value.map(t => t.id)).toContain('copy')
    expect(emit).toHaveBeenCalledWith('saved', expect.anything())
  })

  it('edits a theme of this level in place', async () => {
    const { api } = studio('user')
    patch.mockResolvedValue({ data: { ...MINE, primary: '#000000' } })

    api.openEdit(MINE)
    api.editor.values.primary = '#000000'
    await api.saveEditor()

    expect(patch).toHaveBeenCalledWith('django_resaas/themes/u-theme/', expect.objectContaining({ name: 'Mine', primary: '#000000' }))
    expect(post).not.toHaveBeenCalled()
  })

  it('saves the signed-in user through UserStore.updateProfile', async () => {
    const updateProfile = vi.fn().mockResolvedValue({})
    const { api } = studio('user', { userStore: { updateProfile } })

    api.useTheme(TEMPLATE)
    await nextTick()
    await api.save()

    expect(updateProfile).toHaveBeenCalledWith(expect.objectContaining({ theme: 't1' }))
  })
})
