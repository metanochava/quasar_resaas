// =========================================================
// STORES
// =========================================================

const RESAAS_STORE_IMPORTS = [

  'useUserStore',
  'useEntityStore',
  'useEntityTypeStore',
  'useBranchStore',
  'useMenuStore',
  'usePersonStore',

  'useActionStore',
  'useAlertStore',
  'useEmployeeStore',
  'useGroupStore',
  'useLanguageStore',
  'useLoadStore',
  'usePermissionStore',

]


// =========================================================
// API
// =========================================================

const RESAAS_API_IMPORTS = [

  'HTTPAuth',
  'HTTPAuthBlob',

  'HTTPClient',
  'HTTPClientBlob',

  'wsApi',

  'url',

]


// =========================================================
// COMPOSABLES
// =========================================================

const RESAAS_COMPOSABLE_IMPORTS = [

  'useResaas',

]


// =========================================================
// UTILS
// =========================================================

const RESAAS_UTIL_IMPORTS = [

  // Translation
  'tdc',

  // JSON
  'safeParse',
  'JSONSafeParse',

  // Form
  'buildFormFromSchema',

  // Store factory
  'createBaseStore',

  // Display
  'profileSplint',
  'autoLabel',

  // Text
  'ascii',
  'toPlural',

  // Routes
  'resolveRoute',

  // Entity
  'isEntityTypeMe',
  'isEntityType',

  // Theme
  'setSettings',

  // Token
  'createToken',

  // Date
  'ds',

]


// =========================================================
// STORAGE
// =========================================================

const RESAAS_STORAGE_IMPORTS = [

  'setCookie',
  'getCookie',

  'setStorage',
  'getStorage',
  'deleteStorage',

  'localStorageSetItem',

]


// =========================================================
// ALERTS
// =========================================================

const RESAAS_ALERT_IMPORTS = [

  'Alert',
  'AlertSuccess',
  'AlertError',
  'AlertInfo',

]


// =========================================================
// ROUTER
// =========================================================

const RESAAS_ROUTER_IMPORTS = [

  'restRoutes',
  'authRoutes',

]


// =========================================================
// ALL
// =========================================================

const RESAAS_AUTO_IMPORTS = [

  ...RESAAS_STORE_IMPORTS,

  ...RESAAS_API_IMPORTS,

  ...RESAAS_COMPOSABLE_IMPORTS,

  ...RESAAS_UTIL_IMPORTS,

  ...RESAAS_STORAGE_IMPORTS,

  ...RESAAS_ALERT_IMPORTS,

  ...RESAAS_ROUTER_IMPORTS,

]


module.exports = RESAAS_AUTO_IMPORTS