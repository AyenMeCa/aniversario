# Prompt para Codex — Animar el pixel art limpio de Rapunzel (idle, 4 frames)

Adjunto el pixel art limpio de Rapunzel que generamos en el paso anterior (ya sin grilla, sin
números, sin fondo — solo el personaje con transparencia real). Quiero que a partir de **esa
misma imagen**, sin cambiarle el diseño, la conviertas en un **sprite sheet de animación
"idle" de 4 frames**.

## Animación pedida

Rapunzel está quieta, pero **respira de forma sutil**: los hombros y el pecho suben y bajan
levemente. Es un loop de 4 frames:

1. **Frame 1** — pose de reposo, idéntica a la imagen que adjunto (este frame prácticamente
   no cambia nada respecto al original).
2. **Frame 2** — inhalando: hombros y pecho suben un poco (1-2 píxeles), apenas perceptible.
3. **Frame 3** — punto más alto de la inhalación (el pecho/hombros en su posición más
   elevada de las 4).
4. **Frame 4** — exhalando, bajando hacia la posición de reposo (a mitad de camino entre el
   frame 3 y el frame 1, para que el loop cierre sin salto).

Es una animación **sutil, no exagerada** — el movimiento tiene que ser chico: se nota que el
personaje está "viva" sin que parezca que está saltando. El resto del personaje (cara, pelo,
flores, corpiño, colores, proporciones) se mantiene **exactamente igual, píxel por píxel**,
en los 4 frames — lo único que cambia es la zona de hombros/pecho.

- **No rediseñes ni cambies el estilo, la paleta ni el contorno** — es la misma imagen que
  adjunto, solo con ese movimiento sutil aplicado en 4 variantes.
- **Ancla fija obligatoria:** el cuerpo queda apoyado en el mismo punto x/y exacto en los 4
  frames — nada se corre ni un píxel salvo la zona de hombros/pecho descrita arriba.
- **Sprite sheet horizontal:** los 4 frames en fila, todos del mismo tamaño exacto de celda
  (el mismo tamaño de la imagen original que adjunto, repetido 4 veces).

## Reglas técnicas (no negociables)

- **Grilla de 16 píxeles.** Cada frame tiene que medir un múltiplo exacto de 16x16, y la
  imagen final (los 4 frames en fila) también múltiplo exacto de 16 en ancho y alto — sin
  sobras de píxeles.
- **Fondo con transparencia REAL de canal alfa (RGBA)** en los 4 frames — no un color sólido
  ni un cuadriculado pintado como si fuera transparencia. El archivo tiene que ser un PNG de
  32 bits con canal alfa donde el fondo tenga alpha=0 de verdad en los datos.
- **Sin antialiasing ni gradientes suaves** — bordes duros, pixel a pixel, colores planos por
  zona (no degradé). El renderer del juego usa nearest-neighbor, así que cualquier suavizado
  se ve como un halo de colores raros.
- **Sin texto, sin marca de agua, sin fondo escénico** — solo el personaje, en los 4 frames.

## Contexto del proyecto (por qué importan estas reglas)

Es un asset para un juego 2D top-down hecho con Kaplay.js, donde todo el arte está en grilla
perfecta de 16px con transparencia real. Con los personajes anteriores tuvimos casi siempre
el mismo problema: el archivo entregado no tenía transparencia real (PNG de 24 bits con un
fondo de color pintado a mano en vez de alfa), las dimensiones no eran múltiplo de 16, o el
diseño del personaje cambiaba levemente entre frames más allá del movimiento pedido. Evitalo
de entrada esta vez.
