import { createBaseStore } from './../base/base_store'
import { HTTPAuth, HTTPClient, url } from './../boot/api'
import { setCssVar, Dark } from "quasar"
import { useSucursalStore} from './SucursalStore'
import { useUserStore} from './UserStore'
import { perfilSplint, tdc } from '../boot/base'
import { getStorage, setStorage } from './../boot/storage'


export const useEntidadeStore = createBaseStore(
  'entidade',
  {
    url: 'ipa/clinica/entidades',
    app: 'django_resaas',
    model: 'Entidade'
  },
  {

    getters: {
  
    },


    state: () => ({
      Theme: {},
      LayoutSettings: {},
      AnimationSettings: {},
      Typography: {},
      Modulos: [],
      Modelos: [],

    }),

    actions: {

      async getSettings() {

        await HTTPClient.get(url({type: "u", url: "api/site", params: {}}) )
        .then(res => {
          this.Theme = res.data.theme
          this.LayoutSettings = res.data.layout_settings
          this.AnimationSettings = res.data.animation_settings
          this.Typography = res.data.typography

          this.row =  res.data.entidade

          const User = useUserStore()

          User.Theme = this.Theme
          User.AnimationSettings = this.AnimationSettings
          User.Typography = this.Typography
          User.LayoutSettings = this.LayoutSettings
          User.setSettings()
        })
        .catch( () => {

        })
      },
       

      async setEntidadeModelos (EntidadeId) {
        const User = useUserStore()
        const Entidade = EntidadeId || this.row?.id
        const res = await HTTPAuth.get(url({ type: 'u', url: 'api/django_resaas/entidades/' + Entidade + '/modelos', params: {} }))
          .then(res => {
            this.Modelos = res.data
          })
        if ( EntidadeId) {
          User.EntidadeModelos = this.Modelos
        }
          return res
      },

      async setEntidadeModulos (EntidadeId) {
        const User = useUserStore()
        const Entidade = EntidadeId || this.row?.id
        if (Entidade !== null) {

          const rsp = await HTTPAuth.get(url({ type: 'u', url: 'api/django_resaas/entidades/' + Entidade + '/modulos/', params: { } }))
            .then(res => {
              this.Modulos = res.data
            })
          if ( EntidadeId) {
            User.Modulos = this.Modulos
            setStorage('l', 'entidadeModulos', JSON.stringify(res.data))
          }
          return rsp
        }
      },


      async getLayoutSettings (entidadeId) {
        let Entidade = entidadeId || this.row?.id
        if (Entidade !== null) {

          const rsp = await HTTPAuth.get(url({ type: 'u', url: 'api/django_resaas/entidades/' + Entidade + '/themeGet/', params: { } }))
            .then(res => {
              setStorage('l', 'EntidadeTheme', JSON.stringify(res.data))
              this.Theme = res.data || {}
            })

          const lay = await HTTPAuth.get(url({ type: 'u', url: 'api/django_resaas/entidades/' + Entidade + '/layoutSettingsGet/', params: { } }))
            .then(res => {
              setStorage('l', 'EntidadeLayoutsettings', JSON.stringify(res.data))
              this.LayoutSettings = res.data || {}

            })

          const tp = await HTTPAuth.get(url({ type: 'u', url: 'api/django_resaas/entidades/' + Entidade + '/typographyGet/', params: { } }))
            .then(res => {
              setStorage('l', 'EntidadeTypography', JSON.stringify(res.data))
              this.Typography = res.data || {}
            })

          const as = await HTTPAuth.get(url({ type: 'u', url: 'api/django_resaas/entidades/' + Entidade + '/animationSettingsGet/', params: { } }))
            .then(res => {
              setStorage('l', 'EntidadeAnimationSettings', JSON.stringify(res.data))
              this.AnimationSettings = res.data || {}
            })

          if( entidadeId ) {
            const User = useUserStore()

            User.Theme = this.Theme
            User.AnimationSettings = this.AnimationSettings
            User.Typography = this.Typography
            User.LayoutSettings = this.LayoutSettings
            User.setSettings()
          }
          return lay
        }
      },
      
      

      async getUserEntidades (UserId) {
        if (!UserId) return
        const rsp = await HTTPAuth.get( url({ type: 'u', url: `api/django_resaas/users/${UserId}/userEntidades/`,params: {}}))
        setStorage('l', 'userEntidades', JSON.stringify(rsp.data))
        this.s = rsp.data
        return rsp
      },

      async getUserEntidades_ (UserId, q) {
        const User = useUserStore()
        if (!UserId) return

        try {
          const res = await HTTPAuth.get(
            url({
              type: 'u',
              url: `api/django_resaas/users/${UserId}/userEntidades/`,
              params: {}
            })
          )

          setStorage('l', 'userEntidades', JSON.stringify(res.data))
          this.s = res.data

          if (res.data.length === 1) {
            this.select_(res.data[0], q)
          } else {
            if (res.data.length === 0) {

              User.redirect = 'welcome'
              return
            }
            const entidades = res.data.map(e => ({
              label: perfilSplint(e.nome),
              value: e
            }))

            q.dialog({
              title: tdc('Seleccione a Entidade'),
              options: {
                type: 'radio',
                model: 'opt1',
                items: entidades
              },
              cancel: true,
              persistent: true
            }).onOk(data => this.select_(data, q))
            .onCancel(() => {

              User.redirect = 'welcome'
            })
          }
        } catch (err) {
          console.error(err)
        }
      },

      async select_ (entidade, q) {
        const User = useUserStore()
        const Sucursal = useSucursalStore()
        this.row = entidade
        User.Entidade = this.row
        await this.getLayoutSettings(entidade.id)
        setStorage('l', 'userEntidade', JSON.stringify(entidade))
        Sucursal.getUserSucursals_(q)
      },

      async select (entidade) {
        const User = useUserStore()
        const Sucursal = useSucursalStore()
        this.row = entidade
        User.Entidade = this.row
        await this.getLayoutSettings(entidade.id)
        setStorage('l', 'userEntidade', JSON.stringify(entidade))
        Sucursal.getUserSucursals()
      },

      async getModulos() {
        const { data } = await HTTPAuth.get(
          url({ type: 'u', url: `api/django_resaas/entidades/${this.Entidade?.id}/resaas_modulos/` })
        )
        this.Modulos = data
      },

      async getModelos() {
        const { data } = await HTTPAuth.get(
          url({ type: 'u', url: `api/django_resaas/entidades/${this.Entidade?.id}/modelos` })
        )
        this.Modelos = data
      }
    }
  }
)
