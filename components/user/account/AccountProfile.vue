<script setup>
import { ref, computed, onMounted, watch } from 'vue'

import { HTTPAuth, url } from '../../../services/api'
import { useUserStore } from '../../../stores/UserStore'
import { tdc } from '../../../services/translation'
import { Alert, AlertSuccess } from '../../../boot/alerts'

// Photo + personal data. Everything that already worked is kept: the photo
// upload (UserStore.updateProfile with a FormData), the username PATCH and the
// person PATCH/POST. The e-mail is never part of this save (it only changes
// through the OTP flow in Contacts, and the backend makes it read-only anyway).
const emit = defineEmits(['update:dirty', 'update:name'])

const Session = useUserStore()

const loading = ref(false)
const saving = ref(false)
const uploading = ref(false)
const avatarError = ref('')
const avatarPreview = ref('')
const avatarInput = ref(null)

const personId = ref(null)
const personExists = ref(false)

const EMPTY = () => ({ username: '', name: '', surname: '', gender: null, date_of_birth: null, nationality: '' })
const form = ref(EMPTY())
const initial = ref(EMPTY())

const genderOptions = computed(() => [
  { label: tdc('Masculine'), value: 'M' },
  { label: tdc('Feminine'), value: 'F' },
  { label: tdc('Others'), value: 'O' }
])

const dirty = computed(() => JSON.stringify(form.value) !== JSON.stringify(initial.value))
watch(dirty, value => emit('update:dirty', value), { immediate: true })

// the SAVED full name (not the unsaved edits) - the sidebar and greeting show it
const savedName = computed(() => [initial.value.name, initial.value.surname].filter(Boolean).join(' '))
watch(savedName, value => emit('update:name', value), { immediate: true })

const displayName = computed(() => [form.value.name, form.value.surname].filter(Boolean).join(' ') || Session.data?.username || '')

function snapshot() {
  initial.value = { ...form.value }
}

async function load() {
  if (!Session.data?.id) return

  loading.value = true

  try {
    form.value = { ...EMPTY(), username: Session.data?.username || '' }
    avatarPreview.value = Session.profile

    const { data } = await HTTPAuth.get(url({ type: 'u', url: `django_resaas/users/${Session.data.id}/userPerson/` }))

    if (data?.id) {
      personId.value = data.id
      personExists.value = true
      form.value = {
        ...form.value,
        name: data.name || '',
        surname: data.surname || '',
        gender: typeof data.gender === 'object' ? (data.gender?.value ?? null) : (data.gender || null),
        date_of_birth: data.date_of_birth || null,
        nationality: data.nationality || ''
      }
    }
  } catch {
    personExists.value = false
  } finally {
    snapshot()
    loading.value = false
  }
}

onMounted(load)

function cancel() {
  form.value = { ...initial.value }
}

async function save() {
  if (!dirty.value || saving.value) return

  saving.value = true

  try {
    await Session.updateProfile({ username: form.value.username })

    const payload = {
      name: form.value.name,
      surname: form.value.surname,
      gender: form.value.gender,
      date_of_birth: form.value.date_of_birth,
      nationality: form.value.nationality
    }

    if (personExists.value) {
      await HTTPAuth.patch(url({ type: 'u', url: `django_resaas/persons/${personId.value}/` }), payload)
    } else {
      const { data } = await HTTPAuth.post(url({ type: 'u', url: 'django_resaas/persons/' }), { ...payload, user: Session.data.id })

      personId.value = data?.id
      personExists.value = !!data?.id
    }

    snapshot()
    AlertSuccess(tdc('Changes saved.'))
  } catch (error) {
    Alert(error?.response)
  } finally {
    saving.value = false
  }
}

// ---------- photo ----------
function pickAvatar() {
  avatarInput.value?.click()
}

async function onAvatar(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return

  avatarError.value = ''

  if (!file.type.startsWith('image/')) {
    avatarError.value = tdc('Choose an image file.')
    return
  }

  const previous = avatarPreview.value
  avatarPreview.value = URL.createObjectURL(file)
  uploading.value = true

  try {
    const body = new FormData()
    body.append('profile', file)
    await Session.updateProfile(body)
    avatarPreview.value = Session.profile
    AlertSuccess(tdc('Photo updated.'))
  } catch (error) {
    avatarPreview.value = previous
    avatarError.value = tdc('Could not update the photo.')
    Alert(error?.response)
  } finally {
    uploading.value = false
  }
}
</script>

<template>
  <div data-test="account-profile">
    <div class="q-mb-lg">
      <div class="text-h5 text-weight-bold">{{ tdc('Profile') }}</div>
      <div class="text-body2 text-grey-7 q-mt-xs">{{ tdc('Your photo and personal data.') }}</div>
    </div>

    <!-- photo header -->
    <s-card flat bordered class="q-mb-md">
      <q-card-section class="row items-center no-wrap">
        <div class="avatar-wrap q-mr-lg">
          <q-avatar size="104px" class="avatar">
            <img v-if="avatarPreview" :src="avatarPreview" :alt="displayName">
            <q-icon v-else name="person" size="56px" />
            <q-inner-loading :showing="uploading" data-test="avatar-loading" />
          </q-avatar>

          <button
            type="button"
            class="avatar-edit"
            :aria-label="tdc('Change photo')"
            :disabled="uploading"
            data-test="avatar-button"
            @click="pickAvatar"
          >
            <q-icon name="photo_camera" size="18px" />
          </button>

          <input ref="avatarInput" type="file" accept="image/*" class="hidden-input" data-test="avatar-input" @change="onAvatar">
        </div>

        <div class="col">
          <div class="text-h6 ellipsis">{{ displayName }}</div>
          <div class="text-caption text-grey-7">@{{ form.username }}</div>
          <div class="text-caption text-grey-7 ellipsis">{{ Session.data?.email }}</div>

          <s-btn flat dense no-caps color="primary" icon="photo_camera" :label="tdc('Change photo')" :loading="uploading" class="q-mt-sm" data-test="avatar-change" @click="pickAvatar" />

          <div v-if="avatarError" class="text-caption text-negative q-mt-xs" role="alert" data-test="avatar-error">{{ avatarError }}</div>
        </div>
      </q-card-section>
    </s-card>

    <!-- personal data -->
    <s-card flat bordered>
      <q-card-section class="text-subtitle1">{{ tdc('Personal data') }}</q-card-section>

      <q-card-section v-if="loading" data-test="profile-loading">
        <q-skeleton type="text" width="40%" class="q-mb-md" />
        <q-skeleton type="QInput" class="q-mb-md" />
        <q-skeleton type="QInput" />
      </q-card-section>

      <q-card-section v-else>
        <div class="row q-col-gutter-md">
          <div class="col-12">
            <s-input v-model="form.username" :label="tdc('Username')" dense outlined autocomplete="username" data-test="f-username" />
          </div>
          <div class="col-12 col-sm-6">
            <s-input v-model="form.name" :label="tdc('First name')" dense outlined autocomplete="given-name" data-test="f-name" />
          </div>
          <div class="col-12 col-sm-6">
            <s-input v-model="form.surname" :label="tdc('Last name')" dense outlined autocomplete="family-name" data-test="f-surname" />
          </div>
          <div class="col-12 col-sm-6">
            <s-select v-model="form.gender" :options="genderOptions" emit-value map-options :label="tdc('Gender')" dense outlined />
          </div>
          <div class="col-12 col-sm-6">
            <s-input v-model="form.date_of_birth" type="date" :label="tdc('Date of birth')" dense outlined autocomplete="bday" />
          </div>
          <div class="col-12">
            <s-input v-model="form.nationality" :label="tdc('Nationality')" dense outlined data-test="f-nationality" />
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right" class="q-pa-md">
        <s-btn flat no-caps :label="tdc('Cancel changes')" :disable="!dirty || saving" data-test="profile-cancel" @click="cancel" />
        <s-btn
          unelevated
          no-caps
          color="primary"
          icon="save"
          :label="tdc('Save changes')"
          :loading="saving"
          :disable="!dirty"
          data-test="profile-save"
          @click="save"
        />
      </q-card-actions>
    </s-card>
  </div>
</template>

<style scoped>
.avatar-wrap { position: relative; }
.avatar {
  background: color-mix(in srgb, var(--q-primary) 14%, transparent);
  color: var(--q-primary);
}
.avatar-edit {
  position: absolute;
  right: -2px;
  bottom: -2px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid var(--q-primary);
  background: var(--q-primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform .15s ease;
}
.avatar-edit:hover { transform: scale(1.08); }
.avatar-edit:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; }
.avatar-edit:disabled { opacity: .6; cursor: default; }
.hidden-input { display: none; }
</style>
