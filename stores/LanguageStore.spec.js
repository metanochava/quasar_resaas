import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// LanguageStore.choose(): the user's language pick is applied at once and,
// when signed in, saved as their own language (PATCH users/{id}/); null goes
// back to the Entity's / EntityType's default, re-read through me().
const HTTPAuth = { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() }
const HTTPClient = { get: vi.fn(), post: vi.fn() }

vi.mock('../services/api', () => ({
  HTTPAuth,
  HTTPClient,
  url: ({ url }) => url,
}))

vi.mock('../services/tenantContext', () => ({
  createResaasContext: vi.fn(),
  clearResaasContext: vi.fn(),
  getResaasContext: vi.fn(),
}))

vi.mock('../utils/autoForm', () => ({
  buildFormFromSchema: vi.fn(),
}))

const { useLanguageStore, CHOSEN_KEY } = await import('./LanguageStore')
const { useUserStore } = await import('./UserStore')

const EN = { id: 'en', name: 'English', code: 'en-us' }

beforeEach(() => {
  setActivePinia(createPinia())
  Object.values(HTTPAuth).forEach(fn => fn.mockReset())
  HTTPClient.get.mockReset().mockResolvedValue({ data: {} })
})

describe('LanguageStore.get', () => {
  it('loads the list without making its first row the current language', async () => {
    const Language = useLanguageStore()
    HTTPClient.get.mockResolvedValue({ data: [EN, { id: 'pt', name: 'Português', code: 'pt-pt' }] })

    await Language.get()

    expect(Language.rows).toHaveLength(2)
    expect(Language.current).toEqual({})
  })
})

describe('LanguageStore.choose', () => {
  it('only applies the language before signing in (nothing to save)', async () => {
    const Language = useLanguageStore()

    await Language.choose(EN)

    expect(Language.current).toEqual(EN)
    expect(useUserStore().Language).toEqual(EN)
    expect(HTTPAuth.patch).not.toHaveBeenCalled()
    // remembered as this browser's explicit pick (wins before signing in)
    expect(JSON.parse(localStorage.getItem(CHOSEN_KEY))).toEqual(EN)
  })

  it('saves the pick as the signed-in user\'s own language', async () => {
    const Language = useLanguageStore()
    const User = useUserStore()
    User.data = { id: 'u1' }
    HTTPAuth.patch.mockResolvedValue({ data: { id: 'u1' } })
    HTTPAuth.get.mockResolvedValue({ data: { id: 'u1', language: EN, own_language: 'en' } })

    await Language.choose(EN)

    expect(HTTPAuth.patch).toHaveBeenCalledWith('django_resaas/users/u1/', { language: 'en' })
    expect(HTTPAuth.get).toHaveBeenCalledWith('me/')
    expect(Language.current).toEqual(EN)
  })

  it('null clears the personal language and applies the inherited one from me()', async () => {
    const Language = useLanguageStore()
    const User = useUserStore()
    User.data = { id: 'u1', own_language: 'en' }
    HTTPAuth.patch.mockResolvedValue({ data: { id: 'u1' } })
    const PT = { id: 'pt', name: 'Português', code: 'pt-pt' }
    HTTPAuth.get.mockResolvedValue({ data: { id: 'u1', language: PT, own_language: null } })

    await Language.choose(null)

    expect(HTTPAuth.patch).toHaveBeenCalledWith('django_resaas/users/u1/', { language: null })
    expect(Language.current).toEqual(PT)
    expect(User.data.own_language).toBeNull()
    expect(localStorage.getItem(CHOSEN_KEY)).toBeNull()
  })
})
