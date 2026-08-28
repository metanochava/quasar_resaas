import { tdc } from '../../services/translation'

export let payroll_periodRoutes = [
  {
    path: '/list_payrollperiod',
    name: 'list_payrollperiod',
    component: () => import('./PayrollPeriodLPage.vue'),
    meta: {
      title: tdc('View of') + ' ' + tdc('payroll period'),
      requiresAuth: true,
      icon: 'list',
      requiredRole: 'list_payrollperiod',
    },
  },
  {
    path: '/add_payrollperiod',
    name: 'add_payrollperiod',
    component: () => import('./PayrollPeriodSEPage.vue'),
    meta: {
      title: tdc('Add') + ' ' + tdc('payroll period'),
      requiresAuth: true,
      icon: 'add',
      requiredRole: 'add_payrollperiod',
    },
  },
  {
    path: '/change_payrollperiod/:id',
    name: 'change_payrollperiod',
    component: () => import('./PayrollPeriodSEPage.vue'),
    meta: {
      title: tdc('Edit') + ' ' + tdc('payroll period'),
      requiresAuth: true,
      icon: 'edit',
      requiredRole: 'change_payrollperiod',
    },
  },
  {
    path: '/view_payrollperiod/:id',
    name: 'view_payrollperiod',
    component: () => import('./PayrollPeriodVPage.vue'),
    meta: {
      title: tdc('View') + ' ' + tdc('payroll period'),
      requiresAuth: true,
      icon: 'visibility',
      requiredRole: 'view_payrollperiod',
    },
  }
]
