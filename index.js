import './css/theme_engine.css'


// =========================================================
// ROUTERS
// =========================================================

export * from './router/restRoutes.js'
export * from './router/authRoutes.js'
export * from './router/docsRoutes.js'
export * from './router/authGuard.js'


// =========================================================
// COMPOSABLES
// =========================================================

export * from './composables/useResaas.js'
export * from './composables/usePersonIntake.js'


// =========================================================
// STORES
// =========================================================

export * from './stores/UserStore.js'
export * from './stores/EntityStore.js'
export * from './stores/EntityTypeStore.js'
export * from './stores/BranchStore.js'
export * from './stores/MenuStore.js'
export * from './stores/PersonStore.js'
export * from './stores/PersonContactStore.js'
export * from './stores/DocumentStore.js'
export * from './stores/DocumentTypeStore.js'

export * from './stores/ThemeStore.js'
export * from './stores/LayoutSettingStore.js'

export * from './stores/ActionStore.js'
export * from './stores/AlertStore.js'
export * from './stores/EmployeeStore.js'
export * from './stores/GroupStore.js'
export * from './stores/LanguageStore.js'
export * from './stores/LoadStore.js'
export * from './stores/PermissionStore.js'
export * from './stores/DashboardStore.js'


// =========================================================
// BASE
// =========================================================

export * from './base/base_store.js'


// =========================================================
// UTILS
// =========================================================

export * from './utils/autoForm.js'

export * from './utils/json.js'
export * from './utils/text.js'
export * from './utils/profile.js'
export * from './utils/schema.js'
export * from './utils/display.js'
export * from './utils/payload.js'


// =========================================================
// SERVICES
// =========================================================

// API
export * from './services/api.js'

// App
export * from './services/app.js'

// Base
export * from './services/base.js'

// Data
export * from './services/data.js'

// Storage
export * from './services/storage.js'

// Translation
export * from './services/translation.js'

// Theme (compat: setSettings) + utilitários organizados em ../theme/
export * from './services/theme.js'

export {
  resolveEffectiveConfig,
  EFFECTIVE_CONFIG_FIELDS,
  surfaceToStyle,
  surfaceOverlayStyle,
  surfaceIcon,
  surfacesToMap,
  surfacesToList,
  applyTheme,
  applyLayout,
  applyTypography,
  applyAnimation,
} from './theme/index.js'

// Routing
export * from './services/routing.js'

// Token
export * from './services/token.js'

// Tenant context
export * from './services/tenantContext.js'


// =========================================================
// BOOT
// =========================================================

export * from './boot/alerts.js'


// =========================================================
// COMPONENTS / LAYOUTS
// =========================================================

export { default as Components } from './boot/components.js'


export {
  registerDashboard,
  registerDashboards,
  getDashboards,
  clearDashboards
} from "./services/dashboardRegistry"

export {
  default as MainLayout
} from './layouts/MainLayout.vue'

export {
  default as AuthLayout
} from './layouts/AuthLayout.vue'

export {
  default as DocLayout
} from './layouts/DocLayout.vue'

export {
  default as CrudPage
} from './pages/CrudPage.vue'

export {
  default as DashboardRenderer
} from './components/dashboard/DashboardRenderer.vue'

export {
  default as HomeDashboards
} from './components/dashboard/HomeDashboards.vue'

export {
  ThemeStudioEngine,
  VisualAreaEditor,
  ColorField,
  GradientBuilder,
} from './components/theme/index.js'

export {
  widgetComponents,
  registerWidgetType,
  resolveWidgetComponent,
} from './components/dashboard/registry.js'

export {
  resolveDashboardAction,
  registerActionHandler,
  resolveTemplate,
} from './services/dashboardActions.js'


export {
  default as firebase,
  initFirebase,
  getFirebase
} from './firebase/index.js'

