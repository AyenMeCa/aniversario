# Prompt para Codex — Sprite sheet animado de Kim Namjoon (idle)

Adjunto una imagen de referencia de un personaje chibi en pixel art: pelo corto castaño,
anteojos de sol redondos oscuros, remera amarilla, overol/jardinero azul con tiradores,
zapatillas blancas, de pie mirando de frente. Quiero que generes un **sprite sheet de
animación "idle" (parado quieto, sin caminar)** basado en ese diseño, respetando su forma,
proporciones, paleta de colores y grosor de contorno.

## Animación pedida

El personaje está parado sin moverse, pero **respira de forma sutil**: los hombros y el
pecho suben y bajan levemente, como alguien parado tranquilo. Es un loop de 4 frames:

1. **Frame 1** — pose de reposo (igual a la referencia).
2. **Frame 2** — inhalando: hombros y pecho suben un poco (1-2 píxeles), apenas perceptible.
3. **Frame 3** — punto más alto de la inhalación (el pecho/hombros en su posición más
   elevada de las 4).
4. **Frame 4** — exhalando, bajando hacia la posición de reposo (a mitad de camino entre el
   frame 3 y el frame 1, para que el loop cierre sin salto).

Es una animación **sutil, no exagerada** — a diferencia de una respiración de animal, acá el
movimiento tiene que ser chico y elegante: se nota que el personaje está "vivo" sin que
parezca que está saltando o inflándose. Opcionalmente, un mechón de pelo o un tirante del
overol puede moverse un pixel de forma sincronizada con la respiración para dar más vida,
pero es opcional — no es necesario si complica mantener todo lo demás fijo.

El resto del personaje (anteojos, cara, piernas, zapatillas, posición de los pies) se
mantiene **exactamente igual, píxel por píxel**, en los 4 frames — lo único que se mueve es
la zona de hombros/pecho (y opcionalmente el detalle chico mencionado arriba).

## Reglas técnicas (no negociables)

- **Grilla de 16 píxeles.** El sprite tiene que ocupar un tamaño múltiplo exacto de 16x16.
  Recomendado: **64x64 px por frame** (4x4 tiles), que es el tamaño que ya usan los
  personajes de este juego.
- **Sprite sheet horizontal:** los 4 frames en fila, todos del mismo tamaño exacto de celda
  (si cada frame es 64x64, la imagen final es 256x64 — ni un píxel más ni menos).
- **Ancla fija obligatoria:** el personaje apoya sobre la misma línea de piso, en el mismo
  punto x/y exacto, en los 4 frames — pies, zapatillas y contorno del cuerpo **no se mueven
  ni un solo píxel** de un frame a otro salvo la zona de hombros/pecho descrita arriba.
  Ningún elemento se corre hacia arriba, abajo, izquierda o derecha entre frames.
- **Fondo con transparencia REAL de canal alfa (RGBA)**, no un cuadriculado gris/blanco
  dibujado como si fuera transparencia. El archivo tiene que ser un PNG de 32 bits con canal
  alfa donde el fondo tenga alpha=0 de verdad en los datos, no solo una vista previa.
- **Sin antialiasing ni gradientes suaves** — bordes duros, pixel a pixel, colores planos por
  zona con sombras de un tono más oscuro plano (no degradé). El renderer del juego usa
  nearest-neighbor, así que cualquier suavizado se ve como un halo de colores raros.
- **Contorno negro consistente** en los 4 frames, del mismo grosor que la referencia.
- **Paleta de color:** mantené los mismos tonos de la referencia (castaño del pelo, negro de
  los anteojos, amarillo de la remera, azul del overol, blanco de las zapatillas) — no
  reinventar colores nuevos.
- **Sin texto, sin marca de agua, sin fondo escénico** — solo el personaje.

## Contexto del proyecto (por qué importan estas reglas)

Es un asset para un juego 2D top-down hecho con Kaplay.js, donde todo el arte (terreno, agua,
props, personajes) está recortado de sprite sheets en grilla perfecta de 16px y se referencia
por fila/columna en el código. Ya tuvimos un intento previo con otro personaje (un sapo) que
vino con dos problemas que hay que evitar acá: el archivo no tenía transparencia real (era un
PNG de 24 bits con un cuadriculado gris pintado a mano) y las dimensiones no eran múltiplo de
16. Si el sprite no cumple esto, el juego lo corta mal o lo desalinea al animarlo.
