<template>
  <s-card>
    <q-bar class="bg-primary text-white">
      <q-icon name="feedback" />

      <span class="q-ml-sm">
        {{ tdc('Send comment or feedback') }}
      </span>

      <q-space />

      <s-btn
        dense
        flat
        round
        icon="close"
        v-close-popup
      >
        <q-tooltip>
          {{ tdc('Close') }}
        </q-tooltip>
      </s-btn>
    </q-bar>

    <!-- EDITOR -->
    <q-card-section>
      <s-editor
        v-model="comment_text"
        outlined
        dense
        :placeholder="
          tdc(
            `Have feedback or suggestions? We would be happy to hear from you. Please do not include passwords, sensitive personal data, or confidential organizational information. <br>Need assistance? Visit the Help Center or contact your organization's support team.`
          )
        "
      />

      <div
        v-if="error"
        class="text-negative text-caption q-mt-xs"
      >
        {{ tdc('This field is required.') }}
      </div>
    </q-card-section>

    <!-- INFORMAÇÃO -->
    <q-card-section class="q-pt-none">
      <div
        class="information-text text-caption text-grey-7"
        v-html="
          tdc(
            'Some account, entity, branch, and system information may be collected and processed to provide support, diagnose and resolve technical issues, maintain security, and improve the quality of our services. This information may be shared with authorized administrators or service providers when necessary, in accordance with the applicable Privacy Policy and Terms of Service. <br><br>We may contact you by email or other authorized communication channels if additional information is required or to provide updates regarding your request. For privacy, data protection, or legal matters, please contact your organization or the appropriate system administrator.'
          )
        "
      />
    </q-card-section>

    <q-separator />

    <!-- ACTIONS -->
    <q-card-actions align="right">
      <s-btn
        v-close-popup
        flat
        color="grey"
        :disable="loading"
      >
        {{ tdc('Cancel') }}
      </s-btn>

      <s-btn
        color="primary"
        icon="send"
        :loading="loading"
        :disable="loading"
        @click="comentar"
      >
        {{ tdc('Send') }}
      </s-btn>
    </q-card-actions>
  </s-card>
</template>

<script>
import { defineComponent } from 'vue'
import { Notify } from 'quasar'

import { tdc } from '../../services/translation'
import { getFirebase } from 'quasar_resaas'
import { useUserStore } from '../../stores/UserStore'

export default defineComponent({
  name: 'CommentFeedback',

  emits: [
    'sent',
    'error'
  ],

  data () {
    return {
      tdc,

      comment_text: '',

      loading: false,

      error: false
    }
  },

  watch: {
    comment_text () {
      if (this.hasContent(this.comment_text)) {
        this.error = false
      }
    }
  },

  methods: {
    hasContent (value) {
      if (!value) {
        return false
      }

      const text = String(value)
        .replace(/<br\s*\/?>/gi, '')
        .replace(/<p><\/p>/gi, '')
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/gi, ' ')
        .trim()

      return text.length > 0
    },

    getContext () {
      const User = useUserStore()

      return {
        user: {
          id:
            User?.User?.id ||
            User?.user?.id ||
            null,

          name:
            User?.User?.full_name ||
            User?.User?.name ||
            User?.user?.full_name ||
            User?.user?.name ||
            null,

          email:
            User?.User?.email ||
            User?.user?.email ||
            null
        },

        entity: {
          id:
            User?.Entity?.id ||
            User?.entity?.id ||
            null,

          name:
            User?.Entity?.name ||
            User?.Entity?.label ||
            User?.entity?.name ||
            null
        },

        branch: {
          id:
            User?.Branch?.id ||
            User?.branch?.id ||
            null,

          name:
            User?.Branch?.name ||
            User?.Branch?.label ||
            User?.branch?.name ||
            null
        },

        group: {
          id:
            User?.Group?.id ||
            null,

          name:
            User?.Group?.name ||
            User?.Group?.label ||
            null
        }
      }
    },

    async comentar () {
      if (this.loading) {
        return
      }

      if (!this.hasContent(this.comment_text)) {
        this.error = true

        Notify.create({
          type: 'warning',
          icon: 'warning',
          message: tdc(
            'Please enter your comment or feedback.'
          )
        })

        return
      }

      this.error = false
      this.loading = true

      try {
        const {
          firebase,
          fireDataBase
        } = getFirebase()

        if (!fireDataBase) {
          throw new Error(
            'Firebase Realtime Database não disponível.'
          )
        }

        const feedbackRef = fireDataBase
          .ref('feedback')
          .push()

        const payload = {
          id: feedbackRef.key,

          comment: this.comment_text,

          type: 'feedback',

          status: 'new',

          admin_read: false,

          user_read: true,

          ...this.getContext(),

          system: {
            url:
              window.location.href,

            path:
              window.location.pathname,

            language:
              localStorage.getItem('L') ||
              navigator.language ||
              null
          },

          created_at:
            firebase.database.ServerValue.TIMESTAMP
        }

        await feedbackRef.set(payload)

        this.comment_text = ''

        Notify.create({
          type: 'positive',
          icon: 'check_circle',
          message: tdc(
            'Feedback sent successfully.'
          )
        })

        this.$emit(
          'sent',
          feedbackRef.key
        )
      } catch (error) {
        console.error(
          '[CommentFeedback]',
          error
        )

        Notify.create({
          type: 'negative',
          icon: 'error',
          message: tdc(
            'Unable to send feedback. Please try again.'
          )
        })

        this.$emit(
          'error',
          error
        )
      } finally {
        this.loading = false
      }
    }
  }
})
</script>

<style scoped>
.information-text {
  width: 100%;
  text-align: justify;
  text-justify: inter-word;
  line-height: 1.6;
  overflow-wrap: anywhere;
  hyphens: auto;
}
</style>