import { createBaseStore } from 'src/stores/BaseStore'

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