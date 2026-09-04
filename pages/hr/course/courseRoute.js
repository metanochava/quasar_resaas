import { tdc } from '../../../services/translation.js'

export let courseRoutes = [
  {
    path: '/list_course',
    name: 'list_course',
    component: () => import('./CourseLPage.vue'),
    meta: {
      title: tdc('View of') + ' ' + tdc('course'),
      requiresAuth: true,
      icon: 'list',
      requiredRole: 'list_course',
    },
  },
  {
    path: '/add_course',
    name: 'add_course',
    component: () => import('./CourseSEPage.vue'),
    meta: {
      title: tdc('Add') + ' ' + tdc('course'),
      requiresAuth: true,
      icon: 'add',
      requiredRole: 'add_course',
    },
  },
  {
    path: '/change_course/:id',
    name: 'change_course',
    component: () => import('./CourseSEPage.vue'),
    meta: {
      title: tdc('Edit') + ' ' + tdc('course'),
      requiresAuth: true,
      icon: 'edit',
      requiredRole: 'change_course',
    },
  },
  {
    path: '/view_course/:id',
    name: 'view_course',
    component: () => import('./CourseVPage.vue'),
    meta: {
      title: tdc('View') + ' ' + tdc('course'),
      requiresAuth: true,
      icon: 'visibility',
      requiredRole: 'view_course',
    },
  }
]
