import { createBaseStore } from '../base/base_store'

export const useEmployeeShiftStore = createBaseStore(
  'employeeshift',
  {
    app: 'hr',
    model: 'EmployeeShift'
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
