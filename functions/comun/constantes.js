const REGION = 'europe-west1'

// enforceAppCheck restringe la invocación a la app web oficial (token reCAPTCHA
// Enterprise): bloquea bots, scripts y peticiones desde dominios ajenos.
const OPCIONES = { region: REGION, enforceAppCheck: true }

// invoker:'public' para callables previas al login (no hay sesión todavía),
// pero se mantiene App Check para verificar el origen.
const OPCIONES_PUBLICAS = { region: REGION, invoker: 'public', enforceAppCheck: true }

// Debe coincidir con servicioClausulas.js del cliente.
const HORAS_PERIODO_GRACIA = 48

// Aplicado en servidor para que un cliente manipulado no pueda saltárselo.
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
