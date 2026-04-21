/**
 * seedCatalogo.js — Script standalone para sembrar el catálogo en Firestore.
 *
 * Construye el catálogo completo desde /functions/data/catalogoBase.js
 * (con los precios calculados por puntuación normalizada) y lo escribe
 * en la colección `catalogo` de Firestore con tres documentos:
 *   - catalogo/pilotos       → { items: [132 cartas], fechaSiembra }
 *   - catalogo/coches        → { items: [11 cartas], fechaSiembra }
 *   - catalogo/potenciadores → { items: [25 cartas], fechaSiembra }
 *
 * USO:
 *   1. Ejecuta el script con Application Default Credentials de gcloud:
 *        gcloud auth application-default login
 *        node functions/scripts/seedCatalogo.js
 *
 *   2. O bien con una clave de cuenta de servicio descargada:
 *        $env:GOOGLE_APPLICATION_CREDENTIALS = "C:\\ruta\\a\\clave.json"
 *        node functions/scripts/seedCatalogo.js
 *
 * Este script reemplaza al antiguo endpoint HTTP `seedCatalogoHttp`.
 * Solo es necesario ejecutarlo la primera vez y cuando cambien los datos
 * de pilotos / coches / potenciadores en /functions/data/catalogoBase.js.
 */

const { initializeApp, applicationDefault } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')
const { construirCatalogoCompleto } = require('../data/catalogoBase')

const PROJECT_ID = 'formula1-fantasy-ba348'

initializeApp({
  credential: applicationDefault(),
  projectId: PROJECT_ID,
})

const db = getFirestore()

async function sembrarCatalogo() {
  const { pilotos, coches, potenciadores } = construirCatalogoCompleto()
  const fechaSiembra = new Date().toISOString()

  const referencia = db.collection('catalogo')
  const batch = db.batch()
  batch.set(referencia.doc('pilotos'), { items: pilotos, fechaSiembra })
  batch.set(referencia.doc('coches'), { items: coches, fechaSiembra })
  batch.set(referencia.doc('potenciadores'), { items: potenciadores, fechaSiembra })
  await batch.commit()

  console.log('✓ Catálogo sembrado correctamente.')
  console.log(`  Pilotos:       ${pilotos.length}`)
  console.log(`  Coches:        ${coches.length}`)
  console.log(`  Potenciadores: ${potenciadores.length}`)
  console.log(`  Fecha:         ${fechaSiembra}`)
}

sembrarCatalogo()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('✗ Error al sembrar catálogo:', error)
    process.exit(1)
  })
