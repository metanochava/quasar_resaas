<script setup>
import { computed } from 'vue'
import { tdc } from '../services/translation'
import { groupLabel } from '../utils/groupLabel'

import { useUserStore } from '../stores/UserStore'
import { useGroupStore } from '../stores/GroupStore'

const props = defineProps({
  minimenu: {
    type: Boolean,
    default: false
  }
})

const User = useUserStore()
const Group = useGroupStore()

const label = computed(() => groupLabel(User.Group))

const groups = computed(() => User.Groups || [])

const select = group => Group.select(group)
</script>

<template>
  <s-btn
    flat
    dense

    :label="minimenu ? label.charAt(0) : label"
    class="full-width"
  >
    <q-menu fit>
      <q-list
        dense
        class="group-list rounded-borders"
      >
        <q-item
          v-for="group in groups"
          :key="group.id"
          clickable
          v-close-popup
          v-ripple
          @click="select(group)"
        >
          <q-item-section class="item-content">
            <q-item-label
              overline
              class="ellipsis"
            >
              {{ groupLabel(group) }}
            </q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-menu>
  </s-btn>
</template>

<style scoped>
.group-list {
  min-width: 180px;
  max-width: 320px;
}

.item-content {
  min-width: 0;
}
</style>