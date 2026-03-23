/* eslint-disable */
const functions = require('firebase-functions')
const admin = require('firebase-admin')

// Inicializamos los poderes de Dios (Admin)
admin.initializeApp()
const db = admin.firestore()

// Creamos la URL mágica que activará el motor de puntuación
exports.motorDePuntos = functions.https.onRequest(async (req, res) => {
  try {
    console.log('🔥 INICIANDO EL PLAN: Extrayendo datos de OpenF1...')

    // 1. LLAMADA A LA API DE OPENF1
    // (Ajustaremos este endpoint exacto cuando analicemos el JSON de OpenF1)
    // const response = await fetch('https://api.openf1.org/v1/position?session_key=latest');
    // const posicionesF1 = await response.json();

    // Por ahora, simulamos el JSON que nos devolvería OpenF1 para probar la base de datos
    const mockResultados = {
      pilotos: {
        norris_t1: { posicion: 1, sectoresPurpura: 6 },
        verstappen_t1: { posicion: 2, sectoresPurpura: 1 },
        alonso_t1: { posicion: 3, sectoresPurpura: 0 }, // ¡El Nano en el podio!
      },
      coches: {
        mclaren: { abandonos: 0, pitstop: 2.1 },
        aston_martin: { abandonos: 0, pitstop: 2.4 },
      },
    }

    // 2. OBTENER TODAS LAS ESCUDERÍAS DE LA LIGA
    // Nota: Aquí pedimos todas, pero en el futuro podrías pasarle el ID de la liga por la URL: req.query.liga
    const participacionesSnapshot = await db.collection('participaciones').get()

    if (participacionesSnapshot.empty) {
      return res.status(404).send('🏁 No hay escuderías registradas para actualizar.')
    }

    // 3. CREAR EL LOTE (BATCH) PARA NO SATURAR LA BASE DE DATOS
    const batch = db.batch()
    let usuariosActualizados = 0

    participacionesSnapshot.forEach((doc) => {
      const data = doc.data()
      const garaje = data.garaje
      let puntosNuevos = 0

      // --- EVALUAR CHASIS ---
      if (garaje.coche) {
        const statsCoche = mockResultados.coches[garaje.coche.id]
        if (statsCoche && statsCoche.pitstop < 2.5) {
          puntosNuevos += 15 // Bonus por parada rápida
        }
      }

      // --- EVALUAR PILOTOS ---
      if (garaje.pilotos && garaje.pilotos.length > 0) {
        garaje.pilotos.forEach((piloto) => {
          // Limpiamos el sufijo _t1 o _t2 para buscar al piloto real en la API
          const idBase = piloto.id.replace('_t1', '').replace('_t2', '')

          // Buscamos al piloto en nuestro "JSON" de OpenF1 (simulado por ahora)
          // ej: busca "norris" dentro de "norris_t1"
          const statsPiloto = Object.entries(mockResultados.pilotos).find(([key]) =>
            key.includes(idBase),
          )

          if (statsPiloto) {
            const datosCarrera = statsPiloto[1]

            // Puntuación base: 20 pts al 1º, 19 al 2º...
            puntosNuevos += Math.max(0, 21 - datosCarrera.posicion)

            // Puntuación por habilidades específicas
            if (piloto.id === 'norris_t1' && datosCarrera.sectoresPurpura >= 5) {
              puntosNuevos += 8
            }
            if (piloto.id === 'alonso_t1' && datosCarrera.posicion <= 3) {
              puntosNuevos += 10 // Habilidad inventada por subir al podio
            }
          }
        })
      }

      // 4. PREPARAR LA SUMA SEGURA EN FIREBASE
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
