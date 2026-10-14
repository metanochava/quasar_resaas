import { createBaseStore } from '../base/base_store'

export const useNotificationTemplateStore = createBaseStore(
  'notificationTemplate',
  {
    app: 'notifications',
    model: 'NotificationTemplate', url: 'notifications/templates'
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
