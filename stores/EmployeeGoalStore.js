import { createBaseStore } from '../base/base_store'

export const useEmployeeGoalStore = createBaseStore(
  'employeegoal',
  {
    app: 'hr',
    model: 'EmployeeGoal'
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
