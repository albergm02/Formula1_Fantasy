export const perfilesPuntuacion = {
  clasificador: {
    clave: 'clasificador',
    nombre: 'Clasificador',
    descripcion: 'Puntua mejor en clasificacion que en carrera.',
    reglasUsuario: [
      '+12 si clasifica en Top 10.',
      '+6 extra si entra en Q3.',
      '-4 si cae en Q1.'
    ],
    puntuacion: {
      top10Qualy: 12,
      q3: 6,
      eliminadoQ1: -4
    }
  },
  carrera: {
    clave: 'carrera',
    nombre: 'Carrera',
    descripcion: 'Puntua por resultado final y remontada.',
    reglasUsuario: [
      '+2 por cada posicion ganada en carrera.',
      '+10 si termina en Top 5.',
      '-8 si abandona (DNF).'
    ],
    puntuacion: {
      posicionGanadaCarrera: 2,
      top5Final: 10,
      dnf: -8
    }
  },
  lluvia: {
    clave: 'lluvia',
    nombre: 'Lluvia',
    descripcion: 'Usa reglas de Carrera y activa multiplicador con lluvia.',
    reglasUsuario: [
      'Usa las mismas reglas de la variante Carrera.',
      'Si hay lluvia (>= 5 vueltas mojadas), aplica x1.5 al total.',
      'Si no hay lluvia, se queda en x1.0.'
    ],
    puntuacion: {
      posicionGanadaCarrera: 2,
      top5Final: 10,
      dnf: -8,
      multiplicadorLluvia: 1.5
    }
  }
};

// prettier-ignore
const pilotosBase = [
  { idBase: 'norris', numero: 1, nombre: 'Lando Norris', equipo: 'McLaren', precioBase: 26.0, imagen: '/Pilotos/norris.webp' },
  { idBase: 'piastri', numero: 81, nombre: 'Oscar Piastri', equipo: 'McLaren', precioBase: 24.0, imagen: '/Pilotos/piastri.webp' },
  { idBase: 'verstappen', numero: 3, nombre: 'Max Verstappen', equipo: 'Red Bull', precioBase: 25.0, imagen: '/Pilotos/verstappen.webp' },
  { idBase: 'hadjar', numero: 6, nombre: 'Isack Hadjar', equipo: 'Red Bull', precioBase: 15.0, imagen: '/Pilotos/hadjar.webp' },
  { idBase: 'leclerc', numero: 16, nombre: 'Charles Leclerc', equipo: 'Ferrari', precioBase: 24.0, imagen: '/Pilotos/leclerc.webp' },
  { idBase: 'hamilton', numero: 44, nombre: 'Lewis Hamilton', equipo: 'Ferrari', precioBase: 23.0, imagen: '/Pilotos/hamilton.webp' },
  { idBase: 'russell', numero: 63, nombre: 'George Russell', equipo: 'Mercedes', precioBase: 22.0, imagen: '/Pilotos/russell.webp' },
  { idBase: 'antonelli', numero: 12, nombre: 'Kimi Antonelli', equipo: 'Mercedes', precioBase: 20.0, imagen: '/Pilotos/antonelli.webp' },
  { idBase: 'alonso', numero: 14, nombre: 'Fernando Alonso', equipo: 'Aston Martin', precioBase: 19.0, imagen: '/Pilotos/alonso.webp' },
  { idBase: 'stroll', numero: 18, nombre: 'Lance Stroll', equipo: 'Aston Martin', precioBase: 13.0, imagen: '/Pilotos/stroll.webp' },
  { idBase: 'sainz', numero: 55, nombre: 'Carlos Sainz', equipo: 'Williams', precioBase: 17.0, imagen: '/Pilotos/sainz.webp' },
  { idBase: 'albon', numero: 23, nombre: 'Alexander Albon', equipo: 'Williams', precioBase: 15.0, imagen: '/Pilotos/albon.webp' },
  { idBase: 'ocon', numero: 31, nombre: 'Esteban Ocon', equipo: 'Haas', precioBase: 14.0, imagen: '/Pilotos/ocon.webp' },
  { idBase: 'bearman', numero: 87, nombre: 'Oliver Bearman', equipo: 'Haas', precioBase: 13.0, imagen: '/Pilotos/bearman.webp' },
  { idBase: 'hulkenberg', numero: 27, nombre: 'Nico Hulkenberg', equipo: 'Audi', precioBase: 13.0, imagen: '/Pilotos/hulkenberg.webp' },
  { idBase: 'bortoleto', numero: 5, nombre: 'Gabriel Bortoleto', equipo: 'Audi', precioBase: 12.0, imagen: '/Pilotos/bortoleto.webp' },
  { idBase: 'gasly', numero: 10, nombre: 'Pierre Gasly', equipo: 'Alpine', precioBase: 13.0, imagen: '/Pilotos/gasly.webp' },
  { idBase: 'colapinto', numero: 43, nombre: 'Franco Colapinto', equipo: 'Alpine', precioBase: 14.0, imagen: '/Pilotos/colapinto.webp' },
  { idBase: 'lawson', numero: 30, nombre: 'Liam Lawson', equipo: 'Racing Bulls', precioBase: 12.0, imagen: '/Pilotos/lawson.webp' },
  { idBase: 'lindblad', numero: 41, nombre: 'Arvid Lindblad', equipo: 'Racing Bulls', precioBase: 11.0, imagen: '/Pilotos/lindblad.webp' },
  { idBase: 'perez', numero: 11, nombre: 'Sergio Perez', equipo: 'Cadillac', precioBase: 11.0, imagen: '/Pilotos/perez.webp' },
  { idBase: 'bottas', numero: 77, nombre: 'Valtteri Bottas', equipo: 'Cadillac', precioBase: 10.0, imagen: '/Pilotos/bottas.webp' }
];

const configuracionVariantesPiloto = [
  {
    variante: 'clasificador',
    perfilPuntuacion: 'clasificador',
    tier: 1,
    incrementoPrecio: 0,
    nombreHabilidad: 'Puntos de Clasificacion'
  },
  {
    variante: 'carrera',
    perfilPuntuacion: 'carrera',
    tier: 2,
    incrementoPrecio: 1.5,
    nombreHabilidad: 'Puntos de Carrera'
  },
  {
    variante: 'lluvia',
    perfilPuntuacion: 'lluvia',
    tier: 2,
    incrementoPrecio: 3,
    nombreHabilidad: 'Puntos de Lluvia'
  }
];

function construirHabilidadesSegunPerfil(clavePerfil, nombreHabilidad) {
  const perfil = perfilesPuntuacion[clavePerfil];

  return {
    habilidad_1: {
      nombre: nombreHabilidad,
      puntos: 12,
      descripcion: perfil.reglasUsuario[0]
    },
    habilidad_2: {
      nombre: 'Regla Extra',
      puntos: 6,
      descripcion: perfil.reglasUsuario[1]
    },
    penalizacion: {
      nombre: 'Penalizacion',
      puntos: -4,
      descripcion: perfil.reglasUsuario[2]
    }
  };
}

function construirCartaPiloto(pilotoBase, varianteConfig) {
  const precio = Number((pilotoBase.precioBase + varianteConfig.incrementoPrecio).toFixed(1));
  const habilidades = construirHabilidadesSegunPerfil(variantaConfigSegura(varianteConfig.perfilPuntuacion), varianteConfig.nombreHabilidad);

  return {
    id: `${pilotoBase.idBase}_${varianteConfig.variante}`,
    numero: pilotoBase.numero,
    nombre: pilotoBase.nombre,
    equipo: pilotoBase.equipo,
    tier: varianteConfig.tier,
    precio,
    imagen: pilotoBase.imagen,
    tipoCarta: 'piloto',
    variante: varianteConfig.variante,
    perfilPuntuacion: varianteConfig.perfilPuntuacion,
    reglasUsuario: perfilesPuntuacion[varianteConfig.perfilPuntuacion].reglasUsuario,
    ...habilidades
  };
}

function variantaConfigSegura(perfilPuntuacion) {
  return perfilesPuntuacion[perfilPuntuacion] ? perfilPuntuacion : 'carrera';
}

export const mercadoPilotos = pilotosBase.flatMap(pilotoBase =>
  configuracionVariantesPiloto.map(varianteConfig => construirCartaPiloto(pilotoBase, varianteConfig))
);

export const mercadoPilotosConPerfiles = mercadoPilotos;
export const mercadoPilotosVariantes = mercadoPilotos;

export const mercadoPotenciadores = [
  { id: 'aleron_delantero', nombre: 'Ala Delantera', precio: 5.0, puntos: 50, imagen: '/Potenciadores/Alerón_Delantero.png', tipoCarta: 'potenciador', perfilPuntuacion: 'potenciador_base_v1' },
  { id: 'aleron_trasero', nombre: 'Ala Trasera', precio: 5.0, puntos: 50, imagen: '/Potenciadores/Alerón_Trasero.png', tipoCarta: 'potenciador', perfilPuntuacion: 'potenciador_base_v1' },
  { id: 'bateria', nombre: 'Bateria', precio: 5.0, puntos: 50, imagen: '/Potenciadores/Batería.png', tipoCarta: 'potenciador', perfilPuntuacion: 'potenciador_base_v1' },
  { id: 'caja_de_cambios', nombre: 'Caja de Cambios', precio: 5.0, puntos: 50, imagen: '/Potenciadores/Caja_de_Cambios.png', tipoCarta: 'potenciador', perfilPuntuacion: 'potenciador_base_v1' },
  { id: 'chasis', nombre: 'Chasis', precio: 5.0, puntos: 50, imagen: '/Potenciadores/Chasis.png', tipoCarta: 'potenciador', perfilPuntuacion: 'potenciador_base_v1' },
  { id: 'difusor', nombre: 'Difusor', precio: 5.0, puntos: 50, imagen: '/Potenciadores/Difusor.png', tipoCarta: 'potenciador', perfilPuntuacion: 'potenciador_base_v1' },
  { id: 'discos_de_frenos', nombre: 'Discos de Frenos', precio: 5.0, puntos: 50, imagen: '/Potenciadores/Discos_de_Frenos.png', tipoCarta: 'potenciador', perfilPuntuacion: 'potenciador_base_v1' },
  { id: 'mgu_k', nombre: 'MGU-K', precio: 5.0, puntos: 50, imagen: '/Potenciadores/MGU-K.png', tipoCarta: 'potenciador', perfilPuntuacion: 'potenciador_base_v1' },
  { id: 'motor_v6', nombre: 'Motor V6', precio: 5.0, puntos: 50, imagen: '/Potenciadores/Motor V6.png', tipoCarta: 'potenciador', perfilPuntuacion: 'potenciador_base_v1' },
  { id: 'pontones', nombre: 'Pontones', precio: 5.0, puntos: 50, imagen: '/Potenciadores/Pontones.png', tipoCarta: 'potenciador', perfilPuntuacion: 'potenciador_base_v1' },
  { id: 'suspension', nombre: 'Suspension', precio: 5.0, puntos: 50, imagen: '/Potenciadores/Suspensión.png', tipoCarta: 'potenciador', perfilPuntuacion: 'potenciador_base_v1' },
  { id: 'tubo_de_escape', nombre: 'Tubo de Escape', precio: 5.0, puntos: 50, imagen: '/Potenciadores/Tubo_de_Escape.png', tipoCarta: 'potenciador', perfilPuntuacion: 'potenciador_base_v1' },
  { id: 'turbocompresor', nombre: 'Compresor', precio: 5.0, puntos: 50, imagen: '/Potenciadores/Turbocompresor.png', tipoCarta: 'potenciador', perfilPuntuacion: 'potenciador_base_v1' },
  { id: 'volante', nombre: 'Volante', precio: 5.0, puntos: 50, imagen: '/Potenciadores/Volante.png', tipoCarta: 'potenciador', perfilPuntuacion: 'potenciador_base_v1' }
];

export const mercadoCoches = [
  {
    id: 'aston_martin',
    nombre: 'Aston Martin Aramco',
    precio: 20.0,
    puntos: 200,
    imagen: '/Coches/astonmartin.webp',
    tipoCarta: 'coche',
    perfilPuntuacion: 'coche_base_v1',
    habilidad: { nombre: 'Sinergia de Equipo', puntos: 20, descripcion: 'Bono si alineas pilotos Aston Martin.' }
  },
  {
    id: 'audi',
    nombre: 'Audi Revolut F1',
    precio: 20.0,
    puntos: 200,
    imagen: '/Coches/audi.webp',
    tipoCarta: 'coche',
    perfilPuntuacion: 'coche_base_v1',
    habilidad: { nombre: 'Sinergia de Equipo', puntos: 20, descripcion: 'Bono si alineas pilotos Audi.' }
  },
  {
    id: 'cadillac',
    nombre: 'Cadillac F1',
    precio: 20.0,
    puntos: 200,
    imagen: '/Coches/cadillac.webp',
    tipoCarta: 'coche',
    perfilPuntuacion: 'coche_base_v1',
    habilidad: { nombre: 'Sinergia de Equipo', puntos: 20, descripcion: 'Bono si alineas pilotos Cadillac.' }
  },
  {
    id: 'ferrari',
    nombre: 'Ferrari',
    precio: 20.0,
    puntos: 200,
    imagen: '/Coches/ferrari.webp',
    tipoCarta: 'coche',
    perfilPuntuacion: 'coche_base_v1',
    habilidad: { nombre: 'Sinergia de Equipo', puntos: 20, descripcion: 'Bono si alineas pilotos Ferrari.' }
  },
  {
    id: 'haas',
    nombre: 'TGR Haas F1',
    precio: 20.0,
    puntos: 200,
    imagen: '/Coches/haas.webp',
    tipoCarta: 'coche',
    perfilPuntuacion: 'coche_base_v1',
    habilidad: { nombre: 'Sinergia de Equipo', puntos: 20, descripcion: 'Bono si alineas pilotos Haas.' }
  },
  {
    id: 'mclaren',
    nombre: 'McLaren Mastercard',
    precio: 20.0,
    puntos: 200,
    imagen: '/Coches/mclaren.webp',
    tipoCarta: 'coche',
    perfilPuntuacion: 'coche_base_v1',
    habilidad: { nombre: 'Sinergia de Equipo', puntos: 20, descripcion: 'Bono si alineas pilotos McLaren.' }
  },
  {
    id: 'mercedes',
    nombre: 'Mercedes-AMG',
    precio: 20.0,
    puntos: 200,
    imagen: '/Coches/mercedes.webp',
    tipoCarta: 'coche',
    perfilPuntuacion: 'coche_base_v1',
    habilidad: { nombre: 'Sinergia de Equipo', puntos: 20, descripcion: 'Bono si alineas pilotos Mercedes.' }
  },
  {
    id: 'racing_bulls',
    nombre: 'Racing Bulls VCARB',
    precio: 20.0,
    puntos: 200,
    imagen: '/Coches/racingbulls.webp',
    tipoCarta: 'coche',
    perfilPuntuacion: 'coche_base_v1',
    habilidad: { nombre: 'Sinergia de Equipo', puntos: 20, descripcion: 'Bono si alineas pilotos Racing Bulls.' }
  },
  {
    id: 'red_bull',
    nombre: 'Red Bull Racing',
    precio: 20.0,
    puntos: 200,
    imagen: '/Coches/redbull.webp',
    tipoCarta: 'coche',
    perfilPuntuacion: 'coche_base_v1',
    habilidad: { nombre: 'Sinergia de Equipo', puntos: 20, descripcion: 'Bono si alineas pilotos Red Bull.' }
  },
  {
    id: 'williams',
    nombre: 'Atlassian Williams',
    precio: 20.0,
    puntos: 200,
    imagen: '/Coches/williams.webp',
    tipoCarta: 'coche',
    perfilPuntuacion: 'coche_base_v1',
    habilidad: { nombre: 'Sinergia de Equipo', puntos: 20, descripcion: 'Bono si alineas pilotos Williams.' }
  }
];

export const mercadoPotenciadoresConPerfiles = mercadoPotenciadores;
export const mercadoCochesConPerfiles = mercadoCoches;

export const resumenMercadoVariantes = {
  pilotosBase: pilotosBase.length,
  variantesPorPiloto: configuracionVariantesPiloto.length,
  pilotosConVariantes: mercadoPilotos.length,
  potenciadores: mercadoPotenciadores.length,
  coches: mercadoCoches.length,
  totalCartasConVariantes: mercadoPilotos.length + mercadoPotenciadores.length + mercadoCoches.length
};
