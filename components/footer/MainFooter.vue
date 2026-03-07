
<template>
  <div class="">
    <q-dialog v-model="comment" persistent>
        <Comments />
    </q-dialog>
    <q-footer v-if=" true" bordered :class="$q.dark.isActive ? 'bg-dark text-white' : 'bg-primary text-white'">
      <q-toolbar>
        <q-toolbar-title>
          <div class="row q-py-sm  justify-between ">
            <div class="col-md-9   items-center" style="font-size:13px;" >
              &copy; {{ User?.Entidade?.created_at==null? '2020' : User?.Entidade?.created_at }} - {{ new Date().getFullYear() }} {{ User?.Entidade?.tipoEntidade }} {{ User?.Entidade?.nome }}
            </div>
            <div class="col-md-3 text-right  items-center" style="font-size:12px;">
              <q-spinner-gears size="md" color="white" v-show="Load.count !==0"/>
              <label v-show="Load.count !==0">{{ Load.count }}</label> <label  @click="this.comment = !this.comment">  {{tdc('Enviar comentário ou opinião')}} </label>
            </div>
          </div>
        </q-toolbar-title>
      </q-toolbar>
    </q-footer>
  </div>
</template>

<script>
import { defineComponent } from 'vue'
import { tdc } from '../../boot/base';
import { LoadStore, UserStore } from '../../stores/TipoEntidadeStore';
import Comments from "./Comments.vue";


export default defineComponent({

  components: {
    Comments
  },

  setup () {
    const User = UserStore
    const Load = LoadStore()
    return {
      User,
      Load
    }
  },
  props: {
    css: {
      type: String,
      required: false,
      default: ''
    }
  },

  data () {
    return {
      comment: false,
      tdc: tdc,
    }
  },
  created () {
  },
  computed: {
  },
  mounted () {
    
  },

  methods: {

  }
})
</script>
