# Prompt para Codex — Retrato animado de Tiana para el cuadro de diálogo (48×48, 4 cuadros)

Adjunto 6 imágenes:

- **4 referencias de Tiana** (el personaje). Tomá de ellas el diseño, los rasgos y los colores:
  - la de **puntos de pixel art** (cara con la tiara verde sobre fondo azul): la mejor referencia de
    cómo se resuelve su cara en pocos píxeles (ojos, cejas, párpados rosados, labios);
  - la de **punto de cruz** (busto con la tiara y el moño alto): la mejor referencia de la
    **tiara** (hojas de nenúfar verde claro y amarillo pálido), del peinado en moño alto y del
    escote con el collar;
  - la de **arte de frente** (con las manos en el pelo): referencia de la forma de la cara, los
    ojos marrones grandes, las cejas, los labios y el volumen del cabello;
  - la de la **sonrisa con la boca abierta**: referencia de la boca abierta y de la sombra de ojos
    lila para el cuadro "habla B".
- **1 imagen de estilo**: la grilla de retratos de busto en pixel art (marco oscuro, fondo liso,
  ojos grandes, cabeza y hombros cortados por el borde de abajo). Copiá **solo el estilo de
  dibujo**, no esos personajes ni su marco, e ignorá los muñequitos pequeños al lado.
- **1 imagen de resultado de ejemplo**: el retrato animado de Tikki ya terminado (4 cuadros con
  la misma cabeza y solo cambia la boca y los ojos). **Seguí exactamente ese formato de
  animación.**
- **1 guía de cuadrícula** (`Guia_Cuadricula_Retrato_48_4x1.png`): 4 cuadros de 48×48 px con la
  grilla. Es solo una guía de tamaño y posición: **no dibujes las líneas ni los números**.

## Qué quiero

Un **retrato de busto de Tiana** (la princesa de "La princesa y el sapo") para el cuadro de
diálogo de un juego pixel art. El retrato va a la izquierda del texto cuando ella habla.

### Encuadre y pose

- **Cara de frente, ligeramente girada a 3/4**, mirando al espectador, con la cabeza un poco
  inclinada como en las referencias. Cabeza y **hombros** visibles, cortados por el borde de
  abajo del cuadro (como los retratos de la imagen de estilo).
- **La cabeza es lo principal:** ocupa cerca del 70 % del alto del cuadro, centrada. Abajo se ven
  el cuello, los hombros descubiertos y el **escote verde** del vestido (borde en forma de pétalos)
  con el **collar** de perlas o cuentas verde claro.
- **Piel marrón oscura** cálida, con sombras suaves en planos.
- **Cabello negro-marrón muy oscuro recogido en un moño alto** (con algún rizo suelto junto a la
  cara), con unos pocos brillos un poco más claros.
- **Tiara verde:** hojas puntiagudas verde claro con detalles amarillo pálido, sobre el pelo,
  como en la referencia de punto de cruz. Tiene que **caber completa dentro del cuadro** (el moño
  y la tiara arriba no se cortan).
- **Ojos marrones** grandes y expresivos, cejas oscuras y bien marcadas (arqueadas), **sombra de
  ojos rosada/lila**, pestañas cortas, un brillo blanco pequeño en cada iris.
- **Labios** rosados/rojizos con un brillo claro; sonrisa leve y cálida.
- No dibujes las manos ni los guantes.

## La animación: 4 cuadros en fila

Los 4 cuadros son **el mismo dibujo**, con la cabeza, el pelo, la tiara, los hombros y el collar
en **exactamente la misma posición** (ni un píxel de diferencia). Solo cambian la boca y los ojos:

1. **Neutral:** ojos abiertos, boca cerrada con sonrisa leve.
2. **Habla A:** igual, con la boca entreabierta (pequeña, mostrando un poco de oscuro y los labios).
3. **Habla B:** igual, con la boca abierta y sonriente (más grande, con un poco de dientes
   blancos), como en la referencia de la sonrisa.
4. **Parpadeo:** los ojos cerrados (una línea curva oscura con las pestañas y la sombra de ojos),
   boca cerrada.

En el juego, mientras ella habla se alterna 1 → 2 → 3 → 2, y de vez en cuando se intercala el
parpadeo (4). Por eso es clave que solo cambien la boca y los ojos.

## Reglas técnicas (no negociables)

- **Tamaño exacto:** 4 cuadros de **48×48 px** en fila → imagen final de **192×48 px**, sin
  márgenes ni separación entre cuadros.
- **Si no podés generar exactamente 192×48**, generá a una **escala entera** (por ejemplo ×8 =
  1536×384) donde **cada píxel de arte sea un bloque cuadrado exacto del mismo tamaño en toda la
  imagen** (un entero, sin decimales). Es importante que la rejilla sea perfecta y que **no haya
  bloques de tamaños distintos ni medios píxeles**: la imagen entera tiene que poder dividirse
  en una cuadrícula regular donde cada celda es de un solo color.
- **Sin antialiasing ni degradados:** bordes duros, colores planos por zona, sombras de un tono
  más oscuro en bloques planos. El juego usa nearest-neighbor.
- **Fondo magenta plano `#FF00FF`** (sin degradés, sin sombra, sin viñeta, sin ruido). Ese magenta
  **no se puede usar** dentro del personaje. **No dibujes marco, fondo de color ni texto**: el
  marco y el fondo los pone el juego.
- **Contorno oscuro de 1 px** alrededor del personaje y de las formas importantes (`#21141A`, un
  marrón casi negro, no negro puro), del mismo grosor en los 4 cuadros.
- **Paleta limitada (máximo ~18 colores en total):**
  - piel: clara `#A8643F`, media `#84492F`, sombra `#5E3324`, sombra profunda `#43241C`;
  - cabello: base `#21141A`, brillo `#4A3038`;
  - tiara: verde claro `#B6E39A`, verde medio `#7DB878`, verde oscuro `#4E8A62`, amarillo pálido
    `#E5E4A2`;
  - ojos: iris marrón `#6E3722`, pupila `#21141A`, esclerótica `#FFFFFF`, brillo `#FFFFFF`;
  - sombra de ojos: rosa `#E45A97` y lila `#9A5A9A`;
  - labios: `#963148` con brillo `#DE5477`; interior de la boca `#43151F`, dientes `#FFFFFF`;
  - vestido y collar: verde `#78B87C` y perlas `#D8EBC9`.
- **Luz desde arriba a la izquierda:** brillos en la parte alta izquierda de la frente, el pómulo
  y el pelo, y sombra en la parte baja derecha. Igual en los 4 cuadros.
- **Sin texto, sin marca de agua, sin fondo escénico.**

## Antes de entregarme, verificá

- El resultado mide 192×48 px (o una escala entera exacta de eso) y la rejilla de píxeles es
  perfectamente regular.
- Los 4 cuadros tienen todo en la misma posición; solo cambian la boca y los ojos.
- La tiara y el moño están completos dentro del cuadro; solo los hombros quedan cortados por el
  borde de abajo.
- No hay líneas de la guía, números, marco ni texto, y el fondo es magenta plano.
- Se lee bien en 48×48: ojos, cejas, tiara y labios claros.

## Contexto (por qué importan estas reglas)

El retrato se muestra a tamaño 1:1 (48×48) dentro de un marco de 52×52 px en un juego con la vista
ampliada ×3 y reescalado nearest-neighbor. Cualquier suavizado, medio tono o desfase entre cuadros
se vería como un parpadeo raro al animar.
