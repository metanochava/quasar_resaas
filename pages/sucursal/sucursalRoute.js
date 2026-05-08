import { tdc } from '../../boot/base'

export let branchRoutes = [
  {
    path: '/list_branch',
    name: 'list_branch',
    component: () => import('./BranchLPage.vue'),
    meta: {
      title: tdc('Vista de') + ' ' + tdc('branch'),
      requiresAuth: true,
      icon: 'list',
      requiredRole: 'list_branch',
    },
  },
  {
    path: '/add_branch',
    name: 'add_branch',
    component: () => import('./BranchSEPage.vue'),
    meta: {
      title: tdc('Adicionar') + ' ' + tdc('branch'),
      requiresAuth: true,
      icon: 'add',
      requiredRole: 'add_branch',
    },
  },
  {
    path: '/change_branch/:id',
    name: 'change_branch',
    component: () => import('./BranchSEPage.vue'),
    meta: {
      title: tdc('Editar') + ' ' + tdc('branch'),
      requiresAuth: true,
      icon: 'edit',
      requiredRole: 'change_branch',
    },
  },
  {
    path: '/view_branch/:id',
    name: 'view_branch',
    component: () => import('./BranchVPage.vue'),
    meta: {
      title: tdc('Visualizar') + ' ' + tdc('branch'),
      requiresAuth: true,
      icon: 'visibility',
      requiredRole: 'view_branch',
    },
  }
]
