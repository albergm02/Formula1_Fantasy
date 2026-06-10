import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

import PrimeVue from 'primevue/config'
import ToastService from 'primevue/toastservice'
import ConfirmationService from 'primevue/confirmationservice'
import Tooltip from 'primevue/tooltip'
import Aura from '@primevue/themes/aura'

import 'primeicons/primeicons.css'
import './assets/main.css'

import { escucharCambioEstadoAutenticacion } from './services/servicioAutenticacion'

const app = createApp(App)
const gestorPinia = createPinia()

app.use(PrimeVue, { theme: { preset: Aura } })
app.use(gestorPinia)
app.use(router)
app.use(ToastService)
app.use(ConfirmationService)
app.directive('tooltip', Tooltip)

// Montaje diferido: espero la primera respuesta de Firebase sobre el estado
// de autenticación antes de montar la app, evitando un parpadeo entre vista
// pública y vista privada.
let appMontada = false
escucharCambioEstadoAutenticacion(() => {
  if (!appMontada) {
    app.mount('#app')
    appMontada = true
  }
})
