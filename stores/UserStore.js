
import { getStorage, setStorage, deleteStorage } from '../boot/storage'
import { HTTPAuth, HTTPClient, url } from '../boot/api'
import { useLanguageStore } from  './LanguageStore'
import { JSONSafeParse, setSettings } from '../boot/base'
import { createBaseStore } from '../base/base_store'


export const useUserStore = createBaseStore(
  'user',
  {
    app: 'django_resaas',
    model: 'User'
  },
  {
  state: () => ({
    data: null,
    Language: {},
    EntityTypes: [],
    EntityType: {},
    Entitys: [],
    Entity: null,
    EntityModelos: [],
    EntityApps: [],
    Branchs: [],
    Branch: null,
    Groups: [],
    Group: {id: 1,  name: 'Gest' },
    Menus: [],
    search: '',
    AllMenus: [],
    Settings: false,
    Permissions: new Set(),
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
    LayoutSettings: {},











    // Not loged this group .......................................
    groups: [],
    selectedGroups: [],
    loadingGroups: false,
    groupSearch: '',
    groupFilter: 'all' // all | active | inactive
    // Not loged this group .......................................
  }),

  getters: {
    hasGroup: (state) => (id) => {
      return state.selectedGroups.some(g => g.id === id)
    },
    username: (state) => state.data?.username || "Guest",
    profile: (state) =>
      state.data?.profile?.url ||
      "https://cdn-icons-png.flaticon.com/512/149/149071.png",
    hasPermission: (state) => (perm) =>
      state.Permissions.has(String(perm).toLowerCase()),

    can: (state) => (perm) =>
      state.Permissions.has(String(perm).toLowerCase()),
    ps: (state) => ({
      'theme': state.Theme,
      'layout': state.LayoutSettings,
      'animation': state.AnimationSettings,
      'typography': state.Typography,
    }),
  },

  actions: {
    async loadGroups(UserId) {
      try {
        const id = UserId || this.row?.id
        if (!id) return

        this.loadingGroups = true

        const [all, selected] = await Promise.all([
          HTTPAuth.get(url({
            type: 'u',
            url: `django_resaas/entitys/${this.Entity?.id}/groups/`
          })),
          HTTPAuth.get(url({
            type: 'u',
            url: `django_resaas/users/${id}/userGroups/`
          }))
        ])

        const merged = [
          ...(all.data || []),
          ...(selected.data || [])
        ]

        // remover duplicados por id
        this.groups = Object.values(
          merged.reduce((acc, g) => {
            acc[g.id] = g
            return acc
          }, {})
        ).sort((a, b) =>
          String(a.name || '').localeCompare(String(b.name || ''))
        )

        this.selectedGroups = selected.data || []

      } catch (e) {
        console.error('loadGroups error', e)
      } finally {
        this.loadingGroups = false
      }
    },


    async toggleGroup(group) {
      try {
        const id = this.row?.id
        if (!id) return

        const exists = this.hasGroup(group.id)
        const endpoint = exists ? 'removeGroup' : 'addGroup'

        await HTTPClient.post(
          url({
            type: 'u',
            url: `django_resaas/users/${id}/${endpoint}/`
          }),
          { group: group.id }
        )

        if (!exists) {
          if (!this.hasGroup(group.id)) {
            this.selectedGroups = [...this.selectedGroups, group]
          }
        } else {
          this.selectedGroups = this.selectedGroups.filter(
            g => g.id !== group.id
          )
        }

      } catch (e) {
        console.error('toggleGroup error', e)
      }
    },
    async getMenus () {
      await HTTPAuth.get(url({ type: 'u', url: 'django_resaas/users/' + this.data.id + '/menus/', params: {} }))
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

    setLanguage(language){
      this.Language = language
      setStorage('l', 'userLang', JSON.stringify(language))
    },
    selectGroup(group){
      this.Group = group
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
      const rsp = await HTTPClient.post(url({type: "u", url: "login/", params: {}}), data )
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
      const rsp = await HTTPAuth.get(url({type: "u", url: "me", params: {}}) )

      this.data = rsp.data
      const Language = useLanguageStore()
      setStorage('l', 'user', JSON.stringify(rsp.data),  365)
      console.log(rsp.data.language)
      if (rsp.data.language) Language.change(rsp.data.language)
      return rsp
    },

    async refreshToken() {
      const data = {refresh: this.refresh }
      const rsp = await HTTPAuth.post(url({type: "u", url: "refresh_token/", params: {}}), data )
      this.access = rsp.data.access
      setStorage('l', 'access', this.access,  365)
      return rsp
    },

    async change_password_email(email, antiga, nova) {
      const data = { email: email, password: antiga, passwordNova: nova }
      const rsp = await HTTPAuth.post(url({type: "u", url: "change_password_email/", params: {}}), data )
      return rsp
    },

    async change_password_numero(mobile, otp, nova) {
      const data = { mobile: mobile, otp: otp, password: nova }
      const rsp = await HTTPAuth.post(url({type: "u", url: "change_password_email/", params: {}}), data )
      return rsp
    },

    loadFromStorage () {

      this.Theme = JSONSafeParse(getStorage('l', 'entityTheme'))
      this.LayoutSettings = JSONSafeParse(getStorage('l', 'entityLayoutsettings'))
      this.Typography = JSONSafeParse(getStorage('l', 'entityTypography'))
      this.AnimationSettings = JSONSafeParse(getStorage('l', 'entityAnimationSettings'))
      this.Entity = JSONSafeParse(getStorage('l', 'userEntity'))
      this.Branchs = JSONSafeParse(getStorage('l', 'userBranchs'))
      this.Entitys = JSONSafeParse(getStorage('l', 'userEntitys'))
      this.Branch = JSONSafeParse(getStorage('l', 'userBranch'))
      this.Group   = JSONSafeParse(getStorage('l', 'userGroup'))
      this.Groups   = JSONSafeParse(getStorage('l', 'userGroups'))
      this.data   = JSONSafeParse(getStorage('l', 'user'))
      this.access   = getStorage('l', 'access')
      this.refresh   = getStorage('l', 'refresh')
      this.RightTop   = ('' + getStorage('l', 'right_top')).toLowerCase() === 'true'
      this.LeftTop   = ('' + getStorage('l', 'left_top')).toLowerCase() === 'true'
      const perms = JSONSafeParse(getStorage('l', 'userPermissions'))
      this.Permissions = new Set(perms)

      console.log("User Loaded")

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

      const rsp = await HTTPAuth.post(url({type: "u", url: "logout/", params: {}}), {refresh: this.refresh} )
      .then(res => {
        this.data = null
        this.refresh = null
        this.access = null
        this.Groups = []
    
        this.Branchs = []
        this.Branch = null

        const userEntity = getStorage('l', 'userEntity')
        
        deleteStorage('l', 'entityTheme')
        deleteStorage('l', 'entityLayoutsettings')
        deleteStorage('l', 'entityTypography')
        deleteStorage('l', 'entityAnimationSettings')

        deleteStorage('l', 'access')
        deleteStorage('l', 'refresh')
        deleteStorage('l', 'userEntitys')
        deleteStorage('l', 'userEntity')
        deleteStorage('l', 'userBranchs')
        deleteStorage('l', 'userBranch')
        deleteStorage('l', 'user')
        deleteStorage('l', 'userGroups')
        deleteStorage('l', 'userGroup')
        deleteStorage('l', 'linga')
        deleteStorage('l', 'entityApps')
        deleteStorage('l', 'entityModelos')

        deleteStorage('l', 'translation')
        deleteStorage('l', 'userPermissions')
        deleteStorage('l', 'manterlogado')
        deleteStorage('l', 'username')
        deleteStorage('l', 'password')

        if (x !== 'x') {
          setStorage('l', 'userEntity', userEntity)
        }

        setStorage('l', 'userGroup', this.Group)
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
