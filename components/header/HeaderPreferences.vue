<template>
  <!-- Dark mode, full screen and language as menu items. On very small
       screens (xs) the header hides its HeaderDarkMode / HeaderFullScreen /
       HeaderLanguage buttons (they stay mounted: they restore the saved
       preferences) and these items appear in the user menu (HeaderUser),
       which both layouts show signed in or not. -->
  <q-list class="header-preferences" data-test="header-preferences">
    <q-item clickable data-test="header-pref-dark" @click="toggleDark">
      <q-item-section avatar>
        <q-icon :name="$q.dark.isActive ? 'mdi-weather-night' : 'mdi-white-balance-sunny'" />
      </q-item-section>
      <q-item-section>{{ tdc('Dark mode') }}</q-item-section>
      <q-item-section side>
        <q-toggle :model-value="$q.dark.isActive" dense @update:model-value="toggleDark" />
      </q-item-section>
    </q-item>

    <!-- not offered where the browser cannot do it (e.g. iPhone Safari) -->
    <q-item v-if="canFullscreen" clickable data-test="header-pref-fullscreen" @click="toggleFullscreen">
      <q-item-section avatar>
        <q-icon :name="fullscreen ? 'fullscreen_exit' : 'fullscreen'" />
      </q-item-section>
      <q-item-section>{{ tdc('Full screen') }}</q-item-section>
      <q-item-section side>
        <q-toggle :model-value="fullscreen" dense @update:model-value="toggleFullscreen" />
      </q-item-section>
    </q-item>

    <q-expansion-item
      icon="language"
      :label="tdc('Language')"
      :caption="Language.current?.name"
      class="header-preferences__language"
      data-test="header-pref-language"
    >
      <q-item
        v-for="language in Language.rows"
        :key="language.id"
        clickable
        :active="Language.current?.id == language.id"
        active-class="text-primary text-weight-bold"
        class="header-preferences__option"
        @click="chooseLanguage(language)"
      >
        <q-item-section>{{ language.name }}</q-item-section>
        <q-item-section v-if="Language.current?.id == language.id" side>
          <q-icon name="check" color="primary" />
        </q-item-section>
      </q-item>
    </q-expansion-item>
  </q-list>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useQuasar } from 'quasar'
import { useUserStore } from '../../stores/UserStore'
import { useLanguageStore } from '../../stores/LanguageStore'
import { setStorage } from '../../services/storage'
import { tdc } from '../../services/translation'

const $q = useQuasar()
const User = useUserStore()
const Language = useLanguageStore()

// the same effects as HeaderDarkMode, HeaderFullScreen and HeaderLanguage
function toggleDark () {
  const value = !$q.dark.isActive
  $q.dark.set(value)
  setStorage('l', 'dark', value)
}

const canFullscreen = typeof document !== 'undefined' && Boolean(document.fullscreenEnabled)
const fullscreen = ref(typeof document !== 'undefined' && Boolean(document.fullscreenElement))
const onFullscreenChange = () => {
  fullscreen.value = Boolean(document.fullscreenElement)
  setStorage('l', 'FullScreen', fullscreen.value)
}
async function toggleFullscreen () {
  try {
    if (document.fullscreenElement) await document.exitFullscreen()
    else await document.documentElement.requestFullscreen()
  } catch {
    // refused by the browser: the toggle follows fullscreenchange only
  }
}

function chooseLanguage (language) {
  Language.change(language)
  User.setLanguage(language)
}

onMounted(() => document.addEventListener('fullscreenchange', onFullscreenChange))
onBeforeUnmount(() => document.removeEventListener('fullscreenchange', onFullscreenChange))
</script>

<style scoped>
.header-preferences {
  min-width: 240px;
}
.header-preferences .q-item {
  min-height: 48px; /* a thumb's size: these items exist for phones */
}
.header-preferences__option {
  padding-left: 72px;
}
</style>
