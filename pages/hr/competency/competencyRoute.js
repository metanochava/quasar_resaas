import { tdc } from '../../../services/translation.js'

export let competencyRoutes = [
  {
    path: '/list_competency',
    name: 'list_competency',
    component: () => import('./CompetencyLPage.vue'),
    meta: {
      title: tdc('View of') + ' ' + tdc('competency'),
      requiresAuth: true,
      icon: 'list',
      requiredRole: 'list_competency',
    },
  },
  {
    path: '/add_competency',
    name: 'add_competency',
    component: () => import('./CompetencySEPage.vue'),
    meta: {
      title: tdc('Add') + ' ' + tdc('competency'),
      requiresAuth: true,
      icon: 'add',
      requiredRole: 'add_competency',
    },
  },
  {
    path: '/change_competency/:id',
    name: 'change_competency',
    component: () => import('./CompetencySEPage.vue'),
    meta: {
      title: tdc('Edit') + ' ' + tdc('competency'),
      requiresAuth: true,
      icon: 'edit',
      requiredRole: 'change_competency',
    },
  },
  {
    path: '/view_competency/:id',
    name: 'view_competency',
    component: () => import('./CompetencyVPage.vue'),
    meta: {
      title: tdc('View') + ' ' + tdc('competency'),
      requiresAuth: true,
      icon: 'visibility',
      requiredRole: 'view_competency',
    },
  }
]
