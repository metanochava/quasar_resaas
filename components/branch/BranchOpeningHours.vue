<template>
  <!-- When the branch is open (django_resaas BranchOpeningHours): intervals per
       weekday, several in a day (08:00-12:00 and 14:00-17:00); a day without
       any is closed. Bookings use them when a professional has no schedule. -->
  <s-card flat bordered data-test="branch-opening-hours">
    <q-card-section class="row items-center no-wrap q-py-sm">
      <q-icon name="schedule" color="primary" class="q-mr-xs" />
      <div class="text-subtitle2 text-weight-medium">{{ tdc('Branch opening hours') }}</div>
    </q-card-section>
    <q-separator />

    <q-card-section v-if="canAdd" class="row items-center q-col-gutter-sm">
      <div class="col-12 col-sm-4">
        <q-select
          v-model="draft.weekday"
          :options="weekdayOptions"
          emit-value
          map-options
          outlined
          dense
          :label="tdc('Weekday')"
          data-test="opening-weekday"
        />
      </div>
      <div class="col-6 col-sm-3">
        <s-time v-model="draft.opens_at" :label="tdc('Opens at')" dense data-test="opening-opens" />
      </div>
      <div class="col-6 col-sm-3">
        <s-time v-model="draft.closes_at" :label="tdc('Closes at')" dense data-test="opening-closes" />
      </div>
      <div class="col-12 col-sm-2 text-right">
        <s-btn
          round unelevated color="primary" icon="add"
          :loading="saving"
          :disable="!canSaveDraft"
          data-test="opening-add"
          @click="add"
        >
          <s-tooltip>{{ tdc('Add this interval') }}</s-tooltip>
        </s-btn>
      </div>
    </q-card-section>

    <q-separator v-if="canAdd" />

    <q-card-section>
      <div v-if="loading" class="flex flex-center q-pa-sm">
        <q-spinner :color="$q.dark.isActive ? 'white' : 'primary'" size="28px" />
      </div>
      <div v-else-if="!rows.length" class="text-caption text-grey-6">
        {{ tdc('No opening hours yet: bookings use 08:00-17:00.') }}
      </div>
      <q-list v-else dense separator>
        <q-item v-for="day in days" :key="day.value" data-test="opening-day">
          <q-item-section style="max-width: 130px">
            <q-item-label class="text-weight-medium">{{ day.label }}</q-item-label>
          </q-item-section>
          <q-item-section>
            <div v-if="!day.rows.length" class="text-caption text-grey-6">{{ tdc('Closed') }}</div>
            <div v-else class="row q-gutter-xs">
              <q-chip
                v-for="row in day.rows"
                :key="row.id"
                dense outline color="primary"
                :removable="canDelete"
                data-test="opening-interval"
                @remove="remove(row)"
              >
                {{ hhmm(row.opens_at) }}–{{ hhmm(row.closes_at) }}
              </q-chip>
            </div>
          </q-item-section>
        </q-item>
      </q-list>
    </q-card-section>
  </s-card>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { HTTPAuth, url } from '../../services/api'
import { tdc } from '../../services/translation'
import { useUserStore } from '../../stores/UserStore'

const props = defineProps({
  branchId: { type: [String, Number], required: true }
})

const User = useUserStore()
const canAdd = computed(() => User.can('add_branchopeninghours'))
const canDelete = computed(() => User.can('delete_branchopeninghours'))

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const weekdayOptions = WEEKDAYS.map((name, value) => ({ value, label: tdc(name) }))

const rows = ref([])
const loading = ref(false)
const saving = ref(false)
const draft = reactive({ weekday: 0, opens_at: '08:00', closes_at: '17:00' })

const hhmm = value => String(value || '').slice(0, 5)
const weekdayOf = row => (row.weekday && typeof row.weekday === 'object' ? Number(row.weekday.value ?? row.weekday.id) : Number(row.weekday))

const days = computed(() => weekdayOptions.map(day => ({
  ...day,
  rows: rows.value.filter(row => weekdayOf(row) === day.value).sort((a, b) => hhmm(a.opens_at).localeCompare(hhmm(b.opens_at)))
})))

const canSaveDraft = computed(() =>
  draft.weekday !== null && !!draft.opens_at && !!draft.closes_at && hhmm(draft.closes_at) > hhmm(draft.opens_at)
)

async function load() {
  if (!props.branchId) return
  loading.value = true
  try {
    const { data } = await HTTPAuth.get(url({ type: 'u', url: 'django_resaas/branchopeninghours/', params: { branch: props.branchId, page_size: 0 } }))
    rows.value = data?.results ?? data ?? []
  } finally {
    loading.value = false
  }
}

async function add() {
  if (!canSaveDraft.value) return
  saving.value = true
  try {
    await HTTPAuth.post(url({ type: 'u', url: 'django_resaas/branchopeninghours/' }), {
      branch: props.branchId, weekday: draft.weekday, opens_at: draft.opens_at, closes_at: draft.closes_at,
    })
    await load()
  } catch {
    // the message goes through the alert funnel (HTTPAuth interceptor)
  } finally {
    saving.value = false
  }
}

async function remove(row) {
  try {
    await HTTPAuth.delete(url({ type: 'u', url: `django_resaas/branchopeninghours/${row.id}/` }))
    await load()
  } catch {
    // the alert funnel shows why
  }
}

watch(() => props.branchId, load, { immediate: true })
</script>
