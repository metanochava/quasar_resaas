import { tdc } from '../../services/translation'


export let printerRoutes = [
  {
    path: '/list_printer',
    name: 'list_printer',
    component: () => import('./PrinterLPage.vue'),
    meta: {
      title: tdc('View of') + ' ' + tdc('printer'),
      requiresAuth: true,
      icon: 'list',
      requiredRole: 'list_printer',
    },
  },
  {
    path: '/add_printer',
    name: 'add_printer',
    component: () => import('./PrinterSEPage.vue'),
    meta: {
      title: tdc('Add') + ' ' + tdc('printer'),
      requiresAuth: true,
      icon: 'add',
      requiredRole: 'add_printer',
    },
  },
  {
    path: '/change_printer/:id',
    name: 'change_printer',
    component: () => import('./PrinterSEPage.vue'),
    meta: {
      title: tdc('Edit') + ' ' + tdc('printer'),
      requiresAuth: true,
      icon: 'edit',
      requiredRole: 'change_printer',
    },
  },
  {
    path: '/view_printer/:id',
    name: 'view_printer',
    component: () => import('./PrinterVPage.vue'),
    meta: {
      title: tdc('View') + ' ' + tdc('printer'),
      requiresAuth: true,
      icon: 'visibility',
      requiredRole: 'view_printer',
    },
  }
]
