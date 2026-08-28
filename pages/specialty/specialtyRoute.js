import { tdc } from '../../services/translation'

export let specialtyRoutes = [
  {
    path: '/list_specialty',
    name: 'list_specialty',
    component: () => import('./SpecialtyLPage.vue'),
    meta: {
      title: tdc('View of') + ' ' + tdc('specialty'),
      requiresAuth: true,
      icon: 'list',
      requiredRole: 'list_specialty',
    },
  },
  {
    path: '/add_specialty',
    name: 'add_specialty',
    component: () => import('./SpecialtySEPage.vue'),
    meta: {
      title: tdc('Add') + ' ' + tdc('specialty'),
      requiresAuth: true,
      icon: 'add',
      requiredRole: 'add_specialty',
    },
  },
  {
    path: '/change_specialty/:id',
    name: 'change_specialty',
    component: () => import('./SpecialtySEPage.vue'),
    meta: {
      title: tdc('Edit') + ' ' + tdc('specialty'),
      requiresAuth: true,
      icon: 'edit',
      requiredRole: 'change_specialty',
    },
  },
  {
    path: '/view_specialty/:id',
    name: 'view_specialty',
    component: () => import('./SpecialtyVPage.vue'),
    meta: {
      title: tdc('View') + ' ' + tdc('specialty'),
      requiresAuth: true,
      icon: 'visibility',
      requiredRole: 'view_specialty',
    },
  }
]
