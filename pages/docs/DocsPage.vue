<template>
  <q-page class="docs-page">
    <div ref="shellRef" class="docs-shell" :style="{ height: shellHeight }">
      <!-- -------------------- SIDEBAR -------------------- -->
      <aside class="docs-sidebar">
        <div class="docs-switcher">
          <button
            v-for="p in docsProducts"
            :key="p.key"
            type="button"
            class="switcher-item"
            :class="{ 'switcher-item--active': p.key === currentProduct }"
            :style="{ '--accent': p.color }"
            @click="goProduct(p.key)"
          >
            <q-icon :name="p.icon" size="20px" />
            <span class="switcher-text">
              <span class="switcher-label">{{ p.label }}</span>
              <span class="switcher-subtitle">{{ p.subtitle }}</span>
            </span>
          </button>
        </div>

        <q-scroll-area class="docs-nav-scroll">
          <q-list class="docs-nav" padding>
            <q-item
              clickable
              dense
              :active="!currentSlug"
              active-class="docs-nav-active"
              :to="{ name: 'docs', params: { product: currentProduct, slug: [] } }"
            >
              <q-item-section avatar>
                <q-icon name="menu_book" size="18px" />
              </q-item-section>
              <q-item-section>{{ tdc('Introduction') }}</q-item-section>
            </q-item>

            <template v-for="group in groupedNav" :key="group.section">
              <q-item-label header class="docs-nav-section">
                {{ tdc(group.section) }}
              </q-item-label>

              <q-item
                v-for="entry in group.items"
                :key="entry.slug"
                clickable
                dense
                :active="entry.slug === currentSlug"
                active-class="docs-nav-active"
                :to="{ name: 'docs', params: { product: currentProduct, slug: entry.slug.split('/') } }"
              >
                <q-item-section>{{ tdc(entry.title) }}</q-item-section>
              </q-item>
            </template>
          </q-list>
        </q-scroll-area>
      </aside>

      <!-- -------------------- CONTENT -------------------- -->
      <main class="docs-content">
        <div class="docs-content-inner">
          <div class="docs-breadcrumb">
            <span class="docs-breadcrumb-product" :style="{ color: activeProduct.color }">
              {{ activeProduct.label }}
            </span>
            <template v-if="currentGroup">
              <q-icon name="chevron_right" size="14px" />
              <span>{{ tdc(currentGroup) }}</span>
            </template>
          </div>

          <div
            v-if="html"
            class="docs-markdown"
            v-html="html"
            @click="onContentClick"
          />
          <div v-else class="docs-missing">
            <q-icon name="search_off" size="42px" />
            <div>{{ tdc('Documentation page not found') }}: <b>{{ currentSlug }}</b></div>
          </div>
        </div>
      </main>

      <!-- -------------------- ON THIS PAGE -------------------- -->
      <aside v-if="toc.length" class="docs-toc">
        <div class="docs-toc-title">{{ tdc('On this page') }}</div>
        <a
          v-for="item in toc"
          :key="item.id"
          :href="`#${item.id}`"
          class="docs-toc-link"
          :class="`docs-toc-level-${item.level}`"
          @click="scrollTo(item.id, $event)"
        >{{ item.text }}</a>
      </aside>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { marked } from 'marked'
import { tdc } from '../../services/translation'
import { docsNav, docsProducts, defaultDocsProduct } from '../../router/docsRoutes'

const route = useRoute()
const router = useRouter()

// =========================================================
// LOCK THE SHELL TO THE VIEWPORT HEIGHT LEFT BY THE HOST
// LAYOUT (its header/footer), so only the columns below
// scroll internally — never the whole page.
// =========================================================

const shellRef = ref(null)
const shellHeight = ref('100vh')

function measureShellHeight() {
  if (!shellRef.value) return
  const top = shellRef.value.getBoundingClientRect().top
  shellHeight.value = `calc(100vh - ${top}px)`
}

onMounted(() => {
  measureShellHeight()
  window.addEventListener('resize', measureShellHeight)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', measureShellHeight)
})

// =========================================================
// LOAD ALL docs/**/*.md AS RAW TEXT (bundled with the lib)
// Keys look like "quasar-resaas/architecture/overview" or
// "django-resaas/architecture/overview".
// =========================================================

const rawModules = import.meta.glob('../../docs/**/*.md', {
  eager: true,
  query: '?raw',
  import: 'default'
})

const docsMap = {}

for (const [path, content] of Object.entries(rawModules)) {
  const slug = path.split('/docs/')[1]?.replace(/\.md$/, '')
  if (slug) docsMap[slug] = content
}

// =========================================================
// CURRENT PRODUCT
// =========================================================

const currentProduct = computed(() => {
  const key = route.params.product
  return docsProducts.some(p => p.key === key) ? key : defaultDocsProduct
})

const activeProduct = computed(() =>
  docsProducts.find(p => p.key === currentProduct.value) || docsProducts[0]
)

function goProduct(key) {
  if (key === currentProduct.value) return
  router.push({ name: 'docs', params: { product: key, slug: [] } })
}

// =========================================================
// NAV GROUPING
// =========================================================

const groupedNav = computed(() => {
  const groups = []
  const bySection = {}

  for (const entry of (docsNav[currentProduct.value] || [])) {
    if (!bySection[entry.section]) {
      bySection[entry.section] = { section: entry.section, items: [] }
      groups.push(bySection[entry.section])
    }
    bySection[entry.section].items.push(entry)
  }

  return groups
})

// =========================================================
// CURRENT DOC
// =========================================================

const currentSlug = computed(() => {
  const slug = route.params.slug
  if (!slug || slug.length === 0) return ''
  return Array.isArray(slug) ? slug.join('/') : slug
})

const currentGroup = computed(() => {
  const entry = (docsNav[currentProduct.value] || []).find(e => e.slug === currentSlug.value)
  return entry ? entry.section : ''
})

const effectiveSlug = computed(() => `${currentProduct.value}/${currentSlug.value || 'README'}`)

const rawContent = computed(() => docsMap[effectiveSlug.value] || null)

// =========================================================
// MARKDOWN RENDERING (headings get slugged ids for the TOC)
// =========================================================

function slugify(text) {
  return text
    .toString()
    .replace(/<[^>]+>/g, '')
    .replace(/`/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
}

const renderer = new marked.Renderer()
renderer.heading = (text, level, raw) => {
  const id = slugify(raw)
  return `<h${level} id="${id}">${text}</h${level}>\n`
}

const html = computed(() => {
  if (!rawContent.value) return null
  return marked.parse(rawContent.value, { renderer })
})

const toc = computed(() => {
  if (!rawContent.value) return []
  return marked.lexer(rawContent.value)
    .filter(t => t.type === 'heading' && (t.depth === 2 || t.depth === 3))
    .map(t => ({ id: slugify(t.text), text: t.text.replace(/`/g, ''), level: t.depth }))
})

function scrollTo(id, event) {
  event.preventDefault()
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// =========================================================
// REWRITE INTERNAL *.md LINKS INTO SPA NAVIGATION
// =========================================================

function resolveRelativePath(baseDir, relPath) {
  const stack = baseDir ? baseDir.split('/') : []

  for (const part of relPath.split('/')) {
    if (part === '' || part === '.') continue
    if (part === '..') stack.pop()
    else stack.push(part)
  }

  return stack.join('/')
}

function onContentClick(event) {
  const anchor = event.target.closest('a')
  if (!anchor) return

  const href = anchor.getAttribute('href') || ''
  if (!href.endsWith('.md')) return

  event.preventDefault()

  const baseDir = effectiveSlug.value.split('/').slice(0, -1).join('/')
  const resolved = resolveRelativePath(baseDir, href).replace(/\.md$/, '')
  const [product, ...rest] = resolved.split('/')
  const targetProduct = docsProducts.some(p => p.key === product) ? product : currentProduct.value

  router.push({ name: 'docs', params: { product: targetProduct, slug: rest.filter(Boolean) } })
}
</script>

<style scoped>
.docs-page {
  background: #fff;
  overflow: hidden;
}

.docs-shell {
  display: flex;
  align-items: stretch;
  max-width: 1400px;
  margin: 0 auto;
  overflow: hidden;
}

/* -------------------- SIDEBAR -------------------- */

.docs-sidebar {
  width: 272px;
  min-width: 272px;
  height: 100%;
  display: flex;
  flex-direction: column;
  border-right: 1px solid rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.docs-switcher {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.switcher-item {
  display: flex;
  align-items: center;
  gap: 10px;
  text-align: left;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  background: #fff;
  padding: 8px 10px;
  cursor: pointer;
  color: rgba(0, 0, 0, 0.6);
  transition: border-color .15s, background .15s;
}

.switcher-item:hover {
  border-color: rgba(0, 0, 0, 0.25);
}

.switcher-item--active {
  border-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 8%, white);
  color: rgba(0, 0, 0, 0.87);
}

.switcher-item--active .q-icon {
  color: var(--accent);
}

.switcher-text {
  display: flex;
  flex-direction: column;
  line-height: 1.25;
}

.switcher-label {
  font-weight: 700;
  font-size: 0.88rem;
}

.switcher-subtitle {
  font-size: 0.72rem;
  opacity: 0.7;
}

.docs-nav-scroll {
  flex: 1;
  height: 100%;
  min-height: 0;
}

.docs-nav {
  padding-top: 8px;
}

.docs-nav-section {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(0, 0, 0, 0.45);
  padding-top: 18px;
}

.docs-nav :deep(.q-item) {
  border-radius: 8px;
  margin: 1px 8px;
  min-height: 34px;
  color: rgba(0, 0, 0, 0.7);
}

.docs-nav :deep(.q-item:hover) {
  background: rgba(0, 0, 0, 0.04);
}

.docs-nav :deep(.docs-nav-active) {
  background: rgba(25, 118, 210, 0.08);
  color: #1976d2;
  font-weight: 600;
  box-shadow: inset 3px 0 0 #1976d2;
}

/* -------------------- CONTENT -------------------- */

.docs-content {
  flex: 1;
  min-width: 0;
  height: 100%;
  overflow-y: auto;
}

.docs-content-inner {
  max-width: 760px;
  margin: 0 auto;
  padding: 40px 32px 96px;
}

.docs-breadcrumb {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8rem;
  color: rgba(0, 0, 0, 0.5);
  margin-bottom: 8px;
}

.docs-breadcrumb-product {
  font-weight: 700;
}

.docs-missing {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: rgba(0, 0, 0, 0.4);
  padding: 64px 0;
}

/* -------------------- TOC -------------------- */

.docs-toc {
  width: 220px;
  min-width: 220px;
  height: 100%;
  overflow-y: auto;
  padding: 40px 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  border-left: 1px solid rgba(0, 0, 0, 0.08);
}

.docs-toc-title {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(0, 0, 0, 0.45);
  margin-bottom: 4px;
}

.docs-toc-link {
  font-size: 0.8rem;
  color: rgba(0, 0, 0, 0.55);
  text-decoration: none;
  line-height: 1.4;
}

.docs-toc-link:hover {
  color: #1976d2;
}

.docs-toc-level-3 {
  padding-left: 12px;
  font-size: 0.76rem;
  opacity: 0.85;
}

@media (max-width: 1150px) {
  .docs-toc {
    display: none;
  }
}

@media (max-width: 760px) {
  .docs-sidebar {
    display: none;
  }
}
</style>

<style>
/* unscoped — targets v-html markdown output, which Vue's
   scoped attribute never reaches */

.docs-markdown h1 {
  font-size: 2rem;
  font-weight: 800;
  margin: 0 0 0.4em;
  padding-bottom: 0.3em;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  scroll-margin-top: 24px;
}

.docs-markdown h2 {
  font-size: 1.35rem;
  font-weight: 700;
  margin: 2.2em 0 0.6em;
  scroll-margin-top: 24px;
}

.docs-markdown h3 {
  font-size: 1.1rem;
  font-weight: 700;
  margin: 1.6em 0 0.5em;
  scroll-margin-top: 24px;
}

.docs-markdown p {
  line-height: 1.7;
  margin: 0.8em 0;
  color: rgba(0, 0, 0, 0.8);
}

.docs-markdown li {
  line-height: 1.7;
  color: rgba(0, 0, 0, 0.8);
}

.docs-markdown a {
  color: #1976d2;
  text-decoration: none;
}

.docs-markdown a:hover {
  text-decoration: underline;
}

.docs-markdown code {
  background: rgba(25, 118, 210, 0.08);
  color: #c7254e;
  border-radius: 4px;
  padding: 0.15em 0.4em;
  font-size: 0.85em;
  font-family: 'Roboto Mono', ui-monospace, monospace;
}

.docs-markdown pre {
  background: #1e1e2e;
  border-radius: 10px;
  padding: 1.1em 1.2em;
  overflow-x: auto;
  margin: 1.2em 0;
}

.docs-markdown pre code {
  background: none;
  color: #d8dee9;
  padding: 0;
  font-size: 0.85em;
}

.docs-markdown table {
  border-collapse: collapse;
  width: 100%;
  margin: 1.2em 0;
  font-size: 0.92em;
}

.docs-markdown th {
  background: rgba(0, 0, 0, 0.03);
  font-weight: 700;
}

.docs-markdown th,
.docs-markdown td {
  border: 1px solid rgba(0, 0, 0, 0.1);
  padding: 0.55em 0.8em;
  text-align: left;
}

.docs-markdown blockquote {
  border-left: 4px solid #1976d2;
  margin: 1.2em 0;
  padding: 0.3em 1em;
  color: rgba(0, 0, 0, 0.65);
  background: rgba(25, 118, 210, 0.05);
  border-radius: 0 6px 6px 0;
}

body.body--dark .docs-page {
  background: #121212;
}

body.body--dark .docs-sidebar,
body.body--dark .docs-toc {
  border-color: rgba(255, 255, 255, 0.08);
}

body.body--dark .switcher-item {
  background: #1d1d1d;
  border-color: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
}

body.body--dark .docs-markdown p,
body.body--dark .docs-markdown li {
  color: rgba(255, 255, 255, 0.85);
}

body.body--dark .docs-markdown code {
  background: rgba(255, 255, 255, 0.1);
  color: #ff8fb1;
}

body.body--dark .docs-markdown blockquote {
  color: rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.05);
}
</style>
