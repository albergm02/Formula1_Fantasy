/* ═══════════════════════════════════════════════════════════════════════════
   DATOS BASE — Espejo exacto de /src/data/bases/*
   ═══════════════════════════════════════════════════════════════════════════ */

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
  { id: 'alpine',       nombre: 'BWT Alpine F1',         precio: 16.0, puntos: 20, imagen: '/Coches/alpine.webp',      tipoCarta: 'coche', perfilPuntuacion: 'coche_base_v1', habilidad: { nombre: 'Sinergia de Equipo', puntos: 20, descripcion: 'Bono si alineas pilotos Alpine.' } },
  { id: 'aston_martin', nombre: 'Aston Martin Aramco',   precio: 10.0, puntos: 10, imagen: '/Coches/astonmartin.webp', tipoCarta: 'coche', perfilPuntuacion: 'coche_base_v1', habilidad: { nombre: 'Sinergia de Equipo', puntos: 10, descripcion: 'Bono si alineas pilotos Aston Martin.' } },
  { id: 'audi',         nombre: 'Audi Revolut F1',       precio: 13.0, puntos: 15, imagen: '/Coches/audi.webp',        tipoCarta: 'coche', perfilPuntuacion: 'coche_base_v1', habilidad: { nombre: 'Sinergia de Equipo', puntos: 15, descripcion: 'Bono si alineas pilotos Audi.' } },
  { id: 'cadillac',     nombre: 'Cadillac F1',           precio: 10.0, puntos: 10, imagen: '/Coches/cadillac.webp',    tipoCarta: 'coche', perfilPuntuacion: 'coche_base_v1', habilidad: { nombre: 'Sinergia de Equipo', puntos: 10, descripcion: 'Bono si alineas pilotos Cadillac.' } },
  { id: 'ferrari',      nombre: 'Ferrari',               precio: 26.0, puntos: 35, imagen: '/Coches/ferrari.webp',     tipoCarta: 'coche', perfilPuntuacion: 'coche_base_v1', habilidad: { nombre: 'Sinergia de Equipo', puntos: 35, descripcion: 'Bono si alineas pilotos Ferrari.' } },
  { id: 'haas',         nombre: 'TGR Haas F1',           precio: 18.0, puntos: 25, imagen: '/Coches/haas.webp',        tipoCarta: 'coche', perfilPuntuacion: 'coche_base_v1', habilidad: { nombre: 'Sinergia de Equipo', puntos: 25, descripcion: 'Bono si alineas pilotos Haas.' } },
  { id: 'mclaren',      nombre: 'McLaren Mastercard',    precio: 22.0, puntos: 30, imagen: '/Coches/mclaren.webp',     tipoCarta: 'coche', perfilPuntuacion: 'coche_base_v1', habilidad: { nombre: 'Sinergia de Equipo', puntos: 30, descripcion: 'Bono si alineas pilotos McLaren.' } },
  { id: 'mercedes',     nombre: 'Mercedes-AMG',          precio: 30.0, puntos: 40, imagen: '/Coches/mercedes.webp',    tipoCarta: 'coche', perfilPuntuacion: 'coche_base_v1', habilidad: { nombre: 'Sinergia de Equipo', puntos: 40, descripcion: 'Bono si alineas pilotos Mercedes.' } },
  { id: 'racing_bulls', nombre: 'Racing Bulls VCARB',    precio: 16.0, puntos: 20, imagen: '/Coches/racingbulls.webp', tipoCarta: 'coche', perfilPuntuacion: 'coche_base_v1', habilidad: { nombre: 'Sinergia de Equipo', puntos: 20, descripcion: 'Bono si alineas pilotos Racing Bulls.' } },
  { id: 'red_bull',     nombre: 'Red Bull Racing',       precio: 17.0, puntos: 20, imagen: '/Coches/redbull.webp',     tipoCarta: 'coche', perfilPuntuacion: 'coche_base_v1', habilidad: { nombre: 'Sinergia de Equipo', puntos: 20, descripcion: 'Bono si alineas pilotos Red Bull.' } },
  { id: 'williams',     nombre: 'Atlassian Williams',    precio: 12.0, puntos: 15, imagen: '/Coches/williams.webp',    tipoCarta: 'coche', perfilPuntuacion: 'coche_base_v1', habilidad: { nombre: 'Sinergia de Equipo', puntos: 15, descripcion: 'Bono si alineas pilotos Williams.' } },
]

/* eslint-disable */
// prettier-ignore
const potenciadoresBase = [
  { id: 'x_mode',                nombre: 'X-Mode',            categoria: 'aerodinamica',    precio: 3.0, imagen: '/Potenciadores/x-mode.webp',                icono: 'pi-forward',            color: '#38bdf8', tipoCarta: 'potenciador', mejoras: { ritmo:  8, consistencia:  0, adaptabilidad:  0, agresividad:  3, gestion:  0 }, descripcion: 'Modo de baja carga activa para rectas largas.'      },
  { id: 'z_mode',                nombre: 'Z-Mode',            categoria: 'aerodinamica',    precio: 3.0, imagen: '/Potenciadores/z-mode.webp',                icono: 'pi-shield',             color: '#6366f1', tipoCarta: 'potenciador', mejoras: { ritmo:  0, consistencia:  8, adaptabilidad:  0, agresividad:  0, gestion:  3 }, descripcion: 'Modo de alta carga para secciones tecnicas.'        },
  { id: 'fondo_plano',           nombre: 'Fondo Plano',       categoria: 'aerodinamica',    precio: 3.5, imagen: '/Potenciadores/fondo_plano.webp',           icono: 'pi-minus',              color: '#78716c', tipoCarta: 'potenciador', mejoras: { ritmo:  0, consistencia:  6, adaptabilidad:  3, agresividad:  0, gestion:  2 }, descripcion: 'Efecto suelo reforzado para mayor estabilidad.'     },
  { id: 'deflectores_laterales', nombre: 'Deflectores',       categoria: 'aerodinamica',    precio: 2.5, imagen: '/Potenciadores/deflectores_laterales.webp', icono: 'pi-arrows-h',           color: '#94a3b8', tipoCarta: 'potenciador', mejoras: { ritmo:  0, consistencia:  0, adaptabilidad:  6, agresividad:  2, gestion:  0 }, descripcion: 'Flujo de aire optimizado en condiciones turbulentas.'},
  { id: 'morro_aerodinamico',    nombre: 'Morro Aero',        categoria: 'aerodinamica',    precio: 3.0, imagen: '/Potenciadores/morro_aerodinamico.webp',    icono: 'pi-caret-right',        color: '#0ea5e9', tipoCarta: 'potenciador', mejoras: { ritmo:  5, consistencia:  3, adaptabilidad:  0, agresividad:  2, gestion:  0 }, descripcion: 'Punto de presion frontal optimizado.'               },
  { id: 'x_mode_plus',           nombre: 'X-Mode+',           categoria: 'aerodinamica',    precio: 4.5, imagen: '/Potenciadores/x-mode-plus.webp',           icono: 'pi-angle-double-right', color: '#38bdf8', tipoCarta: 'potenciador', mejoras: { ritmo:  8, consistencia:  0, adaptabilidad:  4, agresividad:  4, gestion:  0 }, descripcion: 'Activacion extendida de aerodinamica activa.'       },
  { id: 'mgu_k',                  nombre: 'MGU-K',             categoria: 'unidad_potencia', precio: 4.0, imagen: '/Potenciadores/mgu-k.webp',                 icono: 'pi-bolt',               color: '#facc15', tipoCarta: 'potenciador', mejoras: { ritmo: 10, consistencia:  0, adaptabilidad:  0, agresividad:  4, gestion: -2 }, descripcion: '350kW de potencia electrica — el corazon del PU 2026.' },
  { id: 'bateria_triple',         nombre: 'Bateria Triple',    categoria: 'unidad_potencia', precio: 4.0, imagen: '/Potenciadores/bateria_triple.webp',         icono: 'pi-battery',            color: '#22c55e', tipoCarta: 'potenciador', mejoras: { ritmo:  2, consistencia:  8, adaptabilidad:  0, agresividad:  0, gestion:  4 }, descripcion: 'Capacidad triplicada para deploy constante.'          },
  { id: 'mapeo_agresivo',         nombre: 'Mapeo Agresivo',    categoria: 'unidad_potencia', precio: 3.0, imagen: '/Potenciadores/mapeo_agresivo.webp',         icono: 'pi-exclamation-triangle',color: '#ef4444', tipoCarta: 'potenciador', mejoras: { ritmo:  7, consistencia: -3, adaptabilidad:  0, agresividad:  6, gestion: -3 }, descripcion: 'Mas potencia a costa de fiabilidad.'                 },
  { id: 'software_mejorado',      nombre: 'Software Energia',  categoria: 'unidad_potencia', precio: 3.5, imagen: '/Potenciadores/software_mejorado.webp',      icono: 'pi-microchip',          color: '#8b5cf6', tipoCarta: 'potenciador', mejoras: { ritmo:  0, consistencia:  0, adaptabilidad:  8, agresividad:  0, gestion:  5 }, descripcion: 'Gestion inteligente de deploy y harvest.'            },
  { id: 'combustible_sostenible', nombre: 'Combustible Bio',   categoria: 'unidad_potencia', precio: 2.5, imagen: '/Potenciadores/combustible_sostenible.webp', icono: 'pi-leaf',               color: '#16a34a', tipoCarta: 'potenciador', mejoras: { ritmo:  5, consistencia:  0, adaptabilidad:  0, agresividad:  0, gestion:  2 }, descripcion: 'Combustible 100% sostenible premium.'                },
  { id: 'suspension_reactiva',   nombre: 'Suspension',        categoria: 'chasis',          precio: 3.0, imagen: '/Potenciadores/suspension_reactiva.webp',   icono: 'pi-sliders-h',          color: '#f97316', tipoCarta: 'potenciador', mejoras: { ritmo:  0, consistencia:  3, adaptabilidad:  7, agresividad:  0, gestion:  3 }, descripcion: 'Absorcion activa de baches y curbs.'                },
  { id: 'chasis_ultraligero',    nombre: 'Chasis Ligero',     categoria: 'chasis',          precio: 3.5, imagen: '/Potenciadores/chasis_ultraligero.webp',    icono: 'pi-box',                color: '#d4d4d8', tipoCarta: 'potenciador', mejoras: { ritmo:  6, consistencia:  0, adaptabilidad:  0, agresividad:  3, gestion: -2 }, descripcion: 'Estructura mas ligera para mayor aceleracion.'      },
  { id: 'frenos_reactivos',      nombre: 'Frenos Ceramicos',  categoria: 'chasis',          precio: 3.0, imagen: '/Potenciadores/frenos_reactivos.webp',      icono: 'pi-stop-circle',        color: '#dc2626', tipoCarta: 'potenciador', mejoras: { ritmo:  2, consistencia:  6, adaptabilidad:  0, agresividad:  3, gestion:  0 }, descripcion: 'Frenadas mas consistentes vuelta tras vuelta.'      },
  { id: 'caja_de_cambios',       nombre: 'Caja Rapida',       categoria: 'chasis',          precio: 2.5, imagen: '/Potenciadores/caja_de_cambios.webp',       icono: 'pi-sort-alt',           color: '#a1a1aa', tipoCarta: 'potenciador', mejoras: { ritmo:  4, consistencia:  4, adaptabilidad:  0, agresividad:  2, gestion:  0 }, descripcion: 'Cambios de marcha mas suaves y rapidos.'            },
  { id: 'direccion_asistida',    nombre: 'Direccion Adapt.',  categoria: 'chasis',          precio: 2.5, imagen: '/Potenciadores/direccion_asistida.webp',    icono: 'pi-compass',            color: '#0284c7', tipoCarta: 'potenciador', mejoras: { ritmo:  0, consistencia:  0, adaptabilidad:  6, agresividad:  0, gestion:  3 }, descripcion: 'Respuesta mejorada a cambios de grip.'              },
  { id: 'estratega',             nombre: 'Estratega',         categoria: 'equipo_humano',   precio: 3.5, imagen: '/Potenciadores/estratega.webp',             icono: 'pi-chart-line',         color: '#6366f1', tipoCarta: 'potenciador', mejoras: { ritmo:  0, consistencia:  6, adaptabilidad:  4, agresividad:  0, gestion:  4 }, descripcion: 'Mejores decisiones de pit stop y estrategia.'       },
  { id: 'pit_crew',              nombre: 'Pit Crew Elite',    categoria: 'equipo_humano',   precio: 3.0, imagen: '/Potenciadores/pit_crew.webp',              icono: 'pi-users',              color: '#f97316', tipoCarta: 'potenciador', mejoras: { ritmo:  0, consistencia:  5, adaptabilidad:  0, agresividad:  0, gestion:  2 }, descripcion: 'Paradas en boxes mas rapidas y sin errores.'        },
  { id: 'analista',              nombre: 'Analista Datos',    categoria: 'equipo_humano',   precio: 3.0, imagen: '/Potenciadores/analista.webp',              icono: 'pi-database',           color: '#8b5cf6', tipoCarta: 'potenciador', mejoras: { ritmo:  0, consistencia:  0, adaptabilidad:  7, agresividad:  0, gestion:  3 }, descripcion: 'Ajustes en vivo basados en telemetria.'             },
  { id: 'ingeniero',             nombre: 'Ing. Rendimiento',  categoria: 'equipo_humano',   precio: 3.0, imagen: '/Potenciadores/ingeniero.webp',             icono: 'pi-wrench',             color: '#64748b', tipoCarta: 'potenciador', mejoras: { ritmo:  5, consistencia:  3, adaptabilidad:  0, agresividad:  0, gestion:  2 }, descripcion: 'Setup optimizado para cada circuito.'               },
  { id: 'ingeniero_coms',        nombre: 'Comunicaciones',    categoria: 'equipo_humano',   precio: 2.0, imagen: '/Potenciadores/ingeniero_coms.webp',        icono: 'pi-headphones',         color: '#0ea5e9', tipoCarta: 'potenciador', mejoras: { ritmo:  0, consistencia:  0, adaptabilidad:  4, agresividad:  3, gestion:  0 }, descripcion: 'Reaccion rapida a safety cars y banderas.'          },
  { id: 'modo_override',         nombre: 'Override Energia',  categoria: 'especial',        precio: 5.0, imagen: '/Potenciadores/modo_override.webp',         icono: 'pi-power-off',          color: '#ef4444', tipoCarta: 'potenciador', mejoras: { ritmo: 12, consistencia: -6, adaptabilidad:  0, agresividad:  6, gestion:  0 }, descripcion: 'Deploy completo de bateria en una vuelta.'          },
  { id: 'modo_defensa',          nombre: 'Modo Defensa',      categoria: 'especial',        precio: 4.5, imagen: '/Potenciadores/modo_defensa.webp',          icono: 'pi-lock',               color: '#22d3ee', tipoCarta: 'potenciador', mejoras: { ritmo: -4, consistencia: 12, adaptabilidad:  0, agresividad:  0, gestion:  8 }, descripcion: 'Conservacion extrema de componentes del coche y PU.'           },
  { id: 'meteorologia',          nombre: 'Meteorologia',      categoria: 'especial',        precio: 4.0, imagen: '/Potenciadores/meterologia.webp',           icono: 'pi-cloud',              color: '#a78bfa', tipoCarta: 'potenciador', mejoras: { ritmo:  0, consistencia:  0, adaptabilidad: 15, agresividad:  0, gestion:  0 }, descripcion: 'Prediccion meteorologica perfecta.'                 },
  { id: 'simulador_nocturno',    nombre: 'Simulador',         categoria: 'especial',        precio: 2.5, imagen: '/Potenciadores/simulador_nocturno.webp',    icono: 'pi-moon',               color: '#1e293b', tipoCarta: 'potenciador', mejoras: { ritmo:  3, consistencia:  3, adaptabilidad:  3, agresividad:  2, gestion:  2 }, descripcion: 'Preparacion extra del piloto en simulador.'         },
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
      'Stint ≥ 60% → +0.45 | ≥ 45% → +0.30 | ≥ 35% → +0.20 | ≥ 25% → +0.10',
      '1 parada → +0.15 | 2 paradas → +0.05 | 3+ → +0.00',
      'Posición: P1–P3 +0.15 | P4–P10 +0.05 | P16+ −0.10',
      'Cada SC → +0.05 | Cada VSC → +0.025 (máx +0.15)',
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

/* ═══════════════════════════════════════════════════════════════════════════
   Construcción del catálogo con precios por puntuación
   ═══════════════════════════════════════════════════════════════════════════ */

const RANGO_PRECIO_PILOTOS = { min: 10, max: 26 }
const RANGO_PRECIO_COCHES = { min: 10, max: 30 }
const RANGO_PRECIO_POTENCIADORES = { min: 2, max: 5 }

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
