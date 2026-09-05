import { tdc } from '../../../services/translation.js'

export let resignationRoutes = [
  {
    path: '/list_resignation',
    name: 'list_resignation',
    component: () => import('./ResignationLPage.vue'),
    meta: {
      title: tdc('View of') + ' ' + tdc('resignation'),
      requiresAuth: true,
      icon: 'list',
      requiredRole: 'list_resignation',
    },
  },
  {
    path: '/add_resignation',
    name: 'add_resignation',
    component: () => import('./ResignationSEPage.vue'),
    meta: {
      title: tdc('Add') + ' ' + tdc('resignation'),
      requiresAuth: true,
      icon: 'add',
      requiredRole: 'add_resignation',
    },
  },
  {
    path: '/change_resignation/:id',
    name: 'change_resignation',
    component: () => import('./ResignationSEPage.vue'),
    meta: {
      title: tdc('Edit') + ' ' + tdc('resignation'),
      requiresAuth: true,
      icon: 'edit',
      requiredRole: 'change_resignation',
    },
  },
  {
    path: '/view_resignation/:id',
    name: 'view_resignation',
    component: () => import('./ResignationVPage.vue'),
    meta: {
      title: tdc('View') + ' ' + tdc('resignation'),
      requiresAuth: true,
      icon: 'visibility',
      requiredRole: 'view_resignation',
    },
  }
]
