# Prompt para Codex — Retrato animado de Koya (BT21) para el cuadro de diálogo (48×64, 4 cuadros)

Adjunto 7 imágenes:

- **4 referencias de Koya** (el koala de BT21). Tomá de ellas el diseño y los colores:
  - la **ilustración de fondo azul**: la mejor referencia de las **proporciones** (cabeza redonda y
    grande, orejas grandes con el interior blanco, nariz ovalada morada), de los **ojos cerrados
    como dos rayitas** con una sonrisa pequeña, y de los **colores planos** (celeste claro con
    contorno oscuro);
  - el **pixel art en cuadrícula de cuerpo entero**: referencia de cómo se resuelve en pocos píxeles
    (contorno oscuro, orejas con blanco, nariz morada, panza blanca);
  - la **foto del cuaderno**: referencia del ángulo de la cabeza asomándose y de las manitas
    redondas;
  - el **pixel art de la cabeza sola**: la mejor referencia de la **cara** a esta escala (rayitas de
    ojos, nariz, boca y orejas).
- **1 imagen de estilo**: la grilla de retratos de busto en pixel art (marco oscuro, fondo liso,
  ojos grandes, cabeza y hombros cortados por el borde de abajo). Copiá **solo el estilo de
  dibujo** (contorno oscuro, tonos planos con sombra), no esos personajes ni su marco, e ignorá los
  muñequitos pequeños al lado.
- **1 imagen de resultado de ejemplo**: un retrato animado ya terminado de otro personaje (4 cuadros
  con la misma cabeza; solo cambian la boca y los ojos). **Seguí exactamente ese formato de
  animación y ese nivel de detalle.**
- **1 guía de cuadrícula** (`Guia_Cuadricula_Retrato_48x64_4x1.png`): 4 cuadros de **48×64 px**
  con la grilla. Es solo una guía de tamaño y posición: **no dibujes las líneas ni los números**.

## Qué quiero

Un **retrato de busto de Koya** (el koala celeste de BT21, personaje de RM) para el cuadro de
diálogo de un juego pixel art. El retrato va a la izquierda del texto cuando él habla.

### Encuadre y pose

- **Cabeza casi de frente**, con una inclinación mínima, centrada. La cabeza es lo principal:
  ocupa cerca del **75 % del ancho** del cuadro y del **60 % del alto**. Las **dos orejas grandes**
  redondas (con el interior blanco y un tono celeste en el borde) tienen que **caber completas**
  dentro del cuadro.
- **Cara:** **nariz ovalada morada grande** en el centro, con un brillo pequeño; los **ojos son dos
  rayitas horizontales cortas** (cerrados / somnolientos), bajo la nariz una **sonrisa pequeña**
  curva y sencilla; sin cejas ni pestañas.
- **Cuerpo:** abajo se ve el **cuello corto y los hombros redondos** con un poco de la **panza
  blanca** en el centro, **cortados por el borde de abajo** del cuadro. Las manitas no se dibujan.
- Estilo **kawaii**: formas redondeadas y suaves, sin ángulos duros.

## La animación: 4 cuadros en fila

Los 4 cuadros son **el mismo dibujo**, con la cabeza, las orejas, la nariz y el cuerpo en
**exactamente la misma posición** (ni un píxel de diferencia). Solo cambian la boca y los ojos:

1. **Neutral:** ojos como dos rayitas horizontales, sonrisa pequeña cerrada.
2. **Habla A:** las mismas rayitas de ojos, con la boca **entreabierta** (un óvalo chico oscuro).
3. **Habla B:** ojos como **dos arquitos hacia arriba** (feliz), boca **abierta y sonriente** (más
   grande, con un poco de lengua rosada).
4. **"Parpadeo":** como los ojos ya son rayitas cerradas, este cuadro tiene los **ojos abiertos**:
   dos puntitos negros redondos con un brillo blanco, y la boca cerrada como en el neutral. Es un
   guiño de sorpresa.

En el juego, mientras habla se alterna 1 → 2 → 3 → 2, y de vez en cuando se intercala el cuadro 4.
Por eso es clave que solo cambien la boca y los ojos.

## Reglas técnicas (no negociables)

- **Tamaño exacto:** 4 cuadros de **48×64 px** en fila → imagen final de **192×64 px**, sin
  márgenes ni separación entre cuadros.
- **Si no podés generar exactamente 192×64**, generá a una **escala entera** (por ejemplo ×8 =
  1536×512) donde **cada píxel de arte sea un bloque cuadrado exacto del mismo tamaño en toda la
  imagen** (un entero, sin decimales; **los bloques tienen que ser cuadrados, no rectangulares**).
  La rejilla tiene que ser perfectamente regular. Sin medios píxeles ni bloques de tamaños
  distintos.
- **Sin antialiasing ni degradados:** bordes duros, colores planos por zona, sombras de un tono más
  oscuro en bloques planos. El juego usa nearest-neighbor.
- **Fondo magenta plano `#FF00FF`** (sin degradés, sin sombra, sin viñeta, sin ruido). Ese magenta
  **no se puede usar** dentro del personaje. **No dibujes marco, fondo de color ni texto**: el
  marco y el fondo los pone el juego.
- **Contorno oscuro de 1 px** alrededor del personaje y de las formas importantes (`#26303D`, un
  azul muy oscuro casi negro, no negro puro), del mismo grosor en los 4 cuadros.
- **Paleta limitada (máximo ~14 colores en total):**
  - cuerpo celeste: base `#A4E1F9`, sombra `#7CC6EA`, sombra profunda `#5AA6CC`, luz `#D2F1FC`;
  - interior de las orejas y panza: blanco `#FFFFFF` con sombra `#DCEAF2`;
  - nariz: morado `#6C58B0`, sombra `#4E3F8C`, brillo `#A597DE`;
  - ojos y boca: `#26303D`; interior de la boca `#3B2340`; lengua `#F08AA4`;
  - ojos abiertos (cuadro 4): pupila `#26303D` y brillo `#FFFFFF`.
- **Luz desde arriba a la izquierda:** brillo en la parte alta izquierda de la cabeza y sombra en la
  parte baja derecha. Igual en los 4 cuadros.
- **Sin texto, sin marca de agua, sin fondo escénico.**

## Antes de entregarme, verificá

- El resultado mide 192×64 px (o una escala entera exacta de eso) y los bloques son cuadrados y
  regulares.
- Los 4 cuadros tienen todo en la misma posición; solo cambian la boca y los ojos.
- Las dos orejas están completas dentro del cuadro; solo el cuerpo de abajo queda cortado por el
  borde.
- No hay líneas de la guía, números, marco ni texto, y el fondo es magenta plano.
- Se lee bien en 48×64: orejas, nariz morada y sonrisa claras.

## Contexto (por qué importan estas reglas)

El retrato se muestra a tamaño 1:1 (48×64) dentro de un marco de 52×68 px en un juego con la vista
ampliada ×3 y reescalado nearest-neighbor. Cualquier suavizado, medio tono o desfase entre cuadros
se vería como un parpadeo raro al animar.
