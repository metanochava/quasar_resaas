import { tdc } from '../../boot/base'

export let groupRoutes = [
  {
    path: '/list_group',
    name: 'list_group',
    component: () => import('./GroupLPage.vue'),
    meta: {
      title: tdc('Vista de') + ' ' + tdc('group'),
      requiresAuth: true,
      icon: 'list',
      requiredRole: 'list_group',
    },
  },
  {
    path: '/add_group',
    name: 'add_group',
    component: () => import('./GroupSEPage.vue'),
    meta: {
      title: tdc('Adicionar') + ' ' + tdc('group'),
      requiresAuth: true,
      icon: 'add',
      requiredRole: 'add_group',
    },
  },
  {
    path: '/change_group/:id',
    name: 'change_group',
    component: () => import('./GroupSEPage.vue'),
    meta: {
      title: tdc('Editar') + ' ' + tdc('group'),
      requiresAuth: true,
      icon: 'edit',
      requiredRole: 'change_group',
    },
  },
  {
    path: '/view_group/:id',
    name: 'view_group',
    component: () => import('./GroupVPage.vue'),
    meta: {
      title: tdc('Visualizar') + ' ' + tdc('group'),
      requiresAuth: true,
      icon: 'visibility',
      requiredRole: 'view_group',
    },
  }
]
