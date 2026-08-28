import { createBaseStore } from '../base/base_store'

export const usePayrollStore = createBaseStore(
  'payroll',
  {
    app: 'hr',
    model: 'Payroll'
  },
  {
    state: () => ({

    }),

    getters: {

    },

    actions: {

    }
  }
)
