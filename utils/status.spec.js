import { describe, it, expect } from 'vitest'
import { statusColor, statusValue, isStatusField } from './status'

describe('statusColor', () => {
  it('active is positive, inactive/deactivated are negative', () => {
    expect(statusColor('active')).toBe('positive')
    expect(statusColor('Active')).toBe('positive')
    for (const s of ['inactive', 'Inactive', 'unactive', 'deactive', 'deactivated', 'disabled']) {
      expect(statusColor(s)).toBe('negative')
    }
  })

  it('other states get their own tones', () => {
    expect(statusColor('pending')).toBe('warning')
    expect(statusColor('In progress')).toBe('warning')
    expect(statusColor('scheduled')).toBe('info')
    expect(statusColor('draft')).toBe('grey')
    expect(statusColor('deceased')).toBe('dark')
    expect(statusColor('cancelled')).toBe('negative')
    expect(statusColor('completed')).toBe('positive')
  })

  it('reads the READ shape and falls back to the label, then grey', () => {
    expect(statusColor({ value: 'active', label: 'Active' })).toBe('positive')
    expect(statusColor({ value: 'X1', label: 'Rejected' })).toBe('negative')
    expect(statusColor('something_else')).toBe('grey')
    expect(statusColor(null)).toBe('grey')
    expect(statusValue({ value: 'paid' })).toBe('paid')
  })
})

describe('isStatusField', () => {
  it('matches status and *_status, not marital_status', () => {
    expect(isStatusField('status')).toBe(true)
    expect(isStatusField('effective_status')).toBe(true)
    expect(isStatusField('marital_status')).toBe(false)
    expect(isStatusField('state')).toBe(false)
    expect(isStatusField('statuses')).toBe(false)
  })
})
