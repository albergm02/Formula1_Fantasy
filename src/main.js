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

const app = createApp(App) // Creo la instancia de la aplicación Vue
const gestorPinia = createPinia() // Creo la instancia del gestor global de estado Pinia

// "Enchufo" los plugins a la aplicación Vue
app.use(PrimeVue, { theme: { preset: Aura } })
app.use(gestorPinia)
app.use(router)
app.use(ToastService)
app.use(ConfirmationService)
app.directive('tooltip', Tooltip)

// La app se monta <-> cambia el estado de autenticación.
// Evito mostrar pantallas de carga o de error innecesarias.
let appMontada = false
// montaje diferido: se espera una respusta de firebase sobre la autenticacion antes de
// montar la app.
escucharCambioEstadoAutenticacion(() => {
  if (!appMontada) {
    app.mount('#app')
    appMontada = true
  }
})
