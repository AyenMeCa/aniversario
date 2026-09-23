# Prompt para Codex — Sprite sheet animado de Tiana (idle, sin líneas de patrón)

Adjunto una imagen de referencia de Tiana (piel morena, cabello oscuro recogido con una
coronita de hojas/flores verdes, mejillas sonrojadas, vestido verde con detalles claros).
**Ojo:** esa imagen es un patrón de cuentas/perlas (bead pattern) pensado para tejer a mano,
no un sprite — tiene una grilla de líneas negras finas superpuesta, números de fila/columna
en los bordes, y un fondo cuadriculado color amarillo/beige que representa "acá no va
ninguna cuenta" (no es parte del personaje).

Quiero que uses esa imagen solo como **guía de color y forma** — qué píxel va de qué color y
dónde — pero generes un pixel art limpio:

- **Sin la grilla de líneas negras finas** que separa cada celda del patrón (esas líneas no
  son parte del dibujo, son una ayuda para tejer).
- **Sin los números de fila/columna** de los bordes.
- **Sin el fondo amarillo/beige cuadriculado** — ese color no es parte de Tiana, hay que
  reemplazarlo por transparencia real.
- El contorno negro que sí es parte del dibujo (el que perfila la silueta del pelo, la cara,
  el vestido) se mantiene — la diferencia es que ese contorno tiene trazo grueso e
  intencional, mientras que las líneas de grilla que hay que sacar son finitas y parejas,
  cubriendo toda la imagen en un patrón regular.
- Mantené fielmente los colores y la forma general del diseño de la referencia (paleta de
  piel, verdes del vestido y la corona, rosa de las mejillas, blanco de los ojos).

Esto no es una sola imagen suelta: es la base para un **sprite sheet de animación "idle"**
(parada quieta, sin caminar), con el mismo criterio que ya usamos para otros personajes del
juego.

## Animación pedida

Tiana está parada sin moverse, pero **respira de forma sutil**: los hombros y el pecho suben
y bajan levemente, como alguien parado tranquilo. Es un loop de 4 frames:

1. **Frame 1** — pose de reposo (igual a la referencia).
2. **Frame 2** — inhalando: hombros y pecho suben un poco (1-2 píxeles), apenas perceptible.
3. **Frame 3** — punto más alto de la inhalación (el pecho/hombros en su posición más
   elevada de las 4).
4. **Frame 4** — exhalando, bajando hacia la posición de reposo (a mitad de camino entre el
   frame 3 y el frame 1, para que el loop cierre sin salto).

Es una animación **sutil, no exagerada** — el movimiento tiene que ser chico: se nota que el
personaje está "vivo" sin que parezca que está saltando. El resto del personaje (cara, pelo,
corona, vestido, posición de los pies) se mantiene **exactamente igual, píxel por píxel**, en
los 4 frames — lo único que se mueve es la zona de hombros/pecho.

- **Ancla fija obligatoria:** Tiana apoya sobre la misma línea de piso, en el mismo punto x/y
  exacto, en los 4 frames — pies y contorno del cuerpo **no se mueven ni un solo píxel** de
  un frame a otro salvo la zona de hombros/pecho descrita arriba.
- **Sprite sheet horizontal:** los 4 frames en fila, todos del mismo tamaño exacto de celda.

## Reglas técnicas (no negociables)

- **Grilla de 16 píxeles.** El resultado tiene que ocupar un tamaño múltiplo exacto de 16x16.
- **Fondo con transparencia REAL de canal alfa (RGBA)**, no un cuadriculado de color pintado
  como si fuera transparencia. El archivo tiene que ser un PNG de 32 bits con canal alfa
  donde el fondo tenga alpha=0 de verdad en los datos, no solo una vista previa.
- **Sin antialiasing ni gradientes suaves** — bordes duros, pixel a pixel, colores planos por
  zona (no degradé). El renderer del juego usa nearest-neighbor, así que cualquier suavizado
  se ve como un halo de colores raros.
- **Sin texto, sin marca de agua, sin números, sin fondo escénico** — solo el personaje.

## Contexto del proyecto (por qué importan estas reglas)

Es un asset para un juego 2D top-down hecho con Kaplay.js, donde todo el arte está en grilla
perfecta de 16px con transparencia real. Con los personajes anteriores (un sapo, un chico y
una criatura voladora) tuvimos siempre el mismo problema: el archivo entregado no tenía
transparencia real (era un PNG de 24 bits con un cuadriculado de color pintado a mano en vez
de alfa) y las dimensiones no eran múltiplo de 16. Evitalo de entrada esta vez.
