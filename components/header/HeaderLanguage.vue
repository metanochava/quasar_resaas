<template>
  <q-btn dense flat round icon="language">
    <q-menu>
      <q-list dense>
        <q-item
          v-for="idioma in Language.list"
          :key="idioma"
          clickable
          @click="Language?.change(idioma)"
        >
          <q-item-section v-if="Language.current?.id == idioma.id" ><b>{{ idioma.nome }}</b></q-item-section>
          <q-item-section v-else >{{ idioma.nome }}</q-item-section>
        </q-item>
      </q-list>
    </q-menu>
    <q-tooltip :class="$q.dark.isActive ? 'bg-dark text-white' : 'bg-primary text-white'">
      {{Language.current?.nome }}
    </q-tooltip>
  </q-btn>
</template>

<script>
import { defineComponent } from 'vue'
import {  UserStore, LanguageStore} from '../../stores/TipoEntidadeStore'


export default defineComponent({
  components: {

  },
  setup () {
    const User = UserStore()
    const Language = LanguageStore()
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
