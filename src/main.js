import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'
import 'primeicons/primeicons.css'

import './assets/main.css'

const app = createApp(App)
const pinia = createPinia()

app.use(PrimeVue, { theme: { preset: Aura } })
app.use(pinia)
app.use(router)

app.mount('#app')
