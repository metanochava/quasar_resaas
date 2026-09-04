import { tdc } from '../../../services/translation.js'

export let interviewRoutes = [
  {
    path: '/list_interview',
    name: 'list_interview',
    component: () => import('./InterviewLPage.vue'),
    meta: {
      title: tdc('View of') + ' ' + tdc('interview'),
      requiresAuth: true,
      icon: 'list',
      requiredRole: 'list_interview',
    },
  },
  {
    path: '/add_interview',
    name: 'add_interview',
    component: () => import('./InterviewSEPage.vue'),
    meta: {
      title: tdc('Add') + ' ' + tdc('interview'),
      requiresAuth: true,
      icon: 'add',
      requiredRole: 'add_interview',
    },
  },
  {
    path: '/change_interview/:id',
    name: 'change_interview',
    component: () => import('./InterviewSEPage.vue'),
    meta: {
      title: tdc('Edit') + ' ' + tdc('interview'),
      requiresAuth: true,
      icon: 'edit',
      requiredRole: 'change_interview',
    },
  },
  {
    path: '/view_interview/:id',
    name: 'view_interview',
    component: () => import('./InterviewVPage.vue'),
    meta: {
      title: tdc('View') + ' ' + tdc('interview'),
      requiresAuth: true,
      icon: 'visibility',
      requiredRole: 'view_interview',
    },
  }
]
