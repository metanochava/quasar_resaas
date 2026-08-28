import { createBaseStore } from '../base/base_store'

export const useAttendanceStore = createBaseStore(
  'attendance',
  {
    app: 'hr',
    model: 'Attendance'
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
