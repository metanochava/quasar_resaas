import { tdc } from '../../services/translation'


export let entity_type_mobile_tabRoutes = [
  {
    path: '/list_entitytypemobiletab',
    name: 'list_entitytypemobiletab',
    component: () => import('./EntityTypeMobileTabLPage.vue'),
    meta: {
      title: tdc('View of') + ' ' + tdc('entity type mobile tab'),
      requiresAuth: true,
      icon: 'list',
      requiredRole: 'list_entitytypemobiletab',
    },
  },
  {
    path: '/add_entitytypemobiletab',
    name: 'add_entitytypemobiletab',
    component: () => import('./EntityTypeMobileTabSEPage.vue'),
    meta: {
      title: tdc('Add') + ' ' + tdc('entity type mobile tab'),
      requiresAuth: true,
      icon: 'add',
      requiredRole: 'add_entitytypemobiletab',
    },
  },
  {
    path: '/change_entitytypemobiletab/:id',
    name: 'change_entitytypemobiletab',
    component: () => import('./EntityTypeMobileTabSEPage.vue'),
    meta: {
      title: tdc('Edit') + ' ' + tdc('entity type mobile tab'),
      requiresAuth: true,
      icon: 'edit',
      requiredRole: 'change_entitytypemobiletab',
    },
  },
  {
    path: '/view_entitytypemobiletab/:id',
    name: 'view_entitytypemobiletab',
    component: () => import('./EntityTypeMobileTabVPage.vue'),
    meta: {
      title: tdc('View') + ' ' + tdc('entity type mobile tab'),
      requiresAuth: true,
      icon: 'visibility',
      requiredRole: 'view_entitytypemobiletab',
    },
  }
]
