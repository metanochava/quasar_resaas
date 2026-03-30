import { createBaseStore } from './../base/base_store'
import { HTTPAuth, url } from './../boot/api'

export const useSucursalStore = createBaseStore(
  'sucursal',
  {
    url: 'api/django_resaas/sucursais'
  },

  {
    actions: {
      async getByUser(userId) {
        await this.loadData({
          url: `api/django_resaas/users/${userId}/userSucursals/`
        })
      },

      select(sucursal) {
        this.linha = sucursal
      }
    }
  }
)

