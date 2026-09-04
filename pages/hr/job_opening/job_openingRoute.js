import { tdc } from '../../../services/translation.js'

export let job_openingRoutes = [
  {
    path: '/list_jobopening',
    name: 'list_jobopening',
    component: () => import('./JobOpeningLPage.vue'),
    meta: {
      title: tdc('View of') + ' ' + tdc('job opening'),
      requiresAuth: true,
      icon: 'list',
      requiredRole: 'list_jobopening',
    },
  },
  {
    path: '/add_jobopening',
    name: 'add_jobopening',
    component: () => import('./JobOpeningSEPage.vue'),
    meta: {
      title: tdc('Add') + ' ' + tdc('job opening'),
      requiresAuth: true,
      icon: 'add',
      requiredRole: 'add_jobopening',
    },
  },
  {
    path: '/change_jobopening/:id',
    name: 'change_jobopening',
    component: () => import('./JobOpeningSEPage.vue'),
    meta: {
      title: tdc('Edit') + ' ' + tdc('job opening'),
      requiresAuth: true,
      icon: 'edit',
      requiredRole: 'change_jobopening',
    },
  },
  {
    path: '/view_jobopening/:id',
    name: 'view_jobopening',
    component: () => import('./JobOpeningVPage.vue'),
    meta: {
      title: tdc('View') + ' ' + tdc('job opening'),
      requiresAuth: true,
      icon: 'visibility',
      requiredRole: 'view_jobopening',
    },
  }
]
