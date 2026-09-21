import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { useAlertStore, MAX_ALERTS } from './AlertStore'

let Alerts

beforeEach(() => {
  setActivePinia(createPinia())
  Alerts = useAlertStore()
})

describe('AlertStore - the history behind the header Notification', () => {
  it('adds an alert as unread with a client-side id and time', () => {
    const item = Alerts.add({ level: 'warning', message: 'No profile.', code: 'employee_without_profile' })

    expect(item).toMatchObject({ level: 'warning', message: 'No profile.', code: 'employee_without_profile', read: false })
    expect(item.id).toBeTruthy()
    expect(new Date(item.createdAt).getTime()).not.toBeNaN()
    expect(Alerts.unreadCount).toBe(1)
  })

  it('keeps the fields older callers read (sms / type)', () => {
    const item = Alerts.add({ sms: 'Old style', type: 'success' })

    expect(item).toMatchObject({ message: 'Old style', level: 'success', sms: 'Old style', type: 'success' })
  })

  it('markAsRead / markAllAsRead lower the unread count', () => {
    const first = Alerts.add({ level: 'info', message: 'a' })
    Alerts.add({ level: 'info', message: 'b' })
    Alerts.add({ level: 'info', message: 'c' })

    Alerts.markAsRead(first)
    expect(Alerts.unreadCount).toBe(2)

    Alerts.markAllAsRead()
    expect(Alerts.unreadCount).toBe(0)
    expect(Alerts.data).toHaveLength(3)
  })

  it('markAsRead accepts an id too', () => {
    const item = Alerts.add({ level: 'info', message: 'a' })
    Alerts.markAsRead(item.id)

    expect(Alerts.unreadCount).toBe(0)
  })

  it('remove takes an item or an id; clear empties', () => {
    const a = Alerts.add({ level: 'info', message: 'a' })
    const b = Alerts.add({ level: 'info', message: 'b' })
    Alerts.add({ level: 'info', message: 'c' })

    Alerts.remove(a)
    Alerts.remove(b.id)
    expect(Alerts.data.map(alert => alert.message)).toEqual(['c'])

    Alerts.clear()
    expect(Alerts.data).toEqual([])
  })

  it('lists newest first and counts by level', () => {
    Alerts.add({ level: 'error', message: 'first' })
    Alerts.add({ level: 'warning', message: 'second' })
    Alerts.add({ level: 'error', message: 'third' })

    expect(Alerts.newestFirst.map(alert => alert.message)).toEqual(['third', 'second', 'first'])
    expect(Alerts.countByLevel).toEqual({ error: 2, warning: 1 })
  })

  it('never grows without bound', () => {
    for (let i = 0; i < MAX_ALERTS + 25; i++) Alerts.add({ level: 'info', message: `m${i}` })

    expect(Alerts.data).toHaveLength(MAX_ALERTS)
    expect(Alerts.data[0].message).toBe('m25')
  })

  it('is memory only: nothing is written to storage', () => {
    Alerts.add({ level: 'error', message: 'Employee Ana Costa has a debt' })

    expect(JSON.stringify({ ...localStorage })).not.toContain('Ana Costa')
    expect(JSON.stringify({ ...sessionStorage })).not.toContain('Ana Costa')
  })
})
