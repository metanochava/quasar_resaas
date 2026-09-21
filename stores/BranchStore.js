import { createBaseStore } from '../base/base_store'
import { HTTPAuth, url } from '../services/api'
import { useUserStore } from './UserStore'
import { getStorage, setStorage } from '../services/storage'
import { useGroupStore } from './GroupStore'
import { profileSplint } from '../utils/profile'
import { tdc } from '../services/translation'
import { sDialog } from '../services/dialog'

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

        const User =
          useUserStore()

        const res =
          await HTTPAuth.get(
            url({
              type: 'u',
              url:
                'django_resaas/users/' +
                User.data?.id +
                '/userBranchs/',
              params: {}
            })
          )

        setStorage(
          'l',
          'userBranchs',
          JSON.stringify(res.data)
        )

        if (
          res.data.length === 1
        ) {

          // AGUARDA BRANCH → GROUP → PERMISSIONS
          await this.select_(
            res.data[0],
            q
          )

        } else {

          if (
            res.data.length === 0
          ) {

            User.redirect =
              'authwelcome'

            return res
          }

          const branchs = []

          res.data.forEach(
            element => {

              branchs.push({
                label:
                  profileSplint(
                    element.name
                  ),

                value:
                  element
              })

            }
          )

          sDialog({
            title:
              tdc(
                'Select the Branch'
              ),

            options: {
              type: 'radio',
              model: 'opt1',
              isValid:
                val => true,
              items:
                branchs
            },

            cancel: true,
            persistent: true

          }).onOk(
            async data => {

              await this.select_(
                data,
                q
              )

            }
          ).onCancel(
            () => {

              User.redirect =
                'authwelcome'

            }
          )
        }

        return res
      },

      async select_ (branch, q) {

        const User =
          useUserStore()

        const Group =
          useGroupStore()

        this.row =
          branch

        User.Branch =
          this.row

        setStorage(
          'l',
          'userBranch',
          JSON.stringify(branch)
        )

        await User.selectContext({
          entity:
            User.Entity,

          branch:
            User.Branch,

          group:
            null
        })

        // AGORA AGUARDA GRUPOS/PERMISSÕES
        await Group.getGroups_(q)
      },

      async select (branch) {

        const User =
          useUserStore()

        const Group =
          useGroupStore()

        this.row =
          branch

        User.Branch =
          this.row

        setStorage(
          'l',
          'userBranch',
          JSON.stringify(branch)
        )

        await User.selectContext({
          entity:
            User.Entity,

          branch:
            User.Branch,

          group:
            null
        })

        await Group.getGroups()
      },

      async getUserBranchs() {

        const User =
          useUserStore()

        if (
          getStorage(
            'l',
            'userEntity'
          ) !== null
        ) {

          const rsp =
            await HTTPAuth.get(
              url({
                type: 'u',
                url:
                  'django_resaas/users/' +
                  User.data?.id +
                  '/userBranchs/',
                params: {}
              })
            )
              .then(
                res => {

                  this.row =
                    {}

                  setStorage(
                    'l',
                    'userBranch',
                    JSON.stringify({})
                  )

                  setStorage(
                    'l',
                    'userBranchs',
                    JSON.stringify(
                      res.data
                    )
                  )

                  this.rows =
                    res.data

                  User.Branchs =
                    this.rows
                }
              )

          return rsp
        }
      }
    }
  }
)