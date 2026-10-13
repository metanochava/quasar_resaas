


export const authRoutes = [
  // '/': the public site of this host's EntityType (services/entityTypeSites.js).
  // First, so it wins over the MainLayout parents that also match '/'.
  { path: '/', component: () => import('../pages/EntityTypeSitePage.vue'), name: 'site' },
  {
    path: '/auth/',
    component: () => import('../layouts/AuthLayout.vue'),
    children: [
      { path: 'login', component: () => import('./../pages/auth/LoginPage.vue'), name: 'login' },
      { path: 'register', component: () => import('./../pages/auth/RegisterPage.vue'), name: 'registarUser' },
      { path: 'forgot-password', component: () => import('./../pages/auth/ForgotPasswordPage.vue'), name: 'esquecerpassword' },
      { path: 'resetpassword/:uidb64/:token', component: () => import('./../pages/auth/ResetPasswordConfirmPage.vue'), name: 'resetPasswordConfirm' },
    ],
  },
  {
    path: '/',
    component: () => import('../layouts/MainLayout.vue'),
    children: [
      { 
        // the signed-in user's start page while it has no Entity yet
        // (was '/welcome' / name 'welcome')
        path: '/home',
        component: () => import('./../pages/WelcomeGuestPage.vue'),
        name: 'home'
      }
    ],
  },

]