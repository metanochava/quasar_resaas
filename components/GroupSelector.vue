<script setup>
import { computed, ref, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
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

// A filter on top of the list of profiles (static: only the list scrolls),
// like the login flow's group picker. Enter picks the first match.
const filter = ref('')
const filteredGroups = computed(() => {
  const q = filter.value.trim().toLowerCase()
  if (!q) return groups.value
  return groups.value.filter(g => groupLabel(g).toLowerCase().includes(q))
})

function pickFirst () {
  if (!filteredGroups.value.length) return
  menuOpen.value = false
  select(filteredGroups.value[0])
}

const router = useRouter()

// Choosing a profile (or reloading the current one) ends on the home page:
// the page that was open may not be allowed with the new permissions.
async function select (group) {
  await Group.select(group)
  await router.push({ name: 'dashboard' })
}

// One click opens the list of profiles; a double click reloads the current
// profile's permissions and menus - the same Group.select() as choosing it in
// the list. The first click waits a moment so a double click does not also
// open the list.
const DOUBLE_CLICK_MS = 250
const menuOpen = ref(false)
const reloading = ref(false)
let clickTimer = null

function onClick () {
  clearTimeout(clickTimer)
  clickTimer = setTimeout(() => { menuOpen.value = !menuOpen.value }, DOUBLE_CLICK_MS)
}

async function onDoubleClick () {
  clearTimeout(clickTimer)
  menuOpen.value = false
  if (!User.Group || reloading.value) return
  reloading.value = true
  try {
    await select(User.Group)
  } finally {
    reloading.value = false
  }
}

onBeforeUnmount(() => clearTimeout(clickTimer))
</script>

<template>
  <s-btn
    flat
    dense

    :label="minimenu ? label.charAt(0) : label"
    :loading="reloading"
    class="full-width"
    data-test="group-selector"
    @click="onClick"
    @dblclick="onDoubleClick"
  >
    <s-tooltip :delay="800">{{ tdc('Click: profiles · Double-click: reload permissions') }}</s-tooltip>
    <q-menu v-model="menuOpen" fit no-parent-event @hide="filter = ''">
      <div class="group-filter q-pa-xs">
        <s-input
          v-model="filter"
          dense
          clearable
          autofocus
          :placeholder="tdc('Filter')"
          data-test="group-filter"
          @keydown.enter.prevent="pickFirst"
        >
          <template #prepend><q-icon name="search" /></template>
        </s-input>
      </div>
      <q-list
        dense
        class="group-list rounded-borders"
      >
        <q-item
          v-for="group in filteredGroups"
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
        <q-item v-if="!filteredGroups.length">
          <q-item-section class="text-grey">{{ tdc('No results') }}</q-item-section>
        </q-item>
      </q-list>
    </q-menu>
  </s-btn>
</template>

<style scoped>
.group-filter {
  min-width: 180px;
  max-width: 320px;
}

.group-list {
  min-width: 180px;
  max-width: 320px;
  max-height: 50vh;
  overflow-y: auto;
}

.item-content {
  min-width: 0;
}
</style>