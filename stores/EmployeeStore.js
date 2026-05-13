import { createBaseStore } from '../base/base_store'
import { HTTPAuth, HTTPClient, url } from '../boot/api'
import { useBranchStore } from './BranchStore'
import { useUserStore } from './UserStore'
import { perfilSplint, tdc } from '../boot/base'
import { getStorage, setStorage } from '../boot/storage'

export const useEmployeeStore = createBaseStore(
  'employee',
  {
    app: 'django_resaas',
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
