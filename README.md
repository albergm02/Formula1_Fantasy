# F1 Fantasy - Guia de instalacion y comandos

Creado por: Alberto Garcia Martin - Proyecto de Fin de Grado de Ingenieria Informatica.

El siguiente manual muestra como instalar las dependencias y los comandos necesarios para la correcta compilacion y ejecucion de la aplicacion.

---

## Requisitos previos

Instalar una sola vez:

- **Node.js 22 LTS** -> https://nodejs.org (para frontend y Cloud Functions)
- **npm** -> incluido con Node.js
- **Firebase CLI** -> necesario para emuladores y despliegue. Instalar con:

```sh
npm install -g firebase-tools
```

- **Cuenta de Google + Proyecto Firebase** -> el archivo `.env.local` viene incluido en el paquete, ya rellenado con las credenciales de Firebase. Este archivo es delicado y esta estrictamente prohibido compartirlo, ya que contiene datos secretos de la aplicacion web.

---

## Contenido del paquete

El paquete del proyecto contiene:

- Todo el codigo fuente (raiz y `functions/`).
- `.env.local`: credenciales de Firebase ya rellenadas.
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