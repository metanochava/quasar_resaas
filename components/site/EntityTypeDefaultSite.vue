<template>
  <div class="etd" data-test="entity-type-default-site">

    <!-- this host's EntityType: its name, its icon, the way in -->
    <section v-if="entityType" class="etd__hero">
      <img v-if="entityType.icon?.url" :src="entityType.icon.url" :alt="name" class="etd__icon">
      <h1 class="etd__title">{{ tdc('Welcome to') }} {{ name }}</h1>
      <p class="etd__text">{{ tdc('Smart platform for modern business management') }}</p>

      <div class="etd__cta">
        <s-btn
          v-if="signedIn"
          unelevated rounded no-caps color="primary" icon="dashboard"
          :label="tdc('Open dashboard')" :to="{ name: 'dashboard' }"
        />
        <template v-else>
          <s-btn
            unelevated rounded no-caps color="primary" icon="login"
            :label="tdc('Sign In')" :to="{ name: 'login' }"
          />
          <s-btn
            outline rounded no-caps color="primary"
            :label="tdc('Create Account')" :to="{ name: 'registarUser' }"
          />
        </template>
      </div>
    </section>

    <!-- a host of no EntityType (or the platform's own): the sectors -->
    <section v-else class="etd__hero">
      <h1 class="etd__title">{{ tdc('Choose your sector') }}</h1>
      <p class="etd__text">{{ tdc('Smart platform for modern business management') }}</p>

      <div v-if="entityTypes.length" class="etd__grid" data-test="site-sectors">
        <a
          v-for="type in entityTypes"
          :key="type.id"
          :href="entityTypeUrl(type)"
          class="etd__sector"
          data-test="site-sector"
        >
          <img v-if="type.icon?.url" :src="type.icon.url" :alt="tdc(type.label || type.name)" class="etd__sector-icon">
          <q-icon v-else name="apps" size="36px" color="primary" />
          <span>{{ tdc(type.label || type.name) }}</span>
        </a>
      </div>
    </section>

  </div>
</template>

<script setup>
import { computed } from 'vue'
import { tdc } from '../../services/translation'
import { entityTypeUrl } from '../../utils/entityTypeHost'

// The generic body of the site at '/' (pages/EntityTypeSitePage.vue) for an
// EntityType without a registered site (services/entityTypeSites.js). The same
// props are given to a registered site.
const props = defineProps({
  entityType: { type: Object, default: null },
  entityTypes: { type: Array, default: () => [] },
  signedIn: { type: Boolean, default: false },
})

const name = computed(() => tdc(props.entityType?.label || props.entityType?.name || ''))
</script>

<style scoped>
.etd__hero {
  max-width: 880px;
  margin: 0 auto;
  padding: clamp(48px, 10vw, 120px) 16px;
  text-align: center;
}
.etd__icon {
  width: 96px;
  height: 96px;
  border-radius: 24px;
  object-fit: cover;
  box-shadow: 0 20px 50px -20px color-mix(in srgb, var(--q-primary) 60%, transparent);
}
.etd__title {
  margin: 24px 0 8px;
  font-size: clamp(32px, 6vw, 56px);
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.02em;
}
.etd__text {
  max-width: 560px;
  margin: 0 auto;
  font-size: 18px;
  line-height: 1.6;
  opacity: 0.75;
}
.etd__cta {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
  margin-top: 32px;
}
.etd__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;
  margin-top: 40px;
}
.etd__sector {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 24px 16px;
  border-radius: 20px;
  color: inherit;
  text-decoration: none;
  font-weight: 700;
  background: color-mix(in srgb, var(--q-primary) 6%, transparent);
  border: 1px solid color-mix(in srgb, var(--q-primary) 14%, transparent);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.etd__sector:hover {
  transform: translateY(-3px);
  box-shadow: 0 16px 40px -20px color-mix(in srgb, var(--q-primary) 70%, transparent);
}
.etd__sector-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  object-fit: cover;
}
</style>
