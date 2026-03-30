import { createBaseStore } from './../base/base_store'
import { HTTPAuth, url } from './../boot/api'
import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    data: null,
    access: null,
    refresh: null,
    loading: false
  }),

  getters: {
    username: (state) => state.data?.username || 'Guest'
  },

  actions: {

    async login(payload) {
      this.loading = true

      try {
        const { data } = await HTTPClient.post(
          url({ type: 'u', url: 'api/login/' }),
          payload
        )


        this.access = data.tokens.access
        this.refresh = data.tokens.refresh

        await this.me()

      } finally {
        this.loading = false
      }
    },

    async me() {
      const { data } = await HTTPAuth.get(
        url({ type: 'u', url: 'api/me' })
      )

      this.data = data
    },

    async logout() {
      await HTTPAuth.post(
        url({ type: 'u', url: 'api/logout/' }),
        { refresh: this.refresh }
      )

      this.data = null
      this.access = null
      this.refresh = null
    }
  }
})





// const user = useUserStore()
// const entidade = useEntidadeStore()
// const grupo = useGrupoStore()
// const sucursal = useSucursalStore()

// await user.login()

// const ents = await entidade.getEntidadesByUser(user.data.id)
// await entidade.selectEntidade(ents[0])

// const grupos = await grupo.getGrupos(user.data.id)
// await grupo.selectGrupo(grupos[0])