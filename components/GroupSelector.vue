<script setup>
import { computed } from 'vue'
import { tdc } from '../../services/translation'
import { profileSplint } from '../../services/utils'

import { useUserStore } from '../../stores/UserStore'
import { useGroupStore } from '../../stores/GroupStore'

const User = useUserStore()
const Group = useGroupStore()

const label = computed(() =>
  profileSplint(User.Group?.name || User.Group?.label || '')
)

const groups = computed(() => User.Groups || [])

const select = group => Group.select(group)
</script>

<template>
  <s-btn
    flat
    dense
    :label="tdc(label)"
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
              {{
                tdc(
                  profileSplint(
                    group.name ||
                    group.label ||
                    ''
                  )
                )
              }}
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