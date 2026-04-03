import { createBaseStore } from './../base/base_store'
import { HTTPAuth, url } from './../boot/api'
import { getStorage, setStorage } from './../boot/storage'


export const useSucursalStore = createBaseStore(
  'sucursal',
  {
    url: 'api/django_resaas/sucursais'
  },

  {
    state: () => ({
      LogedSucursals: [],
      LogedSucursal: null,
    }),

    actions: {

      async getUserSucursals_ (q) {
        await HTTPAuth.get(url({ type: 'u', url: 'api/django_resaas/users/' + this.data?.id + '/userSucursals/', params: { } }))
          .then(async res => {
            setStorage('l', 'userSucursals', JSON.stringify(res.data))

            if (res.data.length === 1) {
              this.select_(res.data[0], q)
            } else {
              if (res.data.length === 0) {

                this.redirect = 'authwelcome'
                return
              }
              const sucursals = []
              res.data.forEach(element => {
                sucursals.push({ label: this.perfilSplint(element.nome), value: element })
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

                this.redirect = 'authwelcome'
              })
            }
          }).catch(err => {
            console.log(err)
          })
      },

      select_ (sucursal, q) {
        this.Sucursal = sucursal
        setStorage('l', 'userSucursal', JSON.stringify(sucursal))
        this.getGrupos_(q)
      },

      select (entidade) {
        setStorage('l', 'userEntidade', JSON.stringify(entidade))
        this.Entidade = JSON.parse(getStorage('l', 'userEntidade'))
        this.setEntidadeLayoutSettings()
        this.getSucursals()
        this.setEntidadeModulos()
      },

      select (sucursal) {
        this.Sucursal = sucursal
        setStorage('l', 'userSucursal', JSON.stringify(sucursal))
        this.getGrupos()
      },

      async getUserSucursals() {
        this.spiner = true
        if (getStorage('l', 'userEntidade') !== null) {

          const rsp = await HTTPAuth.get(url({ type: 'u', url: 'api/django_resaas/users/' + this.data?.id + '/userSucursals/', params: { } }))
            .then(res => {
              this.Sucursal = {}
              setStorage('l', 'userSucursal', JSON.stringify({}))
              setStorage('l', 'userSucursals', JSON.stringify(res.data))
              this.Sucursals = res.data
            }).catch(err => {
              console.log(err)
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

