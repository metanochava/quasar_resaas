


export const authRoutes = [
  // '/': the public site of this host's EntityType (services/entityTypeSites.js),
  // in the login's layout. First, so it wins over the MainLayout parents that
  // also match '/'.
  {
    path: '/',
    component: () => import('../layouts/AuthLayout.vue'),
    children: [
      { path: '', component: () => import('../pages/EntityTypeSitePage.vue'), name: 'site' },
    ],
  },
  // compatibility: reset links e-mailed before the backend built them on the
  // real route (/#/resetpassword/<uidb64>/<token>?redirect_url=) - keep them
  // working; the query string is dropped
  {
    path: '/resetpassword/:uidb64/:token',
    redirect: to => ({ name: 'resetPasswordConfirm', params: to.params }),
  },
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
  // there is no '/home' any more (WelcomeGuestPage was removed): the site at
  // '/' handles signed-in users too; '/home' is a "not found" like any other

]