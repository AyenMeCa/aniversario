# Prompt para Codex — Sprite sheet animado de Bibi (idle, 4 frames)

Adjunto una imagen de referencia de un personaje chibi en pixel art llamado **Bibi**: pelo
corto oscuro (azulado/negro) con un mechón que sobresale hacia arriba, campera violeta sobre
remera rosa fucsia, pantalón oscuro, zapatillas, sosteniendo un **bate** (no es un yoyo — es
un bate rígido, tipo bate de béisbol, que sostiene con una mano) en una pose dinámica con un
brazo extendido. Quiero que generes un **sprite sheet de animación "idle" (quieta, sin
caminar)** basado en ese diseño, respetando su forma, proporciones, paleta de colores y
grosor de contorno.

## Animación pedida

El personaje mantiene la pose de la referencia (no cambia de postura ni de piernas), pero
tiene un **movimiento sutil de respiración** en un loop de 4 frames:

1. **Frame 1** — pose de reposo, idéntica a la referencia.
2. **Frame 2** — respiración: hombros y pecho suben un poco (1-2 píxeles), apenas
   perceptible. Como el bate es rígido y lo sostiene firme con la mano, se mueve junto con
   el brazo/hombro (no se balancea solo ni queda rezagado, a diferencia de algo que cuelga de
   una cuerda) — sube levemente lo mismo que el hombro que lo sostiene.
3. **Frame 3** — punto más alto de la inhalación (hombros/pecho/brazo con el bate en su
   posición más elevada de las 4).
4. **Frame 4** — exhalando, bajando hacia la posición de reposo (a mitad de camino entre el
   frame 3 y el frame 1).

Es una animación **sutil, no exagerada** — el movimiento tiene que ser chico: se nota que el
personaje está "viva" sin que parezca que está saltando o agitando el bate. El resto del
personaje (cara, pelo, piernas, pose, ángulo del bate) se mantiene **exactamente igual, píxel
por píxel**, en los 4 frames — lo único que se mueve es la zona de hombros/pecho/brazo que
sostiene el bate, todo junto y rígido (el bate no se dobla ni cambia de ángulo respecto a la
mano, se mueve como una sola pieza con el brazo).

- **Ancla fija obligatoria:** los pies y el contorno del cuerpo quedan en el mismo punto x/y
  exacto en los 4 frames — nada se corre ni un píxel salvo lo descrito arriba.
- **Sprite sheet horizontal:** los 4 frames en fila, todos del mismo tamaño exacto de celda.

## Reglas técnicas (no negociables)

- **Grilla de 16 píxeles.** Cada frame tiene que medir un múltiplo exacto de 16x16
  (recomendado 64x64), y la imagen final (los 4 frames en fila) también múltiplo exacto de
  16 en ancho y alto — sin sobras de píxeles.
- **Fondo con transparencia REAL de canal alfa (RGBA)**, no un color sólido ni un
  cuadriculado pintado como si fuera transparencia. El archivo tiene que ser un PNG de 32
  bits con canal alfa donde el fondo tenga alpha=0 de verdad en los datos, no solo una vista
  previa blanca.
- **Sin antialiasing ni gradientes suaves** — bordes duros, pixel a pixel, colores planos por
  zona (no degradé). El renderer del juego usa nearest-neighbor, así que cualquier suavizado
  se ve como un halo de colores raros.
- **Contorno negro consistente** en los 4 frames, del mismo grosor que la referencia.
- **Paleta de color:** mantené los mismos tonos de la referencia (azul/negro del pelo,
  violeta de la campera, rosa de la remera, oscuro del pantalón, tono del bate) — no
  reinventar colores nuevos.
- **Sin texto, sin marca de agua, sin fondo escénico** — solo el personaje.

## Contexto del proyecto (por qué importan estas reglas)

Es un asset para un juego 2D top-down hecho con Kaplay.js, donde todo el arte está en grilla
perfecta de 16px con transparencia real. Con los personajes anteriores tuvimos casi siempre
el mismo problema: el archivo entregado no tenía transparencia real (PNG de 24 bits con un
fondo de color pintado a mano en vez de alfa) y las dimensiones no eran múltiplo de 16.
Evitalo de entrada esta vez.
