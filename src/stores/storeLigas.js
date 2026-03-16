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
} from 'firebase/firestore'
import { db } from '../services/firebase'
import { useAuthStore } from './storeAuth'

/* Crea un garaje vacío para nuevos usuarios */
const crearGaraje = () => ({
  coche: null,
  pilotos: [],
  potenciadores: [],
})

export const useLigasStore = defineStore('ligas', {
  state: () => ({
    ligasDetalles: [],
  }),

  actions: {
    /* Crea una nueva liga y agrega al creador como participante */
    async crearLiga(nombreLiga) {
      const authStore = useAuthStore()
      const emailUsuario = authStore.usuarioGlobal.emailAuth

      try {
        const participacionesRef = collection(db, 'participaciones')
        // Busca cuántas participaciones tiene este usuario con el rol de 'admin'
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
        // Crea un código de invitación único para la liga
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

        // Crea el participante para el creador de la liga
        const participante = {
          id_liga: ligaId,
          email_usuario: authStore.usuarioGlobal.emailAuth,
          rol: 'admin',
          presupuesto: 50.0,
          puntos: 0,
          garaje: crearGaraje(),
        }
        await addDoc(collection(db, 'participaciones'), participante)

        // Actualiza el array de IDs del usuario en Firestore
        const userRef = doc(db, 'usuarios', authStore.usuarioGlobal.emailAuth)
        await updateDoc(userRef, {
          ligasIds: arrayUnion(ligaId),
        })

        // Actualiza la memoria local de Pinia
        authStore.usuarioGlobal.ligasIds.push(ligaId)
        await this.cargarMisLigas()

        return { exito: true, mensaje: `Liga creada. Código: ${codigoInvitacion}` }
      } catch (error) {
        console.error('Error en crearLiga (storeLigas.js):', error)
        return { exito: false, mensaje: 'Error al crear la liga. Inténtalo de nuevo.' }
      }
    },

    /* Carga las ligas a las que el usuario pertenece */
    async cargarMisLigas() {
      const authStore = useAuthStore()
      if (!authStore.usuarioGlobal.ligasIds.length) {
        this.ligasDetalles = []
        return
      }

      try {
        const ligasRef = collection(db, 'ligas')
        const ligasSnap = await getDocs(ligasRef)
        // Traduce los datos de Firestore a un formato más manejable
        const ligasData = ligasSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        // Filtra solo las ligas a las que el usuario pertenece
        this.ligasDetalles = ligasData.filter((liga) =>
          authStore.usuarioGlobal.ligasIds.includes(liga.id),
        )
      } catch (error) {
        console.error('Error en cargarMisLigas (storeLigas.js):', error)
        this.ligasDetalles = []
      }
    },

    /* Unirse a una liga existente usando el código de invitación */
    async unirseALiga(codigoInvitacion) {
      const authStore = useAuthStore()
      try {
        const codigoMayusculas = codigoInvitacion.toUpperCase()
        const ligasRef = collection(db, 'ligas')
        const q = query(ligasRef, where('codigo_invitacion', '==', codigoMayusculas))
        const querySnap = await getDocs(q)

        /* Validaciones:
                - El código de invitación debe ser válido (debe existir una liga con ese código)
                - El usuario no debe pertenecer ya a esa liga
            */
        if (querySnap.empty) {
          return { exito: false, mensaje: 'Código de invitación no válido.' }
        }

        const ligaDoc = querySnap.docs[0]
        const ligaId = ligaDoc.id

        if (authStore.usuarioGlobal.ligasIds.includes(ligaId)) {
          return { exito: false, mensaje: 'Ya perteneces a esta liga.' }
        }

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

        // Añadimos la liga al array de IDs del usuario en Firestore
        const userRef = doc(db, 'usuarios', authStore.usuarioGlobal.emailAuth)
        await updateDoc(userRef, {
          ligasIds: arrayUnion(ligaId),
        })

        // Actualizamos la memoria local de Pinia
        authStore.usuarioGlobal.ligasIds.push(ligaId)
        await this.cargarMisLigas()
        return { exito: true, mensaje: 'Te has unido a la liga.' }
      } catch (error) {
        console.error('Error en unirseALiga (storeLigas.js):', error)
        return { exito: false, mensaje: 'Error al unirse a la liga. Inténtalo de nuevo.' }
      }
    },
  },
})
