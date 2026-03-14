import { defineStore } from 'pinia'
import { collection, doc, updateDoc, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/services/firebase'
import { useAuthStore } from './storeAuth'

/* Crea un garaje vacío para la entrada de un nuevo jugador */
const crearGarajeVacio = () => ({
  coche: null,
  pilotos: [],
  potenciadores: [],
})

export const useEscuderiaStore = defineStore('escuderia', {
  state: () => ({
    ligaActivaId: null,
    participanteActivoId: null,

    // Datos de la escudería de este participante en la liga activa
    presupuesto: 0,
    puntos: 0,
    garaje: crearGarajeVacio(),

    cargandoEscuderia: false,
  }),

  actions: {
    /* Carga los datos de la escudería del participante activo en la liga activa */
    async cargarEscuderia(ligaId) {
      this.cargandoEscuderia = true
      const authStore = useAuthStore()

      try {
        // Consulta para obtener el participante activo en la liga
        this.ligaActivaId = ligaId
        const participantesRef = collection(db, 'participaciones')

        // Busca el participante que corresponde al usuario actual y la liga activa
        const q = query(
          participantesRef,
          where('liga_id', '==', ligaId),
          where('email_usuario', '==', authStore.usuarioGlobal.emailAuth),
        )
        const querySnapshot = await getDocs(q)

        if (!querySnapshot.empty) {
          const docEscuderia = querySnapshot.docs[0]
          this.participanteActivoId = docEscuderia.id
          const data = docEscuderia.data()
          this.presupuesto = data.presupuesto
          this.puntos = data.puntos
          this.garaje = data.garaje || crearGarajeVacio()
        } else {
          // Asigna valores por defecto en lugar de bloquear la UI
          console.warn(
            'Error en cargarEscuderia (storeEscuderia.js): No se encontró el participante para la liga activa',
          )
          this.presupuesto = 50.0
          this.puntos = 0
          this.garaje = crearGarajeVacio()
          this.cargandoEscuderia = false
          return
        }
      } catch (error) {
        // Asigna valores por defecto para evitar bloqueos en la UI
        console.warn('Error en cargarEscuderia (storeEscuderia.js):', error)
        this.presupuesto = 50.0
        this.puntos = 0
        this.garaje = crearGarajeVacio()
        this.cargandoEscuderia = false
      } finally {
        this.cargandoEscuderia = false
      }
    },

    /* Guarda los cambios realizados en la escudería del participante activo en Firestore */
    async guardarEstadoEscuderia() {
      if (!this.participanteActivoId) {
        console.warn(
          'Error en guardarEstadoEscuderia (storeEscuderia.js): No hay participante activo para guardar',
        )
        return
      }
      try {
        const participanteRef = doc(db, 'participaciones', this.participanteActivoId)
        // Actualiza los datos de la escudería en Firestore
        await updateDoc(participanteRef, {
          presupuesto: this.presupuesto,
          puntos: this.puntos,
          garaje: this.garaje,
        })
      } catch (error) {
        console.error('Error en guardarEstadoEscuderia (storeEscuderia.js):', error)
      }
    },

    /* Intenta fichar un elemento para la escudería del participante activo, validando presupuesto y límites */
    async fichar(elemento) {
      // Validaciones antes de fichar
      if (this.presupuesto < elemento.precio) {
        return {
          exito: false,
          mensaje: 'No tienes suficiente presupuesto para fichar este elemento.',
        }
      }
      if (elemento.tipo === 'coche' && this.garaje.coche) {
        return {
          exito: false,
          mensaje: 'Ya tienes un coche fichado. Vende el actual para fichar uno nuevo.',
        }
      }
      if (elemento.tipo === 'piloto' && this.garaje.pilotos.length >= 2) {
        return {
          exito: false,
          mensaje: 'Ya tienes 2 pilotos fichados. Vende uno para fichar otro.',
        }
      }

      this.presupuesto -= elemento.precio
      // Genera un contrato con ID único para este fichaje
      const contrato = { ...elemento, instancia_id: Date.now() }

      if (elemento.tipo === 'coche') {
        this.garaje.coche = contrato
      } else if (elemento.tipo === 'piloto') {
        this.garaje.pilotos.push(contrato)
      } else if (elemento.tipo === 'potenciador') {
        this.garaje.potenciadores.push(contrato)
      }
      await this.guardarEstadoEscuderia()
      return { exito: true, mensaje: `Has fichado: ${elemento.nombre} exitosamente.` }
    },

    /* Vende un elemento de la escudería del participante activo, recuperando parte del presupuesto */
    async vender(elemento) {
      if (!elemento) {
        return { exito: false, mensaje: 'Elemento no encontrado para vender.' }
      }

      try {
        this.presupuesto += elemento.precio * 0.5 // Recupera el 50% del precio original al vender

        // Elimina el elemento del garaje, desequipa piezas.
        if (elemento.tipo === 'coche') {
          this.garaje.coche = null
          this.garaje.potenciadores.forEach((p) => {
            p.equipado = false
          })
        }
        // Si se vende un piloto, el garaje se equipa con el piloto restante (si lo hay).
        else if (elemento.tipo === 'piloto') {
          this.garaje.pilotos = this.garaje.pilotos.filter(
            (p) => p.instancia_id !== elemento.instancia_id,
          )
        }
        // Igual que en el caso del piloto
        else if (elemento.tipo === 'potenciador') {
          this.garaje.potenciadores = this.garaje.potenciadores.filter(
            (p) => p.instancia_id !== elemento.instancia_id,
          )
        }

        await this.guardarEstadoEscuderia()
        return {
          exito: true,
          mensaje: `Has obtenido ${Math.floor(elemento.precio * 0.5)} de presupuesto, ¡Hasta pronto, ${elemento.nombre}.!`,
        }
      } catch (error) {
        console.error('Error en vender (storeEscuderia.js):', error)
        return { exito: false, mensaje: 'Error al vender el elemento. Inténtalo de nuevo.' }
      }
    },

    async togglePotenciador(instanciaId) {
      const potenciador = this.garaje.potenciadores.find((p) => p.instancia_id === instanciaId)
      if (!potenciador) {
        return { exito: false, mensaje: 'Potenciador no encontrado para equipar.' }
      }
      if (!this.garaje.coche) {
        return {
          exito: false,
          mensaje: 'Debes tener un coche fichado para equipar un potenciador.',
        }
      }
      potenciador.equipado = !potenciador.equipado
      await this.guardarEstadoEscuderia()
      return {
        exito: true,
        mensaje: `Has ${potenciador.equipado ? 'equipado' : 'desequipado'} el potenciador: ${potenciador.nombre}.`,
      }
    },

    async salirDeLaLiga() {
      this.ligaActivaId = null
      this.participanteActivoId = null
      this.presupuesto = 0
      this.puntos = 0
      this.garaje = crearGarajeVacio()
    },
  },
})
