import { tdc } from '../../../services/translation'

export let employee_shiftRoutes = [
  {
    path: '/list_employeeshift',
    name: 'list_employeeshift',
    component: () => import('./EmployeeShiftLPage.vue'),
    meta: {
      title: tdc('View of') + ' ' + tdc('employee shift'),
      requiresAuth: true,
      icon: 'list',
      requiredRole: 'list_employeeshift',
    },
  },
  {
    path: '/add_employeeshift',
    name: 'add_employeeshift',
    component: () => import('./EmployeeShiftSEPage.vue'),
    meta: {
      title: tdc('Add') + ' ' + tdc('employee shift'),
      requiresAuth: true,
      icon: 'add',
      requiredRole: 'add_employeeshift',
    },
  },
  {
    path: '/change_employeeshift/:id',
    name: 'change_employeeshift',
    component: () => import('./EmployeeShiftSEPage.vue'),
    meta: {
      title: tdc('Edit') + ' ' + tdc('employee shift'),
      requiresAuth: true,
      icon: 'edit',
      requiredRole: 'change_employeeshift',
    },
  },
  {
    path: '/view_employeeshift/:id',
    name: 'view_employeeshift',
    component: () => import('./EmployeeShiftVPage.vue'),
    meta: {
      title: tdc('View') + ' ' + tdc('employee shift'),
      requiresAuth: true,
      icon: 'visibility',
      requiredRole: 'view_employeeshift',
    },
  }
]
