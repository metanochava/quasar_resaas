import { createBaseStore } from '../base/base_store'

// Plain generic store (list/getById via BaseStore) - creation deliberately
// stays out of this store's actions: it only ever happens through
// EmployeeStore.applyTransfer(), which calls the dedicated apply_transfer
// action on EmployeeAPIView (hr/views/employee.py). A generic POST here
// is blocked server-side too (hr/views/transfer.py).
export const useTransferStore = createBaseStore(
  'transfer',
  {
    app: 'hr',
    model: 'Transfer'
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
