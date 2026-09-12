import { createBaseStore } from '../base/base_store'

// Lista/CRUD genérico de Theme (django_resaas.saas.models.theme.Theme)
// - usado pelo Theme Studio para popular as opções seleccionáveis a
// cada nível (EntityType/Entity/User). Segue o mesmo padrão de
// EntityTypeStore/EntityStore (createBaseStore + app/model), sem
// estado extra: a resolução de herança fica em
// theme/resolveEffectiveConfig.js, não aqui.
export const useThemeStore = createBaseStore(
  'theme',
  {
    app: 'django_resaas',
    model: 'Theme'
  }
)
