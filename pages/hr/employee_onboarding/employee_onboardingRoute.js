import { tdc } from '../../../services/translation.js'

// EmployeeOnboarding has no generic add/change page on purpose - creation
// only happens via EmployeeStore.startOnboarding() from a specific
// Employee's profile (Onboarding tab, see EmployeeProfilePage.vue), and
// status/started_at/completed_at only change through the complete/cancel
// actions (see hr/serializers/employee_onboarding.py,
// hr/views/employee_onboarding.py). This single route is a browsing
// overview across employees (pedido secção 31/77).
export let employee_onboardingRoutes = [
  {
    path: '/list_employeeonboarding',
    name: 'list_employeeonboarding',
    component: () => import('./EmployeeOnboardingListPage.vue'),
    meta: {
      title: tdc('Employee Onboardings'),
      requiresAuth: true,
      icon: 'assignment_turned_in',
      requiredRole: 'list_employeeonboarding',
    },
  },
]
