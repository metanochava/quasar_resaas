

import { entityRoutes } from './../pages/entity/entityRoute'
import { entity_typeRoutes } from '../pages/entity_type/entity_typeRoute'
import { userRoutes } from '../pages/user/userRoute'
import { groupRoutes } from '../pages/group/groupRoute'
import { branchRoutes } from '../pages/branch/branchRoute'
import { permissionRoutes } from '../pages/permission/permissionRoute'
import { fileRoutes } from '../pages/file/fileRoute'
import { translationRoutes } from '../pages/translation/translationRoute'
import { ruleRoutes } from '../pages/notifications/rule/ruleRoute'
import { templateRoutes } from '../pages/notifications/template/templateRoute'
import { preferenceRoutes } from '../pages/notifications/preference/preferenceRoute'
import { settingsRoutes } from '../pages/notifications/settings/settingsRoute'
import { outboxRoutes } from '../pages/notifications/outbox/outboxRoute'
import { delivery_attemptRoutes } from '../pages/notifications/delivery_attempt/delivery_attemptRoute'
import { tdc } from '../services/translation'


export let restRoutes = [

  { 
    path: '/view_scaffold', 
    name: 'view_scaffold', 
    component: () => import('../pages/commands/ScaffoldPage.vue'), 
    meta: { 
      title: tdc('View of') + ' ' + tdc('Scaffold'),
      requiresAuth: true, 
      requiredRole: 'view_scaffold'
    } 
    },
      { 
      path: '/view_crud', 
      name: 'view_crud', 
      component: () => import('../pages/CrudPage.vue'), 
      meta: { 
        title: tdc('View of') + ' ' + tdc('Crud'),
        requiresAuth: true, 
        requiredRole: 'view_crud'
      } 
    },
  {
    // App.RESAAS.routes (django_resaas.saas.models.app.App) declares
    // list_app/view_app/change_app/add_app - AppCreatePage.vue's
    // "Modules" workspace already IS the full list+manage experience
    // (cards for every module, activate/deactivate, models, entity
    // types, delete), so all four names point at the same page instead
    // of duplicating it behind a second, plain generic AutoCrud list -
    // creating/editing an App has real side effects (folder scaffolding,
    // protected-name checks) a generic form would bypass.
    path: '/list_app',
    name: 'list_app',
    component: () => import('../pages/commands/AppCreatePage.vue'),
    meta: {
      title: tdc('View of') + ' ' + tdc('App'),
      requiresAuth: true,
      icon: 'inventory_2',
      requiredRole: 'list_app'
    }
  },
  {
    path: '/add_app',
    name: 'add_app',
    component: () => import('../pages/commands/AppCreatePage.vue'),
    meta: {
      title: tdc('Add') + ' ' + tdc('App'),
      requiresAuth: true,
      icon: 'inventory_2',
      requiredRole: 'add_app'
    }
  },
  {
    path: '/view_notifications_dashboard',
    name: 'view_notifications_dashboard',
    component: () => import('../pages/notifications/dashboard/NotificationsDashboardPage.vue'),
    meta: {
      title: tdc('Dashboard') + ' ' + tdc('Notifications'),
      requiresAuth: true,
      icon: 'notifications',
      requiredRole: 'view_notifications_dashboard'
    }
  },
  {
    path: '/view_django_resaas_dashboard',
    name: 'view_django_resaas_dashboard',
    component: () => import('../pages/django_resaas/DashBoard.vue'),
    meta: { 
      title: tdc('View') + ' ' + tdc('Dashboard'),
      requiresAuth: true, 
      icon: 'inventory_2',
      requiredRole: 'view_django_resaas_dashboard'
    } 
  },
  { 
    path: '/view_core_dashboard', 
    name: 'view_core_dashboard', 
    component: () => import('../pages/core/DashBoard.vue'), 
    meta: { 
      title: tdc('View') + ' ' + tdc('Dashboard'),
      requiresAuth: true, 
      icon: 'inventory_2',
      requiredRole: 'view_core_dashboard'
    } 
  },
  { 
    path: '/route/:route/:id', 
    name: 'route_inexistente', 
    component: () => import('../pages/RotaEnexistente.vue'), 
    meta: { 
      title: tdc('Route') + ' ' + tdc('not found'),
    } 
  },
  ...entityRoutes,
  ...entity_typeRoutes,
  ...groupRoutes,
  ...branchRoutes,
  ...userRoutes,
  ...permissionRoutes,
  ...fileRoutes,
  ...translationRoutes,
  ...ruleRoutes,
  ...templateRoutes,
  ...preferenceRoutes,
  ...settingsRoutes,
  ...outboxRoutes,
  ...delivery_attemptRoutes,
]

