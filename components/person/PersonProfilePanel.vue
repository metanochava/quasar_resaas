<template>
  <div class="personal-panel">
    <div class="row q-col-gutter-md">

      <!-- ============ IDENTITY CARD ============ -->
      <div class="col-12 col-md-4">
        <s-card flat bordered class="identity-card">
          <div class="identity-cover" />

          <div class="identity-body column items-center text-center">
            <div class="identity-photo" :style="radiusStyle">
              <img v-if="photoUrl" :src="photoUrl" :alt="fullName">
              <span v-else class="identity-initials">{{ initials }}</span>
            </div>

            <div class="text-h6 text-weight-bold q-mt-md">{{ fullName || '—' }}</div>

            <div v-if="person?.preferred_name" class="text-caption text-grey-7">
              {{ tdc('Known as') }} “{{ person.preferred_name }}”
            </div>

            <div class="row justify-center q-gutter-xs q-mt-sm">
              <q-chip v-if="genderLabel" dense square :icon="genderIcon" class="soft-chip">{{ genderLabel }}</q-chip>
              <q-chip v-if="person?.age != null" dense square icon="cake" class="soft-chip">
                {{ person.age }} {{ tdc('years') }}
              </q-chip>
              <q-chip v-if="maritalLabel" dense square icon="favorite_border" class="soft-chip">{{ maritalLabel }}</q-chip>
              <q-chip v-if="bloodTypeLabel" dense square icon="water_drop" class="soft-chip">{{ bloodTypeLabel }}</q-chip>
            </div>

            <q-separator class="full-width q-my-md" />

            <div class="quick-contacts column full-width q-gutter-y-xs">
              <a v-if="person?.email" :href="`mailto:${person.email}`" class="quick-link">
                <q-icon name="mail_outline" size="18px" />
                <span class="ellipsis">{{ person.email }}</span>
              </a>
              <a v-if="person?.phone" :href="`tel:${person.phone}`" class="quick-link">
                <q-icon name="call" size="18px" />
                <span>{{ person.phone }}</span>
              </a>
              <div v-if="!person?.email && !person?.phone" class="text-caption text-grey-6">
                {{ tdc('No contact details on file.') }}
              </div>
            </div>
          </div>
        </s-card>
      </div>

      <!-- ============ DETAIL SECTIONS ============ -->
      <div class="col-12 col-md-8">
        <div class="column q-gutter-y-md">

          <!-- Identity -->
          <s-card flat bordered>
            <q-card-section class="section-title">
              <q-icon name="badge" size="20px" /> {{ tdc('Identity') }}
            </q-card-section>
            <q-separator />
            <q-card-section>
              <div class="row q-col-gutter-lg">
                <div v-for="f in identityFields" :key="f.label" class="col-12 col-sm-6">
                  <div class="field-label">{{ f.label }}</div>
                  <div class="field-value" :class="{ 'is-empty': !f.value }">{{ f.value || '—' }}</div>
                </div>
              </div>
            </q-card-section>
          </s-card>

          <!-- Contact -->
          <s-card flat bordered>
            <q-card-section class="section-title">
              <q-icon name="contact_phone" size="20px" /> {{ tdc('Contact information') }}
            </q-card-section>
            <q-separator />
            <q-card-section>
              <div class="row q-col-gutter-lg">
                <div v-for="f in contactFields" :key="f.label" class="col-12 col-sm-6">
                  <div class="field-label">{{ f.label }}</div>
                  <a v-if="f.value && f.href" :href="f.href" class="field-value field-link">{{ f.value }}</a>
                  <div v-else class="field-value" :class="{ 'is-empty': !f.value }">{{ f.value || '—' }}</div>
                </div>
              </div>
            </q-card-section>
          </s-card>

          <!-- Address -->
          <s-card flat bordered>
            <q-card-section class="section-title">
              <q-icon name="place" size="20px" /> {{ tdc('Address') }}
            </q-card-section>
            <q-separator />
            <q-card-section v-if="addressLines.length || mapUrl">
              <div v-for="(line, i) in addressLines" :key="i" :class="i === 0 ? 'field-value' : 'text-grey-7'">
                {{ line }}
              </div>
              <AddressMiniMap class="q-mt-md" :address="person.address" :label="fullName" />
              <a v-if="mapUrl" :href="mapUrl" target="_blank" rel="noopener" class="field-link inline-flex items-center q-mt-sm">
                <q-icon name="map" size="18px" class="q-mr-xs" /> {{ tdc('View on map') }}
              </a>
            </q-card-section>
            <q-card-section v-else class="empty-state">
              <q-icon name="location_off" size="28px" />
              <div>{{ tdc('No address on file.') }}</div>
            </q-card-section>
          </s-card>

          <!-- Documents -->
          <s-card flat bordered>
            <q-card-section class="section-title">
              <q-icon name="description" size="20px" /> {{ tdc('Documents') }}
              <q-badge v-if="documents.length" rounded color="primary" class="q-ml-sm">{{ documents.length }}</q-badge>
            </q-card-section>
            <q-separator />

            <q-card-section v-if="loadingRelated" class="flex flex-center">
              <q-spinner size="28px" color="primary" />
            </q-card-section>

            <q-list v-else-if="documents.length" separator>
              <q-item v-for="doc in documents" :key="doc.id" class="doc-item">
                <q-item-section avatar>
                  <q-avatar rounded color="primary" text-color="white" icon="badge" size="42px" />
                </q-item-section>

                <q-item-section>
                  <q-item-label class="text-weight-medium">
                    {{ doc.tipo_data?.name || tdc('Document') }}
                  </q-item-label>
                  <q-item-label caption>{{ tdc('Number') }}: {{ doc.numero }}</q-item-label>
                  <q-item-label caption>
                    <span v-if="doc.data_emissao">{{ tdc('Issued') }} {{ formatDate(doc.data_emissao) }}</span>
                    <span v-if="doc.data_emissao && doc.data_validade"> · </span>
                    <span v-if="doc.data_validade">{{ tdc('Expires') }} {{ formatDate(doc.data_validade) }}</span>
                  </q-item-label>
                </q-item-section>

                <q-item-section side>
                  <div class="row items-center q-gutter-sm">
                    <q-chip v-if="doc.data_validade" dense square :color="expiry(doc).color" text-color="white" :label="expiry(doc).label" />
                    <s-btn
                      v-if="doc.arquivo?.url"
                      flat round dense color="primary" icon="download"
                      :href="doc.arquivo.url" target="_blank"
                    >
                      <s-tooltip>{{ tdc('Download') }}</s-tooltip>
                    </s-btn>
                  </div>
                </q-item-section>
              </q-item>
            </q-list>

            <q-card-section v-else class="empty-state">
              <q-icon name="folder_open" size="28px" />
              <div>{{ tdc('No documents on file.') }}</div>
            </q-card-section>
          </s-card>

          <!-- Emergency contacts -->
          <s-card flat bordered>
            <q-card-section class="section-title">
              <q-icon name="emergency" size="20px" /> {{ tdc('Emergency contacts') }}
              <q-badge v-if="contacts.length" rounded color="primary" class="q-ml-sm">{{ contacts.length }}</q-badge>
            </q-card-section>
            <q-separator />

            <q-card-section v-if="loadingRelated" class="flex flex-center">
              <q-spinner size="28px" color="primary" />
            </q-card-section>

            <q-card-section v-else-if="contacts.length">
              <div class="row q-col-gutter-md">
                <div v-for="c in contacts" :key="c.id" class="col-12 col-sm-6">
                  <div class="contact-card">
                    <div class="row items-center no-wrap">
                      <q-avatar size="40px" color="primary" text-color="white">{{ initialsOf(c.name) }}</q-avatar>
                      <div class="col q-ml-md">
                        <div class="text-weight-medium ellipsis">{{ c.name }}</div>
                        <div v-if="c.relationship" class="text-caption text-grey-7">{{ c.relationship }}</div>
                      </div>
                    </div>

                    <div class="row q-gutter-xs q-mt-sm">
                      <q-chip v-if="c.is_primary" dense square color="primary" text-color="white" icon="star" :label="tdc('Primary')" />
                      <q-chip v-if="c.is_emergency" dense square color="negative" text-color="white" icon="emergency" :label="tdc('Emergency')" />
                    </div>

                    <div class="column q-gutter-y-xs q-mt-sm">
                      <a v-if="c.phone" :href="`tel:${c.phone}`" class="quick-link"><q-icon name="call" size="16px" /> {{ c.phone }}</a>
                      <a v-if="c.alternative_phone" :href="`tel:${c.alternative_phone}`" class="quick-link"><q-icon name="phone_forwarded" size="16px" /> {{ c.alternative_phone }}</a>
                      <a v-if="c.email" :href="`mailto:${c.email}`" class="quick-link"><q-icon name="mail_outline" size="16px" /> <span class="ellipsis">{{ c.email }}</span></a>
                    </div>

                    <div v-if="c.notes" class="text-caption text-grey-7 q-mt-sm">{{ c.notes }}</div>
                  </div>
                </div>
              </div>
            </q-card-section>

            <q-card-section v-else class="empty-state">
              <q-icon name="contact_emergency" size="28px" />
              <div>{{ tdc('No emergency contacts on file.') }}</div>
            </q-card-section>
          </s-card>

        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { usePersonContactStore } from '../../stores/PersonContactStore'
import { useDocumentStore } from '../../stores/DocumentStore'
import { useUserStore } from '../../stores/UserStore'
import { tdc } from '../../services/translation'
import AddressMiniMap from '../address/AddressMiniMap.vue'
import { displayValue, rawValue } from '../../utils/display'

// Read-only "Personal" tab of view_employee. Everything shown comes from
// what the backend really returns for this Person (PersonSerializer via
// Employee.person_data) plus its Documents/PersonContacts, loaded through
// the same generic BaseStore list filters the edit page uses
// (?person= / ?object_id=). Empty values render as a muted dash and empty
// sections as an explicit empty state, never as a blank hole.
const props = defineProps({
  person: { type: Object, default: null }
})

const PersonContact = usePersonContactStore()
const Document = useDocumentStore()
const User = useUserStore()

const documents = ref([])
const contacts = ref([])
const loadingRelated = ref(false)

const radiusStyle = computed(() => ({
  borderRadius: User.ps?.layout?.rounded ? '24px' : '10px'
}))

const fullName = computed(() =>
  props.person?.full_name || [props.person?.name, props.person?.surname].filter(Boolean).join(' ')
)

const photoUrl = computed(() => props.person?.photo?.url || null)

function initialsOf(text) {
  return String(text || '')
    .split(/\s+/).filter(Boolean).slice(0, 2)
    .map(w => w[0].toUpperCase()).join('') || '?'
}
const initials = computed(() => initialsOf(fullName.value))

// ---------- choices (raw DB value -> canonical English -> tdc) ----------
const GENDERS = { M: 'Masculine', F: 'Feminine', O: 'Others' }
const MARITAL = { single: 'Single', married: 'Married', divorced: 'Divorced', widowed: 'Widowed', other: 'Other' }
const GENDER_ICONS = { M: 'male', F: 'female', O: 'transgender' }

// Choice fields arrive as {id, value, label}; the label is already the
// canonical English text, so it only goes through tdc(). A bare raw code
// (legacy/plain string) is mapped through the tables above first.
const genderLabel = computed(() => {
  const g = props.person?.gender
  const text = typeof g === 'object' ? displayValue(g) : (GENDERS[g] || g)
  return text ? tdc(text) : ''
})
const bloodTypeLabel = computed(() => displayValue(props.person?.blood_type))
const genderIcon = computed(() => GENDER_ICONS[rawValue(props.person?.gender)] || 'person')
const maritalLabel = computed(() => {
  const m = props.person?.marital_status
  const text = typeof m === 'object' ? displayValue(m) : (MARITAL[m] || m)
  return text ? tdc(text) : ''
})

// ---------- dates ----------
function parseDate(value) {
  if (!value) return null
  const [y, m, d] = String(value).slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d)
}

function formatDate(value) {
  const date = parseDate(value)
  return date
    ? date.toLocaleDateString(undefined, { day: '2-digit', month: 'long', year: 'numeric' })
    : ''
}

function expiry(doc) {
  const date = parseDate(doc.data_validade)
  if (!date) return { color: 'grey-6', label: tdc('No expiry') }
  const days = Math.ceil((date - new Date().setHours(0, 0, 0, 0)) / 86400000)
  if (days < 0) return { color: 'negative', label: tdc('Expired') }
  if (days <= 60) return { color: 'warning', label: tdc('Expires soon') }
  return { color: 'positive', label: tdc('Valid') }
}

// ---------- field groups ----------
const identityFields = computed(() => {
  const p = props.person || {}
  return [
    { label: tdc('Full name'), value: fullName.value },
    { label: tdc('Preferred name'), value: displayValue(p.preferred_name) },
    { label: tdc('Date of birth'), value: formatDate(p.date_of_birth) },
    { label: tdc('Gender'), value: genderLabel.value },
    { label: tdc('Marital status'), value: maritalLabel.value },
    { label: tdc('Nationality'), value: displayValue(p.nationality) },
    { label: tdc('Country of birth'), value: displayValue(p.country_of_birth) },
    { label: tdc('Place of birth'), value: displayValue(p.place_of_birth) },
    { label: tdc('Occupation'), value: displayValue(p.occupation) },
    { label: tdc('Blood type'), value: bloodTypeLabel.value }
  ]
})

const contactFields = computed(() => {
  const p = props.person || {}
  return [
    { label: tdc('Email'), value: p.email, href: p.email && `mailto:${p.email}` },
    { label: tdc('Secondary email'), value: p.secondary_email, href: p.secondary_email && `mailto:${p.secondary_email}` },
    { label: tdc('Phone'), value: p.phone, href: p.phone && `tel:${p.phone}` },
    { label: tdc('Alternative phone'), value: p.alternative_phone, href: p.alternative_phone && `tel:${p.alternative_phone}` }
  ]
})

const addressLines = computed(() => {
  const a = props.person?.address
  if (!a) return []
  const street = [a.route, a.street_number].filter(Boolean).join(' ')
  const lines = [
    a.formatted_address || a.full_address || street,
    a.complement,
    [a.postal_code, a.locality || a.administrative_area_level_2].filter(Boolean).join(' '),
    a.country
  ].filter(Boolean)
  return [...new Set(lines)]
})

const mapUrl = computed(() => {
  const a = props.person?.address
  return a?.latitude && a?.longitude
    ? `https://www.google.com/maps?q=${a.latitude},${a.longitude}`
    : ''
})

// ---------- related records ----------
async function loadRelated(personId) {
  documents.value = []
  contacts.value = []
  if (!personId) return

  loadingRelated.value = true
  try {
    // A role without list_personcontact / list_document just sees the empty
    // state for that section - a denied list must never break the profile.
    await Promise.allSettled([
      PersonContact.loadData({ person: personId, page: 1, page_size: 100 }).then(() => {
        contacts.value = [...(PersonContact.rows || [])]
      }),
      Document.loadData({ object_id: personId, page: 1, page_size: 100 }).then(() => {
        documents.value = [...(Document.rows || [])]
      })
    ])
  } finally {
    loadingRelated.value = false
  }
}

watch(() => props.person?.id, loadRelated, { immediate: true })
</script>

<style scoped>
.identity-card { overflow: hidden; }
.identity-cover {
  height: 84px;
  background: linear-gradient(135deg, var(--q-primary), color-mix(in srgb, var(--q-primary) 55%, #000));
}
.identity-body { padding: 0 20px 20px; }
.identity-photo {
  width: 132px;
  height: 132px;
  margin-top: -66px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--q-primary) 14%, transparent);
  border: 4px solid #fff;
  box-shadow: 0 4px 14px rgba(0, 0, 0, .18);
}
.body--dark .identity-photo { border-color: #1d1d1d; }
.identity-photo img { width: 100%; height: 100%; object-fit: cover; }
.identity-initials { font-size: 44px; font-weight: 700; color: var(--q-primary); }

.soft-chip { background: color-mix(in srgb, var(--q-primary) 12%, transparent); color: var(--q-primary); }

.quick-link {
  display: flex;
  align-items: center;
  gap: 8px;
  color: inherit;
  text-decoration: none;
  min-width: 0;
}
.quick-link:hover { color: var(--q-primary); }

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 15px;
}
.section-title .q-icon { color: var(--q-primary); }

.field-label {
  font-size: 11px;
  letter-spacing: .06em;
  text-transform: uppercase;
  opacity: .6;
  margin-bottom: 2px;
}
.field-value { font-size: 15px; font-weight: 500; word-break: break-word; }
.field-value.is-empty { opacity: .35; font-weight: 400; }
.field-link { color: var(--q-primary); text-decoration: none; }
.field-link:hover { text-decoration: underline; }

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 24px 16px;
  opacity: .55;
  text-align: center;
}

.contact-card {
  height: 100%;
  padding: 14px;
  border-radius: var(--s-radius, 8px);
  border: 1px solid rgba(128, 128, 128, .25);
}
</style>
