import { perfilesPuntuacion } from '@/data/perfilesPuntuacion'
import { pilotosBase } from '@/data/bases/pilotosBase'

export const variantesPiloto = [
  {
    variante: 'clasificador',
    perfil: 'clasificador',
    incrementoPrecio: 0,
    nombreHabilidad: 'Especialista en Clasificacion',
    color: '#38bdf8',
    icono: 'pi-stopwatch',
  },
  {
    variante: 'carrera',
    perfil: 'carrera',
    incrementoPrecio: 0,
    nombreHabilidad: 'Especialista en Carrera',
    color: '#f97316',
    icono: 'pi-flag-fill',
  },
  {
    variante: 'lluvia',
    perfil: 'lluvia',
    incrementoPrecio: 0,
    nombreHabilidad: 'Especialista en Lluvia',
    color: '#a78bfa',
    icono: 'pi-cloud',
  },
]

/**
 * Crea una carta de piloto a partir del catalogo base y una variante de puntuacion.
 * @param {} pilotoBase
 * @param {} variante
 * @returns
 */
const crearCartaPiloto = (pilotoBase, variante) => {
  const perfil = perfilesPuntuacion[variante.perfil]
  const reglas = perfil.reglasUsuario

  return {
    id: `${pilotoBase.idBase}_${variante.variante}`,
    numero: pilotoBase.numero,
    nombre: pilotoBase.nombre,
    equipo: pilotoBase.equipo,
    precio: Number((pilotoBase.precioBase + variante.incrementoPrecio).toFixed(1)),
    imagen: pilotoBase.imagen,
    tipoCarta: 'piloto',
    variante: variante.variante,
    colorVariante: variante.color,
    iconoVariante: variante.icono,
    nombreVariante: variante.nombreHabilidad,
    perfilPuntuacion: variante.perfil,
    reglasUsuario: reglas,
    habilidad_1: { nombre: perfil.nombre, descripcion: reglas[0] },
    habilidad_2: { nombre: 'Regla Extra', descripcion: reglas[1] },
    penalizacion: { nombre: 'Penalizacion', descripcion: reglas[2] },
  }
}

export const mercadoPilotos = pilotosBase.flatMap((pilotoBase) =>
  variantesPiloto.map((variante) => crearCartaPiloto(pilotoBase, variante)),
)
