import { createBaseStore } from '../base/base_store'
import { HTTPAuth, url } from '../services/api'
import { useUserStore } from './UserStore'
import { setStorage } from '../services/storage'
import { profileSplint } from '../utils/profile'
import { tdc } from '../services/translation'
import { sDialog } from '../services/dialog'


export const useGroupStore = createBaseStore(
  'groups',

  {
    app: 'auth',
    model: 'Group'
  },

  {
    state: () => ({
      Permissions: []
    }),

    getters: {},

    actions: {

      // ======================================================
      // SELECT _
      // ======================================================

      async select_ (group) {

        const User =
          useUserStore()

        this.row =
          group

        User.Group =
          this.row


        // Grupo seleccionado
        setStorage(
          'l',
          'userGroup',
          JSON.stringify(group)
        )


        await User.selectContext({
          entity:
            User.Entity,

          branch:
            User.Branch,

          group:
            User.Group
        })


        await this.getUserPermissions()


        await User.getMenus()


        User.redirect =
          'authwelcome'
      },


      // ======================================================
      // SELECT
      // ======================================================

      async select (group) {

        const User =
          useUserStore()


        setStorage(
          'l',
          'userGroup',
          JSON.stringify(group)
        )


        this.row =
          group


        User.Group =
          this.row


        await User.selectContext({
          entity:
            User.Entity,

          branch:
            User.Branch,

          group:
            User.Group
        })


        await this.getUserPermissions()


        await User.getMenus()
      },


      // ======================================================
      // GET GROUPS
      // ======================================================

      async getGroups () {

        const User =
          useUserStore()


        const res =
          await HTTPAuth.get(
            url({
              type: 'u',

              url:
                `django_resaas/users/${User.data?.id}/userGroups/`,

              params: {}
            })
          )


        // Lista completa de grupos
        setStorage(
          'l',
          'userGroups',
          JSON.stringify(res.data)
        )


        this.rows =
          res.data


        User.Groups =
          this.rows


        // Se existir apenas um grupo,
        // selecciona automaticamente
        if (
          res.data.length === 1
        ) {

          await this.select(
            res.data[0]
          )

        }


        return res
      },


      // ======================================================
      // GET GROUPS _
      // ======================================================

      async getGroups_ (q) {

        const User =
          useUserStore()


        const res =
          await HTTPAuth.get(
            url({
              type: 'u',

              url:
                `django_resaas/users/${User.data?.id}/userGroups/`,

              params: {}
            })
          )


        // Lista completa de grupos
        setStorage(
          'l',
          'userGroups',
          JSON.stringify(res.data)
        )


        this.rows =
          res.data


        User.Groups =
          this.rows


        // ====================================================
        // APENAS UM GRUPO
        // ====================================================

        if (
          res.data.length === 1
        ) {

          await this.select_(
            res.data[0]
          )

        }


        // ====================================================
        // VÁRIOS GRUPOS
        // ====================================================

        else {

          if (
            res.data.length === 0
          ) {

            User.redirect =
              'authwelcome'

            return res
          }


          const groups =
            []


          res.data.forEach(
            element => {

              groups.push({
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
                'Select the Groups'
              ),

            options: {
              type:
                'radio',

              model:
                'opt1',

              isValid:
                val => true,

              items:
                groups
            },

            cancel:
              true,

            persistent:
              true

          }).onOk(
            async data => {

              await this.select_(
                data
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


      // ======================================================
      // USER PERMISSIONS
      // ======================================================

      async getUserPermissions() {

        const User =
          useUserStore()


        const { data } =
          await HTTPAuth.get(
            url({
              type:
                'u',

              url:
                `django_resaas/users/${User.data?.id}/permissions/`
            })
          )


        const Permissions =
          (data || []).map(
            p =>
              p.codename
          )


        User.Permissions =
          new Set(
            Permissions
          )


        setStorage(
          'l',
          'userPermissions',
          JSON.stringify(
            Permissions
          )
        )

      }

    }

  }

)