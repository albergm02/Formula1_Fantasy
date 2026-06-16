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
