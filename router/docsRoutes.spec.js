import { describe, it, expect, vi, afterEach } from 'vitest'
import { docsRoutes, docsUrl, docsTarget, DEFAULT_DOCS_URL } from './docsRoutes'

afterEach(() => { delete process.env.DOCS_URL })

describe('docsRoutes - the documentation is its own site', () => {
  it('the site address, overridable with DOCS_URL', () => {
    expect(docsUrl()).toBe(DEFAULT_DOCS_URL)
    process.env.DOCS_URL = 'https://docs.example.com/'
    expect(docsUrl('/django-resaas/security/permissions')).toBe('https://docs.example.com/django-resaas/security/permissions')
  })

  it('an old in-app link opens the same page of the site', () => {
    expect(docsTarget({ params: { pathMatch: ['quasar-resaas', 'stores', 'user-context'] } }))
      .toBe(`${DEFAULT_DOCS_URL}quasar-resaas/stores/user-context`)
    expect(docsTarget({ params: {} })).toBe(DEFAULT_DOCS_URL)
  })

  it('the /docs route leaves for the site and renders nothing', () => {
    const realLocation = window.location
    const assign = vi.fn()
    Object.defineProperty(window, 'location', { value: { assign }, configurable: true })

    const result = docsRoutes[0].beforeEnter({ params: { pathMatch: ['django-resaas'] } })

    expect(result).toBe(false)
    expect(assign).toHaveBeenCalledWith(`${DEFAULT_DOCS_URL}django-resaas`)
    Object.defineProperty(window, 'location', { value: realLocation, configurable: true })
  })
})
