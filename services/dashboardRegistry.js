import {
  shallowReactive
} from "vue"


// ============================================================
// GLOBAL REGISTRY KEY
// ============================================================
//
// Symbol.for garante que diferentes instâncias/bundles da
// quasar_resaas usam exactamente o mesmo registry.
//
// ============================================================

const REGISTRY_KEY =
  Symbol.for(
    "quasar_resaas.dashboardRegistry"
  )


// ============================================================
// GLOBAL REGISTRY
// ============================================================

if (!globalThis[REGISTRY_KEY]) {

  globalThis[REGISTRY_KEY] =
    shallowReactive([])

}

const dashboards =
  globalThis[REGISTRY_KEY]


// ============================================================
// REGISTER DASHBOARD
// ============================================================

export function registerDashboard(
  dashboard
) {

  if (!dashboard) {
    return
  }


  // ----------------------------------------------------------
  // ARRAY
  // ----------------------------------------------------------

  if (
    Array.isArray(dashboard)
  ) {

    dashboard.forEach(
      item =>
        registerDashboard(item)
    )

    return
  }


  // ----------------------------------------------------------
  // VALIDATION
  // ----------------------------------------------------------

  if (!dashboard.name) {

    console.warn(
      "[RESAAS Dashboard] Dashboard sem name:",
      dashboard
    )

    return
  }


  // ----------------------------------------------------------
  // DUPLICATE
  // ----------------------------------------------------------

  const exists =
    dashboards.some(
      item =>
        item.name === dashboard.name &&
        item.module === dashboard.module
    )


  if (exists) {

    console.debug(
      "[RESAAS Dashboard] Já registado:",
      dashboard.module,
      dashboard.name
    )

    return
  }


  // ----------------------------------------------------------
  // REGISTER
  // ----------------------------------------------------------

  dashboards.push(
    dashboard
  )


  // ----------------------------------------------------------
  // SORT
  // ----------------------------------------------------------

  dashboards.sort(
    (a, b) =>
      (a.order ?? 999) -
      (b.order ?? 999)
  )

}


// ============================================================
// REGISTER DASHBOARDS
// ============================================================

export function registerDashboards(
  items
) {

  if (!items) {
    return
  }


  if (
    Array.isArray(items)
  ) {

    items.forEach(
      item =>
        registerDashboard(item)
    )

    return
  }


  registerDashboard(
    items
  )

}


// ============================================================
// GET DASHBOARDS
// ============================================================

export function getDashboards() {

  return dashboards

}


// ============================================================
// CLEAR
// ============================================================

export function clearDashboards() {

  dashboards.splice(
    0,
    dashboards.length
  )

}


// ============================================================
// DEBUG
// ============================================================

export function debugDashboards() {

  return dashboards

}