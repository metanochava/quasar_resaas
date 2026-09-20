import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { useContactOtp } from './useContactOtp'
import { HTTPAuth } from '../services/api'
import { useUserStore } from '../stores/UserStore'

let flow
let post
let User

beforeEach(() => {
  setActivePinia(createPinia())
  User = useUserStore()
  User.data = { id: 'u1', email: 'old@example.com', mobile: '+258841234567' }
  post = vi.spyOn(HTTPAuth, 'post').mockResolvedValue({ data: {} })
  flow = useContactOtp()
})

describe('useContactOtp', () => {
  it('requests a code for the NEW value and waits for it', async () => {
    const sent = await flow.request('email', 'new@example.com')

    expect(sent).toBe(true)
    const [target, body] = post.mock.calls[0]
    expect(target).toContain('profile/contact/otp/request/')
    expect(body).toEqual({ channel: 'email', identifier: 'new@example.com' })
    expect(flow.status.value).toBe('sent')
    expect(flow.active.value).toBe(true)
  })

  it('passes through sending -> sent and marks a resend', async () => {
    let finish
    post.mockReturnValueOnce(new Promise(resolve => { finish = resolve }))

    const pending = flow.request('email', 'new@example.com')
    expect(flow.status.value).toBe('sending')
    expect(flow.busy.value).toBe(true)
    finish({ data: {} })
    await pending

    post.mockReturnValueOnce(new Promise(resolve => { finish = resolve }))
    const again = flow.request('email', 'new@example.com', { resend: true })
    expect(flow.status.value).toBe('resending')
    finish({ data: {} })
    await again
    expect(flow.status.value).toBe('sent')
  })

  it('a refused request keeps nothing pending', async () => {
    post.mockRejectedValueOnce({ response: { status: 400 } })

    expect(await flow.request('email', 'taken@example.com')).toBe(false)
    expect(flow.status.value).toBe('idle')
  })

  it('nothing changes locally until the backend confirms the code', async () => {
    await flow.request('email', 'new@example.com')
    expect(User.data.email).toBe('old@example.com')

    post.mockResolvedValueOnce({ data: { id: 'u1', email: 'new@example.com', is_verified_email: true } })
    const applied = await flow.confirm('123456')

    expect(applied).toBe('email')
    expect(post.mock.calls.at(-1)[1]).toEqual({ channel: 'email', identifier: 'new@example.com', otp: '123456' })
    expect(User.data.email).toBe('new@example.com')
    expect(flow.status.value).toBe('success')
    // the code is gone as soon as the flow ends
    expect(flow.otp.value).toBe('')
  })

  it('a wrong or expired code changes nothing and clears the code', async () => {
    await flow.request('mobile', '+258849999999')
    flow.otp.value = '000000'
    post.mockRejectedValueOnce({ response: { status: 400 } })

    expect(await flow.confirm()).toBe(false)

    expect(flow.status.value).toBe('invalid')
    expect(flow.otp.value).toBe('')
    expect(User.data.mobile).toBe('+258841234567')
  })

  it('needs a complete 6-digit code', async () => {
    await flow.request('email', 'new@example.com')
    post.mockClear()

    expect(await flow.confirm('123')).toBe(false)
    expect(post).not.toHaveBeenCalled()
  })

  it('reset forgets the code, the value and the channel', async () => {
    await flow.request('email', 'new@example.com')
    flow.otp.value = '123456'

    flow.reset()

    expect(flow.status.value).toBe('idle')
    expect(flow.otp.value).toBe('')
    expect(flow.identifier.value).toBe('')
  })

  it('the code is never written to storage', async () => {
    await flow.request('email', 'new@example.com')
    post.mockResolvedValueOnce({ data: { id: 'u1', email: 'new@example.com' } })
    await flow.confirm('987654')

    expect(JSON.stringify({ ...localStorage, ...sessionStorage })).not.toContain('987654')
  })
})
