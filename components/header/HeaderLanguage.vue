<template>
  <s-btn dense flat round icon="language">
    <q-menu>
      <q-list dense>
        <q-item
          v-for="language in Language.rows"
          :key="language"
          clickable
          @click="Language?.change(language)"
        >
          <q-item-section v-if="Language.current?.id == language.id" ><b>{{ language.nome }}</b></q-item-section>
          <q-item-section v-else >{{ language.nome }}</q-item-section>
        </q-item>
      </q-list>
    </q-menu>
    <q-tooltip :class="$q.dark.isActive ? 'bg-dark text-white' : 'bg-primary text-white'">
      {{Language.current?.nome }}
    </q-tooltip>
  </s-btn>
</template>

<script>
import { defineComponent } from 'vue'
import { useUserStore} from '../../stores/UserStore'
import {useLanguageStore } from '../../stores/LanguageStore';

export default defineComponent({
  components: {

  },
  setup () {
    const User = useUserStore()
    const Language = useLanguageStore()
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
