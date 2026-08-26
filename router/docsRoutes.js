import { tdc } from '../services/translation'

// =========================================================
// DOCS NAV (sidebar structure — order here is display order)
// =========================================================

export const docsNav = [
  { section: 'Architecture', slug: 'architecture/overview', title: 'Overview' },
  { section: 'Architecture', slug: 'architecture/data-flow', title: 'Data flow' },

  { section: 'Stores', slug: 'stores/base-store', title: 'BaseStore' },
  { section: 'Stores', slug: 'stores/user-context', title: 'UserStore & context' },

  { section: 'Components', slug: 'components/form', title: 'Form' },
  { section: 'Components', slug: 'components/action-form', title: 'ActionForm' },
  { section: 'Components', slug: 'components/button', title: 's-btn' },

  { section: 'Routing', slug: 'routing/routes', title: 'Router' },
  { section: 'Layout', slug: 'layout/layout', title: 'Layout' },

  { section: 'Features', slug: 'features/permissions', title: 'Permissions' },
  { section: 'Features', slug: 'features/translation', title: 'Translation' },

  { section: 'API', slug: 'api/backend-integration', title: 'API & headers' },

  { section: 'Development', slug: 'development/creating-resource', title: 'Creating a resource' },
  { section: 'Deployment', slug: 'deployment/build', title: 'Build' },
  { section: 'Troubleshooting', slug: 'troubleshooting/common-errors', title: 'Common errors' }
]

// =========================================================
// DOCS ROUTES
//
// Single generic page driven by :slug — no per-topic page
// files, same idea as restRoutes.js but for docs/*.md.
//
// Usage in the host app (attached under its own MainLayout,
// exactly like restRoutes):
//
//   import { restRoutes, docsRoutes } from 'quasar_resaas'
//
//   {
//     path: '/',
//     component: () => import('layouts/MainLayout.vue'),
//     children: [...restRoutes, ...docsRoutes]
//   }
// =========================================================

export const docsRoutes = [
  {
    path: '/docs/:slug(.*)*',
    name: 'docs',
    component: () => import('../pages/docs/DocsPage.vue'),
    meta: {
      title: tdc('Documentation'),
      icon: 'menu_book',
      requiresAuth: false
    }
  }
]
