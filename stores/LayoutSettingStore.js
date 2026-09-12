import { createBaseStore } from '../base/base_store'

// Lista/CRUD genérico de LayoutSetting
// (django_resaas.saas.models.layout_setting.LayoutSetting) - ver
// stores/ThemeStore.js para a mesma justificação (opções do Theme
// Studio).
export const useLayoutSettingStore = createBaseStore(
  'layoutsetting',
  {
    app: 'django_resaas',
    model: 'LayoutSetting'
  }
)
