import { tdc } from '../../../services/translation.js'

// LeaveRequest has no generic add/change page on purpose - status/days/
// approved_*/rejection_reason are read_only on the serializer and only
// change through the submit/approve/reject/cancel actions (see
// hr/serializers/leave_request.py, hr/views/leave_request.py). Creation
// happens from EmployeeProfilePage's Leave tab; these two routes cover
// browsing (secção 74) and the approval queue (secção 28).
export let leave_requestRoutes = [
  {
    path: '/leave_calendar',
    name: 'leave_calendar',
    component: () => import('./LeaveCalendarPage.vue'),
    meta: {
      title: tdc('Leave calendar'),
      requiresAuth: true,
      icon: 'event_note',
      requiredRole: 'list_leaverequest',
    },
  },
  {
    path: '/leave_approvals',
    name: 'leave_approvals',
    component: () => import('./LeaveApprovalsPage.vue'),
    meta: {
      title: tdc('Leave approvals'),
      requiresAuth: true,
      icon: 'fact_check',
      requiredRole: 'approve_leaverequest',
    },
  },
]
