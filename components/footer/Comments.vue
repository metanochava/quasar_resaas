
<template>
   <div class="">
        <s-card>
          <q-bar :class="$q.dark.isActive ? 'bg-dark text-white' : ' bg-primary text-white'">
            &nbsp; {{tdc('Send comment or feedback')}}
            <q-space />
            <s-btn dense flat icon="close" v-close-popup>
              <q-tooltip>{{tdc('Close')}}</q-tooltip>
            </s-btn>
          </q-bar>

          <q-card-section >
            <s-input outlined
                v-model="comment_text"
                class=""
                dense
                :placeholder="tdc('Have some feedback? We would love to hear it; but please do not share confidential information. Have questions? Try help or support.')"
                type="textarea"
                :rules="[ val => val && val.length > 0 || tdc('This field is required.')]"
                />
          </q-card-section>

          <q-card-section >
            {{tdc('Some account and system information may be sent to Mytech. We will use it to fix problems and improve our services in accordance with our Privacy Policy and Terms of Service. We may send an email for more information or updates. Go to Legal Help to request content changes for legal reasons.')}}
          </q-card-section>
          <q-separator />

          <q-card-actions align="right">
            <s-btn  v-close-popup   :color="$q.dark.isActive ? '' : 'dark'" >{{tdc('Cancel')}}</s-btn>
            <s-btn   :color="$q.dark.isActive ? 'primary' : 'primary'" type="submit" @click="comentar" > {{tdc('Send')}}</s-btn>
          </q-card-actions>
        </s-card>
    
  </div>
</template>

<script>
import { defineComponent } from 'vue'
import { tdc } from '../../services/translation'

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
