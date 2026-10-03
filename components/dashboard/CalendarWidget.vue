<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { tdc } from '../../services/translation'
import { resolveDashboardAction } from '../../services/dashboardActions'
import { matchesSearch } from '../../utils/highlight'
import HighlightText from '../engine/HighlightText.vue'

const props = defineProps({
  widget: { type: Object, required: true },
  data: { type: Object, required: true },
})

const router = useRouter()

function onEventClick(event) {
  if (!props.widget.item_action) return
  dayOpen.value = false
  resolveDashboardAction(props.widget.item_action, { router, context: event })
}

// Nenhuma biblioteca de calendário instalada no projecto - reutiliza
// o QDate nativo do Quasar (já disponível, sem dependência nova),
// que já suporta 'events'/'event-color' - vista mensal com eventos
// marcados + lista do dia seleccionado, em vez de reconstruir a
// grelha do zero.
function toQDate(iso) {
  return (iso || '').slice(0, 10).replaceAll('-', '/')
}

function today() {
  const d = new Date()
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}

const selectedDate = ref(toQDate((props.data.events || [])[0]?.start) || today())

const eventsByDate = computed(() => {
  const map = {}
  for (const event of props.data.events || []) {
    const day = toQDate(event.start)
    if (!map[day]) map[day] = []
    map[day].push(event)
  }
  return map
})

const eventDates = computed(() => Object.keys(eventsByDate.value))

function eventColor(date) {
  return (eventsByDate.value[date] || [])[0]?.status_color || 'primary'
}

const selectedEvents = computed(() => eventsByDate.value[selectedDate.value] || [])

// clicking a day selects it and, when it has events, opens their list
const dayOpen = ref(false)
function selectDay (date) {
  if (!date) return
  selectedDate.value = date
  dayOpen.value = (eventsByDate.value[date] || []).length > 0
}

// "Appointments: 3" for the selected day ("label: n" reads right in every
// language). The widget may name what it counts (widget.count_label, e.g.
// "Appointments"); default "Events".
// the day's list, filtered by the modal's search (patient / doctor, status,
// time - case- and accent-insensitive, like the rest of RESAAS)
const daySearch = ref('')

function eventTime (event) {
  const start = (event.start || '').slice(11, 16)
  const end = (event.end || '').slice(11, 16)
  return end ? `${start} - ${end}` : start
}

const filteredEvents = computed(() => {
  if (!(daySearch.value || '').trim()) return selectedEvents.value
  return selectedEvents.value.filter(event =>
    [tdc(event.title || ''), event.status ? tdc(event.status) : '', eventTime(event)]
      .some(text => matchesSearch(text, daySearch.value)))
})

const countLabel = computed(() => tdc(props.widget.count_label || 'Events'))
const selectedDateLabel = computed(() => selectedDate.value.split('/').reverse().join('/'))
</script>

<template>
  <div class="column items-center">
    <q-date
      :model-value="selectedDate"
      :events="eventDates"
      :event-color="eventColor"
      minimal flat dense
      @update:model-value="selectDay"
    />

    <!-- the selected day: how many, and a way back to its list -->
    <s-btn
      flat dense no-caps class="q-mt-xs"
      :color="selectedEvents.length ? 'primary' : 'grey'"
      :disable="!selectedEvents.length"
      data-test="calendar-day-header"
      @click="dayOpen = true"
    >
      {{ selectedDateLabel }} ·
      <span class="q-ml-xs" data-test="calendar-day-count">{{ countLabel }}: {{ selectedEvents.length }}</span>
    </s-btn>
  </div>

  <!-- the day's list in a modal (the RESAAS modal pattern): the q-bar and the
       search are static, only the list scrolls -->
  <q-dialog v-model="dayOpen" @hide="daySearch = ''">
    <s-modal-card
      :title="`${selectedDateLabel} · ${countLabel}: ${selectedEvents.length}`"
      icon="event" width="520px" flush
      style="height: min(560px, 80vh)"
      @close="dayOpen = false"
    >
      <template #subheader>
        <s-input
          v-model="daySearch"
          dense outlined clearable autofocus
          type="search"
          :placeholder="tdc('Search')"
          data-test="calendar-day-search"
        />
      </template>

      <div class="col scroll" data-test="calendar-day-scroll">
        <div v-if="!filteredEvents.length" class="text-caption text-grey-6 q-pa-md text-center" data-test="calendar-day-empty">
          {{ daySearch ? tdc('No results') : tdc('No events') }}
        </div>
        <q-list v-else separator data-test="calendar-day-list">
          <q-item
            v-for="event in filteredEvents" :key="event.id"
            :clickable="!!widget.item_action" v-ripple="!!widget.item_action"
            @click="onEventClick(event)"
          >
            <q-item-section>
              <q-item-label><HighlightText :text="tdc(event.title)" :search="daySearch" /></q-item-label>
              <q-item-label caption>
                {{ eventTime(event) }}
              </q-item-label>
            </q-item-section>

            <q-item-section v-if="event.status" side>
              <q-badge :color="event.status_color || 'grey'">{{ tdc(event.status) }}</q-badge>
            </q-item-section>
          </q-item>
        </q-list>
      </div>
    </s-modal-card>
  </q-dialog>
</template>

