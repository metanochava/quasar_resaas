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
    { section: 'Getting started', slug: 'getting-started/installation', title: 'Installation' },
    { section: 'Getting started', slug: 'getting-started/quick-start', title: 'Quick start' },

    { section: 'Architecture', slug: 'architecture/overview', title: 'Overview' },
    { section: 'Architecture', slug: 'architecture/data-flow', title: 'Data flow' },

    { section: 'Stores', slug: 'stores/base-store', title: 'BaseStore' },
    { section: 'Stores', slug: 'stores/user-context', title: 'UserStore & context' },

    { section: 'Components', slug: 'components/form', title: 'Form' },
    { section: 'Components', slug: 'components/action-form', title: 'ActionForm' },
    { section: 'Components', slug: 'components/auto-crud', title: 'AutoCrud' },
    { section: 'Components', slug: 'components/button', title: 's-btn' },

    { section: 'Features', slug: 'features/permissions', title: 'Permissions' },
    { section: 'Features', slug: 'features/translation', title: 'Translation' },
    { section: 'Features', slug: 'features/custom-fields', title: 'Customizing fields' },

    { section: 'Routing', slug: 'routing/routes', title: 'Router' },
    { section: 'Layout', slug: 'layout/layout', title: 'Layout' },

    { section: 'API', slug: 'api/backend-integration', title: 'API & headers' },

    { section: 'Development', slug: 'development/creating-resource', title: 'Creating a resource' },
    { section: 'Deployment', slug: 'deployment/build', title: 'Build' },
    { section: 'Troubleshooting', slug: 'troubleshooting/common-errors', title: 'Common errors' }
  ],

  'django-resaas': [
    { section: 'Getting started', slug: 'getting-started/installation', title: 'Installation' },
    { section: 'Getting started', slug: 'getting-started/quick-start', title: 'Quick start' },

    { section: 'Architecture', slug: 'architecture/overview', title: 'Overview' },
    { section: 'Architecture', slug: 'architecture/multi-tenancy', title: 'Multi-tenancy' },
    { section: 'Architecture', slug: 'architecture/request-lifecycle', title: 'Request lifecycle' },
    { section: 'Architecture', slug: 'architecture/middleware', title: 'Middleware' },
    { section: 'Architecture', slug: 'architecture/registry', title: 'View registry' },

    { section: 'Models', slug: 'models/resaas-config', title: 'Models & RESAAS' },

    { section: 'API', slug: 'api/base-api-view', title: 'BaseAPIView' },
    { section: 'API', slug: 'api/search', title: 'Search' },
    { section: 'API', slug: 'api/filters-pagination', title: 'Filters & pagination' },
    { section: 'API', slug: 'api/schema-contract', title: 'Schema 1.0 contract' },
    { section: 'API', slug: 'api/public-api-reference', title: 'Public API reference' },

    { section: 'Security', slug: 'security/permissions', title: 'Permissions' },

    { section: 'Features', slug: 'features/soft-delete', title: 'Soft delete' },
    { section: 'Features', slug: 'features/files-pdf', title: 'Files & PDF' },
    { section: 'Features', slug: 'features/notifications', title: 'Notifications' },

    { section: 'Development', slug: 'development/creating-resource', title: 'Creating a resource' },
    { section: 'Development', slug: 'development/management-commands', title: 'Management commands' },

    { section: 'Modules', slug: 'hr/overview', title: 'HR module' },

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
// This tree owns its OWN layout (DocLayout — a slim header,
// no app chrome/drawers/dashboard) instead of living inside
// the host app's MainLayout, so it must be spread as a
// TOP-LEVEL entry in the host's route table, exactly like
// authRoutes (never nested inside another layout's children):
//
//   import { restRoutes, docsRoutes, authRoutes } from 'quasar_resaas'
//
//   routes = [
//     ...authRoutes,
//     ...docsRoutes,
//     {
//       path: '/',
//       component: () => import('layouts/MainLayout.vue'),
//       children: [...restRoutes]
//     }
//   ]
// =========================================================

export const docsRoutes = [
  {
    path: '/docs',
    component: () => import('../layouts/DocLayout.vue'),
    children: [
      {
        path: '',
        redirect: `/docs/${defaultDocsProduct}`
      },
      {
        path: ':product(quasar-resaas|django-resaas)/:slug(.*)*',
        name: 'docs',
        component: () => import('../pages/docs/DocsPage.vue'),
        meta: {
          title: tdc('Documentation'),
          icon: 'menu_book',
          requiresAuth: false
        }
      }
    ]
  }
]
