<template>
  <q-page class="q-pa-sm">
    <!-- Promotion has no generic add page on purpose - it's only ever
    created through EmployeeStore.applyPromotion() from a specific
    Employee's profile (History tab), never a free "Add" button here -
    see hr/views/promotion.py, which blocks a raw POST outright. This
    page is a browsing/overview list only (pedido secção 19). -->
    <s-card>
      <q-bar class="bg-primary text-white">
        <q-icon name="trending_up" />
        <div class="text-subtitle1 q-ml-sm">{{ tdc('Promotions') }}</div>
      </q-bar>

      <q-card-section>
        <div v-if="Promotion.loading" class="flex flex-center q-pa-lg">
          <q-spinner size="40px" color="primary" />
        </div>

        <div v-else-if="!Promotion.rows?.length" class="text-grey-6 q-pa-md">
          {{ tdc('No promotions found.') }}
        </div>

        <q-list v-else separator>
          <q-item
            v-for="row in Promotion.rows"
            :key="row.id"
            clickable
            :to="{ name: 'view_employee', params: { id: row.employee_data?.id || row.employee } }"
          >
            <q-item-section>
              <q-item-label>{{ row.employee_data?.label || row.employee }}</q-item-label>
              <q-item-label caption>
                {{ tdc('To') }} {{ row.new_position_data?.label }} · {{ row.effective_date }}
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
import { usePromotionStore } from '../../../stores/PromotionStore.js'
import { tdc } from '../../../services/translation.js'

const Promotion = usePromotionStore()

onMounted(async () => {
  await Promotion.loadData({ page_size: 50 })
})
</script>
