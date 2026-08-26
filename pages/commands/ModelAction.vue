
<template>

    <s-card>
        <q-bar :class="$q.dark.isActive ? 'bg-dark text-white' : ' bg-primary text-white'">
        &nbsp; {{tdc('')}} {{ app }}  | {{ model }} 
        <q-space />
        <s-btn dense flat icon="close" v-close-popup>
            <q-tooltip>{{tdc('Close')}}</q-tooltip>
        </s-btn>
        </q-bar>

        <q-card-section >
            <s-input outlined
                v-model="text_text"
                class=""
                dense
                :placeholder="tdc('Write the action code here')"
                type="textarea"
                :rules="[ val => val && val.length > 0 || tdc('This field is required.')]"
                />
        </q-card-section>

        <q-card-section >
        {{accao}}
        </q-card-section>
        <q-separator />

        <q-card-actions align="right">
        <s-btn  v-close-popup   :color="$q.dark.isActive ? '' : 'dark'" >{{tdc('Cancel')}}</s-btn>
        <s-btn  :color="$q.dark.isActive ? 'primary' : 'primary'" type="submit" @click="save_text" > {{tdc('Submit')}}</s-btn>
        </q-card-actions>
    </s-card>

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
