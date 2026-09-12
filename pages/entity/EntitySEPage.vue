<template>
  <q-page class="q-pa-sm">

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
        :entityId="Entity.form?.id"
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

          :entity-type="EntityType.row"

          :entity="Entity.form"

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
    <!-- LOADING -->
    <!-- ===================================================== -->

    <div
      v-if="Entity.loading"
      class="flex flex-center q-pa-lg"
    >

      <q-spinner
        size="40px"
        color="primary"
      />

    </div>


    <!-- ===================================================== -->
    <!-- FORM -->
    <!-- ===================================================== -->

    <FormTwo
      v-else

      :store="Entity"

      :ignore-fields="ignoreFields"

      @saved="onSaved"
    >

      <!-- =================================================== -->
      <!-- RIGHT -->
      <!-- =================================================== -->

      <template
        #right
        v-if="Entity.form?.id"
      >

        <ManagementPanel>
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

      </template>


      <!-- =================================================== -->
      <!-- FOOTER -->
      <!-- =================================================== -->

      <template
        #footer
        v-if="Entity.form?.id"
      >

      </template>

    </FormTwo>

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

import GroupManager from '../group/GroupManagerEntity.vue'

import {
  ThemeStudioEngine
} from '../../components/theme/index.js'


// ===========================================================
// STORES
// ===========================================================

import {
  useEntityStore
} from '../../stores/EntityStore'

import {
  useEntityTypeStore
} from '../../stores/EntityTypeStore'

import {
  useThemeStore
} from '../../stores/ThemeStore'

import {
  useLayoutSettingStore
} from '../../stores/LayoutSettingStore'

import {
  useUserStore
} from '../../stores/UserStore'


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

const Entity = useEntityStore()

const EntityType = useEntityTypeStore()

const Theme = useThemeStore()

const LayoutSetting = useLayoutSettingStore()

const User = useUserStore()


// ===========================================================
// STATE
// ===========================================================

const ready = ref(false)

const openGroups = ref(false)

const openTheme = ref(false)


// ===========================================================
// THEME STUDIO
// ===========================================================

const themeStudioScope = ref('entity')


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
// LOAD ENTITY
// ===========================================================

async function load(id) {

  if (!id) {

    Entity.resetForm?.()

    return

  }


  // =========================================================
  // EVITA REQUEST DUPLICADO
  // =========================================================

  if (
    String(Entity.row?.id)
    ===
    String(id)
  ) {

    Entity.form = Entity.row

    return

  }


  // =========================================================
  // LOAD
  // =========================================================

  Entity.row =
    await Entity.getById(id)


  Entity.form =
    Entity.row

}


// ===========================================================
// LOAD ENTITY TYPE
// ===========================================================

async function loadEntityType() {

  const entityTypeRef =
    Entity.form?.entity_type


  const entityTypeId =
    entityTypeRef?.id
    ||
    entityTypeRef?.value
    ||
    entityTypeRef


  if (!entityTypeId) {
    return
  }


  // =========================================================
  // SE JÁ ESTIVER CARREGADO
  // =========================================================

  if (
    String(EntityType.row?.id)
    ===
    String(entityTypeId)
  ) {
    return
  }


  await EntityType.getById(
    entityTypeId
  )

}


// ===========================================================
// OPEN THEME STUDIO
// ===========================================================

async function openThemeStudio() {

  if (!Entity.form?.id) {
    return
  }


  try {

    // =======================================================
    // Scope fixo desta página
    // =======================================================

    themeStudioScope.value =
      'entity'


    // =======================================================
    // Carregar EntityType
    // =======================================================

    await loadEntityType()


    // =======================================================
    // Catálogos
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
    // ABRIR
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
    // STORE INIT
    // =======================================================

    await Entity.init()


    // =======================================================
    // ENTITY
    // =======================================================

    const id =
      route.params.id


    await load(id)


    // =======================================================
    // ENTITY TYPE
    // =======================================================

    await loadEntityType()


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

    await loadEntityType()

  }

)


// ===========================================================
// FORM SAVED
// ===========================================================

function onSaved(res) {

  if (res) {

    Entity.row =
      res

    Entity.form =
      res

  }

}


// ===========================================================
// THEME SAVED
// ===========================================================

async function onThemeSaved() {

  try {

    // =======================================================
    // RELOAD DA ENTITY
    // =======================================================

    if (Entity.form?.id) {

      const entity =
        await Entity.getById(
          Entity.form.id
        )


      if (entity) {

        Entity.row =
          entity

        Entity.form =
          entity

      }

    }


    // =======================================================
    // Se a Entity actual for também a Entity activa do User,
    // actualiza a configuração efectiva da interface.
    // =======================================================

    if (
      String(User?.Entity?.id)
      ===
      String(Entity.form?.id)
    ) {

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