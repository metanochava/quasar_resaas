<template>
  <q-page class="row items-center justify-center">
    <div class="column items-center q-gutter-md text-center sso-wrap" data-test="sso-page">
      <template v-if="!failed">
        <q-spinner color="primary" size="40px" />
        <div class="text-body2">{{ tdc('Signing you in') }}</div>
      </template>

      <template v-else>
        <q-icon name="error_outline" color="negative" size="40px" />
        <div class="text-body2" data-test="sso-failed">{{ tdc('The shared sign-in could not be completed.') }}</div>
        <s-btn color="primary" :label="tdc('Sign in')" data-test="sso-login" @click="toLogin">
          <s-tooltip>{{ tdc('Sign in') }}</s-tooltip>
        </s-btn>
      </template>
    </div>
  </q-page>
</template>

<script setup>
// The three single sign-on steps (services/sso.js), by route name:
//   ssoAuthorize  /sso           CENTRAL: a code for a client domain
//   ssoAdopt      /sso/adopt     CENTRAL: take over a client's local session
//   ssoCallback   /sso/callback  CLIENT:  turn the answer into a session
import { onMounted, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useRoute, useRouter } from 'vue-router'

import { tdc } from '../../services/translation'
import { useUserStore } from '../../stores/UserStore'
import { loadUserSaas } from '../../boot/login_boot'
import * as sso from '../../services/sso'

const q = useQuasar()
const route = useRoute()
const router = useRouter()
const User = useUserStore()

const failed = ref(false)

// the Entity -> Branch -> Group choice ends by naming the next route
watch(() => User.redirect, (value) => {
  if (!value) return
  router.push({ name: value })
  User.redirect = ''
})

function toLogin () {
  router.replace({ name: 'login' })
}

// the code and verifier must not stay in the address bar or the history
function forgetQuery () {
  try {
    window.history.replaceState(window.history.state, '', `${window.location.pathname}#${route.path}`)
  } catch {
    // ignore
  }
}

const startSession = data => User.startSession(data)

async function authorizeStep (query) {
  if (User.isSignedIn()) {
    await sso.authorize(query)
    return
  }

  const answer = await sso.loginRequired(query)
  if (answer === 'login') toLogin()
  if (answer === 'refused') failed.value = true
}

async function callbackStep (query) {
  const result = await sso.completeCallback(query, startSession)

  if (result === 'login') {
    toLogin()
    return
  }

  await loadUserSaas(q)
}

onMounted(async () => {
  const query = { ...route.query }

  try {
    if (route.name === 'ssoAuthorize') return await authorizeStep(query)

    forgetQuery()

    if (route.name === 'ssoAdopt') return await sso.adopt(query, startSession)
    if (route.name === 'ssoCallback') return await callbackStep(query)

    failed.value = true
  } catch {
    failed.value = true
  }
})
</script>

<style scoped>
.sso-wrap {
  max-width: 360px;
}
</style>
