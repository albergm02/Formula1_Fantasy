const RANGO_PRECIO_PILOTOS = { min: 10, max: 26 }
const RANGO_PRECIO_COCHES = { min: 10, max: 30 }
const RANGO_PRECIO_POTENCIADORES = { min: 2, max: 5 }

// prettier-ignore
const pilotosBase = [
  /* ══════════ McLAREN ══════════ */
  { numero:  1, nombre: 'Lando Norris',      equipo: 'McLaren', imagen: '/Pilotos/norris.webp',     atributos: { ritmo: 93, consistencia: 86, adaptabilidad: 85, agresividad: 70, gestion: 85 } },
  { numero: 81, nombre: 'Oscar Piastri',     equipo: 'McLaren', imagen: '/Pilotos/piastri.webp',    atributos: { ritmo: 86, consistencia: 87, adaptabilidad: 76, agresividad: 84, gestion: 80 } },

  /* ══════════ RED BULL ══════════ */
  { numero:  3, nombre: 'Max Verstappen',    equipo: 'Red Bull', imagen: '/Pilotos/verstappen.webp', atributos: { ritmo: 88, consistencia: 88, adaptabilidad: 86, agresividad: 93, gestion: 64 } },
  { numero:  6, nombre: 'Isack Hadjar',      equipo: 'Red Bull', imagen: '/Pilotos/hadjar.webp',     atributos: { ritmo: 70, consistencia: 60, adaptabilidad: 64, agresividad: 52, gestion: 56 } },

  /* ══════════ FERRARI ══════════ */
  { numero: 16, nombre: 'Charles Leclerc',   equipo: 'Ferrari', imagen: '/Pilotos/leclerc.webp',    atributos: { ritmo: 93, consistencia: 72, adaptabilidad: 78, agresividad: 87, gestion: 58 } },
  { numero: 44, nombre: 'Lewis Hamilton',    equipo: 'Ferrari', imagen: '/Pilotos/hamilton.webp',   atributos: { ritmo: 70, consistencia: 86, adaptabilidad: 88, agresividad: 76, gestion: 90 } },

  /* ══════════ MERCEDES ══════════ */
  { numero: 63, nombre: 'George Russell',    equipo: 'Mercedes', imagen: '/Pilotos/russell.webp',    atributos: { ritmo: 90, consistencia: 88, adaptabilidad: 60, agresividad: 56, gestion: 88 } },
  { numero: 12, nombre: 'Kimi Antonelli',    equipo: 'Mercedes', imagen: '/Pilotos/antonelli.webp',  atributos: { ritmo: 90, consistencia: 84, adaptabilidad: 88, agresividad: 86, gestion: 76 } },

  /* ══════════ ASTON MARTIN ══════════ */
  { numero: 14, nombre: 'Fernando Alonso',   equipo: 'Aston Martin', imagen: '/Pilotos/alonso.webp',     atributos: { ritmo: 71, consistencia: 86, adaptabilidad: 85, agresividad: 87, gestion: 93 } },
  { numero: 18, nombre: 'Lance Stroll',      equipo: 'Aston Martin', imagen: '/Pilotos/stroll.webp',     atributos: { ritmo: 50, consistencia: 42, adaptabilidad: 58, agresividad: 78, gestion: 46 } },

  /* ══════════ WILLIAMS ══════════ */
  { numero: 55, nombre: 'Carlos Sainz',      equipo: 'Williams', imagen: '/Pilotos/sainz.webp',      atributos: { ritmo: 80, consistencia: 54, adaptabilidad: 82, agresividad: 60, gestion: 88 } },
  { numero: 23, nombre: 'Alexander Albon',   equipo: 'Williams', imagen: '/Pilotos/albon.webp',      atributos: { ritmo: 84, consistencia: 56, adaptabilidad: 76, agresividad: 76, gestion: 50 } },

  /* ══════════ HAAS ══════════ */
  { numero: 31, nombre: 'Esteban Ocon',      equipo: 'Haas', imagen: '/Pilotos/ocon.webp',       atributos: { ritmo: 50, consistencia: 54, adaptabilidad: 78, agresividad: 94, gestion: 44 } },
  { numero: 87, nombre: 'Oliver Bearman',    equipo: 'Haas', imagen: '/Pilotos/bearman.webp',    atributos: { ritmo: 58, consistencia: 48, adaptabilidad: 60, agresividad: 60, gestion: 44 } },

  /* ══════════ AUDI ══════════ */
  { numero: 27, nombre: 'Nico Hulkenberg',   equipo: 'Audi', imagen: '/Pilotos/hulkenberg.webp', atributos: { ritmo: 64, consistencia: 82, adaptabilidad: 56, agresividad: 54, gestion: 56 } },
  { numero:  5, nombre: 'Gabriel Bortoleto', equipo: 'Audi', imagen: '/Pilotos/bortoleto.webp',  atributos: { ritmo: 56, consistencia: 42, adaptabilidad: 64, agresividad: 50, gestion: 40 } },

  /* ══════════ ALPINE ══════════ */
  { numero: 10, nombre: 'Pierre Gasly',      equipo: 'Alpine', imagen: '/Pilotos/gasly.webp',      atributos: { ritmo: 72, consistencia: 76, adaptabilidad: 64, agresividad: 60, gestion: 64 } },
  { numero: 43, nombre: 'Franco Colapinto',  equipo: 'Alpine', imagen: '/Pilotos/colapinto.webp',  atributos: { ritmo: 54, consistencia: 40, adaptabilidad: 76, agresividad: 68, gestion: 40 } },

  /* ══════════ RACING BULLS ══════════ */
  { numero: 30, nombre: 'Liam Lawson',       equipo: 'Racing Bulls', imagen: '/Pilotos/lawson.webp',     atributos: { ritmo: 64, consistencia: 50, adaptabilidad: 66, agresividad: 56, gestion: 48 } },
  { numero: 41, nombre: 'Arvid Lindblad',    equipo: 'Racing Bulls', imagen: '/Pilotos/lindblad.webp',   atributos: { ritmo: 54, consistencia: 40, adaptabilidad: 60, agresividad: 46, gestion: 40 } },

  /* ══════════ CADILLAC ══════════ */
  { numero: 11, nombre: 'Sergio Perez',      equipo: 'Cadillac', imagen: '/Pilotos/perez.webp',      atributos: { ritmo: 54, consistencia: 64, adaptabilidad: 72, agresividad: 54, gestion: 72 } },
  { numero: 77, nombre: 'Valtteri Bottas',   equipo: 'Cadillac', imagen: '/Pilotos/bottas.webp',     atributos: { ritmo: 50, consistencia: 76, adaptabilidad: 46, agresividad: 40, gestion: 85 } },
]

// prettier-ignore
const cochesBase = [
  { id: 'alpine',       nombre: 'BWT Alpine F1', puntos: 20, imagen: '/Coches/alpine.webp',      tipoCarta: 'coche', habilidad: { nombre: 'Sinergia de Equipo', puntos: 20, descripcion: 'Bono si alineas pilotos Alpine.' } },
  { id: 'aston_martin', nombre: 'Aston Martin Aramco', puntos: 10, imagen: '/Coches/astonmartin.webp', tipoCarta: 'coche', habilidad: { nombre: 'Sinergia de Equipo', puntos: 10, descripcion: 'Bono si alineas pilotos Aston Martin.' } },
  { id: 'audi',         nombre: 'Audi Revolut F1', puntos: 15, imagen: '/Coches/audi.webp',        tipoCarta: 'coche', habilidad: { nombre: 'Sinergia de Equipo', puntos: 15, descripcion: 'Bono si alineas pilotos Audi.' } },
  { id: 'cadillac',     nombre: 'Cadillac F1', puntos: 10, imagen: '/Coches/cadillac.webp',    tipoCarta: 'coche', habilidad: { nombre: 'Sinergia de Equipo', puntos: 10, descripcion: 'Bono si alineas pilotos Cadillac.' } },
  { id: 'ferrari',      nombre: 'Ferrari', puntos: 35, imagen: '/Coches/ferrari.webp',     tipoCarta: 'coche', habilidad: { nombre: 'Sinergia de Equipo', puntos: 35, descripcion: 'Bono si alineas pilotos Ferrari.' } },
  { id: 'haas',         nombre: 'TGR Haas F1', puntos: 25, imagen: '/Coches/haas.webp',        tipoCarta: 'coche', habilidad: { nombre: 'Sinergia de Equipo', puntos: 25, descripcion: 'Bono si alineas pilotos Haas.' } },
  { id: 'mclaren',      nombre: 'McLaren Mastercard', puntos: 30, imagen: '/Coches/mclaren.webp',     tipoCarta: 'coche', habilidad: { nombre: 'Sinergia de Equipo', puntos: 30, descripcion: 'Bono si alineas pilotos McLaren.' } },
  { id: 'mercedes',     nombre: 'Mercedes-AMG', puntos: 40, imagen: '/Coches/mercedes.webp',    tipoCarta: 'coche', habilidad: { nombre: 'Sinergia de Equipo', puntos: 40, descripcion: 'Bono si alineas pilotos Mercedes.' } },
  { id: 'racing_bulls', nombre: 'Racing Bulls VCARB', puntos: 20, imagen: '/Coches/racingbulls.webp', tipoCarta: 'coche', habilidad: { nombre: 'Sinergia de Equipo', puntos: 20, descripcion: 'Bono si alineas pilotos Racing Bulls.' } },
  { id: 'red_bull',     nombre: 'Red Bull Racing', puntos: 20, imagen: '/Coches/redbull.webp',     tipoCarta: 'coche', habilidad: { nombre: 'Sinergia de Equipo', puntos: 20, descripcion: 'Bono si alineas pilotos Red Bull.' } },
  { id: 'williams',     nombre: 'Atlassian Williams', puntos: 15, imagen: '/Coches/williams.webp',    tipoCarta: 'coche', habilidad: { nombre: 'Sinergia de Equipo', puntos: 15, descripcion: 'Bono si alineas pilotos Williams.' } },
]

/* eslint-disable */
// prettier-ignore
const potenciadoresBase = [
  { id: 'x_mode',                nombre: 'X-Mode', imagen: '/Potenciadores/x-mode.webp',                tipoCarta: 'potenciador', mejoras: { ritmo: 24, consistencia:  0, adaptabilidad:  0, agresividad:  9, gestion:  0 }, descripcion: 'Diseñado para las rectas, ajusta el ángulo del alerón delantero y trasero, reduciendo la resistencia al avance.'      },
  { id: 'z_mode',                nombre: 'Z-Mode', imagen: '/Potenciadores/z-mode.webp',                tipoCarta: 'potenciador', mejoras: { ritmo:  0, consistencia: 24, adaptabilidad:  0, agresividad:  0, gestion:  9 }, descripcion: 'Diseñado para las curvas y zonas reviradas, el alerón delantero y trasero se cierran para empujar el coche contra el suelo.'        },
  { id: 'fondo_plano',           nombre: 'Fondo Plano', imagen: '/Potenciadores/fondo_plano.webp',           tipoCarta: 'potenciador', mejoras: { ritmo:  0, consistencia: 18, adaptabilidad:  9, agresividad:  0, gestion:  6 }, descripcion: 'Crea el efecto suelo: genera una zona de baja presión que succiona el monoplaza hacia el asfalto.'     },
  { id: 'deflectores_laterales', nombre: 'Deflectores Laterales', imagen: '/Potenciadores/deflectores_laterales.webp', tipoCarta: 'potenciador', mejoras: { ritmo:  0, consistencia:  0, adaptabilidad: 18, agresividad:  6, gestion:  0 }, descripcion: 'Organiza, limpia y distribuye flujos de aire que viajan desde la parte delantera hasta la parte trasera del coche.'},
  { id: 'morro_aerodinamico',    nombre: 'Morro Aerodinámico', imagen: '/Potenciadores/morro_aerodinamico.webp',    tipoCarta: 'potenciador', mejoras: { ritmo: 15, consistencia:  9, adaptabilidad:  0, agresividad:  6, gestion:  0 }, descripcion: 'Gestiona y prepara el flujo de aire antes de que golpee al resto del coche.'               },
  { id: 'x_mode_plus',           nombre: 'X-Mode+', imagen: '/Potenciadores/x-mode-plus.webp',           tipoCarta: 'potenciador', mejoras: { ritmo: 24, consistencia:  0, adaptabilidad: 12, agresividad: 12, gestion:  0 }, descripcion: 'Tercer modo intermedio del X-Mode, soluciona problemas de seguridad, especialmente en condiciones de lluvia.'       },
  { id: 'mgu_k',                  nombre: 'MGU-K', imagen: '/Potenciadores/mgu-k.webp',                 tipoCarta: 'potenciador', mejoras: { ritmo: 30, consistencia:  0, adaptabilidad:  0, agresividad: 12, gestion: -4 }, descripcion: 'La Unidad Motor de Generador Cinético recupera la energía perdida en frenada para convertirla en electricidad.' },
  { id: 'bateria_triple',         nombre: 'Bateria Triple', imagen: '/Potenciadores/bateria_triple.webp',         tipoCarta: 'potenciador', mejoras: { ritmo:  6, consistencia: 24, adaptabilidad:  0, agresividad:  0, gestion: 12 }, descripcion: 'Aumenta la potencia eléctrica considerablemente, permitiendo entregar el triple de potencia eléctrica que antes.'          },
  { id: 'mapeo_agresivo',         nombre: 'Mapeo Agresivo', imagen: '/Potenciadores/mapeo_agresivo.webp',         tipoCarta: 'potenciador', mejoras: { ritmo: 21, consistencia: -6, adaptabilidad:  0, agresividad: 18, gestion: -6 }, descripcion: 'Configuración electrónica extrema diseñada para extraer el mayor rendimiento del motor, asumiendo un gran desgaste.'                 },
  { id: 'software_mejorado',      nombre: 'Software de Energia', imagen: '/Potenciadores/software_mejorado.webp',      tipoCarta: 'potenciador', mejoras: { ritmo:  0, consistencia:  0, adaptabilidad: 24, agresividad:  0, gestion: 15 }, descripcion: 'Celebro electrónico que decide cuando cargar batería y cuando soltar la potencia a lo largo de una vuelta.'            },
  { id: 'combustible_sostenible', nombre: 'Combustible Biodegradable', imagen: '/Potenciadores/combustible_sostenible.webp', tipoCarta: 'potenciador', mejoras: { ritmo: 15, consistencia:  0, adaptabilidad:  0, agresividad:  0, gestion:  6 }, descripcion: 'Tipo de carburante fabricado 100% a partir de residuos orgánicos, permite modificar libremente las mangueras del motor.'                },
  { id: 'suspension_reactiva',   nombre: 'Suspension Reactiva', imagen: '/Potenciadores/suspension_reactiva.webp',   tipoCarta: 'potenciador', mejoras: { ritmo:  0, consistencia:  9, adaptabilidad: 21, agresividad:  0, gestion:  9 }, descripcion: 'Sistema mecánico diseñado para mantener la altura del coche constante respecto al suelo.'                },
  { id: 'chasis_ultraligero',    nombre: 'Chasis Ligero', imagen: '/Potenciadores/chasis_ultraligero.webp',    tipoCarta: 'potenciador', mejoras: { ritmo: 18, consistencia:  0, adaptabilidad:  0, agresividad:  9, gestion: -4 }, descripcion: 'Reduce radicalmente el tamaño y el peso del monoplaza, disminuyendo la distancia entre ejes.'      },
  { id: 'frenos_reactivos',      nombre: 'Frenos Reactivos', imagen: '/Potenciadores/frenos_reactivos.webp',      tipoCarta: 'potenciador', mejoras: { ritmo:  6, consistencia: 18, adaptabilidad:  0, agresividad:  9, gestion:  0 }, descripcion: 'Funcionamiento inteligente del sistema hidráulico y electrónico trasero, coordina 3 fuerzas de frenado distintas.'      },
  { id: 'caja_de_cambios',       nombre: 'Caja de Cambios', imagen: '/Potenciadores/caja_de_cambios.webp',       tipoCarta: 'potenciador', mejoras: { ritmo: 12, consistencia: 12, adaptabilidad:  0, agresividad:  6, gestion:  0 }, descripcion: 'Transmite la potencia eléctrica y de gasolina del motor hacia las ruedas traseras.'            },
  { id: 'direccion_asistida',    nombre: 'Direccion Asistida', imagen: '/Potenciadores/direccion_asistida.webp',    tipoCarta: 'potenciador', mejoras: { ritmo:  0, consistencia:  0, adaptabilidad: 18, agresividad:  0, gestion:  9 }, descripcion: 'Reduce el esfuerzo físico del piloto sobre el volante, permitiendole girar el coche con precisión.'              },
  { id: 'estratega',             nombre: 'Estratega', imagen: '/Potenciadores/estratega.webp',             tipoCarta: 'potenciador', mejoras: { ritmo:  0, consistencia: 18, adaptabilidad: 12, agresividad:  0, gestion: 12 }, descripcion: 'Cerebro matemático que decide cuando parar el coche en boxes, qué neumáticos montar y como gestionar el ritmo de carrera.'       },
  { id: 'pit_crew',              nombre: 'Pit Crew', imagen: '/Potenciadores/pit_crew.webp',              tipoCarta: 'potenciador', mejoras: { ritmo:  0, consistencia: 15, adaptabilidad:  0, agresividad:  0, gestion:  6 }, descripcion: 'Grupo de personas encargado de cambiar los cuatro neumáticos del coche y realizar reparaciones de emergencia en parada.'        },
  { id: 'analista',              nombre: 'Analista de Datos', imagen: '/Potenciadores/analista.webp',              tipoCarta: 'potenciador', mejoras: { ritmo:  0, consistencia:  0, adaptabilidad: 21, agresividad:  0, gestion:  9 }, descripcion: 'Recopila, procesa e interpreta los millones de métricas generadas por el coche.'             },
  { id: 'ingeniero',             nombre: 'Ingeniero de Rendimiento', imagen: '/Potenciadores/ingeniero.webp',             tipoCarta: 'potenciador', mejoras: { ritmo: 15, consistencia:  9, adaptabilidad:  0, agresividad:  0, gestion:  6 }, descripcion: 'Exprime el máximo agarre y velocidad pura del monoplaza ajustando las configuraciones mecánico-eléctricas.'               },
  { id: 'ingeniero_coms',        nombre: 'Ingeniero de Comunicaciones', imagen: '/Potenciadores/ingeniero_coms.webp',        tipoCarta: 'potenciador', mejoras: { ritmo:  0, consistencia:  0, adaptabilidad: 12, agresividad:  9, gestion:  0 }, descripcion: 'Estratega cuya función es dirigir el plan de sesión, dar información de tráfico y gestionar la psicología del piloto.'          },
  { id: 'modo_override',         nombre: 'Modo Override', imagen: '/Potenciadores/modo_override.webp',         tipoCarta: 'potenciador', mejoras: { ritmo: 36, consistencia: -12, adaptabilidad:  0, agresividad: 18, gestion:  0 }, descripcion: 'Sistema de asistencia eléctrica para adelantamientos, sustituye por completo al antiguo DRS.'          },
  { id: 'modo_defensa',          nombre: 'Modo Defensa', imagen: '/Potenciadores/modo_defensa.webp',     tipoCarta: 'potenciador', mejoras: { ritmo: -8, consistencia: 36, adaptabilidad:  0, agresividad:  0, gestion: 24 }, descripcion: 'Estrategia electrónica del motor configurada para proteger la posición ante un ataque.'           },
  { id: 'meteorologia',          nombre: 'Meteorologia', imagen: '/Potenciadores/meterologia.webp',      tipoCarta: 'potenciador', mejoras: { ritmo:  0, consistencia:  0, adaptabilidad: 45, agresividad:  0, gestion:  0 }, descripcion: 'Conjunto de sensores diseñados para medir, registrar y analizar variables físicas de la atmosfera.'                 },
  { id: 'simulador_nocturno',    nombre: 'Simulador nocturno', imagen: '/Potenciadores/simulador_nocturno.webp',  tipoCarta: 'potenciador', mejoras: { ritmo:  9, consistencia:  9, adaptabilidad:  9, agresividad:  6, gestion:  6 }, descripcion: 'Trabajo técnico de simulación del equipo a altas horas de madrugada para corregir el monoplaza.'         },
]
/* eslint-enable */

// prettier-ignore
const perfilesPuntuacion = {
  qualy: {
    pesos: { ritmo: 0.5, consistencia: 0, adaptabilidad: 0, agresividad: 0.5, gestion: 0 },
    reglasUsuario: [
      'Factor según posición en clasificación:',
      'P1 – P3 → ×1.50',
      'P4 – P6 → ×1.25',
      'P7 – P10 → ×1.10',
      'P11 – P15 → ×0.85',
      'P16+ → ×0.65',
      'Factor acotado al rango 0.50 – 1.50.',
    ],
  },
  carrera: {
    pesos: { ritmo: 0.2, consistencia: 0.4, adaptabilidad: 0, agresividad: 0, gestion: 0.4 },
    reglasUsuario: [
      'Factor según posición final en carrera:',
      'P1 → ×1.50',
      'P2 → ×1.40',
      'P3 → ×1.30',
      'P4 – P5 → ×1.20',
      'P6 – P10 → ×1.00',
      'P11 – P15 → ×0.80',
      'P16 – P20 → ×0.60',
      'P20+ → ×0.50',
      'Factor acotado al rango 0.50 – 1.50.',
    ],
  },
  todo_terreno: {
    pesos: { ritmo: 0.1, consistencia: 0.1, adaptabilidad: 0.6, agresividad: 0.1, gestion: 0.1 },
    reglasUsuario: [
      'Factor base según el clima:',
      'Lluvia → 1.00 | Sin lluvia → 0.50',
      'Cada Safety Car → +0.05',
      'Cada Virtual SC → +0.05',
      'Cada abandono (DNF) → +0.10',
      'Factor = base + bonus, acotado al rango 0.50 – 1.50.',
    ],
  },
  base: {
    pesos: { ritmo: 0.2, consistencia: 0.2, adaptabilidad: 0.2, agresividad: 0.2, gestion: 0.2 },
    reglasUsuario: [
      'Media de los factores Qualy, Carrera y Todo Terreno:',
      'Factor = (factorQualy + factorCarrera + factorTodoTerreno) / 3',
      'Perfil equilibrado sin especialización.',
      'Factor acotado al rango 0.50 – 1.50.',
    ],
  },
  remontador: {
    pesos: { ritmo: 0.2, consistencia: 0, adaptabilidad: 0.4, agresividad: 0.4, gestion: 0 },
    reglasUsuario: [
      'Factor según diferencial de adelantamientos (OpenF1 /overtakes):',
      'diferencial = adelantamientos realizados − recibidos',
      'Factor = 1.0 + diferencial × 0.1',
      'Ej: +5 → ×1.50 | 0 → ×1.00 | −5 → ×0.50',
      'Factor acotado al rango 0.50 – 1.50.',
    ],
  },
  estratega: {
    pesos: { ritmo: 0.1, consistencia: 0.4, adaptabilidad: 0, agresividad: 0, gestion: 0.5 },
    reglasUsuario: [
      'Factor compuesto por gestión, paradas y posición:',
      'Base: 0.70',
      'Stint ≥ 60% → +0.50 | ≥ 45% → +0.30 | ≥ 35% → +0.20 | ≥ 25% → +0.10',
      'DNF → no puntua el stint',
      '1 parada → +0.15 | 2 paradas → +0.05 | 3+ → +0.00',
      'Posición: P1–P3 +0.15 | P4–P10 +0.05 | P16+ −0.10',
      'Factor acotado al rango 0.50 – 1.50.',
    ],
  },
}

// prettier-ignore
const variantesPiloto = [
  { variante: 'qualy',        perfil: 'qualy',        incrementoPrecio: 0, nombreHabilidad: 'Especialista en Qualy',      color: '#38bdf8', icono: 'pi-stopwatch'  },
  { variante: 'carrera',      perfil: 'carrera',      incrementoPrecio: 0, nombreHabilidad: 'Especialista en Carrera',    color: '#f97316', icono: 'pi-flag-fill'  },
  { variante: 'todo_terreno', perfil: 'todo_terreno', incrementoPrecio: 0, nombreHabilidad: 'Especialista Todo Terreno', color: '#a78bfa', icono: 'pi-cloud'      },
  { variante: 'base',         perfil: 'base',         incrementoPrecio: 0, nombreHabilidad: 'Piloto Base',               color: '#a1a1aa', icono: 'pi-user'       },
  { variante: 'remontador',   perfil: 'remontador',   incrementoPrecio: 0, nombreHabilidad: 'Remontador',               color: '#ef4444', icono: 'pi-arrow-up'   },
  { variante: 'estratega',    perfil: 'estratega',    incrementoPrecio: 0, nombreHabilidad: 'Estratega',                color: '#10b981', icono: 'pi-chart-bar'  },
]

function calcularPuntuacionBase(atributos, pesos) {
  return (
    Math.round(
      ((pesos.ritmo || 0) * atributos.ritmo +
        (pesos.consistencia || 0) * atributos.consistencia +
        (pesos.adaptabilidad || 0) * atributos.adaptabilidad +
        (pesos.agresividad || 0) * (atributos.agresividad || 0) +
        (pesos.gestion || 0) * (atributos.gestion || 0)) *
        10,
    ) / 10
  )
}

function calcularPuntuacionBasePotenciador(mejoras = {}) {
  const ritmo = mejoras.ritmo || 0
  const consistencia = mejoras.consistencia || 0
  const adaptabilidad = mejoras.adaptabilidad || 0
  const agresividad = mejoras.agresividad || 0
  const gestion = mejoras.gestion || 0
  return Math.round((ritmo + consistencia + adaptabilidad + agresividad + gestion) * 10) / 10
}

function calcularPrecioPorPuntuacion(puntuacionBase, puntuacionMinima, puntuacionMaxima, rango) {
  if (puntuacionMaxima <= puntuacionMinima) {
    return Number(rango.min.toFixed(1))
  }
  const pesoNormalizado =
    (puntuacionBase - puntuacionMinima) / (puntuacionMaxima - puntuacionMinima)
  const precio = rango.min + pesoNormalizado * (rango.max - rango.min)
  return Number(precio.toFixed(1))
}

function crearCartaPiloto(pilotoBase, variante) {
  const perfil = perfilesPuntuacion[variante.perfil]
  const puntuacionBase = calcularPuntuacionBase(pilotoBase.atributos, perfil.pesos)
  return {
    id: `${pilotoBase.numero}_${variante.variante}`,
    numero: pilotoBase.numero,
    nombre: pilotoBase.nombre,
    equipo: pilotoBase.equipo,
    imagen: pilotoBase.imagen,
    tipoCarta: 'piloto',
    variante: variante.variante,
    colorVariante: variante.color,
    iconoVariante: variante.icono,
    nombreVariante: variante.nombreHabilidad,
    perfilPuntuacion: variante.perfil,
    pesos: perfil.pesos,
    atributos: pilotoBase.atributos,
    puntuacionBase,
    reglasUsuario: perfil.reglasUsuario,
  }
}

function aplicarPreciosNormalizados(cartas, rango) {
  const puntuaciones = cartas.map((carta) => carta.puntuacionBase)
  const minima = Math.min(...puntuaciones)
  const maxima = Math.max(...puntuaciones)
  return cartas.map((carta) => ({
    ...carta,
    precio: calcularPrecioPorPuntuacion(carta.puntuacionBase, minima, maxima, rango),
  }))
}

/**
 * Construye el catálogo completo con precios calculados por puntuación normalizada.
 * @returns {{ pilotos: Array, coches: Array, potenciadores: Array }}
 */
function construirCatalogoCompleto() {
  const pilotosSinPrecio = pilotosBase.flatMap((pilotoBase) =>
    variantesPiloto.map((variante) => crearCartaPiloto(pilotoBase, variante)),
  )
  const pilotos = aplicarPreciosNormalizados(pilotosSinPrecio, RANGO_PRECIO_PILOTOS)

  const cochesSinPrecio = cochesBase.map((coche) => ({
    ...coche,
    puntuacionBase: coche.puntos || 0,
  }))
  const coches = aplicarPreciosNormalizados(cochesSinPrecio, RANGO_PRECIO_COCHES)

  const potenciadoresSinPrecio = potenciadoresBase.map((potenciador) => ({
    ...potenciador,
    puntuacionBase: calcularPuntuacionBasePotenciador(potenciador.mejoras),
  }))
  const potenciadores = aplicarPreciosNormalizados(
    potenciadoresSinPrecio,
    RANGO_PRECIO_POTENCIADORES,
  )

  return { pilotos, coches, potenciadores }
}

module.exports = {
  construirCatalogoCompleto,
  pilotosBase,
}
