import { tdc } from '../../../services/translation.js'

export let onboarding_templateRoutes = [
  {
    path: '/list_onboardingtemplate',
    name: 'list_onboardingtemplate',
    component: () => import('./OnboardingTemplateLPage.vue'),
    meta: {
      title: tdc('View of') + ' ' + tdc('onboarding template'),
      requiresAuth: true,
      icon: 'list',
      requiredRole: 'list_onboardingtemplate',
    },
  },
  {
    path: '/add_onboardingtemplate',
    name: 'add_onboardingtemplate',
    component: () => import('./OnboardingTemplateSEPage.vue'),
    meta: {
      title: tdc('Add') + ' ' + tdc('onboarding template'),
      requiresAuth: true,
      icon: 'add',
      requiredRole: 'add_onboardingtemplate',
    },
  },
  {
    path: '/change_onboardingtemplate/:id',
    name: 'change_onboardingtemplate',
    component: () => import('./OnboardingTemplateSEPage.vue'),
    meta: {
      title: tdc('Edit') + ' ' + tdc('onboarding template'),
      requiresAuth: true,
      icon: 'edit',
      requiredRole: 'change_onboardingtemplate',
    },
  },
  {
    path: '/view_onboardingtemplate/:id',
    name: 'view_onboardingtemplate',
    component: () => import('./OnboardingTemplateVPage.vue'),
    meta: {
      title: tdc('View') + ' ' + tdc('onboarding template'),
      requiresAuth: true,
      icon: 'visibility',
      requiredRole: 'view_onboardingtemplate',
    },
  }
]
