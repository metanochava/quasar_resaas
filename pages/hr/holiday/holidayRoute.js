import { tdc } from '../../../services/translation.js'

export let holidayRoutes = [
  {
    path: '/list_holiday',
    name: 'list_holiday',
    component: () => import('./HolidayLPage.vue'),
    meta: {
      title: tdc('View of') + ' ' + tdc('holiday'),
      requiresAuth: true,
      icon: 'list',
      requiredRole: 'list_holiday',
    },
  },
  {
    path: '/add_holiday',
    name: 'add_holiday',
    component: () => import('./HolidaySEPage.vue'),
    meta: {
      title: tdc('Add') + ' ' + tdc('holiday'),
      requiresAuth: true,
      icon: 'add',
      requiredRole: 'add_holiday',
    },
  },
  {
    path: '/change_holiday/:id',
    name: 'change_holiday',
    component: () => import('./HolidaySEPage.vue'),
    meta: {
      title: tdc('Edit') + ' ' + tdc('holiday'),
      requiresAuth: true,
      icon: 'edit',
      requiredRole: 'change_holiday',
    },
  },
  {
    path: '/view_holiday/:id',
    name: 'view_holiday',
    component: () => import('./HolidayVPage.vue'),
    meta: {
      title: tdc('View') + ' ' + tdc('holiday'),
      requiresAuth: true,
      icon: 'visibility',
      requiredRole: 'view_holiday',
    },
  }
]
