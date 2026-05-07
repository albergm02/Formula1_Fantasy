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

  console.log('Catálogo sembrado correctamente.')
}

sembrarCatalogo()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('✗ Error al sembrar catálogo:', error)
    process.exit(1)
  })
