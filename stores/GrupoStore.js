import { createBaseStore } from './../base/base_store'
import { HTTPAuth, url } from './../boot/api'
import { useUserStore} from './UserStore'
import { getStorage, setStorage } from './../boot/storage'
import { perfilSplint, tdc } from '../boot/base'


export const useGrupoStore = createBaseStore(
  'grupo',
  {
    url: 'api/django_resaas/grupos',
    app: 'django_resaas',
    model: 'Grupo'
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

      async select_ (group) {
        const User = useUserStore()
        this.row = group
        User.Grupo = this.row
        setStorage('l', 'userGrupo', JSON.stringify(group))
        await this.getPermicoes()
        await User.getMenus()
        User.redirect = 'authwelcome'
      },


      async select (grupo) {
        const User = useUserStore()
        setStorage('l', 'userGrupo', JSON.stringify(grupo))
        this.row = grupo
        User.Grupo = this.row
        await this.getPermicoes()
        await User.getMenus()
      },

      async getGrupos () {
        const User = useUserStore()
        const res = await HTTPAuth.get(
          url({ type: 'u', url: `api/django_resaas/users/${User.data?.id}/userGrupos/`, params: {} })
        )

        setStorage('l', 'userGrupos', JSON.stringify(res.data))
        this.rows = res.data
        User = this.rows

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
        this.rows = res.data
        User.Grupos = this.rows

        if (res.data.length === 1) {
          this.select_(res.data[0])
        }else{
          if (res.data.length === 0) {
            User.redirect = 'authwelcome'
            return
          }
          const grupos = []
          res.data.forEach(element => {
            grupos.push({ label: perfilSplint(element.name), value: element })
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
            User.redirect = 'authwelcome'
          })
        }
        return res
      },
      
      async getPermicoes() {
        const User = useUserStore()
        const { data } = await HTTPAuth.get(
          url({ type: 'u', url: `api/django_resaas/users/${User.data?.id}/userPermicoes/` })
        )

        const rowPermicoes = new Set(
          (data || []).map(p => p.codename)
        )
        User.Permicoes = rowPermicoes

        setStorage('l', 'userPermicoes', JSON.stringify(User.Permicoes))
      }

      
    }
  }
)