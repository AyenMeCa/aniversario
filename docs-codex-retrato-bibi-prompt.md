# Prompt para Codex — Retrato animado de Bibi (Brawl Stars) para el cuadro de diálogo (48×64, 4 cuadros)

Adjunto 7 imágenes:

- **4 referencias de Bibi** (el personaje de Brawl Stars). Tomá de ellas el diseño, los rasgos y los
  colores:
  - la de la **ilustración con el chicle** (pelo negro, cara de lado con el globo rosa): referencia
    del **peinado** (melena corta tipo bob con el mechón levantado hacia arriba), de la cara, de las
    **cejas gruesas y angulosas** y de los **ojos grandes ovalados** (negros, con el brillo blanco),
    y del **arete en forma de cruz rosa**;
  - la de **primer plano de la cara**: referencia de la expresión (mirada de costado, ceño
    desafiante), la boca pequeña y la forma de la cara;
  - la **chibi con el pulgar arriba** (pelo azul marino): la mejor referencia de los **colores del
    pelo (azul muy oscuro con brillos)**, de la **boca abierta sonriendo** para "habla B", de las
    mejillas rosadas y de la **chaqueta morada de cuello alto** con los botones/tachuelas;
  - el **sprite pixel art** de Bibi: referencia de cómo se resuelve en pocos píxeles (pelo azul
    marino, ojos negros con brillo, chaqueta morada, top rosa).
- **1 imagen de estilo**: la grilla de retratos de busto en pixel art (marco oscuro, fondo liso,
  ojos grandes, cabeza y hombros cortados por el borde de abajo). Copiá **solo el estilo de
  dibujo**, no esos personajes ni su marco, e ignorá los muñequitos pequeños al lado.
- **1 imagen de resultado de ejemplo**: un retrato animado ya terminado de otro personaje (4 cuadros
  con la misma cabeza; solo cambian la boca y los ojos). **Seguí exactamente ese formato de
  animación y ese nivel de detalle.**
- **1 guía de cuadrícula** (`Guia_Cuadricula_Retrato_48x64_4x1.png`): 4 cuadros de **48×64 px**
  con la grilla. Es solo una guía de tamaño y posición: **no dibujes las líneas ni los números**.

## Qué quiero

Un **retrato de busto de Bibi** para el cuadro de diálogo de un juego pixel art. El retrato va a
la izquierda del texto cuando ella habla.

### Encuadre y pose

- **Cara casi de frente, ligeramente girada a 3/4**, mirando al espectador con actitud segura y un
  poco desafiante (una ceja más baja, mirada directa). Cabeza y **hombros** visibles, cortados por
  el borde de abajo del cuadro.
- **La cabeza es lo principal:** ocupa cerca del 65-70 % del alto del cuadro, centrada. Abajo se ven
  el cuello y los **hombros con la chaqueta morada de cuello alto y levantado**, con un par de
  **botones/tachuelas** claros, y un poco del **top rosa** en el escote.
- **Pelo azul marino muy oscuro**, corto tipo bob con **flequillo y un mechón alto levantado**
  hacia el costado (como en la chibi), con 2-3 brillos azul más claro. Tiene que **caber completo
  dentro del cuadro**.
- **Piel color durazno claro**, con sombras en planos y **mejillas rosadas** (dos manchitas).
- **Ojos grandes ovalados negros** con un brillo blanco grande y otro pequeño; **cejas negras
  gruesas y anguladas** hacia abajo en el centro.
- **Boca pequeña.** En el cuadro neutral, una sonrisa ladeada de seguridad.
- **Arete en forma de cruz rosa** en la oreja visible.
- No dibujes las manos, el bate ni el chicle.

## La animación: 4 cuadros en fila

Los 4 cuadros son **el mismo dibujo**, con la cabeza, el pelo, la chaqueta y los hombros en
**exactamente la misma posición** (ni un píxel de diferencia). Solo cambian la boca y los ojos:

1. **Neutral:** ojos abiertos, boca cerrada con sonrisa ladeada segura.
2. **Habla A:** igual, con la boca entreabierta (pequeña).
3. **Habla B:** igual, con la boca abierta y sonriendo (más grande, con un poco de dientes
   blancos), como en la chibi.
4. **Parpadeo:** los ojos cerrados (una línea curva oscura gruesa), boca cerrada.

En el juego, mientras ella habla se alterna 1 → 2 → 3 → 2, y de vez en cuando se intercala el
parpadeo (4). Por eso es clave que solo cambien la boca y los ojos.

## Reglas técnicas (no negociables)

- **Tamaño exacto:** 4 cuadros de **48×64 px** en fila → imagen final de **192×64 px**, sin
  márgenes ni separación entre cuadros.
- **Si no podés generar exactamente 192×64**, generá a una **escala entera** (por ejemplo ×8 =
  1536×512) donde **cada píxel de arte sea un bloque cuadrado exacto del mismo tamaño en toda la
  imagen** (un entero, sin decimales; **los bloques tienen que ser cuadrados, no rectangulares**).
  La rejilla tiene que ser perfectamente regular: la imagen entera se puede dividir en una
  cuadrícula donde cada celda es de un solo color. Sin medios píxeles ni bloques de tamaños
  distintos.
- **Sin antialiasing ni degradados:** bordes duros, colores planos por zona, sombras de un tono más
  oscuro en bloques planos. El juego usa nearest-neighbor.
- **Fondo magenta plano `#FF00FF`** (sin degradés, sin sombra, sin viñeta, sin ruido). Ese magenta
  **no se puede usar** dentro del personaje. **No dibujes marco, fondo de color ni texto**: el
  marco y el fondo los pone el juego.
- **Contorno oscuro de 1 px** alrededor del personaje y de las formas importantes (`#140E1E`, casi
  negro con un toque violeta), del mismo grosor en los 4 cuadros.
- **Paleta limitada (máximo ~18 colores en total):**
  - pelo: azul marino base `#1E2A66`, sombra `#141B47`, brillo `#4661B8`;
  - piel: durazno claro `#F9CFA3`, sombra `#E6A883`, mejillas `#F4877F`;
  - ojos y cejas: negro `#140E1E`, esclerótica/brillo `#FFFFFF`;
  - boca: interior `#5A1A2B`, dientes `#FFFFFF`, labio `#D5636F`;
  - chaqueta: morado `#66208C`, sombra `#43146A`, brillo `#9B4CC4`; botones `#B9C8F5`;
  - top rosa `#F0AADB`; arete cruz `#F05AAE`.
- **Luz desde arriba a la izquierda:** brillos en la parte alta del pelo y de la frente, sombra en
  la parte baja derecha. Igual en los 4 cuadros.
- **Sin texto, sin marca de agua, sin fondo escénico.**

## Antes de entregarme, verificá

- El resultado mide 192×64 px (o una escala entera exacta de eso) y los bloques son cuadrados y
  regulares.
- Los 4 cuadros tienen todo en la misma posición; solo cambian la boca y los ojos.
- El pelo (incluido el mechón alto) está completo dentro del cuadro; solo los hombros quedan
  cortados por el borde de abajo.
- No hay líneas de la guía, números, marco ni texto, y el fondo es magenta plano.
- Se lee bien en 48×64: ojos, cejas, pelo, arete y chaqueta claros.

## Contexto (por qué importan estas reglas)

El retrato se muestra a tamaño 1:1 (48×64) dentro de un marco de 52×68 px en un juego con la vista
ampliada ×3 y reescalado nearest-neighbor. Cualquier suavizado, medio tono o desfase entre cuadros
se vería como un parpadeo raro al animar.
