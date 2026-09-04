import { tdc } from '../../../services/translation.js'

export let employee_goalRoutes = [
  {
    path: '/list_employeegoal',
    name: 'list_employeegoal',
    component: () => import('./EmployeeGoalLPage.vue'),
    meta: {
      title: tdc('View of') + ' ' + tdc('employee goal'),
      requiresAuth: true,
      icon: 'list',
      requiredRole: 'list_employeegoal',
    },
  },
  {
    path: '/add_employeegoal',
    name: 'add_employeegoal',
    component: () => import('./EmployeeGoalSEPage.vue'),
    meta: {
      title: tdc('Add') + ' ' + tdc('employee goal'),
      requiresAuth: true,
      icon: 'add',
      requiredRole: 'add_employeegoal',
    },
  },
  {
    path: '/change_employeegoal/:id',
    name: 'change_employeegoal',
    component: () => import('./EmployeeGoalSEPage.vue'),
    meta: {
      title: tdc('Edit') + ' ' + tdc('employee goal'),
      requiresAuth: true,
      icon: 'edit',
      requiredRole: 'change_employeegoal',
    },
  },
  {
    path: '/view_employeegoal/:id',
    name: 'view_employeegoal',
    component: () => import('./EmployeeGoalVPage.vue'),
    meta: {
      title: tdc('View') + ' ' + tdc('employee goal'),
      requiresAuth: true,
      icon: 'visibility',
      requiredRole: 'view_employeegoal',
    },
  }
]
