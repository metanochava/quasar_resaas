import { getStorage } from '../services/storage'
import { hasSessionToken } from '../services/sessionToken'
import { JSONSafeParse } from '../utils/json'
import { AlertWarning } from '../boot/alerts'
import { tdc } from '../services/translation'
import { groupLabel } from '../utils/groupLabel'
import { canStartSilent, startSilent } from '../services/sso'
import { cookieSessionPossible, sharesCentralSession } from '../services/sessionSite'

// Routes already declare `meta.requiresAuth` (see router/restRoutes.js)
// but nothing ever enforced it - a protected route mounted its
// components unconditionally even with no access token in storage at
// all, immediately firing a burst of authenticated requests (schema,
// layout/theme/typography/animation settings, menus...) that all 401
// together before services/api.js's response interceptor
// (UserStore.logout('N')) had a chance to redirect anywhere.
//
// This only short-circuits the "definitely no token" case using the
// same storage key the auth interceptor itself reads - it is not a
// token-validity check (an expired-but-present token still reaches the
// backend and is handled the same way it already was, via the 401
// interceptor + HeaderUser.vue's `isLogout` watch).
//
// Same gap existed for `meta.requiredRole` - every restRoutes.js entry
// declares one (e.g. 'view_scaffold', 'add_app', 'view_dashboard_hr_...')
// but nothing ever checked it either, so ANY logged-in user could
// navigate straight to ANY route's URL regardless of their actual
// permissions (the menu only ever hid the LINK, per CLAUDE.md's own
// "frontend visibility is not security" - here that meant there was no
// backend-equivalent enforcement on the frontend side at all, not that
// the frontend merely deferred to it). Checked the same way
// UserStore.can()/hasPermission() already do (case-insensitive against
// the SAME 'userPermissions' storage key UserStore.loadFromStorage()
// reads) - reading storage directly here too, not useUserStore(), same
// reasoning as the access-token check above (this guard runs from
// router/index.js, outside any component, and storage is exactly what
// the store itself is seeded from).
//
// Backend authorization remains authoritative regardless (every
// protected endpoint already checks permissions server-side) - this
// only stops the frontend from mounting a page + firing its requests
// just to have all of them come back 403, and from a broken page
// flashing before that.
//
// Installed by the consumer app on its own Router instance (the
// library's own router/index.js is not the one actually used by
// dev/front - see router/routes.js's restRoutes/authRoutes exports).
function hasRequiredRole(role) {
  if (!role) return true

  const perms = JSONSafeParse(getStorage('l', 'userPermissions')) || []

  return perms
    .map(p => String(p).toLowerCase())
    .includes(String(role).toLowerCase())
}

// "Profile" here is the currently active Group (userGroup storage key -
// UserStore.selectContext()/GroupSelector.vue's own "switch profile"
// language for the same concept), since permissions in this app are
// always evaluated against whichever Group/profile is currently
// selected, not the User account itself.
function currentProfileLabel() {
  const group = JSONSafeParse(getStorage('l', 'userGroup'))
  return groupLabel(group) || tdc('Unknown profile')
}

function routeLabel(to) {
  return to.meta?.title || String(to.name || to.fullPath || '')
}

// The stored 'userPermissions' are only written when a profile is chosen
// (GroupStore.select/getUserPermissions), while the menu is fetched again on
// every load: a permission the profile gained later (a profile file synced
// on deploy, an admin's change) showed in the menu and was still refused
// here. So a missing permission is asked to the backend once before the
// route is refused - at most once every REFRESH_INTERVAL_MS, so a user who
// really lacks it does not cost a request per click.
const REFRESH_INTERVAL_MS = 10000
let lastRefresh = 0

// Permissions checked inside a page (User.can - a section, a button) never
// reach the route check above: a permission the profile gained on a deploy
// stayed hidden until the profile was chosen again. So navigating also asks
// for the permissions again, in the background (the navigation never waits),
// at most once every BACKGROUND_REFRESH_MS; User.Permissions is reactive, so
// what they show updates when the answer arrives.
const BACKGROUND_REFRESH_MS = 5 * 60 * 1000
let lastBackgroundRefresh = 0

// A page with no session of its own may still be in a signed-in browser: on
// the sites that share the API cookie (services/sessionSite.js) a refresh in
// the background finds it - no page leaves for the central domain. Asked once
// per page load.
let resumeTried = false

async function resumeFromCookie () {
  const { useUserStore } = await import('../stores/UserStore')
  return useUserStore().resumeFromCookie()
}

async function refreshFromGroupStore () {
  const { useGroupStore } = await import('../stores/GroupStore')
  await useGroupStore().getUserPermissions()
}

export function installAuthGuard(router, {
  loginRouteName = 'login',
  forbiddenRouteName = 'dashboard',
  refreshPermissions = refreshFromGroupStore,
  resumeSession = resumeFromCookie,
  resumeRouteName = 'ssoResume'
} = {}) {
  lastRefresh = 0
  lastBackgroundRefresh = 0
  resumeTried = false

  function refreshInBackground () {
    const now = Date.now()
    if (!refreshPermissions || !hasSessionToken()) return
    if (now - lastBackgroundRefresh < BACKGROUND_REFRESH_MS || now - lastRefresh < REFRESH_INTERVAL_MS) return
    lastBackgroundRefresh = now
    lastRefresh = now
    Promise.resolve().then(() => refreshPermissions()).catch(() => {})
  }

  function deny (to) {
    AlertWarning(
      `${tdc('Profile')} "${currentProfileLabel()}" ${tdc('does not have permission for route')} "${routeLabel(to)}"`
    )

    return { name: forbiddenRouteName }
  }

  function check (to) {
    if (to.meta?.requiresAuth && !hasSessionToken()) {
      return { name: loginRouteName, query: { redirect: to.fullPath } }
    }

    const role = to.meta?.requiredRole
    if (!role || hasRequiredRole(role)) {
      refreshInBackground()
      return
    }

    const now = Date.now()
    if (!refreshPermissions || !hasSessionToken() || now - lastRefresh < REFRESH_INTERVAL_MS) {
      return deny(to)
    }

    lastRefresh = now
    lastBackgroundRefresh = now
    return Promise.resolve()
      .then(() => refreshPermissions())
      .catch(() => {})
      .then(() => (hasRequiredRole(role) ? undefined : deny(to)))
  }

  // signed in again from the cookie: where to go now
  function afterResume (to) {
    // nothing chosen on this site yet: the Entity -> Branch -> Group choice
    if (!getStorage('l', 'userGroup')) return { name: resumeRouteName }
    if (to.name === loginRouteName) return { name: forbiddenRouteName }
    return check(to)
  }

  // single sign-on (services/sso.js): with no session, ask the central
  // domain once per tab before showing the local login page - unless this
  // site shares the central domain's cookie (the refresh already answered)
  function withoutSession (to) {
    if (canStartSilent() && !sharesCentralSession()) {
      return startSilent().then(leaving => (leaving ? false : check(to)))
    }
    return check(to)
  }

  router.beforeEach((to) => {
    const needsLogin = to.meta?.requiresAuth || to.name === loginRouteName

    if (needsLogin && !hasSessionToken()) {
      if (!resumeTried && resumeSession && cookieSessionPossible()) {
        resumeTried = true
        return Promise.resolve()
          .then(() => resumeSession())
          .catch(() => false)
          .then(resumed => (resumed ? afterResume(to) : withoutSession(to)))
      }
      return withoutSession(to)
    }

    return check(to)
  })

  return router
}
