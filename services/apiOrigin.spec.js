// The API's origin: process.env.API, or the page's own origin on a site that
// serves the API itself (API_SAME_ORIGIN_HOSTS) - its session cookie is then
// a first-party one.
import { describe, it, expect, afterEach } from 'vitest'
import { apiOrigin, sameOriginHosts } from './apiOrigin'

const original = { API: process.env.API, HOSTS: process.env.API_SAME_ORIGIN_HOSTS }

afterEach(() => {
  process.env.API = original.API
  process.env.API_SAME_ORIGIN_HOSTS = original.HOSTS
})

describe('apiOrigin', () => {
  it('is the configured API by default', () => {
    process.env.API = 'https://app.mytech.co.mz'
    process.env.API_SAME_ORIGIN_HOSTS = ''
    expect(apiOrigin()).toBe('https://app.mytech.co.mz')
  })

  it('is the page\'s origin on a listed host', () => {
    process.env.API = 'https://app.mytech.co.mz'
    process.env.API_SAME_ORIGIN_HOSTS = ` other.example, ${window.location.hostname.toUpperCase()} `
    expect(sameOriginHosts()).toContain(window.location.hostname.toLowerCase())
    expect(apiOrigin()).toBe(window.location.origin)
  })
})
