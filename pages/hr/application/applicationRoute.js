import { tdc } from '../../../services/translation.js'

export let applicationRoutes = [
  {
    path: '/list_application',
    name: 'list_application',
    component: () => import('./ApplicationLPage.vue'),
    meta: {
      title: tdc('View of') + ' ' + tdc('application'),
      requiresAuth: true,
      icon: 'list',
      requiredRole: 'list_application',
    },
  },
  {
    path: '/add_application',
    name: 'add_application',
    component: () => import('./ApplicationSEPage.vue'),
    meta: {
      title: tdc('Add') + ' ' + tdc('application'),
      requiresAuth: true,
      icon: 'add',
      requiredRole: 'add_application',
    },
  },
  {
    path: '/change_application/:id',
    name: 'change_application',
    component: () => import('./ApplicationSEPage.vue'),
    meta: {
      title: tdc('Edit') + ' ' + tdc('application'),
      requiresAuth: true,
      icon: 'edit',
      requiredRole: 'change_application',
    },
  },
  {
    path: '/view_application/:id',
    name: 'view_application',
    component: () => import('./ApplicationVPage.vue'),
    meta: {
      title: tdc('View') + ' ' + tdc('application'),
      requiresAuth: true,
      icon: 'visibility',
      requiredRole: 'view_application',
    },
  },
  {
    // Kanban board (pedido secção 76) - browses/moves Applications for
    // one JobOpening at a time (selected inside the page). Separate from
    // the plain list/add/view CRUD above, same split LeaveRequest used
    // for its calendar/approvals pages (Fase 3).
    path: '/recruitment_pipeline',
    name: 'recruitment_pipeline',
    component: () => import('./RecruitmentPipelinePage.vue'),
    meta: {
      title: tdc('Recruitment pipeline'),
      requiresAuth: true,
      icon: 'view_kanban',
      requiredRole: 'list_application',
    },
  },
]
