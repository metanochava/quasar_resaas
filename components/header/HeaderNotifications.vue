<template>
  <div>
    <!-- BOTÃO DE NOTIFICAÇÕES -->
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

      <q-tooltip>
        {{ tdc('View notifications') }}
      </q-tooltip>
    </s-btn>

    <!-- DIALOG -->
    <q-dialog
      v-model="open"
      position="right"
      transition-show="slide-left"
      transition-hide="slide-right"
    >
      <q-card
        class="notification-chat"
        :class="
          $q.dark.isActive
            ? 'bg-dark text-white'
            : 'bg-grey-1'
        "
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
              {{ tdc('Comments and conversations') }}
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
          >
            <q-tooltip>
              {{ tdc('Close') }}
            </q-tooltip>
          </s-btn>
        </q-bar>

        <!-- BODY -->
        <div class="chat-body">

          <!-- LISTA DE CONVERSAS -->
          <div
            class="conversation-list"
            :class="
              $q.dark.isActive
                ? 'bg-dark'
                : 'bg-white'
            "
          >
            <!-- PESQUISA -->
            <div class="q-pa-sm">
              <q-input
                v-model="search"
                dense
                outlined
                clearable
                debounce="250"
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
                  v-ripple
                  :active="selected?.id === item.id"
                  active-class="conversation-active"
                  @click="selectFeedback(item)"
                >
                  <!-- AVATAR -->
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

                  <!-- DADOS -->
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
                      {{
                        item.last_message ||
                        item.comment_text ||
                        ''
                      }}
                    </q-item-label>

                    <q-item-label
                      caption
                      class="row items-center q-gutter-xs"
                    >
                      <span>
                        {{
                          formatDate(
                            item.last_message_at ||
                            item.created_at
                          )
                        }}
                      </span>

                      <q-badge
                        :color="statusColor(item.status)"
                        :label="
                          tdc(
                            statusLabel(item.status)
                          )
                        "
                      />
                    </q-item-label>
                  </q-item-section>

                  <!-- NÃO LIDO -->
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

              <!-- EMPTY -->
              <div
                v-if="!filteredFeedback.length"
                class="column flex-center q-pa-xl text-grey"
              >
                <q-icon
                  name="forum"
                  size="50px"
                />

                <div class="q-mt-sm">
                  {{ tdc('No conversations') }}
                </div>
              </div>
            </q-scroll-area>
          </div>

          <!-- PAINEL DO CHAT -->
          <div class="chat-panel">
            <template v-if="selected">

              <!-- HEADER DO UTILIZADOR -->
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

                <div class="q-ml-sm overflow-hidden">
                  <div class="text-weight-bold ellipsis">
                    {{
                      selected.user?.name ||
                      selected.user?.email ||
                      tdc('Anonymous user')
                    }}
                  </div>

                  <div class="text-caption text-grey ellipsis">
                    {{ selected.entity?.name || '' }}

                    <span v-if="selected.branch?.name">
                      • {{ selected.branch.name }}
                    </span>

                    <span v-if="selected.group?.name">
                      • {{ selected.group.name }}
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
                  :options="statusOptions"
                  style="width: 165px"
                  @update:model-value="updateStatus"
                />
              </div>

              <!-- MENSAGENS -->
              <q-scroll-area class="messages-area">
                <div class="q-pa-md">

                  <!-- MENSAGEM ORIGINAL -->
                  <q-chat-message
                    :name="
                      selected.user?.name ||
                      selected.user?.email ||
                      tdc('User')
                    "
                    :text="[
                      selected.comment_text ||
                      plainText(selected.comment)
                    ]"
                    :stamp="formatDate(selected.created_at)"
                    bg-color="grey-3"
                    text-color="dark"
                  />

                  <!-- CONVERSA -->
                  <q-chat-message
                    v-for="messageItem in messages"
                    :key="messageItem.id"
                    :sent="messageItem.sender === 'admin'"
                    :name="
                      messageItem.sender === 'admin'
                        ? tdc('Support')
                        : (
                            selected.user?.name ||
                            tdc('User')
                          )
                    "
                    :text="[messageItem.message]"
                    :stamp="
                      formatDate(
                        messageItem.created_at
                      )
                    "
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
                  dense
                  autogrow
                  maxlength="5000"
                  :placeholder="
                    tdc('Type a message')
                  "
                  @keyup.enter.exact.prevent="
                    sendMessage
                  "
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
                      :disable="
                        !message.trim() ||
                        sending
                      "
                      @click="sendMessage"
                    />
                  </template>
                </q-input>
              </div>
            </template>

            <!-- SEM CONVERSA -->
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
                    'Choose a feedback to view the conversation.'
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

/*
 * IMPORTANTE:
 *
 * Estas referências ficam FORA do data().
 *
 * Desta maneira o Vue não transforma Firebase Query / Reference
 * em Proxy reactivo.
 *
 * Isso evita erros internos como:
 *
 * newChildren.insert is not a function
 * newChildren.remove is not a function
 */

let feedbackRef = null
let feedbackCallback = null

let messagesRef = null
let messagesCallback = null

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
      const search =
        String(this.search || '')
          .trim()
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

          item.group?.name,

          item.last_message,

          item.comment_text
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

        return
      }

      this.selected = null
      this.messages = []

      this.stopListeners()
    }
  },

  beforeUnmount () {
    this.stopListeners()
  },

  methods: {

    // =====================================================
    // FIREBASE
    // =====================================================

    getDatabase () {
      const {
        fireDataBase
      } = getFirebase()

      if (!fireDataBase) {
        throw new Error(
          '[NotificationChat] Firebase Realtime Database não disponível.'
        )
      }

      return fireDataBase
    },

    // =====================================================
    // FEEDBACK LISTENER
    // =====================================================

    listenFeedback () {
      try {
        const fireDataBase =
          this.getDatabase()

        this.stopFeedbackListener()

        feedbackRef =
          fireDataBase
            .ref('feedback')
            .orderByChild('created_at')
            .limitToLast(50)

        feedbackCallback =
          snapshot => {
            const data =
              snapshot.val() || {}

            const feedback =
              Object
                .entries(data)
                .map(([id, item]) => ({
                  id,

                  ...item,

                  /*
                   * Guardamos o texto limpo logo aqui.
                   *
                   * Assim não precisamos criar elementos DOM
                   * repetidamente durante o render.
                   */
                  comment_text:
                    this.plainText(
                      item?.comment
                    )
                }))
                .sort(
                  (a, b) =>
                    (
                      b.last_message_at ||
                      b.updated_at ||
                      b.created_at ||
                      0
                    ) -
                    (
                      a.last_message_at ||
                      a.updated_at ||
                      a.created_at ||
                      0
                    )
                )

            this.feedback =
              feedback

            /*
             * Se a conversa seleccionada recebeu
             * alguma alteração, actualizamos apenas
             * os metadados dela.
             */

            if (this.selected?.id) {
              const updated =
                feedback.find(
                  item =>
                    item.id ===
                    this.selected.id
                )

              if (updated) {
                this.selected = {
                  ...this.selected,
                  ...updated
                }
              }
            }
          }

        feedbackRef.on(
          'value',
          feedbackCallback
        )
      } catch (error) {
        console.error(
          '[NotificationChat] listenFeedback:',
          error
        )
      }
    },

    // =====================================================
    // MESSAGES LISTENER
    // =====================================================

    listenMessages (feedbackId) {
      if (!feedbackId) {
        return
      }

      try {
        const fireDataBase =
          this.getDatabase()

        this.stopMessagesListener()

        messagesRef =
          fireDataBase
            .ref(
              `feedback_messages/${feedbackId}`
            )
            .orderByChild(
              'created_at'
            )
            .limitToLast(100)

        messagesCallback =
          snapshot => {
            const data =
              snapshot.val() || {}

            this.messages =
              Object
                .entries(data)
                .map(
                  ([id, item]) => ({
                    id,
                    ...item
                  })
                )
                .sort(
                  (a, b) =>
                    (
                      a.created_at ||
                      0
                    ) -
                    (
                      b.created_at ||
                      0
                    )
                )
          }

        messagesRef.on(
          'value',
          messagesCallback
        )
      } catch (error) {
        console.error(
          '[NotificationChat] listenMessages:',
          error
        )
      }
    },

    // =====================================================
    // SELECT FEEDBACK
    // =====================================================

    async selectFeedback (item) {
      if (!item?.id) {
        return
      }

      this.selected = {
        ...item
      }

      this.messages = []

      this.listenMessages(
        item.id
      )

      try {
        await this.markAsRead(
          item
        )
      } catch (error) {
        console.error(
          '[NotificationChat] markAsRead:',
          error
        )
      }
    },

    // =====================================================
    // SEND MESSAGE
    // =====================================================

    async sendMessage () {
      const message =
        String(
          this.message || ''
        ).trim()

      if (
        !message ||
        !this.selected?.id ||
        this.sending
      ) {
        return
      }

      this.sending = true

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

        /*
         * IMPORTANTE:
         *
         * Não guardamos messageRef dentro de data().
         *
         * Fica somente como variável local.
         */

        const messageRef =
          fireDataBase
            .ref(
              `feedback_messages/${this.selected.id}`
            )
            .push()

        // ---------------------------------------------
        // 1. Guardar a mensagem
        // ---------------------------------------------

        await messageRef.set({
          id:
            messageRef.key,

          sender:
            'admin',

          message,

          read:
            false,

          created_at:
            firebase
              .database
              .ServerValue
              .TIMESTAMP
        })

        // ---------------------------------------------
        // 2. Actualizar metadados do feedback
        // ---------------------------------------------

        await fireDataBase
          .ref(
            `feedback/${this.selected.id}`
          )
          .update({
            status:
              'in_progress',

            last_message:
              message,

            updated_at:
              firebase
                .database
                .ServerValue
                .TIMESTAMP,

            last_message_at:
              firebase
                .database
                .ServerValue
                .TIMESTAMP
          })

        this.message = ''

        this.selected = {
          ...this.selected,

          status:
            'in_progress',

          last_message:
            message
        }
      } catch (error) {
        console.error(
          '[NotificationChat] sendMessage:',
          error
        )

        Notify.create({
          type:
            'negative',

          icon:
            'error',

          message:
            tdc(
              'Unable to send message.'
            )
        })
      } finally {
        this.sending = false
      }
    },

    // =====================================================
    // MARK AS READ
    // =====================================================

    async markAsRead (item) {
      if (
        !item?.id ||
        item.admin_read
      ) {
        return
      }

      const {
        firebase,
        fireDataBase
      } = getFirebase()

      if (!fireDataBase) {
        return
      }

      await fireDataBase
        .ref(
          `feedback/${item.id}`
        )
        .update({
          admin_read:
            true,

          admin_read_at:
            firebase
              .database
              .ServerValue
              .TIMESTAMP
        })

      const feedback =
        this.feedback.find(
          feedback =>
            feedback.id ===
            item.id
        )

      if (feedback) {
        feedback.admin_read =
          true
      }

      if (
        this.selected?.id ===
        item.id
      ) {
        this.selected = {
          ...this.selected,

          admin_read:
            true
        }
      }
    },

    // =====================================================
    // STATUS
    // =====================================================

    async updateStatus (status) {
      if (
        !this.selected?.id ||
        !status
      ) {
        return
      }

      try {
        const {
          firebase,
          fireDataBase
        } = getFirebase()

        if (!fireDataBase) {
          return
        }

        await fireDataBase
          .ref(
            `feedback/${this.selected.id}`
          )
          .update({
            status,

            updated_at:
              firebase
                .database
                .ServerValue
                .TIMESTAMP
          })

        this.selected = {
          ...this.selected,

          status
        }

        const feedback =
          this.feedback.find(
            item =>
              item.id ===
              this.selected.id
          )

        if (feedback) {
          feedback.status =
            status
        }
      } catch (error) {
        console.error(
          '[NotificationChat] updateStatus:',
          error
        )

        Notify.create({
          type:
            'negative',

          icon:
            'error',

          message:
            tdc(
              'Unable to update status.'
            )
        })
      }
    },

    // =====================================================
    // REFRESH
    // =====================================================

    reload () {
      this.selected = null
      this.messages = []

      this.stopListeners()

      this.listenFeedback()
    },

    // =====================================================
    // HELPERS
    // =====================================================

    plainText (html) {
      if (!html) {
        return ''
      }

      const div =
        document.createElement(
          'div'
        )

      div.innerHTML =
        String(html)

      return String(
        div.textContent ||
        div.innerText ||
        ''
      )
        .replace(/\s+/g, ' ')
        .trim()
    },

    initials (name) {
      return String(
        name || '?'
      )
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(
          item =>
            item.charAt(0)
        )
        .join('')
        .toUpperCase()
    },

    formatDate (timestamp) {
      if (!timestamp) {
        return ''
      }

      const date =
        new Date(timestamp)

      if (
        Number.isNaN(
          date.getTime()
        )
      ) {
        return ''
      }

      return new Intl
        .DateTimeFormat(
          'pt-PT',
          {
            day:
              '2-digit',

            month:
              '2-digit',

            year:
              'numeric',

            hour:
              '2-digit',

            minute:
              '2-digit'
          }
        )
        .format(date)
    },

    statusLabel (status) {
      return {
        new:
          'New',

        in_progress:
          'In progress',

        resolved:
          'Resolved',

        closed:
          'Closed'
      }[status] || 'New'
    },

    statusColor (status) {
      return {
        new:
          'red',

        in_progress:
          'orange',

        resolved:
          'positive',

        closed:
          'grey'
      }[status] || 'grey'
    },

    // =====================================================
    // DESTROY LISTENERS
    // =====================================================

    stopFeedbackListener () {
      if (
        feedbackRef &&
        feedbackCallback
      ) {
        feedbackRef.off(
          'value',
          feedbackCallback
        )
      }

      feedbackRef = null
      feedbackCallback = null
    },

    stopMessagesListener () {
      if (
        messagesRef &&
        messagesCallback
      ) {
        messagesRef.off(
          'value',
          messagesCallback
        )
      }

      messagesRef = null
      messagesCallback = null
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
  width: min(1100px, 95vw);
  max-width: 1100px;

  height: min(850px, 92vh);

  overflow: hidden;

  border-radius: 12px;
}

.chat-header {
  height: 64px;

  background:
    linear-gradient(
      135deg,
      var(--q-primary),
      #075e54
    );
}

.chat-body {
  display: grid;

  grid-template-columns:
    350px minmax(0, 1fr);

  height:
    calc(
      min(850px, 92vh) - 64px
    );

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
  height:
    calc(
      min(850px, 92vh) - 129px
    );
}

.conversation-active {
  background:
    rgba(
      25,
      118,
      210,
      0.12
    );
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
    #efeae2;
}

.body--dark .messages-area {
  background:
    #111b21;
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

    max-width: 100vw;

    height: 100vh;

    border-radius: 0;
  }

  .chat-body {
    height:
      calc(
        100vh - 64px
      );

    grid-template-columns: 1fr;
  }

  .conversation-scroll {
    height:
      calc(
        100vh - 129px
      );
  }
}
</style>