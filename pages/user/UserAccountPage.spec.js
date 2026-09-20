import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { Quasar, QLayout, QPageContainer } from 'quasar'
import { createPinia, setActivePinia } from 'pinia'

import UserAccountPage from './UserAccountPage.vue'
import BtnComponent from '../../components/engine/BtnComponent.vue'
import InputComponent from '../../components/engine/InputComponent.vue'
import CardComponent from '../../components/engine/CardComponent.vue'
import TooltipComponent from '../../components/engine/TooltipComponent.vue'
import { HTTPAuth } from '../../services/api'
import { useUserStore } from '../../stores/UserStore'

let User
let post

const select = { name: 's-select', props: ['modelValue'], template: '<div class="stub-select" />' }

// q-page only renders inside a layout
function mountPage() {
  const host = mount(
    {
      components: { UserAccountPage, QLayout, QPageContainer },
      template: '<QLayout view="hHh lpR fFf"><QPageContainer><UserAccountPage /></QPageContainer></QLayout>'
    },
    {
      global: {
        plugins: [[Quasar, {}]],
        components: { 's-btn': BtnComponent, 's-input': InputComponent, 's-card': CardComponent, 's-tooltip': TooltipComponent, 's-select': select }
      },
      attachTo: document.body
    }
  )

  return host.findComponent(UserAccountPage)
}

const inBody = (selector) => document.body.querySelector(selector)

async function openSecurity(wrapper) {
  await wrapper.findAll('.q-tab').find(tab => tab.text().includes('Security')).trigger('click')
  await flushPromises()
}

beforeEach(() => {
  document.body.innerHTML = ''
  setActivePinia(createPinia())
  User = useUserStore()
  User.data = { id: 'u1', username: 'joao', email: 'joao@old.com', mobile: '+258841234567' }

  vi.spyOn(HTTPAuth, 'get').mockResolvedValue({ data: {} })
  post = vi.spyOn(HTTPAuth, 'post').mockResolvedValue({ data: {} })
  vi.spyOn(HTTPAuth, 'patch').mockResolvedValue({ data: {} })
})

describe('UserAccountPage - it is a page now', () => {
  it('renders as a page with its own title and no modal close bar', async () => {
    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.find('[data-test="account-title"]').text()).toContain('Profile')
    expect(wrapper.find('.q-page').exists()).toBe(true)
    expect(wrapper.find('.q-bar').exists()).toBe(false)
  })

  it('shows the current email read-only in the profile, pointing to where it changes', async () => {
    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.find('input[data-test="profile-email"]').element.value).toBe('joao@old.com')
    expect(wrapper.find('input[data-test="profile-email"]').attributes('readonly')).toBeDefined()

    await wrapper.find('[data-test="go-change-email"]').trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-test="change-email-card"]').exists()).toBe(true)
  })
})

describe('UserAccountPage - changing the email needs an OTP sent to the NEW address', () => {
  it('cannot send a code for an invalid or unchanged email', async () => {
    const wrapper = mountPage()
    await flushPromises()
    await openSecurity(wrapper)

    const input = wrapper.find('input[data-test="new-email"]')
    const send = () => wrapper.find('[data-test="send-email-code"]')

    expect(send().attributes('disabled')).toBeDefined()

    await input.setValue('not-an-email')
    expect(send().attributes('disabled')).toBeDefined()
    expect(wrapper.text()).toContain('Invalid email')

    await input.setValue('JOAO@old.com')
    expect(send().attributes('disabled')).toBeDefined()
  })

  it('sends the code to the new address (normalised) - and nothing changes yet', async () => {
    const wrapper = mountPage()
    await flushPromises()
    await openSecurity(wrapper)

    await wrapper.find('input[data-test="new-email"]').setValue('  Joao@New.com ')
    await wrapper.find('[data-test="send-email-code"]').trigger('click')
    await flushPromises()

    const [target, body] = post.mock.calls.at(-1)
    expect(target).toContain('profile/contact/otp/request/')
    expect(body).toEqual({ channel: 'email', identifier: 'joao@new.com' })
    expect(User.data.email).toBe('joao@old.com')
    // the confirmation dialog for that address is open
    expect(document.body.textContent).toContain('joao@new.com')
  })

  it('the email only changes once the code is confirmed', async () => {
    post.mockResolvedValueOnce({ data: {} })
    post.mockResolvedValueOnce({ data: { id: 'u1', email: 'joao@new.com', is_verified_email: true } })

    const wrapper = mountPage()
    await flushPromises()
    await openSecurity(wrapper)
    await wrapper.find('input[data-test="new-email"]').setValue('joao@new.com')
    await wrapper.find('[data-test="send-email-code"]').trigger('click')
    await flushPromises()

    await wrapper.vm.confirmContactOtp('123456')
    await flushPromises()

    const [target, body] = post.mock.calls.at(-1)
    expect(target).toContain('profile/contact/otp/confirm/')
    expect(body).toEqual({ channel: 'email', identifier: 'joao@new.com', otp: '123456' })
    expect(User.data.email).toBe('joao@new.com')
    expect(wrapper.vm.profileForm.email).toBe('joao@new.com')
    expect(wrapper.vm.newEmail).toBe('')
  })

  it('a wrong or expired code keeps the old email and says so', async () => {
    post.mockResolvedValueOnce({ data: {} })
    post.mockRejectedValueOnce({ response: { status: 400 } })

    const wrapper = mountPage()
    await flushPromises()
    await openSecurity(wrapper)
    await wrapper.find('input[data-test="new-email"]').setValue('joao@new.com')
    await wrapper.find('[data-test="send-email-code"]').trigger('click')
    await flushPromises()

    await wrapper.vm.confirmContactOtp('000000')
    await flushPromises()

    expect(User.data.email).toBe('joao@old.com')
    expect(wrapper.vm.contactOtpError).toBe('Invalid or expired code')
  })

  it('saving the profile never sends the email (the OTP flow is the only way)', async () => {
    const patch = vi.spyOn(User, 'updateProfile').mockResolvedValue({})
    const wrapper = mountPage()
    await flushPromises()

    await wrapper.vm.saveProfile()

    expect(patch).toHaveBeenCalledWith({ username: 'joao' })
    expect(JSON.stringify(patch.mock.calls)).not.toContain('email')
  })
})
