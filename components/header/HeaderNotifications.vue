<template>
  <div>
    <!-- BOTÃO -->
    <s-btn
      flat
      round
      dense
      @click="open = true"
      :class="
        $q.dark.isActive
          ? 'bg-dark text-white'
          : 'bg-primary text-white'
      "
    >
      <q-icon name="notifications" />

      <q-badge
        v-if="unreadCount > 0"
        color="red"
        floating
        rounded
      >
        {{ unreadCount > 99 ? '99+' : unreadCount }}
      </q-badge>

      <q-tooltip
        :class="
          $q.dark.isActive
            ? 'bg-dark text-white'
            : 'bg-primary text-white'
        "
      >
        {{ tdc('View notifications') }}
      </q-tooltip>
    </s-btn>

    <!-- DIALOG -->
    <q-dialog
      v-model="open"
      position="right"
      maximized
      transition-show="slide-left"
      transition-hide="slide-right"
    >
      <q-card
        class="notification-chat"
        :class="$q.dark.isActive ? 'bg-dark' : 'bg-grey-1'"
      >
        <!-- HEADER -->
        <q-bar class="chat-header text-white">
          <q-avatar
            color="white"
            text-color="primary"
            icon="support_agent"
            size="36px"
          />

          <div class="q-ml-sm">
            <div class="text-subtitle2 text-weight-bold">
              {{ tdc('Support & Feedback') }}
            </div>

            <div class="text-caption">
              {{ tdc('Notifications and conversations') }}
            </div>
          </div>

          <q-space />

          <s-btn
            flat
            round
            dense
            icon="refresh"
            @click="reload"
          >
            <q-tooltip>
              {{ tdc('Refresh') }}
            </q-tooltip>
          </s-btn>

          <s-btn
            flat
            round
            dense
            icon="close"
            v-close-popup
          />
        </q-bar>

        <!-- BODY -->
        <div class="chat-body">
          <!-- LISTA -->
          <div
            class="conversation-list"
            :class="$q.dark.isActive ? 'bg-dark' : 'bg-white'"
          >
            <div class="q-pa-sm">
              <q-input
                v-model="search"
                dense
                outlined
                clearable
                :placeholder="tdc('Search')"
              >
                <template #prepend>
                  <q-icon name="search" />
                </template>
              </q-input>
            </div>

            <q-separator />

            <q-scroll-area class="conversation-scroll">
              <q-list separator>
                <q-item
                  v-for="item in filteredFeedback"
                  :key="item.id"
                  clickable
                  :active="selected?.id === item.id"
                  active-class="conversation-active"
                  @click="selectFeedback(item)"
                >
                  <q-item-section avatar>
                    <q-avatar
                      color="primary"
                      text-color="white"
                    >
                      {{
                        initials(
                          item.user?.name ||
                          item.user?.email ||
                          'U'
                        )
                      }}
                    </q-avatar>
                  </q-item-section>

                  <q-item-section>
                    <q-item-label
                      class="text-weight-medium ellipsis"
                    >
                      {{
                        item.user?.name ||
                        item.user?.email ||
                        tdc('Anonymous user')
                      }}
                    </q-item-label>

                    <q-item-label
                      caption
                      class="ellipsis"
                    >
                      {{ plainText(item.comment) }}
                    </q-item-label>

                    <q-item-label
                      caption
                      class="row items-center q-gutter-xs"
                    >
                      <span>
                        {{ formatDate(item.created_at) }}
                      </span>

                      <q-badge
                        :color="statusColor(item.status)"
                        :label="tdc(item.status || 'new')"
                      />
                    </q-item-label>
                  </q-item-section>

                  <q-item-section side>
                    <q-badge
                      v-if="!item.admin_read"
                      color="red"
                      rounded
                      label="1"
                    />
                  </q-item-section>
                </q-item>
              </q-list>

              <div
                v-if="!filteredFeedback.length"
                class="column flex-center q-pa-xl text-grey"
              >
                <q-icon
                  name="notifications_none"
                  size="48px"
                />

                <div class="q-mt-sm">
                  {{ tdc('No notifications') }}
                </div>
              </div>
            </q-scroll-area>
          </div>

          <!-- CHAT -->
          <div class="chat-panel">
            <template v-if="selected">
              <!-- HEADER CONVERSA -->
              <div
                class="chat-user-header"
                :class="
                  $q.dark.isActive
                    ? 'bg-grey-10'
                    : 'bg-white'
                "
              >
                <q-avatar
                  color="primary"
                  text-color="white"
                >
                  {{
                    initials(
                      selected.user?.name ||
                      selected.user?.email ||
                      'U'
                    )
                  }}
                </q-avatar>

                <div class="q-ml-sm">
                  <div class="text-weight-bold">
                    {{
                      selected.user?.name ||
                      selected.user?.email ||
                      tdc('Anonymous user')
                    }}
                  </div>

                  <div class="text-caption text-grey">
                    {{ selected.entity?.name || '' }}

                    <span v-if="selected.branch?.name">
                      • {{ selected.branch.name }}
                    </span>
                  </div>
                </div>

                <q-space />

                <q-select
                  v-model="selected.status"
                  dense
                  outlined
                  emit-value
                  map-options
                  style="min-width: 150px"
                  :options="statusOptions"
                  @update:model-value="updateStatus"
                />
              </div>

              <!-- MENSAGENS -->
              <q-scroll-area class="messages-area">
                <div class="q-pa-md">
                  <q-chat-message
                    :name="
                      selected.user?.name ||
                      selected.user?.email ||
                      tdc('User')
                    "
                    :text="[plainText(selected.comment)]"
                    :stamp="formatDate(selected.created_at)"
                    bg-color="grey-3"
                    text-color="dark"
                  />

                  <q-chat-message
                    v-for="messageItem in messages"
                    :key="messageItem.id"
                    :sent="messageItem.sender === 'admin'"
                    :name="
                      messageItem.sender === 'admin'
                        ? tdc('Support')
                        : selected.user?.name
                    "
                    :text="[messageItem.message]"
                    :stamp="formatDate(messageItem.created_at)"
                    :bg-color="
                      messageItem.sender === 'admin'
                        ? 'primary'
                        : 'grey-3'
                    "
                    :text-color="
                      messageItem.sender === 'admin'
                        ? 'white'
                        : 'dark'
                    "
                  />
                </div>
              </q-scroll-area>

              <!-- INPUT -->
              <div
                class="message-input"
                :class="
                  $q.dark.isActive
                    ? 'bg-grey-10'
                    : 'bg-white'
                "
              >
                <q-input
                  v-model="message"
                  outlined
                  autogrow
                  dense
                  :placeholder="tdc('Type a message')"
                  @keyup.enter.exact.prevent="sendMessage"
                >
                  <template #prepend>
                    <q-icon name="chat" />
                  </template>

                  <template #append>
                    <s-btn
                      flat
                      round
                      color="primary"
                      icon="send"
                      :loading="sending"
                      :disable="!message.trim() || sending"
                      @click="sendMessage"
                    />
                  </template>
                </q-input>
              </div>
            </template>

            <!-- SEM SELECÇÃO -->
            <div
              v-else
              class="empty-chat column flex-center"
            >
              <q-icon
                name="forum"
                size="80px"
                color="grey-5"
              />

              <div class="text-h6 q-mt-md">
                {{ tdc('Select a conversation') }}
              </div>

              <div class="text-grey">
                {{
                  tdc(
                    'Choose a notification or feedback to view the conversation.'
                  )
                }}
              </div>
            </div>
          </div>
        </div>
      </q-card>
    </q-dialog>
  </div>
</template>

<script>
import { defineComponent } from 'vue'
import { Notify } from 'quasar'

import { tdc } from '../../services/translation'
import { getFirebase } from 'quasar_resaas'

export default defineComponent({
  name: 'NotificationChat',

  data () {
    return {
      tdc,

      open: false,
      search: '',

      feedback: [],
      selected: null,

      messages: [],
      message: '',
      sending: false,

      feedbackRef: null,
      feedbackCallback: null,

      messagesRef: null,
      messagesCallback: null,

      statusOptions: [
        {
          label: tdc('New'),
          value: 'new'
        },
        {
          label: tdc('In progress'),
          value: 'in_progress'
        },
        {
          label: tdc('Resolved'),
          value: 'resolved'
        },
        {
          label: tdc('Closed'),
          value: 'closed'
        }
      ]
    }
  },

  computed: {
    unreadCount () {
      return this.feedback.filter(
        item => !item.admin_read
      ).length
    },

    filteredFeedback () {
      const search = this.search
        ?.trim()
        .toLowerCase()

      if (!search) {
        return this.feedback
      }

      return this.feedback.filter(item => {
        const content = [
          item.user?.name,
          item.user?.email,
          item.entity?.name,
          item.branch?.name,
          this.plainText(item.comment)
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()

        return content.includes(search)
      })
    }
  },

  watch: {
    open (value) {
      if (value) {
        this.listenFeedback()
      } else {
        this.selected = null
        this.messages = []
        this.stopListeners()
      }
    }
  },

  beforeUnmount () {
    this.stopListeners()
  },

  methods: {
    listenFeedback () {
      const { fireDatBase } = getFirebase()

      this.stopFeedbackListener()

      this.feedbackRef = fireDatBase
        .ref('feedback')
        .orderByChild('created_at')
        .limitToLast(50)

      this.feedbackCallback = snapshot => {
        const data = snapshot.val() || {}

        this.feedback = Object.entries(data)
          .map(([id, item]) => ({
            id,
            ...item
          }))
          .sort(
            (a, b) =>
              (b.created_at || 0) -
              (a.created_at || 0)
          )
      }

      this.feedbackRef.on(
        'value',
        this.feedbackCallback
      )
    },

    reload () {
      this.stopListeners()
      this.selected = null
      this.messages = []
      this.listenFeedback()
    },

    async selectFeedback (item) {
      this.selected = {
        ...item
      }

      try {
        await this.markAsRead(item)
      } catch (error) {
        console.error(
          '[NotificationChat] markAsRead:',
          error
        )
      }

      this.listenMessages(item.id)
    },

    listenMessages (feedbackId) {
      const { fireDatBase } = getFirebase()

      this.stopMessagesListener()

      this.messagesRef = fireDatBase
        .ref(`feedback_messages/${feedbackId}`)
        .orderByChild('created_at')
        .limitToLast(100)

      this.messagesCallback = snapshot => {
        const data = snapshot.val() || {}

        this.messages = Object.entries(data)
          .map(([id, item]) => ({
            id,
            ...item
          }))
          .sort(
            (a, b) =>
              (a.created_at || 0) -
              (b.created_at || 0)
          )
      }

      this.messagesRef.on(
        'value',
        this.messagesCallback
      )
    },

    async sendMessage () {
      const message = this.message?.trim()

      if (
        !message ||
        !this.selected ||
        this.sending
      ) {
        return
      }

      this.sending = true

      try {
        const {
          firebase,
          fireDatBase
        } = getFirebase()

        const timestamp =
          firebase.database.ServerValue.TIMESTAMP

        const messageRef = fireDatBase
          .ref(
            `feedback_messages/${this.selected.id}`
          )
          .push()

        const updates = {}

        updates[
          `feedback_messages/${this.selected.id}/${messageRef.key}`
        ] = {
          id: messageRef.key,
          sender: 'admin',
          message,
          read: false,
          created_at: timestamp
        }

        updates[
          `feedback/${this.selected.id}/status`
        ] = 'in_progress'

        updates[
          `feedback/${this.selected.id}/updated_at`
        ] = timestamp

        updates[
          `feedback/${this.selected.id}/last_message`
        ] = message

        updates[
          `feedback/${this.selected.id}/last_message_at`
        ] = timestamp

        await fireDatBase
          .ref()
          .update(updates)

        this.message = ''

        if (this.selected) {
          this.selected.status =
            'in_progress'
        }
      } catch (error) {
        console.error(
          '[NotificationChat] sendMessage:',
          error
        )

        Notify.create({
          type: 'negative',
          message: tdc(
            'Unable to send message.'
          )
        })
      } finally {
        this.sending = false
      }
    },

    async markAsRead (item) {
      if (item.admin_read) {
        return
      }

      const {
        firebase,
        fireDatBase
      } = getFirebase()

      await fireDatBase
        .ref(`feedback/${item.id}`)
        .update({
          admin_read: true,

          admin_read_at:
            firebase.database.ServerValue.TIMESTAMP
        })

      item.admin_read = true

      if (
        this.selected?.id === item.id
      ) {
        this.selected.admin_read = true
      }
    },

    async updateStatus (status) {
      if (!this.selected) {
        return
      }

      try {
        const {
          firebase,
          fireDatBase
        } = getFirebase()

        await fireDatBase
          .ref(`feedback/${this.selected.id}`)
          .update({
            status,

            updated_at:
              firebase.database.ServerValue.TIMESTAMP
          })

        this.selected.status = status
      } catch (error) {
        console.error(
          '[NotificationChat] updateStatus:',
          error
        )

        Notify.create({
          type: 'negative',
          message: tdc(
            'Unable to update status.'
          )
        })
      }
    },

    plainText (html) {
      if (!html) {
        return ''
      }

      const div =
        document.createElement('div')

      div.innerHTML = html

      return (
        div.textContent ||
        div.innerText ||
        ''
      ).trim()
    },

    initials (name) {
      return String(name || '?')
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(item => item[0])
        .join('')
        .toUpperCase()
    },

    formatDate (timestamp) {
      if (!timestamp) {
        return ''
      }

      return new Intl.DateTimeFormat(
        'pt-PT',
        {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }
      ).format(
        new Date(timestamp)
      )
    },

    statusColor (status) {
      return {
        new: 'red',
        in_progress: 'orange',
        resolved: 'positive',
        closed: 'grey'
      }[status] || 'grey'
    },

    stopFeedbackListener () {
      if (
        this.feedbackRef &&
        this.feedbackCallback
      ) {
        this.feedbackRef.off(
          'value',
          this.feedbackCallback
        )
      }

      this.feedbackRef = null
      this.feedbackCallback = null
    },

    stopMessagesListener () {
      if (
        this.messagesRef &&
        this.messagesCallback
      ) {
        this.messagesRef.off(
          'value',
          this.messagesCallback
        )
      }

      this.messagesRef = null
      this.messagesCallback = null
    },

    stopListeners () {
      this.stopFeedbackListener()
      this.stopMessagesListener()
    }
  }
})
</script>

<style scoped>
.notification-chat {
  width: min(1100px, 100vw);
  height: 100vh;
  margin-left: auto;
  overflow: hidden;
}

.chat-header {
  height: 64px;
  background: linear-gradient(
    135deg,
    var(--q-primary),
    #075e54
  );
}

.chat-body {
  display: grid;
  grid-template-columns: 350px 1fr;
  height: calc(100vh - 64px);
  min-height: 0;
}

.conversation-list {
  min-width: 0;
  overflow: hidden;
  border-right:
    1px solid
    rgba(120, 120, 120, 0.16);
}

.conversation-scroll {
  height: calc(100vh - 129px);
}

.conversation-active {
  background:
    rgba(25, 118, 210, 0.12);
}

.chat-panel {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  height: 100%;
}

.chat-user-header {
  display: flex;
  align-items: center;
  min-height: 70px;
  padding: 10px 16px;

  border-bottom:
    1px solid
    rgba(120, 120, 120, 0.15);
}

.messages-area {
  flex: 1;
  min-height: 0;

  background:
    linear-gradient(
      rgba(245, 245, 245, 0.92),
      rgba(245, 245, 245, 0.92)
    );
}

.body--dark .messages-area {
  background: #111b21;
}

.message-input {
  padding: 12px;

  border-top:
    1px solid
    rgba(120, 120, 120, 0.15);
}

.empty-chat {
  flex: 1;
  height: 100%;
  padding: 20px;
  text-align: center;
}

@media (max-width: 700px) {
  .notification-chat {
    width: 100vw;
  }

  .chat-body {
    grid-template-columns: 1fr;
  }

  .conversation-list {
    display: none;
  }
}
</style>