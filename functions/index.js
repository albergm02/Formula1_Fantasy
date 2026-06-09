/**
 * Punto de entrada de Cloud Functions.
 *
 * Este archivo solo orquesta: importa cada módulo de `cloud/` y reexporta sus
 * funciones bajo el nombre con el que Firebase las despliega. La lógica vive
 * en su módulo correspondiente para mantener `index.js` legible de un vistazo
 * y para que cada feature (jornada, mercado, ligas…) sea responsable de su
 * propio comportamiento.
 *
 * Estructura del backend:
 *   functions/
 *     comun/        ← inicialización Firebase + constantes + helpers de auth
 *     cloud/        ← una capa por dominio funcional
 *     *Server.js    ← lógica pura sin Firestore (puntuación, sinergias,
 *                     selección de mercado, resolución de pujas, adapter
 *                     de OpenF1). Se mantiene aparte para poder testearla
 *                     sin levantar emuladores y para defender la separación
 *                     "cálculo puro vs efectos secundarios".
 */

require('./comun/firebase')

const jornada = require('./cloud/jornada')
const mercado = require('./cloud/mercado')
const ligas = require('./cloud/ligas')
const clausulas = require('./cloud/clausulas')
const perfil = require('./cloud/perfil')
const bloqueoSesion = require('./cloud/bloqueoSesion')

/* ─── Schedules ─────────────────────────────────────────────────────────── */
exports.procesarJornadaSemanal = jornada.procesarJornadaSemanal
exports.generarMercadoDiario = mercado.generarMercadoDiario

/* ─── Callables de mercado ──────────────────────────────────────────────── */
exports.generarMercadoInicialLiga = mercado.generarMercadoInicialLiga

/* ─── Callables de ligas ────────────────────────────────────────────────── */
exports.eliminarLigaManual = ligas.eliminarLigaManual
exports.eliminarLigaComoOrganizador = ligas.eliminarLigaComoOrganizador
exports.expulsarParticipanteComoOrganizador = ligas.expulsarParticipanteComoOrganizador

/* ─── Callable de cláusulas ─────────────────────────────────────────────── */
exports.ejecutarClausulazo = clausulas.ejecutarClausulazo

/* ─── Callables de perfil ───────────────────────────────────────────────── */
exports.autorizarCambioCorreo = perfil.autorizarCambioCorreo
exports.migrarCorreoUsuario = perfil.migrarCorreoUsuario
exports.eliminarMiCuenta = perfil.eliminarMiCuenta
exports.eliminarUsuarioManual = perfil.eliminarUsuarioManual

/* ─── Callables anti-fuerza bruta ───────────────────────────────────────── */
exports.verificarBloqueoAcceso = bloqueoSesion.verificarBloqueoAcceso
exports.registrarIntentoFallido = bloqueoSesion.registrarIntentoFallido
exports.reiniciarContadorIntentos = bloqueoSesion.reiniciarContadorIntentos
