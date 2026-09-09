<template>
  <s-card class="user-account-modal">
    <q-bar :class="$q.dark.isActive ? 'bg-dark text-white' : ' bg-primary text-white'">
      <div class="text-h6">{{ barTitle }}</div>

      <q-space />

      <s-btn flat dense icon="close" v-close-popup />
    </q-bar>

    <!-- =================================================
         OTP CONFIRMATION DIALOG (email/mobile changes)
    ================================================== -->
    <q-dialog v-model="contactOtpDialog" persistent>
      <s-card square flat bordered class="text-center contact-otp-card">
        <q-bar :class="$q.dark.isActive ? 'bg-dark text-white' : 'bg-primary text-white'">
          <div class="ellipsis">{{ contactOtpIdentifier }}</div>
          <q-space />
          <s-btn dense flat icon="close" :disable="confirmingContactOtp" v-close-popup @click="contactOtpDialog = false">
            <q-tooltip>{{ tdc('Close') }}</q-tooltip>
          </s-btn>
        </q-bar>

        <q-card-section>
          <div class="text-subtitle2 q-mb-md">
            {{ tdc('Enter the code we sent to') }} {{ contactOtpIdentifier }}
          </div>

          <OtpInput v-model="contactOtp" :length="6" @complete="confirmContactOtp" />

          <div v-if="contactOtpError" class="text-caption text-negative q-mt-sm">
            {{ contactOtpError }}
          </div>

          <s-btn
            size="md"
            color="positive"
            dense
            class="full-width q-mt-lg"
            :disable="contactOtp.length !== 6"
            :loading="confirmingContactOtp"
            :label="tdc('Confirm')"
            @click="confirmContactOtp(contactOtp)"
          />

          <s-btn
            flat
            size="sm"
            color="grey-7"
            dense
            class="full-width q-mt-sm"
            :disable="confirmingContactOtp"
            :loading="requestingContactOtp"
            :label="tdc('Resend code')"
            @click="requestContactOtp(contactOtpChannel, contactOtpIdentifier)"
          />
        </q-card-section>
      </s-card>
    </q-dialog>

    <q-card-section class="q-pa-md">
      <div class="row justify-center">
        <div class="col-12 col-md-8 col-lg-6">
          <q-tabs v-model="tab" dense align="justify">
            <q-tab name="profile" icon="person" :label="tdc('Profile')" />
            <q-tab name="security" icon="lock" :label="tdc('Security')" />
            <q-tab name="appearance" icon="palette" :label="tdc('Appearance')" />
          </q-tabs>

          <q-separator />

          <q-tab-panels v-model="tab" animated class="account-tab-panels">
            <!-- PROFILE -->
            <q-tab-panel name="profile" class="q-pa-none q-pt-md">
              <div class="row justify-center q-mb-md">
                <div class="column items-center">
                  <q-avatar size="96px" class="cursor-pointer avatar-picker" @click="triggerAvatarPick">
                    <img :src="avatarPreview" alt="Avatar" />
                    <div class="avatar-overlay">
                      <q-icon name="photo_camera" size="20px" />
                    </div>
                  </q-avatar>

                  <input
                    ref="avatarInput"
                    type="file"
                    accept="image/*"
                    class="hidden-input"
                    @change="onAvatarSelected"
                  />

                  <div class="text-caption text-grey-7 q-mt-xs">
                    {{ tdc('Click the photo to change it') }}
                  </div>
                </div>
              </div>

              <s-card flat bordered class="q-mb-md">
                <q-card-section class="text-subtitle1">
                  {{ tdc('Account') }}
                </q-card-section>

                <q-card-section class="q-gutter-md">
                  <s-input
                    v-model="profileForm.username"
                    :label="tdc('Username')"
                    dense
                    outlined
                  />

                  <s-input
                    v-model="profileForm.email"
                    type="email"
                    :label="tdc('Email')"
                    dense
                    outlined
                  >
                    <template #append>
                      <s-btn
                        v-if="emailChanged"
                        dense
                        flat
                        round
                        icon="send"
                        color="primary"
                        :loading="requestingContactOtp && contactOtpChannel === 'email'"
                        @click="requestContactOtp('email', profileForm.email)"
                      >
                        <q-tooltip>{{ tdc('Verify and update email') }}</q-tooltip>
                      </s-btn>
                    </template>
                  </s-input>

                  <div v-if="emailChanged" class="text-caption text-grey-7">
                    {{ tdc('Confirming a new email requires a verification code') }}
                  </div>
                </q-card-section>
              </s-card>

              <s-card flat bordered class="q-mb-md">
                <q-card-section class="text-subtitle1">
                  {{ tdc('Personal data') }}
                </q-card-section>

                <q-card-section class="q-gutter-md">
                  
                    
                      <s-input
                        v-model="personForm.name"
                        :label="tdc('First name')"
                        dense
                        outlined
                      />
                   

                    
                      <s-input
                        v-model="personForm.surname"
                        :label="tdc('Last name')"
                        dense
                        outlined
                      />
                    


                  <s-select
                    v-model="personForm.gender"
                    :options="genderOptions"
                    emit-value
                    map-options
                    :label="tdc('Gender')"
                    dense
                    outlined
                  />

                  <s-input
                    v-model="personForm.date_of_birth"
                    type="date"
                    :label="tdc('Date of birth')"
                    dense
                    outlined
                  />

                  <s-input
                    v-model="personForm.nationality"
                    :label="tdc('Nationality')"
                    dense
                    outlined
                  />
                </q-card-section>
              </s-card>

              <div class="row justify-end q-mt-md">
                <s-btn
                  color="primary"
                  icon="save"
                  :label="tdc('Save changes')"
                  :loading="savingProfile"
                  @click="saveProfile"
                />
              </div>
            </q-tab-panel>

            <!-- SECURITY -->
            <q-tab-panel name="security" class="q-pa-none q-pt-md">
              <s-card flat bordered class="q-mb-md">
                <q-card-section class="text-subtitle1">
                  {{ tdc('Change password') }}
                </q-card-section>

                <q-card-section class="q-gutter-md">
                  <s-input
                    v-model="passwordForm.current"
                    type="password"
                    :label="tdc('Current password')"
                    dense
                    outlined
                  />

                  <s-input
                    v-model="passwordForm.next"
                    type="password"
                    :label="tdc('New password')"
                    :hint="tdc('At least 8 characters')"
                    dense
                    outlined
                  />

                  <s-input
                    v-model="passwordForm.confirm"
                    type="password"
                    :label="tdc('Confirm new password')"
                    dense
                    outlined
                  />

                  <div v-if="passwordMismatch" class="text-caption text-negative">
                    {{ tdc('Passwords do not match') }}
                  </div>

                  <div v-if="!User.data?.email" class="text-caption text-grey-7">
                    {{ tdc('An email is required on your account to change the password') }}
                  </div>
                </q-card-section>

                <q-card-actions align="right">
                  <s-btn
                    color="primary"
                    icon="lock_reset"
                    :label="tdc('Update password')"
                    :loading="savingPassword"
                    :disable="!canSubmitPassword"
                    @click="submitPasswordChange"
                  />
                </q-card-actions>
              </s-card>

              <s-card flat bordered>
                <q-card-section class="text-subtitle1">
                  {{ tdc('Change phone number') }}
                </q-card-section>

                <q-card-section class="q-gutter-md">
                  <s-select
                    v-model="phoneForm.dial"
                    :options="countryOptions"
                    emit-value
                    map-options
                    :label="tdc('Country')"
                    dense
                    outlined
                  />

                  <s-input
                    v-model="phoneForm.national"
                    :label="tdc('Phone number')"
                    dense
                    outlined
                  />

                  <div v-if="phoneForm.national && !isPhoneValid" class="text-caption text-negative">
                    {{ tdc('Invalid phone number') }}
                  </div>

                  <div class="text-caption text-grey-7">
                    {{ tdc('Full number') }}: {{ fullPhoneNumber || '—' }}
                  </div>
                </q-card-section>

                <q-card-actions align="right">
                  <s-btn
                    color="primary"
                    icon="phone_iphone"
                    :label="tdc('Send verification code')"
                    :loading="requestingContactOtp && contactOtpChannel === 'mobile'"
                    :disable="!isPhoneValid"
                    @click="submitPhoneChange"
                  />
                </q-card-actions>
              </s-card>
            </q-tab-panel>

            <!-- APPEARANCE (header/footer - User > Entity > EntityType > default) -->
            <q-tab-panel name="appearance" class="q-pa-none q-pt-md">
              <div
                v-for="area in ['header', 'footer']" :key="area"
                class="q-mb-lg"
              >
                <div class="text-subtitle2 q-mb-sm">
                  {{ area === 'header' ? tdc('Header') : tdc('Footer') }}
                </div>

                <s-select
                  v-model="interfaceForm[area].background_type"
                  :options="backgroundTypeOptions"
                  emit-value map-options
                  :label="tdc('Background type')"
                  :hint="tdc('Leave empty to inherit from the entity')"
                  clearable
                  class="q-mb-sm"
                />

                <s-input
                  v-if="interfaceForm[area].background_type === 'color'"
                  v-model="interfaceForm[area].background_color"
                  type="color"
                  :label="tdc('Background color')"
                  class="q-mb-sm"
                />

                <s-input
                  v-if="interfaceForm[area].background_type === 'gradient'"
                  v-model="interfaceForm[area].background_gradient"
                  :label="tdc('CSS gradient')"
                  :hint="'linear-gradient(135deg, #1976d2, #26a69a)'"
                  class="q-mb-sm"
                />

                <q-file
                  v-if="interfaceForm[area].background_type === 'image'"
                  v-model="interfaceForm[area].background_image"
                  accept=".png,.jpg,.jpeg,.webp"
                  :label="tdc('Background image')"
                  dense outlined
                  class="q-mb-sm"
                />

                <div v-if="['gradient', 'image'].includes(interfaceForm[area].background_type)" class="q-mb-sm">
                  <div class="text-caption text-grey-7">{{ tdc('Dark overlay') }}</div>
                  <q-slider
                    v-model="interfaceForm[area].background_overlay"
                    :min="0" :max="1" :step="0.05" label
                  />
                </div>

                <s-input
                  v-model="interfaceForm[area].text_color"
                  type="color"
                  :label="tdc('Text color')"
                  class="q-mb-sm"
                />

                <div class="row q-gutter-sm">
                  <s-btn
                    color="primary" size="sm"
                    :label="tdc('Save')"
                    :loading="savingInterface[area]"
                    @click="saveInterface(area)"
                  />
                  <s-btn
                    flat size="sm" color="grey-7"
                    :label="tdc('Reset to entity default')"
                    :loading="savingInterface[area]"
                    @click="resetInterfaceArea(area)"
                  />
                </div>

                <q-separator v-if="area === 'header'" class="q-mt-lg" />
              </div>
            </q-tab-panel>
          </q-tab-panels>
        </div>
      </div>
    </q-card-section>
  </s-card>
</template>

<script>
import { defineComponent } from "vue"
import { HTTPAuth, url } from "../services/api"
import { useUserStore } from "../stores/UserStore"
import { tdc } from "../services/translation"
import { COUNTRIES, countryLabel } from "../utils/countries"
import { toE164, isValidE164, splitE164 } from "../utils/phone"

import OtpInput from "./OtpInput.vue"

function emptyInterfaceForm() {
  return {
    background_type: null,
    background_color: "#1976D2",
    background_gradient: "",
    background_overlay: 0,
    text_color: "#FFFFFF",
    background_image: null
  }
}

export default defineComponent({
  name: "UserAccountModal",

  components: {
    OtpInput
  },

  setup() {
    const User = useUserStore()
    return { User, tdc }
  },

  data() {
    return {
      tab: "profile",

      loadingProfile: false,
      savingProfile: false,
      savingPassword: false,

      avatarPreview: "",
      avatarFile: null,

      personId: null,
      personExists: false,

      profileForm: {
        username: "",
        email: ""
      },

      personForm: {
        name: "",
        surname: "",
        gender: null,
        date_of_birth: null,
        nationality: ""
      },

      passwordForm: {
        current: "",
        next: "",
        confirm: ""
      },

      phoneForm: {
        dial: "258",
        national: ""
      },

      contactOtpDialog: false,
      contactOtpChannel: "",
      contactOtpIdentifier: "",
      contactOtp: "",
      contactOtpError: "",
      requestingContactOtp: false,
      confirmingContactOtp: false,

      // Personalização de header/footer - só o que ESTE utilizador
      // personalizou (background_type null = a herdar de Entity/
      // EntityType, ver InterfaceConfigService no backend).
      interfaceForm: {
        header: emptyInterfaceForm(),
        footer: emptyInterfaceForm()
      },
      savingInterface: { header: false, footer: false }
    }
  },

  computed: {
    barTitle() {
      if (this.tab === "security") return "🔒 " + this.tdc("Security")
      if (this.tab === "appearance") return "🎨 " + this.tdc("Appearance")
      return "👤 " + this.tdc("Profile")
    },

    backgroundTypeOptions() {
      return [
        { label: this.tdc("Color"), value: "color" },
        { label: this.tdc("Gradient"), value: "gradient" },
        { label: this.tdc("Image"), value: "image" },
        { label: this.tdc("Transparent"), value: "transparent" }
      ]
    },

    countryOptions() {
      return COUNTRIES.map(c => ({
        label: countryLabel(c),
        value: c.dial
      }))
    },

    genderOptions() {
      return [
        { label: this.tdc("Masculine"), value: "M" },
        { label: this.tdc("Feminine"), value: "F" },
        { label: this.tdc("Others"), value: "O" }
      ]
    },

    fullPhoneNumber() {
      return toE164(this.phoneForm.dial, this.phoneForm.national)
    },

    isPhoneValid() {
      return isValidE164(this.fullPhoneNumber)
    },

    passwordMismatch() {
      return !!this.passwordForm.confirm && this.passwordForm.next !== this.passwordForm.confirm
    },

    canSubmitPassword() {
      return !!(
        this.User.data?.email &&
        this.passwordForm.current &&
        this.passwordForm.next?.length >= 8 &&
        this.passwordForm.next === this.passwordForm.confirm
      )
    },

    emailChanged() {
      return !!this.profileForm.email && this.profileForm.email !== (this.User.data?.email || "")
    }
  },

  mounted() {
    this.loadProfile()
    this.initInterfaceForm("header")
    this.initInterfaceForm("footer")
  },

  methods: {
    initInterfaceForm(area) {
      const override = this.User.data?.interface_override?.[area]

      if (!override) {
        this.interfaceForm[area] = emptyInterfaceForm()
        return
      }

      this.interfaceForm[area] = {
        background_type: override.background?.type || null,
        background_color: override.background?.type === "color" ? override.background.value : "#1976D2",
        background_gradient: override.background?.type === "gradient" ? override.background.value : "",
        background_overlay: override.overlay ?? 0,
        text_color: override.text_color || "#FFFFFF",
        background_image: null
      }
    },

    async saveInterface(area) {
      this.savingInterface[area] = true

      try {
        const form = this.interfaceForm[area]

        const payload = {
          background_type: form.background_type,
          background_overlay: form.background_overlay,
          text_color: form.text_color
        }

        if (form.background_type === "color") payload.background_color = form.background_color
        if (form.background_type === "gradient") payload.background_gradient = form.background_gradient
        if (form.background_type === "image" && form.background_image) {
          payload.background_image = form.background_image
        }

        await this.User.updateInterface(area, payload)
        this.initInterfaceForm(area)
      } finally {
        this.savingInterface[area] = false
      }
    },

    async resetInterfaceArea(area) {
      this.savingInterface[area] = true

      try {
        await this.User.resetInterface(area)
        this.initInterfaceForm(area)
      } finally {
        this.savingInterface[area] = false
      }
    },

    triggerAvatarPick() {
      this.$refs.avatarInput?.click()
    },

    onAvatarSelected(e) {
      const file = e.target.files?.[0]
      if (!file) return

      this.avatarFile = file
      this.avatarPreview = URL.createObjectURL(file)
      this.uploadAvatar()
    },

    async uploadAvatar() {
      if (!this.avatarFile) return

      const fd = new FormData()
      fd.append("profile", this.avatarFile)

      await this.User.updateProfile(fd)
    },

    async loadProfile() {
      if (!this.User.data?.id) return

      this.loadingProfile = true

      try {
        this.profileForm.username = this.User.data?.username || ""
        this.profileForm.email = this.User.data?.email || ""
        this.avatarPreview = this.User.profile

        const { dial, national } = splitE164(this.User.data?.mobile)
        this.phoneForm.dial = dial
        this.phoneForm.national = national

        const { data } = await HTTPAuth.get(
          url({
            type: "u",
            url: `django_resaas/users/${this.User.data.id}/userPerson/`
          })
        )

        if (data?.id) {
          this.personId = data.id
          this.personExists = true
          this.personForm.name = data.name || ""
          this.personForm.surname = data.surname || ""
          this.personForm.gender = data.gender || null
          this.personForm.date_of_birth = data.date_of_birth || null
          this.personForm.nationality = data.nationality || ""
        }
      } catch (e) {
        this.personExists = false
      } finally {
        this.loadingProfile = false
      }
    },

    async saveProfile() {
      this.savingProfile = true

      try {
        // email is NEVER part of this save - it can only change through
        // the OTP-confirmed flow below (requestContactOtp/confirmContactOtp),
        // enforced server-side too (UserSerializer makes it read-only).
        await this.User.updateProfile({
          username: this.profileForm.username
        })

        const personPayload = { ...this.personForm }

        if (this.personExists) {
          await HTTPAuth.patch(
            url({ type: "u", url: `django_resaas/persons/${this.personId}/` }),
            personPayload
          )
        } else {
          const { data } = await HTTPAuth.post(
            url({ type: "u", url: "django_resaas/persons/" }),
            { ...personPayload, user: this.User.data.id }
          )

          this.personId = data?.id
          this.personExists = !!data?.id
        }
      } finally {
        this.savingProfile = false
      }
    },

    async submitPasswordChange() {
      if (!this.canSubmitPassword) return

      this.savingPassword = true

      try {
        await this.User.change_password_email(
          this.User.data.email,
          this.passwordForm.current,
          this.passwordForm.next
        )

        this.passwordForm.current = ""
        this.passwordForm.next = ""
        this.passwordForm.confirm = ""
      } finally {
        this.savingPassword = false
      }
    },

    async submitPhoneChange() {
      if (!this.isPhoneValid) return
      await this.requestContactOtp("mobile", this.fullPhoneNumber)
    },

    // =====================================================
    // EMAIL / MOBILE CHANGE — always OTP-confirmed, the new
    // value only takes effect after confirmContactOtp() succeeds.
    // =====================================================

    async requestContactOtp(channel, identifier) {
      if (!identifier) return

      this.contactOtpChannel = channel
      this.contactOtpIdentifier = identifier
      this.contactOtp = ""
      this.contactOtpError = ""
      this.requestingContactOtp = true

      try {
        await HTTPAuth.post(
          url({ type: "u", url: "profile/contact/otp/request/" }),
          { channel, identifier }
        )

        this.contactOtpDialog = true
      } finally {
        this.requestingContactOtp = false
      }
    },

    async confirmContactOtp(otp) {
      if (!otp || otp.length !== 6) return

      this.confirmingContactOtp = true
      this.contactOtpError = ""

      try {
        const { data } = await HTTPAuth.post(
          url({ type: "u", url: "profile/contact/otp/confirm/" }),
          {
            channel: this.contactOtpChannel,
            identifier: this.contactOtpIdentifier,
            otp
          }
        )

        this.User.data = { ...this.User.data, ...data }

        if (this.contactOtpChannel === "email") {
          this.profileForm.email = data.email || ""
        }

        this.contactOtpDialog = false
      } catch (e) {
        this.contactOtpError = this.tdc("Invalid or expired code")
      } finally {
        this.confirmingContactOtp = false
      }
    }
  },

  watch: {
    "User.Settings" (val) {
      if (val) this.loadProfile()
    }
  }
})
</script>

<style scoped>
.user-account-modal {
  max-height: 90vh;
  overflow: hidden;
}

.account-tab-panels {
  max-height: calc(90vh - 140px);
  overflow-y: auto;
  overflow-x: hidden;
}

.hidden-input {
  display: none;
}

.avatar-picker {
  position: relative;
  overflow: hidden;
}

.avatar-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.35);
  color: #fff;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.avatar-picker:hover .avatar-overlay {
  opacity: 1;
}

.contact-otp-card {
  width: min(360px, 92vw);
}
</style>
