import { tdc } from '../../boot/base'

export let entidadeRoutes = [
  {
    path: '/list_entidade',
    name: 'list_entidade',
    component: () => import('./GroupLPage.vue'),
    meta: {
      title: tdc('Vista de') + ' ' + tdc('entidade'),
      requiresAuth: true,
      icon: 'list',
      requiredRole: 'list_entidade',
    },
  },
  {
    path: '/add_entidade',
    name: 'add_entidade',
    component: () => import('./GroupSEPage.vue'),
    meta: {
      title: tdc('Adicionar') + ' ' + tdc('entidade'),
      requiresAuth: true,
      icon: 'add',
      requiredRole: 'add_entidade',
    },
  },
  {
    path: '/change_entidade/:id',
    name: 'change_entidade',
    component: () => import('./GroupSEPage.vue'),
    meta: {
      title: tdc('Editar') + ' ' + tdc('entidade'),
      requiresAuth: true,
      icon: 'edit',
      requiredRole: 'change_entidade',
    },
  },
  {
    path: '/view_entidade/:id',
    name: 'view_entidade',
    component: () => import('./GroupVPage.vue'),
    meta: {
      title: tdc('Visualizar') + ' ' + tdc('entidade'),
      requiresAuth: true,
      icon: 'visibility',
      requiredRole: 'view_entidade',
    },
  }
]
