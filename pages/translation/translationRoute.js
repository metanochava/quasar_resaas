import { tdc } from '../../services/translation'


export let translationRoutes = [
  {
    path: '/list_translation',
    name: 'list_translation',
    component: () => import('./TranslationLPage.vue'),
    meta: {
      title: tdc('View of') + ' ' + tdc('translation'),
      requiresAuth: true,
      icon: 'list',
      requiredRole: 'list_translation',
    },
  },
  {
    path: '/add_translation',
    name: 'add_translation',
    component: () => import('./TranslationSEPage.vue'),
    meta: {
      title: tdc('Add') + ' ' + tdc('translation'),
      requiresAuth: true,
      icon: 'add',
      requiredRole: 'add_translation',
    },
  },
  {
    path: '/change_translation/:id',
    name: 'change_translation',
    component: () => import('./TranslationSEPage.vue'),
    meta: {
      title: tdc('Edit') + ' ' + tdc('translation'),
      requiresAuth: true,
      icon: 'edit',
      requiredRole: 'change_translation',
    },
  },
  {
    path: '/view_translation/:id',
    name: 'view_translation',
    component: () => import('./TranslationVPage.vue'),
    meta: {
      title: tdc('View') + ' ' + tdc('translation'),
      requiresAuth: true,
      icon: 'visibility',
      requiredRole: 'view_translation',
    },
  }
]
