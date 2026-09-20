import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const post = vi.fn()

vi.mock('../services/api', async (importOriginal) => ({
  ...(await importOriginal()),
  HTTPClient: { post: (...args) => post(...args) }
}))

import { useUserStore } from './UserStore'

let User

const SESSION = { id: 'u1', username: 'ana', must_change_password: false, two_factor: '', challenge: '', tokens: { access: 'A', refresh: 'R' } }
const CHALLENGE = { id: 'u1', username: 'ana', two_factor: 'two_factor_required', challenge: 'signed.challenge', tokens: null }
const SETUP = { ...CHALLENGE, two_factor: 'two_factor_setup_required' }

const storedEverywhere = () => JSON.stringify({ local: { ...localStorage }, session: { ...sessionStorage }, cookie: document.cookie })

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  setActivePinia(createPinia())
  User = useUserStore()
  User.access = ''
  vi.spyOn(User, 'me').mockResolvedValue({})
  post.mockReset()
})

describe('UserStore - sign-in with two-factor', () => {
  it('an active factor withholds the session and opens the code step', async () => {
    post.mockResolvedValue({ data: CHALLENGE })

    await User.login({ identifier: 'ana', password: 'Pass-1234' })

    expect(User.loginMsg).toBe('two_factor')
    expect(User.twoFactorStep).toEqual({ kind: 'code', challenge: 'signed.challenge' })
    expect(User.access).toBe('')
    expect(User.isLogin).toBeFalsy()
    expect(User.me).not.toHaveBeenCalled()
  })

  it('a REQUIRED policy without a factor opens the enrolment step instead', async () => {
    post.mockResolvedValue({ data: SETUP })

    await User.login({ identifier: 'ana', password: 'Pass-1234' })

    expect(User.loginMsg).toBe('two_factor_setup')
    expect(User.twoFactorStep.kind).toBe('setup')
    expect(User.isLogin).toBeFalsy()
  })

  it('a normal sign-in is unchanged', async () => {
    post.mockResolvedValue({ data: SESSION })

    await User.login({ identifier: 'ana', password: 'Pass-1234' })

    expect(User.access).toBe('A')
    expect(User.loginMsg).toBe('good')
    expect(User.twoFactorStep).toBeNull()
  })

  it('the code is sent with the challenge and starts the session', async () => {
    post.mockResolvedValueOnce({ data: CHALLENGE })
    await User.login({ identifier: 'ana', password: 'Pass-1234' })

    post.mockResolvedValueOnce({ data: SESSION })
    await User.verifyTwoFactorLogin('123456')

    const [target, body] = post.mock.calls[1]
    expect(target).toContain('login/two_factor/')
    expect(body).toEqual({ challenge: 'signed.challenge', code: '123456' })
    expect(User.access).toBe('A')
    expect(User.twoFactorStep).toBeNull()
    expect(User.loading).toBe(false)
  })

  it('a wrong code rethrows, starts no session and keeps the step open', async () => {
    post.mockResolvedValueOnce({ data: CHALLENGE })
    await User.login({ identifier: 'ana', password: 'Pass-1234' })

    post.mockRejectedValueOnce({ response: { status: 400, data: { code: 'invalid_code' } } })
    await expect(User.verifyTwoFactorLogin('000000')).rejects.toMatchObject({ response: { status: 400 } })

    expect(User.access).toBe('')
    expect(User.twoFactorStep).not.toBeNull()
    expect(User.loading).toBe(false)
  })

  it('cancelling drops the challenge', async () => {
    post.mockResolvedValue({ data: CHALLENGE })
    await User.login({ identifier: 'ana', password: 'Pass-1234' })

    User.cancelTwoFactorStep()

    expect(User.twoFactorStep).toBeNull()
    expect(User.loginMsg).toBe('')
  })

  it('a temporary-password change still goes through the second factor', async () => {
    post.mockResolvedValue({ data: CHALLENGE })

    await User.changeTemporaryPassword({ identifier: 'ana', password: 'Temp-1', newPassword: 'My-own-Password-1' })

    expect(User.loginMsg).toBe('two_factor')
    expect(User.access).toBe('')
  })

  it('forced enrolment: the QR goes to the caller, the session waits for the recovery codes', async () => {
    post.mockResolvedValueOnce({ data: SETUP })
    await User.login({ identifier: 'ana', password: 'Pass-1234' })

    post.mockResolvedValueOnce({ data: { secret: 'JBSWY3DPEHPK3PXP', qr: 'data:image/png;base64,AAA', otpauth_uri: 'otpauth://totp/x' } })
    const started = await User.setupTwoFactorLogin()
    expect(post.mock.calls[1][0]).toContain('login/two_factor/setup/')
    expect(post.mock.calls[1][1]).toEqual({ challenge: 'signed.challenge' })
    expect(started.secret).toBe('JBSWY3DPEHPK3PXP')

    post.mockResolvedValueOnce({ data: { ...SESSION, recovery_codes: ['AAAAA-BBBBB'] } })
    const confirmed = await User.confirmTwoFactorLogin('123456')

    expect(post.mock.calls[2][0]).toContain('login/two_factor/setup/confirm/')
    expect(confirmed.recovery_codes).toEqual(['AAAAA-BBBBB'])
    expect(confirmed.session.tokens.access).toBe('A')
    expect(confirmed.session.recovery_codes).toBeUndefined()
    // no session yet: it starts after the user has seen the codes
    expect(User.access).toBe('')
    expect(User.isLogin).toBeFalsy()
  })

  it('never keeps the secret, the codes or the challenge in Pinia state or any storage', async () => {
    post.mockResolvedValueOnce({ data: SETUP })
    await User.login({ identifier: 'ana', password: 'Pass-1234' })
    post.mockResolvedValueOnce({ data: { secret: 'JBSWY3DPEHPK3PXP', qr: 'data:image/png;base64,AAA', otpauth_uri: 'otpauth://totp/x' } })
    await User.setupTwoFactorLogin()
    post.mockResolvedValueOnce({ data: { ...SESSION, recovery_codes: ['AAAAA-BBBBB'] } })
    await User.confirmTwoFactorLogin('123456')

    const state = JSON.stringify(User.$state)
    for (const secret of ['JBSWY3DPEHPK3PXP', 'AAAAA-BBBBB', 'data:image/png', 'signed.challenge']) {
      expect(state).not.toContain(secret)
      expect(storedEverywhere()).not.toContain(secret)
    }
  })
})
