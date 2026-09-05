import { createBaseStore } from '../base/base_store'

// Plain generic store (list/getById via BaseStore) - creation deliberately
// stays out of this store's actions: it only ever happens through
// EmployeeStore.terminateEmployee(), which calls the dedicated
// terminate_employee action on EmployeeAPIView (hr/views/employee.py). A
// generic POST here is blocked server-side too (hr/views/termination.py).
export const useTerminationStore = createBaseStore(
  'termination',
  {
    app: 'hr',
    model: 'Termination'
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
