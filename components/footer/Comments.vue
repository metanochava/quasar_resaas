
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
                :placeholder="tdc('Have feedback or suggestions? We would be happy to hear from you. Please do not include passwords, sensitive personal data, or confidential organizational information. <br>Need assistance? Visit the Help Center or contact your organization\'s support team.').replaceAll('<br>', '\n\n')"
                type="textarea"
                :rules="[ val => val && val.length > 0 || tdc('This field is required.')]"
                />
          </q-card-section>

          <q-card-section >
            <div
              v-html="tdc('Some account, entity, branch, and system information may be collected and processed to provide support, diagnose and resolve technical issues, maintain security, and improve the quality of our services. This information may be shared with authorized administrators or service providers when necessary, in accordance with the applicable Privacy Policy and Terms of Service. <br><br> We may contact you by email or other authorized communication channels if additional information is required or to provide updates regarding your request. For privacy, data protection, or legal matters, please contact your organization or the appropriate system administrator.')"
            ></div>
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
