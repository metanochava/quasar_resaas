import { createBaseStore } from '../base/base_store'

export const useNotificationProviderCredentialStore = createBaseStore(
  'notificationProviderCredential',
  {
    app: 'notifications',
    model: 'NotificationProviderCredential', url: 'notifications/provider-credentials'
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
