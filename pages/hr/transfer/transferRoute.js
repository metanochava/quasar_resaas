import { tdc } from '../../../services/translation.js'

export let transferRoutes = [
  {
    path: '/list_transfer',
    name: 'list_transfer',
    component: () => import('./TransferListPage.vue'),
    meta: {
      title: tdc('View of') + ' ' + tdc('transfer'),
      requiresAuth: true,
      icon: 'compare_arrows',
      requiredRole: 'list_transfer',
    },
  },
]
