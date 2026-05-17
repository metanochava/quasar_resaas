<template>
  <div>
    <!-- 🔥 DIALOG -->
    <q-dialog
      v-model="showRegisterEntity"
      persistent
      :maximized="maximized"
      full-height
    >
      <RegisterEntity />
    </q-dialog>

    <!-- 🔥 LOGOUT DIALOG -->
    <q-dialog v-model="pergunta" persistent class="row">
      <s-card style="width: 400px;" flat>

        <q-card-section class="row">
          <label class="text-h6 text-grey-9 text-center">
            {{ tdc('De qual deseja sair') }}
          </label>
        </q-card-section>

        <q-separator />

        <q-card-actions class="row">
          <s-btn flat class="col-12" color="primary"
            @click="pergunta = false; User.logout(User.Entity?.id)">
            {{ tdc(User.Entity?.name) }}
          </s-btn>
        </q-card-actions>

        <q-card-actions class="row">
          <s-btn flat class="col-12" color="primary"
            @click="pergunta = false; User.logout('x')">
            {{ tdc(User?.EntityType?.name) }}
          </s-btn>
        </q-card-actions>

        <q-separator />

        <q-card-actions class="row">
          <s-btn class="col-12" flat v-close-popup>
            {{ tdc('Cancelar') }}
          </s-btn>
        </q-card-actions>

      </s-card>
    </q-dialog>

    <!-- 🔥 USER BUTTON -->
    <s-btn round flat>

      <q-avatar size="45px" class="bg-white">
        <img :src="User?.profile">

        <q-menu square fit :offset="[130, 5]">

          <s-card style="width:270px;" flat bordered square>

            <!-- USER INFO -->
            <q-card-actions class="text-center row" v-if="User">
              <div class="col-12">
                <q-avatar size="120px">
                  <img :src="User?.profile">
                </q-avatar>
              </div>

              <div class="col-12 text-grey-9 text-h6">
                {{ User?.username }}
              </div>
            </q-card-actions>

            <q-separator v-if="User" />

            <!-- ENTITY -->
            <q-expansion-item
              v-if="User.data"
              dense
              group="group"
              :label="User?.Entity?.name || tdc('Entity')"
              header-class="text-grey-9"
              v-model="entityClosed"
            >
              <q-separator />

              <q-item dense clickable
                v-if="User.EntityType?.crair_entity"
                :to="{ name: 'add_entity_self' }">
                <q-item-section>
                  <q-item-label overline class="text-blue">
                    {{ tdc('Registar Entity') }}
                  </q-item-label>
                </q-item-section>
              </q-item>

              <q-item dense clickable
                v-for="entity in User?.Entitys"
                :key="entity?.id"
                @click="entityClosed = false; branchClosed = true; Entity.select(entity)">
                <q-item-section>
                  <q-item-label overline>
                    {{ tdc(entity?.name) }}
                  </q-item-label>
                </q-item-section>
              </q-item>

            </q-expansion-item>

            <!-- BRANCH -->
            <q-expansion-item
              v-if="User.data"
              dense
              group="group"
              :label="User?.Branch?.name || tdc('Branch')"
              header-class="text-grey-9"
              v-model="branchClosed"
            >
              <q-separator />

              <q-item dense clickable
                v-for="branch in User?.Branchs"
                :key="branch?.id"
                @click="branchClosed = false; Branch.select(branch)">
                <q-item-section>
                  <q-item-label overline>
                    {{ tdc(branch?.name) }}
                  </q-item-label>
                </q-item-section>
              </q-item>

            </q-expansion-item>

            <!-- GROUP -->
            <s-btn dense flat style="width: 100%;" color="grey"
              :label="tdc(profileSplint(User?.Group?.name))">

              <q-menu fit>
                <q-list dense>

                  <q-item clickable v-close-popup
                    v-for="group in User.Groups"
                    :key="group.id"
                    @click="Group.select(group)">
                    <q-item-section>
                      <q-item-label overline>
                        {{ tdc(profileSplint(group.name)) }}
                      </q-item-label>
                    </q-item-section>
                  </q-item>

                </q-list>
              </q-menu>

            </s-btn>

            <!-- ACTIONS -->
            <q-card-actions align="around" v-if="User.data">
              <s-btn icon="settings" dense flat color="secondary"
                :to="{ name: 'userDetails', params: { user_id: User?.id }}">
                {{ tdc('Definições') }}
              </s-btn>

              <s-btn icon="logout" dense flat color="red"
                @click="pergunta = !pergunta">
                {{ tdc('Sair') }}
              </s-btn>
            </q-card-actions>

            <q-card-actions align="around" v-else>
              <s-btn icon="person_add" dense flat color="primary"
                :to="{ name: 'registarUser' }">
                {{ tdc('Registar') }}
              </s-btn>

              <s-btn icon="login" dense flat color="secondary"
                :to="{ name: 'login' }">
                {{ tdc('login') }}
              </s-btn>
            </q-card-actions>

            <q-separator color="primary" dense size="xs" />

          </s-card>

        </q-menu>

      </q-avatar>

      <!-- TOOLTIP -->
      <q-tooltip
        :class="$q.dark.isActive ? 'bg-dark text-white' : 'bg-primary text-white'"
      >
        {{ User ? User.username : tdc('Hóspede') }}
      </q-tooltip>

    </s-btn>

  </div>
</template>

<script>
import { defineComponent } from 'vue'
import { profileSplint, tdc } from '../../boot/base'
import { useUserStore } from '../../stores/UserStore'
import { useGroupStore } from '../../stores/GroupStore'
import { useEntityStore } from '../../stores/EntityStore'
import { useBranchStore } from '../../stores/BranchStore'
import RegisterEntity from './RegisterEntity.vue'

export default defineComponent({
  name: 'HeaderUser',
  components: { RegisterEntity },

  setup () {
    const User = useUserStore()
    const Entity = useEntityStore()
    const Group = useGroupStore()
    const Branch = useBranchStore()

    return { User, tdc, Entity, Group, Branch }
  },

  data () {
    return {
      branchClosed: false,
      entityClosed: false,
      pergunta: false,
      showRegisterEntity: false,
      maximized: false, // ✅ FIX
      profileSplint
    }
  },

  methods: {
    maximizedToggle () {
      this.maximized = !this.maximized
    },

    startSessionWatcher () {
      setInterval(async () => {
        await this.User.checkSession()
      }, 60000)
    }
  },

  async mounted () {
    if (this.User) {
      this.startSessionWatcher()
    }
  }
})
</script>