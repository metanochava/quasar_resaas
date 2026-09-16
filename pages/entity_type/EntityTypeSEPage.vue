<template>
  <q-page class="column q-pa-sm full-height overflow-hidden">

    <!-- ===================================================== -->
    <!-- APPS -->
    <!-- ===================================================== -->

    <q-dialog
      v-model="openApps"
      persistent
      full-height
      full-width
    >
      <AppManager
        :entityTypeId="EntityType.form?.id"
      />
    </q-dialog>


    <!-- ===================================================== -->
    <!-- GROUPS -->
    <!-- ===================================================== -->

    <q-dialog
      v-model="openGroups"
      persistent
      full-height
      full-width
    >
      <GroupManager
        :entityTypeId="EntityType.form?.id"
      />
    </q-dialog>


    <!-- ===================================================== -->
    <!-- MODELS -->
    <!-- ===================================================== -->

    <q-dialog
      v-model="openModels"
      persistent
      full-height
      full-width
    >
      <ModelManager
        :entityTypeId="EntityType.form?.id"
      />
    </q-dialog>


    <!-- ===================================================== -->
    <!-- THEME STUDIO -->
    <!-- ===================================================== -->

    <q-dialog
      v-model="openTheme"
      persistent
      full-height
      full-width
    >

      <s-card class="q-pa-md">

        <!-- HEADER -->
        <q-bar
          :class="
            $q.dark.isActive
              ? 'bg-dark text-white'
              : 'bg-primary text-white'
          "
        >

          <q-toolbar-title>
            {{ tdc('Theme Management') }}
          </q-toolbar-title>

          <q-space />

          <s-btn
            dense
            flat
            round
            icon="close"
            @click="openTheme = false"
          />

        </q-bar>


        <q-separator />


        <!-- THEME STUDIO -->
        <ThemeStudioEngine
          v-model:scope="themeStudioScope"

          :allow-scope-select="false"

          :entity-type="EntityType.form"

          :entity="null"

          :user="User.data"

          :entity-type-store="EntityType"

          :entity-store="Entity"

          :user-store="User"

          :themes="Theme.rows"

          :layouts="LayoutSetting.rows"

          @saved="onThemeSaved"
        />

      </s-card>

    </q-dialog>


    <!-- ===================================================== -->
    <!-- CONTENT -->
    <!-- ===================================================== -->

    <div class="col overflow-hidden">


      <!-- LOADING -->
      <div
        v-if="EntityType.loading"
        class="flex flex-center q-pa-lg"
      >
        <q-spinner :color="$q.dark.isActive ? 'white' : 'primary'" size="48px" />
      </div>


      <!-- =================================================== -->
      <!-- FORM -->
      <!-- =================================================== -->

      <FormTwo
        v-else
        class="full-height"

        :store="EntityType"

        :ignore-fields="ignoreFields"

        @saved="onSaved"

        centerCol="col-8"

        rightCol="col-4"
      >

        <!-- ================================================= -->
        <!-- RIGHT -->
        <!-- ================================================= -->

        <template
          #right
          v-if="EntityType.form?.id"
        >

          <ManagementPanel>
            <ManagementItem
              icon="apps"
              :label="tdc('Apps')"
              @click="openApps = true"
            />

            <ManagementItem
              icon="view_module"
              :label="tdc('Models')"
              @click="openModels = true"
            />

            <ManagementItem
              icon="groups"
              :label="tdc('Groups')"
              @click="openGroups = true"
            />

            <ManagementItem
              icon="palette"
              :label="tdc('Theme Management')"
              @click="openThemeStudio"
            />
          </ManagementPanel>

          <div class="q-mt-md">
            <EntityTypeEntitiesPanel :entity-type-id="EntityType.form?.id" />
          </div>

        </template>


        <!-- ================================================= -->
        <!-- FOOTER -->
        <!-- ================================================= -->

        <template
          #footer
          v-if="EntityType.form?.id"
        >

          <div class="col-6">
            <MudarApp
              :entityTypeId="EntityType.form?.id"
            />
          </div>

          <div class="col-6">
            <MudarApp
              :entityTypeId="EntityType.form?.id"
            />
          </div>

        </template>

      </FormTwo>

    </div>

  </q-page>
</template>


<script setup>

import {
  ref,
  onMounted,
  watch
} from 'vue'


import {
  useRoute
} from 'vue-router'


// ===========================================================
// COMPONENTS
// ===========================================================

import FormTwo from '../../components/auto/FormTwo.vue'

import ManagementPanel from '../../components/auto/ManagementPanel.vue'

import ManagementItem from '../../components/auto/ManagementItem.vue'

import ModelManager from './ModelManager.vue'

import AppManager from './AppManager.vue'

import GroupManager from '../group/GroupManagerEntityType.vue'

import EntityTypeEntitiesPanel from './EntityTypeEntitiesPanel.vue'

import {
  ThemeStudioEngine
} from '../../components/theme/index.js'


// ===========================================================
// STORES
// ===========================================================

import {
  useEntityTypeStore
} from '../../stores/EntityTypeStore'

import {
  useEntityStore
} from '../../stores/EntityStore'

import {
  useUserStore
} from '../../stores/UserStore'

import {
  useThemeStore
} from '../../stores/ThemeStore'

import {
  useLayoutSettingStore
} from '../../stores/LayoutSettingStore'


// ===========================================================
// SERVICES
// ===========================================================

import {
  tdc
} from '../../services/translation'


// ===========================================================
// ROUTE
// ===========================================================

const route = useRoute()


// ===========================================================
// STORES
// ===========================================================

const EntityType =
  useEntityTypeStore()

const Entity =
  useEntityStore()

const User =
  useUserStore()

const Theme =
  useThemeStore()

const LayoutSetting =
  useLayoutSettingStore()


// ===========================================================
// STATE
// ===========================================================

const ready = ref(false)

const openApps = ref(false)

const openGroups = ref(false)

const openModels = ref(false)

const openTheme = ref(false)


// ===========================================================
// THEME STUDIO SCOPE
// ===========================================================

const themeStudioScope =
  ref('entity_type')


// ===========================================================
// IGNORE FIELDS
// ===========================================================

const ignoreFields = [

  'id',

  'created_at',

  'updated_at',

  'created_by',

  'updated_by',

  'deleted_at'

]


// ===========================================================
// PERMISSIONS
// ===========================================================

function canDo(perm) {

  if (!perm) {
    return true
  }

  return true

}


// ===========================================================
// LOAD DATA
// ===========================================================

async function load(id) {

  if (!id) {

    EntityType.resetForm?.()

    return
  }


  // =========================================================
  // EVITA REQUEST DUPLICADO
  // =========================================================

  if (
    String(EntityType.row?.id)
    ===
    String(id)
  ) {

    EntityType.form =
      EntityType.row

    return

  }


  // =========================================================
  // LOAD ENTITY TYPE
  // =========================================================

  EntityType.row =
    await EntityType.getById(id)


  // =========================================================
  // GARANTE QUE O FORM TEM O OBJECTO CARREGADO
  // =========================================================

  EntityType.form =
    EntityType.row

}


// ===========================================================
// OPEN THEME STUDIO
// ===========================================================

async function openThemeStudio() {

  if (!EntityType.form?.id) {
    return
  }


  try {

    // =======================================================
    // DESTA PÁGINA SÓ EDITAMOS ENTITY TYPE
    // =======================================================

    themeStudioScope.value =
      'entity_type'


    // =======================================================
    // LOAD CATALOGS
    // =======================================================

    await Promise.all([

      Theme.loadData?.({
        page_size: 100
      }),

      LayoutSetting.loadData?.({
        page_size: 100
      })

    ])


    // =======================================================
    // OPEN
    // =======================================================

    openTheme.value =
      true

  }

  catch (error) {

    console.error(
      'Error opening Theme Studio:',
      error
    )

  }

}


// ===========================================================
// INIT
// ===========================================================

async function init() {

  try {

    ready.value =
      false


    // =======================================================
    // INIT STORE
    // =======================================================

    await EntityType.init()


    // =======================================================
    // LOAD CURRENT
    // =======================================================

    const id =
      route.params.id


    await load(id)


    ready.value =
      true

  }

  catch (err) {

    console.error(
      'Error initializing page:',
      err
    )

  }

}


// ===========================================================
// WATCH ROUTE
// ===========================================================

watch(

  () =>
    route.params.id,

  async (id) => {

    if (!id) {
      return
    }


    await load(id)

  }

)


// ===========================================================
// FORM SAVED
// ===========================================================

function onSaved(res) {

  if (!res) {
    return
  }


  EntityType.row =
    res


  EntityType.form =
    res

}


// ===========================================================
// THEME SAVED
// ===========================================================

async function onThemeSaved() {

  try {

    // =======================================================
    // RELOAD ENTITY TYPE
    // =======================================================

    if (
      EntityType.form?.id
    ) {

      const entityType =
        await EntityType.getById(
          EntityType.form.id
        )


      if (entityType) {

        EntityType.row =
          entityType

        EntityType.form =
          entityType

      }

    }


    // =======================================================
    // SE ESTE ENTITY TYPE FOR O PAI DA ENTITY ACTUAL
    // DO USER, ACTUALIZAR CONFIGURAÇÃO EFFECTIVA
    // =======================================================

    const currentEntityTypeRef =
      User?.Entity?.entity_type


    const currentEntityTypeId =
      currentEntityTypeRef?.id
      ||
      currentEntityTypeRef?.value
      ||
      currentEntityTypeRef


    if (
      String(currentEntityTypeId)
      ===
      String(EntityType.form?.id)
    ) {

      // =====================================================
      // SE O USER TIVER MÉTODO PARA RECARREGAR CONFIGURAÇÃO
      // =====================================================

      if (
        typeof User.loadEffectiveLayout
        ===
        'function'
      ) {

        await User.loadEffectiveLayout()

      }

    }

  }

  catch (error) {

    console.error(
      'Error refreshing Theme Studio:',
      error
    )

  }

}


// ===========================================================
// LIFECYCLE
// ===========================================================

onMounted(init)

</script>