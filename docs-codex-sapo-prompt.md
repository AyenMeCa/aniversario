# Prompt para Codex — Sprite sheet animado del sapo (idle)

Adjunto una imagen de referencia de un sapo en pixel art (vista de 3/4 lateral, sentado,
verde con panza color crema, contorno negro grueso). Quiero que generes un **sprite sheet
de animación "idle" (quieto, sin caminar)** basado en ese diseño, respetando su forma,
proporciones, paleta de colores y grosor de contorno.

## Animación pedida

El sapo está parado/sentado sin moverse, pero **respira**: la garganta/papada (la zona
blanca-crema del pecho) se infla y desinfla, como hacen los sapos reales al respirar. Es un
loop de 4 frames:

1. **Frame 1** — papada en reposo (tamaño normal, igual a la referencia).
2. **Frame 2** — papada empezando a inflarse (claramente más grande que el frame 1).
3. **Frame 3** — papada en el punto máximo de inflado (la más grande de las 4, tiene que
   notarse a simple vista comparado con el frame 1 sin necesidad de mirar con lupa).
4. **Frame 4** — papada desinflándose, volviendo hacia el tamaño normal (a mitad de camino
   entre el frame 3 y el frame 1, para que el loop cierre sin salto).

**La diferencia de tamaño entre el frame 1 (mínimo) y el frame 3 (máximo) tiene que ser
grande y obvia** — pensalo como si la papada creciera un 30-40% de su tamaño en reposo, no
un cambio sutil de un par de píxeles. Si al poner los 4 frames uno al lado del otro cuesta
notar cuál es cuál, la diferencia es insuficiente.

El resto del cuerpo (ojos, patas, postura, sombras) se mantiene **exactamente igual, píxel
por píxel**, en los 4 frames — el único elemento que cambia de tamaño es la papada. Nada más
se mueve, crece, ni se desplaza.

## Reglas técnicas (no negociables)

- **Grilla de 16 píxeles.** El sprite del sapo tiene que ocupar un tamaño múltiplo exacto de
  16x16 (recomendado: 32x32 px por frame, es decir 2x2 tiles, para conservar el nivel de
  detalle de la referencia).
- **Sprite sheet horizontal:** los 4 frames en fila, todos del mismo tamaño exacto de celda.
- **Ancla fija obligatoria:** el sapo tiene que apoyar sobre la misma línea de piso, en el
  mismo punto x/y exacto, en los 4 frames — patas, contorno del cuerpo y sombra en el piso
  **no se mueven ni un solo píxel** de un frame a otro. Ningún elemento se corre hacia arriba,
  abajo, izquierda o derecha entre frames. El único cambio permitido en todo el sprite es el
  tamaño de la papada.
- **Dimensión total de la imagen múltiplo de 16 EXACTO** en ancho y alto (ej: si cada frame
  es 32x32, la imagen final es 128x32 — ni un píxel más ni menos). Los 4 frames tienen que
  medir exactamente lo mismo entre sí, sin margenes desparejos.
- **Fondo con transparencia REAL de canal alfa (RGBA), no un cuadriculado gris/blanco
  dibujado como si fuera transparencia.** El archivo tiene que ser un PNG de 32 bits con
  canal alfa donde el fondo tenga alpha=0. El cuadriculado gris que se suele mostrar en los
  editores es solo una vista previa de "acá no hay nada" — **no hay que dibujarlo**, tiene
  que quedar realmente vacío/transparente en los datos del archivo.
- **Sin antialiasing ni gradientes suaves** — bordes duros, pixel a pixel, colores planos por
  zona con sombras de un tono más oscuro plano (no degradé). El renderer del juego usa
  nearest-neighbor, así que cualquier suavizado se ve como un halo de colores raros.
- **Contorno negro consistente** en los 4 frames, del mismo grosor que la referencia.
- **Paleta de color:** mantené los mismos tonos de la referencia (verdes del cuerpo, crema de
  la panza, negro del contorno) — no reinventar colores nuevos.
- **Sin texto, sin marca de agua, sin fondo escénico** — solo el sapo.

## Corrección respecto al intento anterior

Ya generaste una primera versión de este sprite sheet y tenía dos problemas concretos que
hay que corregir en esta nueva versión:

1. La papada se veía casi idéntica en los 4 frames — no se notaba ninguna respiración. Esta
   vez la diferencia de tamaño entre el frame más chico y el más grande tiene que ser grande
   y obvia (ver sección de animación arriba).
2. El cuerpo del sapo y su sombra se corrían levemente de posición entre frames, generando un
   "tembleque" al reproducir la animación en loop. Esta vez todo excepto la papada tiene que
   quedar exactamente fijo en la misma posición en los 4 frames.
3. El archivo entregado no tenía transparencia real: era un PNG de 24 bits (sin canal alfa)
   con un cuadriculado gris pintado a mano simulando "fondo vacío". Y las dimensiones no eran
   múltiplo de 16 (era 2172x724). Esta vez el archivo tiene que ser PNG de 32 bits (RGBA) con
   transparencia real, y el tamaño total tiene que ser múltiplo exacto de 16 en ancho y alto.

## Contexto del proyecto (por qué importan estas reglas)

Es un asset para un juego 2D top-down hecho con Kaplay.js, donde todo el arte (terreno, agua,
props) está recortado de tilesets en grilla perfecta de 16px y se referencia por fila/columna
en el código. Si el sprite no respeta la grilla o el tamaño exacto por frame, el juego lo
corta mal o lo desalinea al animarlo.
