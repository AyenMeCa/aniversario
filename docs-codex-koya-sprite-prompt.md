# Prompt para Codex — Sprite de Koya (BT21) para el mapa del juego, idle con movimiento sutil (4 cuadros de 64×64)

Adjunto 7 imágenes:

- **4 referencias de Koya** (el koala celeste de BT21): la ilustración de fondo azul (proporciones y
  colores), el pixel art de cuerpo entero (cómo se resuelve chiquito), la foto del cuaderno y el
  pixel art de la cabeza. Tomá de ellas el diseño, las proporciones y los colores.
- **El retrato ya terminado de Koya** (`Koya_Retrato-Sheet.png`, 4 cuadros). **Es la referencia
  principal de estilo:** el sprite tiene que ser **el mismo personaje, con la misma paleta, el
  mismo contorno y el mismo tipo de sombreado** que ese retrato, pero de cuerpo entero y más
  chiquito.
- **1 sprite de otro personaje ya en el juego** (por ejemplo el de Tiana o Rapunzel: personaje de
  pie, de frente, 64×64 por cuadro), solo como referencia de **escala y encuadre**.
- **1 guía de cuadrícula** (`Guia_Cuadricula_Sprite_64_4x1.png`): 4 cuadros de **64×64 px** con la
  grilla y una **línea blanca del piso** en la fila 62. Es solo una guía de tamaño y posición:
  **no dibujes las líneas ni los números**.

## Qué quiero

El **sprite de Koya parado en el mapa** de un juego top-down en pixel art, mirando de frente al
espectador. Es un NPC que se queda quieto en un lugar; la animación es un **"idle" con movimiento
sutil** para que se vea vivo.

### Diseño y proporciones (chibi kawaii)

- **Koala celeste** de proporciones muy chibi: **cabeza enorme y redonda** (más grande que el
  cuerpo), **dos orejas grandes redondas** con el interior blanco, **nariz ovalada morada** con un
  brillo, **ojos como dos rayitas horizontales** cortas y una **sonrisa pequeña** curva.
- **Cuerpo pequeño y regordete** debajo de la cabeza: torso celeste con la **panza blanca** en el
  centro, **brazos cortos** caídos a los costados con manitas redondas, **piernas cortas y
  redondas** con pies redondos. Sin cola visible.
- **Tamaño:** el personaje mide **unos 32 px de alto** en total (de la punta de las orejas a los
  pies) y **unos 28 px de ancho** (orejas incluidas), **centrado horizontalmente** en el cuadro
  de 64×64. Sobra mucho aire alrededor: es un personaje chiquito, no llenes el cuadro.
- **Posición:** los **pies apoyan en la fila 62** del cuadro (la línea blanca de la guía), en el
  mismo punto exacto en los 4 cuadros.

## La animación: 4 cuadros en fila (loop suave)

El personaje respira / se mece apenas. **Los pies y las piernas no se mueven ni un píxel**; se
mueven solo la cabeza, las orejas y el torso, en pasos de **1 píxel**:

1. **Reposo:** pose base descrita arriba.
2. **Sube:** la cabeza y el torso suben **1 px**; las orejas **quedan 1 px rezagadas** hacia
   abajo (por inercia), y los brazos apenas se despegan del cuerpo.
3. **Arriba:** el punto más alto: la cabeza y el torso suben **2 px** respecto del reposo; las
   orejas se **inclinan levemente** hacia afuera (1 px) y la sonrisa se ensancha 1 px.
4. **Baja:** bajando, a mitad de camino entre el 3 y el 1 (cabeza y torso **1 px** arriba del
   reposo); las orejas vuelven hacia adentro.

El loop se repite 1 → 2 → 3 → 4 → 1, así que el cuadro 4 tiene que quedar a mitad de camino entre
el 3 y el 1 para que no haya salto. El movimiento es **chico y suave** (que se note que está vivo,
sin que parezca que salta).

## Reglas técnicas (no negociables)

- **Tamaño exacto:** 4 cuadros de **64×64 px** en fila → imagen final de **256×64 px**, sin
  márgenes ni separación entre cuadros.
- **Si no podés generar exactamente 256×64**, generá a una **escala entera** (por ejemplo ×8 =
  2048×512) donde **cada píxel de arte sea un bloque cuadrado exacto del mismo tamaño en toda la
  imagen** (entero, sin decimales; **bloques cuadrados, no rectangulares**). Rejilla perfectamente
  regular, sin medios píxeles.
- **Sin antialiasing ni degradados:** bordes duros, colores planos por zona, sombras de un tono más
  oscuro en bloques planos. El juego usa nearest-neighbor.
- **Fondo magenta plano `#FF00FF`** (sin degradés, sin sombra, sin ruido). Ese magenta **no se
  puede usar** dentro del personaje. **No dibujes sombra en el piso ni fondo.**
- **Contorno oscuro de 1 px** (`#26303D`, azul muy oscuro casi negro, no negro puro), del mismo
  grosor en los 4 cuadros.
- **Paleta limitada (máximo ~14 colores), igual que el retrato:** celeste base `#A4E1F9`, sombra
  `#7CC6EA`, sombra profunda `#5AA6CC`, luz `#D2F1FC`; blanco `#FFFFFF` con sombra `#DCEAF2` para
  orejas y panza; nariz morada `#6C58B0`, sombra `#4E3F8C`, brillo `#A597DE`; ojos y sonrisa
  `#26303D`.
- **Luz desde arriba a la izquierda**, igual en los 4 cuadros.
- **Sin texto, sin marca de agua, sin números.**

## Antes de entregarme, verificá

- El resultado mide 256×64 px (o una escala entera exacta de eso) y los bloques son cuadrados.
- El personaje mide ~32 px de alto y está centrado; los pies están en la misma posición exacta en
  los 4 cuadros.
- Solo se mueven la cabeza, las orejas y el torso, en pasos de 1 px; el cuadro 4 está a mitad de
  camino entre el 3 y el 1.
- Es reconocible como el mismo Koya del retrato (colores, contorno, cara).
- No hay líneas de la guía, números ni sombra en el piso; el fondo es magenta plano.

## Contexto (por qué importan estas reglas)

El sprite se dibuja en un mapa con la vista ampliada ×3 y reescalado nearest-neighbor, con otros
personajes de 64×64 por cuadro. Cualquier suavizado, medio tono o desfase de los pies entre
cuadros se vería como un temblor raro.
