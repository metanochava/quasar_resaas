import { createBaseStore } from './../base/base_store'
import { HTTPAuth, url } from './../boot/api'
import { setCssVar, Dark } from "quasar"
import { useSucursalStore} from './SucursalStore'
import { tdc } from '../boot/base'
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
      Logeds: [],
      Loged: null,
      LogedModelos: [],
      LogedModulos: [],
      LogedTheme: {},
      LogedLayoutSettings: {},
      LogedAnimationSettings: {},
      LogedTypography: {},
      LogedModulos: [],
      LogedModelos: [],

    }),

    actions: {

      async getSettings() {

        await HTTPClient.get(url({type: "u", url: "api/site", params: {}}) )
        .then(res => {
          this.LogedTheme = res.data.theme
          this.LogedLayoutSettings = res.data.layout_settings
          this.LogedAnimationSettings = res.data.animation_settings
          this.LogedTypography = res.data.typography

          this.Loged =  { id : res.data.entidade }

          const User = useUserStore()

          User.Theme = this.LogedTheme
          User.AnimationSettings = this.LogedAnimationSettings
          User.Typography = this.LogedTypography
          User.LayoutSettings = this.LogedLayoutSettings

          User.setSettings()
        })
        .catch( () => {

        })
      },
      

      async setEntidadeModelos (EntidadeId) {
        const Entidade = EntidadeId || this.Entidade?.id
        const res = await HTTPAuth.get(url({ type: 'u', url: 'api/django_resaas/entidades/' + Entidade + '/modelos', params: {} }))
          .then(res => {
            this.EntidadeModelos = res.data
          }).catch(err => {
            console.log(err)
          })

          return res
      },

      async setEntidadeModulos () {
        if (getStorage('l', 'userEntidade') !== null) {

          const rsp = await HTTPAuth.get(url({ type: 'u', url: 'api/django_resaas/entidades/' + this.Entidade?.id + '/modulos/', params: { } }))
            .then(res => {
              setStorage('l', 'entidadeModulos', JSON.stringify(res.data))
              this.EntidadeModulos = res.data
            }).catch(err => {
              console.log(err)
            })

          return rsp
        }
      },


      async getLayoutSettings (entidade) {
        let Entidade = entidade || this.row?.id
        if (getStorage('l', 'userEntidade') !== null) {

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

          if( entidade ) {
            const User = useUserStore()

            User.Theme = this.LogedTheme
            User.AnimationSettings = this.LogedAnimationSettings
            User.Typography = this.LogedTypography
            User.LayoutSettings = this.LogedLayoutSettings

            User.setSettings()
          }
          return lay
        }
      },
      
      

      async getUserEntidades (UserId) {
        if (!UserId) return
        const rsp = await HTTPAuth.get( url({ type: 'u', url: `api/django_resaas/users/${UserId}/userEntidades/`,params: {}}))
        setStorage('l', 'userEntidades', JSON.stringify(rsp.data))
        this.Logeds = rsp.data
        return rsp
      },

      async getUserEntidades_ (UserId, q) {
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
          this.Logeds = res.data

          if (res.data.length === 1) {
            this.select_(res.data[0], q)
          } else {
            if (res.data.length === 0) {

              this.redirect = 'welcome'
              return
            }
            const entidades = res.data.map(e => ({
              label: this.perfilSplint(e.nome),
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

              this.redirect = 'welcome'
            })
          }
        } catch (err) {
          console.error(err)
        }
      },

      select_ (entidade, q) {
        const Sucursal = useSucursalStore()
        this.Loged = entidade
        this.getLayoutSettings(entidade.id)
        setStorage('l', 'userEntidade', JSON.stringify(entidade))
        Sucursal.getUserSucursals_(q)
      },

      // ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
      // ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
      // ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
      // ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++




      async getModulos() {
        const { data } = await HTTPAuth.get(
          url({ type: 'u', url: `api/django_resaas/entidades/${this.Entidade?.id}/modulos/` })
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
