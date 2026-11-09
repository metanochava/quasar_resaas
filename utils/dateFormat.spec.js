import { describe, it, expect } from 'vitest'
import {
  dateOrder, datePattern, isoToDisplay, displayToIso,
  isoDateTimeToDisplay, displayToIsoDateTime, splitIsoDateTime, dateLocale,
} from './dateFormat'

describe('dateFormat - shown in the language order, stored as ISO', () => {
  it('pt-pt is day first, en-us month first, unknown languages day first', () => {
    expect(dateOrder('pt-pt')).toBe('dmy')
    expect(dateOrder('EN-US')).toBe('mdy')
    expect(dateOrder('')).toBe('dmy')
    expect(datePattern('mdy')).toBe('MM/DD/YYYY')
  })

  it('ISO -> what is shown', () => {
    expect(isoToDisplay('2026-11-09', 'dmy')).toBe('09/11/2026')
    expect(isoToDisplay('2026-11-09', 'mdy')).toBe('11/09/2026')
    expect(isoToDisplay('2026-11-09T10:00:00Z', 'dmy')).toBe('09/11/2026')
    expect(isoToDisplay(null)).toBe('')
  })

  it('what is typed -> ISO, always "YYYY-MM-DD" whatever the language', () => {
    expect(displayToIso('09/11/2026', 'dmy')).toBe('2026-11-09')
    expect(displayToIso('11/09/2026', 'mdy')).toBe('2026-11-09')
  })

  it('incomplete or impossible dates are no date', () => {
    expect(displayToIso('09/11/20', 'dmy')).toBeNull()
    expect(displayToIso('31/02/2026', 'dmy')).toBeNull()
    expect(displayToIso('13/01/2026', 'mdy')).toBeNull()
  })

  it('date and time: 24h, stored as "YYYY-MM-DD HH:mm:ss"', () => {
    expect(isoDateTimeToDisplay('2026-11-09 14:30:00', 'dmy')).toBe('09/11/2026 14:30')
    expect(isoDateTimeToDisplay('2026-11-09T14:30:00Z', 'mdy')).toBe('11/09/2026 14:30')
    expect(displayToIsoDateTime('09/11/2026 14:30', 'dmy')).toBe('2026-11-09 14:30:00')
    expect(displayToIsoDateTime('11/09/2026 14:30', 'mdy')).toBe('2026-11-09 14:30:00')
    expect(displayToIsoDateTime('09/11/2026 25:00', 'dmy')).toBeNull()
    expect(splitIsoDateTime('2026-11-09 08:05:00')).toEqual({ date: '2026-11-09', time: '08:05' })
  })

  it('the calendar speaks Portuguese in pt-pt and starts on Monday', () => {
    expect(dateLocale('pt-pt').months[10]).toBe('Novembro')
    expect(dateLocale('pt-pt').firstDayOfWeek).toBe(1)
    expect(dateLocale('en-us')).toBeUndefined()
  })
})
