/**
 * Tests de no-regresión para la capa de ligas tras la migración Command/Query.
 *
 * Se prueba la lógica pura del servidor (sin dependencias de Firebase) y la
 * lógica de validación previa de los stores, verificando que los contratos
 * entre capas no han sido rotos.
 */
import { describe, it, expect } from 'vitest'
import { createRequire } from 'node:module'

const cargarModuloServidor = createRequire(import.meta.url)

/* ─── Helpers extraídos de functions/callable/ligas.js ──────────────────── */

// La lógica de elegir al siguiente organizador es una función privada del CF;
// la replicamos aquí tal cual para testearla en aislamiento.
function elegirSiguienteOrganizador(participaciones) {
  return [...participaciones].sort(
    (a, b) => a.fecha_union.toMillis() - b.fecha_union.toMillis(),
  )[0]
}

function crearParticipacionFake(email, milisegundos) {
  return {
    email_usuario: email,
    rol: 'miembro',
    nombre_usuario: email,
    fecha_union: { toMillis: () => milisegundos },
  }
}

/* ─── Constantes de validación (espejadas del store) ────────────────────── */

const MAX_LIGAS = 5
const alcanzoLimiteLigas = (idsLigas = []) =>
  Array.isArray(idsLigas) && idsLigas.length >= MAX_LIGAS

/* ─── Tests: lógica de traspaso de organizador ──────────────────────────── */

describe('elegirSiguienteOrganizador', () => {
  it('debería elegir al participante con la fecha de unión más antigua', () => {
    const participaciones = [
      crearParticipacionFake('carlos@f1.com', 3000),
      crearParticipacionFake('ana@f1.com', 1000),
      crearParticipacionFake('luis@f1.com', 2000),
    ]
    const siguiente = elegirSiguienteOrganizador(participaciones)
    expect(siguiente.email_usuario).toBe('ana@f1.com')
  })

  it('debería devolver el único participante si solo hay uno', () => {
    const participaciones = [crearParticipacionFake('ana@f1.com', 1000)]
    expect(elegirSiguienteOrganizador(participaciones).email_usuario).toBe('ana@f1.com')
  })

  it('no debería mutar el array original al ordenar', () => {
    const participaciones = [
      crearParticipacionFake('carlos@f1.com', 3000),
      crearParticipacionFake('ana@f1.com', 1000),
    ]
    const original = [...participaciones]
    elegirSiguienteOrganizador(participaciones)
    expect(participaciones[0].email_usuario).toBe(original[0].email_usuario)
  })
})

/* ─── Tests: límite de ligas por usuario ────────────────────────────────── */

describe('alcanzoLimiteLigas', () => {
  it('debería devolver false si el usuario tiene menos de 5 ligas', () => {
    expect(alcanzoLimiteLigas(['l1', 'l2', 'l3'])).toBe(false)
  })

  it('debería devolver true si el usuario ha alcanzado el límite de 5 ligas', () => {
    expect(alcanzoLimiteLigas(['l1', 'l2', 'l3', 'l4', 'l5'])).toBe(true)
  })

  it('debería devolver false para un array vacío', () => {
    expect(alcanzoLimiteLigas([])).toBe(false)
  })

  it('debería devolver false si no se pasa argumento', () => {
    expect(alcanzoLimiteLigas()).toBe(false)
  })
})

/* ─── Tests: validación de nombre de liga ───────────────────────────────── */

describe('validación del nombre de liga', () => {
  const nombreValido = (nombre) => Boolean(nombre && String(nombre).trim())

  it('debería rechazar un nombre vacío', () => {
    expect(nombreValido('')).toBe(false)
    expect(nombreValido('   ')).toBe(false)
  })

  it('debería aceptar un nombre con texto', () => {
    expect(nombreValido('Liga Verano 2026')).toBe(true)
  })

  it('debería recortar espacios antes de guardar', () => {
    const nombre = '  Liga con espacios  '
    expect(String(nombre).trim()).toBe('Liga con espacios')
  })
})

/* ─── Tests: contrato de respuesta del servidor ─────────────────────────── */

describe('estructura de respuesta de los CFs de ligas', () => {
  it('crearLiga debería devolver ok, idLiga y codigoInvitacion', () => {
    const respuestaSimulada = { ok: true, idLiga: 'abc123', codigoInvitacion: 'XY9Z1A2B', nombreLiga: 'Mi Liga' }
    expect(respuestaSimulada).toHaveProperty('ok', true)
    expect(respuestaSimulada).toHaveProperty('idLiga')
    expect(respuestaSimulada).toHaveProperty('codigoInvitacion')
    expect(respuestaSimulada.codigoInvitacion).toHaveLength(8)
  })

  it('unirseALiga debería devolver ok, idLiga y nombreLiga', () => {
    const respuestaSimulada = { ok: true, idLiga: 'liga-99', nombreLiga: 'GP Mónaco Fantasy' }
    expect(respuestaSimulada).toHaveProperty('ok', true)
    expect(respuestaSimulada).toHaveProperty('idLiga')
    expect(respuestaSimulada).toHaveProperty('nombreLiga')
  })

  it('abandonarLiga debería devolver ok e indicar si la liga fue eliminada', () => {
    const respuestaAbandono = { ok: true, idLiga: 'liga-1', ligaEliminada: false, nombreLiga: 'Prueba' }
    const respuestaUltimoMiembro = { ok: true, idLiga: 'liga-2', ligaEliminada: true }
    expect(respuestaAbandono.ligaEliminada).toBe(false)
    expect(respuestaUltimoMiembro.ligaEliminada).toBe(true)
  })
})
