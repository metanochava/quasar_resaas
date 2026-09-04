import { tdc } from '../../../services/translation.js'

export let leave_balance_entryRoutes = [
  {
    path: '/list_leavebalanceentry',
    name: 'list_leavebalanceentry',
    component: () => import('./LeaveBalanceEntryLPage.vue'),
    meta: {
      title: tdc('View of') + ' ' + tdc('leave balance entry'),
      requiresAuth: true,
      icon: 'list',
      requiredRole: 'list_leavebalanceentry',
    },
  },
  {
    path: '/add_leavebalanceentry',
    name: 'add_leavebalanceentry',
    component: () => import('./LeaveBalanceEntrySEPage.vue'),
    meta: {
      title: tdc('Add') + ' ' + tdc('leave balance entry'),
      requiresAuth: true,
      icon: 'add',
      requiredRole: 'add_leavebalanceentry',
    },
  },
  {
    path: '/change_leavebalanceentry/:id',
    name: 'change_leavebalanceentry',
    component: () => import('./LeaveBalanceEntrySEPage.vue'),
    meta: {
      title: tdc('Edit') + ' ' + tdc('leave balance entry'),
      requiresAuth: true,
      icon: 'edit',
      requiredRole: 'change_leavebalanceentry',
    },
  },
  {
    path: '/view_leavebalanceentry/:id',
    name: 'view_leavebalanceentry',
    component: () => import('./LeaveBalanceEntryVPage.vue'),
    meta: {
      title: tdc('View') + ' ' + tdc('leave balance entry'),
      requiresAuth: true,
      icon: 'visibility',
      requiredRole: 'view_leavebalanceentry',
    },
  }
]
