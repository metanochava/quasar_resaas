import { tdc } from '../../../services/translation'

export let departmentRoutes = [
  {
    path: '/list_department',
    name: 'list_department',
    component: () => import('./DepartmentLPage.vue'),
    meta: {
      title: tdc('View of') + ' ' + tdc('department'),
      requiresAuth: true,
      icon: 'list',
      requiredRole: 'list_department',
    },
  },
  {
    path: '/add_department',
    name: 'add_department',
    component: () => import('./DepartmentSEPage.vue'),
    meta: {
      title: tdc('Add') + ' ' + tdc('department'),
      requiresAuth: true,
      icon: 'add',
      requiredRole: 'add_department',
    },
  },
  {
    path: '/change_department/:id',
    name: 'change_department',
    component: () => import('./DepartmentSEPage.vue'),
    meta: {
      title: tdc('Edit') + ' ' + tdc('department'),
      requiresAuth: true,
      icon: 'edit',
      requiredRole: 'change_department',
    },
  },
  {
    path: '/view_department/:id',
    name: 'view_department',
    component: () => import('./DepartmentVPage.vue'),
    meta: {
      title: tdc('View') + ' ' + tdc('department'),
      requiresAuth: true,
      icon: 'visibility',
      requiredRole: 'view_department',
    },
  }
]
