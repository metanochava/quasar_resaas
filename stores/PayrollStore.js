import { createBaseStore } from '../base/base_store'
import { HTTPAuth, url } from '../services/api'

// Payroll keeps the standard generic CRUD (list/view/edit forms - see
// PayrollLPage/SEPage/VPage.vue) but the actual Period -> Generate ->
// Review -> Confirm workflow (pedido secção 78) lives in the custom
// PayrollRunPage.vue, which uses these workflow-action helpers instead of
// a generic PATCH (see hr/services/payroll_service.py - status/totals are
// read_only on the API, only these actions can move them).
export const usePayrollStore = createBaseStore(
  'payroll',
  {
    app: 'hr',
    model: 'Payroll'
  },
  {
    state: () => ({
      actionLoading: false,
    }),

    getters: {

    },

    actions: {
      async runAction(payrollId, action) {
        this.actionLoading = true

        try {
          const { data } = await HTTPAuth.post(
            url({ type: 'u', url: `hr/payrolls/${payrollId}/${action}/` })
          )
          return data
        } finally {
          this.actionLoading = false
        }
      },

      calculate(payrollId) {
        return this.runAction(payrollId, 'calculate')
      },

      review(payrollId) {
        return this.runAction(payrollId, 'review')
      },

      reopen(payrollId) {
        return this.runAction(payrollId, 'reopen')
      },

      confirm(payrollId) {
        return this.runAction(payrollId, 'confirm')
      },

      markPaid(payrollId) {
        return this.runAction(payrollId, 'mark_paid')
      },

      cancel(payrollId) {
        return this.runAction(payrollId, 'cancel')
      },
    }
  }
)
