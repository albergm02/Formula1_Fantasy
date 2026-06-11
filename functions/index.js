require('./comun/firebase')

const jornada = require('./cloud/jornada')
const mercado = require('./cloud/mercado')
const ligas = require('./cloud/ligas')
const clausulas = require('./cloud/clausulas')
const garaje = require('./cloud/garaje')
const perfil = require('./cloud/perfil')
const bloqueoSesion = require('./cloud/bloqueoSesion')

exports.procesarJornadaSemanal = jornada.procesarJornadaSemanal
exports.generarMercadoDiario = mercado.generarMercadoDiario

exports.generarMercadoInicialLiga = mercado.generarMercadoInicialLiga
exports.registrarPujaCarta = mercado.registrarPujaCarta
exports.eliminarPujaPropia = mercado.eliminarPujaPropia
exports.eliminarMisPujasDeLiga = mercado.eliminarMisPujasDeLiga

exports.eliminarLigaManual = ligas.eliminarLigaManual
exports.eliminarLigaComoOrganizador = ligas.eliminarLigaComoOrganizador
exports.expulsarParticipanteComoOrganizador = ligas.expulsarParticipanteComoOrganizador

exports.ejecutarClausulazo = clausulas.ejecutarClausulazo

exports.venderCartaParticipante = garaje.venderCartaParticipante
exports.alternarCartaEquipada = garaje.alternarCartaEquipada
exports.invertirEnClausulaCarta = garaje.invertirEnClausulaCarta

exports.autorizarCambioCorreo = perfil.autorizarCambioCorreo
exports.migrarCorreoUsuario = perfil.migrarCorreoUsuario
exports.eliminarMiCuenta = perfil.eliminarMiCuenta
exports.eliminarUsuarioManual = perfil.eliminarUsuarioManual

exports.verificarBloqueoAcceso = bloqueoSesion.verificarBloqueoAcceso
exports.registrarIntentoFallido = bloqueoSesion.registrarIntentoFallido
exports.reiniciarContadorIntentos = bloqueoSesion.reiniciarContadorIntentos
