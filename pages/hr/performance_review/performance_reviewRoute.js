import { tdc } from '../../../services/translation.js'

export let performance_reviewRoutes = [
  {
    path: '/list_performancereview',
    name: 'list_performancereview',
    component: () => import('./PerformanceReviewLPage.vue'),
    meta: {
      title: tdc('View of') + ' ' + tdc('performance review'),
      requiresAuth: true,
      icon: 'list',
      requiredRole: 'list_performancereview',
    },
  },
  {
    path: '/add_performancereview',
    name: 'add_performancereview',
    component: () => import('./PerformanceReviewSEPage.vue'),
    meta: {
      title: tdc('Add') + ' ' + tdc('performance review'),
      requiresAuth: true,
      icon: 'add',
      requiredRole: 'add_performancereview',
    },
  },
  {
    path: '/change_performancereview/:id',
    name: 'change_performancereview',
    component: () => import('./PerformanceReviewSEPage.vue'),
    meta: {
      title: tdc('Edit') + ' ' + tdc('performance review'),
      requiresAuth: true,
      icon: 'edit',
      requiredRole: 'change_performancereview',
    },
  },
  {
    path: '/view_performancereview/:id',
    name: 'view_performancereview',
    component: () => import('./PerformanceReviewVPage.vue'),
    meta: {
      title: tdc('View') + ' ' + tdc('performance review'),
      requiresAuth: true,
      icon: 'visibility',
      requiredRole: 'view_performancereview',
    },
  }
]
