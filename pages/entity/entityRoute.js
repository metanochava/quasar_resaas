import { tdc } from '../../boot/base'

export let entityRoutes = [
  {
    path: '/list_entity',
    name: 'list_entity',
    component: () => import('./EntityLPage.vue'),
    meta: {
      title: tdc('Vista de') + ' ' + tdc('entity'),
      requiresAuth: true,
      icon: 'list',
      requiredRole: 'list_entity',
    },
  },
  {
    path: '/add_entity',
    name: 'add_entity',
    component: () => import('./EntitySEPage.vue'),
    meta: {
      title: tdc('Adicionar') + ' ' + tdc('entity'),
      requiresAuth: true,
      icon: 'add',
      requiredRole: 'add_entity',
    },
  },
  {
    path: '/change_entity/:id',
    name: 'change_entity',
    component: () => import('./EntitySEPage.vue'),
    meta: {
      title: tdc('Editar') + ' ' + tdc('entity'),
      requiresAuth: true,
      icon: 'edit',
      requiredRole: 'change_entity',
    },
  },
  {
    path: '/view_entity/:id',
    name: 'view_entity',
    component: () => import('./EntityVPage.vue'),
    meta: {
      title: tdc('Visualizar') + ' ' + tdc('entity'),
      requiresAuth: true,
      icon: 'visibility',
      requiredRole: 'view_entity',
    },
  }
]
