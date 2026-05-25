

// import { HTTPAuth, url } from '../boot/api'
import { createBaseStore } from '../base/base_store'


export const usePersonStore = createBaseStore(
  'person',
  { app: 'django_resaas', model: 'Person' },
  {
    state: () => ({

    }),

    getters: {
      actual: (state) => state.row,
    },

    actions: {
      
    },

    hooks: {
      beforeLoad() {

      },

      afterLoad(data) {
        data
      },

      beforeCreate(form) {
        form
      }
    }
  }
)
