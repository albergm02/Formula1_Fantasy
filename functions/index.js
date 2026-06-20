require('./middleware/firebase')

const jornada = require('./callable/jornada')
const mercado = require('./callable/mercado')
const ligas = require('./callable/ligas')
const garaje = require('./callable/garaje')
const perfil = require('./callable/perfil')
const administracion = require('./callable/administracion')

exports.procesarJornada = jornada.procesarJornada

exports.registrarPuja = mercado.registrarPuja
exports.eliminarPuja = mercado.eliminarPuja
exports.generarMercado = mercado.generarMercado

exports.eliminarLiga = ligas.eliminarLiga
exports.eliminarPujas = ligas.eliminarPujas
exports.expulsarParticipante = ligas.expulsarParticipante
exports.inicializarMercado = ligas.inicializarMercado

exports.venderCarta = garaje.venderCarta
exports.alternarAlineacion = garaje.alternarAlineacion
exports.gestionarClausula = garaje.gestionarClausula
exports.ejecutarClausula = garaje.ejecutarClausula

exports.autorizarCambioCorreo = perfil.autorizarCambioCorreo
exports.migrarCorreo = perfil.migrarCorreo
exports.eliminarMiCuenta = perfil.eliminarMiCuenta

exports.eliminarLigaAdmin = administracion.eliminarLigaAdmin
exports.eliminarUsuarioAdmin = administracion.eliminarUsuarioAdmin
