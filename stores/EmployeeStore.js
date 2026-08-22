import { createBaseStore } from '../base/base_store'
import { HTTPAuth, HTTPClient, url } from '../services/api'
import { useBranchStore } from './BranchStore'
import { useUserStore } from './UserStore'
import { profileSplint, tdc } from '../services/base'
import { getStorage, setStorage } from '../services/storage'

export const useEmployeeStore = createBaseStore(
  'employee',
  {
    app: 'hr',
    model: 'Employee'
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
