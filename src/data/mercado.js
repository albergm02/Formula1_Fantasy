// prettier-ignore
export const mercadoPilotos = [
  // --- MCLAREN ---
  { 
    id: 'norris_t1', numero: 1, nombre: 'Lando Norris', equipo: 'McLaren', tier: 1, precio: 26.0, 
    imagen: '/Pilotos/norris.png',
    descripcion: 'Vigente campeón del mundo, llega a 2026 buscando defender su título con McLaren tras una espectacular temporada anterior. Es uno de los talentos más consolidados y rápidos de la parrilla.',
    habilidad_1: { nombre: 'Ritmo Papaya', puntos: 8, descripcion: 'Logra el récord absoluto del Sector 2 (Púrpura) en al menos 5 vueltas durante la carrera.' }
  },
  { 
    id: 'norris_t2', numero: 1, nombre: 'Lando Norris', equipo: 'McLaren', tier: 2, precio: 36.0, 
    imagen: '/Pilotos/norris.png',
    descripcion: 'Vigente campeón del mundo, llega a 2026 buscando defender su título con McLaren tras una espectacular temporada anterior. Es uno de los talentos más consolidados y rápidos de la parrilla.',
    habilidad_1: { nombre: 'Ritmo Papaya', puntos: 8, descripcion: 'Logra el récord absoluto del Sector 2 (Púrpura) en al menos 5 vueltas durante la carrera.' },
    habilidad_2: { nombre: 'Last Lap Lando', puntos: 7, descripcion: 'Registra su vuelta personal más rápida dentro de las últimas 5 vueltas del Gran Premio.' },
    penalizacion: { nombre: 'Foco Perdido', puntos: -5, descripcion: 'Termina la primera vuelta en una posición inferior a la de su salida.' } 
  },
  { 
    id: 'piastri_t1', numero: 81, nombre: 'Oscar Piastri', equipo: 'McLaren', tier: 1, precio: 24.0, 
    imagen: '/Pilotos/piastri.png',
    descripcion: 'El australiano se ha ganado el estatus de estrella gracias a su tremendo ritmo y frialdad. Forma junto a Norris una de las duplas más temibles de toda la Fórmula 1.',
    habilidad_1: { nombre: 'Sangre Fría', puntos: 4, descripcion: 'Mantiene o mejora su posición inicial al finalizar la exigente primera vuelta.' } 
  },
  { 
    id: 'piastri_t2', numero: 81, nombre: 'Oscar Piastri', equipo: 'McLaren', tier: 2, precio: 34.0, 
    imagen: '/Pilotos/piastri.png',
    descripcion: 'El australiano se ha ganado el estatus de estrella gracias a su tremendo ritmo y frialdad. Forma junto a Norris una de las duplas más temibles de toda la Fórmula 1.',
    habilidad_1: { nombre: 'Sangre Fría', puntos: 4, descripcion: 'Mantiene o mejora su posición inicial al finalizar la exigente primera vuelta.' },
    habilidad_2: { nombre: 'Chico de Hielo', puntos: 6, descripcion: 'Cruza la línea de meta en una posición superior a la que ocupaba en la parrilla de salida.' },
    penalizacion: { nombre: 'Desgaste Prematuro', puntos: -6, descripcion: 'Es adelantado en pista por su compañero de equipo después de realizar su primera parada en boxes.' }
  },

  // --- RED BULL RACING ---
  { 
    id: 'verstappen_t1', numero: 3, nombre: 'Max Verstappen', equipo: 'Red Bull', tier: 1, precio: 25.0, 
    imagen: '/Pilotos/verstappen.png',
    descripcion: 'El tetracampeón neerlandés busca devolver a Red Bull a la cima tras perder la corona el año pasado. Sigue siendo probablemente el piloto más implacable y agresivo de la parrilla.',
    habilidad_1: { nombre: 'Mad Max', puntos: 5, descripcion: 'Sube al podio (Top 3) sin haber conseguido la vuelta rápida de la carrera.' }
  },
  { 
    id: 'verstappen_t2', numero: 3, nombre: 'Max Verstappen', equipo: 'Red Bull', tier: 2, precio: 35.0, 
    imagen: '/Pilotos/verstappen.png',
    descripcion: 'El tetracampeón neerlandés busca devolver a Red Bull a la cima tras perder la corona el año pasado. Sigue siendo probablemente el piloto más implacable y agresivo de la parrilla.',
    habilidad_1: { nombre: 'Mad Max', puntos: 5, descripcion: 'Sube al podio (Top 3) sin haber conseguido la vuelta rápida de la carrera.' },
    habilidad_2: { nombre: 'Inquebrantable', puntos: 9, descripcion: 'Defiende su posición con éxito durante 5 vueltas consecutivas teniendo a un rival en zona de DRS.' },
    penalizacion: { nombre: 'Furia por la radio', puntos: -4, descripcion: 'Es apercibido oficialmente con bandera blanca y negra por exceder los límites de pista.' }
  },
  { 
    id: 'hadjar_t1', numero: 6, nombre: 'Isack Hadjar', equipo: 'Red Bull', tier: 1, precio: 15.0, 
    imagen: '/Pilotos/hadjar.png',
    descripcion: 'Promovido al primer equipo para ser el escudero de Verstappen tras una gran etapa formativa. Tendrá el difícil reto de sobrevivir a la enorme presión que siempre rodea al segundo asiento de Red Bull.',
    habilidad_1: { nombre: 'Gran inicio', puntos: 7, descripcion: 'Marca uno de los 5 mejores tiempos en el Sector 1 durante la primera vuelta.' }
  },
  { 
    id: 'hadjar_t2', numero: 6, nombre: 'Isack Hadjar', equipo: 'Red Bull', tier: 2, precio: 25.0, 
    imagen: '/Pilotos/hadjar.png',
    descripcion: 'Promovido al primer equipo para ser el escudero de Verstappen tras una gran etapa formativa. Tendrá el difícil reto de sobrevivir a la enorme presión que siempre rodea al segundo asiento de Red Bull.',
    habilidad_1: { nombre: 'Gran inicio', puntos: 7, descripcion: 'Marca uno de los 5 mejores tiempos en el Sector 1 durante la primera vuelta.' },
    habilidad_2: { nombre: 'El pequeño Prost', puntos: 8, descripcion: 'Cruza la bandera a cuadros entre los 6 primeros clasificados.' },
    penalizacion: { nombre: 'Pecado de Novato', puntos: -6, descripcion: 'Es penalizado por Dirección de Carrera con 5 o 10 segundos de sanción.' }
  },

  // --- FERRARI ---
  { 
    id: 'leclerc_t1', numero: 16, nombre: 'Charles Leclerc', equipo: 'Ferrari', tier: 1, precio: 24.0, 
    imagen: '/Pilotos/leclerc.png',
    descripcion: '"Il Predestinato" sigue siendo la gran apuesta de futuro y presente de Maranello. Buscará maximizar el rendimiento del Ferrari y batir a su histórico compañero de equipo.',
    habilidad_1: { nombre: 'Príncipe de la Pole', puntos: 7, descripcion: 'Consigue la Pole Position y lidera la parrilla de salida el domingo.' } 
  },
  { 
    id: 'leclerc_t2', numero: 16, nombre: 'Charles Leclerc', equipo: 'Ferrari', tier: 2, precio: 34.0, 
    imagen: '/Pilotos/leclerc.png',
    descripcion: '"Il Predestinato" sigue siendo la gran apuesta de futuro y presente de Maranello. Buscará maximizar el rendimiento del Ferrari y batir a su histórico compañero de equipo.',
    habilidad_1: { nombre: 'Príncipe de la Pole', puntos: 7, descripcion: 'Consigue la Pole Position y lidera la parrilla de salida el domingo.' },
    habilidad_2: { nombre: 'Il Predestinato', puntos: 9, descripcion: 'Completa un relevo (stint) con neumáticos blandos de mayor duración que la media general.' }, 
    penalizacion: { nombre: 'Maldición', puntos: -10, descripcion: 'No logra terminar la carrera (DNF) debido a un accidente o problema mecánico.' }
  },
  { 
    id: 'hamilton_t1', numero: 44, nombre: 'Lewis Hamilton', equipo: 'Ferrari', tier: 1, precio: 23.0, 
    imagen: '/Pilotos/hamilton.png',
    descripcion: 'El heptacampeón del mundo cumple su sueño de vestir de rojo en su segunda temporada con Ferrari, persiguiendo ese ansiado octavo título. Aporta una experiencia inigualable y un talento legendario.',
    habilidad_1: { nombre: 'Sunday King', puntos: 8, descripcion: 'Remonta y termina la carrera al menos 4 posiciones por encima de su lugar de salida.' }
  },
  { 
    id: 'hamilton_t2', numero: 44, nombre: 'Lewis Hamilton', equipo: 'Ferrari', tier: 2, precio: 33.0, 
    imagen: '/Pilotos/hamilton.png',
    descripcion: 'El heptacampeón del mundo cumple su sueño de vestir de rojo en su segunda temporada con Ferrari, persiguiendo ese ansiado octavo título. Aporta una experiencia inigualable y un talento legendario.',
    habilidad_1: { nombre: 'Sunday King', puntos: 8, descripcion: 'Remonta y termina la carrera al menos 4 posiciones por encima de su lugar de salida.' },
    habilidad_2: { nombre: 'Hammer Time', puntos: 6, descripcion: 'Finaliza el Gran Premio por delante de su compañero de equipo.' },
    penalizacion: { nombre: 'Gomas Frías', puntos: -5, descripcion: 'Cede al menos una posición en la vuelta de relanzamiento tras un coche de seguridad (Safety Car).' }
  },

  // --- MERCEDES ---
  { 
    id: 'russell_t1', numero: 63, nombre: 'George Russell', equipo: 'Mercedes', tier: 1, precio: 22.0, 
    imagen: '/Pilotos/russell.png',
    descripcion: 'El británico asume el papel de líder consolidado dentro de Mercedes en esta nueva era reglamentaria. Es analítico, constante y letal cuando el coche responde.',
    habilidad_1: { nombre: 'Mr. Saturday', puntos: 7, descripcion: 'Firma una clasificación estelar y toma la salida desde el Top 3.' }
  },
  { 
    id: 'russell_t2', numero: 63, nombre: 'George Russell', equipo: 'Mercedes', tier: 2, precio: 32.0, 
    imagen: '/Pilotos/russell.png',
    descripcion: 'El británico asume el papel de líder consolidado dentro de Mercedes en esta nueva era reglamentaria. Es analítico, constante y letal cuando el coche responde.',
    habilidad_1: { nombre: 'Mr. Saturday', puntos: 7, descripcion: 'Firma una clasificación estelar y toma la salida desde el Top 3.' },
    habilidad_2: { nombre: 'Carrera Limpia', puntos: 9, descripcion: 'Finaliza en el Top 5 sin recibir un solo aviso por exceder los límites de pista (Track Limits).' },
    penalizacion: { nombre: 'Presión Crítica', puntos: -8, descripcion: 'Es adelantado o sufre un accidente letal en las últimas 3 vueltas de la carrera.' } 
  },
  { 
    id: 'antonelli_t1', numero: 12, nombre: 'Kimi Antonelli', equipo: 'Mercedes', tier: 1, precio: 20.0, 
    imagen: '/Pilotos/antonelli.png',
    descripcion: 'La joya de la corona de la academia de Mercedes, da el salto definitivo para demostrar que el "hype" estaba justificado. Un talento generacional listo para pelear en la zona alta.',
    habilidad_1: { nombre: 'Diamante en Bruto', puntos: 6, descripcion: 'Registra una velocidad máxima en la trampa de velocidad (Speed Trap) superior a la de Russell.' }
  },
  { 
    id: 'antonelli_t2', numero: 12, nombre: 'Kimi Antonelli', equipo: 'Mercedes', tier: 2, precio: 30.0, 
    imagen: '/Pilotos/antonelli.png',
    descripcion: 'La joya de la corona de la academia de Mercedes, da el salto definitivo para demostrar que el "hype" estaba justificado. Un talento generacional listo para pelear en la zona alta.',
    habilidad_1: { nombre: 'Diamante en Bruto', puntos: 6, descripcion: 'Registra una velocidad máxima en la trampa de velocidad (Speed Trap) superior a la de Russell.' },
    habilidad_2: { nombre: 'Relevo', puntos: 9, descripcion: 'Termina en la zona de puntos y supera a su compañero de equipo en la clasificación final.' },
    penalizacion: { nombre: 'Exceso de Ímpetu', puntos: -5, descripcion: 'Provoca una bandera amarilla o roja en cualquier sesión de Entrenamientos Libres o Clasificación.' }
  },

  // --- ASTON MARTIN ---
  { 
    id: 'alonso_t1', numero: 14, nombre: 'Fernando Alonso', equipo: 'Aston Martin', tier: 1, precio: 19.0, 
    imagen: '/Pilotos/alonso.png',
    descripcion: 'El incombustible bicampeón español sigue rindiendo a un nivel excepcional en Aston Martin de la mano de los nuevos motores Honda. Su inteligencia en carrera y su magia al volante parecen no tener fecha de caducidad.',
    habilidad_1: { nombre: 'Salida Mágica', puntos: 7, descripcion: 'Avanza 2 o más posiciones respecto a su lugar en la parrilla antes de finalizar la primera vuelta.' }
  },
  { 
    id: 'alonso_t2', numero: 14, nombre: 'Fernando Alonso', equipo: 'Aston Martin', tier: 2, precio: 29.0, 
    imagen: '/Pilotos/alonso.png',
    descripcion: 'El incombustible bicampeón español sigue rindiendo a un nivel excepcional en Aston Martin de la mano de los nuevos motores Honda. Su inteligencia en carrera y su magia al volante parecen no tener fecha de caducidad.',
    habilidad_1: { nombre: 'Salida Mágica', puntos: 7, descripcion: 'Avanza 2 o más posiciones respecto a su lugar en la parrilla antes de finalizar la primera vuelta.' },
    habilidad_2: { nombre: 'El padre', puntos: 4, descripcion: 'Rueda por delante de su compañero de equipo de forma ininterrumpida durante 20 vueltas.' }, 
    penalizacion: { nombre: 'Motor GP2', puntos: -6, descripcion: 'Registra una de las 3 peores velocidades máximas de la carrera o abandona por avería.' }
  },
  { 
    id: 'stroll_t1', numero: 18, nombre: 'Lance Stroll', equipo: 'Aston Martin', tier: 1, precio: 13.0, 
    imagen: '/Pilotos/stroll.png',
    descripcion: 'El piloto canadiense continúa en la estructura familiar buscando encontrar la consistencia que a menudo le falta. Necesitará dar un paso adelante para igualar el ritmo de Alonso.',
    habilidad_1: { nombre: 'Lancelot', puntos: 8, descripcion: 'Completa la carrera dentro de la zona de puntos (Top 10).' }
  },
  { 
    id: 'stroll_t2', numero: 18, nombre: 'Lance Stroll', equipo: 'Aston Martin', tier: 2, precio: 23.0, 
    imagen: '/Pilotos/stroll.png',
    descripcion: 'El piloto canadiense continúa en la estructura familiar buscando encontrar la consistencia que a menudo le falta. Necesitará dar un paso adelante para igualar el ritmo de Alonso.',
    habilidad_1: { nombre: 'Lancelot', puntos: 8, descripcion: 'Completa la carrera dentro de la zona de puntos (Top 10).' },
    habilidad_2: { nombre: 'Invisible', puntos: 5, descripcion: 'Finaliza el Gran Premio sin estar involucrado en investigaciones ni recibir sanciones de la FIA.' },
    penalizacion: { nombre: 'Espejos Rotos', puntos: -7, descripcion: 'Sufre daños en su monoplaza debido a una colisión en las 3 primeras vueltas.' }
  },

  // --- WILLIAMS ---
  { 
    id: 'sainz_t1', numero: 55, nombre: 'Carlos Sainz', equipo: 'Williams', tier: 1, precio: 17.0, 
    imagen: '/Pilotos/sainz.png',
    descripcion: 'El madrileño lidera el ambicioso proyecto de reconstrucción de Williams, aportando su vasta experiencia técnica y consistencia. Es un trabajador incansable que eleva el nivel de cualquier equipo que pisa.',
    habilidad_1: { nombre: 'Smooth Operator', puntos: 9, descripcion: 'Realiza el relevo (stint) más largo con neumáticos medios entre los pilotos que acaban en el Top 10.' } 
  },
  { 
    id: 'sainz_t2', numero: 55, nombre: 'Carlos Sainz', equipo: 'Williams', tier: 2, precio: 27.0, 
    imagen: '/Pilotos/sainz.png',
    descripcion: 'El madrileño lidera el ambicioso proyecto de reconstrucción de Williams, aportando su vasta experiencia técnica y consistencia. Es un trabajador incansable que eleva el nivel de cualquier equipo que pisa.',
    habilidad_1: { nombre: 'Smooth Operator', puntos: 9, descripcion: 'Realiza el relevo (stint) más largo con neumáticos medios entre los pilotos que acaban en el Top 10.' },
    habilidad_2: { nombre: 'Ingeniero en Pista', puntos: 12, descripcion: 'Entra en los puntos realizando al menos una parada en boxes menos que la media del Top 10.' }, 
    penalizacion: { nombre: 'Estrategia de equipo', puntos: -5, descripcion: 'Sufre una parada en boxes (pit stop) deficiente que excede los 3.5 segundos.' }
  },
  { 
    id: 'albon_t1', numero: 23, nombre: 'Alexander Albon', equipo: 'Williams', tier: 1, precio: 15.0, 
    imagen: '/Pilotos/albon.png',
    descripcion: 'El tailandés es el pilar fundamental de Williams tras años de evolución consistente. Combina inteligencia táctica, velocidad en clasificación y gestión de neumáticos, siendo uno de los pilotos más subestimados de la parrilla.',
    habilidad_1: { nombre: 'Muro Tailandés', puntos: 7, descripcion: 'Mantiene a sus rivales a raya y no es adelantado en pista durante al menos 15 vueltas consecutivas.' }
  },
  { 
    id: 'albon_t2', numero: 23, nombre: 'Alexander Albon', equipo: 'Williams', tier: 2, precio: 25.0, 
    imagen: '/Pilotos/albon.png',
    descripcion: 'El tailandés es el pilar fundamental de Williams tras años de evolución consistente. Combina inteligencia táctica, velocidad en clasificación y gestión de neumáticos, siendo uno de los pilotos más subestimados de la parrilla.',
    habilidad_1: { nombre: 'Muro Tailandés', puntos: 7, descripcion: 'Mantiene a sus rivales a raya y no es adelantado en pista durante al menos 15 vueltas consecutivas.' },
    habilidad_2: { nombre: 'Albono de Gomas', puntos: 10, descripcion: 'Acaba en los puntos tras exprimir al máximo y completar más de 30 vueltas con un único juego de neumáticos.' },
    penalizacion: { nombre: 'Muro Real', puntos: -8, descripcion: 'Causa la salida del Safety Car o una bandera amarilla debido a una salida de pista.' }
  },

  // --- HAAS ---
  { 
    id: 'ocon_t1', numero: 31, nombre: 'Esteban Ocon', equipo: 'Haas', tier: 1, precio: 14.0, 
    imagen: '/Pilotos/ocon.png',
    descripcion: 'El francés aterriza en el equipo Haas para aportar su solidez y experiencia tras su larga etapa en Alpine. Buscará liderar al equipo estadounidense hacia la zona media de la parrilla con regularidad.',
    habilidad_1: { nombre: 'A Cuchillo', puntos: 5, descripcion: 'Logra un tiempo de paso por el Sector 1 más rápido que su compañero de equipo durante la carrera.' }
  },
  { 
    id: 'ocon_t2', numero: 31, nombre: 'Esteban Ocon', equipo: 'Haas', tier: 2, precio: 24.0, 
    imagen: '/Pilotos/ocon.png',
    descripcion: 'El francés aterriza en el equipo Haas para aportar su solidez y experiencia tras su larga etapa en Alpine. Buscará liderar al equipo estadounidense hacia la zona media de la parrilla con regularidad.',
    habilidad_1: { nombre: 'A Cuchillo', puntos: 5, descripcion: 'Logra un tiempo de paso por el Sector 1 más rápido que su compañero de equipo durante la carrera.' },
    habilidad_2: { nombre: 'Tensiómetro', puntos: 12, descripcion: 'Es penalizado oficialmente por causar una colisión con otro monoplaza durante la carrera.' }, 
    penalizacion: { nombre: 'Karma', puntos: -8, descripcion: 'Sufre el primer abandono (DNF) de toda la parrilla en la carrera.' }
  },
  { 
    id: 'bearman_t1', numero: 87, nombre: 'Oliver Bearman', equipo: 'Haas', tier: 1, precio: 13.0, 
    imagen: '/Pilotos/bearman.png',
    descripcion: 'El joven talento británico disputa su primera temporada completa en F1, respaldado por la academia de Ferrari. Promete dar mucho espectáculo y velocidad tras sus impresionantes actuaciones como reserva.',
    habilidad_1: { nombre: 'Progresión', puntos: 5, descripcion: 'Reserva su mejor ritmo para el final, logrando su vuelta personal más rápida en el último cuarto de carrera.' }
  },
  { 
    id: 'bearman_t2', numero: 87, nombre: 'Oliver Bearman', equipo: 'Haas', tier: 2, precio: 23.0, 
    imagen: '/Pilotos/bearman.png',
    descripcion: 'El joven talento británico disputa su primera temporada completa en F1, respaldado por la academia de Ferrari. Promete dar mucho espectáculo y velocidad tras sus impresionantes actuaciones como reserva.',
    habilidad_1: { nombre: 'Progresión', puntos: 5, descripcion: 'Reserva su mejor ritmo para el final, logrando su vuelta personal más rápida en el último cuarto de carrera.' },
    habilidad_2: { nombre: 'Madurez', puntos: 9, descripcion: 'Termina en la zona de puntos y cruza la meta por delante de su compañero de equipo.' },
    penalizacion: { nombre: 'Ansiedad en Pit', puntos: -5, descripcion: 'Es sancionado por Dirección de Carrera por superar el límite de velocidad en el Pit Lane.' }
  },

  // --- AUDI ---
  { 
    id: 'hulkenberg_t1', numero: 27, nombre: 'Nico Hülkenberg', equipo: 'Audi', tier: 1, precio: 13.0, 
    imagen: '/Pilotos/hulkenberg.png',
    descripcion: 'El veterano alemán aporta sus manos fiables y su maestría en clasificación para inaugurar la era de la marca de los cuatro aros en la F1. Es la voz de la experiencia en este nuevo equipo oficial.',
    habilidad_1: { nombre: 'Hulk', puntos: 6, descripcion: 'Realiza un adelantamiento válido sobre su compañero de equipo en la pista.' }
  },
  { 
    id: 'hulkenberg_t2', numero: 27, nombre: 'Nico Hülkenberg', equipo: 'Audi', tier: 2, precio: 23.0, 
    imagen: '/Pilotos/hulkenberg.png',
    descripcion: 'El veterano alemán aporta sus manos fiables y su maestría en clasificación para inaugurar la era de la marca de los cuatro aros en la F1. Es la voz de la experiencia en este nuevo equipo oficial.',
    habilidad_1: { nombre: 'Hulk', puntos: 6, descripcion: 'Realiza un adelantamiento válido sobre su compañero de equipo en la pista.' },
    habilidad_2: { nombre: 'Maestro de la Qualy', puntos: 8, descripcion: 'Asegura una codiciada posición entre los 8 primeros en la sesión de clasificación del sábado.' },
    penalizacion: { nombre: 'Caída Dominical', puntos: -6, descripcion: 'Termina la carrera habiendo cedido 4 o más posiciones respecto a su lugar en la parrilla.' }
  },
  { 
    id: 'bortoleto_t1', numero: 5, nombre: 'Gabriel Bortoleto', equipo: 'Audi', tier: 1, precio: 12.0, 
    imagen: '/Pilotos/bortoleto.png',
    descripcion: 'El joven campeón brasileño representa el futuro del proyecto de Audi, llegando a la categoría con grandes credenciales en las fórmulas de promoción. Trae a Brasil de vuelta a la parrilla con mucho talento.',
    habilidad_1: { nombre: 'Alumno', puntos: 8, descripcion: 'Cruza la línea de meta en una posición superior a la del bicampeón Fernando Alonso.' }
  },
  { 
    id: 'bortoleto_t2', numero: 5, nombre: 'Gabriel Bortoleto', equipo: 'Audi', tier: 2, precio: 22.0, 
    imagen: '/Pilotos/bortoleto.png',
    descripcion: 'El joven campeón brasileño representa el futuro del proyecto de Audi, llegando a la categoría con grandes credenciales en las fórmulas de promoción. Trae a Brasil de vuelta a la parrilla con mucho talento.',
    habilidad_1: { nombre: 'Alumno', puntos: 8, descripcion: 'Cruza la línea de meta en una posición superior a la del bicampeón Fernando Alonso.' },
    habilidad_2: { nombre: 'Estabilidad', puntos: 11, descripcion: 'Mantiene un ritmo robótico: la diferencia de tiempo entre sus 5 mejores vueltas es inferior a 0.3 segundos.' }, 
    penalizacion: { nombre: 'Tráfico', puntos: -4, descripcion: 'No logra superar el corte y queda eliminado en la primera ronda de clasificación (Q1).' }
  },

  // --- ALPINE ---
  { 
    id: 'gasly_t1', numero: 10, nombre: 'Pierre Gasly', equipo: 'Alpine', tier: 1, precio: 13.0, 
    imagen: '/Pilotos/gasly.png',
    descripcion: 'El líder indiscutible del equipo francés, siempre capaz de extraer el máximo de la maquinaria que le den. Aporta experiencia y mucha velocidad en un equipo en plena reestructuración.',
    habilidad_1: { nombre: 'Pescador', puntos: 7, descripcion: 'Adelanta al menos a un piloto en las dos vueltas posteriores al relanzamiento de la carrera (tras SC/VSC).' }
  },
  { 
    id: 'gasly_t2', numero: 10, nombre: 'Pierre Gasly', equipo: 'Alpine', tier: 2, precio: 23.0, 
    imagen: '/Pilotos/gasly.png',
    descripcion: 'El líder indiscutible del equipo francés, siempre capaz de extraer el máximo de la maquinaria que le den. Aporta experiencia y mucha velocidad en un equipo en plena reestructuración.',
    habilidad_1: { nombre: 'Pescador', puntos: 7, descripcion: 'Adelanta al menos a un piloto en las dos vueltas posteriores al relanzamiento de la carrera (tras SC/VSC).' },
    habilidad_2: { nombre: 'Fransly', puntos: 9, descripcion: 'Logra que tanto él como su compañero de equipo finalicen en la zona de puntos.' },
    penalizacion: { nombre: 'Mala Suerte', puntos: -5, descripcion: 'Sufre la parada en boxes (pit stop) más lenta de la carrera en comparación con el resto de pilotos.' }
  },
  { 
    id: 'colapinto_t1', numero: 43, nombre: 'Franco Colapinto', equipo: 'Alpine', tier: 1, precio: 14.0, 
    imagen: '/Pilotos/colapinto.png',
    descripcion: 'El talentoso piloto argentino se consolida en la parrilla oficial de Alpine, trayendo sangre fresca y el apoyo de toda una nación. Destaca por su agresividad bien canalizada y su rápida adaptación.',
    habilidad_1: { nombre: 'Garra Argentina', puntos: 6, descripcion: 'Finaliza la carrera superando a su compañero de equipo por 2 posiciones o más.' }
  },
  { 
    id: 'colapinto_t2', numero: 43, nombre: 'Franco Colapinto', equipo: 'Alpine', tier: 2, precio: 24.0, 
    imagen: '/Pilotos/colapinto.png',
    descripcion: 'El talentoso piloto argentino se consolida en la parrilla oficial de Alpine, trayendo sangre fresca y el apoyo de toda una nación. Destaca por su agresividad bien canalizada y su rápida adaptación.',
    habilidad_1: { nombre: 'Garra Argentina', puntos: 6, descripcion: 'Finaliza la carrera superando a su compañero de equipo por 2 posiciones o más.' },
    habilidad_2: { nombre: 'Al Límite', puntos: 10, descripcion: 'Pasa bajo la bandera a cuadros pisando los talones a su rival, a menos de 0.8 segundos de diferencia.' },
    penalizacion: { nombre: 'Demasiado Límite', puntos: -7, descripcion: 'Provoca una interrupción por Bandera Roja en cualquier sesión de Entrenamientos Libres o Clasificación.' }
  },

  // --- RACING BULLS ---
  { 
    id: 'lawson_t1', numero: 30, nombre: 'Liam Lawson', equipo: 'Racing Bulls', tier: 1, precio: 12.0, 
    imagen: '/Pilotos/lawson.png',
    descripcion: 'El neozelandés finalmente se asienta como piloto titular indiscutible, habiendo demostrado de sobra su valía cuando fue reserva. Es agresivo, seguro y tiene un enorme potencial de crecimiento.',
    habilidad_1: { nombre: 'Ataque Púrpura', puntos: 12, descripcion: 'Consigue el récord absoluto de la sesión (Sector Púrpura) en al menos uno de los sectores durante la carrera.' }
  },
  { 
    id: 'lawson_t2', numero: 30, nombre: 'Liam Lawson', equipo: 'Racing Bulls', tier: 2, precio: 22.0, 
    imagen: '/Pilotos/lawson.png',
    descripcion: 'El neozelandés finalmente se asienta como piloto titular indiscutible, habiendo demostrado de sobra su valía cuando fue reserva. Es agresivo, seguro y tiene un enorme potencial de crecimiento.',
    habilidad_1: { nombre: 'Ataque Púrpura', puntos: 12, descripcion: 'Consigue el récord absoluto de la sesión (Sector Púrpura) en al menos uno de los sectores durante la carrera.' },
    habilidad_2: { nombre: 'Venganza', puntos: 10, descripcion: 'Cruza la línea de meta en mejor posición que, al menos, uno de los pilotos oficiales de Red Bull Racing.' },
    penalizacion: { nombre: 'Presión de Marko', puntos: -3, descripcion: 'Recibe la bandera azul en pista al ser doblado por el líder de la carrera.' } 
  },
  { 
    id: 'lindblad_t1', numero: 41, nombre: 'Arvid Lindblad', equipo: 'Racing Bulls', tier: 1, precio: 11.0, 
    imagen: '/Pilotos/lindblad.png',
    descripcion: 'Uno de los grandes novatos de la temporada, directo desde la academia de Red Bull. Un adolescente prodigio que tendrá que adaptarse rápido a la exigencia de la categoría reina.',
    habilidad_1: { nombre: 'Nuevo Talento', puntos: 8, descripcion: 'Consigue finalizar la exigente carrera del domingo dentro de los 10 primeros clasificados.' }
  },
  { 
    id: 'lindblad_t2', numero: 41, nombre: 'Arvid Lindblad', equipo: 'Racing Bulls', tier: 2, precio: 21.0, 
    imagen: '/Pilotos/lindblad.png',
    descripcion: 'Uno de los grandes novatos de la temporada, directo desde la academia de Red Bull. Un adolescente prodigio que tendrá que adaptarse rápido a la exigencia de la categoría reina.',
    habilidad_1: { nombre: 'Nuevo Talento', puntos: 8, descripcion: 'Consigue finalizar la exigente carrera del domingo dentro de los 10 primeros clasificados.' },
    habilidad_2: { nombre: 'Sábado Mágico', puntos: 9, descripcion: 'Supera las rondas de eliminación y logra acceder a la Q3 en la clasificación del sábado.' },
    penalizacion: { nombre: 'Ritmo Irregular', puntos: -4, descripcion: 'Registra una vuelta (sin contar Safety Car o Pit Stop) que es al menos 3 segundos más lenta que su ritmo promedio.' }
  },

  // --- CADILLAC ---
  { 
    id: 'perez_t1', numero: 11, nombre: 'Sergio Perez', equipo: 'Cadillac', tier: 1, precio: 11.0, 
    imagen: '/Pilotos/perez.png',
    descripcion: 'El veterano mexicano encuentra una nueva vida liderando la entrada del flamante equipo estadounidense, Cadillac, a la parrilla. Su enorme experiencia y gestión de neumáticos serán vitales para desarrollar el nuevo monoplaza.',
    habilidad_1: { nombre: 'Garra Mexicana', puntos: 5, descripcion: 'Asegura una sólida posición al cruzar la meta entre los 14 primeros.' }
  },
  { 
    id: 'perez_t2', numero: 11, nombre: 'Sergio Perez', equipo: 'Cadillac', tier: 2, precio: 21.0, 
    imagen: '/Pilotos/perez.png',
    descripcion: 'El veterano mexicano encuentra una nueva vida liderando la entrada del flamante equipo estadounidense, Cadillac, a la parrilla. Su enorme experiencia y gestión de neumáticos serán vitales para desarrollar el nuevo monoplaza.',
    habilidad_1: { nombre: 'Garra Mexicana', puntos: 5, descripcion: 'Asegura una sólida posición al cruzar la meta entre los 14 primeros.' },
    habilidad_2: { nombre: 'Ministro de Defensa', puntos: 8, descripcion: 'Resiste el ataque de un rival con DRS abierto durante 3 vueltas consecutivas sin ser adelantado.' },
    penalizacion: { nombre: 'Desastre en Qualy', puntos: -6, descripcion: 'No logra superar el corte y cae eliminado en la primera sesión de clasificación (Q1).' }
  },
  { 
    id: 'bottas_t1', numero: 77, nombre: 'Valtteri Bottas', equipo: 'Cadillac', tier: 1, precio: 10.0, 
    imagen: '/Pilotos/bottas.png',
    descripcion: 'El finlandés regresa a la parrilla junto a "Checo" para formar una alineación llena de sabiduría y velocidad en el debut de Cadillac. Aportará toda la cultura de trabajo que aprendió en sus años gloriosos.',
    habilidad_1: { nombre: 'Leñador', puntos: 7, descripcion: 'Exprime el coche a una vuelta y se clasifica entre las 12 primeras posiciones de la parrilla.' }
  },
  { 
    id: 'bottas_t2', numero: 77, nombre: 'Valtteri Bottas', equipo: 'Cadillac', tier: 2, precio: 20.0, 
    imagen: '/Pilotos/bottas.png',
    descripcion: 'El finlandés regresa a la parrilla junto a "Checo" para formar una alineación llena de sabiduría y velocidad en el debut de Cadillac. Aportará toda la cultura de trabajo que aprendió en sus años gloriosos.',
    habilidad_1: { nombre: 'Leñador', puntos: 7, descripcion: 'Exprime el coche a una vuelta y se clasifica entre las 12 primeras posiciones de la parrilla.' },
    habilidad_2: { nombre: 'Sanción Fantasma', puntos: 4, descripcion: 'Completa todo el Gran Premio sin ser investigado ni recibir penalizaciones de la FIA.' }, // Bastante fácil para Bottas
    penalizacion: { nombre: 'Sin Rebufo', puntos: -4, descripcion: 'Marca una de las 3 velocidades máximas más bajas en la trampa de velocidad (Speed Trap) de la carrera.' }
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
