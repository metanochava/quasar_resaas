import { tdc } from '../../../services/translation'

export let payrollRoutes = [
  {
    path: '/list_payroll',
    name: 'list_payroll',
    component: () => import('./PayrollLPage.vue'),
    meta: {
      title: tdc('View of') + ' ' + tdc('payroll'),
      requiresAuth: true,
      icon: 'list',
      requiredRole: 'list_payroll',
    },
  },
  {
    path: '/add_payroll',
    name: 'add_payroll',
    component: () => import('./PayrollSEPage.vue'),
    meta: {
      title: tdc('Add') + ' ' + tdc('payroll'),
      requiresAuth: true,
      icon: 'add',
      requiredRole: 'add_payroll',
    },
  },
  {
    path: '/change_payroll/:id',
    name: 'change_payroll',
    component: () => import('./PayrollSEPage.vue'),
    meta: {
      title: tdc('Edit') + ' ' + tdc('payroll'),
      requiresAuth: true,
      icon: 'edit',
      requiredRole: 'change_payroll',
    },
  },
  {
    path: '/view_payroll/:id',
    name: 'view_payroll',
    component: () => import('./PayrollVPage.vue'),
    meta: {
      title: tdc('View') + ' ' + tdc('payroll'),
      requiresAuth: true,
      icon: 'visibility',
      requiredRole: 'view_payroll',
    },
  }
]
