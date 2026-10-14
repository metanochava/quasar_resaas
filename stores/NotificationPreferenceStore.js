import { createBaseStore } from '../base/base_store'

export const useNotificationPreferenceStore = createBaseStore(
  'notificationPreference',
  {
    app: 'notifications',
    model: 'NotificationPreference', url: 'notifications/preferences'
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
