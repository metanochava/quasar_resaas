import { createBaseStore } from '../base/base_store'

export const useEmployeeSalaryStore = createBaseStore(
  'employeesalary',
  {
    app: 'hr',
    model: 'EmployeeSalary'
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
