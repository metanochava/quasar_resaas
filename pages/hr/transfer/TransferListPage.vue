<template>
  <q-page class="q-pa-sm">
    <!-- Transfer has no generic add page on purpose - see
    hr/views/transfer.py (blocks a raw POST); creation only happens via
    EmployeeStore.applyTransfer() from an Employee's profile. -->
    <s-card>
      <q-bar class="bg-primary text-white">
        <q-icon name="compare_arrows" />
        <div class="text-subtitle1 q-ml-sm">{{ tdc('Transfers') }}</div>
      </q-bar>

      <q-card-section>
        <div v-if="Transfer.loading" class="flex flex-center q-pa-lg">
          <q-spinner size="40px" color="primary" />
        </div>

        <div v-else-if="!Transfer.rows?.length" class="text-grey-6 q-pa-md">
          {{ tdc('No transfers found.') }}
        </div>

        <q-list v-else separator>
          <q-item
            v-for="row in Transfer.rows"
            :key="row.id"
            clickable
            :to="{ name: 'view_employee', params: { id: row.employee_data?.id || row.employee } }"
          >
            <q-item-section>
              <q-item-label>{{ row.employee_data?.label || row.employee }}</q-item-label>
              <q-item-label caption>
                {{ tdc('To') }} {{ row.to_branch_data?.label }} · {{ row.effective_date }}
              </q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>
    </s-card>
  </q-page>
</template>

<script setup>
import { onMounted } from 'vue'
import { useTransferStore } from '../../../stores/TransferStore.js'
import { tdc } from '../../../services/translation.js'

const Transfer = useTransferStore()

onMounted(async () => {
  await Transfer.loadData({ page_size: 50 })
})
</script>
