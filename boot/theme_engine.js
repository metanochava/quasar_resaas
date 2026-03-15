import './../css/theme_engine.css'

import { boot } from 'quasar/wrappers'
import TBtn from './../components/engine/BtnComponent.vue'
import TCard from './../components/engine/CardComponent.vue'
import TInput from './../components/engine/InputComponent.vue'
import TDrawer from './../components/engine/DrawerComponent.vue'

export default boot(({ app }) => {

  app.component('SBtn', TBtn)
  app.component('SCard', TCard)
  app.component('SInput', TInput)
  app.component('SDrawer', TDrawer)

})