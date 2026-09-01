<template>
  <s-card class="theme-studio-engine">
    <q-bar :class="$q.dark.isActive ? 'bg-dark text-white' : ' bg-primary text-white'">
      <div class="text-h6">{{ barTitle }}</div>

      <q-space />

      <template v-if="isAppearanceTab">
        <s-switch
          v-model="darkMode"
          label="Dark"
          @update:model-value="applyDarkMode"
        />

        <s-btn-toggle
          v-model="previewMode"
          dense
          toggle-color="white"
          :options="[
            { label: 'Desktop', value: 'desktop' },
            { label: 'Mobile', value: 'mobile' }
          ]"
        />

        <s-btn flat dense icon="save" label="Save" @click="saveTheme" />
      </template>

      <s-btn flat dense icon="close" v-close-popup />
    </q-bar>

    <q-card-section class="q-pa-md">
      <div class="row q-col-gutter-lg">
        <!-- LEFT -->
        <div :class="isAppearanceTab ? 'col-12 col-md-4' : 'col-12'">
          <q-tabs v-model="tab" dense align="justify">
            <q-tab name="profile" icon="person" :label="tdc('Profile')" />
            <q-tab name="security" icon="lock" :label="tdc('Security')" />
            <q-tab name="cores" icon="palette" label="Colors" />
            <q-tab name="font" icon="font_download" label="Font" />
            <q-tab name="layout" icon="dashboard_customize" label="Layout" />
            <q-tab name="animation" icon="animation" label="Animation" />
          </q-tabs>

          <q-separator />

          <q-tab-panels v-model="tab" animated style="min-height: 800px">
            <!-- PROFILE -->
            <q-tab-panel name="profile" class="q-pa-none">
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

              <s-card bordered class="q-mb-md">
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
                  />
                </q-card-section>
              </s-card>

              <s-card bordered class="q-mb-md">
                <q-card-section class="text-subtitle1">
                  {{ tdc('Personal data') }}
                </q-card-section>

                <q-card-section class="q-gutter-md">
                  <div class="row q-col-gutter-md">
                    <div class="col-12 col-sm-6">
                      <s-input
                        v-model="personForm.name"
                        :label="tdc('First name')"
                        dense
                        outlined
                      />
                    </div>

                    <div class="col-12 col-sm-6">
                      <s-input
                        v-model="personForm.surname"
                        :label="tdc('Last name')"
                        dense
                        outlined
                      />
                    </div>
                  </div>

                  <div class="row q-col-gutter-md">
                    <div class="col-12 col-sm-6">
                      <s-select
                        v-model="personForm.gender"
                        :options="genderOptions"
                        emit-value
                        map-options
                        :label="tdc('Gender')"
                        dense
                        outlined
                      />
                    </div>

                    <div class="col-12 col-sm-6">
                      <s-input
                        v-model="personForm.date_of_birth"
                        type="date"
                        :label="tdc('Date of birth')"
                        dense
                        outlined
                      />
                    </div>
                  </div>

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
            <q-tab-panel name="security" class="q-pa-none">
              <s-card bordered class="q-mb-md">
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

              <s-card bordered>
                <q-card-section class="text-subtitle1">
                  {{ tdc('Change phone number') }}
                </q-card-section>

                <q-card-section class="q-gutter-md">
                  <div class="row q-col-gutter-md">
                    <div class="col-12 col-sm-5">
                      <s-select
                        v-model="phoneForm.dial"
                        :options="countryOptions"
                        emit-value
                        map-options
                        :label="tdc('Country')"
                        dense
                        outlined
                      />
                    </div>

                    <div class="col-12 col-sm-7">
                      <s-input
                        v-model="phoneForm.national"
                        :label="tdc('Phone number')"
                        dense
                        outlined
                      />
                    </div>
                  </div>

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
                    :label="tdc('Update phone number')"
                    :loading="savingPhone"
                    :disable="!isPhoneValid"
                    @click="submitPhoneChange"
                  />
                </q-card-actions>
              </s-card>
            </q-tab-panel>

            <!-- COLORS -->
            <q-tab-panel name="cores">
              <s-input
                v-model="search"
                dense
                outlined
                placeholder="Search color..."
                class="q-mb-md"
                clearable
              >
                <template #prepend>
                  <q-icon name="search" />
                </template>
              </s-input>

              <div class="row q-col-gutter-sm">
                <div
                  v-for="(value, key) in filteredColors"
                  :key="key"
                  class="col-6"
                  v-show="!['id','name', 'created_by', 'updated_by', 'created_at', 'updated_at', 'state', 'deleted_at'].includes(key)"
                >
                  <s-card
                    flat
                    bordered
                    class="cursor-pointer"
                    @click="openColor(key)"
                  >
                    <q-card-section class="q-pa-sm">
                      <div class="text-caption">{{ key }}</div>

                      <div
                        class="q-mt-sm"
                        :style="{
                          background: value,
                          height: '40px',
                          borderRadius: '6px'
                        }"
                      />

                      <div class="text-caption q-mt-xs">
                        {{ value }}
                      </div>
                    </q-card-section>
                  </s-card>
                </div>
              </div>
            </q-tab-panel>

            <!-- FONT -->
            <q-tab-panel name="font">
              <s-card bordered>
                <q-card-section class="text-subtitle1">
                  Typography
                </q-card-section>

                <q-card-section class="q-gutter-md">
                  <s-select
                    v-model="User.Typography.font_family"
                    :options="fontOptions"
                    label="Font Family"
                    dense
                    outlined
                  />

                  <s-input
                    v-model.number="User.Typography.font_size_base"
                    label="Font Base"
                    type="number"
                    dense
                    outlined
                  />
                  <s-input
                    v-model.number="User.Typography.font_size_h1"
                    label="H1"
                    type="number"
                    dense
                    outlined
                  />
                  <s-input
                    v-model.number="User.Typography.font_size_h2"
                    label="H2"
                    type="number"
                    dense
                    outlined
                  />
                  <s-input
                    v-model.number="User.Typography.font_size_h3"
                    label="H3"
                    type="number"
                    dense
                    outlined
                  />
                  <s-input
                    v-model.number="User.Typography.font_size_h4"
                    label="H4"
                    type="number"
                    dense
                    outlined
                  />
                  <s-input
                    v-model.number="User.Typography.font_size_h5"
                    label="H5"
                    type="number"
                    dense
                    outlined
                  />
                  <s-input
                    v-model.number="User.Typography.font_size_h6"
                    label="H6"
                    type="number"
                    dense
                    outlined
                  />
                  <s-input
                    v-model.number="User.Typography.font_size_body"
                    label="Body"
                    type="number"
                    dense
                    outlined
                  />
                  <s-input
                    v-model.number="User.Typography.font_weight_normal"
                    label="Normal weight"
                    type="number"
                    dense
                    outlined
                  />
                  <s-input
                    v-model.number="User.Typography.font_weight_bold"
                    label="Bold weight"
                    type="number"
                    dense
                    outlined
                  />
                  <s-input
                    v-model.number="User.Typography.line_height"
                    label="Line height"
                    type="number"
                    step="0.1"
                    dense
                    outlined
                  />
                  <s-input
                    v-model.number="User.Typography.letter_spacing"
                    label="Letter spacing"
                    type="number"
                    step="0.1"
                    dense
                    outlined
                  />
                  <s-switch
                    v-model="User.Typography.uppercase_headings"
                    label="Uppercase headings"
                  />
                </q-card-section>
              </s-card>
            </q-tab-panel>

            <!-- LAYOUT -->
            <q-tab-panel name="layout">
              <s-card bordered class="q-mb-md">
                <q-card-section class="text-subtitle1">
                  Buttons
                </q-card-section>

                <q-card-section class="q-gutter-md">
                  <s-select
                    v-model="User.LayoutSettings.button_style"
                    :options="buttonStyleOptions"
                    label="Style"
                    dense
                    outlined
                  />

                  <s-switch
                    v-model="User.LayoutSettings.button_dense"
                    label="Dense"
                  />
                  <s-switch
                    v-model="User.LayoutSettings.button_round"
                    label="Round"
                  />
                </q-card-section>
              </s-card>

              <s-card bordered class="q-mb-md">
                <q-card-section class="text-subtitle1">
                  Inputs
                </q-card-section>

                <q-card-section class="q-gutter-md">
                  <s-select
                    v-model="User.LayoutSettings.input_style"
                    :options="inputStyleOptions"
                    label="Style"
                    dense
                    outlined
                  />

                  <s-switch
                    v-model="User.LayoutSettings.input_dense"
                    label="Dense"
                  />
                </q-card-section>
              </s-card>

              <s-card bordered class="q-mb-md">
                <q-card-section class="text-subtitle1">
                  Cards
                </q-card-section>

                <q-card-section class="q-gutter-md">
                  <s-switch
                    v-model="User.LayoutSettings.card_flat"
                    label="Flat"
                  />
                  <s-switch
                    v-model="User.LayoutSettings.card_bordered"
                    label="Bordered"
                  />
                  <s-switch
                    v-model="User.LayoutSettings.rounded"
                    label="Rounded global"
                  />
                  <s-switch
                    v-model="User.LayoutSettings.square"
                    label="Square global"
                  />
                </q-card-section>
              </s-card>

              <s-card bordered>
                <q-card-section class="text-subtitle1">
                  Sidebar / Toolbar
                </q-card-section>

                <q-card-section class="q-gutter-md">
                  <s-switch
                    v-model="User.LayoutSettings.sidebar_mini"
                    label="Mini sidebar"
                  />

                  <s-input
                    v-model.number="User.LayoutSettings.sidebar_width"
                    label="Sidebar width"
                    type="number"
                    outlined
                    dense
                  />

                  <s-switch
                    v-model="User.LayoutSettings.toolbar_dense"
                    label="Toolbar dense"
                  />
                  <s-switch
                    v-model="User.LayoutSettings.toolbar_elevated"
                    label="Toolbar elevated"
                  />
                </q-card-section>
              </s-card>
            </q-tab-panel>

            <!-- ANIMATION -->
            <q-tab-panel name="animation">
              <s-card bordered>
                <q-card-section class="text-subtitle1">
                  Animation
                </q-card-section>

                <q-card-section class="q-gutter-md">
                  <s-switch
                    v-model="User.AnimationSettings.enable_animations"
                    label="Enable animations"
                  />

                  <s-select
                    v-model="User.AnimationSettings.animation_speed"
                    :options="['slow', 'normal', 'fast']"
                    label="Animation speed"
                    dense
                    outlined
                  />

                  <s-select
                    v-model="User.AnimationSettings.page_transition"
                    :options="['fade', 'slide-left', 'slide-right', 'scale']"
                    label="Page transition"
                    dense
                    outlined
                  />

                  <s-select
                    v-model="User.AnimationSettings.button_animation"
                    :options="['none', 'ripple', 'pulse']"
                    label="Button animation"
                    dense
                    outlined
                  />

                  <s-switch
                    v-model="User.AnimationSettings.hover_effect"
                    label="Hover effect"
                  />

                  <s-select
                    v-model="User.AnimationSettings.hover_style"
                    :options="['lift', 'shadow', 'grow']"
                    label="Hover style"
                    dense
                    outlined
                  />

                  <s-select
                    v-model="User.AnimationSettings.card_animation"
                    :options="['none', 'fade', 'slide-up']"
                    label="Card animation"
                    dense
                    outlined
                  />

                  <s-select
                    v-model="User.AnimationSettings.modal_animation"
                    :options="['none', 'scale', 'fade']"
                    label="Modal animation"
                    dense
                    outlined
                  />
                </q-card-section>
              </s-card>
            </q-tab-panel>
          </q-tab-panels>
        </div>

        <!-- RIGHT / PREVIEW -->
        <div v-if="isAppearanceTab" class="col-12 col-md-8">
          <div
            :class="[
              previewMode === 'mobile' ? 'mobile-frame' : '',
              animationSpeedClass,
              previewState.animation.enable_animations ? 'anim-enabled' : 'anim-disabled'
            ]"
          >
            <q-layout
              view="hHh lpR fFf"
              container
              style="height: 800px"
              class="preview-layout"
            >
              <q-header bordered class="bg-primary text-white">
                <q-toolbar
                  :dense="previewState.layout.toolbar_dense"
                  :class="previewState.layout.toolbar_elevated ? 'shadow-2' : ''"
                >
                  <s-btn flat round icon="menu" />
                  <q-toolbar-title>Preview</q-toolbar-title>
                  <s-btn flat round icon="notifications" />
                  <s-btn flat round icon="account_circle" />
                </q-toolbar>
              </q-header>

              <s-drawer
                show-if-above
                bordered
                :mini="previewState.layout.sidebar_mini"
                :width="previewState.layout.sidebar_width || 260"
              >
                <q-list padding>
                  <q-item clickable active>
                    <q-item-section avatar>
                      <q-icon name="dashboard" />
                    </q-item-section>
                    <q-item-section>Dashboard</q-item-section>
                  </q-item>

                  <q-item clickable>
                    <q-item-section avatar>
                      <q-icon name="groups" />
                    </q-item-section>
                    <q-item-section>Patients</q-item-section>
                  </q-item>

                  <q-item clickable>
                    <q-item-section avatar>
                      <q-icon name="badge" />
                    </q-item-section>
                    <q-item-section>Doctors</q-item-section>
                  </q-item>

                  <q-item clickable>
                    <q-item-section avatar>
                      <q-icon name="event" />
                    </q-item-section>
                    <q-item-section>Agenda</q-item-section>
                  </q-item>
                </q-list>
              </s-drawer>

              <q-page-container>
                <transition :name="transitionName" mode="out-in">
                  <q-page class="q-pa-md" :key="transitionKey">
                    <!-- PREVIEW COLORS -->
                    <s-card class="q-mb-md">
                      <q-card-section class="bg-secondary text-white">
                        Theme colors
                      </q-card-section>

                      <q-card-section>
                        <div class="row q-col-gutter-md">
                          <div class="col-6 col-sm-3">
                            <div class="preview-color-box bg-primary text-white">
                              Primary
                            </div>
                          </div>
                          <div class="col-6 col-sm-3">
                            <div class="preview-color-box bg-secondary text-white">
                              Secondary
                            </div>
                          </div>
                          <div class="col-6 col-sm-3">
                            <div class="preview-color-box bg-accent text-white">
                              Accent
                            </div>
                          </div>
                          <div class="col-6 col-sm-3">
                            <div class="preview-color-box bg-positive text-white">
                              Positive
                            </div>
                          </div>
                        </div>
                      </q-card-section>
                    </s-card>

                    <!-- PREVIEW TYPOGRAPHY -->
                    <s-card class="q-mb-md">
                      <q-card-section>
                        <div :style="headingStyle">
                          Title H1 Preview
                        </div>

                        <div class="q-mt-sm" :style="subHeadingStyle">
                          Subtitle H3 Preview
                        </div>

                        <div :style="bodyStyle" class="q-mt-md">
                          Base text coming from the configured typography. This block
                          lets you see font family, font size, line height,
                          weight and spacing applied in real time.
                        </div>
                      </q-card-section>
                    </s-card>

                    <!-- PREVIEW LAYOUT -->
                    <s-card class="q-mb-md">
                      <q-card-section class="text-subtitle1">
                        Form + Buttons
                      </q-card-section>

                      <q-card-section>
                        <div class="row q-col-gutter-md">
                          <div class="col-12 col-md-6">
                            <s-input
                              v-model="previewForm.name"
                              label="Name"
                            />
                          </div>

                          <div class="col-12 col-md-6">
                            <s-input
                              v-model="previewForm.email"
                              label="Email"
                            />
                          </div>
                        </div>

                        <div class="q-mt-md q-gutter-sm">
                          <s-btn color="primary" label="Primary" />
                          <s-btn color="secondary" label="Secondary" />
                          <s-btn color="accent" label="Accent" />
                          <s-btn color="positive" icon="check" label="Save" />
                        </div>
                      </q-card-section>
                    </s-card>

                    <!-- PREVIEW ANIMATION -->
                    <s-card class="q-mb-md">
                      <q-card-section class="text-subtitle1">
                        Animations / Interactions
                      </q-card-section>

                      <q-card-section>
                        <div class="row q-col-gutter-md">
                          <div class="col-12 col-md-4">
                            <s-card class="preview-mini-card">
                              <q-card-section>
                                Card 1
                              </q-card-section>
                            </s-card>
                          </div>

                          <div class="col-12 col-md-4">
                            <s-card class="preview-mini-card">
                              <q-card-section>
                                Card 2
                              </q-card-section>
                            </s-card>
                          </div>

                          <div class="col-12 col-md-4">
                            <s-card class="preview-mini-card">
                              <q-card-section>
                                Card 3
                              </q-card-section>
                            </s-card>
                          </div>
                        </div>

                        <div class="q-mt-md text-caption text-grey-7">
                          Hover, ripple, transitions and card animations are
                          reflected here according to the Animation tab.
                        </div>
                      </q-card-section>
                    </s-card>
                  </q-page>
                </transition>
              </q-page-container>
            </q-layout>
          </div>
        </div>
      </div>
    </q-card-section>
  </s-card>

  <q-dialog
    v-model="colorDialog"
    :transition-show="dialogTransition"
    :transition-hide="dialogTransition"
  >
    <s-card style="min-width: 350px">
      <q-card-section>
        Change color: {{ selectedKey }}
      </q-card-section>

      <q-card-section>
        <q-color
          v-model="tempColor"
          format-model="hex"
          @update:model-value="previewColor"
        />
      </q-card-section>

      <q-card-actions align="right">
        <s-btn flat label="Cancel" v-close-popup />
        <s-btn color="primary" label="Apply" @click="applyColor" />
      </q-card-actions>
    </s-card>
  </q-dialog>
</template>

<script>
import { defineComponent, h } from "vue"
import { Dark, setCssVar, QBtn, QInput, QCard, QDrawer } from "quasar"
import { HTTPAuth, url } from "../services/api"
import { useUserStore } from "../stores/UserStore"
import { tdc } from "../services/translation"
import { COUNTRIES, countryLabel } from "../utils/countries"
import { toE164, isValidE164, splitE164 } from "../utils/phone"

export default defineComponent({
  name: "ThemeStudioEngine",

  components: {
    TBtn: defineComponent({
      name: "TBtn",
      inheritAttrs: false,
      setup(props, { attrs, slots }) {
        const User = useUserStore()

        return () => {
          const layout = User.LayoutSettings || {}
          const animation = User.AnimationSettings || {}
          const enableAnimations = animation.enable_animations !== false

          const classList = [attrs.class]

          if (enableAnimations && animation.hover_effect && animation.hover_style) {
            classList.push(`hover-${animation.hover_style}`)
          }

          if (
            enableAnimations &&
            animation.button_animation &&
            animation.button_animation !== "none"
          ) {
            classList.push(`btn-anim-${animation.button_animation}`)
          }

          return h(
            QBtn,
            {
              ...attrs,
              dense: attrs.dense ?? layout.button_dense,
              round: attrs.round ?? layout.button_round,
              rounded: attrs.rounded ?? layout.rounded,
              square: attrs.square ?? layout.square,
              flat: attrs.flat ?? layout.button_style === "flat",
              outline: attrs.outline ?? layout.button_style === "outline",
              unelevated: attrs.unelevated ?? layout.button_style === "unelevated",
              push: attrs.push ?? layout.button_style === "push",
              ripple:
                attrs.ripple ??
                (enableAnimations && animation.button_animation === "ripple"),
              class: classList
            },
            slots
          )
        }
      }
    }),

    TInput: defineComponent({
      name: "TInput",
      inheritAttrs: false,
      props: {
        modelValue: {
          type: [String, Number],
          default: ""
        }
      },
      emits: ["update:modelValue"],
      setup(props, { attrs, emit, slots }) {
        const User = useUserStore()

        return () => {
          const layout = User.LayoutSettings || {}

          return h(
            QInput,
            {
              ...attrs,
              modelValue: props.modelValue,
              "onUpdate:modelValue": (val) => emit("update:modelValue", val),
              dense: attrs.dense ?? layout.input_dense,
              outlined: attrs.outlined ?? layout.input_style === "outlined",
              filled: attrs.filled ?? layout.input_style === "filled",
              standout: attrs.standout ?? layout.input_style === "standout",
              rounded: attrs.rounded ?? layout.rounded,
              square: attrs.square ?? layout.square
            },
            slots
          )
        }
      }
    }),

    TCard: defineComponent({
      name: "TCard",
      inheritAttrs: false,
      setup(props, { attrs, slots }) {
        const User = useUserStore()

        return () => {
          const layout = User.LayoutSettings || {}
          const animation = User.AnimationSettings || {}
          const enableAnimations = animation.enable_animations !== false

          const styleObj = {
            ...(attrs.style || {})
          }

          if (layout.square) {
            styleObj.borderRadius = "0px"
          } else if (layout.rounded) {
            styleObj.borderRadius = "16px"
          } else {
            styleObj.borderRadius = "4px"
          }

          const classList = [attrs.class]

          if (
            enableAnimations &&
            animation.card_animation &&
            animation.card_animation !== "none"
          ) {
            classList.push(`anim-${animation.card_animation}`)
          }

          return h(
            QCard,
            {
              ...attrs,
              flat: attrs.flat ?? layout.card_flat,
              bordered: attrs.bordered ?? layout.card_bordered,
              class: classList,
              style: styleObj
            },
            slots
          )
        }
      }
    }),

    TDrawer: defineComponent({
      name: "TDrawer",
      inheritAttrs: false,
      setup(props, { attrs, slots }) {
        const User = useUserStore()

        return () =>
          h(
            QDrawer,
            {
              ...attrs,
              mini: attrs.mini ?? User.LayoutSettings?.sidebar_mini,
              width: attrs.width ?? User.LayoutSettings?.sidebar_width
            },
            slots
          )
      }
    })
  },

  setup() {
    const User = useUserStore()
    return { User, tdc }
  },

  data() {
    return {
      tab: "profile",
      search: "",
      colorDialog: false,
      selectedKey: null,
      tempColor: "#1976D2",
      previewMode: "desktop",
      darkMode: false,
      previewForm: {
        name: "",
        email: ""
      },
      transitionKey: 0,

      loadingProfile: false,
      savingProfile: false,
      savingPassword: false,
      savingPhone: false,

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
      fontOptions: [
        "Ubuntu",
        "Roboto",
        "Inter",
        "Open Sans",
        "Lato",
        "Poppins",
        "Montserrat",
        "Nunito",
        "Source Sans Pro"
      ],
      buttonStyleOptions: ["flat", "outline", "unelevated", "push"],
      inputStyleOptions: ["outlined", "filled", "standout"]
    }
  },

  computed: {
    isAppearanceTab() {
      return ["cores", "font", "layout", "animation"].includes(this.tab)
    },

    barTitle() {
      if (this.tab === "profile") return "👤 " + this.tdc("Profile")
      if (this.tab === "security") return "🔒 " + this.tdc("Security")
      return "🎨 Theme Studio"
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

    previewState() {
      return {
        theme: this.User.Theme || {},
        layout: this.User.LayoutSettings || {},
        typography: this.User.Typography || {},
        animation: this.User.AnimationSettings || {}
      }
    },

    filteredColors() {
      const result = {}
      Object.entries(this.User.Theme || {}).forEach(([key, value]) => {
        if (key.toLowerCase().includes(this.search.toLowerCase())) {
          result[key] = value
        }
      })
      return result
    },

    headingStyle() {
      const t = this.previewState.typography
      return {
        fontFamily: t.font_family || "Roboto",
        fontSize: `${t.font_size_h1 || 32}px`,
        fontWeight: t.font_weight_bold || 700,
        lineHeight: t.line_height || 1.5,
        letterSpacing: `${t.letter_spacing || 0}px`,
        textTransform: t.uppercase_headings ? "uppercase" : "none"
      }
    },

    subHeadingStyle() {
      const t = this.previewState.typography
      return {
        fontFamily: t.font_family || "Roboto",
        fontSize: `${t.font_size_h3 || 24}px`,
        fontWeight: t.font_weight_bold || 700,
        lineHeight: t.line_height || 1.5,
        letterSpacing: `${t.letter_spacing || 0}px`,
        textTransform: t.uppercase_headings ? "uppercase" : "none"
      }
    },

    bodyStyle() {
      const t = this.previewState.typography
      return {
        fontFamily: t.font_family || "Roboto",
        fontSize: `${t.font_size_body || t.font_size_base || 14}px`,
        fontWeight: t.font_weight_normal || 400,
        lineHeight: t.line_height || 1.5,
        letterSpacing: `${t.letter_spacing || 0}px`
      }
    },

    animationSpeedClass() {
      const speed = this.previewState.animation.animation_speed || "normal"
      return `anim-speed-${speed}`
    },

    transitionName() {
      if (this.previewState.animation.enable_animations === false) {
        return ""
      }
      return this.previewState.animation.page_transition || "fade"
    },

    dialogTransition() {
      if (this.previewState.animation.enable_animations === false) {
        return "none"
      }
      return this.previewState.animation.modal_animation || "fade"
    }
  },

  mounted() {
    this.applyThemeVars()
    this.darkMode = this.$q.dark.isActive
    this.applyTypography()
    this.loadProfile()
  },

  methods: {
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
        await this.User.updateProfile({
          username: this.profileForm.username,
          email: this.profileForm.email || null
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

      this.savingPhone = true

      try {
        await this.User.updateProfile({
          mobile: this.fullPhoneNumber
        })
      } finally {
        this.savingPhone = false
      }
    },

    openColor(key) {
      this.selectedKey = key
      this.tempColor = this.User.Theme[key]
      this.colorDialog = true
    },

    previewColor(color) {
      if (!this.selectedKey) return
      setCssVar(this.selectedKey, color)
    },

    applyColor() {
      if (!this.selectedKey) return
      this.User.Theme[this.selectedKey] = this.tempColor
      setCssVar(this.selectedKey, this.tempColor)
      this.colorDialog = false
    },

    applyDarkMode(val) {
      Dark.set(val)
      this.darkMode = val
    },

    applyThemeVars() {
      Object.entries(this.User.Theme || {}).forEach(([k, v]) => {
        if (typeof v === "string") {
          setCssVar(k, v)
        }
      })
    },

    applyTypography() {
      const t = this.User.Typography || {}

      document.body.style.fontFamily = t.font_family || "Roboto"
      document.body.style.fontSize = `${t.font_size_base || 14}px`
      document.body.style.lineHeight = t.line_height || 1.5
    },

    touchPreview() {
      this.transitionKey += 1
    },

    async saveTheme() {
      this.applyTypography()
      this.applyThemeVars()

      await HTTPAuth.put(
        url({
          type: "u",
          url: `django_resaas/entitys/${this.User.Entity.id}/themePut/`
        }),
        this.User.Theme
      )

      await HTTPAuth.put(
        url({
          type: "u",
          url: `django_resaas/entitys/${this.User.Entity.id}/layoutSettingsPut/`
        }),
        this.User.LayoutSettings
      )

      await HTTPAuth.put(
        url({
          type: "u",
          url: `django_resaas/entitys/${this.User.Entity.id}/typographyPut/`
        }),
        this.User.Typography
      )

      await HTTPAuth.put(
        url({
          type: "u",
          url: `django_resaas/entitys/${this.User.Entity.id}/animationSettingsPut/`
        }),
        this.User.AnimationSettings
      )
    }
  },

  watch: {
    "User.Settings" (val) {
      if (val) this.loadProfile()
    },

    "User.Theme": {
      deep: true,
      handler() {
        this.applyThemeVars()
      }
    },

    "User.Typography": {
      deep: true,
      handler() {
        this.applyTypography()
      }
    },

    "User.LayoutSettings": {
      deep: true,
      handler() {
        this.touchPreview()
      }
    },

    "User.AnimationSettings": {
      deep: true,
      handler() {
        this.touchPreview()
      }
    }
  }
})
</script>

<style scoped>
.theme-studio-engine {
  overflow: hidden;
}

.mobile-frame {
  max-width: 390px;
  margin: auto;
}

.preview-layout {
  background: var(--q-dark-page, #f5f5f5);
}

.preview-color-box {
  border-radius: 10px;
  padding: 18px 12px;
  text-align: center;
  font-weight: 600;
}

.preview-mini-card {
  cursor: pointer;
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

.anim-disabled *,
.anim-disabled *::before,
.anim-disabled *::after {
  animation: none !important;
  transition: none !important;
}

.anim-speed-fast * {
  transition-duration: 0.15s !important;
}

.anim-speed-normal * {
  transition-duration: 0.3s !important;
}

.anim-speed-slow * {
  transition-duration: 0.6s !important;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-left-enter-active,
.slide-left-leave-active {
  transition: all 0.3s ease;
}

.slide-left-enter-from,
.slide-left-leave-to {
  transform: translateX(40px);
  opacity: 0;
}

.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.3s ease;
}

.slide-right-enter-from,
.slide-right-leave-to {
  transform: translateX(-40px);
  opacity: 0;
}

.scale-enter-active,
.scale-leave-active {
  transition: all 0.25s ease;
}

.scale-enter-from,
.scale-leave-to {
  transform: scale(0.95);
  opacity: 0;
}

.hover-lift:hover {
  transform: translateY(-4px);
}

.hover-shadow:hover {
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.hover-grow:hover {
  transform: scale(1.05);
}

.btn-anim-pulse:hover {
  animation: pulseBtn 0.6s ease;
}

@keyframes pulseBtn {
  0% {
    transform: scale(1);
  }
  45% {
    transform: scale(1.06);
  }
  100% {
    transform: scale(1);
  }
}

.anim-fade {
  animation: fadeCard 0.35s ease;
}

@keyframes fadeCard {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.anim-slide-up {
  animation: slideUp 0.35s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(16px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>
