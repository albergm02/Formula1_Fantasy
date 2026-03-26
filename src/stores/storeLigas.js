import { defineStore } from 'pinia'
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  arrayUnion,
  arrayRemove,
  getDoc,
  deleteDoc,
} from 'firebase/firestore'
import { db } from '../services/servicioFirebase'
import { usarStoreAutenticacion } from './storeAutenticacion'
import { crearGarajeVacio } from '@/utils/garaje'
import { generarCodigoInvitacionLiga, alcanzoLimiteLigas } from '@/utils/ligas'

export const usarStoreLigas = defineStore('ligas', {
  state: () => ({
    detallesLigas: [],
    idLigaActiva: null,
  }),

  actions: {
    async crearLiga(nombreLiga) {
      const storeAutenticacion = usarStoreAutenticacion()
      const correoUsuario = storeAutenticacion.usuarioActual.correoAutenticacion

      if (alcanzoLimiteLigas(storeAutenticacion.usuarioActual.idsLigas)) {
        return {
          success: false,
          message: 'Solo puedes pertenecer o crear un mÃ¡ximo de 8 ligas.',
        }
      }

      try {
        const referenciaParticipaciones = collection(db, 'participaciones')
        const consultaAdministrador = query(
          referenciaParticipaciones,
          where('email_usuario', '==', correoUsuario),
          where('rol', '==', 'admin'),
        )
        const instantaneaAdministrador = await getDocs(consultaAdministrador)

        if (instantaneaAdministrador.size >= 2) {
          return {
            success: false,
            message: 'Reglamento FIA: Has alcanzado el lÃ­mite mÃ¡ximo de 2 ligas creadas.',
          }
        }

        const codigoInvitacion = generarCodigoInvitacionLiga()
        const nuevaLiga = {
          nombre: nombreLiga,
          admin: storeAutenticacion.usuarioActual.correoAutenticacion,
          codigo_invitacion: codigoInvitacion,
          participantes: 1,
          fecha_creacion: new Date(),
        }
        const documentoLiga = await addDoc(collection(db, 'ligas'), nuevaLiga)
        const idLiga = documentoLiga.id

        const participacion = {
          id_liga: idLiga,
          email_usuario: storeAutenticacion.usuarioActual.correoAutenticacion,
          rol: 'admin',
          presupuesto: 50.0,
          puntos: 0,
          garaje: crearGarajeVacio(),
        }
        await addDoc(collection(db, 'participaciones'), participacion)

        const referenciaUsuario = doc(db, 'usuarios', storeAutenticacion.usuarioActual.correoAutenticacion)
        await updateDoc(referenciaUsuario, {
          ligasIds: arrayUnion(idLiga),
        })
        storeAutenticacion.usuarioActual.idsLigas.push(idLiga)
        await this.cargarLigasUsuario()
        return { success: true, message: `Liga creada. CÃ³digo: ${codigoInvitacion}` }
      } catch (error) {
        console.error('Error in crearLiga (storeLigas.js):', error)
        return { success: false, message: 'Error al crear la liga. IntÃ©ntalo de nuevo.' }
      }
    },

    async cargarLigasUsuario() {
      const storeAutenticacion = usarStoreAutenticacion()

      if (!storeAutenticacion.usuarioActual.idsLigas.length) {
        this.detallesLigas = []
        return
      }

      try {
        const referenciaLigas = collection(db, 'ligas')
        const instantaneaLigas = await getDocs(referenciaLigas)
        const datosLigas = instantaneaLigas.docs.map((documentoLiga) => ({
          id: documentoLiga.id,
          ...documentoLiga.data(),
        }))
        this.detallesLigas = datosLigas.filter((liga) =>
          storeAutenticacion.usuarioActual.idsLigas.includes(liga.id),
        )
      } catch (error) {
        console.error('Error in cargarLigasUsuario (storeLigas.js):', error)
        this.detallesLigas = []
      }
    },

    async unirseALiga(codigoInvitacion) {
      const storeAutenticacion = usarStoreAutenticacion()

      if (alcanzoLimiteLigas(storeAutenticacion.usuarioActual.idsLigas)) {
        return {
          success: false,
          message: 'Solo puedes pertenecer o crear un mÃ¡ximo de 8 ligas.',
        }
      }

      try {
        const codigoInvitacionNormalizado = codigoInvitacion.toUpperCase()
        const referenciaLigas = collection(db, 'ligas')
        const consultaLiga = query(referenciaLigas, where('codigo_invitacion', '==', codigoInvitacionNormalizado))
        const instantaneaConsulta = await getDocs(consultaLiga)

        if (instantaneaConsulta.empty) {
          return { success: false, message: 'CÃ³digo de invitaciÃ³n no vÃ¡lido.' }
        }

        const documentoLiga = instantaneaConsulta.docs[0]
        const idLiga = documentoLiga.id

        if (storeAutenticacion.usuarioActual.idsLigas.includes(idLiga)) {
          return { success: false, message: 'Ya perteneces a esta liga.' }
        }

        const participacion = {
          id_liga: idLiga,
          email_usuario: storeAutenticacion.usuarioActual.correoAutenticacion,
          rol: 'miembro',
          presupuesto: 50.0,
          puntos: 0,
          garaje: crearGarajeVacio(),
        }
        await addDoc(collection(db, 'participaciones'), participacion)

        const referenciaLiga = doc(db, 'ligas', idLiga)
        await updateDoc(referenciaLiga, {
          participantes: documentoLiga.data().participantes + 1,
        })

        const referenciaUsuario = doc(db, 'usuarios', storeAutenticacion.usuarioActual.correoAutenticacion)
        await updateDoc(referenciaUsuario, {
          ligasIds: arrayUnion(idLiga),
        })

        storeAutenticacion.usuarioActual.idsLigas.push(idLiga)
        await this.cargarLigasUsuario()
        return { success: true, message: 'Te has unido a la liga.' }
      } catch (error) {
        console.error('Error in unirseALiga (storeLigas.js):', error)
        return { success: false, message: 'Error al unirse a la liga. IntÃ©ntalo de nuevo.' }
      }
    },

    async abandonarLiga(idLiga) {
      const storeAutenticacion = usarStoreAutenticacion()
      const correoUsuario = storeAutenticacion.usuarioActual.correoAutenticacion

      try {
        const referenciaLiga = doc(db, 'ligas', idLiga)
        const instantaneaLiga = await getDoc(referenciaLiga)
        if (!instantaneaLiga.exists()) {
          return { success: false, message: 'La liga no existe.' }
        }
        const datosLiga = instantaneaLiga.data()

        const referenciaParticipaciones = collection(db, 'participaciones')
        const consultaLiga = query(referenciaParticipaciones, where('id_liga', '==', idLiga))
        const instantaneaParticipaciones = await getDocs(consultaLiga)

        let participacionActual = null
        const participacionesRestantes = []

        instantaneaParticipaciones.forEach((documentoParticipacion) => {
          if (documentoParticipacion.data().email_usuario === correoUsuario) {
            participacionActual = { id: documentoParticipacion.id, ...documentoParticipacion.data() }
          } else {
            participacionesRestantes.push({ id: documentoParticipacion.id, ...documentoParticipacion.data() })
          }
        })

        if (!participacionActual) {
          return { success: false, message: 'No estÃ¡s en esta liga.' }
        }

        if (participacionesRestantes.length === 0) {
          return await this.eliminarLiga(idLiga)
        }

        if (participacionActual.rol === 'admin') {
          participacionesRestantes.sort((primerParticipante, segundoParticipante) => {
            return segundoParticipante.puntos - primerParticipante.puntos
          })
          const siguienteAdministrador = participacionesRestantes[0]

          await updateDoc(doc(db, 'participaciones', siguienteAdministrador.id), { rol: 'admin' })
          await updateDoc(referenciaLiga, {
            admin: siguienteAdministrador.email_usuario,
            participantes: datosLiga.participantes - 1,
          })
        } else {
          await updateDoc(referenciaLiga, { participantes: datosLiga.participantes - 1 })
        }

        await deleteDoc(doc(db, 'participaciones', participacionActual.id))
        const referenciaUsuario = doc(db, 'usuarios', correoUsuario)
        await updateDoc(referenciaUsuario, { ligasIds: arrayRemove(idLiga) })

        storeAutenticacion.usuarioActual.idsLigas = storeAutenticacion.usuarioActual.idsLigas.filter(
          (id) => id !== idLiga,
        )

        if (this.idLigaActiva === idLiga) {
          this.idLigaActiva = null
        }

        await this.cargarLigasUsuario()

        return { success: true, message: 'Has abandonado la liga.' }
      } catch (error) {
        console.error('Error in abandonarLiga (storeLigas.js):', error)
        return { success: false, message: 'Error de telemetrÃ­a al abandonar.' }
      }
    },

    async eliminarLiga(idLiga) {
      const storeAutenticacion = usarStoreAutenticacion()
      const correoUsuario = storeAutenticacion.usuarioActual.correoAutenticacion

      try {
        const referenciaLiga = doc(db, 'ligas', idLiga)
        const instantaneaLiga = await getDoc(referenciaLiga)

        if (!instantaneaLiga.exists()) {
          return { success: false, message: 'La liga no existe.' }
        }

        if (instantaneaLiga.data().admin !== correoUsuario) {
          return { success: false, message: 'Acceso denegado: No eres la FIA (Admin).' }
        }

        const referenciaParticipaciones = collection(db, 'participaciones')
        const consultaLiga = query(referenciaParticipaciones, where('id_liga', '==', idLiga))
        const instantaneaParticipaciones = await getDocs(consultaLiga)

        for (const documentoParticipacion of instantaneaParticipaciones.docs) {
          const datosParticipacion = documentoParticipacion.data()
          const referenciaUsuario = doc(db, 'usuarios', datosParticipacion.email_usuario)
          await updateDoc(referenciaUsuario, { ligasIds: arrayRemove(idLiga) })
          await deleteDoc(doc(db, 'participaciones', documentoParticipacion.id))
        }

        await deleteDoc(referenciaLiga)

        storeAutenticacion.usuarioActual.idsLigas = storeAutenticacion.usuarioActual.idsLigas.filter(
          (id) => id !== idLiga,
        )

        if (this.idLigaActiva === idLiga) {
          this.idLigaActiva = null
        }

        await this.cargarLigasUsuario()

        return { success: true, message: 'Campeonato disuelto con Ã©xito.' }
      } catch (error) {
        console.error('Error in eliminarLiga (storeLigas.js):', error)
        return { success: false, message: 'Error al destruir la liga.' }
      }
    },
  },
})



