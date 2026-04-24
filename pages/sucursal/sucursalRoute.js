import { tdc } from '../../boot/base'

export let sucursalRoutes = [
  {
    path: '/list_sucursal',
    name: 'list_sucursal',
    component: () => import('./SucursalLPage.vue'),
    meta: {
      title: tdc('Vista de') + ' ' + tdc('sucursal'),
      requiresAuth: true,
      icon: 'list',
      requiredRole: 'list_sucursal',
    },
  },
  {
    path: '/add_sucursal',
    name: 'add_sucursal',
    component: () => import('./SucursalSEPage.vue'),
    meta: {
      title: tdc('Adicionar') + ' ' + tdc('sucursal'),
      requiresAuth: true,
      icon: 'add',
      requiredRole: 'add_sucursal',
    },
  },
  {
    path: '/change_sucursal/:id',
    name: 'change_sucursal',
    component: () => import('./SucursalSEPage.vue'),
    meta: {
      title: tdc('Editar') + ' ' + tdc('sucursal'),
      requiresAuth: true,
      icon: 'edit',
      requiredRole: 'change_sucursal',
    },
  },
  {
    path: '/view_sucursal/:id',
    name: 'view_sucursal',
    component: () => import('./SucursalVPage.vue'),
    meta: {
      title: tdc('Visualizar') + ' ' + tdc('sucursal'),
      requiresAuth: true,
      icon: 'visibility',
      requiredRole: 'view_sucursal',
    },
  }
]
