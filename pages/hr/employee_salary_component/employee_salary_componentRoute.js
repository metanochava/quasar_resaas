import { tdc } from '../../../services/translation.js'

export let employee_salary_componentRoutes = [
  {
    path: '/list_employeesalarycomponent',
    name: 'list_employeesalarycomponent',
    component: () => import('./EmployeeSalaryComponentLPage.vue'),
    meta: {
      title: tdc('View of') + ' ' + tdc('employee salary component'),
      requiresAuth: true,
      icon: 'list',
      requiredRole: 'list_employeesalarycomponent',
    },
  },
  {
    path: '/add_employeesalarycomponent',
    name: 'add_employeesalarycomponent',
    component: () => import('./EmployeeSalaryComponentSEPage.vue'),
    meta: {
      title: tdc('Add') + ' ' + tdc('employee salary component'),
      requiresAuth: true,
      icon: 'add',
      requiredRole: 'add_employeesalarycomponent',
    },
  },
  {
    path: '/change_employeesalarycomponent/:id',
    name: 'change_employeesalarycomponent',
    component: () => import('./EmployeeSalaryComponentSEPage.vue'),
    meta: {
      title: tdc('Edit') + ' ' + tdc('employee salary component'),
      requiresAuth: true,
      icon: 'edit',
      requiredRole: 'change_employeesalarycomponent',
    },
  },
  {
    path: '/view_employeesalarycomponent/:id',
    name: 'view_employeesalarycomponent',
    component: () => import('./EmployeeSalaryComponentVPage.vue'),
    meta: {
      title: tdc('View') + ' ' + tdc('employee salary component'),
      requiresAuth: true,
      icon: 'visibility',
      requiredRole: 'view_employeesalarycomponent',
    },
  }
]
