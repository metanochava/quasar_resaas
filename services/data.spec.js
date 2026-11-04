import { describe, it, expect, vi } from 'vitest'

vi.mock('./translation', () => ({ tdc: (t) => (t === 'at' ? 'às' : t) }))

import { ds, isDateLike } from './data'

describe('ds', () => {
  it('keeps the platform format for ISO strings', () => {
    expect(ds('2026-10-11')).toBe('11-10-2026')
    expect(ds('2026-10-11T11:19:42.123+02:00')).toBe('11-10-2026 às 11:19')
    expect(ds('2026-10-11 08:05')).toBe('11-10-2026 às 08:05')
    expect(ds('2026/10/11')).toBe('11-10-2026')
  })

  it('never throws on empty or odd values', () => {
    expect(ds(null)).toBe('')
    expect(ds(undefined)).toBe('')
    expect(ds('')).toBe('')
    expect(ds({})).toBe('')
    expect(ds('abc')).toBe('')
    expect(ds(new Date('invalid'))).toBe('')
  })

  it('formats a Date or a timestamp in local time', () => {
    expect(ds(new Date(2026, 9, 11, 9, 7))).toBe('11-10-2026 às 09:07')
    expect(ds(new Date(2026, 0, 2, 23, 59).getTime())).toBe('02-01-2026 às 23:59')
  })
})

describe('isDateLike', () => {
  it('recognises dates and date-times only', () => {
    expect(isDateLike('2026-10-11')).toBe(true)
    expect(isDateLike('2026-10-11T11:19:00Z')).toBe(true)
    expect(isDateLike('2026-10-11 11:19')).toBe(true)
    expect(isDateLike('2026/10/11')).toBe(true)
    expect(isDateLike('11:19')).toBe(false)
    expect(isDateLike('2026')).toBe(false)
    expect(isDateLike('Active')).toBe(false)
    expect(isDateLike(new Date())).toBe(true)
  })
})
