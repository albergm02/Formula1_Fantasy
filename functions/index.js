/**
 * Punto de entrada de Cloud Functions.
 *
 * Este archivo solo orquesta: importa cada módulo de `cloud/` y reexporta sus
 * funciones bajo el nombre con el que Firebase las despliega. La lógica vive
 * en su módulo correspondiente para mantener `index.js` legible de un vistazo
 * y para que cada feature (jornada, mercado, ligas…) sea responsable de su
 * propio comportamiento.
 *
 */

require('./comun/firebase')

const jornada = require('./cloud/jornada')
const mercado = require('./cloud/mercado')
const ligas = require('./cloud/ligas')
const clausulas = require('./cloud/clausulas')
const garaje = require('./cloud/garaje')
const perfil = require('./cloud/perfil')
const bloqueoSesion = require('./cloud/bloqueoSesion')

/* ─── Schedules ─────────────────────────────────────────────────────────── */
exports.procesarJornadaSemanal = jornada.procesarJornadaSemanal
exports.generarMercadoDiario = mercado.generarMercadoDiario

/* ─── Callables de mercado ──────────────────────────────────────────────── */
exports.generarMercadoInicialLiga = mercado.generarMercadoInicialLiga
exports.registrarPujaCarta = mercado.registrarPujaCarta
exports.eliminarPujaPropia = mercado.eliminarPujaPropia

/* ─── Callables de ligas ────────────────────────────────────────────────── */
exports.eliminarLigaManual = ligas.eliminarLigaManual
exports.eliminarLigaComoOrganizador = ligas.eliminarLigaComoOrganizador
exports.expulsarParticipanteComoOrganizador = ligas.expulsarParticipanteComoOrganizador

/* ─── Callable de cláusulas ─────────────────────────────────────────────── */
exports.ejecutarClausulazo = clausulas.ejecutarClausulazo

/* ─── Callables de garaje ───────────────────────────────────────────────── */
exports.venderCartaParticipante = garaje.venderCartaParticipante
exports.alternarCartaEquipada = garaje.alternarCartaEquipada
exports.invertirEnClausulaCarta = garaje.invertirEnClausulaCarta

/* ─── Callables de perfil ───────────────────────────────────────────────── */
exports.autorizarCambioCorreo = perfil.autorizarCambioCorreo
exports.migrarCorreoUsuario = perfil.migrarCorreoUsuario
exports.eliminarMiCuenta = perfil.eliminarMiCuenta
exports.eliminarUsuarioManual = perfil.eliminarUsuarioManual

/* ─── Callables anti-fuerza bruta ───────────────────────────────────────── */
exports.verificarBloqueoAcceso = bloqueoSesion.verificarBloqueoAcceso
exports.registrarIntentoFallido = bloqueoSesion.registrarIntentoFallido
exports.reiniciarContadorIntentos = bloqueoSesion.reiniciarContadorIntentos
