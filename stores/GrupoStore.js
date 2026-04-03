import { createBaseStore } from './../base/base_store'
import { HTTPAuth, url } from './../boot/api'
import { useUserStore} from './UserStore'



export const useGrupoStore = createBaseStore(
  'grupo',
  {
    url: 'api/django_resaas/grupos',
    app: 'django_resaas',
    model: 'Grupo'
  },

  {
    state: () => ({
      Logeds: [],
      Loged: null,
      Permicoes: new Set()
    }),

    getters: {
      can: (state) => (perm) =>
        state.Permicoes.has(String(perm).toLowerCase())
    },

    actions: {

      async select_ (group) {
        alert()
        this.Loged = group
        setStorage('l', 'userGrupo', JSON.stringify(group))
        this.getPermicoes()
        await this.getMenus()
        this.redirect = 'authwelcome'
      },


      async selectGrupo (grupo) {
        setStorage('l', 'userGrupo', JSON.stringify(grupo))
        this.Loged = grupo
        await this.getPermicoes()
        await this.getMenus()
      },

      async getGrupos () {

        const res = await HTTPAuth.get(
          url({ type: 'u', url: `api/django_resaas/users/${this.data?.id}/userGrupos/`, params: {} })
        )

        setStorage('l', 'userGrupos', JSON.stringify(res.data))
        this.Logeds = res.data

        if (res.data.length === 1) {
          this.select(res.data[0])
        }
        return res
      },

      async getGrupos_ (q) {
        const User = useUserStore()

        const res = await HTTPAuth.get(
          url({ type: 'u', url: `api/django_resaas/users/${User.data?.id}/userGrupos/`, params: {} })
        )
        setStorage('l', 'userGrupos', JSON.stringify(res.data))
        this.Logeds = res.data

        if (res.data.length === 1) {
          this.select_(res.data[0])
        }else{
          if (res.data.length === 0) {
            this.redirect = 'authwelcome'
            return
          }
          const grupos = []
          res.data.forEach(element => {
            grupos.push({ label: this.perfilSplint(element.name), value: element })
          })
          q.dialog({
            title: tdc('Seleccione o Grupo'),
            options: {
              type: 'radio',
              model: 'opt1',
              isValid: val => true,
              items: grupos
            },
            cancel: true,
            persistent: true
          }).onOk(data => {
            this.select_(data)
          }).onCancel(() => {
            this.redirect = 'authwelcome'
          })
        }
        return res
      },


















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