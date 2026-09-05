import { tdc } from '../../../services/translation.js'

export let terminationRoutes = [
  {
    path: '/list_termination',
    name: 'list_termination',
    component: () => import('./TerminationListPage.vue'),
    meta: {
      title: tdc('View of') + ' ' + tdc('termination'),
      requiresAuth: true,
      icon: 'person_off',
      requiredRole: 'list_termination',
    },
  },
]
