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
          <q-item-section v-if="Language.current?.id == language.id" ><b>{{ language.name }}</b></q-item-section>
          <q-item-section v-else >{{ language.name }}</q-item-section>
        </q-item>
      </q-list>
    </q-menu>
    <q-tooltip :class="$q.dark.isActive ? 'bg-dark text-white' : 'bg-primary text-white'">
      {{Language.current?.name }}
    </q-tooltip>
  </s-btn>
</template>

<script>
import { defineComponent, watch } from 'vue'
import { useUserStore} from '../../stores/UserStore'
import {useLanguageStore } from '../../stores/LanguageStore';



import { useQuasar } from 'quasar'
import { tdc } from '../../boot/base'






export default defineComponent({
  components: {

  },
  setup () {
    const User = useUserStore()
    const Language = useLanguageStore()
    const $q = useQuasar()

    watch(
      () => Language.current,
      (newLanguage) => {
        if (!newLanguage) return

        User.setLanguage(newLanguage)

        // ==========================================
        // QTABLE
        // ==========================================

        $q.lang.table.allRows = tdc('All')

        $q.lang.table.noData = tdc('No data')

        $q.lang.table.loading = tdc('Loading...')

        $q.lang.table.recordsPerPage = tdc('Records per page:')

        $q.lang.table.selectedRecords = rows =>
          `${rows} ${tdc('selected records')}`

        $q.lang.table.pagination = (start, end, total) =>
          `${start}-${end} ${tdc('of')} ${total}`

        $q.lang.table.columns = tdc('Columns')



        // QEditor
        $q.lang.editor.url = tdc('URL')
        $q.lang.editor.bold = tdc('Bold')
        $q.lang.editor.italic = tdc('Italic')
        $q.lang.editor.strike = tdc('Strike')
        $q.lang.editor.underline = tdc('Underline')
        $q.lang.editor.undo = tdc('Undo')
        $q.lang.editor.redo = tdc('Redo')
        $q.lang.editor.removeFormat = tdc('Remove formatting')

        // QTree
        $q.lang.tree.noNodes = tdc('No nodes available')
        $q.lang.tree.noResults = tdc('No results found')

        // QFile / QUploader
        $q.lang.label.clear = tdc('Clear')
        $q.lang.label.ok = tdc('OK')
        $q.lang.label.cancel = tdc('Cancel')
        $q.lang.label.close = tdc('Close')
        $q.lang.label.set = tdc('Set')
        $q.lang.label.select = tdc('Select')
        $q.lang.label.reset = tdc('Reset')
        $q.lang.label.remove = tdc('Remove')
        $q.lang.label.update = tdc('Update')
        $q.lang.label.create = tdc('Create')
        $q.lang.label.search = tdc('Search')
        $q.lang.label.filter = tdc('Filter')
        $q.lang.label.refresh = tdc('Refresh')

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

  async mounted(){
    await this.Language.get()
  },

  methods: {

  }
})
</script>
