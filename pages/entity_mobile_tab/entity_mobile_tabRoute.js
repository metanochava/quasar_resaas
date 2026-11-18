import { tdc } from '../../services/translation'


export let entity_mobile_tabRoutes = [
  {
    path: '/list_entitymobiletab',
    name: 'list_entitymobiletab',
    component: () => import('./EntityMobileTabLPage.vue'),
    meta: {
      title: tdc('View of') + ' ' + tdc('entity mobile tab'),
      requiresAuth: true,
      icon: 'list',
      requiredRole: 'list_entitymobiletab',
    },
  },
  {
    path: '/add_entitymobiletab',
    name: 'add_entitymobiletab',
    component: () => import('./EntityMobileTabSEPage.vue'),
    meta: {
      title: tdc('Add') + ' ' + tdc('entity mobile tab'),
      requiresAuth: true,
      icon: 'add',
      requiredRole: 'add_entitymobiletab',
    },
  },
  {
    path: '/change_entitymobiletab/:id',
    name: 'change_entitymobiletab',
    component: () => import('./EntityMobileTabSEPage.vue'),
    meta: {
      title: tdc('Edit') + ' ' + tdc('entity mobile tab'),
      requiresAuth: true,
      icon: 'edit',
      requiredRole: 'change_entitymobiletab',
    },
  },
  {
    path: '/view_entitymobiletab/:id',
    name: 'view_entitymobiletab',
    component: () => import('./EntityMobileTabVPage.vue'),
    meta: {
      title: tdc('View') + ' ' + tdc('entity mobile tab'),
      requiresAuth: true,
      icon: 'visibility',
      requiredRole: 'view_entitymobiletab',
    },
  }
]
