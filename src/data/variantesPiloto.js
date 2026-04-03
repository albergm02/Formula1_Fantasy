import { perfilesPuntuacion } from '@/data/perfilesPuntuacion'
import { pilotosBase } from '@/data/bases/pilotosBase'
import { calcularPuntuacionBase } from '@/utils/puntuacion'

// prettier-ignore
export const variantesPiloto = [
  { variante: 'qualy',        perfil: 'qualy',        incrementoPrecio: 0, nombreHabilidad: 'Especialista en Qualy',      color: '#38bdf8', icono: 'pi-stopwatch' },
  { variante: 'carrera',      perfil: 'carrera',      incrementoPrecio: 0, nombreHabilidad: 'Especialista en Carrera',    color: '#f97316', icono: 'pi-flag-fill' },
  { variante: 'todo_terreno', perfil: 'todo_terreno', incrementoPrecio: 0, nombreHabilidad: 'Especialista Todo Terreno', color: '#a78bfa', icono: 'pi-cloud'     },
  { variante: 'base',         perfil: 'base',         incrementoPrecio: 0, nombreHabilidad: 'Piloto Base',               color: '#a1a1aa', icono: 'pi-user'      },
]

/**
 * Crea una carta de piloto a partir del catalogo base y una variante de puntuacion.
 * La puntuacion base se calcula con los atributos del piloto y los pesos de la variante.
 * El precio se ajusta segun el incremento definido en la variante.
 * @param {Object} pilotoBase - Datos base del piloto (numero, nombre, equipo, precioBase, imagen, atributos)
 * @param {Object} variante - Variante de puntuacion (variante, perfil, incrementoPrecio, nombreHabilidad, color, icono)
 * @returns {Object} Carta de piloto con datos combinados y puntuacion base calculada
 */
const crearCartaPiloto = (pilotoBase, variante) => {
  const perfil = perfilesPuntuacion[variante.perfil]
  const reglas = perfil.reglasUsuario
  const ptsPonderados = calcularPuntuacionBase(pilotoBase.atributos, perfil.pesos)

  return {
    id: `${pilotoBase.numero}_${variante.variante}`,
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
/* Flatmap aplana en un nivel los arrays resultantes de mapear cada pilotoBase con todas las variantesPiloto, 
creando una carta por cada combinacion. 
Para cada pilotoBase, se generan cartas con todas las variantes disponibles. */
export const mercadoPilotos = pilotosBase.flatMap((pilotoBase) =>
  variantesPiloto.map((variante) => crearCartaPiloto(pilotoBase, variante)),
)
