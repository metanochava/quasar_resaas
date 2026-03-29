import { createBaseStore } from './../base/base_store'
import { HTTPAuth, url } from './../boot/api'

export const useGrupoStore = createBaseStore(
  'grupo',
  {
    url: 'api/django_resaas/grupos'
  },

  {
    state: () => ({
      Permicoes: new Set()
    }),

    getters: {
      can: (state) => (perm) =>
        state.Permicoes.has(String(perm).toLowerCase())
    },

    actions: {

      async getByUser(userId) {
        await this.loadData({
          url: `api/django_resaas/users/${userId}/userGrupos/`
        })
      },

      async select(grupo) {
        this.linha = grupo
        await this.getPermicoes()
      },

      async getPermicoes() {
        const { data } = await HTTPAuth.get(
          url({ type: 'u', url: `api/django_resaas/users/${this.linha?.id}/userPermicoes/` })
        )

        this.Permicoes = new Set(
          (data || []).map(p => p.codename?.toLowerCase())
        )
      }
    }
  }
)