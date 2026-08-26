import { tdc } from '../../services/translation'



export let userRoutes = [
  {
    path: '/list_user',
    name: 'list_user',
    component: () => import('./UserLPage.vue'),
    meta: {
      title: tdc('View of') + ' ' + tdc('user'),
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
      title: tdc('Add') + ' ' + tdc('user'),
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
      title: tdc('Edit') + ' ' + tdc('user'),
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
      title: tdc('View') + ' ' + tdc('user'),
      requiresAuth: true,
      icon: 'visibility',
      requiredRole: 'view_user',
    },
  }
]
