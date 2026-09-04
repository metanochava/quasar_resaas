import { createBaseStore } from '../base/base_store'
import { HTTPAuth, HTTPClient, url } from '../services/api'
import { useBranchStore } from './BranchStore'
import { useUserStore } from './UserStore'
import { profileSplint } from '../utils/profile'
import { tdc } from '../services/translation'
import { getStorage, setStorage } from '../services/storage'

export const useEmployeeStore = createBaseStore(
  'employee',
  {
    app: 'hr',
    model: 'Employee'
  },
  {
    state: () => ({
      contracts: [],
      loadingContracts: false,
      attendances: [],
      loadingAttendances: false,
      checkingInOut: false,
      leaveRequests: [],
      leaveBalanceEntries: [],
      loadingLeave: false,
      requestingLeave: false,
      // Most recent EmployeeOnboarding for the profile being viewed (with
      // its tasks nested - see EmployeeOnboardingSerializer), or null if
      // none was ever started. Only one active (in_progress) onboarding
      // can exist per employee (hr/services/onboarding_service.py), so
      // "most recent" is enough - no list needed here.
      onboarding: null,
      loadingOnboarding: false,
      onboardingActionLoading: false,
    }),

    getters: {
      // Display-only aggregation of already-fetched, backend-authoritative
      // ledger rows (pedido secção 129: frontend represents, never decides -
      // the real balance check that blocks a request lives in
      // hr/services/leave_service.py, this just sums what the API returned).
      leaveBalances: (state) => {
        const totals = {}

        state.leaveBalanceEntries.forEach((entry) => {
          const id = entry.leave_type
          if (!totals[id]) {
            totals[id] = { leave_type_id: id, leave_type_name: entry.leave_type_data?.label || '', balance: 0 }
          }
          totals[id].balance += Number(entry.amount) || 0
        })

        return Object.values(totals)
      },
    },

    actions: {
      // Loaded on demand by EmployeeProfilePage's Contract tab - not part
      // of the Employee payload itself, so opening the profile never pulls
      // contract history the viewer may never look at.
      async loadContracts(employeeId) {
        if (!employeeId) return

        this.loadingContracts = true

        try {
          const { data } = await HTTPAuth.get(
            url({
              type: 'u',
              url: 'hr/contracts/',
              params: { employee: employeeId }
            })
          )

          this.contracts = data?.results ?? data ?? []
        } finally {
          this.loadingContracts = false
        }
      },

      // Loaded on demand by EmployeeProfilePage's Attendance tab, same
      // pattern as loadContracts above.
      async loadAttendances(employeeId) {
        if (!employeeId) return

        this.loadingAttendances = true

        try {
          const { data } = await HTTPAuth.get(
            url({
              type: 'u',
              url: 'hr/attendances/',
              params: { employee: employeeId }
            })
          )

          this.attendances = data?.results ?? data ?? []
        } finally {
          this.loadingAttendances = false
        }
      },

      // check_in/check_out are @resaas_action endpoints on
      // EmployeeAPIView (hr/views/employee.py), not generic CRUD - the
      // backend computes worked/late/overtime/early_departure minutes,
      // this just calls them and refreshes the attendance list.
      async checkIn(employeeId, source) {
        if (!employeeId) return

        this.checkingInOut = true

        try {
          await HTTPAuth.post(
            url({ type: 'u', url: `hr/employees/${employeeId}/check_in/` }),
            source ? { source } : {}
          )
          await this.loadAttendances(employeeId)
        } finally {
          this.checkingInOut = false
        }
      },

      async checkOut(employeeId) {
        if (!employeeId) return

        this.checkingInOut = true

        try {
          await HTTPAuth.post(
            url({ type: 'u', url: `hr/employees/${employeeId}/check_out/` })
          )
          await this.loadAttendances(employeeId)
        } finally {
          this.checkingInOut = false
        }
      },

      // Loaded on demand by EmployeeProfilePage's Leave tab - own request
      // history + ledger, same on-demand pattern as loadContracts/
      // loadAttendances above.
      async loadLeave(employeeId) {
        if (!employeeId) return

        this.loadingLeave = true

        try {
          const [requests, entries] = await Promise.all([
            HTTPAuth.get(url({
              type: 'u', url: 'hr/leaverequests/', params: { employee: employeeId, page_size: 50 }
            })),
            HTTPAuth.get(url({
              type: 'u', url: 'hr/leavebalanceentries/', params: { employee: employeeId, page_size: 200 }
            })),
          ])

          this.leaveRequests = requests.data?.results ?? requests.data ?? []
          this.leaveBalanceEntries = entries.data?.results ?? entries.data ?? []
        } finally {
          this.loadingLeave = false
        }
      },

      // Creates the LeaveRequest (DRAFT) then immediately submits it
      // (DRAFT -> PENDING) - hr/services/leave_service.py computes `days`
      // and checks the balance/overlap only at submit time, so the caller
      // never has to duplicate that logic here.
      async requestLeave(employeeId, payload) {
        this.requestingLeave = true

        try {
          const { data } = await HTTPAuth.post(
            url({ type: 'u', url: 'hr/leaverequests/' }),
            { employee: employeeId, ...payload }
          )

          await HTTPAuth.post(
            url({ type: 'u', url: `hr/leaverequests/${data.id}/submit/` })
          )

          await this.loadLeave(employeeId)
        } finally {
          this.requestingLeave = false
        }
      },

      async cancelLeaveRequest(employeeId, leaveRequestId) {
        this.requestingLeave = true

        try {
          await HTTPAuth.post(
            url({ type: 'u', url: `hr/leaverequests/${leaveRequestId}/cancel/` })
          )
          await this.loadLeave(employeeId)
        } finally {
          this.requestingLeave = false
        }
      },

      // Loaded on demand by EmployeeProfilePage's Onboarding tab - same
      // on-demand pattern as loadContracts/loadAttendances/loadLeave.
      // The API's default ordering (`-created_at`) means the first row is
      // always the most recent onboarding for this employee.
      async loadOnboarding(employeeId) {
        if (!employeeId) return

        this.loadingOnboarding = true

        try {
          const { data } = await HTTPAuth.get(url({
            type: 'u',
            url: 'hr/employeeonboardings/',
            params: { employee: employeeId, page_size: 1 }
          }))

          const rows = data?.results ?? data ?? []
          this.onboarding = rows[0] || null
        } finally {
          this.loadingOnboarding = false
        }
      },

      // start_onboarding is a @resaas_action on EmployeeAPIView (hr/views/
      // employee.py) - it creates the EmployeeOnboarding AND copies the
      // template's tasks onto it server-side, never a generic POST here
      // (hr/views/employee_onboarding.py blocks that outright).
      async startOnboarding(employeeId, templateId) {
        this.onboardingActionLoading = true

        try {
          await HTTPAuth.post(
            url({ type: 'u', url: `hr/employees/${employeeId}/start_onboarding/` }),
            templateId ? { template: templateId } : {}
          )
          await this.loadOnboarding(employeeId)
        } finally {
          this.onboardingActionLoading = false
        }
      },

      async completeOnboardingTask(employeeId, taskId) {
        this.onboardingActionLoading = true

        try {
          await HTTPAuth.post(
            url({ type: 'u', url: `hr/employeeonboardingtasks/${taskId}/complete/` })
          )
          await this.loadOnboarding(employeeId)
        } finally {
          this.onboardingActionLoading = false
        }
      },

      async reopenOnboardingTask(employeeId, taskId) {
        this.onboardingActionLoading = true

        try {
          await HTTPAuth.post(
            url({ type: 'u', url: `hr/employeeonboardingtasks/${taskId}/reopen/` })
          )
          await this.loadOnboarding(employeeId)
        } finally {
          this.onboardingActionLoading = false
        }
      },

      async completeOnboarding(employeeId, onboardingId) {
        this.onboardingActionLoading = true

        try {
          await HTTPAuth.post(
            url({ type: 'u', url: `hr/employeeonboardings/${onboardingId}/complete/` })
          )
          await this.loadOnboarding(employeeId)
        } finally {
          this.onboardingActionLoading = false
        }
      },

      async cancelOnboarding(employeeId, onboardingId) {
        this.onboardingActionLoading = true

        try {
          await HTTPAuth.post(
            url({ type: 'u', url: `hr/employeeonboardings/${onboardingId}/cancel/` })
          )
          await this.loadOnboarding(employeeId)
        } finally {
          this.onboardingActionLoading = false
        }
      },
    }
  }
)
