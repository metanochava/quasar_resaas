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
    }),

    getters: {

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
    }
  }
)
