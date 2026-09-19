<script>
import { defineComponent } from 'vue'
import { usePageTitle } from '../../services/pageTitle'

// Renderless: overrides the browser tab title for as long as it is mounted
// and `active` is true - meant for templates (modals/dialogs) that have no
// script of their own to call usePageTitle() from:
//
//   <s-page-title :title="tdc('We found possible matches')" :active="modelValue" />
export default defineComponent({
  name: 's-page-title',
  props: {
    title: { type: String, default: '' },
    active: { type: Boolean, default: true }
  },
  setup(props) {
    usePageTitle(() => props.title, { active: () => props.active })

    return () => null
  }
})
</script>
