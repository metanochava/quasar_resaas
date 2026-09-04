import { tdc } from '../../../services/translation.js'

export let performance_cycleRoutes = [
  {
    path: '/list_performancecycle',
    name: 'list_performancecycle',
    component: () => import('./PerformanceCycleLPage.vue'),
    meta: {
      title: tdc('View of') + ' ' + tdc('performance cycle'),
      requiresAuth: true,
      icon: 'list',
      requiredRole: 'list_performancecycle',
    },
  },
  {
    path: '/add_performancecycle',
    name: 'add_performancecycle',
    component: () => import('./PerformanceCycleSEPage.vue'),
    meta: {
      title: tdc('Add') + ' ' + tdc('performance cycle'),
      requiresAuth: true,
      icon: 'add',
      requiredRole: 'add_performancecycle',
    },
  },
  {
    path: '/change_performancecycle/:id',
    name: 'change_performancecycle',
    component: () => import('./PerformanceCycleSEPage.vue'),
    meta: {
      title: tdc('Edit') + ' ' + tdc('performance cycle'),
      requiresAuth: true,
      icon: 'edit',
      requiredRole: 'change_performancecycle',
    },
  },
  {
    path: '/view_performancecycle/:id',
    name: 'view_performancecycle',
    component: () => import('./PerformanceCycleVPage.vue'),
    meta: {
      title: tdc('View') + ' ' + tdc('performance cycle'),
      requiresAuth: true,
      icon: 'visibility',
      requiredRole: 'view_performancecycle',
    },
  }
]
