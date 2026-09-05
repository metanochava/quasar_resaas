import { tdc } from '../../../services/translation.js'

export let promotionRoutes = [
  {
    path: '/list_promotion',
    name: 'list_promotion',
    component: () => import('./PromotionListPage.vue'),
    meta: {
      title: tdc('View of') + ' ' + tdc('promotion'),
      requiresAuth: true,
      icon: 'trending_up',
      requiredRole: 'list_promotion',
    },
  },
]
