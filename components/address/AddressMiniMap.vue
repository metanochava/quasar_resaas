<template>
  <div v-if="hasCoordinates" class="address-mini-map" :style="{ height, borderRadius: radius }">
    <div v-if="useGoogle && !googleFailed" ref="mapEl" class="address-mini-map__surface" />

    <!-- No Google key on this deployment (or the script failed to load):
         a keyless OpenStreetMap embed shows the same point. -->
    <iframe
      v-else
      class="address-mini-map__surface"
      :title="label || tdc('Location')"
      :src="osmSrc"
      loading="lazy"
      referrerpolicy="no-referrer"
    />
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { hasGoogleMapsKey, loadGoogleMaps } from '../../services/googleMaps'
import { tdc } from '../../services/translation'

// Small read-only map for a saved address (view pages). Renders nothing
// without coordinates - the address text around it already says "no
// address"/"no location". AddressLocationPicker stays the editing widget.
const props = defineProps({
  // An AddressSerializer object ({latitude, longitude, ...}) - only the
  // coordinates matter here.
  address: { type: Object, default: null },
  height: { type: String, default: '180px' },
  radius: { type: String, default: '8px' },
  label: { type: String, default: '' },
  zoom: { type: Number, default: 15 }
})

// DecimalField coordinates arrive as strings ("-25.965500").
const lat = computed(() => toNumber(props.address?.latitude))
const lng = computed(() => toNumber(props.address?.longitude))
const hasCoordinates = computed(() => lat.value !== null && lng.value !== null)

function toNumber(value) {
  if (value === null || value === undefined || value === '') return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

const useGoogle = hasGoogleMapsKey()
const googleFailed = ref(false)
const mapEl = ref(null)

let map = null
let marker = null

// ~0.005 degrees each side of the point is roughly a street-level view.
const osmSrc = computed(() => {
  const d = 0.005
  const bbox = [lng.value - d, lat.value - d, lng.value + d, lat.value + d].join(',')
  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${lat.value},${lng.value}`
})

async function render() {
  if (!useGoogle || !hasCoordinates.value || !mapEl.value) return

  try {
    await loadGoogleMaps()
  } catch {
    googleFailed.value = true
    return
  }

  const position = { lat: lat.value, lng: lng.value }

  if (!map) {
    map = new window.google.maps.Map(mapEl.value, {
      center: position,
      zoom: props.zoom,
      disableDefaultUI: true,
      zoomControl: true,
      gestureHandling: 'cooperative'
    })
    marker = new window.google.maps.Marker({ map, position, title: props.label || undefined })
    return
  }

  map.setCenter(position)
  marker.setPosition(position)
}

onMounted(render)
watch([lat, lng], async () => {
  await nextTick() // the map element only exists once coordinates do
  render()
})

onBeforeUnmount(() => {
  marker?.setMap?.(null)
  map = null
  marker = null
})
</script>

<style scoped>
.address-mini-map {
  width: 100%;
  overflow: hidden;
  border: 1px solid rgba(128, 128, 128, .25);
}
.address-mini-map__surface {
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
}
</style>
