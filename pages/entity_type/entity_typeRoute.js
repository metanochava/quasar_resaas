import { tdc } from '../../services/translation'

export let entity_typeRoutes = [
  {
    path: '/list_entitytype',
    name: 'list_entitytype',
    component: () => import('./EntityTypeLPage.vue'),
    meta: {
      title: tdc('View of') + ' ' + tdc('entity type'),
      requiresAuth: true,
      icon: 'list',
      requiredRole: 'list_entitytype',
    },
  },
  {
    path: '/add_entitytype',
    name: 'add_entitytype',
    component: () => import('./EntityTypeSEPage.vue'),
    meta: {
      title: tdc('Add') + ' ' + tdc('entity type'),
      requiresAuth: true,
      icon: 'add',
      requiredRole: 'add_entitytype',
    },
  },
  {
    path: '/change_entitytype/:id',
    name: 'change_entitytype',
    component: () => import('./EntityTypeSEPage.vue'),
    meta: {
      title: tdc('Edit') + ' ' + tdc('entity type'),
      requiresAuth: true,
      icon: 'edit',
      requiredRole: 'change_entitytype',
    },
  },
  {
    path: '/view_entitytype/:id',
    name: 'view_entitytype',
    component: () => import('./EntityTypeVPage.vue'),
    meta: {
      title: tdc('View') + ' ' + tdc('entity type'),
      requiresAuth: true,
      icon: 'visibility',
      requiredRole: 'view_entitytype',
    },
  }
]
