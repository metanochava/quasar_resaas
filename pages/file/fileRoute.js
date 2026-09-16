import { tdc } from '../../services/translation'


export let fileRoutes = [
  {
    path: '/list_file',
    name: 'list_file',
    component: () => import('./FileLPage.vue'),
    meta: {
      title: tdc('View of') + ' ' + tdc('file'),
      requiresAuth: true,
      icon: 'list',
      requiredRole: 'list_file',
    },
  },
  {
    path: '/add_file',
    name: 'add_file',
    component: () => import('./FileSEPage.vue'),
    meta: {
      title: tdc('Add') + ' ' + tdc('file'),
      requiresAuth: true,
      icon: 'add',
      requiredRole: 'add_file',
    },
  },
  {
    path: '/change_file/:id',
    name: 'change_file',
    component: () => import('./FileSEPage.vue'),
    meta: {
      title: tdc('Edit') + ' ' + tdc('file'),
      requiresAuth: true,
      icon: 'edit',
      requiredRole: 'change_file',
    },
  },
  {
    path: '/view_file/:id',
    name: 'view_file',
    component: () => import('./FileVPage.vue'),
    meta: {
      title: tdc('View') + ' ' + tdc('file'),
      requiresAuth: true,
      icon: 'visibility',
      requiredRole: 'view_file',
    },
  }
]
