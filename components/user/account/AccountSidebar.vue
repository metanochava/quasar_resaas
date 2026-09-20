<script setup>
import { computed } from 'vue'
import { useQuasar } from 'quasar'

import { tdc } from '../../../services/translation'
import { initialsOf } from '../../../utils/relationRow'

// Navigation of the Account Center. One component, two layouts: a vertical
// menu under the user's card on wide screens, and a horizontally scrollable tab
// strip on narrow ones (a squeezed sidebar is never kept on a phone).
const props = defineProps({
  modelValue: { type: String, required: true },
  // [{ id, label, icon, badge? }] - only sections that really exist are passed
  sections: { type: Array, required: true },
  name: { type: String, default: '' },
  username: { type: String, default: '' },
  email: { type: String, default: '' },
  avatar: { type: String, default: '' }
})

const emit = defineEmits(['update:modelValue'])

const $q = useQuasar()
const compact = computed(() => $q.screen.lt.md)

const initials = computed(() => initialsOf(props.name || props.username))
</script>

<template>
  <nav class="account-nav" :aria-label="tdc('Account sections')" data-test="account-nav">

    <!-- ===== narrow: identity strip + scrollable tabs ===== -->
    <template v-if="compact">
      <div class="row items-center no-wrap q-mb-sm q-gutter-x-md" data-test="nav-compact">
        <q-avatar size="48px" class="account-avatar">
          <img v-if="avatar" :src="avatar" :alt="name || username">
          <span v-else>{{ initials }}</span>
        </q-avatar>
        <div class="col ellipsis">
          <div class="text-subtitle1 text-weight-bold ellipsis">{{ name || username }}</div>
          <div class="text-caption text-grey-7 ellipsis">{{ email }}</div>
        </div>
      </div>

      <q-tabs
        :model-value="modelValue"
        dense
        align="left"
        outside-arrows
        mobile-arrows
        active-color="primary"
        indicator-color="primary"
        class="account-tabs"
        @update:model-value="value => emit('update:modelValue', value)"
      >
        <q-tab
          v-for="section in sections"
          :key="section.id"
          :name="section.id"
          :icon="section.icon"
          :label="tdc(section.label)"
          no-caps
          :data-test="`nav-${section.id}`"
        />
      </q-tabs>
    </template>

    <!-- ===== wide: identity card + vertical menu ===== -->
    <template v-else>
      <div class="column items-center text-center q-pa-md" data-test="nav-identity">
        <q-avatar size="88px" class="account-avatar">
          <img v-if="avatar" :src="avatar" :alt="name || username">
          <span v-else class="text-h5">{{ initials }}</span>
        </q-avatar>

        <div class="text-subtitle1 text-weight-bold q-mt-sm">{{ name || username }}</div>
        <div v-if="username" class="text-caption text-grey-7">@{{ username }}</div>
        <div v-if="email" class="text-caption text-grey-7 ellipsis full-width">{{ email }}</div>
      </div>

      <q-separator />

      <q-list padding class="account-menu">
        <q-item
          v-for="section in sections"
          :key="section.id"
          clickable
          v-ripple
          :active="modelValue === section.id"
          active-class="account-menu__item--active"
          :aria-current="modelValue === section.id ? 'page' : undefined"
          :data-test="`nav-${section.id}`"
          @click="emit('update:modelValue', section.id)"
        >
          <q-item-section avatar>
            <q-icon :name="section.icon" />
          </q-item-section>
          <q-item-section>{{ tdc(section.label) }}</q-item-section>
          <q-item-section v-if="section.badge" side>
            <q-badge rounded color="warning" :aria-label="tdc('Unsaved changes')" />
          </q-item-section>
        </q-item>
      </q-list>
    </template>
  </nav>
</template>

<style scoped>
.account-avatar {
  background: color-mix(in srgb, var(--q-primary) 14%, transparent);
  color: var(--q-primary);
  font-weight: 700;
}

.account-menu :deep(.q-item) {
  border-radius: var(--s-radius, 8px);
  margin: 2px 8px;
  transition: background-color .15s ease;
}

.account-menu :deep(.account-menu__item--active) {
  background: color-mix(in srgb, var(--q-primary) 12%, transparent);
  color: var(--q-primary);
  font-weight: 600;
}

.account-tabs { max-width: 100%; }
</style>
