import { tdc } from '../../services/translation'

export let shiftRoutes = [
  {
    path: '/list_shift',
    name: 'list_shift',
    component: () => import('./ShiftLPage.vue'),
    meta: {
      title: tdc('View of') + ' ' + tdc('shift'),
      requiresAuth: true,
      icon: 'list',
      requiredRole: 'list_shift',
    },
  },
  {
    path: '/add_shift',
    name: 'add_shift',
    component: () => import('./ShiftSEPage.vue'),
    meta: {
      title: tdc('Add') + ' ' + tdc('shift'),
      requiresAuth: true,
      icon: 'add',
      requiredRole: 'add_shift',
    },
  },
  {
    path: '/change_shift/:id',
    name: 'change_shift',
    component: () => import('./ShiftSEPage.vue'),
    meta: {
      title: tdc('Edit') + ' ' + tdc('shift'),
      requiresAuth: true,
      icon: 'edit',
      requiredRole: 'change_shift',
    },
  },
  {
    path: '/view_shift/:id',
    name: 'view_shift',
    component: () => import('./ShiftVPage.vue'),
    meta: {
      title: tdc('View') + ' ' + tdc('shift'),
      requiresAuth: true,
      icon: 'visibility',
      requiredRole: 'view_shift',
    },
  }
]
