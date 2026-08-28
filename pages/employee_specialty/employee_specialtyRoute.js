import { tdc } from '../../services/translation'

export let employee_specialtyRoutes = [
  {
    path: '/list_employeespecialty',
    name: 'list_employeespecialty',
    component: () => import('./EmployeeSpecialtyLPage.vue'),
    meta: {
      title: tdc('View of') + ' ' + tdc('employee specialty'),
      requiresAuth: true,
      icon: 'list',
      requiredRole: 'list_employeespecialty',
    },
  },
  {
    path: '/add_employeespecialty',
    name: 'add_employeespecialty',
    component: () => import('./EmployeeSpecialtySEPage.vue'),
    meta: {
      title: tdc('Add') + ' ' + tdc('employee specialty'),
      requiresAuth: true,
      icon: 'add',
      requiredRole: 'add_employeespecialty',
    },
  },
  {
    path: '/change_employeespecialty/:id',
    name: 'change_employeespecialty',
    component: () => import('./EmployeeSpecialtySEPage.vue'),
    meta: {
      title: tdc('Edit') + ' ' + tdc('employee specialty'),
      requiresAuth: true,
      icon: 'edit',
      requiredRole: 'change_employeespecialty',
    },
  },
  {
    path: '/view_employeespecialty/:id',
    name: 'view_employeespecialty',
    component: () => import('./EmployeeSpecialtyVPage.vue'),
    meta: {
      title: tdc('View') + ' ' + tdc('employee specialty'),
      requiresAuth: true,
      icon: 'visibility',
      requiredRole: 'view_employeespecialty',
    },
  }
]
