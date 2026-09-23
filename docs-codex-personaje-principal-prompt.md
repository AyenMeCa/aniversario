# Prompt para Codex — Personaje principal (protagonista) en pixel art: reposo + caminata

Se genera **en 3 tandas**, una por dirección: **1) de frente**, **2) de espalda**, **3) de lado**.
Empezá siempre por la de **frente** (define el diseño). Para las otras dos, adjuntá además el
resultado de frente ya aprobado y pedí "el mismo personaje exacto".

Cada tanda es **una imagen con 2 filas** (la misma disposición que la plantilla):
- **Fila de arriba:** animación de **reposo** ("idle"), 4 cuadros (las 2 últimas celdas quedan
  **vacías**, en magenta).
- **Fila de abajo:** animación de **caminata**, 6 cuadros.

---

## PARTE COMÚN (pegar en las 3 tandas)

Adjunto:

- **Fotos de referencia** de la persona en la que se inspira el personaje (es la novia de quien
  hace el juego; el juego es un regalo de aniversario). Usalas **solo para captar rasgos generales
  y estilizarlos en pixel art** (peinado, gafas, tono de piel, contextura, ropa). **No hagas un
  retrato realista ni una copia fotográfica: es un personaje pixel art chibi estilizado.** En las
  fotos donde aparece otra persona, **ignorala por completo**: el personaje es solo la mujer de
  pelo rizado con gafas.
- **Un personaje ya terminado del juego** (por ejemplo la mesera "Tavern_B" o Tiana): referencia de
  **escala, encuadre y nivel de detalle** (personaje de pie, 64×64 por cuadro, cuerpo de unos 30 px
  de alto).
- **La PLANTILLA de animación de esa dirección** (`Plantilla_Personaje_Frente.png`,
  `Plantilla_Personaje_Espalda.png` o `Plantilla_Personaje_Lado.png`, según la tanda): 6 columnas ×
  2 filas de celdas de **64×64 px** (fila de arriba = reposo, 4 cuadros; fila de abajo = caminata,
  6 cuadros) con un **muñeco de colores planos** (cabeza naranja, torso azul, brazos magenta,
  piernas verdes) que ya trae **la animación exacta de cada cuadro**. La **línea blanca** es el
  piso (fila 48). **Es tu guía de movimiento: no dibujes las líneas ni el fondo gris ni el
  muñeco de colores.**

### Cómo usar la plantilla (lo más importante)

- **Pintá al personaje encima de la plantilla, cuadro por cuadro.** En cada celda, el muñeco marca
  **dónde están la cabeza, el torso, los brazos, las piernas y los pies en ese cuadro**. Tu
  personaje tiene que **ocupar esas mismas posiciones**: la cabeza donde está la naranja, el torso
  donde está el azul, los brazos donde están los magenta y las piernas/zapatos donde están los
  verdes, **con los pies apoyados en la línea blanca**. Así el movimiento (respiración, pasos,
  balanceo) sale idéntico al de la plantilla y los cuadros encajan entre sí.
- **Lo único que puede sobresalir de la plantilla:** el **pelo rizado enorme** (más ancho y alto
  que la cabeza naranja, tapa los costados y sube por arriba), la **ropa ancha** (la camiseta y el
  pantalón pueden ser 2-4 px más anchos que el torso y las piernas de la plantilla) y las **gafas**.
  Los **pies y el piso no se mueven** respecto de la plantilla.
- **El resultado no debe mostrar ningún color de la plantilla** (ni naranja, azul, magenta ni
  verde puros) ni el fondo gris ni las líneas: solo el personaje pintado, sobre fondo magenta
  plano.

### Cómo es el personaje

Una **chica joven, bajita, de cuerpo curvilíneo y proporciones chibi** (cabeza grande respecto del
cuerpo), en estilo pixel art amable y cálido, como los demás personajes del juego.

- **Cabello:** **negro, muy rizado y frondoso**, con volumen enorme (como una nube de rizos
  apretados) que **sobresale bastante a los lados de la cabeza y por encima**, más ancho que los
  hombros. Tiene **flequillo rizado** que cae sobre la frente. Dibujalo con **muchas "bolitas"
  rizadas en el contorno** (silueta ondulada) y unos pocos brillos marrón muy oscuro; que se lea
  como pelo afro/rizado, no como pelo liso.
- **Gafas:** **grandes, de montura fina dorada**, de forma cuadrada-redondeada con las puntas
  superiores levemente "de gato". Tienen que **leerse claramente** (el marco dorado) de frente y
  de lado.
- **Piel:** **trigueña tirando a morena**, marrón medio cálido, con sombras en planos.
- **Ojos:** **negros**, grandes y expresivos, detrás de las gafas, con un brillo pequeño.
- **Rasgo especial:** un **lunar pequeño y oscuro** (1 píxel) arriba del labio superior, **del lado
  izquierdo de quien mira la imagen** (en la vista de frente). Solo en la vista de frente.
- **Sonrisa** pequeña y tierna, sin dientes.
- **Cuerpo:** **baja de estatura**, de figura **curvilínea con el busto generoso**, pero **vestida
  con ropa ancha y holgada** que la tapa y suaviza la silueta (nada ajustado, nada exagerado).
- **Ropa:** **camiseta negra oversize** de manga corta (holgada, cae suelta sobre las caderas),
  con una **cadenita dorada fina** al cuello, **pantalón ancho gris claro** tipo jean holgado
  (bota ancha) y **zapatos oscuros**. Que se vea ropa cómoda y suelta.
- **Sin accesorios extra**, sin bolso, sin objetos en las manos.

### Tamaño y posición (importante)

- Cada celda es de **64×64 px**. El personaje mide **unos 30 px de alto** de la parte más alta del
  pelo hasta los zapatos (el pelo llega **cerca de la línea amarilla de la fila 18**) y sus
  **zapatos apoyan en la línea blanca de la fila 48**, en el mismo punto exacto en todos los
  cuadros de reposo. El pelo puede ser más ancho que el cuerpo: **el ancho total (con pelo) es de
  unos 22-26 px**, **centrado** en la celda.
- **Sobra mucho aire** alrededor: el personaje es chiquito, no llenes el cuadro.

### Estilo

- Pixel art **chibi** limpio, contorno oscuro de **1 px** (marrón muy oscuro `#2A1A16`, no negro
  puro), 3-4 tonos por zona, sombreado plano, **luz desde arriba a la izquierda**.
- **Paleta limitada, máximo ~20 colores:** pelo `#1E1512` con brillo `#3F2C25`; piel `#B87A55`
  con sombra `#8F5A3C` y luz `#D39A72`; labios `#9A5A55`; montura de las gafas `#E2B95C`
  (sombra `#B98A3A`) y cristales `#EAF2F6` semitransparentes (dibujalos como 1-2 colores planos
  claros, sin transparencia real); camiseta `#232A2F` con luz `#3C464D`; cadenita `#F0C674`;
  pantalón `#B7BEC4` con sombra `#8E969D` y luz `#D6DBDF`; zapatos `#2A2320`.
- **Sin antialiasing ni degradados**, bordes duros; el juego usa nearest-neighbor.

### Reglas técnicas (no negociables)

- **Tamaño exacto:** una imagen de **384×128 px** (6 columnas × 2 filas de celdas de 64×64), sin
  márgenes ni separación entre celdas. Si no podés generar exactamente 384×128, generá a una
  **escala entera** (×8 = 3072×1024) donde **cada píxel de arte sea un bloque cuadrado exacto del
  mismo tamaño en toda la imagen** (entero, sin decimales; **cuadrados, no rectangulares**), con la
  rejilla perfectamente regular. Sin medios píxeles.
- **Fondo magenta plano `#FF00FF`** (sin degradés, sin sombra, sin viñeta, sin ruido). Ese magenta
  **no puede aparecer dentro del personaje**. Las celdas vacías (fila de arriba, columnas 5 y 6)
  también van en magenta plano. **Sin sombra en el piso.**
- **Sin texto, sin marca de agua, sin números, sin líneas de la guía.**

---

## TANDA 1 — DE FRENTE (mirando al espectador, "hacia abajo" en el mapa)

**Fila de arriba, REPOSO (4 cuadros):** de pie, de frente, brazos caídos a los costados, mirando
al frente. La respiración (cabeza y torso que suben/bajan 1 px) **ya viene marcada en la
plantilla**: seguila. Además el pelo se "esponja" 1 px en los cuadros de arriba. **Los pies no se
mueven ni un píxel.**

**Fila de abajo, CAMINATA (6 cuadros):** camina **hacia el espectador**. Los pasos y el rebote
**vienen marcados en la plantilla** (contacto, baja, pasa, contacto con el otro pie, baja, pasa):
seguilos. Los brazos **se
balancean poco** (ropa ancha: la camiseta se mueve apenas), el pelo **rebota 1 px** con los pasos.
El lunar y las gafas se ven en todos los cuadros. El cuadro 6 tiene que enlazar con el 1 sin salto.

## TANDA 2 — DE ESPALDA (yéndose, "hacia arriba" en el mapa)

Mismo personaje visto **por detrás**: se ve la **nuca cubierta por el volumen enorme de rizos**
(sin cara, sin gafas ni lunar; solo se asoma el marco dorado apenas a los costados si el pelo lo
deja), la espalda de la **camiseta negra oversize** y el pantalón gris. Misma altura, mismo ancho,
mismos pies en la fila 48. Misma animación de reposo (respiración) y de caminata (6 cuadros, los
talones y suelas se ven al alejarse).

## TANDA 3 — DE LADO (perfil, mirando a la DERECHA)

Mismo personaje visto de **perfil hacia la derecha** (el juego la voltea para ir a la izquierda):
pelo rizado voluminoso detrás y encima, flequillo sobre la frente, gafas de perfil (patilla
dorada visible), nariz y sonrisa pequeñas, busto de perfil bajo la camiseta holgada. Mismas
alturas y pies en la fila 48. Reposo: respira apenas (cabeza y torso suben 1 px en los cuadros 2
y 3). Caminata: 6 cuadros con paso lateral claro (piernas que se cruzan, brazo que se balancea
poco), rebote de 1 px del cuerpo y del pelo.

---

## Antes de entregarme, verificá

- La imagen mide 384×128 px (o una escala entera exacta) con bloques cuadrados y regulares.
- El personaje mide ~30 px de alto, está centrado, y los zapatos están en la fila 48 en el mismo
  punto en todos los cuadros de reposo.
- Se lee claramente: **pelo rizado enorme, gafas doradas grandes, ropa ancha negra y gris**.
- Solo cambian lo que debe cambiar entre cuadros (respiración de 1 px, pasos, rebote de 1 px).
- No hay líneas de la guía, números ni sombra en el piso; el fondo y las 2 celdas vacías son
  magenta plano.

## Contexto (por qué importan estas reglas)

Es el personaje que controla el jugador en un mapa top-down con la vista ampliada ×3 y
reescalado nearest-neighbor. Los pies tienen que estar siempre en la misma fila para que las
colisiones encajen, y cualquier desfase o suavizado entre cuadros se vería como un temblor.
