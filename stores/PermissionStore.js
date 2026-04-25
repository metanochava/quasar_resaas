import { createBaseStore } from '../base/base_store'
import { HTTPAuth, HTTPClient, url } from '../boot/api'
import { useSucursalStore } from './SucursalStore'
import { useUserStore } from './UserStore'
import { perfilSplint, tdc } from '../boot/base'
import { getStorage, setStorage } from '../boot/storage'

export const usePermissionStore = createBaseStore(
  'permission',
  {
    url: 'api/auth/permissions',
    app: 'auth',
    model: 'Permission'
  },
  {
    state: () => ({
      
    }),

    actions: {


    }
  }
)
