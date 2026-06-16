require('./comun/firebase')

const jornada = require('./cloud/jornada')
const mercado = require('./cloud/mercado')
const ligas = require('./cloud/ligas')
const garaje = require('./cloud/garaje')
const perfil = require('./cloud/perfil')
const autenticacion = require('./cloud/autenticacion')
const administracion = require('./cloud/administracion')

exports.procesarJornadaSemanal = jornada.procesarJornadaSemanal
exports.generarMercadoDiario = mercado.generarMercadoDiario

exports.generarMercadoInicialLiga = mercado.generarMercadoInicialLiga
exports.registrarPujaCarta = mercado.registrarPujaCarta
exports.eliminarPujaPropia = mercado.eliminarPujaPropia
exports.eliminarMisPujasDeLiga = mercado.eliminarMisPujasDeLiga

exports.eliminarLigaManual = administracion.eliminarLigaManual
exports.eliminarLigaComoOrganizador = ligas.eliminarLigaComoOrganizador
exports.expulsarParticipanteComoOrganizador = ligas.expulsarParticipanteComoOrganizador

exports.venderCartaParticipante = garaje.venderCartaParticipante
exports.alternarCartaEquipada = garaje.alternarCartaEquipada
exports.invertirEnClausulaCarta = garaje.invertirEnClausulaCarta
exports.ejecutarClausulazo = garaje.ejecutarClausulazo

exports.autorizarCambioCorreo = perfil.autorizarCambioCorreo
exports.migrarCorreoUsuario = perfil.migrarCorreoUsuario
exports.eliminarMiCuenta = perfil.eliminarMiCuenta
exports.eliminarUsuarioManual = administracion.eliminarUsuarioManual

exports.verificarBloqueoAcceso = autenticacion.verificarBloqueoAcceso
exports.registrarIntentoFallido = autenticacion.registrarIntentoFallido
exports.reiniciarContadorIntentos = autenticacion.reiniciarContadorIntentos
