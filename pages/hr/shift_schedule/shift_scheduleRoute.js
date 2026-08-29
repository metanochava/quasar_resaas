import { tdc } from '../../../services/translation'

export let shift_scheduleRoutes = [
  {
    path: '/list_shiftschedule',
    name: 'list_shiftschedule',
    component: () => import('./ShiftScheduleLPage.vue'),
    meta: {
      title: tdc('View of') + ' ' + tdc('shift schedule'),
      requiresAuth: true,
      icon: 'list',
      requiredRole: 'list_shiftschedule',
    },
  },
  {
    path: '/add_shiftschedule',
    name: 'add_shiftschedule',
    component: () => import('./ShiftScheduleSEPage.vue'),
    meta: {
      title: tdc('Add') + ' ' + tdc('shift schedule'),
      requiresAuth: true,
      icon: 'add',
      requiredRole: 'add_shiftschedule',
    },
  },
  {
    path: '/change_shiftschedule/:id',
    name: 'change_shiftschedule',
    component: () => import('./ShiftScheduleSEPage.vue'),
    meta: {
      title: tdc('Edit') + ' ' + tdc('shift schedule'),
      requiresAuth: true,
      icon: 'edit',
      requiredRole: 'change_shiftschedule',
    },
  },
  {
    path: '/view_shiftschedule/:id',
    name: 'view_shiftschedule',
    component: () => import('./ShiftScheduleVPage.vue'),
    meta: {
      title: tdc('View') + ' ' + tdc('shift schedule'),
      requiresAuth: true,
      icon: 'visibility',
      requiredRole: 'view_shiftschedule',
    },
  }
]
