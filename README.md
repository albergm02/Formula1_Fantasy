# 🏎️ F1 Fantasy

Plataforma web interactiva tipo *Fantasy* basada en el campeonato de Fórmula 1:
crea tu equipo, compite y sigue las puntuaciones con datos reales de cada carrera.
Proyecto de Fin de Grado de Ingeniería Informática.

**Creado por:** Alberto García Martín

> 📸 _(Añade aquí una captura o un GIF de la app en funcionamiento)_

🔗 **Producción:** https://formula1-fantasy-ba348.web.app/

---

## Guía de instalación y comandos

Este manual explica cómo instalar las dependencias y los comandos necesarios para
la correcta compilación y ejecución de la aplicación.

---

## Requisitos previos

Instalar una sola vez:

- **Node.js 22 LTS** → https://nodejs.org (para el frontend y las Cloud Functions)
- **npm** → incluido con Node.js
- **Firebase CLI** → necesario para los emuladores y el despliegue. Instalar con:

```sh
  npm install -g firebase-tools
```

---

## Contenido del paquete

El paquete del proyecto contiene:

- Todo el codigo fuente (raiz y `functions/`).
- `package.json` y `package-lock.json` (raiz del proyecto).
- `functions/package.json` y `functions/package-lock.json`.
- Sin `node_modules/` (se instalan con los comandos siguientes).
- Sin `dist/` (se genera al compilar).

---

## Instalacion de dependencias

Desde la raiz del proyecto:

1. Instalar dependencias del frontend:

```sh
npm install
```

2. Instalar dependencias de Cloud Functions:

```sh
cd functions
npm install
cd ..
```

Tras estos comandos, se habran instalado correctamente todas las dependencias y se procedera a compilar y ejecutar la aplicacion sin errores.

---

## Comandos disponibles

### Servidor de desarrollo local

```sh
npm run dev
```

Arranca Vite en `localhost:5173` para procesos de desarrollo. Util para cambios locales de interfaces o estado.

### Compilar para produccion

```sh
npm run build
```

Vite build genera la carpeta `dist/` con el frontend compilado y minificado.

### Ejecutar tests

```sh
npm run test
```

Vitest run ejecuta los tests ubicados en `tests/`.

### Formatear codigo

```sh
npm run format
```

Prettier formatea los archivos de `src/`.

---

## Despliegue en Firebase

### Autenticarse en Firebase (solo la primera vez)

```sh
firebase login
```

Abre el navegador para iniciar sesion con la cuenta de Google del proyecto.

### Desplegar frontend y Cloud Functions

```sh
firebase deploy --only functions,hosting
```

### Comando compacto de puesta en produccion

```sh
npm run build; firebase deploy --only functions,hosting
```

Una vez desplegado, se puede comprobar la ultima version en produccion:

https://formula1-fantasy-ba348.web.app/