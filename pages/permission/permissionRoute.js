import { tdc } from '../../boot/base'

export let permissionRoutes = [
  {
    path: '/list_permission',
    name: 'list_permission',
    component: () => import('./PermissionLPage.vue'),
    meta: {
      title: tdc('Vista de') + ' ' + tdc('permission'),
      requiresAuth: true,
      icon: 'list',
      requiredRole: 'list_permission',
    },
  },
  {
    path: '/add_permission',
    name: 'add_permission',
    component: () => import('./PermissionSEPage.vue'),
    meta: {
      title: tdc('Adicionar') + ' ' + tdc('permission'),
      requiresAuth: true,
      icon: 'add',
      requiredRole: 'add_permission',
    },
  },
  {
    path: '/change_permission/:id',
    name: 'change_permission',
    component: () => import('./PermissionSEPage.vue'),
    meta: {
      title: tdc('Editar') + ' ' + tdc('permission'),
      requiresAuth: true,
      icon: 'edit',
      requiredRole: 'change_permission',
    },
  },
  {
    path: '/view_permission/:id',
    name: 'view_permission',
    component: () => import('./PermissionVPage.vue'),
    meta: {
      title: tdc('Visualizar') + ' ' + tdc('permission'),
      requiresAuth: true,
      icon: 'visibility',
      requiredRole: 'view_permission',
    },
  }
]
