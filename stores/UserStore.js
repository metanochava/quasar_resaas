import { defineStore } from 'pinia'
import { getStorage, setStorage, deleteStorage } from '../boot/storage'
import { HTTPAuth, HTTPClient, url } from '../boot/api'
import { useLanguageStore } from  './LanguageStore'
import { JSONSafeParse, setSettings } from '../boot/base'





export const useUserStore = defineStore("user", {
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
    AnimationSettings: {},
    Typography: {},
    LayoutSettings: {}
  }),

  getters: {
    username: (state) => state.data?.username || "Guest",
    perfil: (state) =>
      state.data?.perfil?.url ||
      "https://cdn-icons-png.flaticon.com/512/149/149071.png",
    hasPermission: (state) => (perm) =>
      state.Permicoes.has(String(perm).toLowerCase()),

    can: (state) => (perm) =>
      state.Permicoes.has(String(perm).toLowerCase()),
    ps: (state) => ({
      'theme': state.Theme,
      'layout': state.LayoutSettings,
      'animation': state.AnimationSettings,
      'typography': state.Typography,
    }),
  },

  actions: {

    async getMenus () {
      await HTTPAuth.get(url({ type: 'u', url: 'api/django_resaas/users/' + this.data.id + '/menus/', params: {} }))
        .then(res => {
          this.AllMenus = res.data
          this.Menus = this.AllMenus
        })
    },

    setSettings(){
      setSettings(this.Theme, this.LayoutSettings, this.Typography, this.AnimationSettings)
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
        this.data = res.data
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
        this.isLogin = true
        await this.me()
      }).catch(err => {
        this.loading = false
        this.loginMsg = 'error'

      })
      return rsp
    },

    async me() {
      const rsp = await HTTPAuth.get(url({type: "u", url: "api/me", params: {}}) )

      this.data = rsp.data
      const Language = useLanguageStore()
      Language.change(rsp.data.language)
      setStorage('l', 'user', JSON.stringify(rsp.data),  365)
      return rsp
    },


    async refreshToken() {
      const data = {refresh: this.refresh }
      const rsp = await HTTPAuth.post(url({type: "u", url: "api/refresh_token/", params: {}}), data )
      this.access = rsp.data.access
      setStorage('l', 'access', this.access,  365)
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

      this.Theme = JSONSafeParse(getStorage('l', 'entidadeTheme'))
      this.LayoutSettings = JSONSafeParse(getStorage('l', 'entidadeLayoutsettings'))
      this.Typography = JSONSafeParse(getStorage('l', 'entidadeTypography'))
      this.AnimationSettings = JSONSafeParse(getStorage('l', 'entidadeAnimationSettings'))
      this.Entidade = JSONSafeParse(getStorage('l', 'userEntidade'))
      this.Sucursals = JSONSafeParse(getStorage('l', 'userSucursals'))
      this.Entidades = JSONSafeParse(getStorage('l', 'userEntidades'))
      this.Sucursal = JSONSafeParse(getStorage('l', 'userSucursal'))
      this.Grupo   = JSONSafeParse(getStorage('l', 'userGrupo'))
      this.Grupos   = JSONSafeParse(getStorage('l', 'userGrupos'))
      this.data   = JSONSafeParse(getStorage('l', 'user'))
      this.access   = getStorage('l', 'access')
      this.refresh   = getStorage('l', 'refresh')
      this.RightTop   = ('' + getStorage('l', 'right_top')).toLowerCase() === 'true'
      this.LeftTop   = ('' + getStorage('l', 'left_top')).toLowerCase() === 'true'
      const perms = JSONSafeParse(getStorage('l', 'userPermicoes'))
      this.Permicoes = new Set(Array.isArray(perms) ? perms : [])
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
    
        this.Sucursals = []
        this.Sucursal = null

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
