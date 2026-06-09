/**
 * Inicialización única del Admin SDK de Firebase.
 *
 * Centralizo la llamada a `initializeApp()` aquí para evitar el típico error
 * de "Firebase app already initialized" cuando varios módulos cargan el SDK.
 * El primer `require('./firebase')` lo inicializa; el resto reaprovecha la
 * misma instancia compartida.
 */

const { initializeApp, getApps } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')
const { getAuth } = require('firebase-admin/auth')

if (getApps().length === 0) {
  initializeApp()
}

const db = getFirestore()
const adminAuth = getAuth()

module.exports = { db, adminAuth }
