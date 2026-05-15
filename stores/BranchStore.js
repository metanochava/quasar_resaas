import { createBaseStore } from '../base/base_store'
import { HTTPAuth, url } from '../boot/api'
import { getStorage, setStorage } from '../boot/storage'
import { useUserStore} from './UserStore'
import { useGroupStore} from './GroupStore'
import { profileSplint, tdc } from '../boot/base'


export const useBranchStore = createBaseStore(
  'branch',
  {
    app: 'django_resaas',
    model: 'Branch'
  },

  {
    state: () => ({

    }),

    actions: {

      async getUserBranchs_ (q) {
        const User = useUserStore()
        await HTTPAuth.get(url({ type: 'u', url: 'django_resaas/users/' + User.data?.id + '/userBranchs/', params: { } }))
          .then(async res => {
            setStorage('l', 'userBranchs', JSON.stringify(res.data))

            if (res.data.length === 1) {
              this.select_(res.data[0], q)
            } else {
              if (res.data.length === 0) {

                User.redirect = 'authwelcome'
                return
              }
              const branchs = []
              res.data.forEach(element => {
                branchs.push({ label: profileSplint(element.name), value: element })
              })
              q.dialog({
                title: tdc('Seleccione a Branch'),
                options: {
                  type: 'radio',
                  model: 'opt1',
                  isValid: val => true,
                  items: branchs
                },
                cancel: true,
                persistent: true
              }).onOk(data => {
                this.select_(data, q)
              }).onCancel(() => {
                User.redirect = 'authwelcome'
              })
            }
          })
      },

      select_ (branch, q) {
        const User = useUserStore()
        let Group = useGroupStore()
        this.row = branch
        User.Branch = this.row
        setStorage('l', 'userBranch', JSON.stringify(branch))
        Group.getGroups_(q)
      },

      select (branch) {
        const User = useUserStore()
        let Group = useGroupStore()
        this.row = branch
        User.Branch = this.row
        setStorage('l', 'userBranch', JSON.stringify(branch))
        Group.getGroups()
      },

      async getUserBranchs() {
        const User = useUserStore()
        if (getStorage('l', 'userEntity') !== null) {
          const rsp = await HTTPAuth.get(url({ type: 'u', url: 'django_resaas/users/' + User.data?.id + '/userBranchs/', params: { } }))
            .then(res => {
              this.row = {}
              setStorage('l', 'userBranch', JSON.stringify({}))
              setStorage('l', 'userBranchs', JSON.stringify(res.data))
              this.rows = res.data
              User.Branchs = this.rows
            })
          return rsp
        }
      },
    }
  }
)

