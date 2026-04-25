import { createBaseStore } from './../base/base_store'
import { HTTPAuth, url } from './../boot/api'
import { useUserStore} from './UserStore'
import { getStorage, setStorage } from './../boot/storage'
import { perfilSplint, tdc } from '../boot/base'


export const useGroupStore = createBaseStore(
  'group',
  {
    url: 'api/django_resaas/groups',
    app: 'django_resaas',
    model: 'Group'
  },

  {
    state: () => ({
      Permissions: new Set()
    }),

    getters: {
      
    },

    actions: {

      async getpermissions() {

        const { data } = await HTTPAuth.get(
          url({ type: 'u', url: `api/django_resaas/groups/${this.row?.id}/permissions/` })
        )
        const permissions = (data || []).map(p => p.codename)
        this.permissions = new Set(permissions)
      }
    }
  }
)