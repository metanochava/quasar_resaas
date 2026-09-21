<template>


  <!-- 🔥 MAIN CARD -->
  <s-modal-card :title="`${tdc('Manage Groups of')} ${User.form?.username || User.row?.username || ''}`" icon="groups" fullscreen flush>
    <template #bar-actions>
      <q-badge color="white" text-color="primary">
        {{ User.selectedGroups.length }} {{ tdc('active') }}
      </q-badge>
    </template>

    <template #subheader>
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
    </template>

    <div class="col scroll" style="min-height: 0;">

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

    </div>
  </s-modal-card>
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
.group-item {
  transition: all 0.2s ease;
  border-left: 4px solid transparent;
}

.group-item--active {
  background: rgba(25, 118, 210, 0.08);
  border-left-color: var(--q-primary);
}
</style>