<template>
  <s-card class="location-picker">
    <div
      class="location-header"
      :class="$q.dark.isActive ? 'bg-dark' : 'bg-primary'"
    >
      <q-icon name="location_on" size="22px" color="white" />
      <div class="text-subtitle1 text-weight-bold text-white q-ml-sm">
        {{ tdc('Location') }}
      </div>
      <q-space />
      <q-badge
        v-if="mapsReady"
        color="white"
        text-color="primary"
        class="q-px-sm"
      >
        <q-icon name="map" size="12px" class="q-mr-xs" />
        Google Maps
      </q-badge>
    </div>

    <q-card-section class="q-pa-md q-gutter-sm">
      <!-- ============================================= -->
      <!-- SEARCH + GEOLOCATION -->
      <!-- ============================================= -->
      <div class="row q-col-gutter-sm items-start">
        <div class="col">
          <s-input
            ref="searchInputEl"
            v-model="searchText"
            dense
            outlined
            clearable
            :label="mapsReady ? 'Search an address' : 'Formatted address'"
            :disable="!mapsReady && false"
            @update:model-value="onSearchTextChange"
          >
            <template #prepend>
              <q-icon name="search" />
            </template>
          </s-input>
        </div>

        <div class="col-auto">
          <s-btn
            round
            color="primary"
            icon="my_location"
            :loading="locating"
            @click="useMyLocation"
          >
            <q-tooltip>{{ tdc('Use my current location') }}</q-tooltip>
          </s-btn>
        </div>
      </div>

      <!-- ============================================= -->
      <!-- MAP / FALLBACK -->
      <!-- ============================================= -->
      <div class="map-shell">
        <div
          v-if="mapsReady"
          ref="mapEl"
          class="map-surface"
        />

        <div
          v-else
          class="map-placeholder"
          :class="$q.dark.isActive ? 'map-placeholder--dark' : ''"
        >
          <div class="pin-pulse">
            <q-icon name="location_on" size="46px" color="primary" />
          </div>
          <div class="text-caption text-grey q-mt-sm text-center">
            {{ tdc('Interactive map not configured for this deployment.') }}
            <br>
            {{ tdc('Use your location or enter coordinates manually below.') }}
          </div>
        </div>

        <div
          v-if="hasCoordinates"
          class="coords-chip"
        >
          <q-icon name="explore" size="14px" class="q-mr-xs" />
          {{ formattedCoordinates }}
        </div>
      </div>

      <!-- ============================================= -->
      <!-- MANUAL COORDINATES (always available) -->
      <!-- ============================================= -->
      <div class="row q-col-gutter-sm">
        <div class="col-6">
          <s-input
            v-model.number="form.latitude"
            dense
            outlined
            type="number"
            label="Latitude"
            @update:model-value="onManualCoordinateChange"
          />
        </div>
        <div class="col-6">
          <s-input
            v-model.number="form.longitude"
            dense
            outlined
            type="number"
            label="Longitude"
            @update:model-value="onManualCoordinateChange"
          />
        </div>
      </div>

      <!-- ============================================= -->
      <!-- STRUCTURED ADDRESS (collapsible) -->
      <!-- ============================================= -->
      <q-expansion-item
        dense
        :label="tdc('Address details')"
        icon="edit_location_alt"
        header-class="text-caption text-weight-medium"
      >
        <div class="q-pt-sm q-gutter-sm">
          <s-input
            v-model="form.formatted_address"
            dense
            outlined
            label="Formatted address"
            @update:model-value="emitUpdate"
          />

          <div class="row q-col-gutter-sm">
            <div class="col-6">
              <s-input v-model="form.locality" dense outlined label="City" @update:model-value="emitUpdate" />
            </div>
            <div class="col-6">
              <s-input v-model="form.administrative_area_level_1" dense outlined label="Province / State" @update:model-value="emitUpdate" />
            </div>
            <div class="col-6">
              <s-input v-model="form.postal_code" dense outlined label="Postal code" @update:model-value="emitUpdate" />
            </div>
            <div class="col-6">
              <s-select
                :model-value="form.country_code"
                dense
                outlined
                :emit-value="true"
                :map-options="true"
                :options="countryOptions"
                label="Country"
                @update:model-value="onCountrySelected"
              />
            </div>
          </div>
        </div>
      </q-expansion-item>
    </q-card-section>
  </s-card>
</template>


<script setup>
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useQuasar } from 'quasar'

import { tdc } from '../../services/translation'
import { hasGoogleMapsKey, loadGoogleMaps } from '../../services/googleMaps'
import { COUNTRIES } from '../../utils/countries'

const props = defineProps({
  modelValue: { type: Object, default: null }
})

const emit = defineEmits(['update:modelValue'])

const $q = useQuasar()

const DEFAULT_CENTER = { lat: -25.9655, lng: 32.5832 } // Maputo - sensible default, never assumed to be the real location

const mapsReady = ref(false)
const locating = ref(false)
const searchText = ref('')
const mapEl = ref(null)
const searchInputEl = ref(null)

let map = null
let marker = null
let autocomplete = null
let geocoder = null
let suppressWatch = false

// Matches Address model's own defaults (country="Mozambique",
// country_code="MZ") - a brand new address starts consistent with
// what the backend would assume anyway, instead of blank/null.
const EMPTY_ADDRESS = {
  place_id: null,
  latitude: null,
  longitude: null,
  formatted_address: null,
  street_number: null,
  route: null,
  premise: null,
  subpremise: null,
  neighborhood: null,
  sublocality: null,
  locality: null,
  administrative_area_level_1: null,
  administrative_area_level_2: null,
  administrative_area_level_3: null,
  postal_code: null,
  country: 'Mozambique',
  country_code: 'MZ',
  complement: null
}

const form = reactive({ ...EMPTY_ADDRESS })

const countryOptions = COUNTRIES.map(c => ({ label: c.name, value: c.iso2 }))

function onCountrySelected(iso2) {
  const country = COUNTRIES.find(c => c.iso2 === iso2)
  form.country = country?.name || null
  form.country_code = iso2
  emitUpdate()
}

function hydrateFrom(value) {
  suppressWatch = true
  Object.assign(form, EMPTY_ADDRESS, value || {})

  searchText.value = form.formatted_address || ''
  nextTick(() => { suppressWatch = false })
}

hydrateFrom(props.modelValue)

watch(() => props.modelValue, (value) => {
  hydrateFrom(value)
  syncMapFromForm()
})

const hasCoordinates = computed(() =>
  form.latitude !== null && form.latitude !== undefined &&
  form.longitude !== null && form.longitude !== undefined
)

const formattedCoordinates = computed(() => {
  if (!hasCoordinates.value) return ''
  return `${Number(form.latitude).toFixed(6)}, ${Number(form.longitude).toFixed(6)}`
})

function emitUpdate() {
  if (suppressWatch) return

  // Only the fields AddressSerializer actually accepts as input - an
  // existing address's API response (loaded via hydrateFrom) also
  // carries id/coordinates/full_address (read-only), which
  // Object.assign(form, ..., value) happily copies onto `form` too.
  // Emitting those back is worse than pointless: FormComponent's
  // generic normalizeValue() treats any object with an `id` key as a
  // relation reference and collapses it down to just that id string,
  // which is exactly the "expected a dictionary, got str" error this
  // fixes. Never send an explicit null for an untouched field either -
  // country/country_code have model-level defaults but no null=True,
  // so omitting the key (letting the default apply) is required, not
  // just tidier.
  const payload = {}
  for (const key of Object.keys(EMPTY_ADDRESS)) {
    const value = form[key]
    if (value !== null && value !== undefined && value !== '') {
      payload[key] = value
    }
  }

  emit('update:modelValue', payload)
}

// ===========================================================
// GOOGLE MAPS
// ===========================================================

async function initMap() {
  if (!hasGoogleMapsKey()) return

  try {
    await loadGoogleMaps()
  } catch (e) {
    console.warn('Google Maps unavailable:', e.message)
    return
  }

  mapsReady.value = true

  await nextTick()
  if (!mapEl.value) return

  const center = hasCoordinates.value
    ? { lat: Number(form.latitude), lng: Number(form.longitude) }
    : DEFAULT_CENTER

  map = new window.google.maps.Map(mapEl.value, {
    center,
    zoom: hasCoordinates.value ? 16 : 12,
    disableDefaultUI: true,
    zoomControl: true,
    fullscreenControl: true,
    styles: $q.dark.isActive ? DARK_MAP_STYLE : []
  })

  marker = new window.google.maps.Marker({
    map,
    position: center,
    draggable: true
  })

  geocoder = new window.google.maps.Geocoder()

  marker.addListener('dragend', () => {
    const position = marker.getPosition()
    reverseGeocode(position.lat(), position.lng())
  })

  map.addListener('click', (event) => {
    marker.setPosition(event.latLng)
    reverseGeocode(event.latLng.lat(), event.latLng.lng())
  })

  if (searchInputEl.value?.$el) {
    const nativeInput = searchInputEl.value.$el.querySelector('input')
    if (nativeInput) {
      autocomplete = new window.google.maps.places.Autocomplete(nativeInput, {
        fields: ['place_id', 'geometry', 'formatted_address', 'address_components']
      })

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace()
        if (!place?.geometry) return
        applyGeocoderResult(place)
        map.panTo(place.geometry.location)
        map.setZoom(16)
        marker.setPosition(place.geometry.location)
      })
    }
  }
}

function syncMapFromForm() {
  if (!map || !marker || !hasCoordinates.value) return
  const position = { lat: Number(form.latitude), lng: Number(form.longitude) }
  marker.setPosition(position)
  map.panTo(position)
}

function reverseGeocode(lat, lng) {
  if (!geocoder) {
    setCoordinatesOnly(lat, lng)
    return
  }

  geocoder.geocode({ location: { lat, lng } }, (results, status) => {
    if (status === 'OK' && results?.[0]) {
      applyGeocoderResult(results[0], { lat, lng })
    } else {
      setCoordinatesOnly(lat, lng)
    }
  })
}

function applyGeocoderResult(result, fallbackCoords = null) {
  const getComponent = (type) =>
    result.address_components?.find(c => c.types.includes(type))

  const long = (type) => getComponent(type)?.long_name || null
  const short = (type) => getComponent(type)?.short_name || null

  const lat = result.geometry?.location?.lat
    ? result.geometry.location.lat()
    : fallbackCoords?.lat

  const lng = result.geometry?.location?.lng
    ? result.geometry.location.lng()
    : fallbackCoords?.lng

  Object.assign(form, {
    place_id: result.place_id || form.place_id,
    formatted_address: result.formatted_address || form.formatted_address,
    street_number: long('street_number'),
    route: long('route'),
    premise: long('premise'),
    subpremise: long('subpremise'),
    neighborhood: long('neighborhood'),
    sublocality: long('sublocality') || long('sublocality_level_1'),
    locality: long('locality'),
    administrative_area_level_1: long('administrative_area_level_1'),
    administrative_area_level_2: long('administrative_area_level_2'),
    administrative_area_level_3: long('administrative_area_level_3'),
    postal_code: long('postal_code'),
    country: long('country') || form.country,
    country_code: short('country') || form.country_code,
    latitude: lat !== undefined ? Number(lat.toFixed(6)) : form.latitude,
    longitude: lng !== undefined ? Number(lng.toFixed(6)) : form.longitude
  })

  searchText.value = form.formatted_address || ''
  emitUpdate()
}

function setCoordinatesOnly(lat, lng) {
  form.latitude = Number(lat.toFixed(6))
  form.longitude = Number(lng.toFixed(6))
  emitUpdate()
}

// ===========================================================
// GEOLOCATION (always available, no API key required)
// ===========================================================

function useMyLocation() {
  if (!navigator.geolocation) {
    $q.notify({ type: 'negative', message: tdc('Geolocation is not supported by this browser.') })
    return
  }

  locating.value = true

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords

      if (mapsReady.value && marker && map) {
        const point = { lat: latitude, lng: longitude }
        marker.setPosition(point)
        map.panTo(point)
        map.setZoom(16)
        reverseGeocode(latitude, longitude)
      } else {
        setCoordinatesOnly(latitude, longitude)
      }

      locating.value = false
    },
    (error) => {
      locating.value = false
      $q.notify({ type: 'negative', message: error.message || tdc('Could not get your location.') })
    },
    { enableHighAccuracy: true, timeout: 10000 }
  )
}

function onManualCoordinateChange() {
  syncMapFromForm()
  emitUpdate()
}

function onSearchTextChange(value) {
  // Free-typed text (no maps/autocomplete) is treated as the
  // formatted address directly - the only reasonable behaviour when
  // there's no Places API to resolve it against.
  if (!mapsReady.value) {
    form.formatted_address = value
    emitUpdate()
  }
}

const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#1d1d1d' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1d1d1d' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8a8a8a' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2c2c2c' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e0e0e' }] }
]

onMounted(initMap)
</script>


<style scoped>
.location-picker {
  overflow: hidden;
}

.location-header {
  display: flex;
  align-items: center;
  padding: 10px 16px;
}

.map-shell {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
}

.map-surface {
  width: 100%;
  height: 260px;
}

.map-placeholder {
  width: 100%;
  height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(25, 118, 210, 0.06), rgba(25, 118, 210, 0.12));
  border: 1px dashed rgba(25, 118, 210, 0.35);
  border-radius: 12px;
  padding: 16px;
}

.map-placeholder--dark {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.08));
  border-color: rgba(255, 255, 255, 0.2);
}

.pin-pulse {
  animation: pin-pulse-anim 2.2s ease-in-out infinite;
}

@keyframes pin-pulse-anim {
  0%, 100% { transform: translateY(0); opacity: 1; }
  50% { transform: translateY(-6px); opacity: 0.75; }
}

.coords-chip {
  position: absolute;
  left: 10px;
  bottom: 10px;
  background: rgba(0, 0, 0, 0.65);
  color: #fff;
  font-family: 'Roboto Mono', ui-monospace, monospace;
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 999px;
  display: flex;
  align-items: center;
}
</style>
