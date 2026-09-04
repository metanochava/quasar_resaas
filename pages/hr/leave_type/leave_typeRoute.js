import { tdc } from '../../../services/translation.js'

export let leave_typeRoutes = [
  {
    path: '/list_leavetype',
    name: 'list_leavetype',
    component: () => import('./LeaveTypeLPage.vue'),
    meta: {
      title: tdc('View of') + ' ' + tdc('leave type'),
      requiresAuth: true,
      icon: 'list',
      requiredRole: 'list_leavetype',
    },
  },
  {
    path: '/add_leavetype',
    name: 'add_leavetype',
    component: () => import('./LeaveTypeSEPage.vue'),
    meta: {
      title: tdc('Add') + ' ' + tdc('leave type'),
      requiresAuth: true,
      icon: 'add',
      requiredRole: 'add_leavetype',
    },
  },
  {
    path: '/change_leavetype/:id',
    name: 'change_leavetype',
    component: () => import('./LeaveTypeSEPage.vue'),
    meta: {
      title: tdc('Edit') + ' ' + tdc('leave type'),
      requiresAuth: true,
      icon: 'edit',
      requiredRole: 'change_leavetype',
    },
  },
  {
    path: '/view_leavetype/:id',
    name: 'view_leavetype',
    component: () => import('./LeaveTypeVPage.vue'),
    meta: {
      title: tdc('View') + ' ' + tdc('leave type'),
      requiresAuth: true,
      icon: 'visibility',
      requiredRole: 'view_leavetype',
    },
  }
]
