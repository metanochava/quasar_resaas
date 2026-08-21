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



    $q.lang.table.allRows = tdc('Todos')
    $q.lang.table.noData = tdc('Sem dados')
    $q.lang.table.loading = tdc('A carregar...')
    $q.lang.table.recordsPerPage = tdc('Registos por página:')
    console.log('lingua')
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
