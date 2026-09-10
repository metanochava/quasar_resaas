<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { tdc } from '../../services/translation'
import { useDashboardStore } from '../../stores/DashboardStore'
import { resolveDashboardAction } from '../../services/dashboardActions'
import { resolveWidgetComponent } from './registry'
import WidgetLoading from './WidgetLoading.vue'
import WidgetEmpty from './WidgetEmpty.vue'
import WidgetError from './WidgetError.vue'
import WidgetFilters from './WidgetFilters.vue'

const props = defineProps({
  widget: { type: Object, required: true },
})

const Dashboard = useDashboardStore()
const router = useRouter()

const colClasses = computed(() => {
  const cols = props.widget.cols || {}
  const classes = []
  for (const [breakpoint, size] of Object.entries(cols)) {
    classes.push(breakpoint === 'xs' ? `col-12 col-sm-${cols.sm ?? size}` : `col-${breakpoint}-${size}`)
  }
  return classes.length ? classes.join(' ') : 'col-12 col-md-6'
})

const loading = computed(() => Dashboard.isWidgetLoading(props.widget.name))
const error = computed(() => Dashboard.getWidgetError(props.widget.name))
const response = computed(() => Dashboard.getWidgetData(props.widget.name))
const data = computed(() => response.value?.data ?? null)

const isEmpty = computed(() => {
  if (!data.value) return true
  if (Array.isArray(data.value)) return data.value.length === 0
  if ('value' in data.value) return data.value.value === null || data.value.value === undefined
  if ('rows' in data.value) return (data.value.rows || []).length === 0
  if ('items' in data.value) return (data.value.items || []).length === 0
  if ('series' in data.value) return !(data.value.series || []).some((s) => (s.data || []).length)
  if ('events' in data.value) return (data.value.events || []).length === 0
  return false
})

const component = computed(() => resolveWidgetComponent(props.widget.type))

function reload() {
  Dashboard.reloadWidget(props.widget.name)
}

const fullscreen = ref(false)

function runAction(action) {
  resolveDashboardAction(action, {
    router,
    context: data.value,
    onRefresh: reload,
    onFullscreen: () => { fullscreen.value = true },
  })
}

const hasPrimaryAction = computed(() => !!props.widget.primary_action)

function onPrimaryAction() {
  if (hasPrimaryAction.value) runAction(props.widget.primary_action)
}
</script>

<template>
  <div :class="colClasses">
    <s-card flat bordered class="full-height dashboard-widget">
      <q-card-section class="row items-center justify-between q-pb-none">
        <div
          :class="{ 'cursor-pointer': hasPrimaryAction }"
          class="row items-center q-gutter-x-xs"
          @click="onPrimaryAction"
        >
          <div>
            <div class="text-subtitle2 text-weight-medium">{{ tdc(widget.label) }}</div>
            <div v-if="widget.subtitle" class="text-caption text-grey-6">{{ tdc(widget.subtitle) }}</div>
          </div>
          <q-icon v-if="widget.tooltip" name="info" size="16px" color="grey-6">
            <q-tooltip>{{ tdc(widget.tooltip) }}</q-tooltip>
          </q-icon>
        </div>

        <div class="row items-center no-wrap">
          <q-btn
            v-for="action in widget.actions || []" :key="action.name"
            flat dense round size="sm"
            :icon="action.icon || 'more_horiz'"
            @click="runAction(action)"
          >
            <q-tooltip v-if="action.tooltip">{{ tdc(action.tooltip) }}</q-tooltip>
          </q-btn>
          <q-btn flat dense round size="sm" icon="refresh" :disable="loading" @click="reload" />
        </div>
      </q-card-section>

      <q-card-section>
        <WidgetFilters :widget="widget" />

        <WidgetLoading v-if="loading && !data" />

        <WidgetError v-else-if="error" :error="error" @retry="reload" />

        <template v-else-if="!component">
          <WidgetEmpty :label="`Unsupported widget type: ${widget.type}`" />
        </template>

        <WidgetEmpty v-else-if="isEmpty" />

        <component
          :is="component"
          v-else
          :widget="widget"
          :data="data"
          :loading="loading"
        />
      </q-card-section>
    </s-card>

    <q-dialog v-model="fullscreen" maximized>
      <s-card class="dashboard-widget-fullscreen">
        <q-card-section class="row items-center justify-between">
          <div class="text-h6">{{ tdc(widget.label) }}</div>
          <q-btn flat dense round icon="close" v-close-popup />
        </q-card-section>
        <q-card-section>
          <component
            v-if="component && !isEmpty"
            :is="component"
            :widget="widget"
            :data="data"
            :loading="loading"
          />
          <WidgetEmpty v-else />
        </q-card-section>
      </s-card>
    </q-dialog>
  </div>
</template>

<style scoped>
.dashboard-widget {
  height: 100%;
}
</style>
