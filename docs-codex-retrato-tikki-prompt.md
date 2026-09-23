# Prompt para Codex — Retrato animado de Tikki para el cuadro de diálogo (32×32, 4 cuadros)

Adjunto 6 imágenes:

- **4 referencias de Tikki** (el personaje). Tomá de ellas el diseño y los colores:
  - la de la cara de frente (primer plano de la cara): la mejor referencia de proporciones de la
    cabeza, la mancha negra y los ojos;
  - la de fondo blanco (vista 3/4, cuerpo entero): la mejor referencia de la forma del cuerpo,
    las antenas y los brazos cruzados bajo la barbilla;
  - la de fondo oscuro (perfil 3/4): referencia de la expresión y de cómo se ve girada;
  - la de fondo azul: referencia de la boca abierta sonriendo.
- **1 imagen de estilo** (una grilla de retratos de busto en pixel art, cada uno de 32×32 px con
  un marco oscuro fino). Copiá **solo el estilo de dibujo** (busto, contorno oscuro, 3-4 tonos por
  zona, ojos grandes y expresivos, cabeza y hombros cortados por el borde de abajo). **No copies
  esos personajes ni su marco**, y ignorá los muñequitos pequeños que aparecen al lado de cada uno.
- **1 guía de cuadrícula** (`Guia_Cuadricula_Retrato_4x1.png`): 4 cuadros de 32×32 px con las
  líneas de la grilla. Es solo una guía de tamaño y posición: **no dibujes las líneas ni los
  números** en el resultado.

## Qué quiero

Un **retrato de busto de Tikki** para el cuadro de diálogo de un juego pixel art (el retrato va a
la izquierda del texto cuando ella habla). Tiene que verse **como los retratos de la imagen de
estilo**, pero con Tikki, con la **misma composición**: personaje centrado, mirando al
espectador, cortado por el borde de abajo.

### Encuadre y pose (igual que en las referencias)

- Vista **de frente ligeramente girada a 3/4**, mirando al espectador, como en las referencias.
- **La cabeza es lo principal:** redonda y grande, ocupa cerca del 75-80 % del alto del cuadro y
  está centrada.
- La **mancha negra** redonda arriba de la cabeza, un poco inclinada, como en las referencias.
- **Ojos enormes**, con pestañas cortas (2-3 por ojo), iris azul oscuro con **dos brillos
  blancos** pequeños, esclerótica blanca con un toque lila en la sombra.
- **Boca pequeña**, con una sonrisa leve.
- **Dos antenas finas** que salen de los costados de la cabeza y se curvan hacia afuera y hacia
  arriba. Tienen que caber **completas dentro del cuadro** (acortalas y curvalas lo justo).
- Abajo, el cuerpo pequeño **cortado por el borde inferior del cuadro**: el cuello, los hombros
  finitos y los brazos cruzados bajo la barbilla, como en la referencia de fondo blanco. No
  dibujes las piernas ni las aletas de la espalda.

## La animación: 4 cuadros en fila

Los 4 cuadros son **el mismo dibujo**, con la cabeza, las antenas, la mancha y el cuerpo en
**exactamente la misma posición** (ni un píxel de diferencia). Solo cambian la boca y los ojos:

1. **Neutral:** ojos abiertos, boca cerrada con una sonrisa leve.
2. **Habla A:** igual, con la boca entreabierta (pequeña).
3. **Habla B:** igual, con la boca abierta y sonriente (más grande), como en la referencia de
   fondo azul.
4. **Parpadeo:** los ojos cerrados (una línea curva oscura con las pestañas), boca cerrada.

En el juego, mientras ella habla se va alternando 1 → 2 → 3 → 2, y de vez en cuando se intercala
el parpadeo (4). Por eso es clave que solo cambien la boca y los ojos.

## Reglas técnicas (no negociables)

- **Tamaño exacto:** 4 cuadros de **32×32 px** en una fila → imagen final de **128×32 px**. Sin
  márgenes ni separación entre cuadros.
  - Si no podés generar exactamente 128×32, generá a una **escala entera** (×4 = 512×128, ×8 =
    1024×256) donde **cada píxel de arte sea un bloque cuadrado exacto** de esa escala, para que
    yo pueda reducirlo sin pérdida. Nada de medios tonos ni bloques que no calcen.
- **Sin antialiasing ni degradados:** bordes duros, colores planos por zona, sombras de un tono
  más oscuro en bloques planos (nada de degradé ni texturas). El juego usa nearest-neighbor.
- **Fondo magenta plano `#FF00FF`** (sin degradés, sin sombra, sin viñeta). Ese magenta **no se
  puede usar** dentro del personaje. Yo lo convierto a transparente después. **No dibujes marco,
  fondo de color, ni texto**: el marco y el fondo los pone el juego.
- **Contorno oscuro de 1 px** alrededor de todo el personaje y de las formas internas
  importantes, del mismo grosor en los 4 cuadros. Usá un **marrón/granate muy oscuro** (`#3B0F1F`),
  no negro puro.
- **Paleta limitada (máximo ~14 colores en total)**, tomada de las referencias:
  - rojo-rosado del cuerpo: claro `#F0506E`, medio `#D23A5B`, sombra `#9C253D`, sombra profunda
    `#771D30`;
  - mancha de la cabeza: `#49374A` (con un tono más oscuro `#2A2030` para el borde inferior);
  - ojos: esclerótica `#FFFFFF`, sombra lila `#C98CAD`, iris azul `#2E3B8F`, pupila `#0F0A1E`,
    brillos `#FFFFFF`;
  - boca: interior `#3B0F1F` (y un toque `#B5476B` para la lengua si cabe);
  - antenas: `#9C253D`.
- **Luz desde arriba a la izquierda:** brillo claro en la parte alta izquierda de la cabeza y
  sombra en la parte baja derecha, igual en los 4 cuadros.
- **Sin texto, sin marca de agua, sin fondo escénico.**

## Antes de entregarme, verificá

- El resultado mide 128×32 px (o una escala entera exacta de eso).
- Los 4 cuadros tienen la cabeza, las antenas y el cuerpo en la misma posición; solo cambian la
  boca y los ojos.
- Las antenas están completas dentro del cuadro; solo el cuerpo de abajo queda cortado por el
  borde.
- No hay líneas de la guía, números, marco ni texto, y el fondo es magenta plano.
- Se lee bien aun reducido a 32×32: ojos grandes, mancha negra y contorno claros.

## Contexto (por qué importan estas reglas)

El retrato se muestra a tamaño 1:1 (32×32) dentro de un marco de 36×36 px en un juego con la
vista ampliada ×3, con reescalado nearest-neighbor. Cualquier suavizado, medio tono o desfase
entre cuadros se vería como un parpadeo raro al animar.
