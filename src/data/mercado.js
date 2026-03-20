// prettier-ignore
export const mercadoPilotos = [

  { 
    id: 'norris_t1', numero: 1, nombre: 'Lando Norris', equipo: 'McLaren', tier: 1, precio: 26.0, 
    imagen: 'Pilotos/norris.png',
    habilidad_1: { nombre: 'Ritmo Papaya', puntos: 6, descripcion: 'Registra 5 o más vueltas con el Sector 2 en Púrpura absoluto.' }
  },
  { 
    id: 'norris_t2', numero: 1, nombre: 'Lando Norris (Pro)', equipo: 'McLaren', tier: 2, precio: 36.0, 
    imagen: 'Pilotos/norris.png',
    habilidad_1: { nombre: 'Ritmo Papaya', puntos: 6, descripcion: 'Registra 5 o más vueltas con el Sector 2 en Púrpura absoluto.' },
    habilidad_2: { nombre: 'Tiroteo Final', puntos: 8, descripcion: 'DESPERTAR (Mejora su pos. Mundial): Su vuelta más rápida ocurre en las últimas 5 vueltas.' }
  },
  { 
    id: 'piastri_t1', numero: 81, nombre: 'Oscar Piastri', equipo: 'McLaren', tier: 1, precio: 24.0, 
    imagen: 'Pilotos/piastri.png',
    habilidad_1: { nombre: 'Sangre Fría', puntos: 6, descripcion: 'No pierde posición durante su outlap (vuelta de salida de boxes).' }
  },
  { 
    id: 'piastri_t2', numero: 81, nombre: 'Oscar Piastri (Pro)', equipo: 'McLaren', tier: 2, precio: 34.0, 
    imagen: 'Pilotos/piastri.png',
    habilidad_1: { nombre: 'Sangre Fría', puntos: 6, descripcion: 'No pierde posición durante su outlap (vuelta de salida de boxes).' },
    habilidad_2: { nombre: 'Cazador de Aire', puntos: 8, descripcion: 'DESPERTAR (Mejora su pos. Mundial): Su ritmo mejora al estar a más de 2s del coche de delante.' }
  },
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
export const mercadoCoches = [
  
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
