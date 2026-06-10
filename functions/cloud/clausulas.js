/**
 * Cláusula de rescisión ("clausulazo") en servidor.
 *
 * Toda la lógica vive aquí (no en cliente) porque es la única manera de
 * garantizar que el precio, las validaciones y la transferencia se ejecuten
 * de forma atómica y a prueba de manipulación: un cliente comprometido podría
 * inventarse el precio o el rival, pero el Admin SDK los recalcula desde los
 * documentos reales antes de mover nada.
 */

const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { FieldValue } = require('firebase-admin/firestore')

const { db } = require('../comun/firebase')
const { OPCIONES, HORAS_PERIODO_GRACIA } = require('../comun/constantes')
const { exigirEmailAutenticado } = require('../comun/autenticacion')
const { exigirJornadaProcesada } = require('../comun/jornada')
const { calcularIdMercado } = require('./mercado')

/**
 * Calcula el precio de la cláusula a partir del precio pagado por el dueño.
 *
 * Fórmula: `precioCompra + (clausulaInvertida × 2)`. Uso `precioCompra` —
 * la inversión histórica del dueño — y no el precio actual de mercado, para
 * que la cláusula refleje el coste real de lo que el dueño puso por la carta
 * más el doble de lo que invirtió en blindarla.
 */
function calcularPrecioClausula(carta) {
  const precioBase = carta.precioCompra ?? carta.precio
  const inversionDueño = carta.clausulaInvertida || 0
  return precioBase + inversionDueño * 2
}

/**
 * Indica si una carta sigue protegida por el periodo de gracia tras adquirirse.
 * Lo aplico para evitar el "robo en caliente" justo después de una compra,
 * que sería frustrante y poco competitivo.
 */
function estaEnPeriodoDeGracia(carta) {
  if (!carta.fechaAdquisicion) return false
  const fechaAdquisicion = new Date(carta.fechaAdquisicion)
  const milisegundosGracia = HORAS_PERIODO_GRACIA * 60 * 60 * 1000
  return Date.now() - fechaAdquisicion.getTime() < milisegundosGracia
}

/**
 * Extrae una carta del garaje por `instancia_id`, mutando el garaje recibido.
 *
 * Uso `instancia_id` (timestamp + random) en lugar de `id` o `numero|variante`
 * porque es el único identificador único e inmutable de una carta concreta:
 * dos jugadores pueden tener "Hamilton qualy" en su garaje, pero cada copia
 * es una instancia distinta con su propio historial.
 */
function extraerCartaPorInstancia(garaje, instanciaId) {
  for (const coleccion of ['coches', 'pilotos', 'potenciadores']) {
    const lista = garaje[coleccion] || []
    const indice = lista.findIndex((carta) => carta.instancia_id === instanciaId)
    if (indice !== -1) {
      const carta = lista.splice(indice, 1)[0]
      garaje[coleccion] = lista
      return { carta }
    }
  }
  return { carta: null }
}

/**
 * Añade una carta al garaje destino según su tipo, mutando el garaje recibido.
 */
function añadirCartaAGaraje(garaje, carta) {
  const tipo = carta.tipo || carta.tipoCarta
  const coleccion = tipo === 'coche' ? 'coches' : tipo === 'piloto' ? 'pilotos' : 'potenciadores'
  if (!garaje[coleccion]) garaje[coleccion] = []
  garaje[coleccion].push(carta)
}

/**
 * Suma el dinero que un usuario tiene reservado en pujas del mercado de hoy.
 *
 * Sin este cálculo, un jugador podría comprometer 30 M en pujas y a la vez
 * ejecutar un clausulazo de 30 M, dejando el presupuesto en negativo si
 * después se resolviera alguna puja a su favor.
 */
async function calcularComprometidoEnPujas(idLiga, email) {
  const idMercado = calcularIdMercado(idLiga, new Date())
  const pujasSnap = await db
    .collection('mercados')
    .doc(idMercado)
    .collection('pujas')
    .where('emailUsuario', '==', email)
    .get()
  return pujasSnap.docs.reduce((suma, documento) => suma + (documento.data().cantidad || 0), 0)
}

/**
 * Callable — ejecuta una cláusula de rescisión validando todo en servidor.
 *
 * Acepta `{ idParticipanteRival, idParticipantePropio, instanciaId }`.
 * Recalcula el precio (sin fiarse del cliente), comprueba el periodo de gracia
 * y el presupuesto disponible (incluido el comprometido en pujas) y
 * transfiere la carta y el dinero en un único batch atómico.
 *
 * Registra además un evento de actividad para que el resto de jugadores se
 * entere de la jugada.
 */
exports.ejecutarClausulazo = onCall(OPCIONES, async (request) => {
  const emailAtacante = exigirEmailAutenticado(request)
  await exigirJornadaProcesada()
  const { idParticipanteRival, idParticipantePropio, instanciaId } = request.data || {}
  if (!idParticipanteRival || !idParticipantePropio || instanciaId === undefined) {
    throw new HttpsError('invalid-argument', 'Faltan datos de la cláusula.')
  }
  if (idParticipanteRival === idParticipantePropio) {
    throw new HttpsError('failed-precondition', 'No puedes fichar una carta de tu propio equipo.')
  }

  const refRival = db.collection('participaciones').doc(idParticipanteRival)
  const refPropio = db.collection('participaciones').doc(idParticipantePropio)
  const [snapRival, snapPropio] = await Promise.all([refRival.get(), refPropio.get()])
  if (!snapRival.exists || !snapPropio.exists) {
    throw new HttpsError('not-found', 'Participación no encontrada.')
  }

  const datosRival = snapRival.data()
  const datosPropio = snapPropio.data()
  if (datosPropio.email_usuario !== emailAtacante) {
    throw new HttpsError('permission-denied', 'Solo puedes fichar para tu propio equipo.')
  }
  if (datosRival.id_liga !== datosPropio.id_liga) {
    throw new HttpsError('failed-precondition', 'Ambos equipos deben competir en la misma liga.')
  }

  const garajeRival = datosRival.garaje || {}
  const { carta } = extraerCartaPorInstancia(garajeRival, instanciaId)
  if (!carta) {
    throw new HttpsError('not-found', 'La carta ya no está en el equipo rival.')
  }

  const tipoCarta = carta.tipo || carta.tipoCarta
  if (tipoCarta === 'potenciador') {
    throw new HttpsError('failed-precondition', 'Los potenciadores no admiten cláusula.')
  }
  if (estaEnPeriodoDeGracia(carta)) {
    throw new HttpsError('failed-precondition', 'La carta está protegida por periodo de gracia.')
  }

  const precioClausula = calcularPrecioClausula(carta)
  const comprometidoEnPujas = await calcularComprometidoEnPujas(datosPropio.id_liga, emailAtacante)
  if (precioClausula + comprometidoEnPujas > datosPropio.presupuesto) {
    throw new HttpsError('failed-precondition', 'No tienes presupuesto suficiente.')
  }

  /* La carta cambia de manos con `equipado: false`, `clausulaInvertida: 0` y
   * una nueva `fechaAdquisicion`: el nuevo dueño tiene que decidir si la
   * equipa y arranca su propio periodo de gracia. */
  const garajePropio = datosPropio.garaje || {}
  añadirCartaAGaraje(garajePropio, {
    ...carta,
    precioCompra: precioClausula,
    clausulaInvertida: 0,
    fechaAdquisicion: new Date().toISOString(),
    equipado: false,
  })

  const batch = db.batch()
  batch.update(refRival, {
    garaje: garajeRival,
    presupuesto: datosRival.presupuesto + precioClausula,
  })
  batch.update(refPropio, {
    garaje: garajePropio,
    presupuesto: datosPropio.presupuesto - precioClausula,
  })
  batch.create(db.collection('actividad').doc(), {
    idLiga: datosPropio.id_liga,
    nombreUsuario: datosPropio.nombre_usuario || emailAtacante,
    tipo: 'clausula',
    descripcion: `ha activado la cláusula de ${tipoCarta} ${carta.nombre} por ${precioClausula.toFixed(1)}M`,
    fecha: FieldValue.serverTimestamp(),
  })
  await batch.commit()

  return { ok: true, nombre: carta.nombre, precioClausula }
})
