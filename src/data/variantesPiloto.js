import { perfilesPuntuacion } from '@/data/perfilesPuntuacion'
import { pilotosBase } from '@/data/bases/pilotosBase'
import { calcularPuntuacionBase } from '@/utils/puntuacion'

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
  {
    variante: 'base',
    perfil: 'base',
    incrementoPrecio: 0,
    nombreHabilidad: 'Piloto Base',
    color: '#a1a1aa',
    icono: 'pi-user',
  },
]

/**
 * Crea una carta de piloto a partir del catalogo base y una variante de puntuacion.
 * La puntuacion base se calcula con los atributos del piloto y los pesos de la variante.
 */
const crearCartaPiloto = (pilotoBase, variante) => {
  const perfil = perfilesPuntuacion[variante.perfil]
  const reglas = perfil.reglasUsuario
  const ptsPonderados = calcularPuntuacionBase(pilotoBase.atributos, perfil.pesos)

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
    pesos: perfil.pesos,
    atributos: pilotoBase.atributos,
    puntuacionBase: ptsPonderados,
    reglasUsuario: reglas,
  }
}

export const mercadoPilotos = pilotosBase.flatMap((pilotoBase) =>
  variantesPiloto.map((variante) => crearCartaPiloto(pilotoBase, variante)),
)
