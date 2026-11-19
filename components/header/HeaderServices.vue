<template>
  <!-- Header "apps" menu: the sites of the other EntityTypes of this
       installation (the current host's EntityType is left out). -->
  <s-btn round dense flat size="14px" icon="apps" data-test="header-services">
    <s-tooltip>{{ tdc('Services') }}</s-tooltip>
    <q-menu flat bordered square fit :offset="[175, 5]">
      <s-card style="min-width: 270px;">
        <q-card-section class="text-center">
          <q-scroll-area :thumb-style="thumbStyle" :bar-style="barStyle" style="height: 300px">
            <div class="row">
              <q-item
                v-for="type in otherTypes"
                :key="type.id"
                v-close-popup
                clickable
                class="col-4 column items-center header-service"
                data-test="header-service"
                @click="openType(type)"
              >
                <q-avatar size="45px" style="border-radius: 5px;">
                  <img v-if="type.icon?.url" :src="type.icon.url" :alt="tdc(type.name)">
                  <q-icon v-else name="apps" />
                </q-avatar>
                <div class="q-mt-xs">{{ tdc(type.name) }}</div>
              </q-item>
            </div>
          </q-scroll-area>
        </q-card-section>
      </s-card>
    </q-menu>
  </s-btn>
</template>

<script>
import { defineComponent } from 'vue'
import { tdc } from '../../services/translation'
import { setStorage } from '../../services/storage'
import { barStyle, thumbStyle } from '../../services/app'
import { useUserStore } from '../../stores/UserStore'
import { useEntityTypeStore } from '../../stores/EntityTypeStore'
import { entityTypeKey, entityTypeUrl, findEntityType } from '../../utils/entityTypeHost'

export default defineComponent({
  setup () {
    return {
      User: useUserStore(),
      EntityType: useEntityTypeStore(),
      tdc,
      barStyle,
      thumbStyle
    }
  },

  computed: {
    // every EntityType except the one this host belongs to
    otherTypes () {
      const key = entityTypeKey().toLowerCase()
      return (this.User.EntityTypes || []).filter(
        type => String(type?.name || '').toLowerCase() !== key
      )
    }
  },

  async mounted () {
    await this.EntityType.getEntityTypes()
    await this.applyHostType()
  },

  methods: {
    // the host's EntityType becomes the current one, with its look - once,
    // on mount (it used to run from the template on every render)
    async applyHostType () {
      const current = findEntityType(this.User.EntityTypes)
      if (!current) return
      this.User.EntityType = current
      this.EntityType.row = current
      setStorage('l', 'entityType', JSON.stringify(current))
      await this.EntityType.getLayoutSettings(current.id)
    },

    openType (type) {
      window.open(entityTypeUrl(type), '_blank')
    }
  }
})
</script>

<style scoped>
/* an almost invisible hover (2%): Quasar's q-item paints currentColor at 0.15 */
.header-service {
  border-radius: 8px;
}
.header-service:hover :deep(.q-focus-helper),
.header-service:focus :deep(.q-focus-helper) {
  opacity: 0.02 !important;
}
</style>
