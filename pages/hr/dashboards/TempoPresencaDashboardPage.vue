<template>
  <q-page class="q-pa-sm">
    <s-card flat bordered>
      <q-card-section>
        <div class="text-h6">
          <q-icon name="schedule" class="q-mr-xs" />
          {{ tdc('Time & Attendance') }}
        </div>
      </q-card-section>

      <q-separator />

      <div v-if="loading" class="flex flex-center q-pa-xl">
        <q-spinner :color="$q.dark.isActive ? 'white' : 'primary'" size="48px" />
      </div>

      <template v-else>
        <q-card-section class="row q-col-gutter-md">
          <div class="col-6">
            <s-card flat bordered>
              <q-card-section>
                <div class="text-caption text-grey-6">{{ tdc('Present Today') }}</div>
                <div class="text-h5 text-weight-bold">{{ data.today_attendance_count }}</div>
              </q-card-section>
            </s-card>
          </div>
          <div class="col-6">
            <s-card flat bordered>
              <q-card-section>
                <div class="text-caption text-grey-6">{{ tdc('On Shift Today') }}</div>
                <div class="text-h5 text-weight-bold">{{ data.employees_on_shift_today }}</div>
              </q-card-section>
            </s-card>
          </div>
        </q-card-section>

        <q-card-section>
          <div class="text-subtitle2 text-weight-medium q-mb-sm">
            {{ tdc('Upcoming Holidays') }}
          </div>
          <div v-if="!data.upcoming_holidays.length" class="text-caption text-grey-6">
            {{ tdc('No holidays in the next 30 days') }}
          </div>
          <q-list v-else separator>
            <q-item v-for="item in data.upcoming_holidays" :key="item.id">
              <q-item-section>{{ item.name }}</q-item-section>
              <q-item-section side><q-item-label caption>{{ item.date }}</q-item-label></q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </template>
    </s-card>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { tdc } from '../../../services/translation'
import { HTTPAuth, url } from '../../../services/api'

const loading = ref(true)
const data = ref({
  today_attendance_count: 0,
  employees_on_shift_today: 0,
  upcoming_holidays: [],
})

onMounted(async () => {
  loading.value = true
  try {
    const { data: response } = await HTTPAuth.get(url({
      type: 'u',
      url: 'hr/dashboard_tempo_presenca',
    }))
    data.value = response
  } finally {
    loading.value = false
  }
})
</script>
