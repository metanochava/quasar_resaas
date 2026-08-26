<template>
  <s-btn dense flat round icon="language">
    <q-menu>
      <q-list dense>

        <q-item
          v-for="language in Language.rows"
          :key="language"
          clickable
          @click="Language?.change(language), User.setLanguage(language)"
        >

          <q-item-section
            v-if="Language.current?.id == language.id"
          >
            <b>{{ language.name }}</b>
          </q-item-section>

          <q-item-section v-else>
            {{ language.name }}
          </q-item-section>

        </q-item>

      </q-list>
    </q-menu>

    <q-tooltip
      :class="
        $q.dark.isActive
          ? 'bg-dark text-white'
          : 'bg-primary text-white'
      "
    >
      {{ Language.current?.name }}
    </q-tooltip>

  </s-btn>
</template>


<script>
import {
  defineComponent,
  watch
} from 'vue'

import {
  useUserStore
} from '../../stores/UserStore'

import {
  useLanguageStore
} from '../../stores/LanguageStore'

import {
  useQuasar
} from 'quasar'
import { tdc } from '../../services/translation'




export default defineComponent({

  setup () {

    const User = useUserStore()
    const Language = useLanguageStore()
    const $q = useQuasar()


    // ==========================================
    // UPDATES THE QUASAR LANGUAGE
    // ==========================================

    function updateQuasarLanguage () {

      const currentLang = {
        ...$q.lang,

        // ======================================
        // QTABLE
        // ======================================

        table: {
          ...($q.lang.table || {}),

          allRows:
            tdc('All'),

          noData:
            tdc('No data'),

          loading:
            tdc('Loading...'),

          recordsPerPage:
            tdc('Records per page:'),

          selectedRecords: rows =>
            `${rows} ${tdc('Selected records')}`,

          pagination: (start, end, total) =>
            `${start}-${end} ${tdc('of')} ${total}`,

          columns:
            tdc('Columns')
        },


        // ======================================
        // QEDITOR
        // ======================================

        editor: {
          ...($q.lang.editor || {}),

          url:
            tdc('URL'),

          bold:
            tdc('Bold'),

          italic:
            tdc('Italic'),

          strike:
            tdc('Strike'),

          underline:
            tdc('Underline'),

          undo:
            tdc('Undo'),

          redo:
            tdc('Redo'),

          removeFormat:
            tdc('Remove formatting')
        },


        // ======================================
        // QTREE
        // ======================================

        tree: {
          ...($q.lang.tree || {}),

          noNodes:
            tdc('No nodes available'),

          noResults:
            tdc('No results found')
        },


        // ======================================
        // GLOBAL LABELS
        // ======================================

        label: {
          ...($q.lang.label || {}),

          clear:
            tdc('Clear'),

          ok:
            tdc('OK'),

          cancel:
            tdc('Cancel'),

          close:
            tdc('Close'),

          set:
            tdc('Set'),

          select:
            tdc('Select'),

          reset:
            tdc('Reset'),

          remove:
            tdc('Remove'),

          update:
            tdc('Update'),

          create:
            tdc('Create'),

          search:
            tdc('Search'),

          filter:
            tdc('Filter'),

          refresh:
            tdc('Refresh')
        }
      }


      // ==========================================
      // IMPORTANT:
      // forces Quasar to update the components
      // already rendered
      // ==========================================

      $q.lang.set(currentLang)
    }


    // ==========================================
    // LANGUAGE WATCH
    // ==========================================

    watch(
      () => Language.current,

      async (newLanguage) => {

        if (!newLanguage) {
          return
        }


        // FIX:
        // previously had User.setLanguage(language)
        // but "language" doesn't exist in this scope

        await User.setLanguage(
          newLanguage
        )


        // after changing the language,
        // tdc() should already return
        // the translations for the new language

        updateQuasarLanguage()

      },

      {
        deep: true,
        immediate: true
      }
    )


    return {
      User,
      Language
    }
  },


  data () {

    return {

    }
  },


  computed: {

  },


  async mounted () {

    await this.Language.get()

  },


  methods: {

  }

})
</script>