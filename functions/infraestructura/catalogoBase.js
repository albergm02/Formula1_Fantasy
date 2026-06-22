// prettier-ignore
const pilotosBase = [
  /* ══════════ McLAREN ══════════ */
  { numero:  1, nombre: 'Lando Norris',      equipo: 'McLaren', imagen: '/Pilotos/norris.webp'     },
  { numero: 81, nombre: 'Oscar Piastri',     equipo: 'McLaren', imagen: '/Pilotos/piastri.webp'    },

  /* ══════════ RED BULL ══════════ */
  { numero:  3, nombre: 'Max Verstappen',    equipo: 'Red Bull', imagen: '/Pilotos/verstappen.webp' },
  { numero:  6, nombre: 'Isack Hadjar',      equipo: 'Red Bull', imagen: '/Pilotos/hadjar.webp'     },

  /* ══════════ FERRARI ══════════ */
  { numero: 16, nombre: 'Charles Leclerc',   equipo: 'Ferrari', imagen: '/Pilotos/leclerc.webp'    },
  { numero: 44, nombre: 'Lewis Hamilton',    equipo: 'Ferrari', imagen: '/Pilotos/hamilton.webp'   },

  /* ══════════ MERCEDES ══════════ */
  { numero: 63, nombre: 'George Russell',    equipo: 'Mercedes', imagen: '/Pilotos/russell.webp'    },
  { numero: 12, nombre: 'Kimi Antonelli',    equipo: 'Mercedes', imagen: '/Pilotos/antonelli.webp'  },

  /* ══════════ ASTON MARTIN ══════════ */
  { numero: 14, nombre: 'Fernando Alonso',   equipo: 'Aston Martin', imagen: '/Pilotos/alonso.webp'    },
  { numero: 18, nombre: 'Lance Stroll',      equipo: 'Aston Martin', imagen: '/Pilotos/stroll.webp'    },

  /* ══════════ WILLIAMS ══════════ */
  { numero: 55, nombre: 'Carlos Sainz',      equipo: 'Williams', imagen: '/Pilotos/sainz.webp'      },
  { numero: 23, nombre: 'Alexander Albon',   equipo: 'Williams', imagen: '/Pilotos/albon.webp'      },

  /* ══════════ HAAS ══════════ */
  { numero: 31, nombre: 'Esteban Ocon',      equipo: 'Haas', imagen: '/Pilotos/ocon.webp'       },
  { numero: 87, nombre: 'Oliver Bearman',    equipo: 'Haas', imagen: '/Pilotos/bearman.webp'    },

  /* ══════════ AUDI ══════════ */
  { numero: 27, nombre: 'Nico Hulkenberg',   equipo: 'Audi', imagen: '/Pilotos/hulkenberg.webp' },
  { numero:  5, nombre: 'Gabriel Bortoleto', equipo: 'Audi', imagen: '/Pilotos/bortoleto.webp'  },

  /* ══════════ ALPINE ══════════ */
  { numero: 10, nombre: 'Pierre Gasly',      equipo: 'Alpine', imagen: '/Pilotos/gasly.webp'      },
  { numero: 43, nombre: 'Franco Colapinto',  equipo: 'Alpine', imagen: '/Pilotos/colapinto.webp'  },

  /* ══════════ RACING BULLS ══════════ */
  { numero: 30, nombre: 'Liam Lawson',       equipo: 'Racing Bulls', imagen: '/Pilotos/lawson.webp'    },
  { numero: 41, nombre: 'Arvid Lindblad',    equipo: 'Racing Bulls', imagen: '/Pilotos/lindblad.webp'  },

  /* ══════════ CADILLAC ══════════ */
  { numero: 11, nombre: 'Sergio Perez',      equipo: 'Cadillac', imagen: '/Pilotos/perez.webp'     },
  { numero: 77, nombre: 'Valtteri Bottas',   equipo: 'Cadillac', imagen: '/Pilotos/bottas.webp'    },
]

// prettier-ignore
const cochesBase = [
  { id: 'alpine',       nombre: 'BWT Alpine F1',           puntos: 20, imagen: '/Coches/alpine.webp',       tipoCarta: 'coche' },
  { id: 'aston_martin', nombre: 'Aston Martin Aramco',     puntos: 10, imagen: '/Coches/astonmartin.webp',  tipoCarta: 'coche' },
  { id: 'audi',         nombre: 'Audi Revolut F1',         puntos: 15, imagen: '/Coches/audi.webp',         tipoCarta: 'coche' },
  { id: 'cadillac',     nombre: 'Cadillac F1',             puntos: 10, imagen: '/Coches/cadillac.webp',     tipoCarta: 'coche' },
  { id: 'ferrari',      nombre: 'Ferrari',                 puntos: 35, imagen: '/Coches/ferrari.webp',      tipoCarta: 'coche' },
  { id: 'haas',         nombre: 'TGR Haas F1',             puntos: 25, imagen: '/Coches/haas.webp',         tipoCarta: 'coche' },
  { id: 'mclaren',      nombre: 'McLaren Mastercard',      puntos: 30, imagen: '/Coches/mclaren.webp',      tipoCarta: 'coche' },
  { id: 'mercedes',     nombre: 'Mercedes-AMG',            puntos: 40, imagen: '/Coches/mercedes.webp',     tipoCarta: 'coche' },
  { id: 'racing_bulls', nombre: 'Racing Bulls VCARB',      puntos: 20, imagen: '/Coches/racingbulls.webp',  tipoCarta: 'coche' },
  { id: 'red_bull',     nombre: 'Red Bull Racing',         puntos: 20, imagen: '/Coches/redbull.webp',      tipoCarta: 'coche' },
  { id: 'williams',     nombre: 'Atlassian Williams',      puntos: 15, imagen: '/Coches/williams.webp',     tipoCarta: 'coche' },
]

/* eslint-disable */
// Cada potenciador multiplica los puntos de jornada del garaje cuando se equipa.
// El multiplicador SOLO se aplica si la condición se cumple en ese Gran Premio.
// Condiciones soportadas (evaluadas con datos OpenF1 de la carrera y/o del garaje):
//
//   Globales (dependen de la carrera completa):
//     - 'lluvia'              → llovió durante la carrera
//     - 'sin_lluvia'          → carrera disputada en seco
//     - 'safety_car'          → hubo al menos un Safety Car (real o virtual)
//     - 'carrera_limpia'      → carrera seca y sin ningún Safety Car
//     - 'caos'                → 3 o más abandonos en la carrera
//     - 'sin_abandonos'       → ningún abandono en toda la parrilla
//
//   Personales (dependen de los pilotos equipados en tu garaje):
//     - 'stint_largo'         → algún piloto tuvo un stint ≥ 50% de la carrera
//     - 'mis_remontadas'      → algún piloto remontó ≥ 3 posiciones netas (adelantamientos − adelantados)
//     - 'mis_pilotos_terminan'→ TODOS tus pilotos terminaron la carrera
//     - 'mi_piloto_punto'     → algún piloto terminó dentro de los 10 primeros
// prettier-ignore
const potenciadoresBase = [
  { id: 'x_mode',                nombre: 'X-Mode',                     imagen: '/Potenciadores/x-mode.webp',                 tipoCarta: 'potenciador', multiplicador: 1.4,  condicion: 'carrera_limpia',     descripcion: 'Diseñado para las rectas, ajusta el ángulo del alerón delantero y trasero, reduciendo la resistencia al avance.'     },
  { id: 'z_mode',                nombre: 'Z-Mode',                     imagen: '/Potenciadores/z-mode.webp',                 tipoCarta: 'potenciador', multiplicador: 1.4,  condicion: 'sin_lluvia',         descripcion: 'Diseñado para las curvas y zonas reviradas, el alerón delantero y trasero se cierran para empujar el coche contra el suelo.' },
  { id: 'fondo_plano',           nombre: 'Fondo Plano',                imagen: '/Potenciadores/fondo_plano.webp',            tipoCarta: 'potenciador', multiplicador: 1.25, condicion: 'sin_lluvia',         descripcion: 'Crea el efecto suelo: genera una zona de baja presión que succiona el monoplaza hacia el asfalto.'      },
  { id: 'deflectores_laterales', nombre: 'Deflectores Laterales',      imagen: '/Potenciadores/deflectores_laterales.webp', tipoCarta: 'potenciador', multiplicador: 1.2,  condicion: 'sin_lluvia',         descripcion: 'Organiza, limpia y distribuye flujos de aire que viajan desde la parte delantera hasta la parte trasera del coche.' },
  { id: 'morro_aerodinamico',    nombre: 'Morro Aerodinámico',         imagen: '/Potenciadores/morro_aerodinamico.webp',    tipoCarta: 'potenciador', multiplicador: 1.3,  condicion: 'sin_lluvia',         descripcion: 'Gestiona y prepara el flujo de aire antes de que golpee al resto del coche.'              },
  { id: 'x_mode_plus',           nombre: 'X-Mode+',                    imagen: '/Potenciadores/x-mode-plus.webp',           tipoCarta: 'potenciador', multiplicador: 1.5,  condicion: 'lluvia',             descripcion: 'Tercer modo intermedio del X-Mode, soluciona problemas de seguridad, especialmente en condiciones de lluvia.'      },
  { id: 'mgu_k',                 nombre: 'MGU-K',                      imagen: '/Potenciadores/mgu-k.webp',                 tipoCarta: 'potenciador', multiplicador: 1.45, condicion: 'safety_car',         descripcion: 'La Unidad Motor de Generador Cinético recupera la energía perdida en frenada para convertirla en electricidad.'  },
  { id: 'bateria_triple',        nombre: 'Bateria Triple',             imagen: '/Potenciadores/bateria_triple.webp',        tipoCarta: 'potenciador', multiplicador: 1.35, condicion: 'mis_remontadas',     descripcion: 'Aumenta la potencia eléctrica considerablemente, permitiendo entregar el triple de potencia eléctrica que antes.'         },
  { id: 'mapeo_agresivo',        nombre: 'Mapeo Agresivo',             imagen: '/Potenciadores/mapeo_agresivo.webp',        tipoCarta: 'potenciador', multiplicador: 1.5,  condicion: 'mis_pilotos_terminan',descripcion: 'Configuración electrónica extrema diseñada para extraer el mayor rendimiento del motor, asumiendo un gran desgaste.'                },
  { id: 'software_mejorado',     nombre: 'Software de Energia',        imagen: '/Potenciadores/software_mejorado.webp',     tipoCarta: 'potenciador', multiplicador: 1.25, condicion: 'carrera_limpia',     descripcion: 'Celebro electrónico que decide cuando cargar batería y cuando soltar la potencia a lo largo de una vuelta.'           },
  { id: 'combustible_sostenible',nombre: 'Combustible Biodegradable',  imagen: '/Potenciadores/combustible_sostenible.webp',tipoCarta: 'potenciador', multiplicador: 1.2,  condicion: 'sin_abandonos',      descripcion: 'Tipo de carburante fabricado 100% a partir de residuos orgánicos, permite modificar libremente las mangueras del motor.' },
  { id: 'suspension_reactiva',   nombre: 'Suspension Reactiva',        imagen: '/Potenciadores/suspension_reactiva.webp',   tipoCarta: 'potenciador', multiplicador: 1.3,  condicion: 'lluvia',             descripcion: 'Sistema mecánico diseñado para mantener la altura del coche constante respecto al suelo.'                },
  { id: 'chasis_ultraligero',    nombre: 'Chasis Ligero',              imagen: '/Potenciadores/chasis_ultraligero.webp',    tipoCarta: 'potenciador', multiplicador: 1.35, condicion: 'sin_lluvia',         descripcion: 'Reduce radicalmente el tamaño y el peso del monoplaza, disminuyendo la distancia entre ejes.'      },
  { id: 'frenos_reactivos',      nombre: 'Frenos Reactivos',           imagen: '/Potenciadores/frenos_reactivos.webp',      tipoCarta: 'potenciador', multiplicador: 1.25, condicion: 'safety_car',         descripcion: 'Funcionamiento inteligente del sistema hidráulico y electrónico trasero, coordina 3 fuerzas de frenado distintas.' },
  { id: 'caja_de_cambios',       nombre: 'Caja de Cambios',            imagen: '/Potenciadores/caja_de_cambios.webp',       tipoCarta: 'potenciador', multiplicador: 1.3,  condicion: 'mis_pilotos_terminan',descripcion: 'Transmite la potencia eléctrica y de gasolina del motor hacia las ruedas traseras.'            },
  { id: 'direccion_asistida',    nombre: 'Direccion Asistida',         imagen: '/Potenciadores/direccion_asistida.webp',    tipoCarta: 'potenciador', multiplicador: 1.2,  condicion: 'lluvia',             descripcion: 'Reduce el esfuerzo físico del piloto sobre el volante, permitiendole girar el coche con precisión.'             },
  { id: 'estratega',             nombre: 'Estratega',                  imagen: '/Potenciadores/estratega.webp',             tipoCarta: 'potenciador', multiplicador: 1.5,  condicion: 'safety_car',         descripcion: 'Cerebro matemático que decide cuando parar el coche en boxes, qué neumáticos montar y como gestionar el ritmo de carrera.' },
  { id: 'pit_crew',              nombre: 'Pit Crew',                   imagen: '/Potenciadores/pit_crew.webp',              tipoCarta: 'potenciador', multiplicador: 1.3,  condicion: 'safety_car',         descripcion: 'Grupo de personas encargado de cambiar los cuatro neumáticos del coche y realizar reparaciones de emergencia en parada.' },
  { id: 'analista',              nombre: 'Analista de Datos',          imagen: '/Potenciadores/analista.webp',              tipoCarta: 'potenciador', multiplicador: 1.2,  condicion: 'caos',               descripcion: 'Recopila, procesa e interpreta los millones de métricas generadas por el coche.'             },
  { id: 'ingeniero',             nombre: 'Ingeniero de Rendimiento',   imagen: '/Potenciadores/ingeniero.webp',             tipoCarta: 'potenciador', multiplicador: 1.3,  condicion: 'mis_pilotos_terminan',descripcion: 'Exprime el máximo agarre y velocidad pura del monoplaza ajustando las configuraciones mecánico-eléctricas.'              },
  { id: 'ingeniero_coms',        nombre: 'Ingeniero de Comunicaciones',imagen: '/Potenciadores/ingeniero_coms.webp',        tipoCarta: 'potenciador', multiplicador: 1.2,  condicion: 'mi_piloto_punto',    descripcion: 'Estratega cuya función es dirigir el plan de sesión, dar información de tráfico y gestionar la psicología del piloto.' },
  { id: 'modo_override',         nombre: 'Modo Override',              imagen: '/Potenciadores/modo_override.webp',         tipoCarta: 'potenciador', multiplicador: 1.6,  condicion: 'mis_remontadas',     descripcion: 'Sistema de asistencia eléctrica para adelantamientos, sustituye por completo al antiguo DRS.'          },
  { id: 'modo_defensa',          nombre: 'Modo Defensa',               imagen: '/Potenciadores/modo_defensa.webp',          tipoCarta: 'potenciador', multiplicador: 1.5,  condicion: 'stint_largo',        descripcion: 'Estrategia electrónica del motor configurada para proteger la posición ante un ataque.'           },
  { id: 'meteorologia',          nombre: 'Meteorologia',               imagen: '/Potenciadores/meterologia.webp',           tipoCarta: 'potenciador', multiplicador: 2.0,  condicion: 'lluvia',             descripcion: 'Conjunto de sensores diseñados para medir, registrar y analizar variables físicas de la atmosfera.'                },
  { id: 'simulador_nocturno',    nombre: 'Simulador nocturno',         imagen: '/Potenciadores/simulador_nocturno.webp',    tipoCarta: 'potenciador', multiplicador: 1.2,  condicion: 'mis_pilotos_terminan',descripcion: 'Trabajo técnico de simulación del equipo a altas horas de madrugada para corregir el monoplaza.'         },
]
/* eslint-enable */

// prettier-ignore
const variantesPiloto = [
  { variante: 'qualy',        perfil: 'qualy',        nombreHabilidad: 'Especialista en Qualy'     },
  { variante: 'carrera',      perfil: 'carrera',      nombreHabilidad: 'Especialista en Carrera'   },
  { variante: 'todo_terreno', perfil: 'todo_terreno', nombreHabilidad: 'Especialista Todo Terreno' },
  { variante: 'base',         perfil: 'base',         nombreHabilidad: 'Piloto Base'               },
  { variante: 'remontador',   perfil: 'remontador',   nombreHabilidad: 'Remontador'                },
  { variante: 'estratega',    perfil: 'estratega',    nombreHabilidad: 'Estratega'                 },
]

// Precio inicial uniforme para todas las cartas de piloto. El sistema de pujas
// dinámicas (catalogo/precios) los ajusta automáticamente a partir del primer
// Gran Premio en función del rendimiento real observado, sin intervención del
// desarrollador.
const PRECIO_INICIAL_PILOTO = 5.0

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
    precio: PRECIO_INICIAL_PILOTO,
  }
}


function construirCatalogoCompleto() {
  const pilotos = pilotosBase.flatMap((pilotoBase) => variantesPiloto.map((variante) => crearCartaPiloto(pilotoBase, variante)))

  const coches = cochesBase.map(({ puntos, ...resto }) => ({
    ...resto,
    puntuacionBase: puntos || 0,
    precio: Number(puntos || 0),
  }))

  const potenciadores = potenciadoresBase.map((potenciador) => ({
    ...potenciador,
    // El precio refleja la ventaja teórica del multiplicador, ponderada al alza
    // si la condición es exigente (potenciadores condicionales son más baratos
    // cuando no se cumple la condición, pero más rentables cuando sí).
    precio: Math.round((potenciador.multiplicador - 1) * 10 * 10) / 10,
  }))

  return { pilotos, coches, potenciadores }
}

module.exports = {
  construirCatalogoCompleto,
  pilotosBase,
  variantesPiloto,
}
