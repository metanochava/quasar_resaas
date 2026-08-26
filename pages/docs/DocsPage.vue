<template>
  <q-page class="docs-page row no-wrap">
    <!-- -------------------- SIDEBAR -------------------- -->
    <q-list class="docs-nav col-3 col-md-2" bordered>
      <q-item
        clickable
        :active="!currentSlug"
        active-class="text-primary bg-blue-1"
        :to="{ name: 'docs', params: {} }"
      >
        <q-item-section avatar>
          <q-icon name="menu_book" />
        </q-item-section>
        <q-item-section>{{ tdc('Documentation') }}</q-item-section>
      </q-item>

      <q-separator />

      <template v-for="group in groupedNav" :key="group.section">
        <q-item-label header class="text-caption text-weight-bold q-pt-md">
          {{ tdc(group.section) }}
        </q-item-label>

        <q-item
          v-for="entry in group.items"
          :key="entry.slug"
          clickable
          dense
          :active="entry.slug === currentSlug"
          active-class="text-primary bg-blue-1"
          :to="{ name: 'docs', params: { slug: entry.slug.split('/') } }"
        >
          <q-item-section>{{ tdc(entry.title) }}</q-item-section>
        </q-item>
      </template>
    </q-list>

    <!-- -------------------- CONTENT -------------------- -->
    <s-card class="docs-content col q-pa-lg" flat bordered>
      <div
        v-if="html"
        class="docs-markdown"
        v-html="html"
        @click="onContentClick"
      />
      <div v-else class="text-negative">
        {{ tdc('Documentation page not found') }}: <b>{{ currentSlug }}</b>
      </div>
    </s-card>
  </q-page>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { marked } from 'marked'
import { tdc } from '../../services/translation'
import { docsNav } from '../../router/docsRoutes'

const route = useRoute()
const router = useRouter()

// =========================================================
// LOAD ALL docs/**/*.md AS RAW TEXT (bundled with the lib)
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
// NAV GROUPING
// =========================================================

const groupedNav = computed(() => {
  const groups = []
  const bySection = {}

  for (const entry of docsNav) {
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

const effectiveSlug = computed(() => currentSlug.value || 'README')

const html = computed(() => {
  const content = docsMap[effectiveSlug.value]
  return content ? marked.parse(content) : null
})

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

  router.push({ name: 'docs', params: { slug: resolved.split('/').filter(Boolean) } })
}
</script>

<style scoped>
.docs-nav {
  max-width: 260px;
  min-width: 200px;
  height: fit-content;
}

.docs-content {
  min-height: 100%;
}
</style>

<style>
/* unscoped — targets v-html markdown output, which Vue's
   scoped attribute never reaches */

.docs-markdown h1,
.docs-markdown h2,
.docs-markdown h3 {
  font-weight: 700;
  margin: 1.2em 0 0.6em;
}

.docs-markdown h1 {
  font-size: 1.6rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  padding-bottom: 0.3em;
}

.docs-markdown h2 {
  font-size: 1.3rem;
}

.docs-markdown p {
  line-height: 1.6;
  margin: 0.6em 0;
}

.docs-markdown a {
  color: var(--q-primary, #1976d2);
  text-decoration: none;
}

.docs-markdown a:hover {
  text-decoration: underline;
}

.docs-markdown code {
  background: rgba(0, 0, 0, 0.06);
  border-radius: 4px;
  padding: 0.15em 0.4em;
  font-size: 0.9em;
}

.docs-markdown pre {
  background: rgba(0, 0, 0, 0.06);
  border-radius: 8px;
  padding: 1em;
  overflow-x: auto;
}

.docs-markdown pre code {
  background: none;
  padding: 0;
}

.docs-markdown table {
  border-collapse: collapse;
  width: 100%;
  margin: 1em 0;
}

.docs-markdown th,
.docs-markdown td {
  border: 1px solid rgba(0, 0, 0, 0.1);
  padding: 0.5em 0.75em;
  text-align: left;
}

.docs-markdown blockquote {
  border-left: 4px solid var(--q-primary, #1976d2);
  margin: 1em 0;
  padding: 0.2em 1em;
  color: rgba(0, 0, 0, 0.7);
}

body.body--dark .docs-markdown code,
body.body--dark .docs-markdown pre {
  background: rgba(255, 255, 255, 0.1);
}

body.body--dark .docs-markdown blockquote {
  color: rgba(255, 255, 255, 0.7);
}
</style>
