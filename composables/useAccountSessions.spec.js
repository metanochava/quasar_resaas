import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import { createPinia, setActivePinia } from 'pinia'

import { useAccountSessions } from './useAccountSessions'
import { HTTPAuth } from '../services/api'

let get
let post
let account

const chrome = { id: 'j1', device: 'Chrome · macOS', created_at: '2026-09-20T10:00:00Z', current: true }
const firefox = { id: 'j2', device: 'Firefox · Windows', created_at: '2026-09-19T10:00:00Z', current: false }

beforeEach(() => {
  // url() reads the session store
  setActivePinia(createPinia())
  get = vi.spyOn(HTTPAuth, 'get').mockResolvedValue({ data: { data: [chrome, firefox] } })
  post = vi.spyOn(HTTPAuth, 'post').mockResolvedValue({ data: {} })
  account = useAccountSessions()
})

afterEach(() => vi.restoreAllMocks())

describe('useAccountSessions', () => {
  it('loads the sessions from the account endpoint and separates the other ones', async () => {
    await account.load()

    expect(get.mock.calls[0][0]).toContain('sessions/')
    expect(account.sessions.value).toEqual([chrome, firefox])
    expect(account.others.value).toEqual([firefox])
    expect(account.loading.value).toBe(false)
  })

  it('a failed load leaves nothing stale and reports the failure', async () => {
    get.mockRejectedValue(new Error('500'))

    await account.load()

    expect(account.sessions.value).toEqual([])
    expect(account.failed.value).toBe(true)
  })

  it('ending a session removes it only after the backend accepted', async () => {
    await account.load()

    await account.terminate(firefox)

    expect(post.mock.calls[0][0]).toContain('sessions/j2/terminate/')
    expect(account.sessions.value).toEqual([chrome])
  })

  it('a refused termination keeps the session and rethrows for feedback', async () => {
    await account.load()
    post.mockRejectedValue({ response: { status: 404 } })

    await expect(account.terminate(firefox)).rejects.toMatchObject({ response: { status: 404 } })

    expect(account.sessions.value).toEqual([chrome, firefox])
    expect(account.busy.value.has('j2')).toBe(false)
  })

  it('a session with a request in flight is not ended twice', async () => {
    await account.load()
    let finish
    post.mockReturnValue(new Promise(resolve => { finish = resolve }))

    const first = account.terminate(firefox)
    expect(account.busy.value.has('j2')).toBe(true)
    await account.terminate(firefox)
    finish({ data: {} })
    await first

    expect(post).toHaveBeenCalledTimes(1)
  })

  it('ending all the others keeps only the current session', async () => {
    await account.load()
    post.mockResolvedValue({ data: { count: 1 } })

    const count = await account.terminateOthers()

    expect(post.mock.calls[0][0]).toContain('sessions/terminate_others/')
    expect(count).toBe(1)
    expect(account.sessions.value).toEqual([chrome])
  })

  it('loads the recent activity from its own endpoint', async () => {
    get.mockResolvedValueOnce({ data: { data: [{ type: 'login', at: '2026-09-20T10:00:00Z', device: 'Chrome · macOS' }] } })

    await account.loadActivity()

    expect(get.mock.calls[0][0]).toContain('security/activity/')
    expect(account.activity.value).toHaveLength(1)
  })

  it('stores nothing (it is all read from the backend each time)', async () => {
    localStorage.clear()
    await account.load()
    await account.loadActivity()

    expect(localStorage.length).toBe(0)
  })
})
