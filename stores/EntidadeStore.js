import { createBaseStore } from './../base/base_store'
import { HTTPAuth, HTTPClient, url } from './../boot/api'
import { useSucursalStore } from './SucursalStore'
import { useUserStore } from './UserStore'
import { perfilSplint, tdc } from '../boot/base'
import { getStorage, setStorage } from './../boot/storage'

export const useEntidadeStore = createBaseStore(
  'entidade',
  {
    url: 'api/django_resaas/entidades',
    app: 'django_resaas',
    model: 'Entidade'
  },
  {
    state: () => ({
      Theme: {},
      LayoutSettings: {},
      AnimationSettings: {},
      Typography: {},
      Modulos: [],
      Modelos: [],
      userEntidades: []
    }),

    actions: {

      // ===============================
      // SETTINGS GLOBAIS
      // ===============================
      async getSettings() {
        try {
          const { data } = await HTTPClient.get(url({ type: "u", url: "api/site" }))

          this.Theme = data.theme || {}
          this.LayoutSettings = data.layout_settings || {}
          this.AnimationSettings = data.animation_settings || {}
          this.Typography = data.typography || {}
          this.row = data.entidade || null

          const User = useUserStore()

          Object.assign(User, {
            Theme: this.Theme,
            AnimationSettings: this.AnimationSettings,
            Typography: this.Typography,
            LayoutSettings: this.LayoutSettings
          })

          User.setSettings()

        } catch (e) {
          console.error('getSettings error', e)
        }
      },

      // ===============================
      // MODELOS
      // ===============================
      async setEntidadeModelos(entidadeId) {
        try {
          const id = entidadeId || this.row?.id
          if (!id) return

          const { data } = await HTTPAuth.get(
            url({ type: 'u', url: `api/django_resaas/entidades/${id}/modelos` })
          )

          this.Modelos = data || []

          if (entidadeId) {
            useUserStore().EntidadeModelos = this.Modelos
          }

        } catch (e) {
          console.error('setEntidadeModelos error', e)
        }
      },

      // ===============================
      // MODULOS
      // ===============================
      async setEntidadeModulos(entidadeId) {
        try {
          const id = entidadeId || this.row?.id
          if (!id) return

          const { data } = await HTTPAuth.get(
            url({ type: 'u', url: `api/django_resaas/entidades/${id}/modulos/` })
          )

          this.Modulos = data || []

          if (entidadeId) {
            const User = useUserStore()
            User.Modulos = this.Modulos
            setStorage('l', 'entidadeModulos', JSON.stringify(data))
          }

        } catch (e) {
          console.error('setEntidadeModulos error', e)
        }
      },

      // ===============================
      // LAYOUT / THEME
      // ===============================
      async getLayoutSettings(entidadeId) {
        try {
          const id = entidadeId || this.row?.id
          if (!id) return

          const [theme, layout, typography, animation] = await Promise.all([
            HTTPAuth.get(url({ type: 'u', url: `api/django_resaas/entidades/${id}/themeGet/` })),
            HTTPAuth.get(url({ type: 'u', url: `api/django_resaas/entidades/${id}/layoutSettingsGet/` })),
            HTTPAuth.get(url({ type: 'u', url: `api/django_resaas/entidades/${id}/typographyGet/` })),
            HTTPAuth.get(url({ type: 'u', url: `api/django_resaas/entidades/${id}/animationSettingsGet/` }))
          ])

          this.Theme = theme.data || {}
          this.LayoutSettings = layout.data || {}
          this.Typography = typography.data || {}
          this.AnimationSettings = animation.data || {}

          setStorage('l', 'EntidadeTheme', JSON.stringify(this.Theme))
          setStorage('l', 'EntidadeLayoutsettings', JSON.stringify(this.LayoutSettings))
          setStorage('l', 'EntidadeTypography', JSON.stringify(this.Typography))
          setStorage('l', 'EntidadeAnimationSettings', JSON.stringify(this.AnimationSettings))

          if (entidadeId) {
            const User = useUserStore()

            Object.assign(User, {
              Theme: this.Theme,
              LayoutSettings: this.LayoutSettings,
              Typography: this.Typography,
              AnimationSettings: this.AnimationSettings
            })

            User.setSettings()
          }

        } catch (e) {
          console.error('getLayoutSettings error', e)
        }
      },

      // ===============================
      // USER ENTIDADES
      // ===============================
      async getUserEntidades(userId) {
        if (!userId) return

        try {
          const { data } = await HTTPAuth.get(
            url({ type: 'u', url: `api/django_resaas/users/${userId}/userEntidades/` })
          )

          this.userEntidades = data || []
          setStorage('l', 'userEntidades', JSON.stringify(data))

        } catch (e) {
          console.error('getUserEntidades error', e)
        }
      },

      // ===============================
      // SELECT ENTIDADE
      // ===============================
      async select(entidade) {
        if (!entidade) return

        const User = useUserStore()
        const Sucursal = useSucursalStore()

        this.row = entidade
        User.Entidade = entidade

        setStorage('l', 'userEntidade', JSON.stringify(entidade))

        await this.getLayoutSettings(entidade.id)
        await Sucursal.getUserSucursals()
      },


      // ===============================
      // LOAD DIRETO
      // ===============================
      async getModulos() {
        if (!this.row?.id) return

        const { data } = await HTTPAuth.get(
          url({ type: 'u', url: `api/django_resaas/entidades/${this.row.id}/resaas_modulos/` })
        )

        this.Modulos = data || []
      },

      async getModelos() {
        if (!this.row?.id) return

        const { data } = await HTTPAuth.get(
          url({ type: 'u', url: `api/django_resaas/entidades/${this.row.id}/modelos` })
        )

        this.Modelos = data || []
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


    }
  }
)
