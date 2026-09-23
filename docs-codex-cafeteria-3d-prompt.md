# Prompt para Codex — "La Cafetería" en vista 3/4 (estilo Pokémon Gen 3)

Adjunto imágenes de referencia (edificios de Pokémon Rojo Fuego/Esmeralda). Copiá de ellas
**el ángulo de cámara, el nivel de detalle y el volumen**, no los colores exactos ni los
diseños. Es un restaurante/cafetería al aire libre, de tamaño mediano.

## 1. Ángulo de cámara (lo más importante)

Vista **3/4 desde arriba** (como los edificios de las referencias), NO una fachada plana:

- El **techo se ve de arriba** y ocupa aprox. **la mitad de la altura total** del sprite.
  Tiene volumen: un borde/alero más claro, una cara más oscura y una sombra bajo el alero.
- Debajo del techo se ve **solo la pared frontal** (puerta, ventanas, toldo). Las paredes
  laterales NO se ven.
- Nada de perspectiva desde abajo ni fachada "de frente" sin techo visible.

## 2. Nivel de detalle (regla de la grilla de 16px)

La versión anterior tenía demasiados píxeles finos y no respetaba la grilla. Esta vez:

- **Todo el arte se diseña sobre una grilla de 16x16 px.** Cada elemento (ventana, puerta,
  teja, toldo) tiene que ocupar **múltiplos de 8 px**, no detalles de 1-2 px.
- Referencia de escala: una ventana ≈ 16x16 px, una puerta ≈ 16x32 px, una línea de tejas
  ≈ 8 px de alto. Si un detalle mide menos de 4 px, **quitalo o simplificalo**.
- Pocos colores por superficie: **3 tonos por material** (claro / medio / oscuro) + un
  contorno oscuro de 1 px. Sin texturas ruidosas, sin dithering, sin degradés.
- Formas grandes y legibles a simple vista, como en las referencias.

## 3. Piezas (archivos separados)

1. **Edificio**: **8 tiles de ancho x 6 de alto = 128x96 px**. Techo (~48 px) + pared
   frontal con puerta central, 2 ventanas y un toldo sobre la entrada.
2. **Mesa con sillas** (vista 3/4, se ve la parte de arriba de la mesa): **2x2 tiles =
   32x32 px**. Mesa redonda con 2 sillas.
3. **Mesa con sombrilla**: **2x2 tiles = 32x32 px**. Misma vista, con la sombrilla vista de
   arriba.

Cada pieza es un PNG propio, con el objeto apoyado en la parte inferior de la imagen.

## 4. Paleta

Tonos tierra cálidos, saturación media-baja (madera tostada a chocolate, techo terracota o
teja marrón, paredes crema). Pasto del juego ≈ #3f8f46: evitá verdes parecidos en el
edificio. Sin neón, sin colores saturados.

## 5. Reglas técnicas (no negociables)

- Dimensiones exactas: múltiplos de 16 en ancho y alto (tamaños de arriba).
- **PNG RGBA de 32 bits con alfa=0 REAL en el fondo**, no un cuadriculado pintado ni un
  color sólido.
- **Sin antialiasing**, bordes duros, píxel a píxel.
- Sin texto, sin marca de agua, sin fondo ni pasto: solo el objeto.

## Contexto

Es un asset para un juego 2D con Kaplay.js en vista cenital. Los personajes miden ~29 px de
alto, así que el edificio (96 px de alto) tiene que verse claramente más grande que ellos
pero con detalles simples. Los assets anteriores fallaron por: fachada plana sin techo
visible, exceso de detalle fino, fondo sin transparencia real y medidas no múltiplo de 16.
