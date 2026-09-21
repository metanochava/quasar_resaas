import { defineStore } from 'pinia'

// The history of what requests told the user (the RESAAS `alerts` and `error`
// contract, see utils/apiContract.js). A toast disappears; this keeps the message
// so the user can read it again from the header Notification (HeaderNotifications).
//
// Client-side only: `read`, `createdAt`, `id` and the request that produced the
// message are the frontend's own metadata - the backend does not send them. It is
// in memory on purpose (messages may carry business data): a reload starts empty.
//
// `sms` and `type` are the fields older callers already used; they are kept.

export const MAX_ALERTS = 200

let counter = 0
const nextId = () => `${Date.now()}-${++counter}`

export const useAlertStore = defineStore('alert', {
  state: () => ({
    data: []
  }),

  getters: {
    unreadCount: (state) => state.data.filter(alert => !alert.read).length,

    // newest first
    newestFirst: (state) => [...state.data].reverse(),

    countByLevel: (state) => state.data.reduce((total, alert) => {
      total[alert.level] = (total[alert.level] || 0) + 1
      return total
    }, {})
  },

  actions: {
    add(alert) {
      const level = alert.level || alert.type || 'info'
      const message = alert.message ?? alert.sms ?? ''

      const item = {
        id: alert.id ?? nextId(),
        level,
        message,
        code: alert.code ?? null,
        details: alert.details ?? null,
        read: alert.read ?? false,
        createdAt: alert.createdAt ?? new Date().toISOString(),
        request: alert.request ?? null,
        // legacy field names
        sms: message,
        type: level
      }

      this.data.push(item)

      if (this.data.length > MAX_ALERTS) {
        this.data.splice(0, this.data.length - MAX_ALERTS)
      }

      return item
    },

    markAsRead(alertOrId) {
      const id = alertOrId?.id ?? alertOrId
      const alert = this.data.find(item => item.id === id)
      if (alert) alert.read = true
    },

    markAllAsRead() {
      this.data.forEach(alert => { alert.read = true })
    },

    remove(alertOrId) {
      const id = alertOrId?.id ?? alertOrId
      this.data = this.data.filter(alert => alert.id !== id)
    },

    clear() {
      this.data = []
    }
  }
})
