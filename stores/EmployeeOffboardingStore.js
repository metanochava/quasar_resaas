import { createBaseStore } from '../base/base_store'

// Plain generic store (list/getById via BaseStore) - creation deliberately
// stays out of this store's actions: it only ever happens through
// EmployeeStore.startOffboarding(), which calls the dedicated
// start_offboarding action on EmployeeAPIView (hr/views/employee.py). A
// generic POST here is blocked server-side too (hr/views/
// employee_offboarding.py).
export const useEmployeeOffboardingStore = createBaseStore(
  'employeeoffboarding',
  {
    app: 'hr',
    model: 'EmployeeOffboarding'
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
