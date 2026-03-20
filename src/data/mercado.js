// src/data/mercado.js
// prettier-ignore

export const mercadoPilotos = [
  // --- MCLAREN ---
  { 
    id: 'norris_t1', numero: 1, nombre: 'Lando Norris', equipo: 'McLaren', tier: 1, precio: 26.0, 
    imagen: '/Pilotos/norris.png',
    descripcion: 'Vigente campeón del mundo, llega a 2026 buscando defender su título con McLaren tras una espectacular temporada anterior. Es uno de los talentos más consolidados y rápidos de la parrilla.',
    habilidad_1: { nombre: 'Ritmo Papaya', puntos: 6, descripcion: 'Registra 5 o más vueltas con el Sector 2 en Púrpura absoluto.' }
  },
  { 
    id: 'norris_t2', numero: 1, nombre: 'Lando Norris', equipo: 'McLaren', tier: 2, precio: 36.0, 
    imagen: '/Pilotos/norris.png',
    descripcion: 'Vigente campeón del mundo, llega a 2026 buscando defender su título con McLaren tras una espectacular temporada anterior. Es uno de los talentos más consolidados y rápidos de la parrilla.',
    habilidad_1: { nombre: 'Ritmo Papaya', puntos: 6, descripcion: 'Registra 5 o más vueltas con el Sector 2 en Púrpura absoluto.' },
    habilidad_2: { nombre: 'Last Lap Lando', puntos: 8, descripcion: 'Su vuelta más rápida ocurre en las últimas 5 vueltas.' },
    penalizacion: { nombre: 'Foco Perdido', puntos: -5, descripcion: 'Pierde al menos 1 posición en la primera vuelta de carrera.' }
  },
  { 
    id: 'piastri_t1', numero: 81, nombre: 'Oscar Piastri', equipo: 'McLaren', tier: 1, precio: 24.0, 
    imagen: '/Pilotos/piastri.png',
    descripcion: 'El australiano se ha ganado el estatus de estrella gracias a su tremendo ritmo y frialdad. Forma junto a Norris una de las duplas más temibles de toda la Fórmula 1.',
    habilidad_1: { nombre: 'Sangre Fría', puntos: 6, descripcion: 'No pierde posición durante la salida (Vuelta 1).' }
  },
  { 
    id: 'piastri_t2', numero: 81, nombre: 'Oscar Piastri', equipo: 'McLaren', tier: 2, precio: 34.0, 
    imagen: '/Pilotos/piastri.png',
    descripcion: 'El australiano se ha ganado el estatus de estrella gracias a su tremendo ritmo y frialdad. Forma junto a Norris una de las duplas más temibles de toda la Fórmula 1.',
    habilidad_1: { nombre: 'Sangre Fría', puntos: 6, descripcion: 'No pierde posición durante la salida (Vuelta 1).' },
    habilidad_2: { nombre: 'Chico de Hielo', puntos: 8, descripcion: 'Termina la carrera en mejor posición de la que salió.' },
    penalizacion: { nombre: 'Desgaste Prematuro', puntos: -4, descripcion: 'Su ritmo cae y es superado por su compañero tras su parada en boxes.' }
  },

  // --- RED BULL RACING ---
  { 
    id: 'verstappen_t1', numero: 3, nombre: 'Max Verstappen', equipo: 'Red Bull', tier: 1, precio: 25.0, 
    imagen: '/Pilotos/verstappen.png',
    descripcion: 'El tetracampeón neerlandés busca devolver a Red Bull a la cima tras perder la corona el año pasado. Sigue siendo probablemente el piloto más implacable y agresivo de la parrilla.',
    habilidad_1: { nombre: 'Mad Max', puntos: 6, descripcion: 'Termina en el podio (Top 3) sin haber marcado la Vuelta Rápida.' }
  },
  { 
    id: 'verstappen_t2', numero: 3, nombre: 'Max Verstappen', equipo: 'Red Bull', tier: 2, precio: 35.0, 
    imagen: '/Pilotos/verstappen.png',
    descripcion: 'El tetracampeón neerlandés busca devolver a Red Bull a la cima tras perder la corona el año pasado. Sigue siendo probablemente el piloto más implacable y agresivo de la parrilla.',
    habilidad_1: { nombre: 'Mad Max', puntos: 6, descripcion: 'Termina en el podio (Top 3) sin haber marcado la Vuelta Rápida.' },
    habilidad_2: { nombre: 'Inquebrantable', puntos: 8, descripcion: 'Pasa 5 vueltas seguidas con un rival a menos de 1 segundo sin ceder la posición.' },
    penalizacion: { nombre: 'Furia por la radio', puntos: -5, descripcion: 'Recibe una bandera blanca y negra por Track Limits (Límites de pista).' }
  },
  { 
    id: 'hadjar_t1', numero: 6, nombre: 'Isack Hadjar', equipo: 'Red Bull', tier: 1, precio: 15.0, 
    imagen: '/Pilotos/hadjar.png',
    descripcion: 'Promovido al primer equipo para ser el escudero de Verstappen tras una gran etapa formativa. Tendrá el difícil reto de sobrevivir a la enorme presión que siempre rodea al segundo asiento de Red Bull.',
    habilidad_1: { nombre: 'Gran inicio', puntos: 6, descripcion: 'Su Sector 1 en la Vuelta 1 está dentro del Top 5 global de la carrera.' }
  },
  { 
    id: 'hadjar_t2', numero: 6, nombre: 'Isack Hadjar', equipo: 'Red Bull', tier: 2, precio: 25.0, 
    imagen: '/Pilotos/hadjar.png',
    descripcion: 'Promovido al primer equipo para ser el escudero de Verstappen tras una gran etapa formativa. Tendrá el difícil reto de sobrevivir a la enorme presión que siempre rodea al segundo asiento de Red Bull.',
    habilidad_1: { nombre: 'Gran inicio', puntos: 6, descripcion: 'Su Sector 1 en la Vuelta 1 está dentro del Top 5 global de la carrera.' },
    habilidad_2: { nombre: 'El pequeño Prost', puntos: 8, descripcion: 'Termina la carrera en el Top 6.' },
    penalizacion: { nombre: 'Pecado de Novato', puntos: -4, descripcion: 'Recibe una sanción de tiempo de 5s o 10s durante la carrera.' }
  },

  // --- FERRARI ---
  { 
    id: 'leclerc_t1', numero: 16, nombre: 'Charles Leclerc', equipo: 'Ferrari', tier: 1, precio: 24.0, 
    imagen: '/Pilotos/leclerc.png',
    descripcion: '"Il Predestinato" sigue siendo la gran apuesta de futuro y presente de Maranello. Buscará maximizar el rendimiento del Ferrari y batir a su histórico compañero de equipo.',
    // Balanceado a +6 en Tier 1 para seguir la regla del resto
    habilidad_1: { nombre: 'Príncipe de la Pole', puntos: 6, descripcion: 'Sale 1º en la parrilla de salida.' } 
  },
  { 
    id: 'leclerc_t2', numero: 16, nombre: 'Charles Leclerc', equipo: 'Ferrari', tier: 2, precio: 34.0, 
    imagen: '/Pilotos/leclerc.png',
    descripcion: '"Il Predestinato" sigue siendo la gran apuesta de futuro y presente de Maranello. Buscará maximizar el rendimiento del Ferrari y batir a su histórico compañero de equipo.',
    habilidad_1: { nombre: 'Príncipe de la Pole', puntos: 6, descripcion: 'Sale 1º en la parrilla de salida.' },
    habilidad_2: { nombre: 'Il Predestinato', puntos: 8, descripcion: 'Su stint con neumáticos Blandos dura más que la media de la parrilla.' },
    penalizacion: { nombre: 'La Maldición de Chuck', puntos: -6, descripcion: 'Abandona la carrera (DNF) por fallo mecánico o accidente.' }
  },
  { 
    id: 'hamilton_t1', numero: 44, nombre: 'Lewis Hamilton', equipo: 'Ferrari', tier: 1, precio: 23.0, 
    imagen: '/Pilotos/hamilton.png',
    descripcion: 'El heptacampeón del mundo cumple su sueño de vestir de rojo en su segunda temporada con Ferrari, persiguiendo ese ansiado octavo título. Aporta una experiencia inigualable y un talento legendario.',
    habilidad_1: { nombre: 'Sunday King', puntos: 6, descripcion: 'Su posición final es al menos 4 puestos mejor que su posición de salida.' }
  },
  { 
    id: 'hamilton_t2', numero: 44, nombre: 'Lewis Hamilton', equipo: 'Ferrari', tier: 2, precio: 33.0, 
    imagen: '/Pilotos/hamilton.png',
    descripcion: 'El heptacampeón del mundo cumple su sueño de vestir de rojo en su segunda temporada con Ferrari, persiguiendo ese ansiado octavo título. Aporta una experiencia inigualable y un talento legendario.',
    habilidad_1: { nombre: 'Sunday King', puntos: 6, descripcion: 'Su posición final es al menos 4 puestos mejor que su posición de salida.' },
    habilidad_2: { nombre: 'Hammer Time', puntos: 8, descripcion: 'Queda por delante de su compañero de equipo (Leclerc) cruzando la meta.' },
    penalizacion: { nombre: 'Gomas frías', puntos: -4, descripcion: 'Pierde posición en la primera vuelta tras un reinicio de Safety Car.' }
  },

  // --- MERCEDES ---
  { 
    id: 'russell_t1', numero: 63, nombre: 'George Russell', equipo: 'Mercedes', tier: 1, precio: 22.0, 
    imagen: '/Pilotos/russell.png',
    descripcion: 'El británico asume el papel de líder consolidado dentro de Mercedes en esta nueva era reglamentaria. Es analítico, constante y letal cuando el coche responde.',
    habilidad_1: { nombre: 'Mr. Saturday', puntos: 6, descripcion: 'Sale en el Top 3 de la parrilla.' }
  },
  { 
    id: 'russell_t2', numero: 63, nombre: 'George Russell', equipo: 'Mercedes', tier: 2, precio: 32.0, 
    imagen: '/Pilotos/russell.png',
    descripcion: 'El británico asume el papel de líder consolidado dentro de Mercedes en esta nueva era reglamentaria. Es analítico, constante y letal cuando el coche responde.',
    habilidad_1: { nombre: 'Mr. Saturday', puntos: 6, descripcion: 'Sale en el Top 3 de la parrilla.' },
    habilidad_2: { nombre: 'Carrera Limpia', puntos: 8, descripcion: 'Termina Top 5 y genera 0 avisos por Track Limits en toda la carrera.' },
    penalizacion: { nombre: 'Presión Crítica', puntos: -6, descripcion: 'Pierde posición o choca en las últimas 3 vueltas del GP.' }
  },
  { 
    id: 'antonelli_t1', numero: 12, nombre: 'Kimi Antonelli', equipo: 'Mercedes', tier: 1, precio: 20.0, 
    imagen: '/Pilotos/antonelli.png',
    descripcion: 'La joya de la corona de la academia de Mercedes, da el salto definitivo para demostrar que el "hype" estaba justificado. Un talento generacional listo para pelear en la zona alta.',
    habilidad_1: { nombre: 'Diamante en Bruto', puntos: 6, descripcion: 'Su velocidad punta absoluta (Speed Trap) supera a la de Russell.' }
  },
  { 
    id: 'antonelli_t2', numero: 12, nombre: 'Kimi Antonelli', equipo: 'Mercedes', tier: 2, precio: 30.0, 
    imagen: '/Pilotos/antonelli.png',
    descripcion: 'La joya de la corona de la academia de Mercedes, da el salto definitivo para demostrar que el "hype" estaba justificado. Un talento generacional listo para pelear en la zona alta.',
    habilidad_1: { nombre: 'Diamante en Bruto', puntos: 6, descripcion: 'Su velocidad punta absoluta (Speed Trap) supera a la de Russell.' },
    habilidad_2: { nombre: 'Relevo', puntos: 8, descripcion: 'Puntúa y cruza la meta por delante de su compañero.' },
    penalizacion: { nombre: 'Exceso de ímpetu', puntos: -4, descripcion: 'Causa una bandera amarilla o roja durante las sesiones de Libres o Qualy.' }
  },

  // --- ASTON MARTIN ---
  { 
    id: 'alonso_t1', numero: 14, nombre: 'Fernando Alonso', equipo: 'Aston Martin', tier: 1, precio: 19.0, 
    imagen: '/Pilotos/alonso.png',
    descripcion: 'El incombustible bicampeón español sigue rindiendo a un nivel excepcional en Aston Martin de la mano de los nuevos motores Honda. Su inteligencia en carrera y su magia al volante parecen no tener fecha de caducidad.',
    habilidad_1: { nombre: 'Salida Mágica', puntos: 6, descripcion: 'Gana 2 o más posiciones en la primera vuelta.' }
  },
  { 
    id: 'alonso_t2', numero: 14, nombre: 'Fernando Alonso', equipo: 'Aston Martin', tier: 2, precio: 29.0, 
    imagen: '/Pilotos/alonso.png',
    descripcion: 'El incombustible bicampeón español sigue rindiendo a un nivel excepcional en Aston Martin de la mano de los nuevos motores Honda. Su inteligencia en carrera y su magia al volante parecen no tener fecha de caducidad.',
    habilidad_1: { nombre: 'Salida Mágica', puntos: 6, descripcion: 'Gana 2 o más posiciones en la primera vuelta.' },
    habilidad_2: { nombre: 'El padre', puntos: 8, descripcion: 'Mantiene a su compañero por detrás ininterrumpidamente durante 20 vueltas.' },
    penalizacion: { nombre: 'Motor GP2', puntos: -4, descripcion: 'Su velocidad punta es de las 3 peores de la sesión o sufre avería.' }
  },
  { 
    id: 'stroll_t1', numero: 18, nombre: 'Lance Stroll', equipo: 'Aston Martin', tier: 1, precio: 13.0, 
    imagen: '/Pilotos/stroll.png',
    descripcion: 'El piloto canadiense continúa en la estructura familiar buscando encontrar la consistencia que a menudo le falta. Necesitará dar un paso adelante para igualar el ritmo de Alonso.',
    habilidad_1: { nombre: 'Lancelot', puntos: 6, descripcion: 'Consigue puntuar (Top 10).' }
  },
  { 
    id: 'stroll_t2', numero: 18, nombre: 'Lance Stroll', equipo: 'Aston Martin', tier: 2, precio: 23.0, 
    imagen: '/Pilotos/stroll.png',
    descripcion: 'El piloto canadiense continúa en la estructura familiar buscando encontrar la consistencia que a menudo le falta. Necesitará dar un paso adelante para igualar el ritmo de Alonso.',
    habilidad_1: { nombre: 'Lancelot', puntos: 6, descripcion: 'Consigue puntuar (Top 10).' },
    habilidad_2: { nombre: 'Invisible', puntos: 8, descripcion: 'Completa el GP sin recibir ninguna investigación ni sanción.' },
    penalizacion: { nombre: 'Espejos rotos', puntos: -5, descripcion: 'Se ve involucrado en un toque o incidente con daños en las primeras 3 vueltas.' }
  },

  // --- WILLIAMS ---
  { 
    id: 'sainz_t1', numero: 55, nombre: 'Carlos Sainz', equipo: 'Williams', tier: 1, precio: 17.0, 
    imagen: '/Pilotos/sainz.png',
    descripcion: 'El madrileño lidera el ambicioso proyecto de reconstrucción de Williams, aportando su vasta experiencia técnica y consistencia. Es un trabajador incansable que eleva el nivel de cualquier equipo que pisa.',
    habilidad_1: { nombre: 'Smooth Operator', puntos: 6, descripcion: 'Su stint con Medios es el más largo entre los coches que acaban en puntos.' }
  },
  { 
    id: 'sainz_t2', numero: 55, nombre: 'Carlos Sainz', equipo: 'Williams', tier: 2, precio: 27.0, 
    imagen: '/Pilotos/sainz.png',
    descripcion: 'El madrileño lidera el ambicioso proyecto de reconstrucción de Williams, aportando su vasta experiencia técnica y consistencia. Es un trabajador incansable que eleva el nivel de cualquier equipo que pisa.',
    habilidad_1: { nombre: 'Smooth Operator', puntos: 6, descripcion: 'Su stint con Medios es el más largo entre los coches que acaban en puntos.' },
    habilidad_2: { nombre: 'Ingeniero en Pista', puntos: 8, descripcion: 'Puntúa habiendo hecho 1 parada menos que el promedio del Top 10.' },
    penalizacion: { nombre: 'Estrategia de equipo', puntos: -4, descripcion: 'Su tiempo parado en el pit lane supera los 3.5 segundos.' }
  },
  { 
    id: 'albon_t1', numero: 23, nombre: 'Alexander Albon', equipo: 'Williams', tier: 1, precio: 15.0, 
    imagen: '/Pilotos/albon.png',
    descripcion: 'El tailandés es el pilar fundamental de Williams tras años de evolución consistente. Combina inteligencia táctica, velocidad en clasificación y gestión de neumáticos, siendo uno de los pilotos más subestimados de la parrilla.',
    habilidad_1: { nombre: 'Muro Tailandés', puntos: 6, descripcion: 'Defiende su posición sin ser adelantado en pista durante al menos 15 vueltas.' }
  },
  { 
    id: 'albon_t2', numero: 23, nombre: 'Alexander Albon', equipo: 'Williams', tier: 2, precio: 25.0, 
    imagen: '/Pilotos/albon.png',
    descripcion: 'El tailandés es el pilar fundamental de Williams tras años de evolución consistente. Combina inteligencia táctica, velocidad en clasificación y gestión de neumáticos, siendo uno de los pilotos más subestimados de la parrilla.',
    habilidad_1: { nombre: 'Muro Tailandés', puntos: 6, descripcion: 'Defiende su posición sin ser adelantado en pista durante al menos 15 vueltas.' },
    habilidad_2: { nombre: 'Albono de Gomas', puntos: 8, descripcion: 'Logra puntuar completando más de 30 vueltas con un mismo neumático.' },
    penalizacion: { nombre: 'Muro real', puntos: -5, descripcion: 'Provoca una bandera amarilla o coche de seguridad por salida de pista.' }
  },

  // --- HAAS ---
  { 
    id: 'ocon_t1', numero: 31, nombre: 'Esteban Ocon', equipo: 'Haas', tier: 1, precio: 14.0, 
    imagen: '/Pilotos/ocon.png',
    descripcion: 'El francés aterriza en el equipo Haas para aportar su solidez y experiencia tras su larga etapa en Alpine. Buscará liderar al equipo estadounidense hacia la zona media de la parrilla con regularidad.',
    habilidad_1: { nombre: 'A Cuchillo', puntos: 6, descripcion: 'Supera a su compañero de equipo al final del Sector 1 absoluto más rápido.' }
  },
  { 
    id: 'ocon_t2', numero: 31, nombre: 'Esteban Ocon', equipo: 'Haas', tier: 2, precio: 24.0, 
    imagen: '/Pilotos/ocon.png',
    descripcion: 'El francés aterriza en el equipo Haas para aportar su solidez y experiencia tras su larga etapa en Alpine. Buscará liderar al equipo estadounidense hacia la zona media de la parrilla con regularidad.',
    habilidad_1: { nombre: 'A Cuchillo', puntos: 6, descripcion: 'Supera a su compañero de equipo al final del Sector 1 absoluto más rápido.' },
    // ¡Aquí está tu recompensa por el caos que pediste!
    habilidad_2: { nombre: 'Tensiómetro', puntos: 8, descripcion: '¡CAOS! Obtiene puntos si provoca un incidente y es penalizado por causar una colisión.' },
    penalizacion: { nombre: 'Karma', puntos: -6, descripcion: 'Es el primer piloto de toda la parrilla en abandonar la carrera (Primer DNF).' }
  },
  { 
    id: 'bearman_t1', numero: 87, nombre: 'Oliver Bearman', equipo: 'Haas', tier: 1, precio: 13.0, 
    imagen: '/Pilotos/bearman.png',
    descripcion: 'El joven talento británico disputa su primera temporada completa en F1, respaldado por la academia de Ferrari. Promete dar mucho espectáculo y velocidad tras sus impresionantes actuaciones como reserva.',
    habilidad_1: { nombre: 'Progresión', puntos: 6, descripcion: 'Su vuelta personal más rápida se registra en el último cuarto de la carrera.' }
  },
  { 
    id: 'bearman_t2', numero: 87, nombre: 'Oliver Bearman', equipo: 'Haas', tier: 2, precio: 23.0, 
    imagen: '/Pilotos/bearman.png',
    descripcion: 'El joven talento británico disputa su primera temporada completa en F1, respaldado por la academia de Ferrari. Promete dar mucho espectáculo y velocidad tras sus impresionantes actuaciones como reserva.',
    habilidad_1: { nombre: 'Progresión', puntos: 6, descripcion: 'Su vuelta personal más rápida se registra en el último cuarto de la carrera.' },
    habilidad_2: { nombre: 'Madurez', puntos: 8, descripcion: 'Completa la carrera en puntos y por delante de su compañero de equipo.' },
    penalizacion: { nombre: 'Ansiedad en Pit', puntos: -4, descripcion: 'Excede el límite de velocidad en el Pit Lane.' }
  },

  // --- AUDI ---
  { 
    id: 'hulkenberg_t1', numero: 27, nombre: 'Nico Hülkenberg', equipo: 'Audi', tier: 1, precio: 13.0, 
    imagen: '/Pilotos/hulkenberg.png',
    descripcion: 'El veterano alemán aporta sus manos fiables y su maestría en clasificación para inaugurar la era de la marca de los cuatro aros en la F1. Es la voz de la experiencia en este nuevo equipo oficial.',
    habilidad_1: { nombre: 'Hulk', puntos: 6, descripcion: 'Adelanta a su compañero de equipo en pista.' }
  },
  { 
    id: 'hulkenberg_t2', numero: 27, nombre: 'Nico Hülkenberg', equipo: 'Audi', tier: 2, precio: 23.0, 
    imagen: '/Pilotos/hulkenberg.png',
    descripcion: 'El veterano alemán aporta sus manos fiables y su maestría en clasificación para inaugurar la era de la marca de los cuatro aros en la F1. Es la voz de la experiencia en este nuevo equipo oficial.',
    habilidad_1: { nombre: 'Hulk', puntos: 6, descripcion: 'Adelanta a su compañero de equipo en pista.' },
    habilidad_2: { nombre: 'Maestro de la Qualy', puntos: 8, descripcion: 'Consigue clasificar en el Top 8 de la parrilla de salida.' },
    penalizacion: { nombre: 'Caída dominical', puntos: -5, descripcion: 'Pierde 4 o más posiciones en carrera respecto a su salida.' }
  },
  { 
    id: 'bortoleto_t1', numero: 5, nombre: 'Gabriel Bortoleto', equipo: 'Audi', tier: 1, precio: 12.0, 
    imagen: '/Pilotos/bortoleto.png',
    descripcion: 'El joven campeón brasileño representa el futuro del proyecto de Audi, llegando a la categoría con grandes credenciales en las fórmulas de promoción. Trae a Brasil de vuelta a la parrilla con mucho talento.',
    habilidad_1: { nombre: 'Alumno', puntos: 6, descripcion: 'Queda por delante de Fernando Alonso al ver la bandera a cuadros.' }
  },
  { 
    id: 'bortoleto_t2', numero: 5, nombre: 'Gabriel Bortoleto', equipo: 'Audi', tier: 2, precio: 22.0, 
    imagen: '/Pilotos/bortoleto.png',
    descripcion: 'El joven campeón brasileño representa el futuro del proyecto de Audi, llegando a la categoría con grandes credenciales en las fórmulas de promoción. Trae a Brasil de vuelta a la parrilla con mucho talento.',
    habilidad_1: { nombre: 'Alumno', puntos: 6, descripcion: 'Queda por delante de Fernando Alonso al ver la bandera a cuadros.' },
    habilidad_2: { nombre: 'Estabilidad', puntos: 8, descripcion: 'Sus 5 mejores vueltas difieren en menos de 0.3s entre sí.' },
    penalizacion: { nombre: 'Tráfico', puntos: -4, descripcion: 'Es eliminado en Q1 durante la clasificación.' }
  },

  // --- ALPINE ---
  { 
    id: 'gasly_t1', numero: 10, nombre: 'Pierre Gasly', equipo: 'Alpine', tier: 1, precio: 13.0, 
    imagen: '/Pilotos/gasly.png',
    descripcion: 'El líder indiscutible del equipo francés, siempre capaz de extraer el máximo de la maquinaria que le den. Aporta experiencia y mucha velocidad en un equipo en plena reestructuración.',
    habilidad_1: { nombre: 'Pescador', puntos: 6, descripcion: 'Gana posición en las dos vueltas inmediatamente posteriores al fin de un SC/VSC.' }
  },
  { 
    id: 'gasly_t2', numero: 10, nombre: 'Pierre Gasly', equipo: 'Alpine', tier: 2, precio: 23.0, 
    imagen: '/Pilotos/gasly.png',
    descripcion: 'El líder indiscutible del equipo francés, siempre capaz de extraer el máximo de la maquinaria que le den. Aporta experiencia y mucha velocidad en un equipo en plena reestructuración.',
    habilidad_1: { nombre: 'Pescador', puntos: 6, descripcion: 'Gana posición en las dos vueltas inmediatamente posteriores al fin de un SC/VSC.' },
    habilidad_2: { nombre: 'Fransly', puntos: 8, descripcion: 'Puntúan tanto él como su compañero de equipo.' },
    penalizacion: { nombre: 'Mala suerte', puntos: -4, descripcion: 'Su tiempo en el pitlane es el más lento de todos los que pararon esa vuelta.' }
  },
  { 
    id: 'colapinto_t1', numero: 43, nombre: 'Franco Colapinto', equipo: 'Alpine', tier: 1, precio: 14.0, 
    imagen: '/Pilotos/colapinto.png',
    descripcion: 'El talentoso piloto argentino se consolida en la parrilla oficial de Alpine, trayendo sangre fresca y el apoyo de toda una nación. Destaca por su agresividad bien canalizada y su rápida adaptación.',
    habilidad_1: { nombre: 'Garra Argentina', puntos: 6, descripcion: 'Termina al menos 2 posiciones por delante de su compañero de equipo.' }
  },
  { 
    id: 'colapinto_t2', numero: 43, nombre: 'Franco Colapinto', equipo: 'Alpine', tier: 2, precio: 24.0, 
    imagen: '/Pilotos/colapinto.png',
    descripcion: 'El talentoso piloto argentino se consolida en la parrilla oficial de Alpine, trayendo sangre fresca y el apoyo de toda una nación. Destaca por su agresividad bien canalizada y su rápida adaptación.',
    habilidad_1: { nombre: 'Garra Argentina', puntos: 6, descripcion: 'Termina al menos 2 posiciones por delante de su compañero de equipo.' },
    habilidad_2: { nombre: 'Al Límite', puntos: 8, descripcion: 'Cruza la meta a menos de 0.8s de diferencia del coche que tiene delante.' },
    penalizacion: { nombre: 'Demasiado Límite', puntos: -5, descripcion: 'Causa una Bandera Roja en entrenamientos libres o clasificación.' }
  },

  // --- RACING BULLS ---
  { 
    id: 'lawson_t1', numero: 30, nombre: 'Liam Lawson', equipo: 'Racing Bulls', tier: 1, precio: 12.0, 
    imagen: '/Pilotos/lawson.png',
    descripcion: 'El neozelandés finalmente se asienta como piloto titular indiscutible, habiendo demostrado de sobra su valía cuando fue reserva. Es agresivo, seguro y tiene un enorme potencial de crecimiento.',
    habilidad_1: { nombre: 'Ataque Púrpura', puntos: 6, descripcion: 'Marca al menos un sector púrpura absoluto a lo largo de la carrera.' }
  },
  { 
    id: 'lawson_t2', numero: 30, nombre: 'Liam Lawson', equipo: 'Racing Bulls', tier: 2, precio: 22.0, 
    imagen: '/Pilotos/lawson.png',
    descripcion: 'El neozelandés finalmente se asienta como piloto titular indiscutible, habiendo demostrado de sobra su valía cuando fue reserva. Es agresivo, seguro y tiene un enorme potencial de crecimiento.',
    habilidad_1: { nombre: 'Ataque Púrpura', puntos: 6, descripcion: 'Marca al menos un sector púrpura absoluto a lo largo de la carrera.' },
    habilidad_2: { nombre: 'Venganza', puntos: 8, descripcion: 'Termina por delante de cualquier piloto del equipo Red Bull Racing.' },
    penalizacion: { nombre: 'Presión de Marko', puntos: -4, descripcion: 'Es doblado por el líder de la carrera (bandera azul).' }
  },
  { 
    id: 'lindblad_t1', numero: 41, nombre: 'Arvid Lindblad', equipo: 'Racing Bulls', tier: 1, precio: 11.0, 
    imagen: '/Pilotos/lindblad.png',
    descripcion: 'Uno de los grandes novatos de la temporada, directo desde la academia de Red Bull. Un adolescente prodigio que tendrá que adaptarse rápido a la exigencia de la categoría reina.',
    habilidad_1: { nombre: 'Nuevo Talento', puntos: 6, descripcion: 'Termina la carrera dentro del Top 10.' }
  },
  { 
    id: 'lindblad_t2', numero: 41, nombre: 'Arvid Lindblad', equipo: 'Racing Bulls', tier: 2, precio: 21.0, 
    imagen: '/Pilotos/lindblad.png',
    descripcion: 'Uno de los grandes novatos de la temporada, directo desde la academia de Red Bull. Un adolescente prodigio que tendrá que adaptarse rápido a la exigencia de la categoría reina.',
    habilidad_1: { nombre: 'Nuevo Talento', puntos: 6, descripcion: 'Termina la carrera dentro del Top 10.' },
    habilidad_2: { nombre: 'Sábado Mágico', puntos: 8, descripcion: 'Consigue clasificar en la Q3 el sábado.' },
    penalizacion: { nombre: 'Ritmo Irregular', puntos: -4, descripcion: 'Su peor vuelta en carrera es 3 segundos más lenta que su media (excluyendo SC/Pit).' }
  },

  // --- CADILLAC ---
  { 
    id: 'perez_t1', numero: 11, nombre: 'Sergio Perez', equipo: 'Cadillac', tier: 1, precio: 11.0, 
    imagen: '/Pilotos/perez.png',
    descripcion: 'El veterano mexicano encuentra una nueva vida liderando la entrada del flamante equipo estadounidense, Cadillac, a la parrilla. Su enorme experiencia y gestión de neumáticos serán vitales para desarrollar el nuevo monoplaza.',
    habilidad_1: { nombre: 'Garra Mexicana', puntos: 6, descripcion: 'Termina la carrera al menos en el Top 14.' }
  },
  { 
    id: 'perez_t2', numero: 11, nombre: 'Sergio Perez', equipo: 'Cadillac', tier: 2, precio: 21.0, 
    imagen: '/Pilotos/perez.png',
    descripcion: 'El veterano mexicano encuentra una nueva vida liderando la entrada del flamante equipo estadounidense, Cadillac, a la parrilla. Su enorme experiencia y gestión de neumáticos serán vitales para desarrollar el nuevo monoplaza.',
    habilidad_1: { nombre: 'Garra Mexicana', puntos: 6, descripcion: 'Termina la carrera al menos en el Top 14.' },
    habilidad_2: { nombre: 'Ministro de Defensa', puntos: 8, descripcion: 'Pasa 3 vueltas consecutivas con un rival en DRS sin cederle la posición.' },
    penalizacion: { nombre: 'Desastre en Qualy', puntos: -6, descripcion: 'Cae eliminado en la sesión Q1 del sábado.' }
  },
  { 
    id: 'bottas_t1', numero: 77, nombre: 'Valtteri Bottas', equipo: 'Cadillac', tier: 1, precio: 10.0, 
    imagen: '/Pilotos/bottas.png',
    descripcion: 'El finlandés regresa a la parrilla junto a "Checo" para formar una alineación llena de sabiduría y velocidad en el debut de Cadillac. Aportará toda la cultura de trabajo que aprendió en sus años gloriosos.',
    habilidad_1: { nombre: 'Leñador', puntos: 6, descripcion: 'Logra colar el coche en el Top 12 de la parrilla de salida.' }
  },
  { 
    id: 'bottas_t2', numero: 77, nombre: 'Valtteri Bottas', equipo: 'Cadillac', tier: 2, precio: 20.0, 
    imagen: '/Pilotos/bottas.png',
    descripcion: 'El finlandés regresa a la parrilla junto a "Checo" para formar una alineación llena de sabiduría y velocidad en el debut de Cadillac. Aportará toda la cultura de trabajo que aprendió en sus años gloriosos.',
    habilidad_1: { nombre: 'Leñador', puntos: 6, descripcion: 'Logra colar el coche en el Top 12 de la parrilla de salida.' },
    habilidad_2: { nombre: 'Sanción Fantasma', puntos: 8, descripcion: 'No recibe ninguna penalización ni investigación en todo el fin de semana.' },
    penalizacion: { nombre: 'Sin Rebufo', puntos: -4, descripcion: 'Registra una de las 3 velocidades puntas (Speed Trap) más lentas de la carrera.' }
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
export const mercadoCoches = [
  { 
    id: 'aston_martin', nombre: 'Aston Martin Aramco', precio: 20.0, puntos: 200, imagen: '/Coches/AstonMartin.png',
    descripcion: 'El chasis desarrollado en la vanguardista fábrica de Silverstone. Destaca por su capacidad para generar carga aerodinámica en curvas lentas y su agresividad en salidas.',
    habilidad: { nombre: 'Sinergia de Equipo', puntos: 25, descripcion: 'Obtienes este bono si tienes alineado a Fernando Alonso o Lance Stroll en tu equipo.' }
  },
  { 
    id: 'audi', nombre: 'Audi Revolut F1', precio: 20.0, puntos: 200, imagen: '/Coches/Audi.png',
    descripcion: 'La obra maestra de la ingeniería alemana hace su debut. Un monoplaza diseñado desde cero, priorizando la fiabilidad del motor y la consistencia en tandas largas.',
    habilidad: { nombre: 'Sinergia de Equipo', puntos: 25, descripcion: 'Obtienes este bono si tienes alineado a Nico Hülkenberg o Gabriel Bortoleto en tu equipo.' }
  },
  { 
    id: 'cadillac', nombre: 'Cadillac F1', precio: 20.0, puntos: 200, imagen: '/Coches/Cadillac.png',
    descripcion: 'El rugido estadounidense llega a la F1. Un coche pesado pero extremadamente robusto en recta, diseñado para sobrevivir a batallas intensas en el cuerpo a cuerpo.',
    habilidad: { nombre: 'Sinergia de Equipo', puntos: 25, descripcion: 'Obtienes este bono si tienes alineado a Sergio Perez o Valtteri Bottas en tu equipo.' }
  },
  { 
    id: 'ferrari', nombre: 'Ferrari', precio: 20.0, puntos: 200, imagen: '/Coches/Ferrari.png',
    descripcion: 'El icónico monoplaza rojo de Maranello. Un misil a una vuelta con un motor potentísimo, famoso por calentar los neumáticos más rápido que nadie.',
    habilidad: { nombre: 'Sinergia de Equipo', puntos: 25, descripcion: 'Obtienes este bono si tienes alineado a Charles Leclerc o Lewis Hamilton en tu equipo.' }
  },
  { 
    id: 'haas', nombre: 'TGR Haas F1', precio: 20.0, puntos: 200, imagen: '/Coches/Haas.png',
    descripcion: 'Con el nuevo soporte técnico de Toyota Gazoo Racing, este monoplaza es un cazador de oportunidades. Destaca por aprovechar el caos y clasificar sorprendentemente bien.',
    habilidad: { nombre: 'Sinergia de Equipo', puntos: 25, descripcion: 'Obtienes este bono si tienes alineado a Esteban Ocon u Oliver Bearman en tu equipo.' }
  },
  { 
    id: 'mclaren', nombre: 'McLaren Mastercard', precio: 20.0, puntos: 200, imagen: '/Coches/Mclaren.png',
    descripcion: 'El coche a batir. Una maravilla aerodinámica color papaya que devora las curvas rápidas y mima los neumáticos de forma excepcional en cualquier condición.',
    habilidad: { nombre: 'Sinergia de Equipo', puntos: 25, descripcion: 'Obtienes este bono si tienes alineado a Lando Norris u Oscar Piastri en tu equipo.' }
  },
  { 
    id: 'mercedes', nombre: 'Mercedes-AMG', precio: 20.0, puntos: 200, imagen: '/Coches/Mercedes.png',
    descripcion: 'La flecha plateada/negra es un prodigio de la eficiencia. Un chasis que brilla especialmente los domingos gracias a su estabilidad en ritmo de carrera.',
    habilidad: { nombre: 'Sinergia de Equipo', puntos: 25, descripcion: 'Obtienes este bono si tienes alineado a George Russell o Kimi Antonelli en tu equipo.' }
  },
  { 
    id: 'racing_bulls', nombre: 'Racing Bulls VCARB', precio: 20.0, puntos: 200, imagen: '/Coches/RacingBulls.png',
    descripcion: 'El hermano menor de Red Bull hereda soluciones técnicas punteras. Un coche muy ágil en circuitos revirados e ideal para pilotos jóvenes que asumen riesgos.',
    habilidad: { nombre: 'Sinergia de Equipo', puntos: 25, descripcion: 'Obtienes este bono si tienes alineado a Liam Lawson o Arvid Lindblad en tu equipo.' }
  },
  { 
    id: 'red_bull', nombre: 'Red Bull Racing', precio: 20.0, puntos: 200, imagen: '/Coches/RedBull.png',
    descripcion: 'La obra cumbre de la aerodinámica moderna. Un monoplaza afilado, letal en zonas de alta velocidad y con el sistema de DRS más efectivo de toda la parrilla.',
    habilidad: { nombre: 'Sinergia de Equipo', puntos: 25, descripcion: 'Obtienes este bono si tienes alineado a Max Verstappen o Isack Hadjar en tu equipo.' }
  },
  { 
    id: 'williams', nombre: 'Atlassian Williams', precio: 20.0, puntos: 200, imagen: '/Coches/Williams.png',
    descripcion: 'El histórico equipo británico presenta un monoplaza optimizado para la baja resistencia aerodinámica (low drag). Es un auténtico misil inalcanzable en las grandes rectas.',
    habilidad: { nombre: 'Sinergia de Equipo', puntos: 25, descripcion: 'Obtienes este bono si tienes alineado a Carlos Sainz o Alexander Albon en tu equipo.' }
  }
];