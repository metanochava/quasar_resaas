import { tdc } from '../../services/translation'



export let employeeRoutes = [
  {
    path: '/list_employee',
    name: 'list_employee',
    component: () => import('./EmployeePage.vue'),
    meta: {
      title: tdc('View of') + ' ' + tdc('employee'),
      requiresAuth: true,
      icon: 'list',
      requiredRole: 'list_employee',
    },
  },
  {
    path: '/add_employee',
    name: 'add_employee',
    component: () => import('./EmployeeSEPage.vue'),
    meta: {
      title: tdc('Add') + ' ' + tdc('employee'),
      requiresAuth: true,
      icon: 'add',
      requiredRole: 'add_employee',
    },
  },
  {
    path: '/change_employee/:id',
    name: 'change_employee',
    component: () => import('./EmployeeSEPage.vue'),
    meta: {
      title: tdc('Edit') + ' ' + tdc('employee'),
      requiresAuth: true,
      icon: 'edit',
      requiredRole: 'change_employee',
    },
  },
  {
    path: '/view_employee/:id',
    name: 'view_employee',
    component: () => import('./EmployeeVPage.vue'),
    meta: {
      title: tdc('View') + ' ' + tdc('employee'),
      requiresAuth: true,
      icon: 'visibility',
      requiredRole: 'view_employee',
    },
  }
]
