import { tdc } from '../boot/base'
import { entidadeRoutes } from './../pages/entidade/entidadeRoute'
import { tipo_entidadeRoutes } from './../pages/tipo_entidade/tipo_entidadeRoute'

export let restRoutes = [

  { 
    path: '/view_scaffold', 
    name: 'view_scaffold', 
    component: () => import('../pages/commands/ScaffoldPage.vue'), 
    meta: { 
      title: tdc('Vista de') + ' ' + tdc('Scaffold'), 
      requiresAuth: true, 
      requiredRole: 'view_scaffold'
    } 
  },
  { 
    path: '/add_modulo', 
    name: 'add_modulo', 
    component: () => import('../pages/commands/ModuloCreatePage.vue'), 
    meta: { 
      title: tdc('Add de') + ' ' + tdc('Modulo'), 
      requiresAuth: true, 
      icon: 'inventory_2',
      requiredRole: 'add_modulo'
    } 
  },
  { 
    path: '/rota/:rota/:id', 
    name: 'rota_inexistente', 
    component: () => import('../pages/RotaEnexistente.vue'), 
    meta: { 
      title: tdc('Rota ') + ' ' + tdc(' inexistente'), 
    } 
  },
  ...entidadeRoutes,
  ...tipo_entidadeRoutes,
]

