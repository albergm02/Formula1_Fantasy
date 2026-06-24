/**
 * @module functions/infraestructura/CatalogoBase
 * @description Contiene los datos base de pilotos, coches y potenciadores, así como funciones para construir el catálogo completo.
 */
// prettier-ignore
const pilotosBase = [
  { numero:  1, nombre: 'Lando Norris',      equipo: 'McLaren', imagen: '/Pilotos/norris.webp'     },
  { numero: 81, nombre: 'Oscar Piastri',     equipo: 'McLaren', imagen: '/Pilotos/piastri.webp'    },
  { numero:  3, nombre: 'Max Verstappen',    equipo: 'Red Bull', imagen: '/Pilotos/verstappen.webp' },
  { numero:  6, nombre: 'Isack Hadjar',      equipo: 'Red Bull', imagen: '/Pilotos/hadjar.webp'     },
  { numero: 16, nombre: 'Charles Leclerc',   equipo: 'Ferrari', imagen: '/Pilotos/leclerc.webp'    },
  { numero: 44, nombre: 'Lewis Hamilton',    equipo: 'Ferrari', imagen: '/Pilotos/hamilton.webp'   },
  { numero: 63, nombre: 'George Russell',    equipo: 'Mercedes', imagen: '/Pilotos/russell.webp'    },
  { numero: 12, nombre: 'Kimi Antonelli',    equipo: 'Mercedes', imagen: '/Pilotos/antonelli.webp'  },
  { numero: 14, nombre: 'Fernando Alonso',   equipo: 'Aston Martin', imagen: '/Pilotos/alonso.webp'    },
  { numero: 18, nombre: 'Lance Stroll',      equipo: 'Aston Martin', imagen: '/Pilotos/stroll.webp'    },
  { numero: 55, nombre: 'Carlos Sainz',      equipo: 'Williams', imagen: '/Pilotos/sainz.webp'      },
  { numero: 23, nombre: 'Alexander Albon',   equipo: 'Williams', imagen: '/Pilotos/albon.webp'      },
  { numero: 31, nombre: 'Esteban Ocon',      equipo: 'Haas', imagen: '/Pilotos/ocon.webp'       },
  { numero: 87, nombre: 'Oliver Bearman',    equipo: 'Haas', imagen: '/Pilotos/bearman.webp'    },
  { numero: 27, nombre: 'Nico Hulkenberg',   equipo: 'Audi', imagen: '/Pilotos/hulkenberg.webp' },
  { numero:  5, nombre: 'Gabriel Bortoleto', equipo: 'Audi', imagen: '/Pilotos/bortoleto.webp'  },
  { numero: 10, nombre: 'Pierre Gasly',      equipo: 'Alpine', imagen: '/Pilotos/gasly.webp'      },
  { numero: 43, nombre: 'Franco Colapinto',  equipo: 'Alpine', imagen: '/Pilotos/colapinto.webp'  },
  { numero: 30, nombre: 'Liam Lawson',       equipo: 'Racing Bulls', imagen: '/Pilotos/lawson.webp'    },
  { numero: 41, nombre: 'Arvid Lindblad',    equipo: 'Racing Bulls', imagen: '/Pilotos/lindblad.webp'  },
  { numero: 11, nombre: 'Sergio Perez',      equipo: 'Cadillac', imagen: '/Pilotos/perez.webp'     },
  { numero: 77, nombre: 'Valtteri Bottas',   equipo: 'Cadillac', imagen: '/Pilotos/bottas.webp'    },
]

// prettier-ignore
const cochesBase = [
  { id: 'alpine',       nombre: 'BWT Alpine F1',           precio: 20, puntuacion:  6, imagen: '/Coches/alpine.webp',       tipoCarta: 'coche' },
  { id: 'aston_martin', nombre: 'Aston Martin Aramco',     precio: 10, puntuacion:  3, imagen: '/Coches/astonmartin.webp',  tipoCarta: 'coche' },
  { id: 'audi',         nombre: 'Audi Revolut F1',         precio: 15, puntuacion:  5, imagen: '/Coches/audi.webp',         tipoCarta: 'coche' },
  { id: 'cadillac',     nombre: 'Cadillac F1',             precio: 10, puntuacion:  3, imagen: '/Coches/cadillac.webp',     tipoCarta: 'coche' },
  { id: 'ferrari',      nombre: 'Ferrari',                 precio: 35, puntuacion: 10, imagen: '/Coches/ferrari.webp',      tipoCarta: 'coche' },
  { id: 'haas',         nombre: 'TGR Haas F1',             precio: 25, puntuacion:  7, imagen: '/Coches/haas.webp',         tipoCarta: 'coche' },
  { id: 'mclaren',      nombre: 'McLaren Mastercard',      precio: 30, puntuacion:  9, imagen: '/Coches/mclaren.webp',      tipoCarta: 'coche' },
  { id: 'mercedes',     nombre: 'Mercedes-AMG',            precio: 40, puntuacion: 11, imagen: '/Coches/mercedes.webp',     tipoCarta: 'coche' },
  { id: 'racing_bulls', nombre: 'Racing Bulls VCARB',      precio: 20, puntuacion:  6, imagen: '/Coches/racingbulls.webp',  tipoCarta: 'coche' },
  { id: 'red_bull',     nombre: 'Red Bull Racing',         precio: 20, puntuacion:  6, imagen: '/Coches/redbull.webp',      tipoCarta: 'coche' },
  { id: 'williams',     nombre: 'Atlassian Williams',      precio: 15, puntuacion:  5, imagen: '/Coches/williams.webp',     tipoCarta: 'coche' },
]

// prettier-ignore
const potenciadoresBase = [
  { id: 'x_mode',                nombre: 'X-Mode',                     imagen: '/Potenciadores/x-mode.webp',                 tipoCarta: 'potenciador', multiplicador: 1.5,  descripcion: 'Diseñado para las rectas, ajusta el ángulo del alerón delantero y trasero, reduciendo la resistencia al avance.'     },
  { id: 'z_mode',                nombre: 'Z-Mode',                     imagen: '/Potenciadores/z-mode.webp',                 tipoCarta: 'potenciador', multiplicador: 1.5,  descripcion: 'Diseñado para las curvas y zonas reviradas, el alerón delantero y trasero se cierran para empujar el coche contra el suelo.' },
  { id: 'fondo_plano',           nombre: 'Fondo Plano',                imagen: '/Potenciadores/fondo_plano.webp',            tipoCarta: 'potenciador', multiplicador: 1.35, descripcion: 'Crea el efecto suelo: genera una zona de baja presión que succiona el monoplaza hacia el asfalto.'      },
  { id: 'deflectores_laterales', nombre: 'Deflectores Laterales',      imagen: '/Potenciadores/deflectores_laterales.webp', tipoCarta: 'potenciador', multiplicador: 1.3,  descripcion: 'Organiza, limpia y distribuye flujos de aire que viajan desde la parte delantera hasta la parte trasera del coche.' },
  { id: 'morro_aerodinamico',    nombre: 'Morro Aerodinámico',         imagen: '/Potenciadores/morro_aerodinamico.webp',    tipoCarta: 'potenciador', multiplicador: 1.4,  descripcion: 'Gestiona y prepara el flujo de aire antes de que golpee al resto del coche.'              },
  { id: 'x_mode_plus',           nombre: 'X-Mode+',                    imagen: '/Potenciadores/x-mode-plus.webp',           tipoCarta: 'potenciador', multiplicador: 1.6,  descripcion: 'Tercer modo intermedio del X-Mode, soluciona problemas de seguridad, especialmente en condiciones de lluvia.'      },
  { id: 'mgu_k',                 nombre: 'MGU-K',                      imagen: '/Potenciadores/mgu-k.webp',                 tipoCarta: 'potenciador', multiplicador: 1.55, descripcion: 'La Unidad Motor de Generador Cinético recupera la energía perdida en frenada para convertirla en electricidad.'  },
  { id: 'bateria_triple',        nombre: 'Bateria Triple',             imagen: '/Potenciadores/bateria_triple.webp',        tipoCarta: 'potenciador', multiplicador: 1.45, descripcion: 'Aumenta la potencia eléctrica considerablemente, permitiendo entregar el triple de potencia eléctrica que antes.'         },
  { id: 'mapeo_agresivo',        nombre: 'Mapeo Agresivo',             imagen: '/Potenciadores/mapeo_agresivo.webp',        tipoCarta: 'potenciador', multiplicador: 1.6,  descripcion: 'Configuración electrónica extrema diseñada para extraer el mayor rendimiento del motor, asumiendo un gran desgaste.'                },
  { id: 'software_mejorado',     nombre: 'Software de Energia',        imagen: '/Potenciadores/software_mejorado.webp',     tipoCarta: 'potenciador', multiplicador: 1.35, descripcion: 'Celebro electrónico que decide cuando cargar batería y cuando soltar la potencia a lo largo de una vuelta.'           },
  { id: 'combustible_sostenible',nombre: 'Combustible Biodegradable',  imagen: '/Potenciadores/combustible_sostenible.webp',tipoCarta: 'potenciador', multiplicador: 1.3,  descripcion: 'Tipo de carburante fabricado 100% a partir de residuos orgánicos, permite modificar libremente las mangueras del motor.' },
  { id: 'suspension_reactiva',   nombre: 'Suspension Reactiva',        imagen: '/Potenciadores/suspension_reactiva.webp',   tipoCarta: 'potenciador', multiplicador: 1.4,  descripcion: 'Sistema mecánico diseñado para mantener la altura del coche constante respecto al suelo.'                },
  { id: 'chasis_ultraligero',    nombre: 'Chasis Ligero',              imagen: '/Potenciadores/chasis_ultraligero.webp',    tipoCarta: 'potenciador', multiplicador: 1.45, descripcion: 'Reduce radicalmente el tamaño y el peso del monoplaza, disminuyendo la distancia entre ejes.'      },
  { id: 'frenos_reactivos',      nombre: 'Frenos Reactivos',           imagen: '/Potenciadores/frenos_reactivos.webp',      tipoCarta: 'potenciador', multiplicador: 1.35, descripcion: 'Funcionamiento inteligente del sistema hidráulico y electrónico trasero, coordina 3 fuerzas de frenado distintas.' },
  { id: 'caja_de_cambios',       nombre: 'Caja de Cambios',            imagen: '/Potenciadores/caja_de_cambios.webp',       tipoCarta: 'potenciador', multiplicador: 1.4,  descripcion: 'Transmite la potencia eléctrica y de gasolina del motor hacia las ruedas traseras.'            },
  { id: 'direccion_asistida',    nombre: 'Direccion Asistida',         imagen: '/Potenciadores/direccion_asistida.webp',    tipoCarta: 'potenciador', multiplicador: 1.3,  descripcion: 'Reduce el esfuerzo físico del piloto sobre el volante, permitiendole girar el coche con precisión.'             },
  { id: 'estratega',             nombre: 'Estratega',                  imagen: '/Potenciadores/estratega.webp',             tipoCarta: 'potenciador', multiplicador: 1.6,  descripcion: 'Cerebro matemático que decide cuando parar el coche en boxes, qué neumáticos montar y como gestionar el ritmo de carrera.' },
  { id: 'pit_crew',              nombre: 'Pit Crew',                   imagen: '/Potenciadores/pit_crew.webp',             tipoCarta: 'potenciador', multiplicador: 1.4,  descripcion: 'Grupo de personas encargado de cambiar los cuatro neumáticos del coche y realizar reparaciones de emergencia en parada.' },
  { id: 'analista',              nombre: 'Analista de Datos',          imagen: '/Potenciadores/analista.webp',              tipoCarta: 'potenciador', multiplicador: 1.3,  descripcion: 'Recopila, procesa e interpreta los millones de métricas generadas por el coche.'             },
  { id: 'ingeniero',             nombre: 'Ingeniero de Rendimiento',   imagen: '/Potenciadores/ingeniero.webp',             tipoCarta: 'potenciador', multiplicador: 1.4,  descripcion: 'Exprime el máximo agarre y velocidad pura del monoplaza ajustando las configuraciones mecánico-eléctricas.'              },
  { id: 'ingeniero_coms',        nombre: 'Ingeniero de Comunicaciones',imagen: '/Potenciadores/ingeniero_coms.webp',        tipoCarta: 'potenciador', multiplicador: 1.3,  descripcion: 'Estratega cuya función es dirigir el plan de sesión, dar información de tráfico y gestionar la psicología del piloto.' },
  { id: 'modo_override',         nombre: 'Modo Override',              imagen: '/Potenciadores/modo_override.webp',         tipoCarta: 'potenciador', multiplicador: 1.7,  descripcion: 'Sistema de asistencia eléctrica para adelantamientos, sustituye por completo al antiguo DRS.'          },
  { id: 'modo_defensa',          nombre: 'Modo Defensa',               imagen: '/Potenciadores/modo_defensa.webp',          tipoCarta: 'potenciador', multiplicador: 1.6,  descripcion: 'Estrategia electrónica del motor configurada para proteger la posición ante un ataque.'           },
  { id: 'meteorologia',          nombre: 'Meteorologia',               imagen: '/Potenciadores/meterologia.webp',           tipoCarta: 'potenciador', multiplicador: 2.1,  descripcion: 'Conjunto de sensores diseñados para medir, registrar y analizar variables físicas de la atmosfera.'                },
  { id: 'simulador_nocturno',    nombre: 'Simulador nocturno',         imagen: '/Potenciadores/simulador_nocturno.webp',    tipoCarta: 'potenciador', multiplicador: 1.3,  descripcion: 'Trabajo técnico de simulación del equipo a altas horas de madrugada para corregir el monoplaza.'         },
]

// prettier-ignore
const variantesPiloto = [
  { variante: 'qualy',        perfil: 'qualy',        nombreHabilidad: 'Especialista en Qualy'     },
  { variante: 'carrera',      perfil: 'carrera',      nombreHabilidad: 'Especialista en Carrera'   },
  { variante: 'todo_terreno', perfil: 'todo_terreno', nombreHabilidad: 'Especialista Todo Terreno' },
  { variante: 'base',         perfil: 'base',         nombreHabilidad: 'Piloto Base'               },
  { variante: 'remontador',   perfil: 'remontador',   nombreHabilidad: 'Remontador'                },
  { variante: 'estratega',    perfil: 'estratega',    nombreHabilidad: 'Estratega'                 },
]

const PRECIOS_POR_PILOTO = {
   1: 22.0, //  Lando Norris
   3: 20.3, //  Max Verstappen
   5: 15.2, //  Gabriel Bortoleto
   6: 18.3, //  Isack Hadjar
  10: 18.9, //  Pierre Gasly
  11: 15.0, //  Sergio Pérez
  12: 30.0, //  Kimi Antonelli
  14: 15.1, //  Fernando Alonso
  16: 22.2, //  Charles Leclerc
  18: 15.0, //  Lance Stroll
  23: 15.5, //  Alexander Albon
  27: 15.0, //  Nico Hulkenberg
  30: 17.5, //  Liam Lawson
  31: 15.3, //  Esteban Ocon
  41: 16.2, //  Arvid Lindblad
  43: 16.8, //  Franco Colapinto
  44: 26.1, //  Lewis Hamilton
  55: 15.6, //  Carlos Sainz
  63: 25.2, //  George Russell
  77: 15.0, //  Valtteri Bottas
  81: 21.5, //  Oscar Piastri
  87: 16.7, //  Oliver Bearman
}

/**
 * Crea una carta de piloto a partir de la base y la variante.
 * @param {Object} pilotoBase - Datos del piloto base.
 * @param {Object} variante - Datos de la variante del piloto.
 * @returns {Object} - Carta de piloto completa.
 */
function crearCartaPiloto(pilotoBase, variante) {
  return {
    id: `${pilotoBase.numero}_${variante.variante}`,
    numero: pilotoBase.numero,
    nombre: pilotoBase.nombre,
    equipo: pilotoBase.equipo,
    imagen: pilotoBase.imagen,
    tipoCarta: 'piloto',
    variante: variante.variante,
    nombreVariante: variante.nombreHabilidad,
    precio: PRECIOS_POR_PILOTO[pilotoBase.numero] ?? 15.0,
  }
}

/**
 * Construye el catálogo completo de pilotos, coches y potenciadores.
 * @returns {Object} - Catálogo completo.
 */
function construirCatalogoCompleto() {
  const pilotos = pilotosBase.flatMap((pilotoBase) => variantesPiloto.map((variante) => crearCartaPiloto(pilotoBase, variante)))

  const coches = cochesBase.map(({ puntuacion, ...resto }) => ({
    ...resto,
    puntuacionBase: puntuacion || 0,
  }))

  const potenciadores = potenciadoresBase.map((potenciador) => ({
    ...potenciador,
    precio: Math.round((potenciador.multiplicador - 1) * 10 * 10) / 10,
  }))

  return { pilotos, coches, potenciadores }
}

module.exports = {
  construirCatalogoCompleto,
  pilotosBase,
  variantesPiloto,
}
