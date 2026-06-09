/**
 * Constantes compartidas por todas las Cloud Functions.
 *
 * Reuno aquí los valores que reaparecen en varios módulos para que cualquier
 * cambio (región, ventana de gracia, política de App Check…) se haga en un
 * único sitio y no haya que perseguirlo por todo el código del backend.
 */

const REGION = 'europe-west1'

/* Opciones por defecto para callables autenticadas.
 *
 * Mantengo `enforceAppCheck: true` para que solo la app web oficial (con su
 * token de reCAPTCHA Enterprise) pueda invocarlas: bloquea bots, scripts
 * automáticos y peticiones desde dominios ajenos. */
const OPCIONES = { region: REGION, enforceAppCheck: true }

/* Opciones para callables que se invocan ANTES del login (verificar bloqueo
 * de sesión, registrar intento fallido).
 *
 * `invoker: 'public'` porque todavía no hay sesión de Firebase Auth, pero
 * mantengo App Check para que el origen siga estando comprobado. */
const OPCIONES_PUBLICAS = { region: REGION, invoker: 'public', enforceAppCheck: true }

/* Ventana durante la cual una carta recién adquirida queda protegida frente
 * a un clausulazo. Tiene que coincidir con la del cliente
 * (`servicioClausulas.js`) para que la UI y el servidor cuenten lo mismo. */
const HORAS_PERIODO_GRACIA = 48

/* Periodo mínimo entre dos cambios de correo del mismo usuario. Lo aplico en
 * servidor (`autorizarCambioCorreo`) para que un cliente manipulado no pueda
 * saltárselo. */
const DIAS_BLOQUEO_CAMBIO_CORREO = 7

const TEMPORADA_ACTUAL = 2026

module.exports = {
  REGION,
  OPCIONES,
  OPCIONES_PUBLICAS,
  HORAS_PERIODO_GRACIA,
  DIAS_BLOQUEO_CAMBIO_CORREO,
  TEMPORADA_ACTUAL,
}
