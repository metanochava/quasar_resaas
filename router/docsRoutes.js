import { tdc } from '../services/translation'

// =========================================================
// DOCS PRODUCTS
//
// The docs site hosts two independent documentation trees
// under the same UI, switchable like the official Quasar
// Framework docs switch between guide sections.
// =========================================================

export const docsProducts = [
  {
    key: 'quasar-resaas',
    label: 'quasar_resaas',
    subtitle: 'Frontend · Vue 3 + Quasar',
    icon: 'bolt',
    color: '#1976D2'
  },
  {
    key: 'django-resaas',
    label: 'django_resaas',
    subtitle: 'Backend · Django REST',
    icon: 'dns',
    color: '#0C4B33'
  }
]

// =========================================================
// DOCS NAV (sidebar structure — order here is display order)
// Keyed by product key.
// =========================================================

export const docsNav = {
  'quasar-resaas': [
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
  ],

  'django-resaas': [
    { section: 'Architecture', slug: 'architecture/overview', title: 'Overview' },
    { section: 'Architecture', slug: 'architecture/multi-tenancy', title: 'Multi-tenancy' },
    { section: 'Architecture', slug: 'architecture/request-lifecycle', title: 'Request lifecycle' },

    { section: 'Models', slug: 'models/resaas-config', title: 'Models & RESAAS' },

    { section: 'API', slug: 'api/base-api-view', title: 'BaseAPIView' },
    { section: 'API', slug: 'api/search', title: 'Search' },
    { section: 'API', slug: 'api/filters-pagination', title: 'Filters & pagination' },

    { section: 'Security', slug: 'security/permissions', title: 'Permissions' },

    { section: 'Features', slug: 'features/soft-delete', title: 'Soft delete' },
    { section: 'Features', slug: 'features/files-pdf', title: 'Files & PDF' },

    { section: 'Development', slug: 'development/creating-resource', title: 'Creating a resource' },
    { section: 'Deployment', slug: 'deployment/releases', title: 'Git flow & releases' },
    { section: 'Troubleshooting', slug: 'troubleshooting/common-errors', title: 'Common errors' }
  ]
}

export const defaultDocsProduct = 'quasar-resaas'

// =========================================================
// DOCS ROUTES
//
// Single generic page driven by :product/:slug — no per-topic
// page files, same idea as restRoutes.js but for docs/*.md.
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
    path: '/docs',
    redirect: `/docs/${defaultDocsProduct}`
  },
  {
    path: '/docs/:product(quasar-resaas|django-resaas)/:slug(.*)*',
    name: 'docs',
    component: () => import('../pages/docs/DocsPage.vue'),
    meta: {
      title: tdc('Documentation'),
      icon: 'menu_book',
      requiresAuth: false
    }
  }
]
