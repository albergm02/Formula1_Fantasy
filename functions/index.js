/* eslint-disable */
const functions = require('firebase-functions')
const admin = require('firebase-admin')
admin.initializeApp()
const db = admin.firestore()

exports.motorDePuntos = functions.https.onRequest(async (req, res) => {
  try {
    console.log('🔥 INICIANDO EL PLAN: Extrayendo datos de OpenF1...')
    const mockResultados = {
      pilotos: {
        norris_t1: { posicion: 1, sectoresPurpura: 6 },
        verstappen_t1: { posicion: 2, sectoresPurpura: 1 },
        alonso_t1: { posicion: 3, sectoresPurpura: 0 }, 
      },
      coches: {
        mclaren: { abandonos: 0, pitstop: 2.1 },
        aston_martin: { abandonos: 0, pitstop: 2.4 },
      },
    }

    const participacionesSnapshot = await db.collection('participaciones').get()

    if (participacionesSnapshot.empty) {
      return res.status(404).send('🏁 No hay escuderías registradas para actualizar.')
    }

    const batch = db.batch()
    let usuariosActualizados = 0

    participacionesSnapshot.forEach((doc) => {
      const data = doc.data()
      const garaje = data.garaje
      let puntosNuevos = 0

      if (garaje.coche) {
        const statsCoche = mockResultados.coches[garaje.coche.id]
        if (statsCoche && statsCoche.pitstop < 2.5) {
          puntosNuevos += 15 
        }
      }

      if (garaje.pilotos && garaje.pilotos.length > 0) {
        garaje.pilotos.forEach((piloto) => {

          const idBase = piloto.id.replace('_t1', '').replace('_t2', '')

          const statsPiloto = Object.entries(mockResultados.pilotos).find(([key]) =>
            key.includes(idBase),
          )

          if (statsPiloto) {
            const datosCarrera = statsPiloto[1]

            puntosNuevos += Math.max(0, 21 - datosCarrera.posicion)

            if (piloto.id === 'norris_t1' && datosCarrera.sectoresPurpura >= 5) {
              puntosNuevos += 8
            }
            if (piloto.id === 'alonso_t1' && datosCarrera.posicion <= 3) {
              puntosNuevos += 10 
            }
          }
        })
      }

      if (puntosNuevos > 0) {
        const docRef = db.collection('participaciones').doc(doc.id)
        batch.update(docRef, {
          puntos: admin.firestore.FieldValue.increment(puntosNuevos),
        })
        usuariosActualizados++
      }
    })

    // 5. ENVIAR TODO DE GOLPE A FIREBASE
    if (usuariosActualizados > 0) {
      await batch.commit()
      res
        .status(200)
        .send(
          `✅ EL PLAN COMPLETADO: Se han actualizado los puntos de ${usuariosActualizados} escuderías.`,
        )
    } else {
      res.status(200).send(`⚠️ Carrera procesada, pero nadie sumó puntos esta semana.`)
    }
  } catch (error) {
    console.error('❌ Error grave en el Motor de Puntos:', error)
    res.status(500).send('Error interno calculando puntos. Revisa los logs de Firebase.')
  }
})
