import { tdc } from '../../boot/base'

export let tipo_entidadeRoutes = [
  {
    path: '/list_tipoentidade',
    name: 'list_tipoentidade',
    component: () => import('./TipoEntidadeLPage.vue'),
    meta: {
      title: tdc('Vista de') + ' ' + tdc('tipo entidade'),
      requiresAuth: true,
      icon: 'list',
      requiredRole: 'list_tipoentidade',
    },
  },
  {
    path: '/add_tipoentidade',
    name: 'add_tipoentidade',
    component: () => import('./TipoEntidadeSEPage.vue'),
    meta: {
      title: tdc('Adicionar') + ' ' + tdc('tipo entidade'),
      requiresAuth: true,
      icon: 'add',
      requiredRole: 'add_tipoentidade',
    },
  },
  {
    path: '/change_tipoentidade/:id',
    name: 'change_tipoentidade',
    component: () => import('./TipoEntidadeSEPage.vue'),
    meta: {
      title: tdc('Editar') + ' ' + tdc('tipo entidade'),
      requiresAuth: true,
      icon: 'edit',
      requiredRole: 'change_tipoentidade',
    },
  },
  {
    path: '/view_tipoentidade/:id',
    name: 'view_tipoentidade',
    component: () => import('./TipoEntidadeVPage.vue'),
    meta: {
      title: tdc('Visualizar') + ' ' + tdc('tipo entidade'),
      requiresAuth: true,
      icon: 'visibility',
      requiredRole: 'view_tipoentidade',
    },
  }
]
