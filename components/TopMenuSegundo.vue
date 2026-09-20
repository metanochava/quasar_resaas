
<template>

  <div class="top-menu-segundo">

    <s-btn
      v-for="App in User.Menus"
      :key="App.menu"
      flat
      square
      
      class="top-menu-btn"
      :icon="App.icon"
      :label="tdc(App.menu)"
    >

      <q-menu>

        <q-list
          dense
          style="min-width: 155px"
        >

          <SubMenu
            :Dados="App.submenu"
          />

        </q-list>

      </q-menu>

    </s-btn>

  </div>

</template>


<script>

import {
  defineComponent
} from 'vue'

import {
  useUserStore
} from '../stores/UserStore'

import {
  useEntityTypeStore
} from '../stores/EntityTypeStore'

import SubMenu from './SubMenu.vue'

import {
  tdc,
  toPlural
} from '../services/translation'


export default defineComponent({

  name: 'TopeMenuSegundo',


  components: {

    SubMenu

  },


  setup () {

    const User =
      useUserStore()

    const EntityType =
      useEntityTypeStore()


    return {

      User,

      EntityType,

      tdc,

      toPlural

    }

  },


  data () {

    return {

    }

  },


  computed: {

  },


  watch: {

  },


  mounted () {

  },


  methods: {

  }

})

</script>


<style scoped>

/* ========================================================== */
/* CONTAINER */
/* ========================================================== */

.top-menu-segundo {

  display: flex;

  flex-direction: row;

  flex-wrap: nowrap;

  align-items: center;

  width: 100%;

  max-width: 100%;

  overflow-x: auto;

  overflow-y: hidden;

  white-space: nowrap;

  gap: 4px;

  scrollbar-width: thin;

}


/* ========================================================== */
/* BOTÕES */
/* ========================================================== */

.top-menu-btn {

  flex: 0 0 auto;

  margin: 0;

  white-space: nowrap;

}


/* ========================================================== */
/* ESCONDER SCROLLBAR WEBKIT */
/* ========================================================== */

.top-menu-segundo::-webkit-scrollbar {

  height: 3px;

}


.top-menu-segundo::-webkit-scrollbar-thumb {

  border-radius: 10px;

}


/* ========================================================== */
/* MOBILE */
/* ========================================================== */

@media (max-width: 600px) {

  .top-menu-segundo {

    gap: 2px;

  }

  .top-menu-btn {

    flex-shrink: 0;

  }

}

</style>

