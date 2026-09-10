<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { tdc } from '../../services/translation'
import { resolveDashboardAction } from '../../services/dashboardActions'

const props = defineProps({
  widget: { type: Object, required: true },
  data: { type: Object, required: true },
})

const router = useRouter()

function onEventClick(event) {
  if (props.widget.item_action) resolveDashboardAction(props.widget.item_action, { router, context: event })
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
</script>

<template>
  <div class="row q-gutter-md items-start">
    <q-date
      v-model="selectedDate"
      :events="eventDates"
      :event-color="eventColor"
      minimal flat dense
      class="col-auto"
    />

    <div class="col column q-gutter-xs">
      <div v-if="!selectedEvents.length" class="text-caption text-grey-6">
        {{ tdc('No events') }}
      </div>

      <q-item
        v-for="event in selectedEvents" :key="event.id" dense class="q-px-none"
        :clickable="!!widget.item_action" v-ripple="!!widget.item_action"
        @click="onEventClick(event)"
      >
        <q-item-section>
          <q-item-label>{{ tdc(event.title) }}</q-item-label>
          <q-item-label caption>
            {{ (event.start || '').slice(11, 16) }}<span v-if="event.end"> - {{ (event.end || '').slice(11, 16) }}</span>
          </q-item-label>
        </q-item-section>

        <q-item-section v-if="event.status" side>
          <q-badge :color="event.status_color || 'grey'">{{ tdc(event.status) }}</q-badge>
        </q-item-section>
      </q-item>
    </div>
  </div>
</template>
