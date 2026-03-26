import { perfilesPuntuacion } from '@/data/perfilesPuntuacion';
import { pilotosBase } from '@/data/pilotosBase';

export const variantesPiloto = [
  { variante: 'clasificador', perfil: 'clasificador', tier: 1, incrementoPrecio: 0, nombreHabilidad: 'Puntos de Clasificacion' },
  { variante: 'carrera', perfil: 'carrera', tier: 2, incrementoPrecio: 1.5, nombreHabilidad: 'Puntos de Carrera' },
  { variante: 'lluvia', perfil: 'lluvia', tier: 2, incrementoPrecio: 3, nombreHabilidad: 'Puntos de Lluvia' },
];

/**
 * Crea una carta de piloto a partir del catalogo base y una variante de puntuacion.
 * @param {} pilotoBase 
 * @param {} variante 
 * @returns 
 */
const crearCartaPiloto = (pilotoBase, variante) => {
  const reglas = perfilesPuntuacion[variante.perfil].reglasUsuario;

  return {
    id: `${pilotoBase.idBase}_${variante.variante}`,
    numero: pilotoBase.numero,
    nombre: pilotoBase.nombre,
    equipo: pilotoBase.equipo,
    tier: variante.tier,
    precio: Number((pilotoBase.precioBase + variante.incrementoPrecio).toFixed(1)),
    imagen: pilotoBase.imagen,
    tipoCarta: 'piloto',
    variante: variante.variante,
    perfilPuntuacion: variante.perfil,
    reglasUsuario: reglas,
    habilidad_1: { nombre: variante.nombreHabilidad, puntos: 12, descripcion: reglas[0] },
    habilidad_2: { nombre: 'Regla Extra', puntos: 6, descripcion: reglas[1] },
    penalizacion: { nombre: 'Penalizacion', puntos: -4, descripcion: reglas[2] },
  };
};

export const mercadoPilotos = pilotosBase.flatMap((pilotoBase) =>
  variantesPiloto.map((variante) => crearCartaPiloto(pilotoBase, variante))
);
