
<template>
   <div class="">
        <s-card>
          <q-bar :class="$q.dark.isActive ? 'bg-primary text-white' : 'bg-primary text-white'">
            &nbsp; {{tdc('Enviar comentário ou opinião')}} 
            <q-space />
            <s-btn dense flat icon="close" v-close-popup>
              <q-tooltip>{{tdc('Fechar')}}</q-tooltip>
            </s-btn>
          </q-bar>

          <q-card-section >
            <s-input outlined
                v-model="comment_text"
                class=""
                dense
                :placeholder="tdc('Tem algum feedback? Adoraríamos ouvir; mas não compartilhe informações confidenciais. Tem perguntas? Tente ajuda ou suporte.')"
                type="textarea"
                :rules="[ val => val && val.length > 0 || tdc('Este campo e obrigatório.')]"
                />
          </q-card-section>

          <q-card-section >
            {{tdc('Algumas informações da conta e do sistema podem ser enviadas para a Mytech. Nós o usaremos para corrigir problemas e melhorar nossos serviços de acordo com nossa Política de Privacidade e Termos de Serviço. Podemos enviar um e-mail para mais informações ou atualizações. Vá para a Ajuda Jurídica para solicitar alterações de conteúdo por motivos legais.')}}
          </q-card-section>
          <q-separator />

          <q-card-actions align="right">
            <s-btn  v-close-popup   :color="$q.dark.isActive ? '' : 'dark'" >{{tdc('Cancelar')}}</s-btn>
            <s-btn   :color="$q.dark.isActive ? 'primary' : 'primary'" type="submit" @click="comentar" > {{tdc('Enviar')}}</s-btn>
          </q-card-actions>
        </s-card>
    
  </div>
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
    css: {
      type: String,
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

    modal_comment () {
      this.comment = !this.comment
    }
  }
})
</script>
