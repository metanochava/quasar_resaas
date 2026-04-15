
import { boot } from 'quasar/wrappers'
import BtnComponent from './../components/engine/BtnComponent.vue'
import CardComponent from './../components/engine/CardComponent.vue'
import InputComponent from './../components/engine/InputComponent.vue'
import SelectComponent from './../components/engine/SelectComponent.vue'
import DrawerComponent from './../components/engine/DrawerComponent.vue'
import FieldComponent from './../components/engine/FieldComponent.vue'

import UploadComponent from "./../components/engine/UploadComponent.vue"
import CheckBoxComponent from "./../components/engine/CheckBoxComponent.vue"
import SwitchComponent from "./../components/engine/SwitchComponent.vue"

export default boot(({ app }) => {

  app.component('s-btn', BtnComponent)
  app.component('s-card', CardComponent)
  app.component('s-input', InputComponent)
  app.component('s-select', SelectComponent)
  app.component('s-drawer', DrawerComponent)
  app.component('s-field', FieldComponent)
  app.component('s-upload', UploadComponent)
  app.component('s-checkbox', CheckBoxComponent)
  app.component('s-switch', SwitchComponent)


})