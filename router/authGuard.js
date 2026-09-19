import { getStorage } from '../services/storage'
import { JSONSafeParse } from '../utils/json'
import { AlertWarning } from '../boot/alerts'
import { tdc } from '../services/translation'
import { groupLabel } from '../utils/groupLabel'

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

export function installAuthGuard(router, {
  loginRouteName = 'login',
  forbiddenRouteName = 'home'
} = {}) {
  router.beforeEach((to) => {
    if (to.meta?.requiresAuth && !getStorage('l', 'access')) {
      return { name: loginRouteName, query: { redirect: to.fullPath } }
    }

    if (to.meta?.requiredRole && !hasRequiredRole(to.meta.requiredRole)) {
      AlertWarning(
        `${tdc('Profile')} "${currentProfileLabel()}" ${tdc('does not have permission for route')} "${routeLabel(to)}"`
      )

      return { name: forbiddenRouteName }
    }
  })

  return router
}
