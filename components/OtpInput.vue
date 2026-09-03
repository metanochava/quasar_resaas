<template>
  <div class="otp-input row justify-center q-gutter-x-sm">
    <input
      v-for="(digit, i) in boxes"
      :key="i"
      :ref="el => setRef(el, i)"
      :value="boxes[i]"
      type="text"
      inputmode="numeric"
      autocomplete="one-time-code"
      maxlength="1"
      class="otp-box"
      :class="{ 'otp-box--dark': $q.dark.isActive }"
      @input="onInput(i, $event)"
      @keydown="onKeydown(i, $event)"
      @paste="onPaste"
      @focus="$event.target.select()"
    />
  </div>
</template>

<script>
import { defineComponent } from 'vue'

// A small, dependency-free segmented OTP input - typing advances focus,
// backspace on an empty box moves back, pasting a full code fills every
// box at once. v-model is the plain concatenated digit string.
export default defineComponent({
  name: 'OtpInput',

  props: {
    modelValue: { type: String, default: '' },
    length: { type: Number, default: 6 }
  },

  emits: ['update:modelValue', 'complete'],

  data () {
    return {
      boxes: this.splitValue(this.modelValue),
      refs: []
    }
  },

  watch: {
    modelValue (val) {
      const next = this.splitValue(val)
      if (next.join('') !== this.boxes.join('')) this.boxes = next
    }
  },

  mounted () {
    this.refs[0]?.focus()
  },

  methods: {
    splitValue (val) {
      return Array.from({ length: this.length }, (_, i) => (val || '')[i] || '')
    },

    setRef (el, i) {
      if (el) this.refs[i] = el
    },

    emitValue () {
      const value = this.boxes.join('')
      this.$emit('update:modelValue', value)
      if (value.length === this.length && !value.includes('')) {
        this.$emit('complete', value)
      }
    },

    onInput (i, event) {
      const digit = event.target.value.replace(/\D/g, '').slice(-1)
      this.boxes[i] = digit
      event.target.value = digit
      this.emitValue()
      if (digit && i < this.length - 1) this.refs[i + 1]?.focus()
    },

    onKeydown (i, event) {
      if (event.key === 'Backspace' && !this.boxes[i] && i > 0) {
        this.boxes[i - 1] = ''
        this.emitValue()
        this.refs[i - 1]?.focus()
      } else if (event.key === 'ArrowLeft' && i > 0) {
        this.refs[i - 1]?.focus()
      } else if (event.key === 'ArrowRight' && i < this.length - 1) {
        this.refs[i + 1]?.focus()
      }
    },

    onPaste (event) {
      const text = (event.clipboardData?.getData('text') || '').replace(/\D/g, '')
      if (!text) return

      event.preventDefault()
      this.boxes = this.splitValue(text)
      this.emitValue()

      const nextEmpty = this.boxes.findIndex(b => !b)
      this.refs[nextEmpty === -1 ? this.length - 1 : nextEmpty]?.focus()
    }
  }
})
</script>

<style scoped>
.otp-box {
  width: 42px;
  height: 52px;
  text-align: center;
  font-size: 1.4rem;
  font-weight: 600;
  border: 1px solid rgba(0, 0, 0, 0.24);
  border-radius: 8px;
  outline: none;
  background: #fff;
  transition: border-color 0.15s ease;
}

.otp-box:focus {
  border-color: #1976d2;
  border-width: 2px;
}

.otp-box--dark {
  border-color: rgba(255, 255, 255, 0.24);
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
}
</style>
