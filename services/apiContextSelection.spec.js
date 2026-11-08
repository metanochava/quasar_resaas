import { describe, it, expect, beforeEach, vi } from 'vitest'

// A reload must never send a context token issued for another profile/user
// than the one this tab shows (services/contextExpiry.js contextNeedsReissue).
process.env.API = 'https://api.test'
process.env.API_PREFIX = 'v1'

const session = new Map()

vi.mock('../boot/alerts', () => ({ Alert: () => {} }))
vi.mock('./storage', () => ({
  getStorage: (type, name) => (type === 's' ? session.get(name) ?? null : null),
}))

const user = {
  access: 'access', data: { id: 'u1' },
  Entity: { id: 'e1' }, Branch: { id: 'b1' }, Group: { id: 'g1' },
  hasSession: () => true,
  renewResaasContextQuietly: vi.fn(async () => {
    session.set('resaasContext', 'doctor-token')
    session.set('resaasContextFor', 'u1|e1|b1|g1')
  }),
}

vi.mock('../stores/UserStore', () => ({ useUserStore: () => user }))
vi.mock('../stores/LoadStore', () => ({ useLoadStore: () => ({ inc: () => {}, dec: () => {} }) }))

const created = []
vi.mock('axios', () => ({
  default: {
    create: () => {
      const entry = { request: null }
      const instance = vi.fn()
      instance.interceptors = {
        request: { use: fn => { entry.request = fn } },
        response: { use: () => {} },
      }
      created.push(entry)
      return instance
    },
  },
}))

let sendAuth

beforeEach(async () => {
  vi.resetModules()
  created.length = 0
  session.clear()
  user.renewResaasContextQuietly.mockClear()
  await import('./api')
  sendAuth = config => created[2].request(config) // HTTPAuth
})

describe('HTTPAuth context token vs the selected profile', () => {
  it('re-issues a token issued for another profile before sending', async () => {
    session.set('resaasContext', 'nurse-token')
    session.set('resaasContextFor', 'u1|e1|b1|g0')

    const config = await sendAuth({ url: 'saude/pacientes/' })

    expect(user.renewResaasContextQuietly).toHaveBeenCalledTimes(1)
    expect(config.headers['X-RESAAS-Context']).toBe('doctor-token')
  })

  it('keeps a token issued for the current profile', async () => {
    session.set('resaasContext', 'doctor-token')
    session.set('resaasContextFor', 'u1|e1|b1|g1')

    const config = await sendAuth({ url: 'saude/pacientes/' })

    expect(user.renewResaasContextQuietly).not.toHaveBeenCalled()
    expect(config.headers['X-RESAAS-Context']).toBe('doctor-token')
  })

  it('never re-issues for the context request itself', async () => {
    await sendAuth({ url: 'resaas/context/' })
    expect(user.renewResaasContextQuietly).not.toHaveBeenCalled()
  })
})
