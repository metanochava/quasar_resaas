import { createRouter, createWebHistory } from 'vue-router'
import routes from './routes'
import { installAuthGuard } from './authGuard'
import { installPageTitle } from '../services/pageTitle'

const Router = createRouter({
  history: createWebHistory(),
  routes
})

installAuthGuard(Router)
installPageTitle(Router)

export default Router