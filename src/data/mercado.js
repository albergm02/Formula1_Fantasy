// src/data/mercado.js
// prettier-ignore
// src/data/mercado.js

export const mercadoPilotos = [
  // --- MCLAREN (Los Campeones) ---
  { 
    id: 'norris_t1', numero: 1, nombre: 'Lando Norris', equipo: 'McLaren', tier: 1, precio: 26.0, 
    imagen: '/Pilotos/norris.png',
    habilidad_1: { nombre: 'Ritmo Papaya', puntos: 6, descripcion: 'Registra 5 o más vueltas con el Sector 2 en Púrpura absoluto.' }
  },
  { 
    id: 'norris_t2', numero: 1, nombre: 'Lando Norris (Pro)', equipo: 'McLaren', tier: 2, precio: 36.0, 
    imagen: '/Pilotos/norris.png',
    habilidad_1: { nombre: 'Ritmo Papaya', puntos: 6, descripcion: 'Registra 5 o más vueltas con el Sector 2 en Púrpura absoluto.' },
    habilidad_2: { nombre: 'Tiroteo Final', puntos: 8, descripcion: 'DESPERTAR (Mejora su pos. Mundial): Su vuelta más rápida ocurre en las últimas 5 vueltas.' }
  },
  { 
    id: 'piastri_t1', numero: 81, nombre: 'Oscar Piastri', equipo: 'McLaren', tier: 1, precio: 24.0, 
    imagen: '/Pilotos/piastri.png',
    habilidad_1: { nombre: 'Sangre Fría', puntos: 6, descripcion: 'No pierde posición durante su outlap (vuelta de salida de boxes).' }
  },
  { 
    id: 'piastri_t2', numero: 81, nombre: 'Oscar Piastri (Pro)', equipo: 'McLaren', tier: 2, precio: 34.0, 
    imagen: '/Pilotos/piastri.png',
    habilidad_1: { nombre: 'Sangre Fría', puntos: 6, descripcion: 'No pierde posición durante su outlap (vuelta de salida de boxes).' },
    habilidad_2: { nombre: 'Cazador de Aire', puntos: 8, descripcion: 'DESPERTAR (Mejora su pos. Mundial): Su ritmo mejora al estar a más de 2s del coche de delante.' }
  },

  // --- RED BULL RACING ---
  { 
    id: 'verstappen_t1', numero: 3, nombre: 'Max Verstappen', equipo: 'Red Bull', tier: 1, precio: 25.0, 
    imagen: '/Pilotos/verstappen.png',
    habilidad_1: { nombre: 'Maximizar Daños', puntos: 6, descripcion: 'Termina en el podio (Top 3) sin marcar Vuelta Rápida.' }
  },
  { 
    id: 'verstappen_t2', numero: 3, nombre: 'Max Verstappen (Pro)', equipo: 'Red Bull', tier: 2, precio: 35.0, 
    imagen: '/Pilotos/verstappen.png',
    habilidad_1: { nombre: 'Maximizar Daños', puntos: 6, descripcion: 'Termina en el podio (Top 3) sin marcar Vuelta Rápida.' },
    habilidad_2: { nombre: 'Defensa Numantina', puntos: 8, descripcion: 'DESPERTAR (Mejora su pos. Mundial): Pasa 3 vueltas seguidas con rival en DRS sin ceder posición.' }
  },
  { 
    id: 'hadjar_t1', numero: 6, nombre: 'Isack Hadjar', equipo: 'Red Bull', tier: 1, precio: 15.0, 
    imagen: '/Pilotos/hadjar.png',
    habilidad_1: { nombre: 'Reflejos', puntos: 6, descripcion: 'Su Sector 1 en la Vuelta 1 está dentro del Top 5 global de la carrera.' }
  },
  { 
    id: 'hadjar_t2', numero: 6, nombre: 'Isack Hadjar (Pro)', equipo: 'Red Bull', tier: 2, precio: 25.0, 
    imagen: '/Pilotos/hadjar.png',
    habilidad_1: { nombre: 'Reflejos', puntos: 6, descripcion: 'Su Sector 1 en la Vuelta 1 está dentro del Top 5 global de la carrera.' },
    habilidad_2: { nombre: 'Protector', puntos: 8, descripcion: 'DESPERTAR (Mejora su pos. Mundial): Termina la carrera en el Top 6.' }
  },

  // --- FERRARI ---
  { 
    id: 'leclerc_t1', numero: 16, nombre: 'Charles Leclerc', equipo: 'Ferrari', tier: 1, precio: 24.0, 
    imagen: '/Pilotos/leclerc.png',
    habilidad_1: { nombre: 'Príncipe de la Pole', puntos: 6, descripcion: 'Sale 1º o 2º en la parrilla.' }
  },
  { 
    id: 'leclerc_t2', numero: 16, nombre: 'Charles Leclerc (Pro)', equipo: 'Ferrari', tier: 2, precio: 34.0, 
    imagen: '/Pilotos/leclerc.png',
    habilidad_1: { nombre: 'Príncipe de la Pole', puntos: 6, descripcion: 'Sale 1º o 2º en la parrilla.' },
    habilidad_2: { nombre: 'Susurro de Gomas', puntos: 8, descripcion: 'DESPERTAR (Mejora su pos. Mundial): Su stint con Blandos dura más que la media.' }
  },
  { 
    id: 'hamilton_t1', numero: 44, nombre: 'Lewis Hamilton', equipo: 'Ferrari', tier: 1, precio: 23.0, 
    imagen: '/Pilotos/hamilton.png',
    habilidad_1: { nombre: 'Sunday Rey', puntos: 6, descripcion: 'Gana 3 o más posiciones respecto a su salida.' }
  },
  { 
    id: 'hamilton_t2', numero: 44, nombre: 'Lewis Hamilton (Pro)', equipo: 'Ferrari', tier: 2, precio: 33.0, 
    imagen: '/Pilotos/hamilton.png',
    habilidad_1: { nombre: 'Sunday Rey', puntos: 6, descripcion: 'Gana 3 o más posiciones respecto a su salida.' },
    habilidad_2: { nombre: 'Hammer Time', puntos: 8, descripcion: 'DESPERTAR (Mejora su pos. Mundial): La vuelta promedio en su último stint es Top 3.' }
  },

  // --- MERCEDES ---
  { 
    id: 'russell_t1', numero: 63, nombre: 'George Russell', equipo: 'Mercedes', tier: 1, precio: 22.0, 
    imagen: '/Pilotos/russell.png',
    habilidad_1: { nombre: 'Mr. Saturday', puntos: 6, descripcion: 'Sale en el Top 4 de la parrilla.' }
  },
  { 
    id: 'russell_t2', numero: 63, nombre: 'George Russell (Pro)', equipo: 'Mercedes', tier: 2, precio: 32.0, 
    imagen: '/Pilotos/russell.png',
    habilidad_1: { nombre: 'Mr. Saturday', puntos: 6, descripcion: 'Sale en el Top 4 de la parrilla.' },
    habilidad_2: { nombre: 'Carrera Limpia', puntos: 8, descripcion: 'DESPERTAR (Mejora su pos. Mundial): Termina Top 6 y genera 0 Track Limits.' }
  },
  { 
    id: 'antonelli_t1', numero: 12, nombre: 'Kimi Antonelli', equipo: 'Mercedes', tier: 1, precio: 20.0, 
    imagen: '/Pilotos/antonelli.png',
    habilidad_1: { nombre: 'Talento Bruto', puntos: 6, descripcion: 'Su velocidad punta absoluta (Speed Trap) supera a la de su compañero.' }
  },
  { 
    id: 'antonelli_t2', numero: 12, nombre: 'Kimi Antonelli (Pro)', equipo: 'Mercedes', tier: 2, precio: 30.0, 
    imagen: '/Pilotos/antonelli.png',
    habilidad_1: { nombre: 'Talento Bruto', puntos: 6, descripcion: 'Su velocidad punta absoluta (Speed Trap) supera a la de su compañero.' },
    habilidad_2: { nombre: 'Relevo Generacional', puntos: 8, descripcion: 'DESPERTAR (Mejora su pos. Mundial): Puntúa y cruza la meta por delante de su compañero.' }
  },

  // --- ASTON MARTIN ---
  { 
    id: 'alonso_t1', numero: 14, nombre: 'Fernando Alonso', equipo: 'Aston Martin', tier: 1, precio: 19.0, 
    imagen: '/Pilotos/alonso.png',
    habilidad_1: { nombre: 'Salida Mágica', puntos: 6, descripcion: 'Gana 2 o más posiciones en la primera vuelta.' }
  },
  { 
    id: 'alonso_t2', numero: 14, nombre: 'Fernando Alonso (Pro)', equipo: 'Aston Martin', tier: 2, precio: 29.0, 
    imagen: '/Pilotos/alonso.png',
    habilidad_1: { nombre: 'Salida Mágica', puntos: 6, descripcion: 'Gana 2 o más posiciones en la primera vuelta.' },
    habilidad_2: { nombre: 'Estratega Suicida', puntos: 8, descripcion: 'DESPERTAR (Mejora su pos. Mundial): Puntúa habiendo iniciado con el neumático Duro.' }
  },
  { 
    id: 'stroll_t1', numero: 18, nombre: 'Lance Stroll', equipo: 'Aston Martin', tier: 1, precio: 13.0, 
    imagen: '/Pilotos/stroll.png',
    habilidad_1: { nombre: 'Arranque Relámpago', puntos: 6, descripcion: 'Gana 3 posiciones en las primeras 2 vueltas.' }
  },
  { 
    id: 'stroll_t2', numero: 18, nombre: 'Lance Stroll (Pro)', equipo: 'Aston Martin', tier: 2, precio: 23.0, 
    imagen: '/Pilotos/stroll.png',
    habilidad_1: { nombre: 'Arranque Relámpago', puntos: 6, descripcion: 'Gana 3 posiciones en las primeras 2 vueltas.' },
    habilidad_2: { nombre: 'Invisible', puntos: 8, descripcion: 'DESPERTAR (Mejora su pos. Mundial): Completa el GP sin penalizaciones.' }
  },

  // --- WILLIAMS ---
  { 
    id: 'sainz_t1', numero: 55, nombre: 'Carlos Sainz', equipo: 'Williams', tier: 1, precio: 17.0, 
    imagen: '/Pilotos/sainz.png',
    habilidad_1: { nombre: 'Smooth Operator', puntos: 6, descripcion: 'Su stint con Medios es el más largo de los que acaban en el Top 10.' }
  },
  { 
    id: 'sainz_t2', numero: 55, nombre: 'Carlos Sainz (Pro)', equipo: 'Williams', tier: 2, precio: 27.0, 
    imagen: '/Pilotos/sainz.png',
    habilidad_1: { nombre: 'Smooth Operator', puntos: 6, descripcion: 'Su stint con Medios es el más largo de los que acaban en el Top 10.' },
    habilidad_2: { nombre: 'Ingeniero en Pista', puntos: 8, descripcion: 'DESPERTAR (Mejora su pos. Mundial): Puntúa haciendo 1 parada menos que el promedio del Top 10.' }
  },
  { 
    id: 'albon_t1', numero: 23, nombre: 'Alexander Albon', equipo: 'Williams', tier: 1, precio: 15.0, 
    imagen: '/Pilotos/albon.png',
    habilidad_1: { nombre: 'Muro Tailandés', puntos: 6, descripcion: 'Su velocidad punta máxima está dentro del Top 5 de la sesión.' }
  },
  { 
    id: 'albon_t2', numero: 23, nombre: 'Alexander Albon (Pro)', equipo: 'Williams', tier: 2, precio: 25.0, 
    imagen: '/Pilotos/albon.png',
    habilidad_1: { nombre: 'Muro Tailandés', puntos: 6, descripcion: 'Su velocidad punta máxima está dentro del Top 5 de la sesión.' },
    habilidad_2: { nombre: 'Albono de Gomas', puntos: 8, descripcion: 'DESPERTAR (Mejora su pos. Mundial): Logra puntuar completando más de 30 vueltas con un mismo neumático.' }
  },

  // --- HAAS ---
  { 
    id: 'ocon_t1', numero: 31, nombre: 'Esteban Ocon', equipo: 'Haas', tier: 1, precio: 14.0, 
    imagen: '/Pilotos/ocon.png',
    habilidad_1: { nombre: 'A Cuchillo', puntos: 6, descripcion: 'Marca el Sector 1 absoluto más rápido de la carrera.' }
  },
  { 
    id: 'ocon_t2', numero: 31, nombre: 'Esteban Ocon (Pro)', equipo: 'Haas', tier: 2, precio: 24.0, 
    imagen: '/Pilotos/ocon.png',
    habilidad_1: { nombre: 'A Cuchillo', puntos: 6, descripcion: 'Marca el Sector 1 absoluto más rápido de la carrera.' },
    habilidad_2: { nombre: 'Defensa Numantina', puntos: 8, descripcion: 'DESPERTAR (Mejora su pos. Mundial): Puntúa sin haber perdido ni una sola posición respecto a su salida.' }
  },
  { 
    id: 'bearman_t1', numero: 87, nombre: 'Oliver Bearman', equipo: 'Haas', tier: 1, precio: 13.0, 
    imagen: '/Pilotos/bearman.png',
    habilidad_1: { nombre: 'Progresión', puntos: 6, descripcion: 'Su vuelta personal más rápida se registra en el último 20% de la carrera.' }
  },
  { 
    id: 'bearman_t2', numero: 87, nombre: 'Oliver Bearman (Pro)', equipo: 'Haas', tier: 2, precio: 23.0, 
    imagen: '/Pilotos/bearman.png',
    habilidad_1: { nombre: 'Progresión', puntos: 6, descripcion: 'Su vuelta personal más rápida se registra en el último 20% de la carrera.' },
    habilidad_2: { nombre: 'Cabeza Fría', puntos: 8, descripcion: 'DESPERTAR (Mejora su pos. Mundial): Completa la carrera con 1 parada y sin penalizaciones.' }
  },

  // --- AUDI ---
  { 
    id: 'hulkenberg_t1', numero: 27, nombre: 'Nico Hülkenberg', equipo: 'Audi', tier: 1, precio: 13.0, 
    imagen: '/Pilotos/hulkenberg.png',
    habilidad_1: { nombre: 'Qualy Master', puntos: 6, descripcion: 'Clasifica en el Top 8 de la parrilla de salida.' }
  },
  { 
    id: 'hulkenberg_t2', numero: 27, nombre: 'Nico Hülkenberg (Pro)', equipo: 'Audi', tier: 2, precio: 23.0, 
    imagen: '/Pilotos/hulkenberg.png',
    habilidad_1: { nombre: 'Qualy Master', puntos: 6, descripcion: 'Clasifica en el Top 8 de la parrilla de salida.' },
    habilidad_2: { nombre: 'Sin Maldición', puntos: 8, descripcion: 'DESPERTAR (Mejora su pos. Mundial): Consigue finalizar la carrera dentro del Top 6.' }
  },
  { 
    id: 'bortoleto_t1', numero: 5, nombre: 'Gabriel Bortoleto', equipo: 'Audi', tier: 1, precio: 12.0, 
    imagen: '/Pilotos/bortoleto.png',
    habilidad_1: { nombre: 'Estabilidad', puntos: 6, descripcion: 'Su parada dura menos de 2.6s y no pierde posición en la salida.' }
  },
  { 
    id: 'bortoleto_t2', numero: 5, nombre: 'Gabriel Bortoleto (Pro)', equipo: 'Audi', tier: 2, precio: 22.0, 
    imagen: '/Pilotos/bortoleto.png',
    habilidad_1: { nombre: 'Estabilidad', puntos: 6, descripcion: 'Su parada dura menos de 2.6s y no pierde posición en la salida.' },
    habilidad_2: { nombre: 'Reloj Suizo', puntos: 8, descripcion: 'DESPERTAR (Mejora su pos. Mundial): La diferencia entre sus 5 mejores vueltas es inferior a 0.3s.' }
  },

  // --- ALPINE ---
  { 
    id: 'gasly_t1', numero: 10, nombre: 'Pierre Gasly', equipo: 'Alpine', tier: 1, precio: 13.0, 
    imagen: '/Pilotos/gasly.png',
    habilidad_1: { nombre: 'Pescador', puntos: 6, descripcion: 'Gana posición en las dos vueltas tras apagarse el Safety Car/VSC.' }
  },
  { 
    id: 'gasly_t2', numero: 10, nombre: 'Pierre Gasly (Pro)', equipo: 'Alpine', tier: 2, precio: 23.0, 
    imagen: '/Pilotos/gasly.png',
    habilidad_1: { nombre: 'Pescador', puntos: 6, descripcion: 'Gana posición en las dos vueltas tras apagarse el Safety Car/VSC.' },
    habilidad_2: { nombre: 'Empuje Final', puntos: 8, descripcion: 'DESPERTAR (Mejora su pos. Mundial): Mejora su posición en las últimas 3 vueltas.' }
  },
  { 
    id: 'colapinto_t1', numero: 43, nombre: 'Franco Colapinto', equipo: 'Alpine', tier: 1, precio: 14.0, 
    imagen: '/Pilotos/colapinto.png',
    habilidad_1: { nombre: 'Garra Argentina', puntos: 6, descripcion: 'Gana posición en la vuelta tras su parada en boxes (Undercut).' }
  },
  { 
    id: 'colapinto_t2', numero: 43, nombre: 'Franco Colapinto (Pro)', equipo: 'Alpine', tier: 2, precio: 24.0, 
    imagen: '/Pilotos/colapinto.png',
    habilidad_1: { nombre: 'Garra Argentina', puntos: 6, descripcion: 'Gana posición en la vuelta tras su parada en boxes (Undercut).' },
    habilidad_2: { nombre: 'Al Límite', puntos: 8, descripcion: 'DESPERTAR (Mejora su pos. Mundial): Cruza la meta a menos de 0.8s del coche de delante.' }
  },

  // --- RACING BULLS ---
  { 
    id: 'lawson_t1', numero: 30, nombre: 'Liam Lawson', equipo: 'Racing Bulls', tier: 1, precio: 12.0, 
    imagen: '/Pilotos/lawson.png',
    habilidad_1: { nombre: 'Ataque Púrpura', puntos: 6, descripcion: 'Marca al menos un sector púrpura absoluto en la carrera.' }
  },
  { 
    id: 'lawson_t2', numero: 30, nombre: 'Liam Lawson (Pro)', equipo: 'Racing Bulls', tier: 2, precio: 22.0, 
    imagen: '/Pilotos/lawson.png',
    habilidad_1: { nombre: 'Ataque Púrpura', puntos: 6, descripcion: 'Marca al menos un sector púrpura absoluto en la carrera.' },
    habilidad_2: { nombre: 'Sin Miedo', puntos: 8, descripcion: 'DESPERTAR (Mejora su pos. Mundial): Termina por delante de un Ferrari, McLaren o Mercedes.' }
  },
  { 
    id: 'lindblad_t1', numero: 41, nombre: 'Arvid Lindblad', equipo: 'Racing Bulls', tier: 1, precio: 11.0, 
    imagen: '/Pilotos/lindblad.png',
    habilidad_1: { nombre: 'Sangre Nueva', puntos: 6, descripcion: 'Gana 3 o más posiciones en carrera.' }
  },
  { 
    id: 'lindblad_t2', numero: 41, nombre: 'Arvid Lindblad (Pro)', equipo: 'Racing Bulls', tier: 2, precio: 21.0, 
    imagen: '/Pilotos/lindblad.png',
    habilidad_1: { nombre: 'Sangre Nueva', puntos: 6, descripcion: 'Gana 3 o más posiciones en carrera.' },
    habilidad_2: { nombre: 'Sábado Mágico', puntos: 8, descripcion: 'DESPERTAR (Mejora su pos. Mundial): Consigue clasificar en la Q3 el sábado.' }
  },

  // --- CADILLAC ---
  { 
    id: 'perez_t1', numero: 11, nombre: 'Sergio Perez', equipo: 'Cadillac', tier: 1, precio: 11.0, 
    imagen: '/Pilotos/perez.png',
    habilidad_1: { nombre: 'Remontada', puntos: 6, descripcion: 'Inicia fuera del Top 10 pero logra cruzar la meta dentro del Top 8.' }
  },
  { 
    id: 'perez_t2', numero: 11, nombre: 'Sergio Perez (Pro)', equipo: 'Cadillac', tier: 2, precio: 21.0, 
    imagen: '/Pilotos/perez.png',
    habilidad_1: { nombre: 'Remontada', puntos: 6, descripcion: 'Inicia fuera del Top 10 pero logra cruzar la meta dentro del Top 8.' },
    habilidad_2: { nombre: 'Ministro de Defensa', puntos: 8, descripcion: 'DESPERTAR (Mejora su pos. Mundial): Pasa 8 vueltas con un rival en DRS sin cederle posición.' }
  },
  { 
    id: 'bottas_t1', numero: 77, nombre: 'Valtteri Bottas', equipo: 'Cadillac', tier: 1, precio: 10.0, 
    imagen: '/Pilotos/bottas.png',
    habilidad_1: { nombre: 'Qualy Leñador', puntos: 6, descripcion: 'Logra colar el coche en el Top 12 de la parrilla de salida.' }
  },
  { 
    id: 'bottas_t2', numero: 77, nombre: 'Valtteri Bottas (Pro)', equipo: 'Cadillac', tier: 2, precio: 20.0, 
    imagen: '/Pilotos/bottas.png',
    habilidad_1: { nombre: 'Qualy Leñador', puntos: 6, descripcion: 'Logra colar el coche en el Top 12 de la parrilla de salida.' },
    habilidad_2: { nombre: 'Experiencia', puntos: 8, descripcion: 'DESPERTAR (Mejora su pos. Mundial): Es el piloto con el menor tiempo total acumulado en el Pit Lane.' }
  }
];

// prettier-ignore
export const mercadoPotenciadores = [
  { id: 'aleron_delantero', nombre: 'Ala Delantera', precio: 5.0, puntos: 50, imagen: '/Potenciadores/Alerón_Delantero.png' },
  { id: 'aleron_trasero', nombre: 'Ala Trasera', precio: 5.0, puntos: 50, imagen: '/Potenciadores/Alerón_Trasero.png' },
  { id: 'bateria', nombre: 'Batería', precio: 5.0, puntos: 50, imagen: '/Potenciadores/Batería.png' },
  { id: 'caja_de_cambios', nombre: 'Caja de Cambios', precio: 5.0, puntos: 50, imagen: '/Potenciadores/Caja_de_Cambios.png' },
  { id: 'chasis', nombre: 'Chasis', precio: 5.0, puntos: 50, imagen: '/Potenciadores/Chasis.png' },
  { id: 'difusor', nombre: 'Difusor', precio: 5.0, puntos: 50, imagen: '/Potenciadores/Difusor.png' },
  { id: 'discos_de_frenos', nombre: 'Discos de Frenos', precio: 5.0, puntos: 50, imagen: '/Potenciadores/Discos_de_Frenos.png' },
  { id: 'mgu_k', nombre: 'MGU-K', precio: 5.0, puntos: 50, imagen: '/Potenciadores/MGU-K.png' },
  { id: 'motor_v6', nombre: 'Motor V6', precio: 5.0, puntos: 50, imagen: '/Potenciadores/Motor V6.png' },
  { id: 'pontones', nombre: 'Pontones', precio: 5.0, puntos: 50, imagen: '/Potenciadores/Pontones.png' },
  { id: 'suspension', nombre: 'Suspensión', precio: 5.0, puntos: 50, imagen: '/Potenciadores/Suspensión.png' },
  { id: 'tubo_de_escape', nombre: 'Tubo de Escape', precio: 5.0, puntos: 50, imagen: '/Potenciadores/Tubo_de_Escape.png' },
  { id: 'turbocompresor', nombre: 'Compresor', precio: 5.0, puntos: 50, imagen: '/Potenciadores/Turbocompresor.png' },
  { id: 'volante', nombre: 'Volante', precio: 5.0, puntos: 50, imagen: '/Potenciadores/Volante.png' }
]

// prettier-ignore
// TEMPORADA 2026 - Equipos actualizados
export const mercadoCoches = [
  // Cambios 2026:
  // - Williams ahora se llama "Atlassian Williams F1 Team"
  // - Haas ahora es "TGR Haas F1 Team" (con Toyota como patrocinador principal)
  // - Sauber se convierte en "Audi Revolut F1 Team" (con Audi como fabricante)
  // - McLaren es "McLaren Mastercard F1 Team" (con Mastercard como patrocinador)
  // - Aston Martin mantiene "Aramco Formula One Team"
  // - Alpine es "BWT Alpine Formula One Team"
  // - Cadillac NUEVO equipo (11º equipo en la parrilla)
  
  { id: 'aston_martin', nombre: 'Aston Martin Aramco', precio: 20.0, puntos: 200, imagen: '/Coches/AstonMartin.png' },
  { id: 'audi', nombre: 'Audi Revolut F1', precio: 20.0, puntos: 200, imagen: '/Coches/Audi.png' },
  { id: 'cadillac', nombre: 'Cadillac F1 (NUEVO)', precio: 20.0, puntos: 200, imagen: '/Coches/Cadillac.png' },
  { id: 'ferrari', nombre: 'Ferrari', precio: 20.0, puntos: 200, imagen: '/Coches/Ferrari.png' },
  { id: 'haas', nombre: 'TGR Haas F1', precio: 20.0, puntos: 200, imagen: '/Coches/Haas.png' },
  { id: 'mclaren', nombre: 'McLaren Mastercard', precio: 20.0, puntos: 200, imagen: '/Coches/Mclaren.png' },
  { id: 'mercedes', nombre: 'Mercedes-AMG', precio: 20.0, puntos: 200, imagen: '/Coches/Mercedes.png' },
  { id: 'racing_bulls', nombre: 'Racing Bulls VCARB', precio: 20.0, puntos: 200, imagen: '/Coches/RacingBulls.png' },
  { id: 'red_bull', nombre: 'Red Bull Racing', precio: 20.0, puntos: 200, imagen: '/Coches/RedBull.png' },
  { id: 'williams', nombre: 'Atlassian Williams', precio: 20.0, puntos: 200, imagen: '/Coches/Williams.png' }
]
