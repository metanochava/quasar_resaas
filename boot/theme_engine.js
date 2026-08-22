import { boot } from 'quasar/wrappers'


// =========================================================
// ENGINE COMPONENTS
// =========================================================

import BtnComponent from './../components/engine/BtnComponent.vue'
import CardComponent from './../components/engine/CardComponent.vue'
import InputComponent from './../components/engine/InputComponent.vue'
import DateComponent from './../components/engine/DateComponent.vue'
import TimeComponent from './../components/engine/TimeComponent.vue'
import DateTimeComponent from './../components/engine/DateTimeComponent.vue'
import EditorComponent from './../components/engine/EditorComponent.vue'
import SelectComponent from './../components/engine/SelectComponent.vue'
import DrawerComponent from './../components/engine/DrawerComponent.vue'
import FieldComponent from './../components/engine/FieldComponent.vue'
import UploadComponent from './../components/engine/UploadComponent.vue'
import CheckBoxComponent from './../components/engine/CheckBoxComponent.vue'
import SwitchComponent from './../components/engine/SwitchComponent.vue'
import Form from './../components/engine/FormComponent.vue'


// =========================================================
// AUTO COMPONENTS
// =========================================================

import AutoForm from './../components/auto/AutoForm.vue'
import FormTwo from './../components/auto/FormTwo.vue'
import ActionForm from './../components/auto/ActionForm.vue'
import AutoTable from './../components/auto/AutoTable.vue'
import AutoCrud from './../components/auto/AutoCrud.vue'
import CrudPage from './../components/auto/CrudPage.vue'
import ConfirmDeleteDialog from './../components/auto/ConfirmDeleteDialog.vue'


// =========================================================
// GENERAL COMPONENTS
// =========================================================

import AllLogo from './../components/AllLogo.vue'
import TopMenu from './../components/TopMenu.vue'

import PdfRender from './../components/PdfRender.vue'
import PdfRenderPro from './../components/PdfRenderPro.vue'

import HeaderBrand from './../components/header/HeaderBrand.vue'


// =========================================================
// HEADER COMPONENTS
// =========================================================

import HeaderDarkMode from './../components/header/HeaderDarkMode.vue'
import HeaderFullScreen from './../components/header/HeaderFullScreen.vue'
import HeaderLanguage from './../components/header/HeaderLanguage.vue'


// =========================================================
// PERSON COMPONENTS
// =========================================================

import PersonCard from './../components/person/PersonCard.vue'
import PersonCreateDialog from './../components/person/PersonCreateDialog.vue'
import PersonSearch from './../components/person/PersonSearch.vue'


// =========================================================
// BOOT
// =========================================================

export default boot(({ app }) => {


  // =======================================================
  // ENGINE
  // =======================================================

  app.component('s-btn', BtnComponent)

  app.component('s-card', CardComponent)

  app.component('s-input', InputComponent)

  app.component('s-date', DateComponent)

  app.component('s-time', TimeComponent)

  app.component('s-datetime', DateTimeComponent)

  app.component('s-editor', EditorComponent)

  app.component('s-select', SelectComponent)

  app.component('s-drawer', DrawerComponent)

  app.component('s-field', FieldComponent)

  app.component('s-upload', UploadComponent)

  // alias
  app.component('s-file', UploadComponent)

  app.component('s-checkbox', CheckBoxComponent)

  app.component('s-switch', SwitchComponent)

  app.component('s-form', Form)


  // =======================================================
  // AUTO
  // =======================================================

  app.component('s-auto-form', AutoForm)

  app.component('s-form-two', FormTwo)

  app.component('s-action-form', ActionForm)

  app.component('s-auto-table', AutoTable)

  app.component('s-auto-crud', AutoCrud)

  app.component('s-crud-page', CrudPage)

  app.component('s-confirm-delete',  ConfirmDeleteDialog  )


  // =======================================================
  // GENERAL
  // =======================================================

  app.component('s-all-logo', AllLogo)

  app.component('s-top-menu', TopMenu)

  app.component('s-pdf-render', PdfRender)

  app.component('s-pdf-render-pro', PdfRenderPro)

  app.component('s-header-brand', HeaderBrand)


  // =======================================================
  // HEADER
  // =======================================================

  app.component( 's-header-dark-mode', HeaderDarkMode  )

  app.component( 's-header-full-screen', HeaderFullScreen )

  app.component( 's-header-language',  HeaderLanguage )


  // =======================================================
  // PERSON
  // =======================================================

  app.component( 's-person-card', PersonCard )

  app.component( 's-person-create-dialog', PersonCreateDialog )

  app.component( 's-person-search', PersonSearch )

})