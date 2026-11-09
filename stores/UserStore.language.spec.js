import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useUserStore } from './UserStore'

// the stored language sets the L header of every request: the initial {} of
// LanguageStore.current must never replace it (it dropped the header after
// every reload until me() put it back)
describe('UserStore.setLanguage', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('stores a language with an id', () => {
    useUserStore().setLanguage({ id: 'pt', code: 'pt-pt' })
    expect(JSON.parse(localStorage.getItem('userLang')).id).toBe('pt')
  })

  it('ignores a language without id and keeps the stored one', () => {
    const User = useUserStore()
    User.setLanguage({ id: 'pt', code: 'pt-pt' })

    User.setLanguage({})
    User.setLanguage(null)

    expect(JSON.parse(localStorage.getItem('userLang')).id).toBe('pt')
  })
})
