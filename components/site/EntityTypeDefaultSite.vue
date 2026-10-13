<template>
  <div class="ets" :class="[`ets--${layout}`, { 'ets--dark': $q.dark.isActive }]" :data-layout="layout" data-test="entity-type-default-site">

    <!-- HERO: EntityType.site.hero, or the type's name and icon -->
    <section class="ets-hero" :class="`ets-hero--${layout}`">
      <div class="ets-hero__glow ets-hero__glow--a" />
      <div class="ets-hero__glow ets-hero__glow--b" />

      <div class="ets-hero__inner">
        <div class="ets-hero__copy">
          <span v-if="eyebrow" class="ets-hero__eyebrow">
            <q-icon name="auto_awesome" size="16px" /> {{ tdc(eyebrow) }}
          </span>

          <h1 class="ets-hero__title" data-test="site-title">{{ heroTitle }}</h1>
          <p class="ets-hero__subtitle">{{ tdc(hero.subtitle || 'Smart platform for modern business management') }}</p>

          <div class="ets-hero__cta">
            <s-btn
              v-if="signedIn"
              unelevated rounded no-caps size="lg" color="white" text-color="primary" icon="dashboard"
              :label="tdc('Open dashboard')" :to="{ name: 'dashboard' }"
            />
            <template v-else>
              <s-btn
                unelevated rounded no-caps size="lg" color="white" text-color="primary" icon="login"
                :label="tdc('Sign In')" :to="{ name: 'login' }" data-test="site-login"
              />
              <s-btn
                outline rounded no-caps size="lg" color="white"
                :label="tdc('Create Account')" :to="{ name: 'registarUser' }" data-test="site-register"
              />
            </template>
          </div>

          <div v-if="hero.badges?.length" class="ets-hero__badges">
            <span v-for="badge in hero.badges" :key="badge" class="ets-hero__badge">
              <q-icon name="check_circle" size="16px" /> {{ tdc(badge) }}
            </span>
          </div>
        </div>

        <!-- the hero's art depends on site.layout -->
        <!-- orbit: the type's icon orbited by the icons of its site -->
        <div v-if="layout === 'orbit'" class="ets-hero__art" aria-hidden="true">
          <div class="ets-hero__core">
            <img v-if="iconUrl" :src="iconUrl" alt="">
            <q-icon v-else name="apps" size="64px" />
          </div>
          <span
            v-for="(icon, index) in heroIcons"
            :key="icon"
            class="ets-hero__tile"
            :style="tileStyle(index)"
          >
            <q-icon :name="icon" size="28px" />
          </span>
        </div>

        <!-- split: a card listing the first features, like a product screen -->
        <div v-else-if="layout === 'split'" class="ets-hero__panel" aria-hidden="true">
          <div class="ets-panel">
            <div class="ets-panel__head">
              <span class="ets-panel__logo">
                <img v-if="iconUrl" :src="iconUrl" alt="">
                <q-icon v-else name="apps" size="26px" />
              </span>
              <span class="ets-panel__name">{{ name }}</span>
              <span class="ets-panel__dots"><i /><i /><i /></span>
            </div>
            <div v-for="item in panelItems" :key="item.title" class="ets-panel__row">
              <span class="ets-panel__icon"><q-icon :name="item.icon || 'star'" size="22px" /></span>
              <span class="ets-panel__label">{{ tdc(item.title) }}</span>
              <q-icon name="check_circle" size="20px" class="ets-panel__check" />
            </div>
          </div>
        </div>

        <!-- mosaic: the platform's sectors as tiles (or the site's icons) -->
        <div v-else-if="layout === 'mosaic'" class="ets-hero__mosaic" aria-hidden="true">
          <span v-for="(tile, index) in mosaicTiles" :key="tile.key" class="ets-mosaic__tile" :style="{ animationDelay: `${index * -0.9}s` }">
            <img v-if="tile.url" :src="tile.url" alt="">
            <q-icon v-else :name="tile.icon" size="30px" />
            <span v-if="tile.label" class="ets-mosaic__label">{{ tdc(tile.label) }}</span>
          </span>
        </div>
      </div>

      <!-- centered: the site's icons in a row under the copy -->
      <div v-if="layout === 'centered'" class="ets-hero__chips" aria-hidden="true">
        <span v-for="icon in heroIcons" :key="icon" class="ets-hero__chip"><q-icon :name="icon" size="26px" /></span>
      </div>

      <svg v-if="layout === 'centered'" class="ets-hero__wave" viewBox="0 0 1440 80" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 40 C 240 90 480 0 720 30 C 960 60 1200 10 1440 40 L1440 80 L0 80 Z" />
      </svg>
    </section>

    <!-- STATS -->
    <section v-if="site.stats?.length" class="ets-stats" data-test="site-stats">
      <div v-for="item in site.stats" :key="item.label" class="ets-stats__item">
        <div class="ets-stats__value">{{ item.value }}</div>
        <div class="ets-stats__label">{{ tdc(item.label) }}</div>
      </div>
    </section>

    <!-- FEATURES -->
    <section v-if="site.features?.items?.length" class="ets-section" data-test="site-features">
      <header class="ets-section__head">
        <h2 class="ets-section__title">{{ tdc(site.features.title) }}</h2>
        <p v-if="site.features.subtitle" class="ets-section__subtitle">{{ tdc(site.features.subtitle) }}</p>
      </header>

      <div class="ets-features">
        <article v-for="item in site.features.items" :key="item.title" class="ets-feature">
          <span class="ets-feature__icon"><q-icon :name="item.icon || 'star'" size="28px" /></span>
          <h3 class="ets-feature__title">{{ tdc(item.title) }}</h3>
          <p class="ets-feature__text">{{ tdc(item.text) }}</p>
        </article>
      </div>
    </section>

    <!-- STEPS -->
    <section v-if="site.steps?.items?.length" class="ets-section ets-section--tint" data-test="site-steps">
      <header class="ets-section__head">
        <h2 class="ets-section__title">{{ tdc(site.steps.title) }}</h2>
      </header>

      <ol class="ets-steps">
        <li v-for="(item, index) in site.steps.items" :key="item.title" class="ets-step">
          <span class="ets-step__number">{{ index + 1 }}</span>
          <h3 class="ets-step__title">{{ tdc(item.title) }}</h3>
          <p class="ets-step__text">{{ tdc(item.text) }}</p>
        </li>
      </ol>
    </section>

    <!-- SECTORS: the platform's own site, or a host of no EntityType -->
    <section v-if="sectors.length" class="ets-section" data-test="site-sectors">
      <header class="ets-section__head">
        <h2 class="ets-section__title">{{ tdc(entityType ? 'Other sectors' : 'Choose your sector') }}</h2>
        <p class="ets-section__subtitle">{{ tdc('Choose the platform made for your sector.') }}</p>
      </header>

      <div class="ets-sectors">
        <a v-for="type in sectors" :key="type.id" :href="entityTypeUrl(type)" class="ets-sector" data-test="site-sector">
          <img v-if="type.icon?.url" :src="type.icon.url" :alt="tdc(type.label || type.name)" class="ets-sector__icon">
          <q-icon v-else name="apps" size="40px" color="primary" />
          <span class="ets-sector__name">{{ tdc(type.label || type.name) }}</span>
          <span v-if="type.site?.hero?.title" class="ets-sector__text">{{ tdc(type.site.hero.title) }}</span>
          <q-icon name="arrow_forward" class="ets-sector__go" />
        </a>
      </div>
    </section>

    <!-- FAQ -->
    <section v-if="site.faq?.items?.length" class="ets-section ets-section--narrow" data-test="site-faq">
      <header class="ets-section__head">
        <h2 class="ets-section__title">{{ tdc(site.faq.title) }}</h2>
      </header>

      <div class="ets-faq">
        <q-expansion-item
          v-for="item in site.faq.items"
          :key="item.question"
          :label="tdc(item.question)"
          expand-icon-class="text-primary"
          header-class="ets-faq__question"
          class="ets-faq__item"
        >
          <div class="ets-faq__answer">{{ tdc(item.answer) }}</div>
        </q-expansion-item>
      </div>
    </section>

    <!-- CLOSING CALL -->
    <section v-if="site.cta?.title" class="ets-cta-wrap" data-test="site-cta">
      <div class="ets-cta">
        <h2 class="ets-cta__title">{{ tdc(site.cta.title) }}</h2>
        <p v-if="site.cta.text" class="ets-cta__text">{{ tdc(site.cta.text) }}</p>
        <s-btn
          unelevated rounded no-caps size="lg" color="white" text-color="primary" icon-right="arrow_forward"
          :label="signedIn ? tdc('Open dashboard') : tdc('Create Account')"
          :to="signedIn ? { name: 'dashboard' } : { name: 'registarUser' }"
        />
      </div>
    </section>

  </div>
</template>

<script setup>
import { computed } from 'vue'
import { tdc } from '../../services/translation'
import { entityTypeUrl } from '../../utils/entityTypeHost'

// The site at '/' (pages/EntityTypeSitePage.vue) drawn from the EntityType's
// `site` content (backend: EntityType.site, loaded with manage.py
// load_entity_type_sites). Every section is optional; with no content the
// page shows the type's name and icon. Texts are canonical English, translated
// here with tdc() (Translation rows). An application may replace this body for
// a type with registerEntityTypeSite(); it gets the same props.
const props = defineProps({
  entityType: { type: Object, default: null },
  entityTypes: { type: Array, default: () => [] },
  signedIn: { type: Boolean, default: false },
})

const site = computed(() => props.entityType?.site || {})
const hero = computed(() => site.value.hero || {})
const name = computed(() => tdc(props.entityType?.label || props.entityType?.name || ''))
const iconUrl = computed(() => props.entityType?.icon?.url || null)

const eyebrow = computed(() => hero.value.eyebrow || props.entityType?.label || props.entityType?.name || '')
const heroTitle = computed(() => {
  if (hero.value.title) return tdc(hero.value.title)
  if (props.entityType) return `${tdc('Welcome to')} ${name.value}`
  return tdc('Choose your sector')
})
// site.layout picks the look of the page (hero art and section styles); an
// unknown or missing value is 'orbit'
const LAYOUTS = ['orbit', 'centered', 'split', 'mosaic']
const layout = computed(() => (LAYOUTS.includes(site.value.layout) ? site.value.layout : 'orbit'))
const panelItems = computed(() => (site.value.features?.items || []).slice(0, 4))

const heroIcons = computed(() => (hero.value.icons || ['apps', 'groups', 'insights', 'inventory_2', 'point_of_sale', 'verified_user']).slice(0, 6))

// the other types, when this site asks for them or the host has no type
const sectors = computed(() => {
  if (props.entityType && !site.value.show_sectors) return []
  return props.entityTypes.filter(type => type.id !== props.entityType?.id)
})

// mosaic: the other sectors (icon and name), topped up with the site's icons
const mosaicTiles = computed(() => {
  const tiles = props.entityTypes
    .filter(type => type.id !== props.entityType?.id)
    .map(type => ({ key: type.id, url: type.icon?.url || null, icon: 'apps', label: type.label || type.name }))
  for (const icon of heroIcons.value) tiles.push({ key: icon, url: null, icon, label: '' })
  return tiles.slice(0, 6)
})

// the six tiles around the core, on a circle
function tileStyle (index) {
  const angle = (index / 6) * 2 * Math.PI - Math.PI / 2
  return {
    left: `calc(50% + ${Math.cos(angle) * 42}% - 32px)`,
    top: `calc(50% + ${Math.sin(angle) * 42}% - 32px)`,
    animationDelay: `${index * -1.1}s`,
  }
}
</script>

<style scoped>
.ets {
  --ets-text: #14213d;
  --ets-muted: #5b6475;
  --ets-surface: #ffffff;
  --ets-line: rgba(20, 33, 61, 0.08);
  --ets-tint: color-mix(in srgb, var(--q-primary) 6%, #ffffff);
  --ets-page: #ffffff;
  color: var(--ets-text);
  background: var(--ets-page);
}
.ets--dark {
  --ets-text: #eef1f8;
  --ets-muted: #a3adc2;
  --ets-surface: #161b2d;
  --ets-line: rgba(238, 241, 248, 0.08);
  --ets-tint: color-mix(in srgb, var(--q-primary) 12%, #0e1220);
  --ets-page: #0e1220;
}

/* ---------------- hero */
.ets-hero {
  position: relative;
  overflow: hidden;
  padding: clamp(56px, 9vw, 112px) 16px clamp(96px, 12vw, 150px);
  color: #fff;
  background: linear-gradient(135deg, var(--q-primary) 0%, color-mix(in srgb, var(--q-primary) 55%, var(--q-secondary, var(--q-primary))) 55%, var(--q-secondary, var(--q-primary)) 100%);
}
.ets-hero__glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(70px);
  opacity: 0.35;
  pointer-events: none;
}
.ets-hero__glow--a { width: 520px; height: 520px; top: -220px; right: -120px; background: #ffffff; }
.ets-hero__glow--b { width: 420px; height: 420px; bottom: -240px; left: -140px; background: var(--q-secondary, #ffffff); }

.ets-hero__inner {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
  align-items: center;
  gap: 48px;
  max-width: 1180px;
  margin: 0 auto;
}
.ets-hero__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  background: rgba(255, 255, 255, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.28);
}
.ets-hero__title {
  margin: 20px 0 14px;
  font-size: clamp(36px, 5.6vw, 64px);
  font-weight: 800;
  line-height: 1.05;
  letter-spacing: -0.025em;
}
.ets-hero__subtitle {
  max-width: 580px;
  margin: 0;
  font-size: clamp(16px, 1.6vw, 19px);
  line-height: 1.65;
  opacity: 0.92;
}
.ets-hero__cta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 32px;
}
.ets-hero__badges {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 18px;
  margin-top: 28px;
  font-size: 14px;
  font-weight: 600;
}
.ets-hero__badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  opacity: 0.95;
}

.ets-hero__art {
  position: relative;
  width: min(100%, 420px);
  aspect-ratio: 1;
  margin: 0 auto;
}
.ets-hero__art::before {
  content: "";
  position: absolute;
  inset: 8%;
  border-radius: 50%;
  border: 1px dashed rgba(255, 255, 255, 0.35);
}
.ets-hero__core {
  position: absolute;
  inset: 31%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 32px;
  background: rgba(255, 255, 255, 0.95);
  color: var(--q-primary);
  box-shadow: 0 30px 60px -20px rgba(0, 0, 0, 0.35);
}
.ets-hero__core img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.ets-hero__tile {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.32);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  box-shadow: 0 14px 30px -14px rgba(0, 0, 0, 0.4);
  animation: ets-float 6.6s ease-in-out infinite;
}

/* ---------------- stats */
.ets-stats {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  width: calc(100% - 32px);
  max-width: 1080px;
  margin: -64px auto 0;
  overflow: hidden;
  border-radius: 24px;
  background: var(--ets-surface);
  box-shadow: 0 30px 70px -36px rgba(15, 23, 42, 0.45);
}
.ets-stats__item {
  padding: 26px 20px;
  text-align: center;
  background: var(--ets-surface);
}
.ets-stats__item + .ets-stats__item { border-left: 1px solid var(--ets-line); }
.ets-stats__value {
  font-size: clamp(28px, 3.4vw, 38px);
  font-weight: 800;
  line-height: 1;
  color: var(--q-primary);
}
.ets-stats__label {
  margin-top: 8px;
  font-size: 14px;
  color: var(--ets-muted);
}

/* ---------------- sections */
.ets-section {
  max-width: 1180px;
  margin: 0 auto;
  padding: clamp(64px, 8vw, 104px) 16px;
}
.ets-section--tint {
  max-width: none;
  background: var(--ets-tint);
}
.ets-section--narrow { max-width: 820px; }
.ets-section__head {
  max-width: 680px;
  margin: 0 auto 44px;
  text-align: center;
}
.ets-section__title {
  margin: 0;
  font-size: clamp(28px, 3.6vw, 40px);
  font-weight: 800;
  line-height: 1.15;
  letter-spacing: -0.015em;
}
.ets-section__subtitle {
  margin: 12px 0 0;
  font-size: 17px;
  line-height: 1.6;
  color: var(--ets-muted);
}

.ets-features {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}
.ets-feature {
  position: relative;
  padding: 30px 26px;
  border-radius: 22px;
  background: var(--ets-surface);
  border: 1px solid var(--ets-line);
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
}
.ets-feature:hover {
  transform: translateY(-4px);
  border-color: color-mix(in srgb, var(--q-primary) 35%, transparent);
  box-shadow: 0 24px 50px -28px color-mix(in srgb, var(--q-primary) 70%, transparent);
}
.ets-feature__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 16px;
  color: #fff;
  background: linear-gradient(135deg, var(--q-primary), var(--q-secondary, var(--q-primary)));
  box-shadow: 0 12px 24px -12px var(--q-primary);
}
.ets-feature__title {
  margin: 18px 0 8px;
  font-size: 19px;
  font-weight: 700;
  line-height: 1.3;
}
.ets-feature__text {
  margin: 0;
  font-size: 15px;
  line-height: 1.6;
  color: var(--ets-muted);
}

.ets-steps {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
  max-width: 1080px;
  margin: 0 auto;
  padding: 0;
  list-style: none;
  counter-reset: none;
}
.ets-step {
  position: relative;
  padding: 0 12px;
  text-align: center;
}
.ets-step:not(:last-child)::after {
  content: "";
  position: absolute;
  top: 28px;
  left: calc(50% + 40px);
  width: calc(100% - 56px);
  height: 2px;
  background: linear-gradient(90deg, color-mix(in srgb, var(--q-primary) 45%, transparent), transparent);
}
.ets-step__number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  font-size: 22px;
  font-weight: 800;
  color: var(--q-primary);
  background: var(--ets-surface);
  border: 2px solid color-mix(in srgb, var(--q-primary) 40%, transparent);
}
.ets-step__title {
  margin: 18px 0 8px;
  font-size: 19px;
  font-weight: 700;
}
.ets-step__text {
  margin: 0 auto;
  max-width: 300px;
  font-size: 15px;
  line-height: 1.6;
  color: var(--ets-muted);
}

.ets-sectors {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 18px;
}
.ets-sector {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 26px 24px;
  border-radius: 22px;
  color: inherit;
  text-decoration: none;
  background: var(--ets-surface);
  border: 1px solid var(--ets-line);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}
.ets-sector:hover {
  transform: translateY(-4px);
  box-shadow: 0 24px 50px -28px color-mix(in srgb, var(--q-primary) 70%, transparent);
}
.ets-sector__icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  object-fit: cover;
}
.ets-sector__name {
  font-size: 19px;
  font-weight: 800;
}
.ets-sector__text {
  font-size: 14px;
  line-height: 1.5;
  color: var(--ets-muted);
}
.ets-sector__go {
  position: absolute;
  top: 26px;
  right: 24px;
  color: var(--q-primary);
}

.ets-faq {
  overflow: hidden;
  border-radius: 20px;
  border: 1px solid var(--ets-line);
  background: var(--ets-surface);
}
.ets-faq__item + .ets-faq__item {
  border-top: 1px solid var(--ets-line);
}
.ets-faq :deep(.ets-faq__question) {
  padding: 18px 22px;
  font-size: 16px;
  font-weight: 700;
}
.ets-faq__answer {
  padding: 0 22px 20px;
  font-size: 15px;
  line-height: 1.65;
  color: var(--ets-muted);
}

.ets-cta-wrap {
  padding: 0 16px clamp(64px, 8vw, 104px);
}
.ets-cta {
  position: relative;
  overflow: hidden;
  max-width: 1080px;
  margin: 0 auto;
  padding: clamp(40px, 6vw, 64px) 24px;
  border-radius: 32px;
  text-align: center;
  color: #fff;
  background:
    radial-gradient(circle at 15% 20%, rgba(255, 255, 255, 0.2), transparent 40%),
    linear-gradient(135deg, var(--q-primary), var(--q-secondary, var(--q-primary)));
  box-shadow: 0 40px 80px -40px var(--q-primary);
}
.ets-cta__title {
  margin: 0;
  font-size: clamp(26px, 3.6vw, 40px);
  font-weight: 800;
  line-height: 1.15;
}
.ets-cta__text {
  max-width: 560px;
  margin: 12px auto 28px;
  font-size: 17px;
  line-height: 1.6;
  opacity: 0.92;
}

/* ================= layouts (site.layout) ================= */
.ets { --ets-accent: var(--q-accent, var(--q-secondary, var(--q-primary))); }
.ets-hero__eyebrow .q-icon { color: var(--ets-accent); }

/* centered: one column, radial light, icon chips and a wave into the page */
.ets-hero--centered {
  padding-bottom: clamp(150px, 16vw, 200px);
  background:
    radial-gradient(circle at 50% -10%, color-mix(in srgb, var(--q-secondary, var(--q-primary)) 85%, #ffffff) 0%, transparent 55%),
    radial-gradient(circle at 100% 100%, color-mix(in srgb, var(--q-secondary, var(--q-primary)) 60%, transparent) 0%, transparent 50%),
    var(--q-primary);
}
.ets-hero--centered::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image: radial-gradient(rgba(255, 255, 255, 0.18) 1.5px, transparent 1.5px);
  background-size: 26px 26px;
  mask-image: linear-gradient(180deg, #000 0%, transparent 85%);
  -webkit-mask-image: linear-gradient(180deg, #000 0%, transparent 85%);
  pointer-events: none;
}
.ets-hero--centered .ets-hero__inner { grid-template-columns: 1fr; text-align: center; max-width: 860px; }
.ets-hero--centered .ets-hero__subtitle { margin: 0 auto; }
.ets-hero--centered .ets-hero__cta,
.ets-hero--centered .ets-hero__badges { justify-content: center; }
.ets-hero__chips {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 14px;
  margin-top: 44px;
}
.ets-hero__chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 58px;
  height: 58px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.3);
  animation: ets-float 6s ease-in-out infinite;
}
.ets-hero__chip:nth-child(2n) { animation-delay: -2s; }
.ets-hero__chip:nth-child(3n) { animation-delay: -4s; }
.ets-hero__wave {
  position: absolute;
  left: 0;
  bottom: -1px;
  width: 100%;
  height: 80px;
  fill: var(--ets-page);
}
.ets--centered .ets-feature { border-top: 4px solid var(--q-primary); }
.ets--centered .ets-feature__icon {
  border-radius: 50%;
  color: var(--q-primary);
  background: color-mix(in srgb, var(--q-primary) 12%, transparent);
  box-shadow: none;
}

/* split: a deep, striped hero with a product card; accent for the call */
.ets-hero--split {
  background:
    repeating-linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0 2px, transparent 2px 22px),
    linear-gradient(160deg, var(--q-primary) 0%, color-mix(in srgb, var(--q-primary) 60%, #000000) 100%);
}
.ets-hero--split .ets-hero__title { text-wrap: balance; }
.ets-hero--split .ets-hero__title::after {
  content: "";
  display: block;
  width: 84px;
  height: 5px;
  margin-top: 18px;
  border-radius: 3px;
  background: var(--ets-accent);
}
.ets-hero--split .ets-hero__glow--b { background: var(--ets-accent); }
.ets-hero__panel { position: relative; }
.ets-hero__panel::before {
  content: "";
  position: absolute;
  inset: 10% -6% -8% 12%;
  border-radius: 28px;
  background: color-mix(in srgb, var(--ets-accent) 55%, transparent);
  transform: rotate(4deg);
}
.ets-panel {
  position: relative;
  padding: 22px;
  border-radius: 24px;
  color: var(--ets-text);
  background: var(--ets-surface);
  box-shadow: 0 40px 80px -30px rgba(0, 0, 0, 0.55);
}
.ets-panel__head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 16px;
  margin-bottom: 8px;
  border-bottom: 1px solid var(--ets-line);
}
.ets-panel__logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  overflow: hidden;
  border-radius: 12px;
  color: #fff;
  background: var(--q-primary);
}
.ets-panel__logo img { width: 100%; height: 100%; object-fit: cover; }
.ets-panel__name { flex: 1; font-size: 17px; font-weight: 800; }
.ets-panel__dots { display: inline-flex; gap: 5px; }
.ets-panel__dots i { width: 9px; height: 9px; border-radius: 50%; background: var(--ets-line); }
.ets-panel__dots i:first-child { background: var(--ets-accent); }
.ets-panel__row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 13px 4px;
}
.ets-panel__row + .ets-panel__row { border-top: 1px dashed var(--ets-line); }
.ets-panel__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  color: var(--q-primary);
  background: color-mix(in srgb, var(--q-primary) 10%, transparent);
}
.ets-panel__label { flex: 1; font-size: 15px; font-weight: 600; }
.ets-panel__check { color: var(--ets-accent); }
.ets--split .ets-stats { background: var(--q-primary); }
.ets--split .ets-stats__item + .ets-stats__item { border-left-color: rgba(255, 255, 255, 0.14); }
.ets--split .ets-stats__item { background: var(--q-primary); color: #fff; }
.ets--split .ets-stats__value { color: var(--ets-accent); }
.ets--split .ets-stats__label { color: rgba(255, 255, 255, 0.82); }
.ets--split .ets-features { grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); }
.ets--split .ets-feature {
  display: grid;
  grid-template-columns: 56px 1fr;
  column-gap: 18px;
  border-left: 4px solid var(--ets-accent);
}
.ets--split .ets-feature__icon { grid-row: span 2; background: var(--q-primary); }
.ets--split .ets-feature__title { margin-top: 2px; }
.ets--split .ets-step__number { color: #fff; background: var(--q-primary); border-color: var(--ets-accent); }
.ets--split .ets-cta { background: linear-gradient(160deg, var(--q-primary), color-mix(in srgb, var(--q-primary) 60%, #000000)); }
.ets--split .ets-cta :deep(.q-btn) { background: var(--ets-accent) !important; color: #fff !important; }

/* mosaic: a vivid three-colour hero with the sectors as floating tiles */
.ets-hero--mosaic {
  background:
    radial-gradient(circle at 85% 15%, color-mix(in srgb, var(--ets-accent) 70%, transparent) 0%, transparent 40%),
    linear-gradient(120deg, var(--q-primary) 0%, var(--q-secondary, var(--q-primary)) 100%);
}
.ets-hero__mosaic {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  width: min(100%, 440px);
  margin: 0 auto;
}
.ets-mosaic__tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  aspect-ratio: 1;
  padding: 10px;
  overflow: hidden;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  box-shadow: 0 18px 36px -18px rgba(0, 0, 0, 0.45);
  animation: ets-float 7s ease-in-out infinite;
}
.ets-mosaic__tile img { width: 52px; height: 52px; border-radius: 14px; object-fit: cover; background: #fff; }
.ets-mosaic__label { font-size: 13px; font-weight: 700; text-align: center; line-height: 1.2; }
.ets--mosaic .ets-feature__icon { background: linear-gradient(135deg, var(--q-primary), var(--ets-accent)); }
.ets--mosaic .ets-sector { border-top: 4px solid var(--ets-accent); }
.ets--mosaic .ets-cta {
  background:
    radial-gradient(circle at 85% 20%, color-mix(in srgb, var(--ets-accent) 70%, transparent), transparent 45%),
    linear-gradient(120deg, var(--q-primary), var(--q-secondary, var(--q-primary)));
}

@keyframes ets-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@media (max-width: 900px) {
  .ets-hero__inner { grid-template-columns: 1fr; text-align: center; }
  .ets-hero__subtitle { margin: 0 auto; }
  .ets-hero__cta, .ets-hero__badges { justify-content: center; }
  .ets-hero__art { width: min(100%, 300px); }
  .ets-hero__panel { width: min(100%, 420px); margin: 0 auto; text-align: left; }
  .ets-hero__mosaic { width: min(100%, 340px); gap: 10px; }
  .ets--split .ets-features { grid-template-columns: 1fr; }
  .ets-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); margin-top: -56px; }
  .ets-stats__item:nth-child(odd) { border-left: 0; }
  .ets-stats__item:nth-child(n + 3) { border-top: 1px solid var(--ets-line); }
  .ets-steps { grid-template-columns: 1fr; gap: 36px; }
  .ets-step:not(:last-child)::after { display: none; }
}

@media (prefers-reduced-motion: reduce) {
  .ets-hero__tile, .ets-hero__chip, .ets-mosaic__tile { animation: none; }
}
</style>
