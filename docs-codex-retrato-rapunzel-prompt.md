# Prompt para Codex — Retrato animado de Rapunzel para el cuadro de diálogo (48×64, 4 cuadros)

Adjunto 7 imágenes:

- **4 referencias de Rapunzel** (la de "Enredados"). Tomá de ellas el diseño, los rasgos y los
  colores:
  - la **foto 3D de la cara** (fondo oscuro): la mejor referencia de la **cara** (ojos verdes muy
    grandes con pestañas, cejas finas y arqueadas, mejillas rosadas con pecas, sonrisa ladeada
    tímida), del **pelo rubio dorado largo** con raya al costado y de la **blusa lila** con el
    escote cuadrado con encaje y el lazo;
  - la **ilustración plana** (con el camaleón Pascal en el hombro): referencia de la **inclinación
    de la cabeza**, la sonrisa y la **paleta plana** (pelo amarillo dorado, piel durazno, ojos verdes,
    vestido rosa/lila);
  - el **pixel art en cuadrícula** de cuerpo entero: referencia de cómo se resuelve en pocos
    píxeles (pelo amarillo con luces claras y naranjas, ojos azules/verdes pequeños, mejillas
    rosadas, vestido morado);
  - el **dibujo en cuaderno** (tonos lilas): solo referencia del encuadre y de que la cara se lee
    con pocos trazos. **Ignoralo en colores** (no uses sus lilas).
- **1 imagen de estilo**: la grilla de retratos de busto en pixel art (marco oscuro, fondo liso,
  ojos grandes, cabeza y hombros cortados por el borde de abajo). Copiá **solo el estilo de
  dibujo**, no esos personajes ni su marco, e ignorá los muñequitos pequeños al lado.
- **1 imagen de resultado de ejemplo**: un retrato animado ya terminado de otro personaje (4 cuadros
  con la misma cabeza; solo cambian la boca y los ojos). **Seguí exactamente ese formato de
  animación y ese nivel de detalle.**
- **1 guía de cuadrícula** (`Guia_Cuadricula_Retrato_48x64_4x1.png`): 4 cuadros de **48×64 px**
  con la grilla. Es solo una guía de tamaño y posición: **no dibujes las líneas ni los números**.

## Qué quiero

Un **retrato de busto de Rapunzel** para el cuadro de diálogo de un juego pixel art. El retrato va
a la izquierda del texto cuando ella habla.

### Encuadre y pose

- **Cara casi de frente, con la cabeza ligeramente inclinada y girada a 3/4**, mirando al
  espectador con una sonrisa dulce y un poco tímida, como en la foto. Cabeza y **hombros** visibles,
  cortados por el borde de abajo del cuadro.
- **La cabeza es lo principal:** ocupa cerca del 65 % del alto del cuadro, centrada.
- **Pelo rubio dorado LARGO y suelto**, con raya al costado y un flequillo largo que cae hacia un
  lado; el pelo enmarca la cara y **cae sobre los hombros a ambos lados** (llega hasta el borde de
  abajo del cuadro). Colores: base amarillo dorado, luces amarillo claro, sombras naranja. Tiene
  que **caber completo en el ancho del cuadro**.
- **Ojos verdes muy grandes** (iris verde con pupila negra y **dos brillos blancos**), con
  pestañas superiores marcadas; **cejas finas arqueadas** de color castaño.
- **Piel durazno claro** con sombras suaves en planos, **mejillas rosadas** y **unas pocas pecas**
  (2-3 puntitos) sobre la nariz.
- **Vestido lila/lavanda** con **escote cuadrado** bordeado de encaje blanco crema y un poco del
  **lazo/cordón** del corsé en el centro, con mangas abombadas apenas visibles en los hombros.
- **Sin flores en el pelo** y sin camaleón. No dibujes las manos.

## La animación: 4 cuadros en fila

Los 4 cuadros son **el mismo dibujo**, con la cabeza, el pelo, el vestido y los hombros en
**exactamente la misma posición** (ni un píxel de diferencia). Solo cambian la boca y los ojos:

1. **Neutral:** ojos abiertos, boca cerrada con sonrisa ladeada dulce.
2. **Habla A:** igual, con la boca entreabierta (pequeña).
3. **Habla B:** igual, con la boca abierta y sonriendo (más grande, con un poco de dientes
   blancos).
4. **Parpadeo:** los ojos cerrados (una línea curva oscura con las pestañas), boca cerrada.

En el juego, mientras ella habla se alterna 1 → 2 → 3 → 2, y de vez en cuando se intercala el
parpadeo (4). Por eso es clave que solo cambien la boca y los ojos.

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
  **no se puede usar** dentro del personaje: el vestido es **lila** (no magenta ni fucsia). **No
  dibujes marco, fondo de color ni texto**: el marco y el fondo los pone el juego.
- **Contorno de 1 px** alrededor del personaje y de las formas importantes, de un **marrón oscuro**
  (`#4A2A1C`, no negro puro), del mismo grosor en los 4 cuadros.
- **Paleta limitada (máximo ~18 colores en total):**
  - pelo: dorado base `#F2B83A`, luz `#FBE38A`, sombra `#D9822B`, sombra profunda `#A85A20`;
  - piel: durazno `#F9D2AE`, sombra `#E5A985`, mejillas `#F09A8E`;
  - ojos: iris verde `#4F9A4A` con borde oscuro `#2E6B36`, pupila `#1B1420`, esclerótica `#FFFFFF`,
    brillos `#FFFFFF`;
  - cejas y pestañas: `#7A4A2A`;
  - boca: labio `#D06A78`, interior `#6A1E2C`, dientes `#FFFFFF`;
  - vestido: lila `#B99AE0`, sombra `#8E6CC0`, luz `#DCC8F5`; encaje `#F4EBDD`; cordón `#E8907A`.
- **Luz desde arriba a la izquierda:** brillos en la parte alta del pelo y de la frente, sombra en
  la parte baja derecha. Igual en los 4 cuadros.
- **Sin texto, sin marca de agua, sin fondo escénico.**

## Antes de entregarme, verificá

- El resultado mide 192×64 px (o una escala entera exacta de eso) y los bloques son cuadrados y
  regulares.
- Los 4 cuadros tienen todo en la misma posición; solo cambian la boca y los ojos.
- El pelo está completo dentro del ancho del cuadro; solo los hombros y las puntas del pelo quedan
  cortados por el borde de abajo.
- No hay líneas de la guía, números, marco ni texto, y el fondo es magenta plano.
- Se lee bien en 48×64: los ojos verdes, el pelo dorado y el escote lila con encaje.

## Contexto (por qué importan estas reglas)

El retrato se muestra a tamaño 1:1 (48×64) dentro de un marco de 52×68 px en un juego con la vista
ampliada ×3 y reescalado nearest-neighbor. Cualquier suavizado, medio tono o desfase entre cuadros
se vería como un parpadeo raro al animar.
