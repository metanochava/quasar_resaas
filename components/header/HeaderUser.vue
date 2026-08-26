<template>
  <div class="header-user">
    <!-- REGISTAR ENTIDADE -->
    <q-dialog v-model="showRegisterEntity" persistent>
      <RegisterEntity />
    </q-dialog>

    <!-- CONFIRMAÇÃO DE LOGOUT -->
    <q-dialog v-model="pergunta" persistent>
      <s-card class="logout-card" flat>
        <q-card-section class="text-center">
          <div class="text-h6 text-grey-9 dialog-title">
            {{ tdc('Which one do you want to log out of') }}
          </div>
        </q-card-section>

        <q-separator />

        <q-card-actions vertical class="q-pa-sm">
          <s-btn
            v-if="User.Entity"
            flat
            color="primary"
            class="full-width"
            @click="logoutEntity"
          >
            <span class="ellipsis">
              {{ tdc(User.Entity?.name) }}
            </span>
          </s-btn>

          <s-btn
            v-if="User.EntityType"
            flat
            color="primary"
            class="full-width"
            @click="logoutEntityType"
          >
            <span class="ellipsis">
              {{ tdc(User.EntityType?.name) }}
            </span>
          </s-btn>
        </q-card-actions>

        <q-separator />

        <q-card-actions>
          <s-btn
            flat
            color="grey"
            class="full-width"
            :label="tdc('Cancel')"
            v-close-popup
          />
        </q-card-actions>
      </s-card>
    </q-dialog>

    <!-- BOTÃO DO UTILIZADOR -->
    <s-btn
      round
      flat
      class="user-button"
      aria-label="Menu do utilizador"
    >
      <q-avatar size="45px" class="bg-white">
        <img
          :src="User?.profile"
          alt="Perfil"
          class="profile-image"
        />
      </q-avatar>

      <q-tooltip
        :class="
          $q.dark.isActive
            ? 'bg-dark text-white'
            : 'bg-primary text-white'
        "
      >
        {{ User?.username || tdc('Guest') }}
      </q-tooltip>

      <!-- MENU -->
      <q-menu
        anchor="bottom right"
        self="top right"
        :offset="[0, 5]"
        class="header-user-menu"
      >
        <s-card
          flat
          bordered
          square
          class="user-menu-card"
        >
          <!-- PERFIL -->
          <q-card-section
            v-if="User"
            class="text-center q-pa-md"
          >
            <q-avatar size="100px">
              <img
                :src="User?.profile"
                alt="Perfil"
                class="profile-image"
              />
            </q-avatar>

            <div class="username text-grey-9 text-h6 q-mt-sm">
              {{ User?.username }}
            </div>
          </q-card-section>

          <q-separator v-if="User" />

          <!-- ENTIDADES -->
          <q-expansion-item
            v-if="User.data"
            v-model="entityClosed"
            dense
            group="header-user-group"
            :label="User?.Entity?.name || tdc('Entity')"
            header-class="text-grey-9"
            class="menu-expansion"
          >
            <q-separator />

            <q-item
              v-if="User.EntityType?.crair_entity"
              dense
              clickable
              :to="{ name: 'add_entity_self' }"
            >
              <q-item-section class="item-content">
                <q-item-label
                  overline
                  class="text-blue ellipsis"
                >
                  {{ tdc('Register Entity') }}
                </q-item-label>
              </q-item-section>
            </q-item>

            <q-item
              v-for="entity in User?.Entitys || []"
              :key="entity?.id"
              dense
              clickable
              @click="selectEntity(entity)"
            >
              <q-item-section class="item-content">
                <q-item-label overline class="ellipsis">
                  {{ tdc(entity?.name) }}
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-expansion-item>

          <!-- SUCURSAIS -->
          <q-expansion-item
            v-if="User.data"
            v-model="branchClosed"
            dense
            group="header-user-group"
            :label="User?.Branch?.name || tdc('Branch')"
            header-class="text-grey-9"
            class="menu-expansion"
          >
            <q-separator />

            <q-item
              v-for="branch in User?.Branchs || []"
              :key="branch?.id"
              dense
              clickable
              @click="selectBranch(branch)"
            >
              <q-item-section class="item-content">
                <q-item-label overline class="ellipsis">
                  {{ tdc(branch?.name) }}
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-expansion-item>

          <!-- GRUPOS -->
          <s-btn
            v-if="User.data"
            dense
            flat
            color="grey"
            class="group-button full-width"
            @click="branchClosed = false"
          >
            <span class="ellipsis">
              {{ tdc(profileSplint(User?.Group?.name)) }}
            </span>

            <q-menu
              anchor="bottom left"
              self="top left"
              fit
            >
              <q-list
                dense
                class="group-list rounded-borders"
              >
                <q-item
                  v-for="group in User?.Groups || []"
                  :key="group?.id"
                  clickable
                  v-close-popup
                  v-ripple
                  @click="Group.select(group)"
                >
                  <q-item-section class="item-content">
                    <q-item-label overline class="ellipsis">
                      {{ tdc(profileSplint(group?.name)) }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </s-btn>

          <q-separator />

          <!-- UTILIZADOR AUTENTICADO -->
          <q-card-actions
            v-if="User.data"
            align="around"
            class="menu-actions"
          >
            <s-btn
              icon="settings"
              dense
              flat
              color="secondary"
              :to="{
                name: 'userDetails',
                params: {
                  user_id: User?.id
                }
              }"
              :label="tdc('Settings')"
            />

            <s-btn
              icon="logout"
              dense
              flat
              color="red"
              :label="tdc('Logout')"
              @click="pergunta = true"
            />
          </q-card-actions>

          <!-- VISITANTE -->
          <q-card-actions
            v-else
            align="around"
            class="menu-actions"
          >
            <s-btn
              icon="person_add"
              dense
              flat
              color="primary"
              :to="{ name: 'registarUser' }"
              :label="tdc('Register')"
            />

            <s-btn
              icon="login"
              dense
              flat
              color="secondary"
              :to="{ name: 'login' }"
              :label="tdc('Login')"
            />
          </q-card-actions>
        </s-card>
      </q-menu>
    </s-btn>
  </div>
</template>

<script>
import { defineComponent } from 'vue'

import { useUserStore } from '../../stores/UserStore'
import { useGroupStore } from '../../stores/GroupStore'
import { useEntityStore } from '../../stores/EntityStore'
import { useBranchStore } from '../../stores/BranchStore'

import RegisterEntity from './RegisterEntity.vue'

import { tdc } from '../../services/translation'
import { profileSplint } from '../../utils/profile.js'

export default defineComponent({
  name: 'HeaderUser',

  components: {
    RegisterEntity
  },

  setup () {
    const User = useUserStore()
    const Entity = useEntityStore()
    const Group = useGroupStore()
    const Branch = useBranchStore()

    return {
      User,
      Entity,
      Group,
      Branch,
      tdc,
      profileSplint
    }
  },

  data () {
    return {
      branchClosed: false,
      entityClosed: false,
      pergunta: false,
      showRegisterEntity: false,
      sessionInterval: null
    }
  },

  watch: {
    'User.Group' (val) {
      if (!val) return

      const allowedRoutes = [
        'welcome',
        'authwelcome'
      ]

      if (!allowedRoutes.includes(this.$route.name)) {
        this.$router.push({
          name: 'home'
        })
      }

      this.User.getMenus()
    },

    'User.Entity' (val) {
      if (!val) return

      this.User.getMenus()
      this.Entity.setEntityModelos(val.id)
    },

    'User.isLogout' (val) {
      if (!val) return

      if (this.User.Entity) {
        this.$router.push({
          name: 'login',
          query: {
            entity: this.User.Entity.id
          }
        })

        return
      }

      this.$router.push({
        name: 'login'
      })
    }
  },

  mounted () {
    this.startSessionWatcher()
  },

  beforeUnmount () {
    this.stopSessionWatcher()
  },

  methods: {
    selectEntity (entity) {
      this.entityClosed = false
      this.branchClosed = true
      this.Entity.select(entity)
    },

    selectBranch (branch) {
      this.branchClosed = false
      this.Branch.select(branch)
    },

    logoutEntity () {
      this.pergunta = false
      this.User.logout(this.User.Entity?.id)
    },

    logoutEntityType () {
      this.pergunta = false
      this.User.logout('x')
    },

    startSessionWatcher () {
      this.stopSessionWatcher()

      this.sessionInterval = setInterval(() => {
        this.User.checkSession()
      }, 60000)
    },

    stopSessionWatcher () {
      if (!this.sessionInterval) return

      clearInterval(this.sessionInterval)
      this.sessionInterval = null
    }
  }
})
</script>

<style scoped>
.header-user {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  max-width: 100%;
  min-width: 0;
  overflow: visible;
}

.user-button {
  flex: 0 0 auto;
  max-width: 100%;
}

.profile-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.logout-card {
  width: min(400px, calc(100vw - 24px));
  max-width: 100%;
  overflow-x: hidden;
}

.dialog-title {
  max-width: 100%;
  overflow-wrap: anywhere;
}

.user-menu-card {
  width: min(270px, calc(100vw - 16px));
  max-width: calc(100vw - 16px);
  overflow-x: hidden;
}

.username {
  width: 100%;
  max-width: 100%;
  overflow-wrap: anywhere;
}

.menu-expansion {
  width: 100%;
  max-width: 100%;
  overflow: hidden;
}

.item-content {
  min-width: 0;
  max-width: 100%;
}

.group-button {
  min-width: 0;
  max-width: 100%;
  border-color: transparent;
}

.group-button :deep(.q-btn__content) {
  width: 100%;
  min-width: 0;
  overflow: hidden;
}

.group-list {
  width: min(270px, calc(100vw - 16px));
  max-width: calc(100vw - 16px);
  overflow-x: hidden;
}

.menu-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  max-width: 100%;
}

.menu-actions :deep(.q-btn) {
  flex: 1 1 auto;
  min-width: 0;
}

.ellipsis {
  display: block;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
