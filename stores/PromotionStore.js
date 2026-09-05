import { createBaseStore } from '../base/base_store'

// Plain generic store (list/getById via BaseStore) - creation deliberately
// stays out of this store's actions: it only ever happens through
// EmployeeStore.applyPromotion(), which calls the dedicated
// apply_promotion action on EmployeeAPIView (hr/views/employee.py). A
// generic POST here is blocked server-side too (hr/views/promotion.py).
export const usePromotionStore = createBaseStore(
  'promotion',
  {
    app: 'hr',
    model: 'Promotion'
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
