import { defineStore } from 'pinia'

/* Comenzamos con importaciones a Firebase */
import { collection, doc, getDoc, query, setDoc } from 'firebase/firestore'
import { db } from '../services/firebase'

const crearGarajeVacio = () => ({
  coche: null,
  pilotos: [],
  potenciadores: [],
})

export const useFantasyStore = defineStore('fantasy', {
  state: () => ({
    usuarioGlobal: {
      emailAuth: '',
      nombre: '',
      ligasIds: [],
    },

    /* Información de las ligas */
    ligasDetalles: [],

    /* Liga en la que el usuario ha entrado */
    ligaActivaId: null,
    participacionActivaId: null,

    usuario: {
      presupuesto: 100.0,
      puntos: 0,
    },
    garaje: crearGarajeVacio(),

    datosCargados: false,
  }),

  actions: {
    /* Comienzo de conexión con Firebase global */
    async inicializarDatosGlobales(emailUsuario, nombreUsuario = 'Piloto') {
      try {
        this.usuarioGlobal.emailAuth = emailUsuario
        const idUsuario = emailUsuario
        const docRef = doc(db, 'usuarios', idUsuario)
        const docSnap = await getDoc(docRef)

        /* Si el usuario existe */
        if (docSnap.exists()) {
          this.usuarioGlobal = docSnap.data()
        } else {
          this.usuarioGlobal.nombre = nombreUsuario
          this.usuarioGlobal.ligasIds = []
          await setDoc(docRef, this.usuarioGlobal)
        }
        await this.cargarLigas()
        this.datosCargados = true
      } catch (error) {
        console.error('Error al inicializar los datos:', error)
      }
      this.datosCargados = true
    },

    /* Cargar nombres y participantes de las ligas a las que el usuario pertenece */
    async cargarLigas() {
      if (!this.usuarioGlobal.ligasIds.length) {
        this.ligasDetalles = []
        return
      }

      try {
        const ligasRef = collection(db, 'ligas')
        const ligasSnapshot = await getDocs(ligasRef)
        const ligasData = ligasSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        this.ligasDetalles = ligasData.filter((liga) =>
          this.usuarioGlobal.ligasIds.includes(liga.id),
        )
      } catch (error) {
        console.error('Error al cargar las ligas:', error)
      }
    },

    /* GUARDADO DE DATOS EN FIREBASE */

    async guardarDatosEnFirebase() {
      if (!this.ligaActivaId || !this.participacionActivaId) return

      try {
        const participacionRef = doc(db, 'participaciones', this.participacionActivaId)
        await updateDoc(participacionRef, {
          presupuesto: this.usuario.presupuesto,
          puntos: this.usuario.puntos,
          garaje: this.garaje,
        })
      } catch (error) {
        console.error('Error al guardar los datos en Firebase:', error)
      }
    },

    async crearLiga(nombreLiga) {
      try {
        const codigoInv = Math.random().toString(36).substring(2, 8).toUpperCase()
        const nuevaLiga = {
          nombre: nombreLiga,
          admin: this.usuarioGlobal.emailAuth,
          codigoInvitacion: codigoInv,
          participantes: 1,
          fecha_Creacion: new Date(),
        }
        const ligaDocRef = await addDoc(collection(db, 'ligas'), nuevaLiga)
        const ligaId = ligaDocRef.id

        const participacionAdministrador = {
          id_liga: ligaId,
          email_usuario: this.usuarioGlobal.emailAuth,
          rol: 'admin',
          presupuesto: 50.0,
          puntos: 0,
          garaje: this.garaje,
        }
        await addDoc(collection(db, 'participaciones'), participacionAdministrador)

        const userRef = doc(db, 'usuarios', this.usuarioGlobal.emailAuth)
        await updateDoc(userRef, {
          ligasIds: [...this.usuarioGlobal.ligasIds, ligaId],
        })

        this.usuarioGlobal.ligasIds.push(ligaId)
        await this.cargarLigas()
        return { exito: true, mensaje: 'Liga creada exitosamente.' }
      } catch (error) {
        console.error('Error al crear la liga:', error)
        return { exito: false, mensaje: 'Error al crear la liga. Inténtalo de nuevo.' }
      }
    },

    async unirseLiga(codigoInvitacion) {
      try {
        const codigoMayus = codigoInvitacion.toUpperCase()

        const ligasRef = collection(db, 'ligas')
        const q = query(ligasRef, where('codigo_invitacion', '==', codigoMayus))
        const snapshot = await getDocs(q)

        if (snapshot.empty) {
          return { exito: false, mensaje: 'Código de liga no válido o caducado.' }
        }

        const docLiga = snapshot.docs[0]
        const idLiga = docLiga.id

        if (this.usuarioGlobal.ligasIds.includes(idLiga)) {
          return { exito: false, mensaje: 'Ya perteneces a esta liga.' }
        }

        const nuevaParticipacion = {
          id_liga: idLiga,
          email_usuario: this.usuarioGlobal.emailAuth,
          rol: 'miembro',
          presupuesto: 50.0,
          puntos: 0,
          garaje: crearGarajeInicial(),
        }
        await addDoc(collection(db, 'participaciones'), nuevaParticipacion)

        const ligaRef = doc(db, 'ligas', idLiga)
        await updateDoc(ligaRef, {
          participantes: docLiga.data().participantes + 1,
        })

        const userRef = doc(db, 'usuarios', this.usuarioGlobal.emailAuth)
        await updateDoc(userRef, {
          ligasIds: arrayUnion(idLiga),
        })

        this.usuarioGlobal.ligasIds.push(idLiga)
        await this.cargarMisLigas()

        return { exito: true, mensaje: `¡Bienvenido a la liga ${docLiga.data().nombre}!` }
      } catch (error) {
        console.error('Error al unirse a la liga:', error)
        return { exito: false, mensaje: 'Error en los servidores de telemetría.' }
      }
    },

    /* entrar en una liga */
    async entrarALiga(ligaId) {
      try {
        this.ligaActivaId = ligaId
        const participacionesRef = collection(db, 'participaciones')

        const q = query(
          participacionesRef,
          where('id_liga', '==', ligaId),
          where('email_usuario', '==', this.usuarioGlobal.emailAuth),
        )
        const querySnapshot = await getDocs(q)

        if (!querySnapshot.empty) {
          const participacionDoc = querySnapshot.docs[0]
          this.participacionActivaId = participacionDoc.id
          const datosParticipacion = participacionDoc.data()
          this.usuario = datosParticipacion.usuario
          this.garaje = datosParticipacion.garaje
        }
      } catch (error) {
        console.error('Error al entrar en la liga:', error)
      }
    },

    /**
     * Fichar un elemento (coche, piloto o potenciador)
     * Antes de fichar, se realizan varias comprobaciones:
     * - Presupuesto suficiente
     * - No tener ya un coche (si el elemento es un coche)
     * - No tener ya 2 pilotos (si el elemento es un piloto)
     * Si todo es correcto, se descuenta el presupuesto, se añade el elemento al garaje y se guardan los datos en Firebase
     */
    async fichar(elemento) {
      if (this.usuario.presupuesto < elemento.precio) {
        return { exito: false, mensaje: 'Presupuesto insuficiente.' }
      }

      if (elemento.tipo === 'coche' && this.garaje.coche) {
        return { exito: false, mensaje: 'Ya tienes un coche. Véndelo primero.' }
      }

      if (elemento.tipo === 'piloto' && this.garaje.pilotos.length >= 2) {
        return { exito: false, mensaje: 'Asientos ocupados. Despide a un piloto primero.' }
      }

      /* Si todo es correcto, se descuenta el presupuesto, se añade el elemento al garaje y se guardan los datos en Firebase */
      this.usuario.presupuesto = Number((this.usuario.presupuesto - elemento.precio).toFixed(1))
      const adquisicion = { ...elemento, idInstancia: Date.now() }

      /* Dependiendo del tipo de elemento, se añade a la sección correspondiente del garaje */
      if (elemento.tipo === 'coche') this.garaje.coche = adquisicion
      if (elemento.tipo === 'piloto') this.garaje.pilotos.push(adquisicion)
      if (elemento.tipo === 'potenciador') {
        adquisicion.equipado = false
        this.garaje.potenciadores.push(adquisicion)
      }

      /* Guardamos los datos en Firebase después de cada acción */
      await this.guardarDatosEnFirebase()
      return { exito: true, mensaje: `Fichaje de ${elemento.nombre} completado.` }
    },

    /**
     * Vender un coche:
     * - Solo se puede vender si se tiene un coche en el garaje
     * - Se suma el precio del coche al presupuesto del usuario
     * - Se elimina el coche del garaje
     * - Se guardan los datos en Firebase
     * - Se desequipan las mejoras equipadas (si las hubiera), ya que no se pueden mantener sin un coche
     */
    async venderCoche() {
      if (!this.garaje.coche) return

      this.usuario.presupuesto = Number(
        (this.usuario.presupuesto + this.garaje.coche.precio).toFixed(1),
      )
      this.garaje.coche = null

      this.garaje.potenciadores.forEach((p) => (p.equipado = false))
      await this.guardarDatosEnFirebase()
    },

    /**
     * Despedir a un piloto:
     * - Solo se puede despedir si el piloto existe en el garaje
     * - Se suma el precio del piloto al presupuesto del usuario
     * - Se elimina el piloto del garaje
     * - Se guardan los datos en Firebase
     */
    async despedirPiloto(idInstancia) {
      const index = this.garaje.pilotos.findIndex((p) => p.idInstancia === idInstancia)
      if (index === -1) return

      this.usuario.presupuesto = Number(
        (this.usuario.presupuesto + this.garaje.pilotos[index].precio).toFixed(1),
      )
      this.garaje.pilotos.splice(index, 1)
      await this.guardarDatosEnFirebase()
    },

    /**
     * Instalar o desinstalar una mejora:
     * - Solo se puede instalar si existe la mejora en el garaje
     * - Solo se puede instalar si hay un coche en el garaje
     * - Se actualiza el estado de la mejora (equipado/no equipado)
     * - Se guardan los datos en Firebase
     */
    async instalarMejora(idInstancia) {
      const pieza = this.garaje.potenciadores.find((p) => p.idInstancia === idInstancia)
      if (!pieza) return { exito: false, mensaje: 'Pieza no encontrada.' }

      if (!pieza.equipado && !this.garaje.coche) {
        return { exito: false, mensaje: 'Necesitas un monoplaza para instalar mejoras.' }
      }

      pieza.equipado = !pieza.equipado
      await this.guardarDatosEnFirebase()
      return { exito: true }
    },
  },
})
