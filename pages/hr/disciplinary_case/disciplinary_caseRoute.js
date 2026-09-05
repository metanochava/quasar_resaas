import { tdc } from '../../../services/translation.js'

export let disciplinary_caseRoutes = [
  {
    path: '/list_disciplinarycase',
    name: 'list_disciplinarycase',
    component: () => import('./DisciplinaryCaseLPage.vue'),
    meta: {
      title: tdc('View of') + ' ' + tdc('disciplinary case'),
      requiresAuth: true,
      icon: 'list',
      requiredRole: 'list_disciplinarycase',
    },
  },
  {
    path: '/add_disciplinarycase',
    name: 'add_disciplinarycase',
    component: () => import('./DisciplinaryCaseSEPage.vue'),
    meta: {
      title: tdc('Add') + ' ' + tdc('disciplinary case'),
      requiresAuth: true,
      icon: 'add',
      requiredRole: 'add_disciplinarycase',
    },
  },
  {
    path: '/change_disciplinarycase/:id',
    name: 'change_disciplinarycase',
    component: () => import('./DisciplinaryCaseSEPage.vue'),
    meta: {
      title: tdc('Edit') + ' ' + tdc('disciplinary case'),
      requiresAuth: true,
      icon: 'edit',
      requiredRole: 'change_disciplinarycase',
    },
  },
  {
    path: '/view_disciplinarycase/:id',
    name: 'view_disciplinarycase',
    component: () => import('./DisciplinaryCaseVPage.vue'),
    meta: {
      title: tdc('View') + ' ' + tdc('disciplinary case'),
      requiresAuth: true,
      icon: 'visibility',
      requiredRole: 'view_disciplinarycase',
    },
  }
]
