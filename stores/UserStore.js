
import { errorCode, errorMessage } from '../utils/apiContract'
import { groupLabel } from '../utils/groupLabel'
import { getStorage, setStorage, deleteStorage } from '../services/storage'
import { HTTPAuth, HTTPClient, url } from '../services/api'
import { useLanguageStore } from  './LanguageStore'

import { createBaseStore } from '../base/base_store'
import { setSettings } from '../services/theme'
import { JSONSafeParse } from '../utils/json'

import { createResaasContext,  clearResaasContext, getResaasContext } from '../services/tenantContext'

// Module-level (not store state - a Promise isn't serializable/reactive
// state anyway), shared across every call regardless of which component
// triggers it. Several independent boot-time call sites (MainLayout.vue,
// HomeDashboards.vue, DashboardRenderer.vue) each legitimately need to
// AWAIT a fresh context before their own fetch - but every call to
// createResaasContext() issues a genuinely fresh, differently-signed
// token even for the identical entity/branch/group, so without this
// dedup each independent caller changed `this.ResaasContext` again,
// which re-triggered every OTHER component's own
// watch(() => User.ResaasContext, ...) (a real, pre-existing pattern for
// the "switch profile mid-session" case) - a cascade of duplicate
// dashboard loads a user saw as "a loop". Same dedup pattern
// services/api.js's own response interceptor already uses locally for
// its 403-"context expired"-retry - shared here so BOTH that interceptor
// and any component calling this method directly collapse into the same
// in-flight request.
let resaasContextRefreshPromise = null





export const useUserStore = createBaseStore(
  'user',
  {
    app: 'django_resaas',
    model: 'User'
  },
  {
  state: () => ({
    data: null,
    ResaasContext: null,
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
    // ThemeStudio: the entity-wide layout/branding modal. The user's own
    // account (profile/security) is no longer a modal: it is the page behind
    // the route "account" (pages/user/UserAccountPage.vue).
    ThemeStudio: false,
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
    loginDetail: '',
    // a pending SECOND step of the sign-in, never persisted: { kind: 'code' |
    // 'setup', challenge } - the signed, 5-minute proof that the password
    // step succeeded. It is not a session and grants nothing on its own.
    twoFactorStep: null,
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
    groupFilter: 'all', // all | active | inactive
    // Not loged this group .......................................

    defaultprofile:  "https://cdn-icons-png.flaticon.com/512/149/149071.png",

  }),

  getters: {
    hasGroup: (state) => (id) => {
      return state.selectedGroups.some(g => g.id === id)
    },
    filteredGroups(state) {
      const search = (state.groupSearch || '').toLowerCase()

      return state.groups.filter(group => {
        // raw name AND the translated one, so a user can search in their language
        const name = `${group.name || ''} ${groupLabel(group)}`.toLowerCase()
        const active = state.selectedGroups.some(g => g.id === group.id)

        const matchSearch = !search || name.includes(search)

        const matchFilter =
          state.groupFilter === 'all' ||
          (state.groupFilter === 'active' && active) ||
          (state.groupFilter === 'inactive' && !active)

        return matchSearch && matchFilter
      })
    },
    username: (state) => state.data?.username || "Guest",
    profile: (state) =>
      state.data?.profile?.url || state.defaultprofile,
    hasPermission: (state) => (perm) =>
      state.Permissions.has(String(perm).toLowerCase()),

    can: (state) => (perm) =>
      state.Permissions.has(String(perm).toLowerCase()),
    // Configuração efectiva User > Entity > EntityType. Preferido:
    // User.get_ui_config()/get_ui_sources() (django_resaas.saas.
    // models.user.py), já resolvidos e devolvidos por /api/me/ - ver
    // data/user/serializers/me.py's ui_config/ui_sources. state.Theme/
    // LayoutSettings/AnimationSettings/Typography (fetch por
    // EntityStore/EntityTypeStore.getLayoutSettings(), só Entity >
    // EntityType) ficam como fallback só até o primeiro /me/ com
    // contexto de tenant responder.
    ps: (state) => ({
      'theme': state.data?.ui_config?.theme || state.Theme,
      'layout': state.data?.ui_config?.layout || state.LayoutSettings,
      'animation': state.data?.ui_config?.animation || state.AnimationSettings,
      'typography': state.data?.ui_config?.typography || state.Typography,
      'layout_source': state.data?.ui_sources?.layout ?? null,
      'theme_source': state.data?.ui_sources?.theme ?? null,
      'typography_source': state.data?.ui_sources?.typography ?? null,
      'animation_source': state.data?.ui_sources?.animation ?? null,
    }),
  },



  actions: {
    async refreshResaasContext() {
      if (!this.Entity?.id) {
        clearResaasContext()
        this.ResaasContext = null
        return null
      }

      if (!resaasContextRefreshPromise) {
        resaasContextRefreshPromise = createResaasContext({
          entity: this.Entity,
          branch: this.Branch,
          group: this.Group
        }).finally(() => { resaasContextRefreshPromise = null })
      }

      const data = await resaasContextRefreshPromise

      this.ResaasContext = data.token

      return data
    },
    // Silent, proactive renewal used by services/api.js shortly before the
    // token expires. Unlike refreshResaasContext() it deliberately does NOT
    // assign this.ResaasContext: that value is the trigger of several
    // watch(() => User.ResaasContext, ...) (dashboards reload on it), and a
    // background renewal must not make the page the user is on reload. The
    // API client reads the token from storage, which createResaasContext()
    // has already updated.
    async renewResaasContextQuietly() {
      if (!this.Entity?.id) return null

      if (!resaasContextRefreshPromise) {
        resaasContextRefreshPromise = createResaasContext({
          entity: this.Entity,
          branch: this.Branch,
          group: this.Group
        }).finally(() => { resaasContextRefreshPromise = null })
      }

      return resaasContextRefreshPromise
    },
    async selectContext({ entity, branch = null, group = null }) {
      this.Entity = entity || null
      this.Branch = branch || null
      this.Group = group || null

      entity
        ? setStorage('l', 'userEntity', JSON.stringify(entity))
        : deleteStorage('l', 'userEntity')

      branch
        ? setStorage('l', 'userBranch', JSON.stringify(branch))
        : deleteStorage('l', 'userBranch')

      group
        ? setStorage('l', 'userGroup', JSON.stringify(group))
        : deleteStorage('l', 'userGroup')

      return this.refreshResaasContext()
    },
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

        // remove duplicates by id
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

        await HTTPAuth.post(
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

    // Troca menu_rtl (User > Entity > EntityType, ver
    // LayoutSetting.menu_rtl) - backend cria uma cópia pessoal do
    // LayoutSetting efectivo na primeira vez (preserva o resto da
    // configuração herdada) ou só alterna o campo se já existir um
    // override próprio (UserAPIView.toggle_menu_rtl). Nunca usar
    // UserThemeOverride nem uma variável local como fonte de verdade -
    // this.data (via /me/) é sempre reatribuído com a resposta.
    async toggleMenuRtl() {
      const rsp = await HTTPAuth.post(
        url({ type: 'u', url: 'django_resaas/users/toggle_menu_rtl/', params: {} })
      )

      this.data = { ...this.data, ...rsp.data }
      setStorage('l', 'user', JSON.stringify(this.data))

      return rsp
    },

    // Same mechanism as toggleMenuRtl() above, for sidebar_mini instead
    // (UserAPIView.toggle_sidebar_mini, shares the exact same
    // _toggle_personal_layout_field() helper server-side).
    async toggleSidebarMini() {
      const rsp = await HTTPAuth.post(
        url({ type: 'u', url: 'django_resaas/users/toggle_sidebar_mini/', params: {} })
      )

      this.data = { ...this.data, ...rsp.data }
      setStorage('l', 'user', JSON.stringify(this.data))

      return rsp
    },

    toggleThemeStudio(){
      this.ThemeStudio = !this.ThemeStudio
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
      this.loginDetail = ''
      this.access = ''
      const rsp = await HTTPClient.post(url({type: "u", url: "login/", params: {}}), data )
      .then(async res => {
        this.loading = false

        // A TEMPORARY password gets no session: the user must choose a
        // definitive one first (FormLogin.vue shows the change dialog and
        // calls changeTemporaryPassword()).
        if (res.data?.must_change_password) {
          this.loginMsg = 'must_change'
          return res
        }

        if (await this.continueSignIn(res.data)) return res
      }).catch(err => {
        this.loading = false
        this.loginMsg = 'error'

        // only the expired-temporary-password answer carries a message
        // worth showing instead of the generic one
        if (errorCode(err) === 'temporary_password_expired') {
          this.loginDetail = errorMessage(err)
        }
      })
      return rsp
    },

    // First-login step: prove the temporary password, choose the definitive
    // one; the answer carries the tokens, so the session starts right here.
    async changeTemporaryPassword({ identifier, password, newPassword }) {
      this.loading = true

      try {
        const res = await HTTPClient.post(
          url({ type: 'u', url: 'password/change/temporary/', params: {} }),
          { identifier, password, new_password: newPassword }
        )

        // the new password may still have to pass the second factor
        await this.continueSignIn(res.data)
        return res
      } finally {
        this.loading = false
      }
    },

    // The answer of a successful PASSWORD step: either a session, or - when
    // two-factor is active/required - a challenge and NO tokens. Returns true
    // when a second step is pending instead of a session.
    async continueSignIn(data) {
      if (data?.two_factor && data?.challenge) {
        this.twoFactorStep = {
          kind: data.two_factor === 'two_factor_setup_required' ? 'setup' : 'code',
          challenge: data.challenge
        }
        this.loginMsg = this.twoFactorStep.kind === 'setup' ? 'two_factor_setup' : 'two_factor'
        return true
      }

      this.twoFactorStep = null
      await this.startSession(data)
      return false
    },

    cancelTwoFactorStep() {
      this.twoFactorStep = null
      this.loginMsg = ''
    },

    // Second step with an authenticator code or a recovery code. A wrong code
    // rethrows (the caller shows the backend message) and keeps the step open.
    async verifyTwoFactorLogin(code) {
      if (!this.twoFactorStep) return

      this.loading = true

      try {
        const res = await HTTPClient.post(
          url({ type: 'u', url: 'login/two_factor/', params: {} }),
          { challenge: this.twoFactorStep.challenge, code }
        )

        this.twoFactorStep = null
        await this.startSession(res.data)
        return res
      } finally {
        this.loading = false
      }
    },

    // Forced enrolment (a REQUIRED policy) before the first session. The
    // secret/QR go straight to the caller - never into this store.
    async setupTwoFactorLogin() {
      const res = await HTTPClient.post(
        url({ type: 'u', url: 'login/two_factor/setup/', params: {} }),
        { challenge: this.twoFactorStep?.challenge }
      )

      return res.data
    },

    // Proving the first code. Returns { recovery_codes, session } WITHOUT
    // starting the session yet: the user has to see the recovery codes first,
    // then the caller runs startSession(session).
    async confirmTwoFactorLogin(code) {
      this.loading = true

      try {
        const res = await HTTPClient.post(
          url({ type: 'u', url: 'login/two_factor/setup/confirm/', params: {} }),
          { challenge: this.twoFactorStep?.challenge, code }
        )

        const { recovery_codes: recoveryCodes, ...session } = res.data
        this.twoFactorStep = null

        return { recovery_codes: recoveryCodes, session }
      } finally {
        this.loading = false
      }
    },

    async startSession(data) {
      this.data = data
      this.access = data.tokens.access
      this.refresh = data.tokens.refresh
      setStorage('l', 'access', this.access,  365)
      setStorage('l', 'refresh', this.refresh,  365)
      // "Keep me signed in" lives in the access/refresh tokens stored above
      // (loadFromStorage() refreshes them) - a password is NEVER written to
      // any storage. Older versions stored 'username'/'password' keys here
      // (nothing ever read them back): drop any leftovers on every login.
      deleteStorage('l', 'username')
      deleteStorage('l', 'password')
      this.loginMsg = 'good'
      this.isLogin = true
      // Vue watchers only fire on an actual value change - if
      // isLogout stayed 'true' from a previous session's logout,
      // the next logout()/401 setting it to 'true' again would be a
      // same-value no-op and HeaderUser.vue's watcher would never
      // fire, silently breaking the auto-redirect-to-login until a
      // full page reload. Reset it here so it can flip again.
      this.isLogout = false
      await this.me()
    },

    async me() {
      const rsp = await HTTPAuth.get(url({type: "u", url: "me/", params: {}}) )

      this.data = rsp.data
      const Language = useLanguageStore()
      setStorage('l', 'user', JSON.stringify(rsp.data),  365)
      if (rsp.data.language) Language.change(rsp.data.language)
      return rsp
    },

    async refreshToken() {
      const data = {refresh: this.refresh }
      const rsp = await HTTPClient.post(url({type: "u", url: "refresh_token/", params: {}}), data )
      this.access = rsp.data.access
      setStorage('l', 'access', this.access,  365)
      return rsp
    },

    async updateProfile(payload) {
      const id = this.data?.id
      if (!id) return

      const rsp = await HTTPAuth.patch(
        url({ type: 'u', url: `django_resaas/users/${id}/`, params: {} }),
        payload
      )

      this.data = { ...this.data, ...rsp.data }
      setStorage('l', 'user', JSON.stringify(this.data), 365)

      return rsp
    },

    async change_password_email(email, antiga, nova) {
      const data = { email: email, password: antiga, passwordNova: nova }
      const rsp = await HTTPAuth.post(url({type: "u", url: "password/change/email/", params: {}}), data )
      return rsp
    },

    async change_password_numero(mobile, otp, nova) {
      const data = { mobile: mobile, otp: otp, password: nova }
      const rsp = await HTTPAuth.post(url({type: "u", url: "password/change/mobile/", params: {}}), data )
      return rsp
    },

    loadFromStorage () {

      this.ResaasContext = getResaasContext()
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


    },

    async checkSession () {

      if (!this.isTokenExpired(this.access)) {

        return
      }
      if (!this.isTokenExpired(this.refresh)) {

        try {

          await this.refreshToken()
          return
        } catch (e) {
        }
      }
    },

    async logout(x) {
      if (x == 'N') {
        this.isLogout = true
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

        clearResaasContext()

        this.ResaasContext = null

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
        this.isLogout = true
        this.isLogin = false
      }).catch(err => {
        this.isLogout = true
        this.isLogin = false
      })

      return rsp
    }

  },
})
