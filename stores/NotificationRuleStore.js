import { createBaseStore } from '../base/base_store'

export const useNotificationRuleStore = createBaseStore(
  'notificationRule',
  {
    app: 'notifications',
    model: 'NotificationRule', url: 'notifications/rules'
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
