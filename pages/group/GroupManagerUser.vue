<template>


  <!-- 🔥 MAIN CARD -->
  <s-card class="column full-height group-manager-card">

    <!-- HEADER -->
    <q-bar :class="$q.dark.isActive ? 'bg-dark text-white' : 'bg-primary text-white'">
      <q-icon name="groups" size="22px" />

      <div class="text-subtitle1 text-weight-bold q-ml-sm">
        {{ tdc('Manage Groups of') }} {{ User.form?.username || User.row?.username || '' }}
      </div>

      <q-space />

      <q-badge color="white" text-color="primary">
        {{ User.selectedGroups.length }} {{ tdc('active') }}
      </q-badge>

      <s-btn dense flat icon="close" v-close-popup>
        <s-tooltip>{{ tdc('Close') }}</s-tooltip>
      </s-btn>
    </q-bar>

    <q-separator />

    <!-- FILTER -->
    <q-card-section class="q-pa-md">
      <q-input
        v-model="User.groupSearch"
        dense
        outlined
        clearable
        :label="tdc('Search group')"
      >
        <template #prepend>
          <q-icon name="search" />
        </template>
      </q-input>
    </q-card-section>

    <q-separator />

    <!-- LIST -->
    <q-card-section class="col scroll q-pa-none">

      <div v-if="User.loadingGroups" class="flex flex-center q-pa-xl">
        <q-spinner :color="$q.dark.isActive ? 'white' : 'primary'" size="48px" />
      </div>

      <q-list v-else separator>

        <q-item
          v-for="group in (User.filteredGroups || [])"
          :key="group?.id"
          clickable
          v-ripple
          class="group-item"
          :class="{ 'group-item--active': User.hasGroup(group.id) }"
          @click="User.toggleGroup(group)"
        >

          <q-item-section avatar>
            <q-avatar
              :color="User.hasGroup(group.id) ? 'primary' : 'grey-4'"
              :text-color="User.hasGroup(group.id) ? 'white' : 'dark'"
              icon="group"
            />
          </q-item-section>

          <q-item-section>
            <q-item-label>
              {{ groupLabel(group) }}
            </q-item-label>
          </q-item-section>

          <q-item-section side>
            <div class="row items-center q-gutter-sm">

              <q-chip
                dense
                size="sm"
                :color="User.hasGroup(group.id) ? 'primary' : 'grey-5'"
                text-color="white"
              >
                {{ User.hasGroup(group.id) ? tdc('Active') : tdc('Inactive') }}
              </q-chip>

              <q-checkbox
                :model-value="User.hasGroup(group.id)"
                color="primary"
                @click.stop
                @update:model-value="() => User.toggleGroup(group)"
              />
            </div>
          </q-item-section>

        </q-item>

      </q-list>

    </q-card-section>

  </s-card>

</template>

<script setup>
import { groupLabel } from '../../utils/groupLabel'
import { onMounted } from 'vue'
import { useUserAdminStore } from '../../stores/UserAdminStore'
import { tdc } from '../../services/translation'

const props = defineProps({
  userId: [String, Number]
})

// Dedicated admin store (see stores/UserAdminStore.js) - NOT the
// session useUserStore(), which this component used to call
// getById()/loadGroups() on directly, overwriting the logged-in
// admin's own session-shaped state (.row/.form) with whichever OTHER
// user's data was being managed here.
const User = useUserAdminStore()

async function init() {
  await User.getById(props.userId)
  await User.loadGroups(props.userId)
}

// INIT
onMounted(init)
</script>

<style scoped>
.group-manager-card {
  overflow: hidden;
}

.group-item {
  transition: all 0.2s ease;
  border-left: 4px solid transparent;
}

.group-item--active {
  background: rgba(25, 118, 210, 0.08);
  border-left-color: var(--q-primary);
}

.modal-card {
  min-width: 70%;
  max-width: 90vw;
  height: 80vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  position: sticky;
  top: 0;
  z-index: 10;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
}
</style>