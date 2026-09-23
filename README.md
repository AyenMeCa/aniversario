# Nuestro Camino 🎮

Juego pixelado estilo Pokémon clásico (vista cenital, mapa en grilla) hecho
como regalo de aniversario. El jugador camina desde el "Punto A" hasta el
"Punto B", y en el camino hay paradas que muestran recuerdos/curiosidades
de la pareja.

## Tecnología

- [KAPLAY](https://kaplayjs.com/) (librería JS para juegos 2D), sin build
  step ni npm: se carga directo desde un CDN en `index.html`.
- HTML + JS planos, listos para GitHub Pages.

## Cómo correrlo en tu compu

KAPLAY necesita que el juego se sirva por HTTP (no sirve abrir el
`index.html` haciendo doble clic). La forma más simple:

```bash
python -m http.server 8080
```

y después abrís http://localhost:8080 en el navegador.

(Si no tenés Python, alcanza cualquier servidor estático: `npx serve`, la
extensión "Live Server" de VS Code, etc.)

## Estructura del proyecto

```
index.html          # carga KAPLAY + arranca el juego
src/main.js          # toda la lógica del juego (mapa, movimiento, diálogos)
src/timeline.js       # ACÁ VA LA HISTORIA REAL: las curiosidades y el mensaje final
assets/               # sprites/tileset (ver assets/README.md)
```

## Cómo cargar la historia real

Abrí [`src/timeline.js`](src/timeline.js) y completá:

- `TIMELINE`: un array de paradas (cómo se conocieron, la primera cita,
  anécdotas, etc.). El juego reparte automáticamente las paradas a lo largo
  del camino — podés agregar o sacar entradas sin tocar el resto del código.
- `ENDING`: el mensaje final que se muestra al llegar al Punto B.
- `TITLE_SCREEN`: el título y subtítulo de la pantalla de inicio.

## Cómo poner el arte pixelado real

Por ahora el mapa y el personaje se dibujan con rectángulos de color para
poder probar el juego ya mismo. Ver [`assets/README.md`](assets/README.md)
para los packs gratuitos recomendados y cómo conectarlos.

## Controles

El progreso se guarda automÃ¡ticamente en el almacenamiento local del navegador
cada vez que se consigue un fragmento. Al volver a abrir el juego en el mismo
navegador y desde el mismo sitio, los fragmentos recogidos se restauran solos.
No se guarda en la cachÃ© de archivos: esa cachÃ© solo sirve para cargar el juego
mÃ¡s rÃ¡pido y puede borrarse sin afectar el progreso.

- Flechas o WASD para moverse
- Espacio para avanzar/cerrar los diálogos

## Cómo publicarlo gratis en GitHub Pages

1. Creá un repositorio nuevo en GitHub (puede ser privado o público).
2. Subí este proyecto:
   ```bash
   git remote add origin <URL-del-repo>
   git branch -M main
   git push -u origin main
   ```
3. En GitHub: **Settings → Pages → Source**, elegí la rama `main` y la
   carpeta `/ (root)`.
4. Esperá un minuto y el juego va a quedar publicado en
   `https://<tu-usuario>.github.io/<nombre-del-repo>/`.

Cada vez que quieras actualizar el juego (agregar una curiosidad, cambiar
arte, etc.), simplemente hacé `git push` de nuevo y GitHub Pages se
actualiza solo.
