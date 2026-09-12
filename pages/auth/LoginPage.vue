<template>

  <q-page class="column">

    <s-card
      flat
      class="col relative-position overflow-hidden"
      :style="loginBackgroundStyle"
    >

      <!-- ================================================
           BACKGROUND OVERLAY
      ================================================= -->

      <div
        v-if="loginConfig.overlay > 0"
        class="absolute-full"
        :style="loginOverlayStyle"
      />


      <!-- ================================================
           LOGIN CONTENT
      ================================================= -->

      <div
        class="absolute-full row q-pa-md"
        :class="loginPositionClass"
        style="z-index: 1"
      >

        <FormLogin />

      </div>

    </s-card>

  </q-page>

</template>


<script setup>

import { computed } from 'vue'
import { useQuasar } from 'quasar'

import {
  useEntityStore,
  useEntityTypeStore
} from 'quasar_resaas'


import FormLogin from './../../components/FormLogin.vue'


const $q = useQuasar()

const Entity = useEntityStore()

const EntityType = useEntityTypeStore()


// =========================================================
// ENTITY
// =========================================================

const currentEntity = computed(() => {

  return (
    Entity?.row ||
    null
  )

})


// =========================================================
// ENTITY TYPE
// =========================================================

const currentEntityType = computed(() => {

  // =======================================================
  // PRIMEIRO:
  // EntityTypeStore
  // =======================================================

  if (EntityType?.row) {
    return EntityType.row
  }


  // =======================================================
  // FALLBACK:
  // Entity.entity_type caso venha expandido no serializer
  // =======================================================

  if (
    currentEntity.value?.entity_type
    &&
    typeof currentEntity.value.entity_type === 'object'
  ) {
    return currentEntity.value.entity_type
  }


  return null

})


// =========================================================
// ENTITY LOGIN CONFIG
// =========================================================

const entityLoginConfig = computed(() => {

  const entity =
    currentEntity.value

  if (!entity) {
    return {}
  }

  // EntitySerializer.get_login_config() - resolvido a partir de
  // ThemeSurface (área 'login') + LayoutSetting.login_position, nunca
  // dos antigos campos soltos login_position/login_background_* em
  // Entity (que já não existem no modelo - ver CLAUDE.md secção 21).
  return entity.login_config || {}

})


// =========================================================
// ENTITY TYPE LOGIN CONFIG
// =========================================================

const entityTypeLoginConfig = computed(() => {

  const entityType =
    currentEntityType.value

  if (!entityType) {
    return {}
  }

  // EntityTypeSerializer.get_login_config() - mesma resolução que
  // entityLoginConfig acima (ThemeSurface + LayoutSetting).
  return entityType.login_config || {}

})


// =========================================================
// FINAL LOGIN CONFIG
//
// PRIORIDADE:
//
// 1. Entity
// 2. EntityType
// 3. RESAAS default
// =========================================================

const loginConfig = computed(() => {

  const entity =
    entityLoginConfig.value || {}

  const entityType =
    entityTypeLoginConfig.value || {}


  return {

    position:
      entity.position ||
      entityType.position ||
      'center',


    background:
      entity.background ||
      entityType.background ||
      {
        type: 'color',

        value:
          $q.dark.isActive
            ? '#121212'
            : '#ffffff'
      },


    // IMPORTANTE:
    // usamos ?? porque 0 é um valor válido
    overlay:
      entity.overlay ??
      entityType.overlay ??
      0

  }

})


// =========================================================
// POSITION
// =========================================================

const loginPositionClass = computed(() => {

  const positions = {

    'top-left':
      'items-start justify-start',

    'top-right':
      'items-start justify-end',

    'center':
      'items-center justify-center',

    'bottom-left':
      'items-end justify-start',

    'bottom-right':
      'items-end justify-end'

  }


  return (
    positions[
      loginConfig.value.position
    ]
    ||
    positions.center
  )

})


// =========================================================
// BACKGROUND
// =========================================================

const loginBackgroundStyle = computed(() => {

  const background =
    loginConfig.value.background


  // =======================================================
  // DEFAULT
  // =======================================================

  if (!background) {

    return {

      backgroundColor:
        $q.dark.isActive
          ? '#121212'
          : '#ffffff'

    }

  }


  // =======================================================
  // RESAAS BACKGROUND OBJECT
  //
  // {
  //     type: "image|gradient|color",
  //     value: "..."
  // }
  // =======================================================

  if (
    typeof background === 'object'
  ) {

    const type =
      background?.type

    const value =
      background?.value


    // =====================================================
    // IMAGE
    // =====================================================

    if (
      type === 'image'
      &&
      value
    ) {

      return {

        backgroundImage:
          `url("${value}")`,

        backgroundSize:
          'cover',

        backgroundPosition:
          'center',

        backgroundRepeat:
          'no-repeat'

      }

    }


    // =====================================================
    // GRADIENT
    // =====================================================

    if (
      type === 'gradient'
      &&
      value
    ) {

      return {
        background: value
      }

    }


    // =====================================================
    // COLOR
    // =====================================================

    if (
      type === 'color'
      &&
      value
    ) {

      return {
        backgroundColor: value
      }

    }

  }


  // =======================================================
  // LAST FALLBACK
  //
  // EntitySerializer/EntityTypeSerializer.get_login_background()
  // devolve sempre {type, value} ou None - nunca uma string solta -,
  // por isso não há aqui um ramo de compatibilidade para strings.
  // =======================================================

  return {

    backgroundColor:
      $q.dark.isActive
        ? '#121212'
        : '#ffffff'

  }

})


// =========================================================
// OVERLAY
// =========================================================

const loginOverlayStyle = computed(() => {

  let overlay =
    Number(
      loginConfig.value.overlay
    )


  if (
    Number.isNaN(overlay)
  ) {
    overlay = 0
  }


  overlay =
    Math.min(
      1,
      Math.max(
        0,
        overlay
      )
    )


  return {

    backgroundColor:
      `rgba(0, 0, 0, ${overlay})`,

    zIndex: 0

  }

})

</script>