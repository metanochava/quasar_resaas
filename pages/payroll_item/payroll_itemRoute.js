import { tdc } from '../../services/translation'

export let payroll_itemRoutes = [
  {
    path: '/list_payrollitem',
    name: 'list_payrollitem',
    component: () => import('./PayrollItemLPage.vue'),
    meta: {
      title: tdc('View of') + ' ' + tdc('payroll item'),
      requiresAuth: true,
      icon: 'list',
      requiredRole: 'list_payrollitem',
    },
  },
  {
    path: '/add_payrollitem',
    name: 'add_payrollitem',
    component: () => import('./PayrollItemSEPage.vue'),
    meta: {
      title: tdc('Add') + ' ' + tdc('payroll item'),
      requiresAuth: true,
      icon: 'add',
      requiredRole: 'add_payrollitem',
    },
  },
  {
    path: '/change_payrollitem/:id',
    name: 'change_payrollitem',
    component: () => import('./PayrollItemSEPage.vue'),
    meta: {
      title: tdc('Edit') + ' ' + tdc('payroll item'),
      requiresAuth: true,
      icon: 'edit',
      requiredRole: 'change_payrollitem',
    },
  },
  {
    path: '/view_payrollitem/:id',
    name: 'view_payrollitem',
    component: () => import('./PayrollItemVPage.vue'),
    meta: {
      title: tdc('View') + ' ' + tdc('payroll item'),
      requiresAuth: true,
      icon: 'visibility',
      requiredRole: 'view_payrollitem',
    },
  }
]
