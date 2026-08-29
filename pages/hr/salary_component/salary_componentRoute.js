import { tdc } from '../../services/translation'

export let salary_componentRoutes = [
  {
    path: '/list_salarycomponent',
    name: 'list_salarycomponent',
    component: () => import('./SalaryComponentLPage.vue'),
    meta: {
      title: tdc('View of') + ' ' + tdc('salary component'),
      requiresAuth: true,
      icon: 'list',
      requiredRole: 'list_salarycomponent',
    },
  },
  {
    path: '/add_salarycomponent',
    name: 'add_salarycomponent',
    component: () => import('./SalaryComponentSEPage.vue'),
    meta: {
      title: tdc('Add') + ' ' + tdc('salary component'),
      requiresAuth: true,
      icon: 'add',
      requiredRole: 'add_salarycomponent',
    },
  },
  {
    path: '/change_salarycomponent/:id',
    name: 'change_salarycomponent',
    component: () => import('./SalaryComponentSEPage.vue'),
    meta: {
      title: tdc('Edit') + ' ' + tdc('salary component'),
      requiresAuth: true,
      icon: 'edit',
      requiredRole: 'change_salarycomponent',
    },
  },
  {
    path: '/view_salarycomponent/:id',
    name: 'view_salarycomponent',
    component: () => import('./SalaryComponentVPage.vue'),
    meta: {
      title: tdc('View') + ' ' + tdc('salary component'),
      requiresAuth: true,
      icon: 'visibility',
      requiredRole: 'view_salarycomponent',
    },
  }
]
