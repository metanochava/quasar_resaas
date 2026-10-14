import { createBaseStore } from '../base/base_store'

export const useNotificationDeliveryAttemptStore = createBaseStore(
  'notificationDeliveryAttempt',
  {
    app: 'notifications',
    model: 'NotificationDeliveryAttempt', url: 'notifications/delivery-attempts'
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
