import { computed, reactive, ref, watch } from 'vue'
import { Notify } from 'quasar'

import { tdc } from '../../services/translation'
import { resolveEffectiveConfig } from '../../theme/resolveEffectiveConfig.js'
import { surfaceToStyle, surfacesToList } from '../../theme/surfaceToStyle.js'

// Estado + lógica do ThemeStudioEngine (ver CLAUDE.md secção 4: o
// .vue fica só com template/composição, este ficheiro concentra
// estado, herança, carregamento, gravação e helpers de preview).
//
// A resolução User > Entity > EntityType usa sempre
// theme/resolveEffectiveConfig.js - nunca duplicar aqui a cadeia de
// herança (CLAUDE.md secção 2).
const FIELD_TO_CONFIG_KEY = {
  theme: 'theme',
  layout_settings: 'layout',
  typography: 'typography',
  animation_settings: 'animation',
}

export function useThemeStudio(props, emit) {

  // =========================================================
  // SCOPE
  // =========================================================

  const tab = ref('theme')
  const saving = ref(false)
  const localScope = ref(props.scope)

  // Preview local - nunca aplica nada ao tema real da app (secção 16).
  const previewMode = ref('desktop') // desktop | mobile
  const previewDark = ref(false)

  const scopeOptions = computed(() => [
    { label: tdc('Entity Type'), value: 'entity_type', icon: 'category' },
    { label: tdc('Entity'), value: 'entity', icon: 'business' },
    { label: tdc('User'), value: 'user', icon: 'person' },
  ])

  const scopeLabel = computed(() => {
    if (localScope.value === 'entity_type') return tdc('Entity Type')
    if (localScope.value === 'entity') return tdc('Entity')
    return tdc('User')
  })

  const target = computed(() => {
    if (localScope.value === 'entity_type') return props.entityType
    if (localScope.value === 'entity') return props.entity
    return props.user
  })

  const targetName = computed(() => {
    const row = target.value
    return row?.name || row?.username || row?.label || row?.email || ''
  })

  const activeStore = computed(() => {
    if (localScope.value === 'entity_type') return props.entityTypeStore
    if (localScope.value === 'entity') return props.entityStore
    return props.userStore
  })

  const inheritanceDescription = computed(() => {
    if (localScope.value === 'entity') {
      return tdc('Empty values inherit the configuration defined in the Entity Type.')
    }

    if (localScope.value === 'user') {
      return tdc('Empty values inherit from the Entity. If the Entity has no override, the Entity Type configuration is used.')
    }

    return ''
  })

  // =========================================================
  // NORMALIZATION / OPTIONS
  // =========================================================

  function getValue(value) {
    if (value === undefined || value === null || value === '') return null

    if (typeof value === 'object') {
      return value.value ?? value.id ?? value.pk ?? null
    }

    return value
  }

  function optionLabel(row) {
    return row?.label || row?.name || row?.title || String(row?.id || '')
  }

  function makeOptions(rows) {
    return (rows || []).map(row => ({
      label: optionLabel(row),
      value: getValue(row),
      raw: row,
    }))
  }

  const themeOptions = computed(() => makeOptions(props.themes))
  const layoutOptions = computed(() => makeOptions(props.layouts))
  const typographyOptions = computed(() => makeOptions(props.typographies))
  const animationOptions = computed(() => makeOptions(props.animations))

  function findObject(rows, value) {
    const id = getValue(value)

    return (rows || []).find(row => String(getValue(row)) === String(id)) || null
  }

  // =========================================================
  // FORM
  // =========================================================

  const form = reactive({
    theme: null,
    layout_settings: null,
    typography: null,
    animation_settings: null,
  })

  const original = reactive({
    theme: null,
    layout_settings: null,
    typography: null,
    animation_settings: null,
  })

  function loadForm() {
    const row = target.value || {}

    const values = {
      theme: getValue(row.theme),
      layout_settings: getValue(row.layout_settings),
      typography: getValue(row.typography),
      animation_settings: getValue(row.animation_settings),
    }

    Object.assign(form, values)
    Object.assign(original, values)
  }

  function resetForm() {
    Object.assign(form, original)
  }

  function resetField(field) {
    form[field] = null
  }

  const dirty = computed(() => {
    return ['theme', 'layout_settings', 'typography', 'animation_settings'].some(
      key => String(form[key] ?? '') !== String(original[key] ?? '')
    )
  })

  // =========================================================
  // INHERITANCE (User > Entity > EntityType)
  // =========================================================

  // O que este scope herdaria se não tivesse valor próprio - nunca a
  // configuração completa deste scope, só o nível "acima" dele.
  const inheritedConfig = computed(() => {
    if (localScope.value === 'entity_type') {
      return resolveEffectiveConfig({})
    }

    if (localScope.value === 'entity') {
      return resolveEffectiveConfig({ entityType: props.entityType })
    }

    return resolveEffectiveConfig({
      entity: props.entity,
      entityType: props.entityType,
    })
  })

  function hasOverride(field) {
    return form[field] !== null && form[field] !== undefined && form[field] !== ''
  }

  function inheritedValue(field) {
    const key = FIELD_TO_CONFIG_KEY[field]
    return inheritedConfig.value.ids[key]
  }

  function effectiveValue(field) {
    const formValue = form[field]

    if (formValue !== null && formValue !== undefined && formValue !== '') {
      return formValue
    }

    return inheritedValue(field)
  }

  function sourceFor(field) {
    if (hasOverride(field)) return localScope.value

    const key = FIELD_TO_CONFIG_KEY[field]
    return inheritedConfig.value.sources[key]
  }

  // =========================================================
  // SELECTED OBJECTS
  // =========================================================

  const selectedTheme = computed(() => findObject(props.themes, effectiveValue('theme')))
  const selectedLayout = computed(() => findObject(props.layouts, effectiveValue('layout_settings')))
  const selectedTypography = computed(() => findObject(props.typographies, effectiveValue('typography')))
  const selectedAnimation = computed(() => findObject(props.animations, effectiveValue('animation_settings')))

  // =========================================================
  // EFFECTIVE LABEL / SOURCE TEXT
  // =========================================================

  function effectiveLabel(field) {
    const value = effectiveValue(field)

    if (!value) return tdc('Not configured')

    const rowsByField = {
      theme: props.themes,
      layout_settings: props.layouts,
      typography: props.typographies,
      animation_settings: props.animations,
    }

    const row = findObject(rowsByField[field], value)

    return optionLabel(row) || String(value)
  }

  function sourceText(source) {
    if (source === 'user') return tdc('This value is defined by the user.')
    if (source === 'entity') return tdc('This value comes from the entity.')
    if (source === 'entity_type') return tdc('This value comes from the entity type.')
    return tdc('No inherited configuration is available.')
  }

  function sourceShortLabel(source) {
    if (source === 'user') return tdc('User')
    if (source === 'entity') return tdc('Entity')
    if (source === 'entity_type') return tdc('Entity Type')
    return '-'
  }

  // =========================================================
  // THEME PREVIEW
  // =========================================================

  const previewColors = computed(() => {
    const theme = selectedTheme.value
    if (!theme) return []

    return [
      { key: 'primary', label: tdc('Primary'), value: theme.primary },
      { key: 'secondary', label: tdc('Secondary'), value: theme.secondary },
      { key: 'accent', label: tdc('Accent'), value: theme.accent },
      { key: 'positive', label: tdc('Positive'), value: theme.positive },
      { key: 'negative', label: tdc('Negative'), value: theme.negative },
      { key: 'warning', label: tdc('Warning'), value: theme.warning },
      { key: 'background', label: tdc('Background'), value: theme.background },
      { key: 'card', label: tdc('Card'), value: theme.card },
    ].filter(item => Boolean(item.value))
  })

  const themeSurfaces = computed(() => surfacesToList(selectedTheme.value?.surfaces))

  function getSurface(area) {
    return themeSurfaces.value.find(item => item.area === area) || null
  }

  function previewSurfaceStyle(area) {
    const surface = getSurface(area)

    if (surface) {
      // A cor final de cada superfície vem sempre de ThemeSurface, não
      // de campos soltos em Entity/EntityType/User (CLAUDE.md secção 21).
      return surfaceToStyle(surface)
    }

    const theme = selectedTheme.value || {}

    const fallback = {
      header: theme.header || theme.primary,
      sidebar: theme.sidebar,
      page: theme.page || theme.background,
      card: theme.card,
    }

    return { background: fallback[area] || 'transparent' }
  }

  function themeOptionStyle(theme) {
    return {
      background: `linear-gradient(135deg, ${theme?.primary || '#1976D2'} 0%, ${theme?.secondary || '#26A69A'} 55%, ${theme?.accent || '#9C27B0'} 100%)`,
    }
  }

  const previewAppStyle = computed(() => {
    const theme = selectedTheme.value || {}
    const dark = previewDark.value

    return {
      '--preview-primary': theme.primary || '#1976D2',
      '--preview-secondary': theme.secondary || '#26A69A',
      '--preview-text': dark ? (theme.text_light || '#FFFFFF') : (theme.text_primary || '#1D1D1D'),

      background: dark ? (theme.background_dark || '#121212') : (theme.background || '#f4f6f8'),
      color: dark ? (theme.text_light || '#FFFFFF') : (theme.text_primary || '#1D1D1D'),
    }
  })

  // =========================================================
  // TYPOGRAPHY PREVIEW
  // =========================================================

  const typographyStyle = computed(() => {
    const typography = selectedTypography.value
    if (!typography) return {}

    return {
      fontFamily: typography.font_family || 'inherit',
      fontSize: `${typography.font_size_base || 16}px`,
      lineHeight: typography.line_height || 1.5,
      letterSpacing: `${typography.letter_spacing || 0}px`,
    }
  })

  // =========================================================
  // HELPERS
  // =========================================================

  function boolLabel(value) {
    if (value === true) return tdc('Yes')
    if (value === false) return tdc('No')
    return '-'
  }

  const previewMenu = [
    { icon: 'dashboard' },
    { icon: 'people' },
    { icon: 'inventory_2' },
    { icon: 'settings' },
  ]

  // =========================================================
  // SAVE
  // =========================================================
  // Grava só o override (FK id ou null) - nunca a configuração
  // completa (CLAUDE.md secção 14).
  async function save() {
    const row = target.value

    const id = row?.id || row?.pk

    if (!id) {
      Notify.create({
        type: 'negative',
        message: tdc('No valid record was selected.'),
      })

      return
    }

    const payload = {
      theme: form.theme,
      layout_settings: form.layout_settings,
      typography: form.typography,
      animation_settings: form.animation_settings,
    }

    saving.value = true

    try {
      // Permite ao parent assumir a gravação.
      emit('save', { scope: localScope.value, id, payload })

      const store = activeStore.value

      if (store) {
        // base/base_store.js's update() lê de `this.form`/`this.form.id`
        // (PATCH {safeUrl}/{id}/) - não aceita (id, payload) como
        // argumentos directos.
        if (typeof store.update === 'function' && 'form' in store) {
          // Só os 4 campos de override + id - nunca reenviar o `form`
          // anterior da store (podia ter ficado com valores de um
          // formulário CRUD não relacionado ainda aberto na mesma
          // store) junto com o PATCH desta gravação.
          store.form = { id, ...payload }
          await store.update()
        } else if (typeof store.updateById === 'function') {
          await store.updateById(id, payload)
        } else if (typeof store.patch === 'function') {
          await store.patch(id, payload)
        } else if (typeof store.save === 'function') {
          store.row = { ...(store.row || {}), ...payload, id }
          await store.save()
        }
      }

      Object.assign(original, { ...form })

      Notify.create({
        type: 'positive',
        icon: 'check_circle',
        message: tdc('Appearance settings updated successfully.'),
      })

      emit('saved', { scope: localScope.value, id, payload })

    } catch (error) {

      console.error('[ThemeStudioEngine]', error)

      Notify.create({
        type: 'negative',
        icon: 'error',
        message: (
          error?.response?.data?.detail ||
          error?.response?.data?.error ||
          error?.response?.data?.message ||
          error?.message ||
          tdc('Unable to update appearance settings.')
        ),
      })

    } finally {
      saving.value = false
    }
  }

  // =========================================================
  // WATCH
  // =========================================================

  watch(() => props.scope, value => {
    localScope.value = value
  })

  watch(localScope, value => {
    emit('update:scope', value)
    loadForm()
  })

  watch(
    [() => props.entityType, () => props.entity, () => props.user],
    () => loadForm(),
    { immediate: true, deep: true }
  )

  return {
    // scope
    tab,
    saving,
    localScope,
    previewMode,
    previewDark,
    scopeOptions,
    scopeLabel,
    target,
    targetName,
    inheritanceDescription,

    // options
    themeOptions,
    layoutOptions,
    typographyOptions,
    animationOptions,

    // form
    form,
    dirty,
    resetForm,
    resetField,

    // inheritance
    hasOverride,
    sourceFor,
    effectiveValue,
    effectiveLabel,
    sourceText,
    sourceShortLabel,

    // selected objects
    selectedTheme,
    selectedLayout,
    selectedTypography,
    selectedAnimation,

    // preview
    previewColors,
    themeSurfaces,
    getSurface,
    previewSurfaceStyle,
    themeOptionStyle,
    previewAppStyle,
    typographyStyle,
    boolLabel,
    previewMenu,

    // save
    save,
  }
}
