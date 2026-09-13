import { getStorage } from '../services/storage'

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
// Installed by the consumer app on its own Router instance (the
// library's own router/index.js is not the one actually used by
// dev/front - see router/routes.js's restRoutes/authRoutes exports).
export function installAuthGuard(router, { loginRouteName = 'login' } = {}) {
  router.beforeEach((to) => {
    if (to.meta?.requiresAuth && !getStorage('l', 'access')) {
      return { name: loginRouteName, query: { redirect: to.fullPath } }
    }
  })

  return router
}
