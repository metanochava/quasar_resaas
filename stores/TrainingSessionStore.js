import { createBaseStore } from '../base/base_store'
import { HTTPAuth, url } from '../services/api'

// Course CRUD (JobGrade-style, Fase 1) covers the catalog; TrainingSession
// itself keeps the standard add/edit forms (course/dates/location/
// capacity/status are plain attributes, not workflow-controlled) but its
// List page is custom - enrollments/capacity/enroll action (pedido
// secção 76), same reasoning LeaveRequest's list became LeaveCalendarPage
// and Application's became RecruitmentPipelinePage. This store adds just
// the enrollment-workflow actions TrainingSessionLPage.vue needs on top
// of the generic CRUD BaseStore already provides.
export const useTrainingSessionStore = createBaseStore(
  'trainingsession',
  {
    app: 'hr',
    model: 'TrainingSession'
  },
  {
    state: () => ({
      enrollments: [],
      loadingEnrollments: false,
      enrollmentActionLoading: false,
    }),

    getters: {

    },

    actions: {
      async loadEnrollments(sessionId) {
        if (!sessionId) return

        this.loadingEnrollments = true

        try {
          const res = await HTTPAuth.get(url({
            type: 'u', url: 'hr/employeetrainings/', params: { session: sessionId, page_size: 100 }
          }))
          this.enrollments = res.data?.results ?? res.data ?? []
        } finally {
          this.loadingEnrollments = false
        }
      },

      async enroll(sessionId, employeeId) {
        this.enrollmentActionLoading = true

        try {
          await HTTPAuth.post(
            url({ type: 'u', url: `hr/trainingsessions/${sessionId}/enroll/` }),
            { employee: employeeId }
          )
          await this.loadEnrollments(sessionId)
        } finally {
          this.enrollmentActionLoading = false
        }
      },

      async markCompleted(sessionId, enrollmentId, payload = {}) {
        this.enrollmentActionLoading = true

        try {
          await HTTPAuth.post(
            url({ type: 'u', url: `hr/employeetrainings/${enrollmentId}/mark_completed/` }),
            payload
          )
          await this.loadEnrollments(sessionId)
        } finally {
          this.enrollmentActionLoading = false
        }
      },

      async markFailed(sessionId, enrollmentId, payload = {}) {
        this.enrollmentActionLoading = true

        try {
          await HTTPAuth.post(
            url({ type: 'u', url: `hr/employeetrainings/${enrollmentId}/mark_failed/` }),
            payload
          )
          await this.loadEnrollments(sessionId)
        } finally {
          this.enrollmentActionLoading = false
        }
      },

      async cancelSession(sessionId) {
        this.enrollmentActionLoading = true

        try {
          await HTTPAuth.post(
            url({ type: 'u', url: `hr/trainingsessions/${sessionId}/cancel_session/` })
          )
          await this.loadData()
        } finally {
          this.enrollmentActionLoading = false
        }
      },
    }
  }
)
