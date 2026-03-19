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
import { db } from '../services/firebase'
import { useAuthStore } from './storeAuth'

const crearGaraje = () => ({
  coche: null,
  pilotos: [],
  potenciadores: [],
})

export const useLigasStore = defineStore('ligas', {
  state: () => ({
    ligasDetalles: [],
    ligaActiva: null,
  }),

  actions: {
    /**
     * Crea una nueva liga con el nombre que proporcione el usuario, quien será el administrador.
     * 1. Verifica que el usuario no haya alcanzado el límite de ligas a las que puede pertenecer o crear (8).
     * 2. Verifica que el usuario no haya alcanzado el límite de ligas creadas como admin (2).
     * 3. Genera un código de invitación único para la liga.
     * 4. Crea la liga en Firestore y asigna al usuario como admin.
     * @param {String} nombreLiga - El nombre que el usuario quiere proporcionar a la liga.
     * @returns {Promise<{exito: boolean, mensaje: string}>} - Un objeto indicando si la creación fue exitosa y un mensaje descriptivo.
     */
    async crearLiga(nombreLiga) {
      const authStore = useAuthStore()
      const emailUsuario = authStore.usuarioGlobal.emailAuth
      // Evitamos sobrepasar el límite para no sobrecargar la vista de ligas del usuario y para mantener la experiencia manejable.
      if (authStore.usuarioGlobal.ligasIds && authStore.usuarioGlobal.ligasIds.length >= 8) {
        return {
          exito: false,
          mensaje: 'Solo puedes pertenecer o crear un máximo de 8 ligas.',
        }
      }

      try {
        // Busca cuántas participaciones tiene este usuario con el rol de 'admin' para limitar la creación a 2 ligas por usuario.
        const participacionesRef = collection(db, 'participaciones')
        const qAdmin = query(
          participacionesRef,
          where('email_usuario', '==', emailUsuario),
          where('rol', '==', 'admin'),
        )
        const snapAdmin = await getDocs(qAdmin)
        if (snapAdmin.size >= 2) {
          return {
            exito: false,
            mensaje: 'Reglamento FIA: Has alcanzado el límite máximo de 2 ligas creadas.',
          }
        }

        // Crea un código de invitación único para la liga y guarda la liga y la participación en Firestore con el usuario como admin.
        const codigoInvitacion = Math.random().toString(36).substring(2, 8).toUpperCase()
        const nuevaLiga = {
          nombre: nombreLiga,
          admin: authStore.usuarioGlobal.emailAuth,
          codigo_invitacion: codigoInvitacion,
          participantes: 1,
          fecha_creacion: new Date(),
        }
        const ligaDocRef = await addDoc(collection(db, 'ligas'), nuevaLiga)
        const ligaId = ligaDocRef.id

        const participante = {
          id_liga: ligaId,
          email_usuario: authStore.usuarioGlobal.emailAuth,
          rol: 'admin',
          presupuesto: 50.0,
          puntos: 0,
          garaje: crearGaraje(),
        }
        await addDoc(collection(db, 'participaciones'), participante)

        // Añade la liga al array de IDs del usuario en Firestore, actualiza la memoria local de Pinia y recarga las ligas del usuario para reflejar el cambio.
        const userRef = doc(db, 'usuarios', authStore.usuarioGlobal.emailAuth)
        await updateDoc(userRef, {
          ligasIds: arrayUnion(ligaId),
        })
        authStore.usuarioGlobal.ligasIds.push(ligaId)
        await this.cargarMisLigas()
        return { exito: true, mensaje: `Liga creada. Código: ${codigoInvitacion}` }
      } catch (error) {
        console.error('Error en crearLiga (storeLigas.js):', error)
        return { exito: false, mensaje: 'Error al crear la liga. Inténtalo de nuevo.' }
      }
    },

    /**
     * Carga las ligas a las que pertenece el usuario actualmente,
     * traduciendo los datos de Firestore a un formato más manejable para la aplicación.
     * 1. Verifica si el usuario tiene ligas a las que pertenece. Si no, limpia el estado de ligasDetalles.
     * 2. Si tiene ligas, obtiene los detalles de todas las ligas desde Firestore y filtra solo aquellas a las que el usuario pertenece.
     * @returns {Promise<void>} - No retorna nada, pero actualiza el estado de ligasDetalles con la información de las ligas del usuario.
     */
    async cargarMisLigas() {
      const authStore = useAuthStore()
      // Si el usuario no pertenece a ninguna liga, limpiamos el estado para evitar mostrar datos obsoletos.
      if (!authStore.usuarioGlobal.ligasIds.length) {
        this.ligasDetalles = []
        return
      }

      // Obtiene los detalles de las ligas y filtra las del usuario. Traduce los datos.
      try {
        const ligasRef = collection(db, 'ligas')
        const ligasSnap = await getDocs(ligasRef)
        const ligasData = ligasSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        this.ligasDetalles = ligasData.filter((liga) =>
          authStore.usuarioGlobal.ligasIds.includes(liga.id),
        )
      } catch (error) {
        console.error('Error en cargarMisLigas (storeLigas.js):', error)
        this.ligasDetalles = []
      }
    },

    /**
     * Permite al usuario unirse a una liga utilizando un código de invitación.
     * 1. Verifica que el usuario no haya alcanzado el límite de ligas a las que puede pertenecer o crear (8).
     * 2. Busca la liga correspondiente al código de invitación proporcionado.
     * 3. Realiza validaciones para asegurar que el código es válido y que el usuario no pertenece ya a esa liga.
     * 4. Si todo es correcto, crea una nueva participación para el usuario en esa liga, actualiza el contador de participantes y añade la liga al perfil del usuario.
     * @param {String} codigoInvitacion - El código de invitación que el usuario ha ingresado para unirse a la liga.
     * @returns {Promise<{exito: boolean, mensaje: string}>} - Retorna un objeto indicando el éxito de la operación y un mensaje descriptivo.
     */
    async unirseALiga(codigoInvitacion) {
      const authStore = useAuthStore()
      if (authStore.usuarioGlobal.ligasIds && authStore.usuarioGlobal.ligasIds.length >= 8) {
        return {
          exito: false,
          mensaje: 'Solo puedes pertenecer o crear un máximo de 8 ligas.',
        }
      }

      try {
        // Busca la liga correspondiente al código de invitación proporcionado.
        const codigoMayusculas = codigoInvitacion.toUpperCase()
        const ligasRef = collection(db, 'ligas')
        const q = query(ligasRef, where('codigo_invitacion', '==', codigoMayusculas))
        const querySnap = await getDocs(q)

        // Validaciones para asegurar que el código es válido y que el usuario no pertenece ya a esa liga.
        if (querySnap.empty) {
          return { exito: false, mensaje: 'Código de invitación no válido.' }
        }

        const ligaDoc = querySnap.docs[0]
        const ligaId = ligaDoc.id

        if (authStore.usuarioGlobal.ligasIds.includes(ligaId)) {
          return { exito: false, mensaje: 'Ya perteneces a esta liga.' }
        }

        // Si todo es correcto, crea una nueva participación para el usuario en esa liga,
        // actualiza el contador de participantes y añade la liga al perfil del usuario.
        const participacion = {
          id_liga: ligaId,
          email_usuario: authStore.usuarioGlobal.emailAuth,
          rol: 'miembro',
          presupuesto: 50.0,
          puntos: 0,
          garaje: crearGaraje(),
        }
        await addDoc(collection(db, 'participaciones'), participacion)

        const ligaRef = doc(db, 'ligas', ligaId)
        await updateDoc(ligaRef, {
          participantes: ligaDoc.data().participantes + 1,
        })

        const userRef = doc(db, 'usuarios', authStore.usuarioGlobal.emailAuth)
        await updateDoc(userRef, {
          ligasIds: arrayUnion(ligaId),
        })

        // Actualiza la memoria local de Pinia y recarga las ligas del usuario para reflejar el cambio.
        authStore.usuarioGlobal.ligasIds.push(ligaId)
        await this.cargarMisLigas()
        return { exito: true, mensaje: 'Te has unido a la liga.' }
      } catch (error) {
        console.error('Error en unirseALiga (storeLigas.js):', error)
        return { exito: false, mensaje: 'Error al unirse a la liga. Inténtalo de nuevo.' }
      }
    },

    /**
     * Permite al usuario abandonar una liga a la que pertenece.
     * 1. Si soy el único integrante, se elimina la liga entera.
     * 2. Si soy el admin, le paso la corona al líder de puntos.
     * 3. Si soy un usuario normal, solo resto el contador.
     * @param {String} ligaId - El ID de la liga que el usuario desea abandonar.
     * @returns {Promise<{exito: boolean, mensaje: string}>} - Retorna un objeto indicando el éxito de la operación y un mensaje descriptivo.
     */
    async abandonarLiga(ligaId) {
      const authStore = useAuthStore()
      const emailUsuario = authStore.usuarioGlobal.emailAuth
      try {
        // Elimina la participación del usuario en la liga
        const ligaRef = doc(db, 'ligas', ligaId)
        const ligaSnap = await getDoc(ligaRef)
        if (!ligaSnap.exists()) {
          return { exito: false, mensaje: 'La liga no existe.' }
        }
        const ligaData = ligaSnap.data()

        const participacionesRef = collection(db, 'participaciones')
        const qLiga = query(participacionesRef, where('id_liga', '==', ligaId))
        const participacionesSnap = await getDocs(qLiga)

        let miParticipacion = null
        const otrasParticipaciones = []

        participacionesSnap.forEach((doc) => {
          if (doc.data().email_usuario === emailUsuario) {
            miParticipacion = { id: doc.id, ...doc.data() }
          } else {
            otrasParticipaciones.push({ id: doc.id, ...doc.data() })
          }
        })
        if (!miParticipacion) return { exito: false, mensaje: 'No estás en esta liga.' }

        // Si soy el único integrante, se elimina la liga entera
        if (otrasParticipaciones.length === 0) {
          return await this.eliminarLiga(ligaId)
        }

        // Si soy el admin, le paso la corona al líder de puntos
        if (miParticipacion.rol === 'admin') {
          otrasParticipaciones.sort((a, b) => b.puntos - a.puntos)
          const nuevoAdmin = otrasParticipaciones[0]

          await updateDoc(doc(db, 'participaciones', nuevoAdmin.id), { rol: 'admin' })
          await updateDoc(ligaRef, {
            admin: nuevoAdmin.email_usuario,
            participantes: ligaData.participantes - 1,
          })
        } else {
          await updateDoc(ligaRef, { participantes: ligaData.participantes - 1 })
        }

        await deleteDoc(doc(db, 'participaciones', miParticipacion.id))
        const userRef = doc(db, 'usuarios', emailUsuario)
        await updateDoc(userRef, { ligasIds: arrayRemove(ligaId) })

        authStore.usuarioGlobal.ligasIds = authStore.usuarioGlobal.ligasIds.filter(
          (id) => id !== ligaId,
        )
        await this.cargarMisLigas()

        return { exito: true, mensaje: 'Has abandonado la liga.' }
      } catch (error) {
        console.error('Error al abandonar:', error)
        return { exito: false, mensaje: 'Error de telemetría al abandonar.' }
      }
    },
    /**
     * Elimina la liga entera y a todos los pilotos (Solo Admin)
     * 1. Verifica que el usuario sea el admin de la liga.
     * 2. Elimina todas las participaciones de los usuarios en la liga.
     * 3. Elimina la liga.
     * @param {String} ligaId - El ID de la liga que se desea eliminar.
     * @returns {Promise<{exito: boolean, mensaje: string}>} - Retorna un objeto indicando el éxito de la operación y un mensaje descriptivo.
     */
    async eliminarLiga(ligaId) {
      const authStore = useAuthStore()
      const email = authStore.usuarioGlobal.emailAuth

      try {
        const ligaRef = doc(db, 'ligas', ligaId)
        const ligaSnap = await getDoc(ligaRef)

        if (!ligaSnap.exists()) return { exito: false, mensaje: 'La liga no existe.' }
        if (ligaSnap.data().admin !== email)
          return { exito: false, mensaje: 'Acceso denegado: No eres la FIA (Admin).' }

        const participacionesRef = collection(db, 'participaciones')
        const qLiga = query(participacionesRef, where('id_liga', '==', ligaId))
        const participacionesSnap = await getDocs(qLiga)

        for (const particDoc of participacionesSnap.docs) {
          const particData = particDoc.data()
          const userRef = doc(db, 'usuarios', particData.email_usuario)
          await updateDoc(userRef, { ligasIds: arrayRemove(ligaId) })
          await deleteDoc(doc(db, 'participaciones', particDoc.id))
        }
        await deleteDoc(ligaRef)

        authStore.usuarioGlobal.ligasIds = authStore.usuarioGlobal.ligasIds.filter(
          (id) => id !== ligaId,
        )
        await this.cargarMisLigas()

        return { exito: true, mensaje: 'Campeonato disuelto con éxito.' }
      } catch (error) {
        console.error('Error al eliminar:', error)
        return { exito: false, mensaje: 'Error al destruir la liga.' }
      }
    },
  },
})
