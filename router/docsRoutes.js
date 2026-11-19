// =========================================================
// DOCS ROUTES
//
// The RESAAS documentation is its own site (VitePress, project resaas_docs),
// published at https://resaas.mytech.co.mz/docs/ - process.env.DOCS_URL
// overrides it. The repositories carry no documentation pages any more.
//
// The app keeps its /docs routes so old links still work: /docs and
// /docs/<product>/<page> open the same page of the site, in this tab.
//
//   import { restRoutes, docsRoutes, authRoutes } from 'quasar_resaas'
//   routes = [...authRoutes, ...docsRoutes, { path: '/', ..., children: [...restRoutes] }]
// =========================================================

export const DEFAULT_DOCS_URL = 'https://resaas.mytech.co.mz/docs/'

export function docsUrl (path = '') {
  const base = String(process.env.DOCS_URL || DEFAULT_DOCS_URL).replace(/\/+$/, '') + '/'
  const page = String(path || '').replace(/^\/+/, '')
  return base + page
}

// /docs/quasar-resaas/stores/user-context -> <site>/quasar-resaas/stores/user-context
export function docsTarget (route) {
  const parts = [].concat(route?.params?.pathMatch || []).filter(Boolean)
  return docsUrl(parts.join('/'))
}

export const docsRoutes = [
  {
    path: '/docs/:pathMatch(.*)*',
    name: 'docs',
    beforeEnter (to) {
      window.location.assign(docsTarget(to))
      return false
    },
    // never rendered: the navigation leaves for the site
    component: { render: () => null },
    meta: { requiresAuth: false }
  }
]
