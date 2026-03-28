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

import { auth } from './services/servicioFirebase'
import { escucharCambioEstadoAutenticacion } from './services/servicioAutenticacion'

const app = createApp(App)
const gestorPinia = createPinia()

app.use(PrimeVue, { theme: { preset: Aura } })
app.use(gestorPinia)
app.use(router)
app.use(ToastService)
app.use(ConfirmationService)

let appMontada = false

escucharCambioEstadoAutenticacion(() => {
  if (!appMontada) {
    app.mount('#app')
    appMontada = true
  }
})
