import { tdc } from '../boot/base'
import { entityRoutes } from './../pages/entity/entityRoute'
import { entity_typeRoutes } from './../pages/entity_type/entity_typeRoute'
import { userRoutes } from '../pages/user/userRoute'
import { groupRoutes } from '../pages/group/groupRoute'
import { branchRoutes } from '../pages/branch/branchRoute'
import { permissionRoutes } from '../pages/permission/permissionRoute'


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
    path: '/add_app', 
    name: 'add_app', 
    component: () => import('../pages/commands/AppCreatePage.vue'), 
    meta: { 
      title: tdc('Add de') + ' ' + tdc('App'), 
      requiresAuth: true, 
      icon: 'inventory_2',
      requiredRole: 'add_app'
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
  ...entityRoutes,
  ...entity_typeRoutes,
  ...groupRoutes,
  ...branchRoutes,
  ...userRoutes,
  ...permissionRoutes,
]

