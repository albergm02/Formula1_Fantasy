/**
 * mercadoServer.js — Catálogo completo de cartas para Cloud Functions.
 *
 * Este módulo replica los datos de /src/data/ en formato CommonJS
 * para que las Cloud Functions puedan generar el mercado diario
 * sin depender del frontend (que usa ESM + Vite).
 *
 * Exporta:
 *  - generarCatalogo()  → { pilotos, coches, potenciadores }
 *  - seleccionarCartasDiarias(catalogo) → cartas mezcladas del día
 *
 * @module mercadoServer
 */

/* ═══════════════════════════════════════════════════════════════════════════
   DATOS BASE — Espejo exacto de /src/data/bases/*
   ═══════════════════════════════════════════════════════════════════════════ */

// prettier-ignore
const pilotosBase = [
  /* ══════════ McLAREN ══════════ */
  { numero:  1, nombre: 'Lando Norris',      equipo: 'McLaren',      precioBase: 26.0, imagen: '/Pilotos/norris.webp',     atributos: { ritmo: 93, consistencia: 83, adaptabilidad: 82, agresividad: 64, gestion: 82 } },
  { numero: 81, nombre: 'Oscar Piastri',     equipo: 'McLaren',      precioBase: 24.0, imagen: '/Pilotos/piastri.webp',    atributos: { ritmo: 86, consistencia: 87, adaptabilidad: 78, agresividad: 83, gestion: 80 } },

  /* ══════════ RED BULL ══════════ */
  { numero:  3, nombre: 'Max Verstappen',    equipo: 'Red Bull',     precioBase: 25.0, imagen: '/Pilotos/verstappen.webp', atributos: { ritmo: 90, consistencia: 90, adaptabilidad: 88, agresividad: 98, gestion: 72 } },
  { numero:  6, nombre: 'Isack Hadjar',      equipo: 'Red Bull',     precioBase: 15.0, imagen: '/Pilotos/hadjar.webp',     atributos: { ritmo: 75, consistencia: 70, adaptabilidad: 72, agresividad: 64, gestion: 68 } },

  /* ══════════ FERRARI ══════════ */
  { numero: 16, nombre: 'Charles Leclerc',   equipo: 'Ferrari',      precioBase: 24.0, imagen: '/Pilotos/leclerc.webp',    atributos: { ritmo: 96, consistencia: 78, adaptabilidad: 80, agresividad: 87, gestion: 70 } },
  { numero: 44, nombre: 'Lewis Hamilton',    equipo: 'Ferrari',      precioBase: 23.0, imagen: '/Pilotos/hamilton.webp',   atributos: { ritmo: 76, consistencia: 88, adaptabilidad: 90, agresividad: 81, gestion: 93 } },

  /* ══════════ MERCEDES ══════════ */
  { numero: 63, nombre: 'George Russell',    equipo: 'Mercedes',     precioBase: 22.0, imagen: '/Pilotos/russell.webp',    atributos: { ritmo: 92, consistencia: 90, adaptabilidad: 70, agresividad: 69, gestion: 90 } },
  { numero: 12, nombre: 'Kimi Antonelli',    equipo: 'Mercedes',     precioBase: 20.0, imagen: '/Pilotos/antonelli.webp',  atributos: { ritmo: 89, consistencia: 81, adaptabilidad: 87, agresividad: 86, gestion: 72 } },

  /* ══════════ ASTON MARTIN ══════════ */
  { numero: 14, nombre: 'Fernando Alonso',   equipo: 'Aston Martin', precioBase: 19.0, imagen: '/Pilotos/alonso.webp',     atributos: { ritmo: 85, consistencia: 87, adaptabilidad: 75, agresividad: 89, gestion: 96 } },
  { numero: 18, nombre: 'Lance Stroll',      equipo: 'Aston Martin', precioBase: 13.0, imagen: '/Pilotos/stroll.webp',     atributos: { ritmo: 62, consistencia: 58, adaptabilidad: 72, agresividad: 81, gestion: 62 } },

  /* ══════════ WILLIAMS ══════════ */
  { numero: 55, nombre: 'Carlos Sainz',      equipo: 'Williams',     precioBase: 17.0, imagen: '/Pilotos/sainz.webp',      atributos: { ritmo: 81, consistencia: 66, adaptabilidad: 82, agresividad: 70, gestion: 88 } },
  { numero: 23, nombre: 'Alexander Albon',   equipo: 'Williams',     precioBase: 15.0, imagen: '/Pilotos/albon.webp',      atributos: { ritmo: 85, consistencia: 69, adaptabilidad: 78, agresividad: 78, gestion: 66 } },

  /* ══════════ HAAS ══════════ */
  { numero: 31, nombre: 'Esteban Ocon',      equipo: 'Haas',         precioBase: 14.0, imagen: '/Pilotos/ocon.webp',       atributos: { ritmo: 62, consistencia: 66, adaptabilidad: 80, agresividad: 94, gestion: 61 } },
  { numero: 87, nombre: 'Oliver Bearman',    equipo: 'Haas',         precioBase: 13.0, imagen: '/Pilotos/bearman.webp',    atributos: { ritmo: 68, consistencia: 62, adaptabilidad: 70, agresividad: 70, gestion: 60 } },

  /* ══════════ AUDI ══════════ */
  { numero: 27, nombre: 'Nico Hulkenberg',   equipo: 'Audi',         precioBase: 13.0, imagen: '/Pilotos/hulkenberg.webp', atributos: { ritmo: 72, consistencia: 82, adaptabilidad: 68, agresividad: 66, gestion: 68 } },
  { numero:  5, nombre: 'Gabriel Bortoleto', equipo: 'Audi',         precioBase: 12.0, imagen: '/Pilotos/bortoleto.webp',  atributos: { ritmo: 70, consistencia: 58, adaptabilidad: 72, agresividad: 64, gestion: 56 } },

  /* ══════════ ALPINE ══════════ */
  { numero: 10, nombre: 'Pierre Gasly',      equipo: 'Alpine',       precioBase: 13.0, imagen: '/Pilotos/gasly.webp',      atributos: { ritmo: 76, consistencia: 78, adaptabilidad: 72, agresividad: 70, gestion: 72 } },
  { numero: 43, nombre: 'Franco Colapinto',  equipo: 'Alpine',       precioBase: 14.0, imagen: '/Pilotos/colapinto.webp',  atributos: { ritmo: 68, consistencia: 55, adaptabilidad: 78, agresividad: 72, gestion: 55 } },

  /* ══════════ RACING BULLS ══════════ */
  { numero: 30, nombre: 'Liam Lawson',       equipo: 'Racing Bulls', precioBase: 12.0, imagen: '/Pilotos/lawson.webp',     atributos: { ritmo: 72, consistencia: 65, adaptabilidad: 74, agresividad: 68, gestion: 64 } },
  { numero: 41, nombre: 'Arvid Lindblad',    equipo: 'Racing Bulls', precioBase: 11.0, imagen: '/Pilotos/lindblad.webp',   atributos: { ritmo: 68, consistencia: 52, adaptabilidad: 70, agresividad: 60, gestion: 52 } },

  /* ══════════ CADILLAC ══════════ */
  { numero: 11, nombre: 'Sergio Perez',      equipo: 'Cadillac',     precioBase: 11.0, imagen: '/Pilotos/perez.webp',      atributos: { ritmo: 65, consistencia: 70, adaptabilidad: 75, agresividad: 65, gestion: 74 } },
  { numero: 77, nombre: 'Valtteri Bottas',   equipo: 'Cadillac',     precioBase: 10.0, imagen: '/Pilotos/bottas.webp',     atributos: { ritmo: 64, consistencia: 78, adaptabilidad: 62, agresividad: 52, gestion: 85 } },
]

// prettier-ignore
const cochesBase = [
  { id: 'alpine',       nombre: 'BWT Alpine F1',        precio: 16.0, puntos: 4, imagen: '/Coches/alpine.webp',      tipoCarta: 'coche', perfilPuntuacion: 'coche_base_v1', habilidad: { nombre: 'Sinergia de Equipo', puntos: 4, descripcion: 'Bono si alineas pilotos Alpine.' } },
  { id: 'aston_martin', nombre: 'Aston Martin Aramco',   precio: 10.0, puntos: 2, imagen: '/Coches/astonmartin.webp', tipoCarta: 'coche', perfilPuntuacion: 'coche_base_v1', habilidad: { nombre: 'Sinergia de Equipo', puntos: 2, descripcion: 'Bono si alineas pilotos Aston Martin.' } },
  { id: 'audi',         nombre: 'Audi Revolut F1',       precio: 13.0, puntos: 3, imagen: '/Coches/audi.webp',        tipoCarta: 'coche', perfilPuntuacion: 'coche_base_v1', habilidad: { nombre: 'Sinergia de Equipo', puntos: 3, descripcion: 'Bono si alineas pilotos Audi.' } },
  { id: 'cadillac',     nombre: 'Cadillac F1',            precio: 10.0, puntos: 2, imagen: '/Coches/cadillac.webp',   tipoCarta: 'coche', perfilPuntuacion: 'coche_base_v1', habilidad: { nombre: 'Sinergia de Equipo', puntos: 2, descripcion: 'Bono si alineas pilotos Cadillac.' } },
  { id: 'ferrari',      nombre: 'Ferrari',                precio: 26.0, puntos: 7, imagen: '/Coches/ferrari.webp',    tipoCarta: 'coche', perfilPuntuacion: 'coche_base_v1', habilidad: { nombre: 'Sinergia de Equipo', puntos: 7, descripcion: 'Bono si alineas pilotos Ferrari.' } },
  { id: 'haas',         nombre: 'TGR Haas F1',            precio: 18.0, puntos: 5, imagen: '/Coches/haas.webp',       tipoCarta: 'coche', perfilPuntuacion: 'coche_base_v1', habilidad: { nombre: 'Sinergia de Equipo', puntos: 5, descripcion: 'Bono si alineas pilotos Haas.' } },
  { id: 'mclaren',      nombre: 'McLaren Mastercard',     precio: 22.0, puntos: 6, imagen: '/Coches/mclaren.webp',    tipoCarta: 'coche', perfilPuntuacion: 'coche_base_v1', habilidad: { nombre: 'Sinergia de Equipo', puntos: 6, descripcion: 'Bono si alineas pilotos McLaren.' } },
  { id: 'mercedes',     nombre: 'Mercedes-AMG',            precio: 30.0, puntos: 8, imagen: '/Coches/mercedes.webp',   tipoCarta: 'coche', perfilPuntuacion: 'coche_base_v1', habilidad: { nombre: 'Sinergia de Equipo', puntos: 8, descripcion: 'Bono si alineas pilotos Mercedes.' } },
  { id: 'racing_bulls', nombre: 'Racing Bulls VCARB',     precio: 16.0, puntos: 4, imagen: '/Coches/racingbulls.webp', tipoCarta: 'coche', perfilPuntuacion: 'coche_base_v1', habilidad: { nombre: 'Sinergia de Equipo', puntos: 4, descripcion: 'Bono si alineas pilotos Racing Bulls.' } },
  { id: 'red_bull',     nombre: 'Red Bull Racing',         precio: 17.0, puntos: 4, imagen: '/Coches/redbull.webp',    tipoCarta: 'coche', perfilPuntuacion: 'coche_base_v1', habilidad: { nombre: 'Sinergia de Equipo', puntos: 4, descripcion: 'Bono si alineas pilotos Red Bull.' } },
  { id: 'williams',     nombre: 'Atlassian Williams',      precio: 12.0, puntos: 3, imagen: '/Coches/williams.webp',   tipoCarta: 'coche', perfilPuntuacion: 'coche_base_v1', habilidad: { nombre: 'Sinergia de Equipo', puntos: 3, descripcion: 'Bono si alineas pilotos Williams.' } },
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
  { id: 'modo_defensa',          nombre: 'Modo Defensa',      categoria: 'especial',        precio: 4.5, imagen: '/Potenciadores/modo_defensa.webp',          icono: 'pi-lock',               color: '#22d3ee', tipoCarta: 'potenciador', mejoras: { ritmo: -4, consistencia: 12, adaptabilidad:  0, agresividad:  0, gestion:  8 }, descripcion: 'Conservacion extrema de neumaticos y PU.'           },
  { id: 'meteorologia',          nombre: 'Meteorologia',      categoria: 'especial',        precio: 4.0, imagen: '/Potenciadores/meterologia.webp',           icono: 'pi-cloud',              color: '#a78bfa', tipoCarta: 'potenciador', mejoras: { ritmo:  0, consistencia:  0, adaptabilidad: 15, agresividad:  0, gestion:  0 }, descripcion: 'Prediccion meteorologica perfecta.'                 },
  { id: 'simulador_nocturno',    nombre: 'Simulador',         categoria: 'especial',        precio: 2.5, imagen: '/Potenciadores/simulador_nocturno.webp',    icono: 'pi-moon',               color: '#1e293b', tipoCarta: 'potenciador', mejoras: { ritmo:  3, consistencia:  3, adaptabilidad:  3, agresividad:  2, gestion:  2 }, descripcion: 'Preparacion extra del piloto en simulador.'         },
]
/* eslint-enable */

/* ═══════════════════════════════════════════════════════════════════════════
   PERFILES DE PUNTUACIÓN Y VARIANTES — Espejo de /src/data/perfilesPuntuacion.js + variantesPiloto.js
   ═══════════════════════════════════════════════════════════════════════════ */

// prettier-ignore
const perfilesPuntuacion = {
  qualy: {
    pesos: { ritmo: 0.45, consistencia: 0.2, adaptabilidad: 0.05, agresividad: 0.25, gestion: 0.05 },
    reglasUsuario: [
      'Factor según posición en clasificación:',
      'P1 – P3 → ×1.50',
      'P4 – P6 → ×1.30',
      'P7 – P10 → ×1.15',
      'P11 – P15 → ×0.85',
      'P16+ → ×0.65',
    ],
  },
  carrera: {
    pesos: { ritmo: 0.2, consistencia: 0.4, adaptabilidad: 0.05, agresividad: 0.1, gestion: 0.25 },
    reglasUsuario: [
      'Factor según posición final en carrera:',
      'P1 → ×1.50',
      'P2 → ×1.40',
      'P3 → ×1.30',
      'P4 – P5 → ×1.20',
      'P6 – P10 → ×1.00',
      'P11 – P15 → ×0.75',
      'P16 – P20 → ×0.50',
      'P20+ → ×0.20',
    ],
  },
  todo_terreno: {
    pesos: { ritmo: 0.1, consistencia: 0.15, adaptabilidad: 0.45, agresividad: 0.2, gestion: 0.1 },
    reglasUsuario: [
      'Factor según condiciones de carrera:',
      'Lluvia → ×1.40 | Sin lluvia → ×0.90',
      'Cada Safety Car → +0.10',
      'Cada Virtual SC → +0.05',
      'Cada abandono (DNF) → +0.03',
      'Bonus caos máximo: +0.30',
    ],
  },
  base: {
    pesos: { ritmo: 0.2, consistencia: 0.2, adaptabilidad: 0.2, agresividad: 0.2, gestion: 0.2 },
    reglasUsuario: [
      'Media de los factores Qualy, Carrera y Todo Terreno:',
      'Factor = (factorQualy + factorCarrera + factorTodoTerreno) / 3',
      'Perfil equilibrado sin especialización.',
    ],
  },
  remontador: {
    pesos: { ritmo: 0.25, consistencia: 0, adaptabilidad: 0.1, agresividad: 0.55, gestion: 0.1 },
    reglasUsuario: [
      'Factor según adelantamientos reales (OpenF1):',
      '7+ adelantamientos → ×1.80',
      '5 – 6 adelantamientos → ×1.50',
      '3 – 4 adelantamientos → ×1.30',
      '1 – 2 adelantamientos → ×1.10',
      '0 adelantamientos → ×0.70',
      'Bonus posición: P1–P5 → +0.10 | P6–P10 → +0.05',
    ],
  },
  estratega: {
    pesos: { ritmo: 0.05, consistencia: 0.3, adaptabilidad: 0.15, agresividad: 0, gestion: 0.5 },
    reglasUsuario: [
      'Factor compuesto por posición, stints y paradas:',
      'Base: factor posición carrera × 0.50',
      'Stint ≥ 60% de la carrera → +0.35',
      'Stint ≥ 40% → +0.20 | ≥ 25% → +0.10',
      '1 parada → +0.20 | 2 paradas → +0.10 | 3+ → +0.00',
      'Cada SC → +0.08 | Cada VSC → +0.04 (máx +0.20)',
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
   GENERACIÓN DEL CATÁLOGO COMPLETO
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Calcula la puntuación base ponderada de un piloto según los pesos de una variante.
 * Fórmula: Σ(peso × atributo) redondeado a 1 decimal.
 * @param {Object} atributos - { ritmo, consistencia, adaptabilidad, agresividad, gestion }
 * @param {Object} pesos - Los pesos del perfil de puntuación de la variante.
 * @returns {number}
 */
function calcularPuntuacionBase(atributos, pesos) {
  return Math.round(
    ((pesos.ritmo || 0) * atributos.ritmo +
      (pesos.consistencia || 0) * atributos.consistencia +
      (pesos.adaptabilidad || 0) * atributos.adaptabilidad +
      (pesos.agresividad || 0) * (atributos.agresividad || 0) +
      (pesos.gestion || 0) * (atributos.gestion || 0)) * 10,
  ) / 10
}

/**
 * Crea una carta de piloto combinando un piloto base con una variante.
 * Replica exactamente la lógica de crearCartaPiloto del frontend.
 * @param {Object} pilotoBase - Datos base del piloto.
 * @param {Object} variante - Variante de puntuación a aplicar.
 * @returns {Object} Carta de piloto lista para el mercado.
 */
function crearCartaPiloto(pilotoBase, variante) {
  const perfil = perfilesPuntuacion[variante.perfil]
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
    puntuacionBase: calcularPuntuacionBase(pilotoBase.atributos, perfil.pesos),
    reglasUsuario: perfil.reglasUsuario,
  }
}

/**
 * Genera el catálogo completo de todas las cartas disponibles.
 * - 22 pilotos × 6 variantes = 132 cartas de piloto
 * - 11 coches
 * - 24 potenciadores
 * (Las ruedas NO entran al mercado — son bonificación permanente del usuario.)
 * @returns {{ pilotos: Array, coches: Array, potenciadores: Array }}
 */
function generarCatalogo() {
  const pilotos = pilotosBase.flatMap((pilotoBase) =>
    variantesPiloto.map((variante) => crearCartaPiloto(pilotoBase, variante)),
  )
  const coches = cochesBase.map((coche) => ({ ...coche }))
  const potenciadores = potenciadoresBase.map((pot) => ({ ...pot }))

  return { pilotos, coches, potenciadores }
}

/* ═══════════════════════════════════════════════════════════════════════════
   SELECCIÓN DIARIA DE CARTAS
   ═══════════════════════════════════════════════════════════════════════════ */

/** Cantidades de cartas que aparecen en cada mercado diario */
const CARTAS_POR_DIA = {
  pilotos: 8,
  coches: 2,
  potenciadores: 8,
}

/**
 * Mezcla un array usando Fisher-Yates (imparcial y O(n)).
 * @param {Array} array - Array a mezclar (se modifica in-place).
 * @returns {Array} El mismo array ya mezclado.
 */
function mezclarArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]
  }
  return array
}

/**
 * Selecciona una muestra aleatoria del catálogo para el mercado del día.
 * Mezcla cada categoría y toma las primeras N cartas.
 *  - 8 pilotos (de 132)
 *  - 2 coches (de 11)
 *  - 8 potenciadores (de 24)
 *  = 18 cartas por día
 *
 * @param {{ pilotos: Array, coches: Array, potenciadores: Array }} catalogo
 * @returns {Array} Array plano con las cartas seleccionadas del día.
 */
function seleccionarCartasDiarias(catalogo) {
  const pilotosDelDia = mezclarArray([...catalogo.pilotos]).slice(0, CARTAS_POR_DIA.pilotos)
  const cochesDelDia = mezclarArray([...catalogo.coches]).slice(0, CARTAS_POR_DIA.coches)
  const potenciadoresDelDia = mezclarArray([...catalogo.potenciadores]).slice(0, CARTAS_POR_DIA.potenciadores)

  return [...pilotosDelDia, ...cochesDelDia, ...potenciadoresDelDia]
}

/* ═══════════════════════════════════════════════════════════════════════════
   EXPORTS
   ═══════════════════════════════════════════════════════════════════════════ */

module.exports = {
  generarCatalogo,
  seleccionarCartasDiarias,
  CARTAS_POR_DIA,
}
