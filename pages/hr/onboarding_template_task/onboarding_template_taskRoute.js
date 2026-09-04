import { tdc } from '../../../services/translation.js'

export let onboarding_template_taskRoutes = [
  {
    path: '/list_onboardingtemplatetask',
    name: 'list_onboardingtemplatetask',
    component: () => import('./OnboardingTemplateTaskLPage.vue'),
    meta: {
      title: tdc('View of') + ' ' + tdc('onboarding template task'),
      requiresAuth: true,
      icon: 'list',
      requiredRole: 'list_onboardingtemplatetask',
    },
  },
  {
    path: '/add_onboardingtemplatetask',
    name: 'add_onboardingtemplatetask',
    component: () => import('./OnboardingTemplateTaskSEPage.vue'),
    meta: {
      title: tdc('Add') + ' ' + tdc('onboarding template task'),
      requiresAuth: true,
      icon: 'add',
      requiredRole: 'add_onboardingtemplatetask',
    },
  },
  {
    path: '/change_onboardingtemplatetask/:id',
    name: 'change_onboardingtemplatetask',
    component: () => import('./OnboardingTemplateTaskSEPage.vue'),
    meta: {
      title: tdc('Edit') + ' ' + tdc('onboarding template task'),
      requiresAuth: true,
      icon: 'edit',
      requiredRole: 'change_onboardingtemplatetask',
    },
  },
  {
    path: '/view_onboardingtemplatetask/:id',
    name: 'view_onboardingtemplatetask',
    component: () => import('./OnboardingTemplateTaskVPage.vue'),
    meta: {
      title: tdc('View') + ' ' + tdc('onboarding template task'),
      requiresAuth: true,
      icon: 'visibility',
      requiredRole: 'view_onboardingtemplatetask',
    },
  }
]
