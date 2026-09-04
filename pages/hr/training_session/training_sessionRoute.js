import { tdc } from '../../../services/translation.js'

// List page is custom (TrainingSessionLPage.vue - enrollments/capacity/
// enroll action, pedido secção 76) instead of AutoCrud, same reasoning as
// LeaveRequest's leave_calendar/Application's recruitment_pipeline. add/
// change/view stay on the standard generic form (course/dates/location/
// capacity/status are plain attributes, not workflow-controlled).
export let training_sessionRoutes = [
  {
    path: '/list_trainingsession',
    name: 'list_trainingsession',
    component: () => import('./TrainingSessionLPage.vue'),
    meta: {
      title: tdc('View of') + ' ' + tdc('training session'),
      requiresAuth: true,
      icon: 'list',
      requiredRole: 'list_trainingsession',
    },
  },
  {
    path: '/add_trainingsession',
    name: 'add_trainingsession',
    component: () => import('./TrainingSessionSEPage.vue'),
    meta: {
      title: tdc('Add') + ' ' + tdc('training session'),
      requiresAuth: true,
      icon: 'add',
      requiredRole: 'add_trainingsession',
    },
  },
  {
    path: '/change_trainingsession/:id',
    name: 'change_trainingsession',
    component: () => import('./TrainingSessionSEPage.vue'),
    meta: {
      title: tdc('Edit') + ' ' + tdc('training session'),
      requiresAuth: true,
      icon: 'edit',
      requiredRole: 'change_trainingsession',
    },
  },
  {
    path: '/view_trainingsession/:id',
    name: 'view_trainingsession',
    component: () => import('./TrainingSessionVPage.vue'),
    meta: {
      title: tdc('View') + ' ' + tdc('training session'),
      requiresAuth: true,
      icon: 'visibility',
      requiredRole: 'view_trainingsession',
    },
  }
]
