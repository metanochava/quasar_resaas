import { tdc } from '../../../services/translation'

export let attendanceRoutes = [
  {
    path: '/list_attendance',
    name: 'list_attendance',
    component: () => import('./AttendanceLPage.vue'),
    meta: {
      title: tdc('View of') + ' ' + tdc('attendance'),
      requiresAuth: true,
      icon: 'list',
      requiredRole: 'list_attendance',
    },
  },
  {
    path: '/add_attendance',
    name: 'add_attendance',
    component: () => import('./AttendanceSEPage.vue'),
    meta: {
      title: tdc('Add') + ' ' + tdc('attendance'),
      requiresAuth: true,
      icon: 'add',
      requiredRole: 'add_attendance',
    },
  },
  {
    path: '/change_attendance/:id',
    name: 'change_attendance',
    component: () => import('./AttendanceSEPage.vue'),
    meta: {
      title: tdc('Edit') + ' ' + tdc('attendance'),
      requiresAuth: true,
      icon: 'edit',
      requiredRole: 'change_attendance',
    },
  },
  {
    path: '/view_attendance/:id',
    name: 'view_attendance',
    component: () => import('./AttendanceVPage.vue'),
    meta: {
      title: tdc('View') + ' ' + tdc('attendance'),
      requiresAuth: true,
      icon: 'visibility',
      requiredRole: 'view_attendance',
    },
  }
]
