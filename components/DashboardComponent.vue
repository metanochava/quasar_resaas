
<template>

  <q-page class="q-pa-sm">

    <!-- ===================================================== -->
    <!-- DASHBOARDS -->
    <!-- ===================================================== -->

    <div
      v-if="visibleDashboards.length"
      class="row q-col-gutter-sm"
    >

      <div
        v-for="dashboard in visibleDashboards"
        :key="dashboard.key"
        :class="dashboard.col"
      >

        <component
          v-if="dashboard.component"
          :is="dashboard.component"
          :dashboard="dashboard"
        />

      </div>

    </div>


    <!-- ===================================================== -->
    <!-- SEM DASHBOARDS -->
    <!-- ===================================================== -->

    <div
      v-else
      class="flex flex-center column"
      style="min-height: 70vh"
    >

      <img
        v-if="User?.Entity?.logo?.url"
        :alt="`${User?.Entity?.nome || ''} logo`"
        :src="User.Entity.logo.url"
        style="
          width: 200px;
          height: 200px;
          object-fit: contain;
        "
      />

      <div
        v-if="User?.Entity?.nome"
        class="text-h5 q-mt-md"
      >
        {{ User.Entity.nome }}
      </div>

    </div>

  </q-page>

</template>


<script setup>

import {
  ref,
  watch,
  onMounted,
  defineAsyncComponent,
  markRaw
} from "vue"

import {
  useUserStore
} from "../stores/UserStore"

import {
  getDashboards
} from "../services/dashboardRegistry"


// ============================================================
// USER
// ============================================================

const User =
  useUserStore()


// ============================================================
// DASHBOARDS VISÍVEIS
// ============================================================

const visibleDashboards =
  ref([])


// ============================================================
// COMPONENT CACHE
// ============================================================

const componentCache =
  new WeakMap()


// ============================================================
// PERMISSION
// ============================================================

const hasPermission = dashboard => {

  const permission =
    dashboard.permission


  // ----------------------------------------------------------
  // SEM PERMISSÃO
  // ----------------------------------------------------------

  if (
    permission === null ||
    permission === undefined ||
    permission === ""
  ) {
    return true
  }


  // ----------------------------------------------------------
  // STRING
  // ----------------------------------------------------------

  if (
    typeof permission === "string"
  ) {

    return User.can(
      permission
    )

  }


  // ----------------------------------------------------------
  // ARRAY
  // ----------------------------------------------------------

  if (
    Array.isArray(permission)
  ) {

    if (!permission.length) {
      return true
    }


    // --------------------------------------------------------
    // ALL
    // --------------------------------------------------------

    if (
      dashboard.permissionMode === "all"
    ) {

      return permission.every(
        item =>
          User.can(item)
      )

    }


    // --------------------------------------------------------
    // ANY - DEFAULT
    // --------------------------------------------------------

    return permission.some(
      item =>
        User.can(item)
    )

  }


  return true
}


// ============================================================
// NORMALIZE COMPONENT
// ============================================================

const normalizeComponent = component => {

  if (!component) {
    return null
  }


  if (
    typeof component === "function"
  ) {

    if (
      componentCache.has(
        component
      )
    ) {

      return componentCache.get(
        component
      )

    }


    const asyncComponent =
      markRaw(
        defineAsyncComponent(
          component
        )
      )


    componentCache.set(
      component,
      asyncComponent
    )

    return asyncComponent
  }

  return markRaw(
    component
  )
}

// ============================================================
// REFRESH DASHBOARDS
// ============================================================

const refreshDashboards = () => {

  const dashboards =
    getDashboards()


  visibleDashboards.value =
    dashboards

      .filter(
        dashboard =>
          dashboard &&
          dashboard.visible !== false
      )

      .filter(
        dashboard =>
          hasPermission(
            dashboard
          )
      )

      .sort(
        (a, b) =>
          (a.order ?? 999) -
          (b.order ?? 999)
      )

      .map(
        (dashboard, index) => ({

          ...dashboard,

          key:
            `${dashboard.module || "dashboard"}-${dashboard.name || index}`,

          col:
            dashboard.col ||
            "col-12 col-md-6",

          component:
            normalizeComponent(
              dashboard.component
            )

        })
      )
}


// ============================================================
// WATCH PERMISSIONS
// ============================================================

watch(
  () => [
    ...(User.Permissions || [])
  ],
  () => {

    refreshDashboards()

  },
  {
    immediate: true
  }
)


// ============================================================
// WATCH GROUP
// ============================================================

watch(
  () =>
    User.Group?.id,
  () => {

    refreshDashboards()

  }
)


// ============================================================
// WATCH ENTITY
// ============================================================

watch(
  () =>
    User.Entity?.id,
  () => {

    refreshDashboards()

  }
)


// ============================================================
// WATCH BRANCH
// ============================================================

watch(
  () =>
    User.Branch?.id,
  () => {

    refreshDashboards()

  }
)


// ============================================================
// PINIA STORE SUBSCRIPTION
// ============================================================

User.$subscribe(
  () => {

    refreshDashboards()

  },
  {
    detached: true
  }
)


// ============================================================
// MOUNT
// ============================================================

onMounted(
  () => {

    refreshDashboards()

  }
)

</script>