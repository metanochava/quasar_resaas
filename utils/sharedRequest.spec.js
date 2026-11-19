import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { shared, forgetShared } from './sharedRequest'

beforeEach(() => { forgetShared(); vi.useFakeTimers() })
afterEach(() => vi.useRealTimers())

describe('sharedRequest', () => {
  it('callers with the same key while in flight share one request', async () => {
    const fn = vi.fn(async () => 'answer')

    const [a, b] = await Promise.all([shared('k', fn), shared('k', fn)])

    expect(fn).toHaveBeenCalledTimes(1)
    expect([a, b]).toEqual(['answer', 'answer'])
  })

  it('without ttl a later call asks again; with ttl it reuses the answer until it expires', async () => {
    const fn = vi.fn(async () => 'x')

    await shared('once', fn)
    await shared('once', fn)
    expect(fn).toHaveBeenCalledTimes(2)

    await shared('kept', fn, { ttl: 1000 })
    await shared('kept', fn, { ttl: 1000 })
    expect(fn).toHaveBeenCalledTimes(3)

    vi.advanceTimersByTime(1001)
    await shared('kept', fn, { ttl: 1000 })
    expect(fn).toHaveBeenCalledTimes(4)
  })

  it('a failed request is not kept', async () => {
    const fn = vi.fn().mockRejectedValueOnce(new Error('down')).mockResolvedValueOnce('up')

    await expect(shared('f', fn, { ttl: 1000 })).rejects.toThrow('down')
    await expect(shared('f', fn, { ttl: 1000 })).resolves.toBe('up')
  })

  it('forgetShared drops kept answers (by prefix, or all)', async () => {
    const fn = vi.fn(async () => 1)
    await shared('look:1', fn, { ttl: 1000 })
    await shared('other', fn, { ttl: 1000 })

    forgetShared('look:')
    await shared('look:1', fn, { ttl: 1000 })
    await shared('other', fn, { ttl: 1000 })
    expect(fn).toHaveBeenCalledTimes(3)

    forgetShared()
    await shared('other', fn, { ttl: 1000 })
    expect(fn).toHaveBeenCalledTimes(4)
  })
})
