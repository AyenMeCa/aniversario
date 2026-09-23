# Prompt para Codex — Sprite sheet animado de Rapunzel (idle)

Adjunto una imagen de referencia de Rapunzel sentada (pelo rubio muy largo enroscado a su
alrededor, vestido/corpiño violeta con detalles claros, piel clara, mejillas rosadas).

**Ojo:** esa imagen es una foto de un set de piezas físicas tipo "brick art" (marca PIX BRIX),
no un sprite digital. Tiene varias cosas que **no son parte del personaje** y hay que
ignorar/sacar:

- El **logo/watermark "PIX BRIX"** arriba de la imagen.
- El **fondo violeta sólido** de toda la foto — no es parte de Rapunzel, hay que reemplazarlo
  por transparencia real.
- La **textura de "tachuela" o bulto redondo** que tiene cada pieza física (es el relieve 3D
  de las piezas de plástico al sacarles una foto, no es un detalle de diseño) — el resultado
  tiene que ser color plano por celda, sin ese efecto de bulto/sombra circular repetido.

Usá esa imagen solo como **guía de color y forma** — la pose sentada, la paleta (rubio del
pelo, violeta del vestido, piel clara, mejillas rosadas) y las proporciones generales — pero
generá un pixel art limpio y plano, como si fuera un sprite de un juego, no una foto de un
producto físico.

## Esto es la base de un sprite sheet de animación "idle"

Con el mismo criterio que ya usamos para otros personajes del juego (parados/sentados,
respirando sutilmente), quiero un loop de 4 frames:

1. **Frame 1** — pose de reposo (igual a la referencia, sentada).
2. **Frame 2** — inhalando: hombros y pecho suben un poco (1-2 píxeles), apenas perceptible.
3. **Frame 3** — punto más alto de la inhalación (el pecho/hombros en su posición más
   elevada de las 4).
4. **Frame 4** — exhalando, bajando hacia la posición de reposo (a mitad de camino entre el
   frame 3 y el frame 1, para que el loop cierre sin salto).

Es una animación **sutil, no exagerada** — el movimiento tiene que ser chico: se nota que el
personaje está "viva" sin que parezca que está saltando. El resto del personaje (cara, pelo,
vestido, la pose sentada, el mechón de pelo que se enrosca adelante) se mantiene
**exactamente igual, píxel por píxel**, en los 4 frames — lo único que se mueve es la zona de
hombros/pecho.

- **Ancla fija obligatoria:** la base de la pose sentada queda en el mismo punto x/y exacto
  en los 4 frames — nada se corre ni un píxel salvo la zona de hombros/pecho descrita arriba.
- **Sprite sheet horizontal:** los 4 frames en fila, todos del mismo tamaño exacto de celda.

## Reglas técnicas (no negociables)

- **Grilla de 16 píxeles.** Cada frame tiene que medir un múltiplo exacto de 16x16 (recomendado
  64x64), y la imagen final (los 4 frames en fila) también múltiplo exacto de 16 en ancho y
  alto.
- **Fondo con transparencia REAL de canal alfa (RGBA)**, no un color sólido ni un cuadriculado
  pintado como si fuera transparencia. El archivo tiene que ser un PNG de 32 bits con canal
  alfa donde el fondo tenga alpha=0 de verdad en los datos.
- **Sin antialiasing ni gradientes suaves** — bordes duros, pixel a pixel, colores planos por
  zona (no degradé, sin el efecto de bulto/relieve de las piezas físicas). El renderer del
  juego usa nearest-neighbor, así que cualquier suavizado se ve como un halo de colores raros.
- **Contorno negro consistente** en los 4 frames.
- **Sin texto, sin logos, sin marca de agua, sin fondo escénico** — solo el personaje.

## Contexto del proyecto (por qué importan estas reglas)

Es un asset para un juego 2D top-down hecho con Kaplay.js, donde todo el arte está en grilla
perfecta de 16px con transparencia real. Con los personajes anteriores tuvimos casi siempre
el mismo problema: el archivo entregado no tenía transparencia real (PNG de 24 bits con un
fondo de color pintado a mano en vez de alfa) y las dimensiones no eran múltiplo de 16.
Evitalo de entrada esta vez.
