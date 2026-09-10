<script setup>
import { useRouter } from 'vue-router'
import { tdc } from '../../services/translation'
import { resolveDashboardAction } from '../../services/dashboardActions'

const props = defineProps({
  widget: { type: Object, required: true },
  data: { type: Object, required: true },
})

const router = useRouter()

function isClickable(item) {
  return !!(props.widget.item_action || item.route)
}

function onClick(item) {
  if (props.widget.item_action) {
    resolveDashboardAction(props.widget.item_action, { router, context: item })
    return
  }
  if (item.route) router.push({ name: item.route, params: item.route_params })
}
</script>

<template>
  <q-list separator dense>
    <q-item
      v-for="item in data.items" :key="item.id ?? item.title"
      :clickable="isClickable(item)" v-ripple="isClickable(item)"
      @click="onClick(item)"
    >
      <q-item-section v-if="item.avatar" avatar>
        <q-avatar size="32px"><img :src="item.avatar"></q-avatar>
      </q-item-section>
      <q-item-section v-else-if="item.icon" avatar>
        <q-icon :name="item.icon" />
      </q-item-section>

      <q-item-section>
        <q-item-label>{{ tdc(item.title) }}</q-item-label>
        <q-item-label v-if="item.description" caption>{{ tdc(item.description) }}</q-item-label>
      </q-item-section>

      <q-item-section v-if="item.date || item.status" side top>
        <q-item-label v-if="item.date" caption>{{ item.date }}<span v-if="item.time"> {{ item.time }}</span></q-item-label>
        <q-badge v-if="item.status" :color="item.status_color || 'grey'">{{ tdc(item.status) }}</q-badge>
      </q-item-section>
    </q-item>
  </q-list>
</template>
