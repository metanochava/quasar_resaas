import { tdc } from '../../../services/translation.js'

export let job_positionRoutes = [
  {
    path: '/list_jobposition',
    name: 'list_jobposition',
    component: () => import('./JobPositionLPage.vue'),
    meta: {
      title: tdc('View of') + ' ' + tdc('job position'),
      requiresAuth: true,
      icon: 'list',
      requiredRole: 'list_jobposition',
    },
  },
  {
    path: '/add_jobposition',
    name: 'add_jobposition',
    component: () => import('./JobPositionSEPage.vue'),
    meta: {
      title: tdc('Add') + ' ' + tdc('job position'),
      requiresAuth: true,
      icon: 'add',
      requiredRole: 'add_jobposition',
    },
  },
  {
    path: '/change_jobposition/:id',
    name: 'change_jobposition',
    component: () => import('./JobPositionSEPage.vue'),
    meta: {
      title: tdc('Edit') + ' ' + tdc('job position'),
      requiresAuth: true,
      icon: 'edit',
      requiredRole: 'change_jobposition',
    },
  },
  {
    path: '/view_jobposition/:id',
    name: 'view_jobposition',
    component: () => import('./JobPositionVPage.vue'),
    meta: {
      title: tdc('View') + ' ' + tdc('job position'),
      requiresAuth: true,
      icon: 'visibility',
      requiredRole: 'view_jobposition',
    },
  }
]
