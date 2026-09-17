# Instagram Relations Viewer

Aplicación web local para revisar tus seguidores, las cuentas que sigues y las cuentas que no te siguen de vuelta.

La aplicación procesa el archivo directamente en el navegador. Tus datos no se suben a ningún servidor.

## 1. Exportar la información desde Instagram

Puedes solicitar la descarga desde Instagram en un navegador o desde la aplicación móvil.

1. Abre Instagram e inicia sesión.
2. Entra en tu perfil y abre el menú.
3. Ve a **Centro de cuentas**.
4. Selecciona **Tu información y permisos**.
5. Entra en **Descargar tu información**.
6. Pulsa **Descargar o transferir información** y selecciona la cuenta de Instagram correspondiente.
7. Elige **Parte de tu información**.
8. Selecciona únicamente **Seguidores y seguidos**.
   - No selecciones mensajes, fotos, vídeos, comentarios ni otras categorías.
   - Esto genera un archivo mucho más pequeño y acelera la carga.
9. Elige **Descargar en el dispositivo**.
10. En formato de información, selecciona **JSON**.
11. En intervalo de fechas, selecciona **Todo el tiempo**.
   - Es importante usar todo el historial disponible para que la comparación sea completa.
12. Confirma la solicitud y espera a que Instagram prepare el archivo.
13. Descarga el archivo `.zip` cuando Instagram lo deje disponible.

> No descomprimas ni edites el archivo. La aplicación lee directamente el ZIP descargado.

## 2. Usar la aplicación

1. Inicia la aplicación:

   ```bash
   npm install
   npm run dev
   ```

2. Abre la dirección que muestra Vite, normalmente `http://localhost:5173/`.
3. Arrastra el archivo `.zip` de Instagram al área de carga o pulsa sobre ella para seleccionarlo.
4. Espera a que termine la lectura.

La aplicación busca dentro del ZIP estos archivos:

- `followers_*.json`: lista de seguidores.
- `following.json`: lista de cuentas que sigues.

## 3. Consultar los resultados

La aplicación muestra tres indicadores:

- **Seguidores**: cuentas que te siguen.
- **Siguiendo**: cuentas que sigues.
- **No te siguen**: cuentas que sigues pero que no aparecen en tu lista de seguidores.

Cada lista se muestra en un panel que puedes contraer. Los usuarios aparecen en grupos de 100, organizados en 5 columnas en pantallas grandes. Puedes usar los botones **Anterior** y **Siguiente** para cambiar de grupo.

Al pulsar un usuario se abre su perfil de Instagram en una pestaña nueva.

## 4. Requisitos

- Node.js 18 o superior.
- npm.
- Un archivo de exportación de Instagram en formato JSON.

## Comandos disponibles

```bash
npm install       # Instala las dependencias
npm run dev       # Inicia el servidor de desarrollo
npm run lint      # Comprueba el código
npm run build     # Genera la versión de producción
```

## Privacidad

El ZIP se lee en el navegador usando procesamiento local. La aplicación no envía el archivo ni los nombres de usuario a un servidor propio.
