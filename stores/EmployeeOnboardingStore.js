import { createBaseStore } from '../base/base_store'

// Plain generic store (list/getById via BaseStore) - creation deliberately
// stays out of this store's actions: it only ever happens through
// EmployeeStore.startOnboarding(), which calls the dedicated
// start_onboarding action on EmployeeAPIView (hr/views/employee.py). A
// generic POST here is blocked server-side too (see
// hr/views/employee_onboarding.py).
export const useEmployeeOnboardingStore = createBaseStore(
  'employeeonboarding',
  {
    app: 'hr',
    model: 'EmployeeOnboarding'
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
