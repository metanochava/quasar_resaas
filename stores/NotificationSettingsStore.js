import { createBaseStore } from '../base/base_store'

export const useNotificationSettingsStore = createBaseStore(
  'notificationSettings',
  {
    app: 'notifications',
    model: 'NotificationSettings', url: 'notifications/settings'
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
