<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    full-width
    full-height
    @update:model-value="emit('update:modelValue', $event)"
  >
    <s-card flat class="column no-wrap full-height branches-map-card">
      <q-bar
        :class="$q.dark.isActive ? 'bg-dark text-white' : 'bg-primary text-white'"
      >
        <q-icon name="map" size="20px" />
        <div class="text-subtitle1 text-weight-bold q-ml-sm">
          {{ title || tdc('Branches map') }}
        </div>
        <q-space />
        <q-badge v-if="!loading" color="white" text-color="primary" class="q-px-sm">
          {{ located.length }} / {{ branches.length }}
        </q-badge>
        <s-btn dense flat round icon="close" class="q-ml-sm" v-close-popup />
      </q-bar>

      <q-separator />

      <div class="col relative-position">
        <div v-if="loading" class="absolute-full flex flex-center">
          <q-spinner size="48px" color="primary" />
        </div>

        <div v-else-if="!hasMapsKey" class="absolute-full column items-center justify-center q-pa-lg">
          <q-icon name="map" size="48px" color="grey-5" class="q-mb-md" />
          <div class="text-subtitle1 text-grey-7">
            {{ tdc('Interactive map not configured for this deployment.') }}
          </div>
          <q-list bordered separator class="fallback-list q-mt-md" v-if="located.length">
            <q-item v-for="b in located" :key="b.id">
              <q-item-section avatar v-if="b.photo">
                <q-avatar square size="40px"><img :src="b.photo"></q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ b.name }}</q-item-label>
                <q-item-label caption>{{ b.address?.full_address || b.description || '' }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </div>

        <div v-else ref="mapEl" class="absolute-full" />
      </div>
    </s-card>
  </q-dialog>
</template>


<script setup>
import { nextTick, ref, watch } from 'vue'
import { useQuasar } from 'quasar'

import { tdc } from '../../services/translation'
import { hasGoogleMapsKey, loadGoogleMaps } from '../../services/googleMaps'
import { HTTPAuth, url } from '../../services/api'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: null },

  // Full URL to fetch branches from (BranchSerializer-shaped rows,
  // e.g. Entity's own `.../branchs/` action or EntityType's
  // `.../branches_map/` action) - fetched fresh every time the dialog
  // opens.
  fetchUrl: { type: String, required: true }
})

const emit = defineEmits(['update:modelValue'])

const $q = useQuasar()
const hasMapsKey = hasGoogleMapsKey()

const loading = ref(false)
const branches = ref([])
const mapEl = ref(null)

const located = ref([])

let map = null
let infoWindow = null
const markers = []

function clearMarkers() {
  markers.forEach(m => m.setMap(null))
  markers.length = 0
}

async function load() {
  loading.value = true
  clearMarkers()

  try {
    const { data } = await HTTPAuth.get(url({ type: 'u', url: props.fetchUrl }))
    branches.value = data || []
    located.value = branches.value.filter(b => b.address?.coordinates)

    if (hasMapsKey) {
      await renderMap()
    }
  } finally {
    loading.value = false
  }
}

function buildCardContent(branch) {
  const wrapper = document.createElement('div')
  wrapper.style.cssText = 'max-width:220px;font-family:inherit;'

  if (branch.photo) {
    const img = document.createElement('img')
    img.src = branch.photo
    img.style.cssText = 'width:100%;max-height:120px;object-fit:cover;border-radius:6px;margin-bottom:6px;'
    wrapper.appendChild(img)
  }

  const title = document.createElement('div')
  title.textContent = branch.entity_name ? `${branch.name} (${branch.entity_name})` : branch.name
  title.style.cssText = 'font-weight:600;font-size:14px;margin-bottom:2px;'
  wrapper.appendChild(title)

  const description = branch.description || branch.address?.full_address
  if (description) {
    const text = document.createElement('div')
    text.textContent = description
    text.style.cssText = 'font-size:12px;color:#555;'
    wrapper.appendChild(text)
  }

  return wrapper
}

async function renderMap() {
  try {
    await loadGoogleMaps()
  } catch (e) {
    console.warn('Google Maps unavailable:', e.message)
    return
  }

  await nextTick()
  if (!mapEl.value) return

  if (!map) {
    map = new window.google.maps.Map(mapEl.value, {
      center: { lat: -25.9655, lng: 32.5832 },
      zoom: 12,
      disableDefaultUI: true,
      zoomControl: true,
      fullscreenControl: true,
      styles: $q.dark.isActive ? DARK_MAP_STYLE : []
    })
    infoWindow = new window.google.maps.InfoWindow()
  } else {
    window.google.maps.event.trigger(map, 'resize')
  }

  if (!located.value.length) return

  const bounds = new window.google.maps.LatLngBounds()

  for (const branch of located.value) {
    const position = branch.address.coordinates
    const marker = new window.google.maps.Marker({ map, position, title: branch.name })

    marker.addListener('click', () => {
      infoWindow.setContent(buildCardContent(branch))
      infoWindow.open({ anchor: marker, map })
    })

    markers.push(marker)
    bounds.extend(position)
  }

  if (located.value.length === 1) {
    map.setCenter(located.value[0].address.coordinates)
    map.setZoom(16)
  } else {
    map.fitBounds(bounds, 48)
  }
}

watch(() => props.modelValue, (open) => {
  if (open) load()
})

const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#1d1d1d' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1d1d1d' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8a8a8a' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2c2c2c' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e0e0e' }] }
]
</script>


<style scoped>
.branches-map-card {
  width: 100%;
  height: 100%;
}

.fallback-list {
  width: 100%;
  max-width: 480px;
}
</style>
