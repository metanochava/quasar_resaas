import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const post = vi.fn()

vi.mock('../services/api', async (importOriginal) => ({
  ...(await importOriginal()),
  HTTPClient: { post: (...args) => post(...args) }
}))

import { useUserStore } from './UserStore'

let User

beforeEach(() => {
  setActivePinia(createPinia())
  User = useUserStore()
  User.access = ''
  vi.spyOn(User, 'me').mockResolvedValue({})
  post.mockReset()
})

describe('UserStore - first login with a temporary password', () => {
  it('starts NO session: it asks for a definitive password instead', async () => {
    post.mockResolvedValue({ data: { must_change_password: true, tokens: null, username: 'joao' } })

    await User.login({ identifier: 'joao', password: 'Temp-1234' })

    expect(User.loginMsg).toBe('must_change')
    expect(User.access).toBe('')
    expect(User.isLogin).toBeFalsy()
    expect(User.me).not.toHaveBeenCalled()
  })

  it('changing it sends the temporary and the new password and starts the session', async () => {
    post.mockResolvedValue({
      data: { id: 'u1', username: 'joao', must_change_password: false, tokens: { access: 'A', refresh: 'R' } }
    })

    await User.changeTemporaryPassword({ identifier: 'joao', password: 'Temp-1234', newPassword: 'My-own-Password-1' })

    const [target, body] = post.mock.calls[0]
    expect(target).toContain('password/change/temporary/')
    expect(body).toEqual({ identifier: 'joao', password: 'Temp-1234', new_password: 'My-own-Password-1' })
    expect(User.access).toBe('A')
    expect(User.isLogin).toBe(true)
    expect(User.loginMsg).toBe('good')
    expect(User.me).toHaveBeenCalled()
  })

  it('a failed change starts no session and rethrows for feedback', async () => {
    post.mockRejectedValue({ response: { status: 401 } })

    await expect(
      User.changeTemporaryPassword({ identifier: 'joao', password: 'wrong', newPassword: 'My-own-Password-1' })
    ).rejects.toMatchObject({ response: { status: 401 } })

    expect(User.access).toBe('')
    expect(User.loading).toBe(false)
  })

  it('an expired temporary password shows the backend message; other errors stay generic', async () => {
    post.mockRejectedValueOnce({ response: { status: 401, data: { code: 'temporary_password_expired', detail: 'The temporary password has expired.' } } })
    await User.login({ identifier: 'joao', password: 'old' })
    expect(User.loginMsg).toBe('error')
    expect(User.loginDetail).toBe('The temporary password has expired.')

    post.mockRejectedValueOnce({ response: { status: 401, data: { detail: 'Invalid credentials' } } })
    await User.login({ identifier: 'joao', password: 'bad' })
    expect(User.loginMsg).toBe('error')
    expect(User.loginDetail).toBe('')
  })

  it('a normal login is unchanged', async () => {
    post.mockResolvedValue({ data: { id: 'u1', must_change_password: false, tokens: { access: 'A', refresh: 'R' } } })

    await User.login({ identifier: 'ana', password: 'Permanent-1' })

    expect(User.access).toBe('A')
    expect(User.loginMsg).toBe('good')
  })
})

describe('UserStore - passwords are never persisted', () => {
  const SESSION = { id: 'u1', email: 'joao@example.com', must_change_password: false, tokens: { access: 'A', refresh: 'R' } }

  const storedEverywhere = () => JSON.stringify({ local: { ...localStorage }, session: { ...sessionStorage }, cookie: document.cookie })

  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it.each([true, false])('a login (keep signed in = %s) writes no password and no username key', async (keep) => {
    User.manterLogado = keep
    post.mockResolvedValue({ data: { ...SESSION, password: 'must-never-be-stored' } })

    await User.login({ identifier: 'joao', password: 'Permanent-Pass-1' })

    expect(localStorage.getItem('password')).toBeNull()
    expect(localStorage.getItem('username')).toBeNull()
    expect(storedEverywhere()).not.toContain('Permanent-Pass-1')
    expect(storedEverywhere()).not.toContain('must-never-be-stored')
    // "keep me signed in" is the token pair
    expect(localStorage.getItem('access')).toBe('A')
    expect(localStorage.getItem('refresh')).toBe('R')
  })

  it('the temporary password and the new one are never stored while changing it', async () => {
    post.mockResolvedValue({ data: SESSION })

    await User.changeTemporaryPassword({ identifier: 'joao', password: 'Temp-Pass-1234', newPassword: 'My-own-Password-1' })

    const stored = storedEverywhere()
    expect(stored).not.toContain('Temp-Pass-1234')
    expect(stored).not.toContain('My-own-Password-1')
  })

  it('a temporary-password login writes nothing at all (no session exists yet)', async () => {
    post.mockResolvedValue({ data: { must_change_password: true, tokens: null } })

    await User.login({ identifier: 'joao', password: 'Temp-Pass-1234' })

    expect(localStorage.length).toBe(0)
    expect(sessionStorage.length).toBe(0)
  })

  it('leftovers written by older versions are removed on the next login', async () => {
    localStorage.setItem('password', 'old-plaintext')
    localStorage.setItem('username', 'joao@example.com')
    post.mockResolvedValue({ data: SESSION })

    await User.login({ identifier: 'joao', password: 'Permanent-Pass-1' })

    expect(localStorage.getItem('password')).toBeNull()
    expect(localStorage.getItem('username')).toBeNull()
  })

  it('setStorage is never asked to persist a password key', async () => {
    const storage = await import('../services/storage')
    const setStorage = vi.spyOn(storage, 'setStorage')
    post.mockResolvedValue({ data: { ...SESSION, password: 'x' } })

    await User.login({ identifier: 'joao', password: 'Permanent-Pass-1' })
    await User.changeTemporaryPassword({ identifier: 'joao', password: 'a', newPassword: 'My-own-Password-1' })

    expect(setStorage.mock.calls.map(call => call[1])).not.toContain('password')
    expect(setStorage.mock.calls.map(call => call[1])).not.toContain('username')
  })

  it('the session only starts after the mandatory change', async () => {
    post.mockResolvedValueOnce({ data: { must_change_password: true, tokens: null } })
    await User.login({ identifier: 'joao', password: 'Temp-Pass-1234' })
    expect(User.isLogin).toBeFalsy()
    expect(localStorage.getItem('access')).toBeNull()

    post.mockResolvedValueOnce({ data: SESSION })
    await User.changeTemporaryPassword({ identifier: 'joao', password: 'Temp-Pass-1234', newPassword: 'My-own-Password-1' })
    expect(User.isLogin).toBe(true)
    expect(localStorage.getItem('access')).toBe('A')
  })
})
