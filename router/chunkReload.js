// After a deploy, a tab (or a stale index.html) still running the previous
// build asks for route chunks that no longer exist: the lazy import fails,
// vue-router aborts the navigation and the page stays where it was (e.g. on
// /#/sso/callback right after signing in, whose next step opens 'welcome').
// Here such a failure reloads the page once, on the route it was going to,
// so the current build is loaded. A second failure for the same route in
// this tab is left alone (no reload loop).
//
// Installed by the consumer app on its own Router (dev/front router/index.js).

const RELOADED_FOR = 'resaasChunkReload' // sessionStorage: route already reloaded for

const CHUNK_ERROR = /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Unable to preload CSS|Loading (CSS )?chunk .* failed/i

export function isChunkLoadError (error) {
  return CHUNK_ERROR.test(String(error?.message || error || ''))
}

function read () {
  try {
    return sessionStorage.getItem(RELOADED_FOR)
  } catch {
    return null
  }
}

function write (value) {
  try {
    if (value) sessionStorage.setItem(RELOADED_FOR, value)
    else sessionStorage.removeItem(RELOADED_FOR)
  } catch {
    // private mode: no loop guard, but also no reload loop source
  }
}

export function installChunkReload (router, { reload = () => window.location.reload() } = {}) {
  router.onError((error, to) => {
    if (!isChunkLoadError(error)) return

    const target = to ? router.resolve(to).href : ''
    if (!target || read() === target) return

    write(target)
    // the address of the route it was going to, then a full load
    window.history.replaceState(window.history.state, '', target)
    reload()
  })

  // a navigation that worked: the next failure may reload again
  router.afterEach((to, from, failure) => {
    if (!failure) write(null)
  })

  return router
}
