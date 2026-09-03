


export const authRoutes = [
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
      { path: '/welcome', component: () => import('./../pages/WelcomeGuestPage.vue'), name: 'welcome' }
    ],
  },

]