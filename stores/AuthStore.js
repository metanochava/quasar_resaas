import { defineStore } from 'pinia'
import { getStorage, setStorage, deleteStorage } from '../boot/storage'
import { HTTPAuth, HTTPClient, url } from '../boot/api'
import { tdc } from '../boot/base'
import { setCssVar, Dark } from "quasar"
import { LanguageStore } from  './LanguageStore'







export const TipoEntidadeStore = defineStore('tipoentidade', {
  state: () => ({
    TipoEntidades: [],
    TipoEntidade: { },
    LayoutSettings: { },
    Theme: { },
    AnimationSettings: { },
    Typography: { },
    Idiomas: [ ]
  }),

  getters: {

  },

  actions: {
    async getTipoEntidades(){
      await HTTPClient.get(url({type: "u", url: "api/django_resaas/tipoentidades", params: {}}) )
      .then(res => {
        this.TipoEntidades = res.data
      }).catch(err => {

      })
    },
  }
})



export const UserStore = defineStore("user", {
  state: () => ({
    data: null,
    Idioma: {},
    TipoEntidade: {},
    Entidades: [],
    Entidade: null,
    EntidadeModelos: [],
    EntidadeModulos: [],
    Sucursals: [],
    Sucursal: null,
    Grupos: [],
    Grupo: {id: 1,  name: 'Gest' },
    Menus: [],
    search: '',
    AllMenus: [],
    Settings: false,
    Permicoes: new Set(),
    access: null,
    refresh: null,
    LeftTop: true,
    RightTop: true,
    LeftMenu: true,
    isLogin: false,
    isLogout: false,
    manterLogado: false,
    redirect: '',
    loginMsg: '',
    loading: false,
    Theme: {},
    LayoutSettings: {},
    AnimationSettings: { },
    Typography: { },
  }),

  getters: {
    username: (state) => state.data?.username || "Guest",
    ps: (state) => ({
      'theme': state.Theme,
      'layout': state.LayoutSettings,
      'animation': state.AnimationSettings,
      'typography': state.Typography,
    }),
    perfil: (state) =>
      state.data?.perfil?.url ||
      "https://cdn-icons-png.flaticon.com/512/149/149071.png",
    hasPermission: (state) => (perm) =>
      state.Permicoes.has(String(perm).toLowerCase()),

    can: (state) => (perm) =>
      state.Permicoes.has(String(perm).toLowerCase()),
  },

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

    async getMenus () {
      await HTTPAuth.get(url({ type: 'u', url: 'api/django_resaas/users/' + this.data.id + '/menus/', params: {} }))
        .then(res => {
          this.AllMenus = res.data
          this.Menus = this.AllMenus
        }).catch(err => {
          console.log(err)
        })
    },
    async setEntidadeModelos () {
      await HTTPAuth.get(url({ type: 'u', url: 'api/django_resaas/entidades/' + this.Entidade?.id + '/modelos', params: {} }))
        .then(res => {
           this.EntidadeModelos = res.data
        }).catch(err => {
          console.log(err)
        })
    },
    isTokenExpired (token) {
      if (!token) return true
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        const now = Math.floor(Date.now() / 1000)
        return payload.exp < now
      } catch (e) {
        return true
      }
    },
    safeParse (value) {
      try {
        return value ? JSON.parse(value) : null
      } catch {
        return null
      }
    },
    setIdioma(idioma){
      this.Idioma = idioma
      setStorage('l', 'userLang', JSON.stringify(idioma))
    },
    selectGroup(grupo){
      this.Grupo = grupo
    },
    toggleSettings(){
      this.Settings = !this.Settings
      setStorage('l', 'settings', this.Settings)
    },
    toggleLeftTop(){
      this.LeftTop = !this.LeftTop
      setStorage('l', 'left_top', this.LeftTop)
    },
    toggleRightTop(){
      this.RightTop = !this.RightTop
      setStorage('l', 'right_top', this.RightTop)
    },

    async login(data, q) {
      this.loading = true
      this.loginMsg  = ''
      this.access = ''
      const rsp = await HTTPClient.post(url({type: "u", url: "api/login/", params: {}}), data )
      .then(async res => {
        this.loading = false
        this.access = res.data.tokens.access
        this.refresh = res.data.tokens.refresh
        setStorage('l', 'access', this.access,  365)
        setStorage('l', 'refresh', this.refresh,  365)
        if (this.manterLogado) {
          setStorage('l', 'username', res.data.email)
          setStorage('l', 'password', res.data.password)
        } else {
          deleteStorage('l', 'username')
          deleteStorage('l', 'password')
        }
        this.loginMsg = 'good'
        await this.me()
        await this.getEntidades_(q)
      }).catch(err => {
        this.loading = false
        console.log(err)
        this.loginMsg = 'error'

      })
      return rsp
    },

    async me() {
      const rsp = await HTTPAuth.get(url({type: "u", url: "api/me", params: {}}) )
      .then(res => {
        this.data = res.data
        const Language = LanguageStore()
        Language.change(res.data.language)
        setStorage('l', 'user', JSON.stringify(this.data),  365)
      }).catch(err => {
        console.log(err)
      })
      return rsp
    },


    async refreshToken() {
      const data = {refresh: this.refresh }
      const rsp = await HTTPAuth.post(url({type: "u", url: "api/refresh_token/", params: {}}), data )
      .then(res => {
        this.access = res.data.access
        setStorage('l', 'access', this.access,  365)
      }).catch(err => {
      })
      return rsp
    },

    async change_password_email(email, antiga, nova) {
      const data = { email: email, password: antiga, passwordNova: nova }
      const rsp = await HTTPAuth.post(url({type: "u", url: "api/change_password_email/", params: {}}), data )
      return rsp
    },

    async change_password_numero(mobile, otp, nova) {
      const data = { mobile: mobile, otp: otp, password: nova }
      const rsp = await HTTPAuth.post(url({type: "u", url: "api/change_password_email/", params: {}}), data )
      return rsp
    },

    async getEntidades () {
      if (!this.data?.id) return
      const rsp = await HTTPAuth.get( url({ type: 'u', url: `api/django_resaas/users/${this.data.id}/userEntidades/`,params: {}}))
      setStorage('l', 'userEntidades', JSON.stringify(rsp.data))
      this.Entidades = rsp.data
      return rsp
    },

     async getEntidades_ (q) {
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
      this.Entidade = entidade
      this.setEntidadeLayoutSettings()
      setStorage('l', 'userEntidade', JSON.stringify(entidade))
      this.getSucursals_(q)
    },

    async getSucursals_ (q) {
      await HTTPAuth.get(url({ type: 'u', url: 'api/django_resaas/users/' + this.data?.id + '/userSucursals/', params: { } }))
        .then(async res => {
          setStorage('l', 'userSucursals', JSON.stringify(res.data))

          if (res.data.length === 1) {
            this.selectSucursal_(res.data[0], q)
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
              this.selectSucursal_(data, q)
            }).onCancel(() => {

              this.redirect = 'authwelcome'
            })
          }
        }).catch(err => {
          console.log(err)
        })
    },

    selectSucursal_ (sucursal, q) {
      this.Sucursal = sucursal
      setStorage('l', 'userSucursal', JSON.stringify(sucursal))
      this.getGrupos_(q)
    },

    selectEntidade (entidade) {
      setStorage('l', 'userEntidade', JSON.stringify(entidade))
      this.Entidade = JSON.parse(getStorage('l', 'userEntidade'))
      this.setEntidadeLayoutSettings()
      this.getSucursals()
      this.setEntidadeModulos()
    },

    selectSucursal (sucursal) {
      this.Sucursal = sucursal
      setStorage('l', 'userSucursal', JSON.stringify(sucursal))
      this.getGrupos()
    },

    async getSucursals () {
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

    async selectGrupo (grupo) {
      setStorage('l', 'userGrupo', JSON.stringify(grupo))
      this.Grupo = grupo
      await this.getPermicoes()
      await this.getMenus()
    },

    async getGrupos () {

      const res = await HTTPAuth.get(
        url({ type: 'u', url: `api/django_resaas/users/${this.data?.id}/userGrupos/`, params: {} })
      )

      setStorage('l', 'userGrupos', JSON.stringify(res.data))
      this.Grupos = res.data

      if (res.data.length === 1) {
        this.selectGrupo_(res.data[0])
      }
      return res
    },

    async getGrupos_ (q) {

      const res = await HTTPAuth.get(
        url({ type: 'u', url: `api/django_resaas/users/${this.data?.id}/userGrupos/`, params: {} })
      )
      setStorage('l', 'userGrupos', JSON.stringify(res.data))
      this.Grupos = res.data

      if (res.data.length === 1) {
        this.selectGrupo_(res.data[0])
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
          this.selectGrupo_(data)
        }).onCancel(() => {
          this.redirect = 'authwelcome'
        })
      }
      return res
    },

    async selectGrupo_ (group) {
      this.Grupo = group
      setStorage('l', 'userGrupo', JSON.stringify(group))
      this.getPermicoes()
      await this.getMenus()
      this.redirect = 'authwelcome'
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
      const tipoEntidadeStore = TipoEntidadeStore()
      const rsp = await HTTPAuth.get(url({ type: 'u', url: 'api/django_resaas/entidades/' + this.Entidade?.id + '/themeGet/', params: { } }))
        .then(res => {
          this.Theme = res.data   || tipoEntidadeStore.Theme
          setStorage('l', 'entidadeTheme', JSON.stringify(this.Theme))
        }).catch(err => {
          console.log(err)
        })

      const lay = await HTTPAuth.get(url({ type: 'u', url: 'api/django_resaas/entidades/' + this.Entidade?.id + '/layoutSettingsGet/', params: { } }))
        .then(res => {
          this.LayoutSettings = res.data  || tipoEntidadeStore.LayoutSettings
          setStorage('l', 'entidadeLayoutSettings', JSON.stringify(this.LayoutSettings))
        }).catch(err => {
          console.log(err)
        })


      const tp = await HTTPAuth.get(url({ type: 'u', url: 'api/django_resaas/entidades/' + this.Entidade?.id + '/typographyGet/', params: { } }))
        .then(res => {
          this.Typography = res.data   || tipoEntidadeStore.Typography
          setStorage('l', 'entidadeTypography', JSON.stringify(this.Typography))
        }).catch(err => {
          console.log(err)
        })

      const as = await HTTPAuth.get(url({ type: 'u', url: 'api/django_resaas/entidades/' + this.Entidade?.id + '/animationSettingsGet/', params: { } }))
        .then(res => {
          this.AnimationSettings = res.data  || tipoEntidadeStore.AnimationSettings
          setStorage('l', 'entidadeAnimationSettings', JSON.stringify(this.AnimationSettings))
        }).catch(err => {
          console.log(err)
        })

        this.setSettings()

      return lay
    },

    async setTipoEntidadeLayoutSettings () {
      const tipoEntidadeStore = TipoEntidadeStore()
      if (getStorage('l', 'userTipoEntidade') !== null) {

        const rsp = await HTTPAuth.get(url({ type: 'u', url: 'api/django_resaas/tipoentidades/' + this.TipoEntidade?.id + '/themeGet/', params: { } }))
          .then(res => {
            setStorage('l', 'tipoEntidadeTheme', JSON.stringify(res.data))
            tipoEntidadeStore.Theme = res.data || {}
            this.Theme = tipoEntidadeStore.Theme

          }).catch(err => {
            console.log(err)
          })

        const lay = await HTTPAuth.get(url({ type: 'u', url: 'api/django_resaas/tipoentidades/' + this.TipoEntidade?.id + '/layoutSettingsGet/', params: { } }))
          .then(res => {
            setStorage('l', 'tipoEntidadeLayoutsettings', JSON.stringify(res.data))
            tipoEntidadeStore.LayoutSettings = res.data || {}
            this.LayoutSettings = tipoEntidadeStore.LayoutSettings

          }).catch(err => {
            console.log(err)
          })


        const tp = await HTTPAuth.get(url({ type: 'u', url: 'api/django_resaas/tipoentidades/' + this.Entidade?.id + '/typographyGet/', params: { } }))
        .then(res => {
          setStorage('l', 'tipoEntidadeTypography', JSON.stringify(res.data))
          tipoEntidadeStore.Typography = res.data || {}
          this.Typography = tipoEntidadeStore.Typography
        }).catch(err => {
          console.log(err)
        })

      const as = await HTTPAuth.get(url({ type: 'u', url: 'api/django_resaas/tipoentidades/' + this.Entidade?.id + '/animationSettingsGet/', params: { } }))
        .then(res => {
          setStorage('l', 'tipoEntidadeAnimationSettings', JSON.stringify(res.data))
          tipoEntidadeStore.AnimationSettings = res.data || {}
          this.AnimationSettings = tipoEntidadeStore.AnimationSettings
        }).catch(err => {
          console.log(err)
        })

          this.setSettings()
        return lay
      }
    },

    async getPermicoes () {
      if (getStorage('l', 'userSucursal') !== null) {

        const res = await HTTPAuth.get(
          url({ type: 'u', url: `api/django_resaas/users/${this.data?.id}/userPermicoes/`, params: {} })
        )

        const perms = (res.data || [])
          .map(p => p?.codename?.toLowerCase())
          .filter(Boolean)

        this.Permicoes = new Set(perms)

        setStorage('l', 'userPermicoes', JSON.stringify(perms))

        return res
      }
    },

    loadFromStorage () {
      this.Entidade = this.safeParse(getStorage('l', 'userEntidade'))
      this.Sucursals = this.safeParse(getStorage('l', 'userSucursals'))
      this.Entidades = this.safeParse(getStorage('l', 'userEntidades'))
      this.Sucursal = this.safeParse(getStorage('l', 'userSucursal'))
      this.Grupo   = this.safeParse(getStorage('l', 'userGrupo'))
      this.Grupos   = this.safeParse(getStorage('l', 'userGrupos'))

      this.data   = this.safeParse(getStorage('l', 'user'))
      this.access   = getStorage('l', 'access')
      this.refresh   = getStorage('l', 'refresh')

      this.RightTop   = ('' + getStorage('l', 'right_top')).toLowerCase() === 'true'
      this.LeftTop   = ('' + getStorage('l', 'left_top')).toLowerCase() === 'true'

      const perms = this.safeParse(getStorage('l', 'userPermicoes'))
      this.Permicoes = new Set(Array.isArray(perms) ? perms : [])
    },


    perfilSplint (txt) {
      if (!txt) return null
      const p = txt.split('_')
      return p[1] ?? p[0]
    },

    async checkSession () {
      console.log('checkSession')
      if (!this.isTokenExpired(this.access)) {
        console.log('access valido')
        return
      }
      if (!this.isTokenExpired(this.refresh)) {
        console.log('access invalido')
        try {
          console.log('pedir access')
          await this.refreshToken()
          return
        } catch (e) {
        }
      }
    },

    async logout(x) {
      if (x == 'N') {
        this.isLogout = !this.isLogout
        this.isLogin = false
        return
      }

      const rsp = await HTTPAuth.post(url({type: "u", url: "api/logout/", params: {}}), {refresh: this.refresh} )
      .then(res => {
        this.data = null
        this.refresh = null
        this.access = null
        this.Grupos = []
        this.Entidades = []
        this.Entidade = null
        this.Sucursals = []
        this.Sucursal = null
        this.Grupo = {id:'1', name:'Hóspede'}

        const userEntidade = getStorage('l', 'userEntidade')


        deleteStorage('l', 'entidadeTheme')
        deleteStorage('l', 'entidadeLayoutsettings')
        deleteStorage('l', 'entidadeTypography')
        deleteStorage('l', 'entidadeAnimationSettings')

        deleteStorage('l', 'access')
        deleteStorage('l', 'refresh')
        deleteStorage('l', 'userEntidades')
        deleteStorage('l', 'userEntidade')
        deleteStorage('l', 'userSucursals')
        deleteStorage('l', 'userSucursal')
        deleteStorage('l', 'user')
        deleteStorage('l', 'userGrupos')
        deleteStorage('l', 'userGrupo')
        deleteStorage('l', 'linga')
        deleteStorage('l', 'entidadeModulos')
        deleteStorage('l', 'entidadeModelos')

        deleteStorage('l', 'traducao')
        deleteStorage('l', 'userPermicoes')
        deleteStorage('l', 'manterlogado')
        deleteStorage('l', 'username')
        deleteStorage('l', 'password')

        if (x !== 'x') {
          setStorage('l', 'userEntidade', userEntidade)
        }

        setStorage('l', 'userGrupo', this.Grupo)
        this.isLogout = !this.isLogout
        this.isLogin = false
      }).catch(err => {
        this.isLogout = !this.isLogout
        this.isLogin = false
      })

      return rsp
    }

  },
})