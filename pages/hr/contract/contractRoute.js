import { tdc } from '../../../services/translation.js'

export let contractRoutes = [
  {
    path: '/list_contract',
    name: 'list_contract',
    component: () => import('./ContractLPage.vue'),
    meta: {
      title: tdc('View of') + ' ' + tdc('contract'),
      requiresAuth: true,
      icon: 'list',
      requiredRole: 'list_contract',
    },
  },
  {
    path: '/add_contract',
    name: 'add_contract',
    component: () => import('./ContractSEPage.vue'),
    meta: {
      title: tdc('Add') + ' ' + tdc('contract'),
      requiresAuth: true,
      icon: 'add',
      requiredRole: 'add_contract',
    },
  },
  {
    path: '/change_contract/:id',
    name: 'change_contract',
    component: () => import('./ContractSEPage.vue'),
    meta: {
      title: tdc('Edit') + ' ' + tdc('contract'),
      requiresAuth: true,
      icon: 'edit',
      requiredRole: 'change_contract',
    },
  },
  {
    path: '/view_contract/:id',
    name: 'view_contract',
    component: () => import('./ContractVPage.vue'),
    meta: {
      title: tdc('View') + ' ' + tdc('contract'),
      requiresAuth: true,
      icon: 'visibility',
      requiredRole: 'view_contract',
    },
  }
]
