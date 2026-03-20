
<template>

    <s-card>
        <q-bar :class="$q.dark.isActive ? 'bg-primary text-white' : 'bg-primary text-white'">
        &nbsp; {{tdc('')}} {{ modulo }}  | {{ modelo }} 
        <q-space />
        <s-btn dense flat icon="close" v-close-popup>
            <q-tooltip>{{tdc('Fechar')}}</q-tooltip>
        </s-btn>
        </q-bar>

        <q-card-section >
            <s-input outlined
                v-model="text_text"
                class=""
                dense
                :placeholder="tdc('Escreve aqui o codigo da accao')"
                type="textarea"
                :rules="[ val => val && val.length > 0 || tdc('Este campo e obrigatório.')]"
                />
        </q-card-section>

        <q-card-section >
        {{accao}}
        </q-card-section>
        <q-separator />

        <q-card-actions align="right">
        <s-btn  v-close-popup   :color="$q.dark.isActive ? '' : 'dark'" >{{tdc('Cancelar')}}</s-btn>
        <s-btn  :color="$q.dark.isActive ? 'primary' : 'primary'" type="submit" @click="save_text" > {{tdc('Enviar')}}</s-btn>
        </q-card-actions>
    </s-card>

</template>


<script>
import { defineComponent } from 'vue'
import { tdc } from '../../boot/base'

export default defineComponent({

  setup () {
    return {
      
    }
  },
  props: {
    modulo: {
      type: String,
      required: false,
      default: ''
    },
    modelo: {
      type: String,
      required: false,
      default: ''
    },
    accao: {
      type: Array,
      required: false,
      default: ''
    }
  },

  data () {
    return {
      tdc: tdc
    }
  },
  created () {
  },
  computed: {
  },
  mounted () {
    
  },

  methods: {
    save_text () {
      this.text = !this.text
    }
  }
})
</script>
