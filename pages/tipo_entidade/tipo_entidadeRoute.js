import { tdc } from '../../boot/base'

export let entity_typeRoutes = [
  {
    path: '/list_tipoentity',
    name: 'list_tipoentity',
    component: () => import('./EntityTypeLPage.vue'),
    meta: {
      title: tdc('Vista de') + ' ' + tdc('tipo entity'),
      requiresAuth: true,
      icon: 'list',
      requiredRole: 'list_tipoentity',
    },
  },
  {
    path: '/add_tipoentity',
    name: 'add_tipoentity',
    component: () => import('./EntityTypeSEPage.vue'),
    meta: {
      title: tdc('Adicionar') + ' ' + tdc('tipo entity'),
      requiresAuth: true,
      icon: 'add',
      requiredRole: 'add_tipoentity',
    },
  },
  {
    path: '/change_tipoentity/:id',
    name: 'change_tipoentity',
    component: () => import('./EntityTypeSEPage.vue'),
    meta: {
      title: tdc('Editar') + ' ' + tdc('tipo entity'),
      requiresAuth: true,
      icon: 'edit',
      requiredRole: 'change_tipoentity',
    },
  },
  {
    path: '/view_tipoentity/:id',
    name: 'view_tipoentity',
    component: () => import('./EntityTypeVPage.vue'),
    meta: {
      title: tdc('Visualizar') + ' ' + tdc('tipo entity'),
      requiresAuth: true,
      icon: 'visibility',
      requiredRole: 'view_tipoentity',
    },
  }
]
