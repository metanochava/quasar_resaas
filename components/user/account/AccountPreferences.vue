<script setup>
import { computed } from 'vue'
import { useQuasar } from 'quasar'

import { useUserStore } from '../../../stores/UserStore'
import { useLanguageStore } from '../../../stores/LanguageStore'
import { setStorage } from '../../../services/storage'
import { tdc } from '../../../services/translation'
import { Alert } from '../../../boot/alerts'

// Personal preferences, through the mechanisms the app already has - nothing
// new is stored or modelled here:
//  - language   LanguageStore.change() + UserStore.setLanguage() (the header menu)
//  - appearance $q.dark + the 'dark' storage key (the header dark-mode button)
//  - menu       UserStore.toggleSidebarMini() / toggleMenuRtl() (personal layout
//               overrides resolved User > Entity > EntityType by the backend)
const $q = useQuasar()
const Session = useUserStore()
const Language = useLanguageStore()

const layout = computed(() => Session.ps?.layout || {})

const languages = computed(() => Language.rows || [])
const currentLanguageId = computed(() => Language.current?.id ?? Session.Language?.id ?? null)

function chooseLanguage(language) {
  Language.change(language)
  Session.setLanguage(language)
}

const appearance = computed({
  get: () => ($q.dark.isActive ? 'dark' : 'light'),
  set: (value) => {
    $q.dark.set(value === 'dark')
    setStorage('l', 'dark', value === 'dark')
  }
})

// These two flip a backend value, so they only move when the switch and the
// stored value disagree (a failure leaves the switch where the backend is).
async function setMenu(field, wanted) {
  const current = !!layout.value[field]
  if (current === wanted) return

  try {
    if (field === 'sidebar_mini') await Session.toggleSidebarMini()
    else await Session.toggleMenuRtl()
  } catch (error) {
    Alert(error?.response)
  }
}
</script>

<template>
  <div data-test="account-preferences">
    <div class="q-mb-lg">
      <div class="text-h5 text-weight-bold">{{ tdc('Preferences') }}</div>
      <div class="text-body2 text-grey-7 q-mt-xs">{{ tdc('Personalise how the application looks and behaves for you.') }}</div>
    </div>

    <div class="column q-gutter-y-md">
      <s-card flat bordered>
        <q-card-section>
          <div class="text-subtitle1 q-mb-sm">{{ tdc('Language') }}</div>
          <q-option-group
            :model-value="currentLanguageId"
            :options="languages.map(language => ({ label: language.name, value: language.id }))"
            type="radio"
            color="primary"
            data-test="pref-language"
            @update:model-value="id => chooseLanguage(languages.find(language => language.id === id))"
          />
        </q-card-section>
      </s-card>

      <s-card flat bordered>
        <q-card-section>
          <div class="text-subtitle1 q-mb-sm">{{ tdc('Appearance') }}</div>
          <q-option-group
            v-model="appearance"
            :options="[{ label: tdc('Light'), value: 'light' }, { label: tdc('Dark'), value: 'dark' }]"
            type="radio"
            color="primary"
            inline
            data-test="pref-appearance"
          />
        </q-card-section>
      </s-card>

      <s-card flat bordered>
        <q-card-section>
          <div class="text-subtitle1 q-mb-sm">{{ tdc('Menu') }}</div>

          <q-toggle
            :model-value="!!layout.sidebar_mini"
            :label="tdc('Compact menu')"
            color="primary"
            data-test="pref-mini"
            @update:model-value="value => setMenu('sidebar_mini', value)"
          />

          <q-toggle
            :model-value="!!layout.menu_rtl"
            :label="tdc('Menu on the right')"
            color="primary"
            data-test="pref-rtl"
            @update:model-value="value => setMenu('menu_rtl', value)"
          />
        </q-card-section>
      </s-card>
    </div>
  </div>
</template>
