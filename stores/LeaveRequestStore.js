import { createBaseStore } from '../base/base_store'
import { HTTPAuth, url } from '../services/api'

export const useLeaveRequestStore = createBaseStore(
  'leaverequest',
  {
    app: 'hr',
    model: 'LeaveRequest'
  },
  {
    state: () => ({
      pending: [],
      loadingPending: false,
      workflowLoading: false,
    }),

    getters: {

    },

    actions: {
      // Used by LeaveApprovalsPage.vue - every entity's queue of requests
      // still waiting on a decision, across all employees (pedido secção
      // 28: "uma vista de aprovação para managers/HR").
      async loadPending() {
        this.loadingPending = true

        try {
          const { data } = await HTTPAuth.get(
            url({ type: 'u', url: 'hr/leaverequests/', params: { status: 'pending', page_size: 100 } })
          )
          this.pending = data?.results ?? data ?? []
        } finally {
          this.loadingPending = false
        }
      },

      // status/days/approved_*/rejection_reason are read_only on the
      // serializer (hr/serializers/leave_request.py) - only these
      // @resaas_action endpoints (hr/views/leave_request.py) can move a
      // request through DRAFT -> PENDING -> APPROVED/REJECTED/CANCELLED.
      async submit(id) {
        this.workflowLoading = true
        try {
          return await HTTPAuth.post(url({ type: 'u', url: `hr/leaverequests/${id}/submit/` }))
        } finally {
          this.workflowLoading = false
        }
      },

      async approve(id) {
        this.workflowLoading = true
        try {
          await HTTPAuth.post(url({ type: 'u', url: `hr/leaverequests/${id}/approve/` }))
          await this.loadPending()
        } finally {
          this.workflowLoading = false
        }
      },

      async reject(id, rejectionReason) {
        this.workflowLoading = true
        try {
          await HTTPAuth.post(
            url({ type: 'u', url: `hr/leaverequests/${id}/reject/` }),
            { rejection_reason: rejectionReason }
          )
          await this.loadPending()
        } finally {
          this.workflowLoading = false
        }
      },

      async cancel(id) {
        this.workflowLoading = true
        try {
          return await HTTPAuth.post(url({ type: 'u', url: `hr/leaverequests/${id}/cancel/` }))
        } finally {
          this.workflowLoading = false
        }
      },
    }
  }
)
