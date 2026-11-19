import { describe, it, expect, afterEach } from 'vitest'
import { registrableDomain, sameSite, cookieSessionPossible, sharesCentralSession } from './sessionSite'

afterEach(() => {
  delete process.env.API
  delete process.env.SSO_URL
  delete process.env.API_SAME_ORIGIN_HOSTS
})

describe('sessionSite', () => {
  it('the registrable domain keeps a country second level (co.mz)', () => {
    expect(registrableDomain('saude.mytech.co.mz')).toBe('mytech.co.mz')
    expect(registrableDomain('app.dev.mytech.co.mz')).toBe('mytech.co.mz')
    expect(registrableDomain('clinicaamal.co.mz')).toBe('clinicaamal.co.mz')
    expect(registrableDomain('cv.metano.cc')).toBe('metano.cc')
    expect(sameSite('saude.mytech.co.mz', 'app.mytech.co.mz')).toBe(true)
    expect(sameSite('clinicaamal.co.mz', 'app.mytech.co.mz')).toBe(false)
  })

  it('a *.mytech.co.mz page shares the API cookie with the central domain', () => {
    process.env.API = 'https://app.mytech.co.mz'
    process.env.SSO_URL = 'https://auth.mytech.co.mz'

    expect(cookieSessionPossible('venda.mytech.co.mz')).toBe(true)
    expect(sharesCentralSession('venda.mytech.co.mz')).toBe(true)
    expect(cookieSessionPossible('docodela.co.mz')).toBe(false)
    expect(sharesCentralSession('docodela.co.mz')).toBe(false)
  })

  it('a site on its own domain proxying the API has its own cookie, not the central one', () => {
    process.env.API = 'https://app.mytech.co.mz'
    process.env.SSO_URL = 'https://auth.mytech.co.mz'
    process.env.API_SAME_ORIGIN_HOSTS = 'clinicaamal.co.mz'
    const realLocation = window.location
    Object.defineProperty(window, 'location', {
      value: { origin: 'https://clinicaamal.co.mz', hostname: 'clinicaamal.co.mz' }, configurable: true,
    })

    expect(cookieSessionPossible()).toBe(true)
    expect(sharesCentralSession()).toBe(false)
    Object.defineProperty(window, 'location', { value: realLocation, configurable: true })
  })
})
