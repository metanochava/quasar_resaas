import { createBaseStore } from '../base/base_store'

export const useJobPositionStore = createBaseStore(
  'jobposition',
  {
    app: 'hr',
    model: 'JobPosition'
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
