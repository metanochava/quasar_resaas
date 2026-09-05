import { tdc } from '../../../services/translation.js'

// No add/change routes on purpose - see EmployeeOffboardingListPage.vue.
export let employee_offboardingRoutes = [
  {
    path: '/list_employeeoffboarding',
    name: 'list_employeeoffboarding',
    component: () => import('./EmployeeOffboardingListPage.vue'),
    meta: {
      title: tdc('Offboarding'),
      requiresAuth: true,
      icon: 'assignment_late',
      requiredRole: 'list_employeeoffboarding',
    },
  },
]
