import { tdc } from '../../../services/translation'

export let employee_salaryRoutes = [
  {
    path: '/list_employeesalary',
    name: 'list_employeesalary',
    component: () => import('./EmployeeSalaryLPage.vue'),
    meta: {
      title: tdc('View of') + ' ' + tdc('employee salary'),
      requiresAuth: true,
      icon: 'list',
      requiredRole: 'list_employeesalary',
    },
  },
  {
    path: '/add_employeesalary',
    name: 'add_employeesalary',
    component: () => import('./EmployeeSalarySEPage.vue'),
    meta: {
      title: tdc('Add') + ' ' + tdc('employee salary'),
      requiresAuth: true,
      icon: 'add',
      requiredRole: 'add_employeesalary',
    },
  },
  {
    path: '/change_employeesalary/:id',
    name: 'change_employeesalary',
    component: () => import('./EmployeeSalarySEPage.vue'),
    meta: {
      title: tdc('Edit') + ' ' + tdc('employee salary'),
      requiresAuth: true,
      icon: 'edit',
      requiredRole: 'change_employeesalary',
    },
  },
  {
    path: '/view_employeesalary/:id',
    name: 'view_employeesalary',
    component: () => import('./EmployeeSalaryVPage.vue'),
    meta: {
      title: tdc('View') + ' ' + tdc('employee salary'),
      requiresAuth: true,
      icon: 'visibility',
      requiredRole: 'view_employeesalary',
    },
  }
]
