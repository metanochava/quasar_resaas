<template>
  <q-layout view="hHh lpr fFf" class="doc-layout">
    <q-header
      bordered
      :class="$q.dark.isActive ? 'bg-dark text-white' : 'bg-primary text-white'"
    >
      <q-toolbar>
        <s-btn dense flat round icon="arrow_back" to="/">
          <q-tooltip>{{ tdc('Back to app') }}</q-tooltip>
        </s-btn>

        <q-icon name="menu_book" size="24px" class="q-mx-sm" />

        <q-toolbar-title>
          RESAAS <span class="text-weight-light">{{ tdc('Docs') }}</span>
        </q-toolbar-title>

        <q-space />

        <HeaderDarkMode />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
import { defineComponent } from 'vue'
import { tdc } from '../services/translation'
import HeaderDarkMode from '../components/header/HeaderDarkMode.vue'

export default defineComponent({
  name: 'DocLayout',

  components: {
    HeaderDarkMode
  },

  setup () {
    return { tdc }
  }
})
</script>

<style scoped>
.doc-layout :deep(.q-page-container) {
  height: 100%;
}
</style>
