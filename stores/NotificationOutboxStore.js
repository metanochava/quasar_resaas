import { createBaseStore } from '../base/base_store'

export const useNotificationOutboxStore = createBaseStore(
  'notificationOutbox',
  {
    app: 'notifications',
    model: 'NotificationOutbox', url: 'notifications/outbox'
  },
  {
    state: () => ({

    }),

    getters: {

    },

    actions: {

    }
  }
)
