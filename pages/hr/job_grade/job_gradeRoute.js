import { tdc } from '../../../services/translation.js'

export let job_gradeRoutes = [
  {
    path: '/list_jobgrade',
    name: 'list_jobgrade',
    component: () => import('./JobGradeLPage.vue'),
    meta: {
      title: tdc('View of') + ' ' + tdc('job grade'),
      requiresAuth: true,
      icon: 'list',
      requiredRole: 'list_jobgrade',
    },
  },
  {
    path: '/add_jobgrade',
    name: 'add_jobgrade',
    component: () => import('./JobGradeSEPage.vue'),
    meta: {
      title: tdc('Add') + ' ' + tdc('job grade'),
      requiresAuth: true,
      icon: 'add',
      requiredRole: 'add_jobgrade',
    },
  },
  {
    path: '/change_jobgrade/:id',
    name: 'change_jobgrade',
    component: () => import('./JobGradeSEPage.vue'),
    meta: {
      title: tdc('Edit') + ' ' + tdc('job grade'),
      requiresAuth: true,
      icon: 'edit',
      requiredRole: 'change_jobgrade',
    },
  },
  {
    path: '/view_jobgrade/:id',
    name: 'view_jobgrade',
    component: () => import('./JobGradeVPage.vue'),
    meta: {
      title: tdc('View') + ' ' + tdc('job grade'),
      requiresAuth: true,
      icon: 'visibility',
      requiredRole: 'view_jobgrade',
    },
  }
]
