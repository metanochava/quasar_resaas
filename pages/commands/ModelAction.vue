
<template>

    <s-modal-card :title="`${app} | ${model}`" icon="code" width="640px">
        <s-input outlined
            v-model="text_text"
            class=""
            dense
            :placeholder="tdc('Write the action code here')"
            type="textarea"
            :rules="[ val => val && val.length > 0 || tdc('This field is required.')]"
            />

        <div class="q-mt-md">{{accao}}</div>

        <template #footer>
        <s-btn  v-close-popup   :color="$q.dark.isActive ? '' : 'dark'" >{{tdc('Cancel')}}</s-btn>
        <s-btn  :color="$q.dark.isActive ? 'primary' : 'primary'" type="submit" @click="save_text" > {{tdc('Submit')}}</s-btn>
        </template>
    </s-modal-card>

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
    app: {
      type: String,
      required: false,
      default: ''
    },
    model: {
      type: String,
      required: false,
      default: ''
    },
    accao: {
      type: Object,
      required: false,
      default: () => ({})
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
