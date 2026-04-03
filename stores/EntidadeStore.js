import { createBaseStore } from './../base/base_store'
import { HTTPAuth, url } from './../boot/api'
import { setCssVar, Dark } from "quasar"
import { useSucursalStore} from './SucursalStore'
import { useTipoEntidadeStore } from  './TipoEntidadeStore'
import { tdc } from '../boot/base'






export const useEntidadeStore = createBaseStore(
  'entidade',
  { url: 'api/django_resaas/entidades' },

  {

    getters: {
  
      ps: (state) => ({
        'theme': state.Theme,
        'layout': state.LayoutSettings,
        'animation': state.AnimationSettings,
        'typography': state.Typography,
      }),
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

      normalizeTheme(theme = {}) {

        const ignore = [
          'id',
          'created_at',
          'updated_at',
          'deleted_at',
          'estado',
          'nome',
          'created_by',
          'updated_by'
        ]

        const cleanTheme = {}

        Object.entries(theme).forEach(([key, value]) => {

          if (
            !ignore.includes(key) &&
            typeof value === 'string' &&
            value.trim() !== ''
          ) {
            cleanTheme[key] = value
          }

        })

        return cleanTheme
      },
      async getSettings() {

        await HTTPClient.get(url({type: "u", url: "api/site", params: {}}) )
        .then(res => {
          this.Theme = res.data.theme
          this.LayoutSettings = res.data.layout_settings
          this.AnimationSettings = res.data.animation_settings
          this.Typography = res.data.typography

          this.Entidade =  { id : res.data.entidade }

          this.setSettings()
        })
        .catch( () => {

        })
      },
      setSettings(){
        console.log(this.LayoutSettings)

        /* =========================
          🌙 DARK MODE
        ========================= */

        Dark.set(!!this.LayoutSettings.dark_mode)

        /* =========================
          🎨 CORES (QUASAR)
        ========================= */

        const theme = this.normalizeTheme(this.Theme)

        Object.entries(theme).forEach(([key, value]) => {
          setCssVar(key, value)
        })

        /* =========================
          🎨 CSS VARIABLES (GLOBAL SYSTEM)
        ========================= */

        const root = document.documentElement

        // 👉 BORDER RADIUS (🔥 AQUI ESTÁ O QUE FALTAVA)
        let radius = "4px"

        console.log(this.LayoutSettings.border_radius)
        console.log(this.LayoutSettings.square)

        if (this.LayoutSettings.border_radius) {
          radius = this.LayoutSettings.border_radius
        }

        if (this.LayoutSettings.rounded) {
          radius = "16px"
        }

        if (this.LayoutSettings.square) {
          radius = "0px"
        }

        root.style.setProperty("--s-radius", radius)

        // 👉 INPUT COLORS
        root.style.setProperty("--input-bg", this.Theme.input_background || "#f6d7d7ff")
        root.style.setProperty("--input-border", this.Theme.input_border || "#ccc")
        root.style.setProperty("--input-focus", this.Theme.input_focus || "#1976D2")

        // 👉 BUTTON COLORS
        root.style.setProperty("--btn-primary", this.Theme.button_primary)
        root.style.setProperty("--btn-primary-text", this.Theme.button_primary_text)

        // 👉 TEXT
        root.style.setProperty("--text-primary", this.Theme.text_primary)
        root.style.setProperty("--text-secondary", this.Theme.text_secondary)

        /* =========================
          🧱 BACKGROUND GLOBAL
        ========================= */

        document.body.style.background =
          Dark.isActive
            ? (this.Theme.background_dark || this.Theme.background || '')
            : (this.Theme.background || this.Theme.background_dark || '')

        /* =========================
          🔤 TIPOGRAFIA
        ========================= */

        const font = this.Typography.font_family || "Roboto"

        let link = document.getElementById("dynamic-theme-font")

        const fontHref =
          `https://fonts.googleapis.com/css2?family=${font.replace(/ /g, "+")}:wght@300;400;500;700&display=swap`

        if (!link) {
          link = document.createElement("link")
          link.id = "dynamic-theme-font"
          link.rel = "stylesheet"
          document.head.appendChild(link)
        }

        if (link.href !== fontHref) {
          link.href = fontHref
        }

        document.body.style.fontFamily = font

        if (this.Typography.font_size_base) {
          document.body.style.fontSize = `${this.Typography.font_size_base}px`
        }

        if (this.Typography.line_height) {
          document.body.style.lineHeight = this.Typography.line_height
        }

        /* =========================
          ⚡ ANIMAÇÃO
        ========================= */

        const speed =
          this.AnimationSettings.animation_speed === "fast"
            ? "0.2s"
            : this.AnimationSettings.animation_speed === "slow"
            ? "0.6s"
            : "0.35s"

        root.style.setProperty("--anim-speed", speed)

        console.log("✅ Theme aplicado (GLOBAL ENGINE)")
      },

      async setEntidadeModelos () {
        await HTTPAuth.get(url({ type: 'u', url: 'api/django_resaas/entidades/' + this.Entidade?.id + '/modelos', params: {} }))
          .then(res => {
            this.EntidadeModelos = res.data
          }).catch(err => {
            console.log(err)
          })
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

      async setEntidadeLayoutSettings () {
        const TipoEntidadeStore = useTipoEntidadeStore()
        const rsp = await HTTPAuth.get(url({ type: 'u', url: 'api/django_resaas/entidades/' + this.Entidade?.id + '/themeGet/', params: { } }))
          .then(res => {
            this.Theme = res.data   || TipoEntidadeStore.Theme
            setStorage('l', 'entidadeTheme', JSON.stringify(this.Theme))
          }).catch(err => {
            console.log(err)
          })

        const lay = await HTTPAuth.get(url({ type: 'u', url: 'api/django_resaas/entidades/' + this.Entidade?.id + '/layoutSettingsGet/', params: { } }))
          .then(res => {
            this.LayoutSettings = res.data  || TipoEntidadeStore.LayoutSettings
            setStorage('l', 'entidadeLayoutSettings', JSON.stringify(this.LayoutSettings))
          }).catch(err => {
            console.log(err)
          })


        const tp = await HTTPAuth.get(url({ type: 'u', url: 'api/django_resaas/entidades/' + this.Entidade?.id + '/typographyGet/', params: { } }))
          .then(res => {
            this.Typography = res.data   || TipoEntidadeStore.Typography
            setStorage('l', 'entidadeTypography', JSON.stringify(this.Typography))
          }).catch(err => {
            console.log(err)
          })

        const as = await HTTPAuth.get(url({ type: 'u', url: 'api/django_resaas/entidades/' + this.Entidade?.id + '/animationSettingsGet/', params: { } }))
          .then(res => {
            this.AnimationSettings = res.data  || TipoEntidadeStore.AnimationSettings
            setStorage('l', 'entidadeAnimationSettings', JSON.stringify(this.AnimationSettings))
          }).catch(err => {
            console.log(err)
          })

          this.setSettings()

        return lay
      },

      async getUserEntidades () {
        if (!this.data?.id) return
        const rsp = await HTTPAuth.get( url({ type: 'u', url: `api/django_resaas/users/${this.data.id}/userEntidades/`,params: {}}))
        setStorage('l', 'userEntidades', JSON.stringify(rsp.data))
        this.Entidades = rsp.data
        return rsp
      },

      async getUserEntidades_ (q) {
        if (!this.data?.id) return

        try {
          const res = await HTTPAuth.get(
            url({
              type: 'u',
              url: `api/django_resaas/users/${this.data.id}/userEntidades/`,
              params: {}
            })
          )

          setStorage('l', 'userEntidades', JSON.stringify(res.data))
          this.Entidades = res.data

          if (res.data.length === 1) {
            this.selectEntidade_(res.data[0], q)
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
            }).onOk(data => this.selectEntidade_(data, q))
            .onCancel(() => {

              this.redirect = 'welcome'
            })
          }
        } catch (err) {
          console.error(err)
        }
      },

      selectEntidade_ (entidade, q) {
        const Sucursal = useSucursalStore()
        this.Entidade = entidade
        this.setEntidadeLayoutSettings()
        setStorage('l', 'userEntidade', JSON.stringify(entidade))
        Sucursal.getUserSucursals_(q)
      },

      // ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
      // ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
      // ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
      // ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

      async getEntidadesByUser(userId) {
        const res = await HTTPAuth.get(
          url({ type: 'u', url: `api/django_resaas/users/${userId}/userEntidades/` })
        )

        this.Entidades = res.data
        return res.data
      },

      async selectEntidade(entidade) {
        this.Entidade = entidade

        await Promise.all([
          this.loadTheme(),
          this.loadLayout(),
          this.loadTypography(),
          this.loadAnimation()
        ])
      },

      async loadTheme() {
        const { data } = await HTTPAuth.get(
          url({ type: 'u', url: `api/django_resaas/entidades/${this.Entidade?.id}/themeGet/` })
        )
        this.Theme = data || {}
      },

      async loadLayout() {
        const { data } = await HTTPAuth.get(
          url({ type: 'u', url: `api/django_resaas/entidades/${this.Entidade?.id}/layoutSettingsGet/` })
        )
        this.LayoutSettings = data || {}
      },

      async loadTypography() {
        const { data } = await HTTPAuth.get(
          url({ type: 'u', url: `api/django_resaas/entidades/${this.Entidade?.id}/typographyGet/` })
        )
        this.Typography = data || {}
      },

      async loadAnimation() {
        const { data } = await HTTPAuth.get(
          url({ type: 'u', url: `api/django_resaas/entidades/${this.Entidade?.id}/animationSettingsGet/` })
        )
        this.AnimationSettings = data || {}
      },

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
