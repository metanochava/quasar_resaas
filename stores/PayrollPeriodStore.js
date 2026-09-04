import { createBaseStore } from '../base/base_store'
import { HTTPAuth, url } from '../services/api'

export const usePayrollPeriodStore = createBaseStore(
  'payrollperiod',
  {
    app: 'hr',
    model: 'PayrollPeriod'
  },
  {
    state: () => ({
      generating: false,
    }),

    getters: {

    },

    actions: {
      // Period -> Generate step (pedido secção 78): creates/recalculates
      // one Payroll per active employee of the period - see
      // hr/services/payroll_service.generate_payroll_for_period. Returns
      // the resulting Payroll rows for PayrollRunPage.vue to render.
      async generate(periodId) {
        this.generating = true

        try {
          const { data } = await HTTPAuth.post(
            url({ type: 'u', url: `hr/payrollperiods/${periodId}/generate/` })
          )
          return data
        } finally {
          this.generating = false
        }
      },
    }
  }
)
