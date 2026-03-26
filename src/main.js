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

const aplicacion = createApp(App)
const gestorPinia = createPinia()

aplicacion.use(PrimeVue, { theme: { preset: Aura } })
aplicacion.use(gestorPinia)
aplicacion.use(router)
aplicacion.use(ToastService)
aplicacion.use(ConfirmationService)

let aplicacionMontada = false

onAuthStateChanged(auth, () => {
  if (!aplicacionMontada) {
    aplicacion.mount('#app')
    aplicacionMontada = true
  }
})

