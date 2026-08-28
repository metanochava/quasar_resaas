import { tdc } from '../../services/translation'

export let payslipRoutes = [
  {
    path: '/list_payslip',
    name: 'list_payslip',
    component: () => import('./PayslipLPage.vue'),
    meta: {
      title: tdc('View of') + ' ' + tdc('payslip'),
      requiresAuth: true,
      icon: 'list',
      requiredRole: 'list_payslip',
    },
  },
  {
    path: '/add_payslip',
    name: 'add_payslip',
    component: () => import('./PayslipSEPage.vue'),
    meta: {
      title: tdc('Add') + ' ' + tdc('payslip'),
      requiresAuth: true,
      icon: 'add',
      requiredRole: 'add_payslip',
    },
  },
  {
    path: '/change_payslip/:id',
    name: 'change_payslip',
    component: () => import('./PayslipSEPage.vue'),
    meta: {
      title: tdc('Edit') + ' ' + tdc('payslip'),
      requiresAuth: true,
      icon: 'edit',
      requiredRole: 'change_payslip',
    },
  },
  {
    path: '/view_payslip/:id',
    name: 'view_payslip',
    component: () => import('./PayslipVPage.vue'),
    meta: {
      title: tdc('View') + ' ' + tdc('payslip'),
      requiresAuth: true,
      icon: 'visibility',
      requiredRole: 'view_payslip',
    },
  }
]
