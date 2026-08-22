 const RESAAS_STORE_IMPORTS = [
  'useUserStore',
  'useEntityStore',
  'useEntityTypeStore',
  'useBranchStore',
  'useMenuStore',
  'usePersonStore'
]

 const RESAAS_API_IMPORTS = [
  'HTTPAuth',
  'HTTPAuthBlob',
  'HTTPClient',
  'HTTPClientBlob',
  'wsApi',
  'url',

]

const RESAAS_UTIL_IMPORTS = [
  'tdc',
  'buildFormFromSchema',
  'createBaseStore',
  'safeParse'
]

const RESAAS_AUTO_IMPORTS = [
  ...RESAAS_STORE_IMPORTS,
  ...RESAAS_API_IMPORTS,
  ...RESAAS_UTIL_IMPORTS
]

module.exports = RESAAS_AUTO_IMPORTS