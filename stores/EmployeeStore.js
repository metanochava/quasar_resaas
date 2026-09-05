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
      goals: [],
      reviews: [],
      loadingPerformance: false,
      performanceActionLoading: false,
      trainings: [],
      certifications: [],
      loadingTraining: false,
      addingCertification: false,
      payrolls: [],
      currentSalary: null,
      loadingPayroll: false,
      // Fase 9 (Employee Lifecycle) - History tab.
      promotions: [],
      transfers: [],
      resignations: [],
      terminations: [],
      disciplinaryCases: [],
      // Most recent EmployeeOffboarding, same "only one active at a time"
      // reasoning as `onboarding` above.
      offboarding: null,
      loadingHistory: false,
      lifecycleActionLoading: false,
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

      // Loaded on demand by EmployeeProfilePage's Performance tab - same
      // on-demand pattern as loadContracts/loadAttendances/loadLeave/
      // loadOnboarding. Goals/reviews only change through
      // updateGoalProgress/submitReview below (backend enforces this via
      // read-only fields - hr/serializers/employee_goal.py,
      // hr/serializers/performance_review.py), never a free PATCH here.
      async loadPerformance(employeeId) {
        if (!employeeId) return

        this.loadingPerformance = true

        try {
          const [goalsRes, reviewsRes] = await Promise.all([
            HTTPAuth.get(url({
              type: 'u', url: 'hr/employeegoals/', params: { employee: employeeId }
            })),
            HTTPAuth.get(url({
              type: 'u', url: 'hr/performancereviews/', params: { employee: employeeId }
            })),
          ])

          this.goals = goalsRes.data?.results ?? goalsRes.data ?? []
          this.reviews = reviewsRes.data?.results ?? reviewsRes.data ?? []
        } finally {
          this.loadingPerformance = false
        }
      },

      async updateGoalProgress(employeeId, goalId, progress, newStatus) {
        this.performanceActionLoading = true

        try {
          const payload = { progress }
          if (newStatus) payload.status = newStatus

          await HTTPAuth.post(
            url({ type: 'u', url: `hr/employeegoals/${goalId}/update_progress/` }),
            payload
          )
          await this.loadPerformance(employeeId)
        } finally {
          this.performanceActionLoading = false
        }
      },

      async submitReview(employeeId, reviewId) {
        this.performanceActionLoading = true

        try {
          await HTTPAuth.post(
            url({ type: 'u', url: `hr/performancereviews/${reviewId}/submit_review/` })
          )
          await this.loadPerformance(employeeId)
        } finally {
          this.performanceActionLoading = false
        }
      },

      // Loaded on demand by EmployeeProfilePage's Training tab, same
      // on-demand pattern as loadContracts/loadAttendances/loadLeave/
      // loadOnboarding/loadPerformance. Enrollment happens through
      // TrainingSessionStore.enroll (hr/trainingsessions/{id}/enroll/) -
      // this only reads what the employee is already enrolled in/holds.
      async loadTraining(employeeId) {
        if (!employeeId) return

        this.loadingTraining = true

        try {
          const [trainingsRes, certsRes] = await Promise.all([
            HTTPAuth.get(url({
              type: 'u', url: 'hr/employeetrainings/', params: { employee: employeeId }
            })),
            HTTPAuth.get(url({
              type: 'u', url: 'hr/certifications/', params: { employee: employeeId }
            })),
          ])

          this.trainings = trainingsRes.data?.results ?? trainingsRes.data ?? []
          this.certifications = certsRes.data?.results ?? certsRes.data ?? []
        } finally {
          this.loadingTraining = false
        }
      },

      async addCertification(employeeId, payload) {
        this.addingCertification = true

        try {
          await HTTPAuth.post(
            url({ type: 'u', url: 'hr/certifications/' }),
            { ...payload, employee: employeeId }
          )
          await this.loadTraining(employeeId)
        } finally {
          this.addingCertification = false
        }
      },

      // Loaded on demand by EmployeeProfilePage's Payroll tab, same
      // on-demand pattern as loadContracts/.../loadTraining. Payslip
      // generation/confirmation only happens through PayrollRunPage.vue
      // (hr/services/payroll_service.py) - this only reads history.
      async loadPayroll(employeeId) {
        if (!employeeId) return

        this.loadingPayroll = true

        try {
          const [payrollsRes, salaryRes] = await Promise.all([
            HTTPAuth.get(url({
              type: 'u', url: 'hr/payrolls/', params: { employee: employeeId, page_size: 50 }
            })),
            HTTPAuth.get(url({
              type: 'u', url: 'hr/employeesalaries/',
              params: { employee: employeeId, is_active: true, page_size: 1 }
            })),
          ])

          this.payrolls = payrollsRes.data?.results ?? payrollsRes.data ?? []

          const salaries = salaryRes.data?.results ?? salaryRes.data ?? []
          this.currentSalary = salaries[0] || null
        } finally {
          this.loadingPayroll = false
        }
      },

      // =========================
      // LIFECYCLE (Fase 9) - History tab
      // =========================
      // Loaded on demand by EmployeeProfilePage's History tab, same
      // on-demand pattern as every other tab above. DisciplinaryCase is
      // sensitive (pedido secção 41) - a 403 here (viewer lacks
      // view_disciplinarycase, even though they can see the Employee
      // itself) is expected and just leaves the list empty, never surfaced
      // as an error to the viewer.
      async loadHistory(employeeId) {
        if (!employeeId) return

        this.loadingHistory = true

        try {
          const [promotionsRes, transfersRes, resignationsRes, terminationsRes, offboardingRes] =
            await Promise.all([
              HTTPAuth.get(url({ type: 'u', url: 'hr/promotions/', params: { employee: employeeId } })),
              HTTPAuth.get(url({ type: 'u', url: 'hr/transfers/', params: { employee: employeeId } })),
              HTTPAuth.get(url({ type: 'u', url: 'hr/resignations/', params: { employee: employeeId } })),
              HTTPAuth.get(url({ type: 'u', url: 'hr/terminations/', params: { employee: employeeId } })),
              HTTPAuth.get(url({
                type: 'u', url: 'hr/employeeoffboardings/', params: { employee: employeeId, page_size: 1 },
              })),
            ])

          this.promotions = promotionsRes.data?.results ?? promotionsRes.data ?? []
          this.transfers = transfersRes.data?.results ?? transfersRes.data ?? []
          this.resignations = resignationsRes.data?.results ?? resignationsRes.data ?? []
          this.terminations = terminationsRes.data?.results ?? terminationsRes.data ?? []

          const offboardingRows = offboardingRes.data?.results ?? offboardingRes.data ?? []
          this.offboarding = offboardingRows[0] || null

          try {
            const { data } = await HTTPAuth.get(url({
              type: 'u', url: 'hr/disciplinarycases/', params: { employee: employeeId },
            }))
            this.disciplinaryCases = data?.results ?? data ?? []
          } catch (e) {
            // Sensitive endpoint - a 403 here just means this viewer has no
            // access to disciplinary records, not an error worth surfacing.
            this.disciplinaryCases = []
          }
        } finally {
          this.loadingHistory = false
        }
      },

      async applyPromotion(employeeId, payload) {
        this.lifecycleActionLoading = true

        try {
          await HTTPAuth.post(
            url({ type: 'u', url: `hr/employees/${employeeId}/apply_promotion/` }),
            payload
          )
          await this.loadHistory(employeeId)
        } finally {
          this.lifecycleActionLoading = false
        }
      },

      async applyTransfer(employeeId, payload) {
        this.lifecycleActionLoading = true

        try {
          await HTTPAuth.post(
            url({ type: 'u', url: `hr/employees/${employeeId}/apply_transfer/` }),
            payload
          )
          await this.loadHistory(employeeId)
        } finally {
          this.lifecycleActionLoading = false
        }
      },

      // Submitting is plain CRUD create (hr/models/resignation.py) - only
      // accept/withdraw below are workflow actions.
      async submitResignation(employeeId, payload) {
        this.lifecycleActionLoading = true

        try {
          await HTTPAuth.post(
            url({ type: 'u', url: 'hr/resignations/' }),
            { ...payload, employee: employeeId }
          )
          await this.loadHistory(employeeId)
        } finally {
          this.lifecycleActionLoading = false
        }
      },

      async acceptResignation(employeeId, resignationId) {
        this.lifecycleActionLoading = true

        try {
          await HTTPAuth.post(
            url({ type: 'u', url: `hr/resignations/${resignationId}/accept/` })
          )
          await this.loadHistory(employeeId)
        } finally {
          this.lifecycleActionLoading = false
        }
      },

      async withdrawResignation(employeeId, resignationId) {
        this.lifecycleActionLoading = true

        try {
          await HTTPAuth.post(
            url({ type: 'u', url: `hr/resignations/${resignationId}/withdraw/` })
          )
          await this.loadHistory(employeeId)
        } finally {
          this.lifecycleActionLoading = false
        }
      },

      async terminateEmployee(employeeId, payload) {
        this.lifecycleActionLoading = true

        try {
          await HTTPAuth.post(
            url({ type: 'u', url: `hr/employees/${employeeId}/terminate_employee/` }),
            payload
          )
          await this.loadHistory(employeeId)
        } finally {
          this.lifecycleActionLoading = false
        }
      },

      async startOffboarding(employeeId) {
        this.lifecycleActionLoading = true

        try {
          await HTTPAuth.post(
            url({ type: 'u', url: `hr/employees/${employeeId}/start_offboarding/` })
          )
          await this.loadHistory(employeeId)
        } finally {
          this.lifecycleActionLoading = false
        }
      },

      async completeOffboardingTask(employeeId, taskId) {
        this.lifecycleActionLoading = true

        try {
          await HTTPAuth.post(
            url({ type: 'u', url: `hr/employeeoffboardingtasks/${taskId}/complete/` })
          )
          await this.loadHistory(employeeId)
        } finally {
          this.lifecycleActionLoading = false
        }
      },

      async reopenOffboardingTask(employeeId, taskId) {
        this.lifecycleActionLoading = true

        try {
          await HTTPAuth.post(
            url({ type: 'u', url: `hr/employeeoffboardingtasks/${taskId}/reopen/` })
          )
          await this.loadHistory(employeeId)
        } finally {
          this.lifecycleActionLoading = false
        }
      },

      async completeOffboarding(employeeId, offboardingId) {
        this.lifecycleActionLoading = true

        try {
          await HTTPAuth.post(
            url({ type: 'u', url: `hr/employeeoffboardings/${offboardingId}/complete/` })
          )
          await this.loadHistory(employeeId)
        } finally {
          this.lifecycleActionLoading = false
        }
      },

      async cancelOffboarding(employeeId, offboardingId) {
        this.lifecycleActionLoading = true

        try {
          await HTTPAuth.post(
            url({ type: 'u', url: `hr/employeeoffboardings/${offboardingId}/cancel/` })
          )
          await this.loadHistory(employeeId)
        } finally {
          this.lifecycleActionLoading = false
        }
      },

      // Disciplinary is sensitive (pedido secção 41/59) - kept out of the
      // generic AutoCrud surface, only reachable from this tab.
      async addDisciplinaryCase(employeeId, payload) {
        this.lifecycleActionLoading = true

        try {
          await HTTPAuth.post(
            url({ type: 'u', url: 'hr/disciplinarycases/' }),
            { ...payload, employee: employeeId }
          )
          await this.loadHistory(employeeId)
        } finally {
          this.lifecycleActionLoading = false
        }
      },

      async addDisciplinaryAction(employeeId, caseId, payload) {
        this.lifecycleActionLoading = true

        try {
          await HTTPAuth.post(
            url({ type: 'u', url: 'hr/disciplinaryactions/' }),
            { ...payload, case: caseId }
          )
          await this.loadHistory(employeeId)
        } finally {
          this.lifecycleActionLoading = false
        }
      },
    }
  }
)
