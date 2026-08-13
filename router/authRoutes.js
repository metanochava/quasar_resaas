


export const authRoutes = [
  {
    path: '/auth/',
    component: () => import('../layouts/AuthLayout.vue'),
    children: [
      { path: 'login', component: () => import('./../pages/auth/LoginPage.vue'), name: 'login' },
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