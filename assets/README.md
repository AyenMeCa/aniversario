# Assets

Estos son los packs de arte pixelado gratuitos recomendados (estilo GB/Pokémon
clásico), del mismo autor para que combinen entre sí:

- **Tileset del mapa**: "GB Studio Overworld Tiles" — The Pixel Nook
  https://the-pixel-nook.itch.io/gb-studio-overworld-tiles-plus
- **Personajes**: "GB Studio Character pack" — The Pixel Nook
  https://the-pixel-nook.itch.io/gb-studio-character-pack

Ambos son gratis ("nombra tu precio", podés poner $0), permiten modificarlos,
y solo piden no revenderlos — un saludo/crédito al autor es un lindo gesto
pero no obligatorio.

## Dónde poner los archivos

- `assets/tiles/` → el PNG del tileset del mapa
- `assets/characters/` → el PNG de personajes

## Cómo conectarlos al juego

Ahora mismo el juego dibuja el mapa y al jugador con rectángulos de color
(ver `COLORS` en `src/main.js`) para poder probarlo sin depender de los
archivos de arte. Para usar los sprites reales:

1. Cargá las imágenes al principio de `src/main.js`, antes de construir el
   mapa:
   ```js
   k.loadSprite("tiles", "/assets/tiles/tu-archivo.png", {
     sliceX: 8, // ajustar según cuántas columnas de 16x16 tiene la imagen
     sliceY: 8,
   });
   k.loadSprite("player", "/assets/characters/tu-archivo.png", {
     sliceX: 4,
     sliceY: 4,
   });
   ```
2. Reemplazá `k.color(...COLORS[type])` por `k.sprite("tiles", { frame: N })`
   usando el frame correspondiente a cada tipo de tile.
3. Reemplazá el `k.color(...COLORS.player)` del jugador por
   `k.sprite("player", { frame: 0 })` y sumale animaciones con
   `k.loadSpriteAtlas` o `anim` si el pack trae ciclos de caminata.

No hace falta hacerlo todo de una — el juego funciona igual de bien con los
colores placeholder mientras se arma el contenido real.
