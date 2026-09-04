import { tdc } from '../../../services/translation.js'

export let candidateRoutes = [
  {
    path: '/list_candidate',
    name: 'list_candidate',
    component: () => import('./CandidateLPage.vue'),
    meta: {
      title: tdc('View of') + ' ' + tdc('candidate'),
      requiresAuth: true,
      icon: 'list',
      requiredRole: 'list_candidate',
    },
  },
  {
    path: '/add_candidate',
    name: 'add_candidate',
    component: () => import('./CandidateSEPage.vue'),
    meta: {
      title: tdc('Add') + ' ' + tdc('candidate'),
      requiresAuth: true,
      icon: 'add',
      requiredRole: 'add_candidate',
    },
  },
  {
    path: '/change_candidate/:id',
    name: 'change_candidate',
    component: () => import('./CandidateSEPage.vue'),
    meta: {
      title: tdc('Edit') + ' ' + tdc('candidate'),
      requiresAuth: true,
      icon: 'edit',
      requiredRole: 'change_candidate',
    },
  },
  {
    path: '/view_candidate/:id',
    name: 'view_candidate',
    component: () => import('./CandidateVPage.vue'),
    meta: {
      title: tdc('View') + ' ' + tdc('candidate'),
      requiresAuth: true,
      icon: 'visibility',
      requiredRole: 'view_candidate',
    },
  }
]
