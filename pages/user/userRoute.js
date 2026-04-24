import { tdc } from '../../boot/base'

export let userRoutes = [
  {
    path: '/list_user',
    name: 'list_user',
    component: () => import('./UserLPage.vue'),
    meta: {
      title: tdc('Vista de') + ' ' + tdc('user'),
      requiresAuth: true,
      icon: 'list',
      requiredRole: 'list_user',
    },
  },
  {
    path: '/add_user',
    name: 'add_user',
    component: () => import('./UserSEPage.vue'),
    meta: {
      title: tdc('Adicionar') + ' ' + tdc('user'),
      requiresAuth: true,
      icon: 'add',
      requiredRole: 'add_user',
    },
  },
  {
    path: '/change_user/:id',
    name: 'change_user',
    component: () => import('./UserSEPage.vue'),
    meta: {
      title: tdc('Editar') + ' ' + tdc('user'),
      requiresAuth: true,
      icon: 'edit',
      requiredRole: 'change_user',
    },
  },
  {
    path: '/view_user/:id',
    name: 'view_user',
    component: () => import('./UserVPage.vue'),
    meta: {
      title: tdc('Visualizar') + ' ' + tdc('user'),
      requiresAuth: true,
      icon: 'visibility',
      requiredRole: 'view_user',
    },
  }
]
