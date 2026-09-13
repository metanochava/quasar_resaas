import { createRouter, createWebHistory } from 'vue-router'
import routes from './routes'
import { installAuthGuard } from './authGuard'

const Router = createRouter({
  history: createWebHistory(),
  routes
})

installAuthGuard(Router)

export default Router