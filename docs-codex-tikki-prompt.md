# Prompt para Codex — Sprite sheet animado de Tikki (idle volando)

Adjunto una imagen de referencia de un personaje chibi en pixel art: criatura roja pequeña,
cabeza redonda con una mancha negra arriba, ojos grandes con iris azul oscuro, cuerpo
delgado, dos antenas largas y curvas que le cuelgan/flotan a los costados de la cabeza,
brazos y piernas finitos. Quiero que generes un **sprite sheet de animación "idle" (parada
en el aire, sin moverse de lugar)** basado en ese diseño, respetando su forma, proporciones,
paleta de colores y grosor de contorno.

## Este personaje VUELA — la animación tiene que mostrar eso

A diferencia de un personaje parado en el piso, Tikki **flota/vuela en el mismo lugar**, no
tiene los pies apoyados en nada. La animación de "quieta" tiene que transmitir que está
suspendida en el aire, con un **movimiento de flotación (hover)** de arriba hacia abajo, más
el rebote natural de las antenas por la inercia. Es un loop de 4 frames:

1. **Frame 1** — posición base (altura media, igual a la referencia).
2. **Frame 2** — el cuerpo entero sube un poco (2-4 píxeles más arriba que el frame 1). Las
   antenas, por inercia, quedan un poco rezagadas hacia abajo respecto al cuerpo (no siguen
   el movimiento instantáneamente).
3. **Frame 3** — el cuerpo en el punto más alto de la flotación (el más arriba de los 4
   frames). Las antenas siguen recuperando el rezago.
4. **Frame 4** — el cuerpo bajando, volviendo hacia la posición base (a mitad de camino entre
   el frame 3 y el frame 1). Las antenas pueden quedar levemente rezagadas hacia arriba esta
   vez, como un péndulo que recién está frenando.

Es importante que el **movimiento vertical del cuerpo sea claro y se note** (no tan sutil
como una respiración) — es lo que hace que se lea como que está flotando y no parada. Al
mismo tiempo, la posición horizontal (izquierda/derecha) tiene que quedarse fija en los 4
frames — todo el vaivén es vertical, no lateral.

El resto del personaje (forma de la cabeza, ojos, mancha negra, proporciones del cuerpo) se
mantiene igual en los 4 frames — lo único que cambia es la altura del cuerpo completo y el
rezago de las antenas.

## Reglas técnicas (no negociables)

- **Grilla de 16 píxeles.** El sprite tiene que ocupar un tamaño múltiplo exacto de 16x16.
  Recomendado: **48x48 px por frame** (3x3 tiles) — es un personaje chico y compacto, no
  necesita tanta altura como un personaje humano de pie.
- **Sprite sheet horizontal:** los 4 frames en fila, todos del mismo tamaño exacto de celda
  (si cada frame es 48x48, la imagen final es 192x48 — ni un píxel más ni menos).
- **Centrado horizontal fijo:** el personaje no se corre ni un píxel hacia los costados entre
  frames — todo el movimiento descrito arriba es vertical.
- **Dejá aire de sobra arriba y abajo del personaje dentro de cada frame**, ya que el cuerpo
  se mueve verticalmente entre frames y necesita espacio para subir sin cortarse contra el
  borde de la imagen.
- **Fondo con transparencia REAL de canal alfa (RGBA)**, no un cuadriculado gris/blanco
  dibujado como si fuera transparencia. El archivo tiene que ser un PNG de 32 bits con canal
  alfa donde el fondo tenga alpha=0 de verdad en los datos, no solo una vista previa.
- **Sin antialiasing ni gradientes suaves** — bordes duros, pixel a pixel, colores planos por
  zona con sombras de un tono más oscuro plano (no degradé). El renderer del juego usa
  nearest-neighbor, así que cualquier suavizado se ve como un halo de colores raros.
- **Contorno negro consistente** en los 4 frames, del mismo grosor que la referencia.
- **Paleta de color:** mantené los mismos tonos de la referencia (rojo del cuerpo, negro de
  la mancha y el contorno, blanco y azul oscuro de los ojos) — no reinventar colores nuevos.
- **Sin texto, sin marca de agua, sin fondo escénico** — solo el personaje.

## Contexto del proyecto (por qué importan estas reglas)

Es un asset para un juego 2D top-down hecho con Kaplay.js, donde todo el arte (terreno, agua,
props, personajes) está recortado de sprite sheets en grilla perfecta de 16px y se referencia
por fila/columna en el código. Con los dos personajes anteriores (un sapo y un chico) tuvimos
el mismo problema dos veces: el archivo entregado no tenía transparencia real (PNG de 24 bits
con un cuadriculado gris pintado a mano) y las dimensiones no eran múltiplo de 16. Si pasa de
nuevo, no es grave — se puede corregir después con el archivo real — pero evitarlo de entrada
ahorra una vuelta.
