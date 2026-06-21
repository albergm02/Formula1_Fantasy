/**
 * Servicio de inicialización de Firebase.
 * Centraliza la configuración y exporta las instancias de Auth y Firestore.
 * Todos los módulos que necesitan interactuar con Firebase importan desde aquí.
 * @module servicioFirebase
 */

import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getFunctions } from 'firebase/functions'
import { getAnalytics, isSupported } from 'firebase/analytics'
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)

const claveRecaptcha = import.meta.env.VITE_RECAPTCHA_SITE_KEY
if (claveRecaptcha) {
  if (import.meta.env.DEV && import.meta.env.VITE_APPCHECK_DEBUG_TOKEN) {
    self.FIREBASE_APPCHECK_DEBUG_TOKEN = import.meta.env.VITE_APPCHECK_DEBUG_TOKEN
  }
  initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider(claveRecaptcha),
    isTokenAutoRefreshEnabled: true,
  })
}

const auth = getAuth(app)
const db = getFirestore(app)
const functions = getFunctions(app, 'europe-west1')

export { app, auth, db, functions }

isSupported().then((soportado) => {
  if (soportado) getAnalytics(app)
})
