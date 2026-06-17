const { initializeApp, getApps } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')
const { getAuth } = require('firebase-admin/auth')

if (getApps().length === 0) {
  initializeApp()
}

const db = getFirestore()
const adminAuth = getAuth()

module.exports = { db, adminAuth }
