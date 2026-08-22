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

import {
  tdc
} from '../../services/base'


export default defineComponent({

  setup () {

    const User = useUserStore()
    const Language = useLanguageStore()
    const $q = useQuasar()


    // ==========================================
    // ACTUALIZA O IDIOMA DO QUASAR
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
        // LABELS GLOBAIS
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
      // IMPORTANTE:
      // força o Quasar a actualizar os componentes
      // já renderizados
      // ==========================================

      $q.lang.set(currentLang)
    }


    // ==========================================
    // WATCH DA LÍNGUA
    // ==========================================

    watch(
      () => Language.current,

      async (newLanguage) => {

        if (!newLanguage) {
          return
        }


        // CORRECÇÃO:
        // antes tinhas User.setLanguage(language)
        // mas "language" não existe neste scope

        await User.setLanguage(
          newLanguage
        )


        // depois de mudar a língua,
        // o tdc() já deve devolver
        // as traduções da nova língua

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