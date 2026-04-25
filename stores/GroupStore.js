import { createBaseStore } from '../base/base_store'
import { HTTPAuth, url } from '../boot/api'
import { useUserStore} from './UserStore'
import { getStorage, setStorage } from '../boot/storage'
import { perfilSplint, tdc } from '../boot/base'


export const useGroupStore = createBaseStore(
  'groups',
  {
    url: 'api/django_resaas/groups',
    app: 'django_resaas',
    model: 'Groups'
  },

  {
    state: () => ({
      Permissions: new Set()
    }),

    getters: {
      can: (state) => (perm) =>
        state.Permissions.has(String(perm).toLowerCase())
    },

    actions: {

      async select_ (group) {
        const User = useUserStore()
        this.row = group
        User.Groups = this.row
        setStorage('l', 'userGroups', JSON.stringify(group))
        await this.getPermissions()
        await User.getMenus()
        User.redirect = 'authwelcome'
      },


      async select (groups) {
        const User = useUserStore()
        setStorage('l', 'userGroups', JSON.stringify(groups))
        this.row = groups
        User.Groups = this.row
        await this.getPermissions()
        await User.getMenus()
      },

      async getGroups () {
        const User = useUserStore()
        const res = await HTTPAuth.get(
          url({ type: 'u', url: `api/django_resaas/users/${User.data?.id}/userGroups/`, params: {} })
        )

        setStorage('l', 'userGroups', JSON.stringify(res.data))
        this.rows = res.data
        User.Groups = this.rows

        if (res.data.length === 1) {
          this.select(res.data[0])
        }
        return res
      },

      async getGroups_ (q) {
        const User = useUserStore()

        const res = await HTTPAuth.get(
          url({ type: 'u', url: `api/django_resaas/users/${User.data?.id}/userGroups/`, params: {} })
        )
        setStorage('l', 'userGroups', JSON.stringify(res.data))
        this.rows = res.data
        User.Groups = this.rows

        if (res.data.length === 1) {
          this.select_(res.data[0])
        }else{
          if (res.data.length === 0) {
            User.redirect = 'authwelcome'
            return
          }
          const groups = []
          res.data.forEach(element => {
            groups.push({ label: perfilSplint(element.name), value: element })
          })
          q.dialog({
            title: tdc('Seleccione o Groups'),
            options: {
              type: 'radio',
              model: 'opt1',
              isValid: val => true,
              items: groups
            },
            cancel: true,
            persistent: true
          }).onOk(data => {
            this.select_(data)
          }).onCancel(() => {
            User.redirect = 'authwelcome'
          })
        }
        return res
      },
      
      async getPermissions() {

        const User = useUserStore()

        const { data } = await HTTPAuth.get(
          url({ type: 'u', url: `api/django_resaas/groups/${User.data?.id}/permissions/` })
        )

        const Permissions = (data || []).map(p => p.codename)
  
        User.Permissions = new Set(Permissions)

        console.log(User.Permissions)

        console.log(Permissions)
        setStorage('l', 'userPermissions', JSON.stringify(Permissions))

      }

      
    }
  }
)