import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

import PrimeVue from 'primevue/config'
import ToastService from 'primevue/toastservice'
import ConfirmationService from 'primevue/confirmationservice'
import Aura from '@primevue/themes/aura'

import 'primeicons/primeicons.css'
import './assets/main.css'

import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './services/servicioFirebase'

const app = createApp(App)
const pinia = createPinia()

app.use(PrimeVue, { theme: { preset: Aura } })
app.use(pinia)
app.use(router)
app.use(ToastService)
app.use(ConfirmationService)

let appMounted = false

onAuthStateChanged(auth, () => {
  if (!appMounted) {
    app.mount('#app')
    appMounted = true
  }
})

