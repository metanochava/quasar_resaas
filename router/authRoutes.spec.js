import { describe, it, expect, vi } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'

vi.mock('../services/translation', () => ({ tdc: text => text }))

import { authRoutes } from './authRoutes'

describe('authRoutes', () => {
  it('sends an old reset link (/resetpassword/...) to the reset page', async () => {
    const router = createRouter({ history: createMemoryHistory(), routes: authRoutes })
    const resolved = router.resolve('/resetpassword/NDg4MGEw/dget7k-5b5565a3?redirect_url=')

    expect(resolved.matched[0].redirect).toBeTypeOf('function')
    const target = router.resolve(resolved.matched[0].redirect(resolved))
    expect(target.name).toBe('resetPasswordConfirm')
    expect(target.params).toEqual({ uidb64: 'NDg4MGEw', token: 'dget7k-5b5565a3' })
    expect(target.path).toBe('/auth/resetpassword/NDg4MGEw/dget7k-5b5565a3')
  })

  it('has no /home any more', () => {
    const router = createRouter({ history: createMemoryHistory(), routes: authRoutes })

    expect(router.hasRoute('home')).toBe(false)
    expect(router.resolve('/home').matched).toEqual([])
  })
})
