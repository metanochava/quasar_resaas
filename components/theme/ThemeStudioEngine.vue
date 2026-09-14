<template>
  <div class="theme-studio-engine">

    <!-- ===================================================== -->
    <!-- HERO -->
    <!-- ===================================================== -->

    <q-card flat class="hero-card overflow-hidden">
      <div class="hero-decoration hero-decoration--one" />
      <div class="hero-decoration hero-decoration--two" />

      <q-card-section class="relative-position q-pa-lg">

        <div class="row items-center q-col-gutter-lg">

          <div class="col-auto">
            <q-avatar size="72px" class="hero-avatar">
              <q-icon name="palette" size="36px" />
            </q-avatar>
          </div>

          <div class="col">

            <div class="text-h5 text-weight-bold text-white">
              {{ tdc('Appearance') }}
            </div>

            <div class="text-body2 text-white text-opacity-80 q-mt-xs">
              {{ tdc('Customize theme, layout, typography and animations.') }}
            </div>

            <div class="row items-center q-gutter-sm q-mt-md">
              <q-chip dense color="white" text-color="primary" icon="layers">
                {{ scopeLabel }}
              </q-chip>

              <q-chip v-if="targetName" dense outline color="white" icon="person_pin">
                {{ targetName }}
              </q-chip>
            </div>

          </div>

          <div class="col-auto gt-sm">

            <div class="inheritance-flow row items-center q-gutter-sm">
              <div
                class="inheritance-node"
                :class="{ 'inheritance-node--active': localScope === 'entity_type' }"
              >
                <q-icon name="category" />
                <span>{{ tdc('Entity Type') }}</span>
              </div>

              <q-icon name="arrow_forward" color="white" />

              <div
                class="inheritance-node"
                :class="{ 'inheritance-node--active': localScope === 'entity' }"
              >
                <q-icon name="business" />
                <span>{{ tdc('Entity') }}</span>
              </div>

              <q-icon name="arrow_forward" color="white" />

              <div
                class="inheritance-node"
                :class="{ 'inheritance-node--active': localScope === 'user' }"
              >
                <q-icon name="person" />
                <span>{{ tdc('User') }}</span>
              </div>
            </div>

          </div>

        </div>

      </q-card-section>
    </q-card>


    <!-- ===================================================== -->
    <!-- TARGET -->
    <!-- ===================================================== -->

    <q-card v-if="allowScopeSelect" flat bordered class="settings-card q-mt-md">
      <q-card-section>

        <div class="row items-center justify-between q-col-gutter-md">

          <div class="col-12 col-md">
            <div class="section-label">
              {{ tdc('Configuration level') }}
            </div>

            <div class="text-caption text-grey-7">
              {{ tdc('Choose which level you want to configure.') }}
            </div>
          </div>

          <div class="col-12 col-md-auto">
            <q-btn-toggle
              v-model="localScope"
              unelevated
              no-caps
              rounded
              toggle-color="primary"
              color="grey-2"
              text-color="grey-8"
              :options="scopeOptions"
            />
          </div>

        </div>

      </q-card-section>
    </q-card>


    <!-- ===================================================== -->
    <!-- INHERITANCE INFO -->
    <!-- ===================================================== -->

    <q-banner v-if="localScope !== 'entity_type'" rounded class="inheritance-banner q-mt-md">
      <template #avatar>
        <q-avatar color="primary" text-color="white" icon="account_tree" />
      </template>

      <div class="text-weight-medium">
        {{ tdc('Configuration inheritance') }}
      </div>

      <div class="text-caption q-mt-xs">
        {{ inheritanceDescription }}
      </div>
    </q-banner>


    <!-- ===================================================== -->
    <!-- MAIN -->
    <!-- ===================================================== -->

    <div class="row q-col-gutter-lg q-mt-xs">

      <!-- LEFT -->

      <div class="col-12 col-lg-8">

        <q-card flat bordered class="settings-card">

          <q-tabs
            v-model="tab"
            dense
            no-caps
            align="left"
            active-color="primary"
            indicator-color="primary"
            class="settings-tabs"
          >
            <q-tab name="theme" icon="palette" :label="tdc('Theme')" />
            <q-tab name="layout" icon="dashboard_customize" :label="tdc('Layout')" />
            <q-tab name="typography" icon="text_fields" :label="tdc('Typography')" />
            <q-tab name="animation" icon="animation" :label="tdc('Animations')" />
          </q-tabs>

          <q-separator />

          <q-tab-panels v-model="tab" animated swipeable class="bg-transparent">

            <!-- THEME -->

            <q-tab-panel name="theme" class="q-pa-lg">

              <SettingHeader
                icon="palette"
                :title="tdc('Visual theme')"
                :description="tdc('Controls colors, visual surfaces and system identity.')"
              />

              <InheritanceField
                :custom="hasOverride('theme')"
                :source="sourceFor('theme')"
                @reset="resetField('theme')"
              />

              <q-select
                v-model="form.theme"
                outlined
                clearable
                emit-value
                map-options
                option-value="value"
                option-label="label"
                :options="themeOptions"
                :label="tdc('Theme')"
                class="q-mt-md"
              >
                <template #prepend>
                  <q-icon name="palette" />
                </template>

                <template #option="scope">
                  <q-item v-bind="scope.itemProps">
                    <q-item-section avatar>
                      <div class="theme-option-preview" :style="themeOptionStyle(scope.opt.raw)" />
                    </q-item-section>

                    <q-item-section>
                      <q-item-label>{{ scope.opt.label }}</q-item-label>
                      <q-item-label caption>{{ tdc('Theme configuration') }}</q-item-label>
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>

              <div v-if="!themeOptions.length" class="text-caption text-grey-7 q-mt-sm">
                {{ tdc('No themes available yet.') }}
              </div>

              <!-- THEME COLORS -->

              <div v-if="selectedTheme" class="q-mt-lg">
                <div class="text-subtitle2 text-weight-bold q-mb-sm">
                  {{ tdc('Theme colors') }}
                </div>

                <div class="row q-col-gutter-sm">
                  <div
                    v-for="color in previewColors"
                    :key="color.key"
                    class="col-6 col-sm-4 col-md-3"
                  >
                    <div class="color-preview">
                      <div class="color-preview__box" :style="{ background: color.value }" />

                      <div class="q-mt-xs">
                        <div class="text-caption text-weight-medium">{{ color.label }}</div>
                        <div class="text-caption text-grey-6">{{ color.value }}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- SURFACES -->

              <div v-if="themeSurfaces.length" class="q-mt-lg">

                <div class="text-subtitle2 text-weight-bold q-mb-sm">
                  {{ tdc('Visual surfaces') }}
                </div>

                <div class="row q-col-gutter-sm">
                  <div
                    v-for="surface in themeSurfaces"
                    :key="surface.area"
                    class="col-12 col-sm-6 col-md-4"
                  >
                    <q-card flat bordered class="surface-card">

                      <div class="surface-preview" :style="previewSurfaceStyle(surface.area)">
                        <div
                          v-if="surface.background_overlay"
                          class="surface-overlay"
                          :style="{ opacity: surface.background_overlay }"
                        />

                        <q-chip dense class="absolute-top-left q-ma-sm">
                          {{ surface.area }}
                        </q-chip>
                      </div>

                      <q-card-section class="q-pa-sm">
                        <div class="row items-center">
                          <q-icon name="web" color="primary" size="20px" />

                          <div class="q-ml-sm text-weight-medium">
                            {{ tdc(surface.area) }}
                          </div>

                          <q-space />

                          <q-badge outline color="primary" :label="surface.background_type" />
                        </div>
                      </q-card-section>

                    </q-card>
                  </div>
                </div>

              </div>

            </q-tab-panel>


            <!-- LAYOUT -->

            <q-tab-panel name="layout" class="q-pa-lg">

              <SettingHeader
                icon="dashboard_customize"
                :title="tdc('Layout')"
                :description="tdc('Controls the structure and positioning of the interface.')"
              />

              <InheritanceField
                :custom="hasOverride('layout_settings')"
                :source="sourceFor('layout_settings')"
                @reset="resetField('layout_settings')"
              />

              <q-select
                v-model="form.layout_settings"
                outlined
                clearable
                emit-value
                map-options
                :options="layoutOptions"
                :label="tdc('Layout')"
                class="q-mt-md"
              >
                <template #prepend>
                  <q-icon name="dashboard_customize" />
                </template>
              </q-select>

              <div v-if="!layoutOptions.length" class="text-caption text-grey-7 q-mt-sm">
                {{ tdc('No layouts available yet.') }}
              </div>

              <div v-if="selectedLayout" class="row q-col-gutter-md q-mt-md">

                <div class="col-12 col-md-6">
                  <InfoCard
                    icon="view_sidebar"
                    :title="tdc('Sidebar')"
                    :items="[
                      { label: tdc('Position'), value: selectedLayout.sidebar_position || selectedLayout.sidebar?.position },
                      { label: tdc('Width'), value: selectedLayout.sidebar_width || selectedLayout.sidebar?.width },
                      { label: tdc('Mini'), value: boolLabel(selectedLayout.sidebar_mini ?? selectedLayout.sidebar?.mini) },
                    ]"
                  />
                </div>

                <div class="col-12 col-md-6">
                  <InfoCard
                    icon="web_asset"
                    :title="tdc('Header')"
                    :items="[
                      { label: tdc('Visible'), value: boolLabel(selectedLayout.display_header ?? selectedLayout.header?.display) },
                      { label: tdc('Position'), value: selectedLayout.header_position || selectedLayout.header?.position },
                      { label: tdc('Height'), value: selectedLayout.header_height || selectedLayout.header?.height },
                    ]"
                  />
                </div>

                <div class="col-12 col-md-6">
                  <InfoCard
                    icon="vertical_align_bottom"
                    :title="tdc('Footer')"
                    :items="[
                      { label: tdc('Visible'), value: boolLabel(selectedLayout.display_footer ?? selectedLayout.footer?.display) },
                      { label: tdc('Position'), value: selectedLayout.footer_position || selectedLayout.footer?.position },
                    ]"
                  />
                </div>

                <div class="col-12 col-md-6">
                  <InfoCard
                    icon="login"
                    :title="tdc('Login')"
                    :items="[
                      { label: tdc('Position'), value: selectedLayout.login_position },
                      { label: tdc('Display logo'), value: boolLabel(selectedLayout.display_logo_login) },
                    ]"
                  />
                </div>

              </div>

            </q-tab-panel>


            <!-- TYPOGRAPHY -->

            <q-tab-panel name="typography" class="q-pa-lg">

              <SettingHeader
                icon="text_fields"
                :title="tdc('Typography')"
                :description="tdc('Controls fonts, sizes, weights and text spacing.')"
              />

              <InheritanceField
                :custom="hasOverride('typography')"
                :source="sourceFor('typography')"
                @reset="resetField('typography')"
              />

              <q-select
                v-model="form.typography"
                outlined
                clearable
                emit-value
                map-options
                :options="typographyOptions"
                :label="tdc('Typography')"
                class="q-mt-md"
              >
                <template #prepend>
                  <q-icon name="font_download" />
                </template>
              </q-select>

              <div v-if="!typographyOptions.length" class="text-caption text-grey-7 q-mt-sm">
                {{ tdc('No typography presets available yet.') }}
              </div>

              <q-card v-if="selectedTypography" flat bordered class="typography-preview q-mt-lg">
                <q-card-section>

                  <div class="typography-sample" :style="typographyStyle">
                    <div class="sample-title">Aa</div>

                    <div class="text-h5 q-mt-md">
                      {{ tdc('Beautiful interfaces start with good typography.') }}
                    </div>

                    <div class="text-body1 q-mt-sm">
                      {{ tdc('This is a preview of the selected typography.') }}
                    </div>

                    <div class="text-caption q-mt-md text-grey-7">
                      ABCDEFGHIJKLMNOPQRSTUVWXYZ
                      <br>
                      abcdefghijklmnopqrstuvwxyz
                      <br>
                      0123456789
                    </div>
                  </div>

                </q-card-section>
              </q-card>

            </q-tab-panel>


            <!-- ANIMATION -->

            <q-tab-panel name="animation" class="q-pa-lg">

              <SettingHeader
                icon="animation"
                :title="tdc('Animations')"
                :description="tdc('Controls transitions and interface motion.')"
              />

              <InheritanceField
                :custom="hasOverride('animation_settings')"
                :source="sourceFor('animation_settings')"
                @reset="resetField('animation_settings')"
              />

              <q-select
                v-model="form.animation_settings"
                outlined
                clearable
                emit-value
                map-options
                :options="animationOptions"
                :label="tdc('Animation settings')"
                class="q-mt-md"
              >
                <template #prepend>
                  <q-icon name="animation" />
                </template>
              </q-select>

              <div v-if="!animationOptions.length" class="text-caption text-grey-7 q-mt-sm">
                {{ tdc('No animation presets available yet.') }}
              </div>

              <div v-if="selectedAnimation" class="animation-preview q-mt-lg">
                <div class="animation-orb">
                  <q-icon name="auto_awesome" size="36px" color="primary" />
                </div>

                <div class="text-subtitle1 text-weight-medium q-mt-md">
                  {{ tdc('Animation preview') }}
                </div>

                <div class="text-caption text-grey-7">
                  {{ selectedAnimation.name || tdc('Selected animation') }}
                </div>
              </div>

            </q-tab-panel>

          </q-tab-panels>

        </q-card>

      </div>


      <!-- RIGHT / PREVIEW -->

      <div class="col-12 col-lg-4">

        <q-card flat bordered class="preview-card sticky-preview">

          <q-card-section>

            <div class="row items-center">
              <div>
                <div class="text-subtitle1 text-weight-bold">{{ tdc('Preview') }}</div>
                <div class="text-caption text-grey-7">{{ tdc('Effective configuration') }}</div>
              </div>

              <q-space />

              <q-badge color="primary" outline :label="scopeLabel" />
            </div>

            <div class="row items-center justify-between q-mt-sm q-gutter-sm">

              <q-btn-toggle
                v-model="previewMode"
                dense
                no-caps
                unelevated
                toggle-color="primary"
                color="grey-2"
                text-color="grey-8"
                :options="[
                  { label: tdc('Desktop'), value: 'desktop', icon: 'desktop_windows' },
                  { label: tdc('Mobile'), value: 'mobile', icon: 'smartphone' },
                ]"
              />

              <q-btn
                dense
                round
                flat
                :icon="previewDark ? 'mdi-weather-night' : 'mdi-white-balance-sunny'"
                @click="previewDark = !previewDark"
              >
                <s-tooltip>
                  {{ previewDark ? tdc('Preview in light mode') : tdc('Preview in dark mode') }}
                </s-tooltip>
              </q-btn>

            </div>

          </q-card-section>

          <q-separator />

          <!-- MINI APP PREVIEW -->

          <div
            class="app-preview"
            :class="{ 'app-preview--mobile': previewMode === 'mobile' }"
            :style="previewAppStyle"
          >

            <div class="preview-header" :style="previewSurfaceStyle('header')">
              <div class="row items-center no-wrap">
                <q-avatar size="28px" color="primary" text-color="white" icon="apps" />

                <div class="q-ml-sm text-weight-bold">RESAAS</div>

                <q-space />

                <q-icon name="notifications_none" size="20px" />

                <q-avatar size="26px" class="q-ml-sm" color="primary" text-color="white" icon="person" />
              </div>
            </div>

            <div class="preview-body">

              <div class="preview-sidebar" :style="previewSurfaceStyle('sidebar')">
                <div v-for="item in previewMenu" :key="item.icon" class="preview-menu-item">
                  <q-icon :name="item.icon" size="18px" />
                </div>
              </div>

              <div class="preview-page" :style="previewSurfaceStyle('page')">

                <div class="row q-col-gutter-sm">
                  <div v-for="n in 3" :key="n" class="col-4">
                    <div class="preview-stat" :style="previewSurfaceStyle('card')">
                      <q-icon
                        :name="['group', 'trending_up', 'payments'][n - 1]"
                        :color="n === 1 ? 'primary' : (n === 2 ? 'positive' : 'accent')"
                        size="20px"
                      />

                      <div class="preview-stat-value">
                        {{ ['128', '24%', '75K'][n - 1] }}
                      </div>
                    </div>
                  </div>
                </div>

                <div class="preview-chart q-mt-sm" :style="previewSurfaceStyle('card')">
                  <div class="chart-bar" style="height: 38%" />
                  <div class="chart-bar" style="height: 65%" />
                  <div class="chart-bar" style="height: 48%" />
                  <div class="chart-bar" style="height: 82%" />
                  <div class="chart-bar" style="height: 58%" />
                </div>

              </div>
            </div>
          </div>


          <!-- EFFECTIVE VALUES -->

          <q-card-section>

            <div class="effective-list">

              <EffectiveItem
                icon="palette"
                :label="tdc('Theme')"
                :value="effectiveLabel('theme')"
                :source="sourceFor('theme')"
              />

              <EffectiveItem
                icon="dashboard_customize"
                :label="tdc('Layout')"
                :value="effectiveLabel('layout_settings')"
                :source="sourceFor('layout_settings')"
              />

              <EffectiveItem
                icon="text_fields"
                :label="tdc('Typography')"
                :value="effectiveLabel('typography')"
                :source="sourceFor('typography')"
              />

              <EffectiveItem
                icon="animation"
                :label="tdc('Animation')"
                :value="effectiveLabel('animation_settings')"
                :source="sourceFor('animation_settings')"
              />

            </div>

          </q-card-section>

        </q-card>

      </div>

    </div>


    <!-- ===================================================== -->
    <!-- ACTION BAR -->
    <!-- ===================================================== -->

    <div class="action-bar q-mt-lg">

      <div class="row items-center">

        <div class="col">

          <div v-if="dirty" class="row items-center text-warning">
            <q-icon name="edit" size="18px" />
            <span class="q-ml-xs">{{ tdc('You have unsaved changes.') }}</span>
          </div>

          <div v-else class="row items-center text-positive">
            <q-icon name="check_circle" size="18px" />
            <span class="q-ml-xs">{{ tdc('Configuration is up to date.') }}</span>
          </div>

        </div>

        <div class="col-auto row q-gutter-sm">

          <s-btn
            flat
            no-caps
            icon="restart_alt"
            :label="tdc('Reset')"
            :disable="!dirty || saving"
            @click="resetForm"
          />

          <s-btn
            unelevated
            no-caps
            color="primary"
            icon="save"
            :label="tdc('Save changes')"
            :loading="saving"
            :disable="!dirty"
            @click="save"
          />

        </div>

      </div>

    </div>

  </div>
</template>


<script setup>
import { defineComponent, h } from 'vue'
import { tdc } from '../../services/translation'
import { useThemeStudio } from './useThemeStudio.js'

// ===========================================================
// PROPS
// ===========================================================

const props = defineProps({

  // entity_type | entity | user
  scope: {
    type: String,
    default: 'user',
  },

  allowScopeSelect: {
    type: Boolean,
    default: false,
  },

  // Registos completos - necessários para calcular
  // User > Entity > EntityType (ver theme/resolveEffectiveConfig.js).
  entityType: { type: Object, default: null },
  entity: { type: Object, default: null },
  user: { type: Object, default: null },

  // Stores opcionais - o componente grava directamente quando
  // fornecidas (ver base/base_store.js's update()/save()).
  entityTypeStore: { type: Object, default: null },
  entityStore: { type: Object, default: null },
  userStore: { type: Object, default: null },

  // Opções seleccionáveis (catálogo). Theme/Layout têm endpoint de
  // listagem real (django_resaas/themes, django_resaas/layoutsettings -
  // ver stores/ThemeStore.js e stores/LayoutSettingStore.js);
  // typography/animation ainda não têm um endpoint de listagem no
  // backend actual, por isso ficam vazias até essa capacidade existir.
  themes: { type: Array, default: () => [] },
  layouts: { type: Array, default: () => [] },
  typographies: { type: Array, default: () => [] },
  animations: { type: Array, default: () => [] },

})

const emit = defineEmits(['saved', 'save', 'update:scope'])

const {
  tab,
  saving,
  localScope,
  previewMode,
  previewDark,
  scopeOptions,
  scopeLabel,
  targetName,
  inheritanceDescription,
  themeOptions,
  layoutOptions,
  typographyOptions,
  animationOptions,
  form,
  dirty,
  resetForm,
  resetField,
  hasOverride,
  sourceFor,
  effectiveLabel,
  sourceText,
  sourceShortLabel,
  selectedTheme,
  selectedLayout,
  selectedTypography,
  selectedAnimation,
  previewColors,
  themeSurfaces,
  previewSurfaceStyle,
  themeOptionStyle,
  previewAppStyle,
  typographyStyle,
  boolLabel,
  previewMenu,
  save,
} = useThemeStudio(props, emit)


// ===========================================================
// SMALL PRESENTATIONAL COMPONENTS
//
// Específicos deste ecrã (badges de secção/herança) - não fazem
// sentido reutilizados fora do Theme Studio, por isso ficam aqui em
// vez de useThemeStudio.js (CLAUDE.md secção 4).
// ===========================================================

const SettingHeader = defineComponent({
  props: { icon: String, title: String, description: String },

  setup(componentProps) {
    return () => h('div', { class: 'row items-center no-wrap q-mb-md' }, [
      h('div', { class: 'setting-icon flex flex-center' }, [
        h('span', { class: 'material-icons' }, componentProps.icon),
      ]),

      h('div', { class: 'q-ml-md' }, [
        h('div', { class: 'text-subtitle1 text-weight-bold' }, componentProps.title),
        h('div', { class: 'text-caption text-grey-7' }, componentProps.description),
      ]),
    ])
  },
})

const InheritanceField = defineComponent({
  emits: ['reset'],
  props: { custom: Boolean, source: String },

  setup(componentProps, { emit: componentEmit }) {
    return () => h('div', {
      class: ['inheritance-field', componentProps.custom ? 'inheritance-field--custom' : 'inheritance-field--inherited'],
    }, [
      h('div', { class: 'row items-center' }, [
        h('span', { class: 'material-icons inheritance-field__icon' }, componentProps.custom ? 'tune' : 'account_tree'),

        h('div', { class: 'q-ml-sm col' }, [
          h('div', { class: 'text-weight-medium' }, componentProps.custom ? tdc('Custom configuration') : tdc('Inherited configuration')),
          h('div', { class: 'text-caption' }, sourceText(componentProps.source)),
        ]),

        componentProps.custom
          ? h('button', {
              type: 'button',
              class: 'inheritance-reset',
              onClick: () => componentEmit('reset'),
            }, tdc('Use inherited'))
          : null,
      ]),
    ])
  },
})

const InfoCard = defineComponent({
  props: { icon: String, title: String, items: Array },

  setup(componentProps) {
    return () => h('div', { class: 'info-card' }, [
      h('div', { class: 'row items-center q-mb-sm' }, [
        h('span', { class: 'material-icons text-primary' }, componentProps.icon),
        h('span', { class: 'q-ml-sm text-weight-bold' }, componentProps.title),
      ]),

      ...(componentProps.items || []).map(item => h('div', { class: 'row items-center info-row' }, [
        h('div', { class: 'text-caption text-grey-7' }, item.label),
        h('div', { class: 'col text-right text-caption text-weight-medium' }, String(item.value ?? '-')),
      ])),
    ])
  },
})

const EffectiveItem = defineComponent({
  props: { icon: String, label: String, value: String, source: String },

  setup(componentProps) {
    return () => h('div', { class: 'effective-item' }, [
      h('div', { class: 'effective-icon' }, [
        h('span', { class: 'material-icons' }, componentProps.icon),
      ]),

      h('div', { class: 'col q-ml-sm' }, [
        h('div', { class: 'text-caption text-grey-7' }, componentProps.label),
        h('div', { class: 'text-weight-medium' }, componentProps.value || '-'),
      ]),

      h('div', {
        class: ['source-pill', `source-pill--${componentProps.source || 'none'}`],
      }, sourceShortLabel(componentProps.source)),
    ])
  },
})
</script>


<style lang="scss" scoped src="./ThemeStudioEngine.scss"></style>
