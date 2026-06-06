<template>


  <!-- 🔥 MAIN CARD -->
  <s-card class="column full-height group-manager-card">

    <!-- HEADER -->
    <q-bar class="bg-primary text-white">
      <q-icon name="groups" size="22px" />

      <div class="text-subtitle1 text-weight-bold q-ml-sm">
        Gestão de Grupos de {{ User?.row?.username }}
      </div>

      <q-space />

      <q-badge color="white" text-color="primary">
        {{ User.selectedGroups.length }} ativos
      </q-badge>

      <s-btn dense flat icon="close" v-close-popup>
        <q-tooltip>Close</q-tooltip>
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
        label="Pesquisar grupo"
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
        <q-spinner color="primary" size="42px" />
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
              {{ group.name }}
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
                {{ User.hasGroup(group.id) ? 'Ativo' : 'Inativo' }}
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
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '../../stores/UserStore'
// import { useEntityStore } from '../../stores/EntityStore'


const props = defineProps({
  userId: [String, Number]
})


const User = useUserStore()
// const Entity = useEntityStore() 


// INIT
onMounted(() => {
  User.getById(props.userId)
  User.loadGroups(props.userId)
  // Entity.loadGroups(User.Eentity.id)
})
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