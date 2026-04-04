import { createBaseStore } from './../base/base_store'
import { HTTPAuth, url } from './../boot/api'
import { getStorage, setStorage } from './../boot/storage'
import { useUserStore} from './UserStore'
import { useGrupoStore} from './GrupoStore'
import { perfilSplint, tdc } from '../boot/base'


export const useSucursalStore = createBaseStore(
  'sucursal',
  {
    url: 'api/django_resaas/sucursais',
    app: 'django_resaas',
    model: 'Entidade'
  },

  {
    state: () => ({

    }),

    actions: {

      async getUserSucursals_ (q) {
        const User = useUserStore()
        await HTTPAuth.get(url({ type: 'u', url: 'api/django_resaas/users/' + User.data?.id + '/userSucursals/', params: { } }))
          .then(async res => {
            setStorage('l', 'userSucursals', JSON.stringify(res.data))

            if (res.data.length === 1) {
              this.select_(res.data[0], q)
            } else {
              if (res.data.length === 0) {

                User.redirect = 'authwelcome'
                return
              }
              const sucursals = []
              res.data.forEach(element => {
                sucursals.push({ label: perfilSplint(element.nome), value: element })
              })
              q.dialog({
                title: tdc('Seleccione a Sucursal'),
                options: {
                  type: 'radio',
                  model: 'opt1',
                  isValid: val => true,
                  items: sucursals
                },
                cancel: true,
                persistent: true
              }).onOk(data => {
                this.select_(data, q)
              }).onCancel(() => {
                User.redirect = 'authwelcome'
              })
            }
          })
      },

      select_ (sucursal, q) {
        const User = useUserStore()
        let Grupo = useGrupoStore()
        this.row = sucursal
        User.Sucursal = this.row
        setStorage('l', 'userSucursal', JSON.stringify(sucursal))
        Grupo.getGrupos_(q)
      },

      select (sucursal) {
        const User = useUserStore()
        let Grupo = useGrupoStore()
        this.row = sucursal
        User.Sucursal = this.row
        setStorage('l', 'userSucursal', JSON.stringify(sucursal))
        Grupo.getGrupos()
      },

      async getUserSucursals() {
        const User = useUserStore()
        if (getStorage('l', 'userEntidade') !== null) {
          const rsp = await HTTPAuth.get(url({ type: 'u', url: 'api/django_resaas/users/' + User.data?.id + '/userSucursals/', params: { } }))
            .then(res => {
              this.row = {}
              setStorage('l', 'userSucursal', JSON.stringify({}))
              setStorage('l', 'userSucursals', JSON.stringify(res.data))
              this.rows = res.data
              User.Sucursals = this.rows
            })
          return rsp
        }
      },




      // ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
      // ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
      // ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
      // ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

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

