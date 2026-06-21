import { collection, doc, getDoc, onSnapshot, orderBy, query, limit } from 'firebase/firestore'
import { db } from '@/services/servicioFirebase'
import { perfilesPuntuacion } from '@/utils/perfilesPuntuacion'

export function suscribirseHistorialJornadas(alActualizar, limiteJornadas = 24) {
  const consulta = query(
    collection(db, 'jornadas'),
    orderBy('fechaProcesamiento', 'desc'),
    limit(limiteJornadas),
  )

  return onSnapshot(consulta, (resultados) => {
    const jornadas = resultados.docs.map((documento) => ({
      id: documento.id,
      ...documento.data(),
    }))
    alActualizar(jornadas)
  })
}

/** Lee el catálogo de pilotos una sola vez y extrae tanto el listado deduplicado
 * como los perfiles de puntuación, evitando dos lecturas al mismo documento.
 *
 * @returns {Promise<{pilotos: Array, perfiles: Object}>}
 */
export async function cargarCatalogoYPerfiles() {
  const documento = await getDoc(doc(db, 'catalogo', 'items'))
  if (!documento.exists()) {
    throw new Error('Catálogo no encontrado en Firestore (catalogo/items).')
  }

  const cartas = documento.data().pilotos || []
  const pilotosPorNumero = new Map()
  const perfiles = {}

  for (const carta of cartas) {
    if (!pilotosPorNumero.has(carta.numero)) {
      pilotosPorNumero.set(carta.numero, {
        numero: carta.numero,
        nombre: carta.nombre,
        equipo: carta.equipo,
        imagen: carta.imagen,
        atributos: carta.atributos,
      })
    }
  }

  return { pilotos: Array.from(pilotosPorNumero.values()), perfiles: perfilesPuntuacion }
}

export const obtenerCuentaRegresiva = (fechaInicio, ahora = new Date()) => {
  const inicioCarrera = new Date(fechaInicio)
  const tiempoRestante = inicioCarrera - ahora

  if (tiempoRestante <= 0) {
    return '¡El gran premio ya ha comenzado!'
  }

  const dias = Math.floor(tiempoRestante / (1000 * 60 * 60 * 24))
  const horas = Math.floor((tiempoRestante / (1000 * 60 * 60)) % 24)
  const minutos = Math.floor((tiempoRestante / (1000 * 60)) % 60)
  const segundos = Math.floor((tiempoRestante / 1000) % 60)

  return `${dias}d ${horas}h ${minutos}m ${segundos}s`
}

const FACTOR_MINIMO = 0.5
const FACTOR_MAXIMO = 1.5

export function calcularFactorJornada(actuacion, condiciones, variante) {
  if (variante === 'qualy') return acotarFactor(calcularFactorQualy(actuacion))
  if (variante === 'carrera') return acotarFactor(calcularFactorCarrera(actuacion))
  if (variante === 'todo_terreno') {
    if (pilotoSinActuacionValida(actuacion)) return FACTOR_MINIMO
    return acotarFactor(calcularFactorTodoTerreno(condiciones))
  }
  if (variante === 'remontador') {
    if (pilotoSinActuacionValida(actuacion)) return FACTOR_MINIMO
    return acotarFactor(calcularFactorRemontador(actuacion))
  }
  if (variante === 'estratega') {
    if (pilotoSinActuacionValida(actuacion)) return FACTOR_MINIMO
    return acotarFactor(calcularFactorEstrategia(actuacion))
  }
  return 1.0
}

export function calcularPuntosJornada(puntuacionBase, factorJornada = 1.0) {
  return Math.max(0, Math.round(puntuacionBase * factorJornada))
}

export function calcularPuntuacionBase(atributos, pesos) {
  const valor =
    (pesos.ritmo || 0) * atributos.ritmo +
    (pesos.consistencia || 0) * atributos.consistencia +
    (pesos.adaptabilidad || 0) * atributos.adaptabilidad +
    (pesos.agresividad || 0) * (atributos.agresividad || 0) +
    (pesos.gestion || 0) * (atributos.gestion || 0)
  return Math.round(valor * 10) / 10
}

function acotarFactor(factor) {
  if (factor < FACTOR_MINIMO) return FACTOR_MINIMO
  if (factor > FACTOR_MAXIMO) return FACTOR_MAXIMO
  return Math.round(factor * 100) / 100
}

function pilotoSinActuacionValida(actuacion) {
  return Boolean(actuacion?.dnf || actuacion?.dns || actuacion?.dsq || actuacion?.noClasificado)
}

function calcularFactorQualy({ posicionQualy }) {
  return resolverFactorPosicionQualy(posicionQualy)
}

function calcularFactorCarrera({ posicionCarrera }) {
  return resolverFactorPosicionCarrera(posicionCarrera)
}

function calcularFactorTodoTerreno({
  llovio,
  numeroDNFs,
  numeroSafetyCarActivos,
  numeroVirtualSafetyCarActivos,
}) {
  const factorBase = llovio ? 1 : 0.5
  const bonusCaos =
    (numeroSafetyCarActivos || 0) * 0.05 +
    (numeroVirtualSafetyCarActivos || 0) * 0.05 +
    (numeroDNFs || 0) * 0.1
  return Math.round((factorBase + bonusCaos) * 100) / 100
}

function calcularFactorRemontador({ numeroAdelantos, numeroVecesAdelantado }) {
  const diferencial = (numeroAdelantos || 0) - (numeroVecesAdelantado || 0)
  return 1 + diferencial * 0.1
}

function calcularFactorEstrategia({
  posicionCarrera,
  numeroPitStops,
  porcentajeStintMaximo = 0.5,
}) {
  let factor = 0.7
  factor += resolverBonusGestionStint(porcentajeStintMaximo)
  factor += resolverBonusEstrategiaParadas(numeroPitStops)
  factor += resolverBonusPosicionEstratega(posicionCarrera)
  return factor
}

function resolverFactorPosicionQualy(posicion) {
  if (posicion <= 3) return 1.5
  if (posicion <= 6) return 1.25
  if (posicion <= 10) return 1.1
  if (posicion <= 15) return 0.85
  return 0.65
}

function resolverFactorPosicionCarrera(posicion) {
  if (posicion === 1) return 1.5
  if (posicion === 2) return 1.4
  if (posicion === 3) return 1.3
  if (posicion <= 5) return 1.2
  if (posicion <= 10) return 1.0
  if (posicion <= 15) return 0.8
  if (posicion <= 20) return 0.6
  return 0.5
}

function resolverBonusGestionStint(porcentajeStintMaximo) {
  if (porcentajeStintMaximo >= 0.6) return 0.5
  if (porcentajeStintMaximo >= 0.45) return 0.3
  if (porcentajeStintMaximo >= 0.35) return 0.2
  if (porcentajeStintMaximo >= 0.25) return 0.1
  return 0.0
}

function resolverBonusEstrategiaParadas(numeroPitStops) {
  if (numeroPitStops === 1) return 0.15
  if (numeroPitStops === 2) return 0.05
  return 0.0
}

function resolverBonusPosicionEstratega(posicionCarrera) {
  if (posicionCarrera <= 3) return 0.15
  if (posicionCarrera <= 10) return 0.05
  if (posicionCarrera <= 15) return 0.0
  return -0.1
}
