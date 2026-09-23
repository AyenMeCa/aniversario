import { TIMELINE, LOCKED, REUNION, ENDING, TITLE_SCREEN, INTRO } from "./timeline.js?v=14";
import { MAP_BLUEPRINT, BUILDING_CHARS, CHAR_SCALE } from "./blueprint.js?v=12";

// ---------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------
// El mapa entero sale del plano en texto (src/blueprint.js). Para mover
// un edificio, cambiar el lago o dibujar otra avenida, se edita ese
// plano y listo: acá no hay coordenadas escritas a mano.
const TILE = 16;
const COLS = MAP_BLUEPRINT[0].length * CHAR_SCALE;
const ROWS = MAP_BLUEPRINT.length * CHAR_SCALE;
const VIEW_COLS = 22; // cuánto se ve en pantalla (la cámara hace scroll)
const VIEW_ROWS = 16;
const SCALE = 3;
const MOVE_TIME = 0.12;
// Tiles que se agregaron alrededor del plano original (pasto de margen en los
// 4 lados) y, además, arriba de todo para Mar Caribe. Las posiciones fijas de
// personajes y edificios van medidas contra el plano viejo y se corren con
// estas constantes.
// Donde arranca ella: la esquina superior izquierda del mapa (el tile 0 es el muro).
const SPAWN_TILE = { x: 1, y: 1 };
const MAP_PAD = 10;
const LEFT_PAD = MAP_PAD;
const TOP_PAD = MAP_PAD + 6;

// El plano solo marca DÓNDE va cada camino, no su ancho real: los
// bloques de 4x4 tiles quedaban todos con el mismo grosor (4 u 8 tiles,
// según cuántos caracteres se pegaran) sin ninguna jerarquía. Acá se
// define el ancho real: la avenida principal (la franja larga que cruza
// todo el mapa) queda más ancha que los caminos secundarios que salen
// de ella. narrowPaths() recorta la grilla ya expandida a estos anchos.
const MAIN_PATH_WIDTH = 6;
const SECONDARY_PATH_WIDTH = 3;
const MAIN_PATH_MIN_THICKNESS = 7; // grosor original a partir del cual se considera "principal"

const k = kaplay({
  width: VIEW_COLS * TILE,
  height: VIEW_ROWS * TILE,
  scale: SCALE,
  crisp: true,
  background: [86, 168, 92],
  font: "monospace",
  letterbox: true,
});
// Tileset real (Pixel Crawler). El terreno (pasto/agua/orilla/camino/
// puente) se "hornea" una sola vez a una imagen gigante (ver bakeTerrain
// más abajo) en vez de crear un sprite por tile: con ~16.000 tiles en
// este mapa, un objeto por tile hacía que el juego se sintiera con lag.
// Por eso acá cargamos las imágenes crudas (no via k.loadSprite) — las
// necesitamos como <img> para poder dibujarlas nosotros en un canvas.
// Sube este número cuando cambies una imagen sin cambiarle el nombre: evita que
// el navegador siga mostrando la versión vieja guardada en caché.
const ASSET_VERSION = 126;

// El progreso se guarda en localStorage, que pertenece al sitio y sobrevive
// al cierre del juego y del navegador. No usamos la caché HTTP: esa caché solo
// sirve para archivos y puede desaparecer o cambiar sin avisar.
const SAVE_KEY = "nuestro-camino-progreso-v1";
// Topes de volumen (0 a 1), pensados como ~40% del volumen "normal" original de cada pista.
const TITULO_VOLUMEN = 0.11; // 0.14 * 0.8 (-20% más)
const AMBIENTE_VOLUMEN = 0.1; // 0.12 * 0.8 (-20% más)
const MUSICAS_NPC = {
  // La pista de Tikki entra solo durante su conversación y queda en loop para
  // que el final de la canción no corte una escena larga.
  // Volumen ~40% del original (0.22 * 0.4 ≈ 0.09).
  hangares: { src: "Free/Tikki_Theme.mp3", volume: 0.09 },
  mar_caribe: { src: "Free/Tiana_Theme.mp3", volume: 0.09 },
  cienaga: { src: "Free/Rapunzel_Theme.mp3", volume: 0.09 },
  sierra_nevada: { src: "Free/Bibi_Theme.mp3", volume: 0.09 },
  cafeteria: { src: "Free/Koya_Theme.mp3", volume: 0.09 },
};
// Cada recompensa apunta al sprite que debe aparecer en el lugar del NPC.
// Se deja como tabla para poder añadir los objetos de Tiana, Rapunzel, Bibi y Koya.
const RECOMPENSA_SPRITES = {
  hangares: "objeto-aretes",
  mar_caribe: "objeto-tiara",
  cienaga: "objeto-sarten",
  sierra_nevada: "objeto-stardrop",
  cafeteria: "objeto-armybomb",
};
const RECOMPENSA_TEXTOS = {
  hangares: "Los aretes de Marinette: un par de aretes mágicos de mariquita que parecen iluminarse al recibirlos.",
  mar_caribe: "La tiara de Tiana: una tiara dorada y elegante, lista para acompañar un nuevo sueño.",
  cienaga: "El sartén de Rapunzel: su famoso sartén negro con un pequeño sol dorado, listo para una nueva aventura.",
  sierra_nevada: "¡Star Drop legendario! Lo abres con toda la emoción... y, como siempre, te salen 500 créditos.",
  cafeteria: "Un Army Bomb: su luz morada brilla como un pequeño recuerdo de todo lo que te gusta compartir con ella.",
};
// Sube el volumen de a poco (en vez de saltar de golpe) hasta "destino", en "duracion"
// segundos. Cancela cualquier fade anterior que siguiera corriendo sobre el mismo audio.
function fundirEntrada(audio, destino, duracion = 1.4) {
  if (audio.__fadeId) clearInterval(audio.__fadeId);
  audio.volume = 0;
  const pasos = 24;
  let i = 0;
  audio.__fadeId = setInterval(() => {
    i++;
    audio.volume = Math.min(destino, (destino * i) / pasos);
    if (i >= pasos) {
      clearInterval(audio.__fadeId);
      audio.__fadeId = null;
    }
  }, (duracion * 1000) / pasos);
}

let musicaDialogo = null;
// La música ambiente del juego (se crea al entrar a la escena "game"): al hablar con un NPC que
// tiene su propia canción, la ambiente se pausa y suena la del personaje; al cerrar el diálogo,
// la ambiente sigue donde quedó (no arranca de cero). Los cambios de volumen son graduales (ver
// fundirEntrada), no de golpe.
let musicaAmbiente = null;
function iniciarMusicaDialogo(npcId) {
  const musica = MUSICAS_NPC[npcId];
  if (!musica) return;
  if (musicaAmbiente) musicaAmbiente.pause();
  if (musicaDialogo) {
    musicaDialogo.pause();
    musicaDialogo.currentTime = 0;
  }
  musicaDialogo = new Audio(musica.src);
  musicaDialogo.loop = true;
  const reproduccion = musicaDialogo.play();
  if (reproduccion?.catch) reproduccion.catch(() => {});
  fundirEntrada(musicaDialogo, musica.volume);
}
function detenerMusicaDialogo() {
  if (!musicaDialogo) return;
  musicaDialogo.pause();
  musicaDialogo.currentTime = 0;
  musicaDialogo = null;
  if (musicaAmbiente) {
    const reproduccion = musicaAmbiente.play();
    if (reproduccion?.catch) reproduccion.catch(() => {});
    fundirEntrada(musicaAmbiente, musicaAmbiente.volume || AMBIENTE_VOLUMEN);
  }
}
function cargarProgreso() {
  try {
    const guardado = JSON.parse(localStorage.getItem(SAVE_KEY) || "null");
    if (!guardado || guardado.version !== 1 || !Array.isArray(guardado.collected)) return new Set();
    const idsValidos = new Set(TIMELINE.map((entrada) => entrada.id));
    return new Set(guardado.collected.filter((id) => idsValidos.has(id)));
  } catch (_error) {
    // Si el navegador bloquea localStorage o encuentra datos dañados, el juego
    // sigue funcionando como una partida nueva en vez de quedarse en blanco.
    return new Set();
  }
}
function guardarProgreso(collected) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ version: 1, collected: [...collected] }));
  } catch (_error) {
    // Algunos navegadores desactivan el almacenamiento local en modo privado;
    // en ese caso la partida continúa, aunque solo dure mientras la pestaña esté abierta.
  }
}
function loadImageEl(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = `${src}?v=${ASSET_VERSION}`;
  });
}
const [imgTiles, imgWater, imgIndustrial, imgFurniture, imgCafeteria, imgBiblioteca, imgMarCaribe, imgAulas, imgAulasSierra, imgBloque8, imgBloque3, imgPisoA, imgBordillo, imgBordilloCorte, imgDecoArbol, imgDecoFarola, imgDecoBanca, imgArbolGrande, imgVegetacion, imgRocas, imgCiudad, imgArbolL, imgArbolS, imgArbolX] =
  await Promise.all([
  loadImageEl("Pixel Crawler - Free Pack/Environment/Tilesets/Floors_Tiles.png"),
  loadImageEl("Pixel Crawler - Free Pack/Environment/Tilesets/Water_tiles.png"),
  loadImageEl("Free/Overworld_Industrial_Free.png"),
  loadImageEl("Pixel Crawler - Free Pack/Environment/Props/Static/Furniture.png"),
  loadImageEl("Free/Cafeteria_Building.png"),
  loadImageEl("Free/Biblioteca_Building.png"),
  loadImageEl("Free/MarCaribe_Building.png"),
  loadImageEl("Free/Cienaga_Building.png"),
  loadImageEl("Free/Sierra_Building.png"),
  loadImageEl("Free/Bloque8_Building.png"),
  loadImageEl("Free/Bloque3_Building.png"),
  loadImageEl("Free/Piso_Rombos_4x2.png"),
  loadImageEl("Free/Piso_Bordillo.png"),
  loadImageEl("Free/Piso_Bordillo_Recorte.png"),
  loadImageEl("Free/Deco_Arbol.png"),
  loadImageEl("Free/Deco_Farola.png"),
  loadImageEl("Free/Deco_Banca.png"),
  loadImageEl("Pixel Crawler - Free Pack/Environment/Props/Static/Trees/Model_01/Size_04.png"),
  loadImageEl("Pixel Crawler - Free Pack/Environment/Props/Static/Vegetation.png"),
  loadImageEl("Pixel Crawler - Free Pack/Environment/Props/Static/Rocks.png"),
  loadImageEl("Free/Overworld_City_Free.png"),
  loadImageEl("Pixel Crawler - Free Pack/Environment/Props/Static/Trees/Model_01/Size_05.png"),
  loadImageEl("Pixel Crawler - Free Pack/Environment/Props/Static/Trees/Model_01/Size_03.png"),
  loadImageEl("Pixel Crawler - Free Pack/Environment/Props/Static/Trees/Model_01/Size_02.png"),
]);
// Los Hangares: el pack industrial trae la pared del galpón ya armada
// como una sola imagen de 7x4 tiles (no hace falta trocearla por tile),
// en dos colores. La "broma" es literal: son bodegas alargadas de un
// piso, no hangares de avión — por eso el nombre. Se dibujan al doble
// de su tamaño de origen (HANGAR_TILE_W/H) para que se vean más grandes.
const HANGAR_SRC_TILE_W = 7;
const HANGAR_SRC_TILE_H = 4;
const HANGAR_TILE_W = HANGAR_SRC_TILE_W;
const HANGAR_TILE_H = HANGAR_SRC_TILE_H;
// Los Hangares van pegados al borde izquierdo del mapa (el tile 0 es el muro).
const HANGARES_X = 1;
const HANGAR_SRC = {
  blue: { sx: 0, sy: 0, sw: HANGAR_SRC_TILE_W * TILE, sh: HANGAR_SRC_TILE_H * TILE },
  green: { sx: 0, sy: 80, sw: HANGAR_SRC_TILE_W * TILE, sh: HANGAR_SRC_TILE_H * TILE },
};
// La Cafetería: un pabellón abierto con mesas (generado con
// IA en vista 3/4 y reducido a la grilla de 16px). Ocupa solo parte de su zona,
// arrimada al fondo, y bloquea el paso según su silueta.
const CAFETERIA_BUILDING_W = 11; // tiles (imagen: 176x112px, un pabellón abierto)
const CAFETERIA_BUILDING_H = 7;
const CAFETERIA_BUILDING_X = -8 + LEFT_PAD; // tile donde empieza el edificio
// La Biblioteca: un solo edificio (Gemini, reducido a la grilla de 16px).
const BIBLIOTECA_W = 23; // tiles (imagen: 368x176px)
const BIBLIOTECA_H = 11;
// Tiles de la imagen que realmente tienen edificio (>= 35% de píxeles
// opacos): el bloqueo sigue la silueta y no el rectángulo completo.
function opaqueTileMask(img, tilesW, tilesH, minCoverage) {
  const c = document.createElement("canvas");
  c.width = tilesW * TILE;
  c.height = tilesH * TILE;
  const cx = c.getContext("2d", { willReadFrequently: true });
  cx.drawImage(img, 0, 0, c.width, c.height);
  const data = cx.getImageData(0, 0, c.width, c.height).data;
  const mask = [];
  for (let ty = 0; ty < tilesH; ty++) {
    const row = [];
    for (let tx = 0; tx < tilesW; tx++) {
      let opaque = 0;
      for (let py = 0; py < TILE; py++) {
        for (let px = 0; px < TILE; px++) {
          const i = ((ty * TILE + py) * c.width + tx * TILE + px) * 4 + 3;
          if (data[i] > 127) opaque++;
        }
      }
      row.push(opaque / (TILE * TILE) >= minCoverage);
    }
    mask.push(row);
  }
  return mask;
}
// Mar Caribe: el edificio más grande del campus (unas 6 veces la altura del
// personaje), arrimado al fondo de su zona, de modo que el marcador de
// diálogo (justo debajo de la zona) quede a sus pies.
const MAR_CARIBE_W = 28; // tiles (imagen: 448x192px)
const MAR_CARIBE_H = 12;
const MAR_CARIBE_X = 31 + LEFT_PAD; // tile donde empieza el edificio (corrido a la izquierda de su zona)
const BIBLIOTECA_MASK = opaqueTileMask(imgBiblioteca, BIBLIOTECA_W, BIBLIOTECA_H, 0.35);
// Ciénaga Grande (y más adelante Sierra Nevada): mismo edificio de aulas de
// 3 pisos, solo cambia el nombre de la placa. Va arrimado al fondo de su zona
// y pegado a la derecha, para no pisar el lago que queda a su izquierda.
const AULAS_W = 22; // tiles (imagen: 352x144px)
const AULAS_H = 9;
const CIENAGA_X = 37 + LEFT_PAD; // tile donde empieza el edificio
const SIERRA_X = 37 + LEFT_PAD; // Sierra Nevada, en la misma columna que Ciénaga
// Bloque 8: edificio cuadrado de 2 pisos con entrada de arcos y techo de
// paneles solares. Va arriba de su zona (que es un rombo alto) y corrido a
// la izquierda, lejos del lago.
const BLOQUE8_W = 13; // tiles (imagen: 208x144px)
const BLOQUE8_H = 9;
const BLOQUE8_DROP = 4; // tiles que baja respecto del tope de su zona
const BLOQUE8_X = 2; // tile donde empieza el edificio
const MAR_CARIBE_MASK = opaqueTileMask(imgMarCaribe, MAR_CARIBE_W, MAR_CARIBE_H, 0.35);
const AULAS_MASK = opaqueTileMask(imgAulas, AULAS_W, AULAS_H, 0.35);
// Bloque 3 (el del reencuentro): edificio alargado de 2 pisos, centrado en su
// zona y arrimado al fondo, para que el marcador quede a sus pies.
const BLOQUE3_W = 20; // tiles (imagen: 320x128px)
const BLOQUE3_H = 8;
const BLOQUE8_MASK = opaqueTileMask(imgBloque8, BLOQUE8_W, BLOQUE8_H, 0.35);
const BLOQUE3_MASK = opaqueTileMask(imgBloque3, BLOQUE3_W, BLOQUE3_H, 0.35);
const CAFETERIA_MASK = opaqueTileMask(imgCafeteria, CAFETERIA_BUILDING_W, CAFETERIA_BUILDING_H, 0.35);
const BIBLIOTECA_X = 36 + LEFT_PAD; // tile donde empieza el edificio (a 3 tiles del borde derecho)
const TILE_FRAMES = {
  grass: 10 * 25 + 2, // fila 10, columna 2: pasto sólido sin recortes
  water: 0 * 25 + 0, // fila 0, columna 0: agua sólida sin espuma
  path: 10 * 25 + 7, // fila 10, columna 7: roca sólida (la que va con el pasto)
};
// Texturas reales del puente (Furniture.png): se pisan
// tile por tile a mano según se van definiendo. Furniture.png tiene 50
// columnas de 16px (el doble que los otros tilesets), por eso se dibuja
// con drawRC (fila/columna directa) en vez de un índice de frame único.
// (Las claves "x,y" de abajo están medidas contra el plano original, sin los
// márgenes que se le agregaron: al dibujar se les resta LEFT_PAD/TOP_PAD.)
// Puente vertical sobre el canal del oeste (entre Los Hangares y Bloque 8):
// es el mismo puente de madera de arriba, girado 90 grados. Ocupa 2 tiles de
// ancho y cruza los 4 tiles de agua del canal, con una punta sobre la tierra
// a cada lado.
// Lago redondeado e irregular en el oeste (tiles x 2 a 17, y 31 a 44), donde
// antes empezaba el canal: varios círculos de radios distintos que se pisan,
// para que el borde no quede parejo. El canal sigue hacia el este desde acá.
const LAGO_REDONDO = [
  { cx: 9.6, cy: 37.4, r: 5.9 },
  { cx: 5.4, cy: 33.8, r: 3.3 },
  { cx: 13.2, cy: 33.0, r: 2.8 },
  { cx: 13.4, cy: 41.6, r: 3.2 },
  { cx: 5.2, cy: 41.6, r: 3.1 },
  { cx: 9.8, cy: 43.2, r: 2.7 },
  { cx: 3.6, cy: 37.6, r: 2.3 },
];
// Lago al norte del canal, entre el camino A/J y el camino vertical del este:
// ocupa el pasto que quedaba bajo el camino diagonal y se une al canal y al lago
// largo. El borde norte baja en escalones de 3 tiles de ancho y 2 de alto (como la
// diagonal) y deja siempre un tile de pasto entre el agua y el piso.
const LAGO_NORTE = [
  { x0: 24, x1: 25, y0: 24 },
  { x0: 26, x1: 28, y0: 26 },
  { x0: 29, x1: 31, y0: 28 },
  { x0: 32, x1: 34, y0: 30 },
  { x0: 35, x1: 37, y0: 32 },
];
const LAGO_NORTE_Y1 = 41;
// Franja de camino junto al lado este del camino A, hasta el camino J, y sin
// farolas (ni en la franja ni en el borde de A que ahora queda dentro del piso).
const CAMINO_A_ANEXO = { x0: 21, y0: 20, x1: 22, y1: 30 };
// Camino angosto (2 tiles) por el borde este, desde la plaza de Ciénaga hasta el
// camino I, con un tile de enlace a las plazas de Ciénaga y Sierra Nevada.
const CAMINO_BORDE_ESTE = [
  { x0: 69, y0: 42, x1: 70, y1: 86 },
  { x0: 68, y0: 42, x1: 68, y1: 46 },
  { x0: 68, y0: 58, x1: 68, y1: 60 },
];
// Plaza bajo La Cafetería: une los caminos E, F y G en un solo piso (cubre el pasto que
// quedaba entre ellos) y va sin árboles ni farolas.
const PLAZA_CAFETERIA = { x0: 1, y0: 82, x1: 18, y1: 95 };
const enPlazaCafeteria = (x, y) => x >= PLAZA_CAFETERIA.x0 && x <= PLAZA_CAFETERIA.x1 && y >= PLAZA_CAFETERIA.y0 && y <= PLAZA_CAFETERIA.y1;
// Terraza de cafetería en la plaza de La Cafetería: mesas redondas (CoffeeShopStuff) con
// 2 sillas al sur y una a cada lado (Overworld_Indoors_Free). [x del centro de la mesa en
// tiles (sobre la línea entre dos tiles), fila del tile base de la mesa]. La mesa ocupa 2
// tiles de ancho y 1 de alto; cada silla su tile. Todo bloquea solo su base.
const TERRAZA_MESAS = [
  [6, 85], [10, 85], [14, 85],
  [6, 89], [10, 89], [14, 89],
  [6, 93], [10, 93], [14, 93],
];
function terrazaPiezas() {
  const piezas = [];
  TERRAZA_MESAS.forEach(([bx, fila]) => {
    const cx = bx * TILE;
    const base = (fila + 1) * TILE;
    const dz = fila * 0.0005;
    piezas.push({ sprite: "terraza-mesa", x: cx - 17, y: base - 17, baseY: fila * TILE, dz, tiles: [[bx - 1, fila], [bx, fila]] });
    piezas.push({ sprite: "terraza-silla-lado", flip: true, x: cx - 25, y: base - 16, baseY: fila * TILE, dz: dz + 0.0001, tiles: [[bx - 2, fila]] });
    piezas.push({ sprite: "terraza-silla-lado", x: cx + 13, y: base - 16, baseY: fila * TILE, dz: dz + 0.0001, tiles: [[bx + 1, fila]] });
    piezas.push({ sprite: "terraza-silla-atras-1", x: cx - 14, y: base - 4, baseY: (fila + 1) * TILE, dz: (fila + 1) * 0.0005, tiles: [[bx - 1, fila + 1]] });
    piezas.push({ sprite: "terraza-silla-atras-2", x: cx + 2, y: base - 4, baseY: (fila + 1) * TILE, dz: (fila + 1) * 0.0005, tiles: [[bx, fila + 1]] });
  });
  return piezas;
}
const SIN_FAROLAS = { x0: 20, y0: 19, x1: 22, y1: 30 };
const enSinFarolas = (d) => d.x >= SIN_FAROLAS.x0 && d.x <= SIN_FAROLAS.x1 && d.y >= SIN_FAROLAS.y0 && d.y <= SIN_FAROLAS.y1;
// Plazas frente a Mar Caribe, Ciénaga, Sierra Nevada y la biblioteca, unidas por
// un camino ancho (5 tiles) con árboles en el centro. Todo usa el mismo piso de
// rombos grandes, así que el dibujo continúa sin cortes entre plaza y camino.
// Son solo visuales: el suelo sigue siendo pasto caminable. El tile del piso
// se elige por posición absoluta: hoja de 4x2 tiles, [y % 2][x % 4].
const PLAZAS = [
  { x0: 40, y0: 20, x1: 67, y1: 27 }, // Mar Caribe
  { x0: 45, y0: 42, x1: 67, y1: 46 }, // Ciénaga
  { x0: 45, y0: 58, x1: 67, y1: 60 }, // Sierra Nevada
  { x0: 40, y0: 73, x1: 68, y1: 79 }, // Biblioteca
];
const CAMINOS = [{ x0: 40, y0: 28, x1: 44, y1: 72 }];
// Decoración de las plazas. Bloquean el paso: la banca entera, la farola solo en
// su base (última fila) y el árbol solo en el tile de la base del tronco (el del
// medio de la última fila): se puede caminar bajo la copa.
// Caminos rectos de 5 tiles de ancho (como el camino vertical y el diagonal).
// dir "v": ocupa x0..x0+4 y y0..y1. dir "h": ocupa y0..y0+4 y x0..x1. En cada
// uno van árboles al centro cada 7 tiles y una farola en cada borde después de
// cada árbol (ver generarDecorCaminos). Todo se salta si choca con algo.
const CAMINOS_LARGOS = [
  { dir: "v", x0: 16, y0: 16, y1: 30 }, // A: baja desde la diagonal
  { dir: "h", y0: 26, x0: 1, x1: 20 }, // B: sobre el lago redondo
  { dir: "h", y0: 71, x0: 18, x1: 39 }, // C: al sur del lago, hasta la plaza de la biblioteca
  { dir: "v", x0: 21, y0: 68, y1: 93 }, // D: pasa por Namjoon
  { dir: "h", y0: 82, x0: 2, x1: 18 }, // E: bajo la cafetería
  { dir: "v", x0: 14, y0: 87, y1: 91 }, // F: une E con G
  { dir: "h", y0: 91, x0: 1, x1: 25 }, // G: la de abajo
  { dir: "v", x0: 48, y0: 80, y1: 88 }, // H: bajo la plaza de la biblioteca
  { dir: "h", y0: 87, x0: 48, x1: 70 }, // I: hacia el borde derecho
  { dir: "v", x0: 18, y0: 31, y1: 70 }, // J: baja entre los dos lagos, cruza el canal por el puente y llega a C y D
];
// Plaza redonda junto a Bloque 8: un anillo de piso (mismo rombo y bordillo que
// el resto) de unos 3 tiles de ancho, unido por la derecha al camino J. En el
// centro hay un jardín de pasto con un árbol grande (Pixel Crawler, modelo 01
// tamaño 04) y, alrededor, matorrales, flores, hongos y rocas chicas.
const PLAZA_REDONDA = {
  cx: 8.5, cy: 66.5, // centro, en tiles (el árbol queda en el tile 8,66)
  rExt: 6.8, rInt: 3.9,
  conector: { x0: 12, y0: 64, x1: 17, y1: 68 },
  arbol: { srcX: 3, srcY: 2, w: 73, h: 126 },
  // Camino recto desde la puerta de Bloque 8 hasta el anillo (entre las dos puertas).
  camino: { x0: 5, y0: 57, x1: 11, y1: 61 },
};
// Máquina expendedora (Overworld_City_Free, 24x32 px) pegada a la fachada de
// Bloque 8, bajo la ventana derecha. Bloquea los 2 tiles de su base.
const MAQUINA = { sx: 128, sy: 96, w: 24, h: 32 };
// Segunda máquina, al pie de la Biblioteca (x en px, y = arriba del sprite; base en la fila 72).
const MAQUINA_BIBLIOTECA = { x: 1016, y: 73 * 16 + 2 - 32 };
// Y una en Ciénaga Grande (base en la fila 41).
const MAQUINA_CIENAGA = { x: 806, y: 42 * 16 + 2 - 32 };
// Estacionamiento al norte de Mar Caribe: asfalto liso (Overworld_City_Free) con
// bordillo gris, 4 plazas de 7 tiles (sin rayas), un pasillo de 2 tiles debajo y
// 3 autos de lado ampliados 2 veces. Los autos bloquean el paso.
const PARQUEADERO = {
  x0: 41, y0: 2, x1: 69, y1: 7,
  plazaX0: 42, plazaW: 7, plazas: 4, filaY0: 2, filaY1: 5,
  escala: 2,
  asfalto: { sx: 288, sy: 352 },
  autos: [
    { plaza: 0, sx: 0, sy: 216, w: 38, h: 24 }, // auto azul
    { plaza: 2, sx: 96, sy: 212, w: 46, h: 28 }, // camioneta gris
    { plaza: 3, sx: 0, sy: 216, w: 38, h: 24 }, // auto azul
  ],
};
// Bosque cerrado al noreste del camino diagonal (x 10 a 38), pegado a su borde: árboles frondosos del
// pack (Modelo 01, tamaños 05, 04 y 03, en verde, olivo y ámbar/naranja) que se
// solapan, con el suelo oscurecido y sotobosque abajo. Todos los tiles del bosque
// bloquean el paso; quedan 2 tiles de pasto libre junto al estacionamiento. Los árboles son objetos del juego (la copa tapa al personaje).
// Datos generados aparte: [tamaño, color, tile x, tile y de la base del tronco, 1 si es
// del bosquecillo abierto de Los Hangares (bloquea solo el tronco y la copa se
// vuelve translúcida cuando el personaje pasa detrás)].
const enBosque = (x, y) => x >= 10 && x <= 38 && y >= 1 && y + 0.5 < 0.7 * (x + 0.5) - 2.06;
const BOSQUE_TAM = { L: { w: 106, h: 160 }, M: { w: 73, h: 126 }, S: { w: 48, h: 96 }, X: { w: 32, h: 62 } };
const BOSQUE_ORIGEN = {
  L: { G: [1, 0], O: [113, 0], N: [1, 160], A: [113, 160] },
  M: { G: [3, 2], O: [83, 2], N: [3, 130], A: [83, 130] },
  S: { G: [0, 0], O: [48, 0], N: [0, 96], A: [48, 96] },
  X: { G: [32, 2], O: [96, 2], N: [32, 66], A: [96, 66] }, // árbol joven (Size_02)
};
const BOSQUE_ARBOLES = [
  ["S", "O", 29, 1],["S", "G", 37, 1],["L", "O", 12, 2],["L", "G", 17, 2],
  ["M", "O", 22, 2],["L", "G", 26, 2],["M", "G", 32, 2],["S", "G", 10, 4],
  ["S", "O", 29, 4],["L", "G", 35, 4],["M", "O", 13, 5],["S", "O", 19, 5],
  ["S", "G", 25, 5],["S", "O", 31, 6],["S", "O", 17, 7],["L", "G", 21, 7],
  ["L", "G", 28, 7],["S", "O", 34, 7],["M", "O", 37, 7],["S", "G", 15, 8],
  ["L", "G", 25, 10],["L", "G", 31, 10],["M", "O", 35, 10],["S", "G", 19, 11],
  ["S", "G", 22, 11],["S", "G", 31, 13],["M", "G", 37, 13],["L", "O", 28, 14],
  ["S", "G", 25, 15],["S", "G", 34, 15],["S", "G", 32, 16],["S", "G", 28, 17],
  ["M", "G", 37, 17],["S", "G", 31, 19],["L", "G", 35, 20],["M", "G", 37, 22],
  ["S", "O", 2, 8, 1],["S", "G", 5, 11, 1],["S", "G", 2, 12, 1],["S", "O", 7, 12, 1],
  ["S", "G", 9, 13, 1],["L", "O", 4, 14, 1],["S", "G", 11, 14, 1],["S", "G", 2, 16, 1],
  ["L", "G", 8, 16, 1],["S", "N", 13, 16, 1],
  // Borde este de Mar Caribe y franja de pasto entre su plaza y Ciénaga.
  ["S", "O", 70, 10, 1],["S", "N", 69, 13, 1],["S", "G", 70, 16, 1],["S", "G", 69, 19, 1],
  ["S", "G", 70, 22, 1],["S", "G", 69, 25, 1],["S", "O", 70, 28, 1],["S", "G", 46, 31, 1],
  ["S", "A", 50, 30, 1],["S", "G", 54, 32, 1],["S", "O", 57, 30, 1],["S", "O", 61, 31, 1],
  ["S", "G", 64, 32, 1],["S", "G", 67, 30, 1],
  // Franjas al oeste de Ciénaga y Sierra Nevada y esquinas de arriba de la biblioteca.
  ["S", "G", 46, 34, 1],["S", "O", 46, 37, 1],["S", "G", 46, 40, 1],["S", "G", 46, 50, 1],
  ["S", "A", 46, 53, 1],["S", "O", 46, 56, 1],["S", "G", 46, 63, 1],["S", "G", 63, 62, 1],
  ["S", "O", 68, 64, 1],
  // Árbol grande junto a La Cafetería (bloquea solo el tronco).
  ["L","G",17,78,1],
  // Borde sur (y96-100): bosquecillos con un árbol ancla y jóvenes alrededor, separados por claros.
  ["X","O",66,95,1],["X","G",68,95,1],["X","O",47,96,1],["S","A",51,96,1],["X","G",59,96,1],
  ["X","G",54,97,1],["S","O",57,97,1],["X","G",33,98,1],["X","G",36,98,1],["X","G",44,98,1],
  ["X","G",61,98,1],["X","G",64,98,1],["X","G",3,99,1],["X","O",11,99,1],["X","O",42,99,1],
  ["S","O",48,99,1],["X","O",50,99,1],["X","G",52,99,1],["X","O",6,100,1],["S","O",8,100,1],
  ["S","G",17,100,1],["S","G",21,100,1],["X","O",25,100,1],["S","O",27,100,1],["S","G",31,100,1],
  ["S","O",40,100,1],["X","A",58,100,1],["M","O",66,100,1],
  // Arbolito en la isla de Sapo (tronco en 32,53): con dx=1 px la copa tapa un poco al sapo.
  ["X","G",32,53,1,1],
];
// Sotobosque y grupos al pie de los árboles (Vegetation.png): [sx, sy, ancho, alto, x, y] en px del mapa.
// Orilla de los lagos (sin árboles): juncos y matas junto al agua, algunos arbustos
// con roca y hongos al pie, rocas chicas y unos pocos cúmulos de flores (un color por
// cúmulo). [imagen "veg"/"roc", sx, sy, w, h, x, y, 1 si bloquea su tile de base].
const ORILLA_PIEZAS = [
  ["veg", 112, 160, 16, 32, 604, 944],["veg", 80, 176, 16, 16, 612, 959],["veg", 96, 176, 16, 16, 611, 959],["veg", 128, 160, 16, 32, 602, 735],
  ["veg", 112, 176, 16, 16, 594, 750],["veg", 128, 160, 16, 32, 481, 415],["veg", 176, 176, 16, 16, 475, 431],["veg", 128, 160, 16, 32, 398, 1040],
  ["veg", 96, 176, 16, 16, 392, 1057],["veg", 176, 176, 16, 16, 407, 1057],["veg", 128, 160, 16, 32, 479, 1038],["veg", 96, 176, 16, 16, 470, 1053],
  ["veg", 112, 160, 16, 32, 370, 383],["veg", 160, 176, 16, 16, 377, 398],["veg", 96, 176, 16, 16, 379, 400],["veg", 144, 160, 16, 32, 434, 383],
  ["veg", 160, 176, 16, 16, 426, 400],["veg", 160, 176, 16, 16, 441, 398],["veg", 144, 160, 16, 32, 189, 720],["veg", 160, 176, 16, 16, 196, 736],
  ["veg", 128, 160, 16, 32, 538, 1024],["veg", 112, 176, 16, 16, 532, 1039],["veg", 144, 160, 16, 32, 53, 478],["veg", 112, 176, 16, 16, 61, 494],
  ["veg", 176, 176, 16, 16, 61, 493],["veg", 128, 160, 16, 32, 495, 878],["veg", 160, 176, 16, 16, 502, 894],["veg", 128, 160, 16, 32, 146, 479],
  ["veg", 160, 176, 16, 16, 138, 494],["veg", 112, 160, 16, 32, 35, 655],["veg", 160, 176, 16, 16, 41, 671],["veg", 128, 160, 16, 32, 576, 480],
  ["veg", 80, 176, 16, 16, 567, 496],["veg", 144, 160, 16, 32, 605, 640],["veg", 176, 176, 16, 16, 597, 656],["veg", 160, 176, 16, 16, 597, 655],
  ["veg", 144, 160, 16, 32, 528, 448],["veg", 160, 176, 16, 16, 520, 464],["veg", 128, 160, 16, 32, 110, 704],["veg", 176, 176, 16, 16, 119, 719],
  ["veg", 176, 176, 16, 16, 102, 719],["veg", 128, 160, 16, 32, 50, 704],["veg", 176, 176, 16, 16, 56, 720],["veg", 112, 160, 16, 32, 602, 574],
  ["veg", 96, 176, 16, 16, 608, 589],["veg", 176, 176, 16, 16, 609, 589],["veg", 144, 160, 16, 32, 250, 512],["veg", 176, 176, 16, 16, 257, 528],
  ["veg", 160, 176, 16, 16, 256, 527],["veg", 128, 160, 16, 32, 241, 687],["veg", 160, 176, 16, 16, 250, 704],["veg", 96, 176, 16, 16, 250, 702],
  ["veg", 144, 160, 16, 32, 38, 544],["veg", 112, 176, 16, 16, 45, 559],["veg", 128, 160, 16, 32, 374, 479],["veg", 160, 176, 16, 16, 368, 496],
  ["veg", 96, 176, 16, 16, 383, 496],["veg", 128, 160, 16, 32, 272, 622],["veg", 112, 176, 16, 16, 266, 638],["veg", 144, 160, 16, 32, 22, 590],
  ["veg", 96, 176, 16, 16, 16, 607],["veg", 144, 160, 16, 32, 374, 656],["veg", 80, 176, 16, 16, 368, 671],["veg", 144, 160, 16, 32, 372, 430],
  ["veg", 176, 176, 16, 16, 379, 446],["veg", 144, 160, 16, 32, 605, 896],["veg", 112, 176, 16, 16, 597, 913],["veg", 128, 160, 16, 32, 605, 687],
  ["veg", 160, 176, 16, 16, 597, 704],["veg", 160, 176, 16, 16, 599, 704],["veg", 50, 5, 29, 27, 570, 1045, 1],["roc", 176, 16, 16, 16, 561, 1057],
  ["veg", 48, 336, 16, 16, 593, 1060],["veg", 32, 336, 16, 16, 600, 1063],["veg", 50, 5, 29, 27, 74, 725, 1],["roc", 160, 16, 16, 16, 65, 737],
  ["veg", 48, 336, 16, 16, 97, 740],["veg", 32, 336, 16, 16, 104, 743],["veg", 2, 5, 29, 27, 218, 741, 1],["roc", 176, 16, 16, 16, 239, 753],
  ["veg", 48, 336, 16, 16, 207, 756],["veg", 32, 336, 16, 16, 214, 759],["veg", 2, 5, 29, 27, 410, 1077, 1],["roc", 176, 16, 16, 16, 401, 1089],
  ["veg", 48, 336, 16, 16, 433, 1092],["veg", 32, 336, 16, 16, 440, 1095],["veg", 2, 5, 29, 27, 10, 517, 1],["roc", 160, 16, 16, 16, 1, 529],
  ["veg", 48, 336, 16, 16, 33, 532],["veg", 32, 336, 16, 16, 40, 535],["roc", 176, 48, 16, 16, 623, 817],["roc", 176, 48, 16, 16, 273, 497],
  ["roc", 176, 48, 16, 16, 369, 353],["roc", 176, 16, 16, 16, 625, 625],["veg", 128, 416, 16, 16, 621, 1074],["veg", 96, 416, 16, 16, 608, 1073],
  ["veg", 48, 416, 16, 16, 613, 1070],["veg", 128, 416, 16, 16, 614, 1073],["veg", 128, 416, 16, 16, 609, 1075],["veg", 64, 416, 16, 16, 620, 1078],
  ["veg", 48, 416, 16, 16, 120, 750],["veg", 144, 416, 16, 16, 120, 758],["veg", 80, 416, 16, 16, 126, 754],["veg", 64, 416, 16, 16, 115, 755],
  ["veg", 144, 416, 16, 16, 115, 753],["veg", 112, 416, 16, 16, 112, 754],["veg", 48, 416, 16, 16, 515, 1091],["veg", 48, 416, 16, 16, 514, 1094],
  ["veg", 144, 416, 16, 16, 518, 1087],["veg", 144, 416, 16, 16, 530, 1093],["veg", 144, 416, 16, 16, 518, 1089],["veg", 80, 416, 16, 16, 519, 1092],
  ["veg", 128, 416, 16, 16, 29, 754],["veg", 96, 416, 16, 16, 28, 758],["veg", 64, 416, 16, 16, 36, 754],["veg", 144, 416, 16, 16, 21, 757],
  ["veg", 64, 416, 16, 16, 261, 736],["veg", 48, 416, 16, 16, 254, 740],["veg", 96, 416, 16, 16, 266, 742],["veg", 80, 416, 16, 16, 261, 741],
  // Arbustos con roca y hongos en dos esquinas del campo de flores.
  ["veg",2,5,29,27,426,1221,1],["roc",160,16,16,16,447,1233],["veg",48,336,16,16,415,1236],["veg",32,336,16,16,422,1239],
  ["veg",2,5,29,27,714,1333,1],["roc",160,16,16,16,705,1345],["veg",48,336,16,16,737,1348],["veg",32,336,16,16,744,1351],
  // Anillo cerrado de arbustos redondos alrededor del árbol grande (al este de La Cafetería y bajo la
  // plaza redonda), con hierbas chicas y unas pocas flores por dentro. Cada arbusto bloquea su tile.
  ["veg",2,5,29,27,234,1093,1],["veg",2,5,29,27,250,1093,1],["veg",2,5,29,27,266,1093,1],["veg",2,5,29,27,218,1109,1],
  ["veg",2,5,29,27,266,1109,1],["veg",112,384,16,16,228,1132],["veg",48,144,16,16,245,1133],["veg",144,384,16,16,231,1133],
  ["veg",2,5,29,27,10,1125,1],["veg",2,5,29,27,26,1125,1],["veg",2,5,29,27,42,1125,1],["veg",2,5,29,27,202,1125,1],
  ["veg",2,5,29,27,218,1125,1],["veg",2,5,29,27,266,1125,1],["veg",112,384,16,16,219,1137],["veg",64,384,16,16,218,1142],
  ["veg",144,368,16,16,202,1150],["veg",96,368,16,16,201,1150],["veg",2,5,29,27,42,1141,1],
  ["veg",2,5,29,27,58,1141,1],["veg",2,5,29,27,186,1141,1],["veg",2,5,29,27,202,1141,1],["veg",2,5,29,27,266,1141,1],
  ["veg",64,368,16,16,196,1153],["veg",144,368,16,16,201,1154],["veg",96,176,16,16,229,1162],["veg",16,144,16,16,30,1166],
  ["veg",2,5,29,27,106,1157,1],["veg",2,5,29,27,122,1157,1],
  ["veg",2,5,29,27,138,1157,1],["veg",2,5,29,27,154,1157,1],["veg",2,5,29,27,170,1157,1],["veg",2,5,29,27,186,1157,1],
  ["veg",2,5,29,27,266,1157,1],["veg",48,144,16,16,65,1168],["veg",32,144,16,16,198,1168],["veg",80,176,16,16,108,1173],
  ["veg",48,144,16,16,86,1173],["veg",80,176,16,16,148,1175],["veg",32,144,16,16,178,1175],["veg",96,176,16,16,128,1175],
  ["veg",64,384,16,16,240,1180],["veg",48,384,16,16,242,1182],
  ["veg",2,5,29,27,266,1173,1],["veg",112,384,16,16,243,1187],["veg",80,176,16,16,222,1198],
  ["veg",2,5,29,27,266,1189,1],["veg",80,176,16,16,248,1211],["veg",2,5,29,27,282,1205,1],
  ["veg",2,5,29,27,298,1205,1],["veg",2,5,29,27,314,1205,1],["veg",80,176,16,16,226,1219],
  ["veg",2,5,29,27,314,1221,1],["veg",48,144,16,16,297,1237],["veg",48,144,16,16,229,1241],
  ["veg",2,5,29,27,314,1237,1],["veg",144,416,16,16,237,1262],
  ["veg",2,5,29,27,314,1253,1],["veg",96,416,16,16,251,1265],["veg",16,144,16,16,272,1265],["veg",64,416,16,16,248,1266],
  ["veg",144,416,16,16,244,1267],["veg",2,5,29,27,298,1269,1],["veg",2,5,29,27,218,1285,1],
  ["veg",2,5,29,27,234,1285,1],["veg",2,5,29,27,250,1285,1],["veg",2,5,29,27,266,1285,1],["veg",2,5,29,27,282,1285,1],
  ["veg",2,5,29,27,298,1285,1],
];
// Campo de flores al sur de la plaza de la biblioteca y al norte de Bloque 3 (x27-46,
// y77-84), con 1 tile de pasto liso contra caminos y edificio. Sigue cómo crecen las
// flores silvestres: manchas alargadas (drifts) de un solo color, densas en el centro
// y ralas hacia los bordes, con el mismo color repetido en varios sitios, unas pocas
// digitales altas al fondo y hojitas al pie. Todo es decorativo: no bloquea el paso.
// CAMPO_FLORES: [columna, fila de Vegetation.png (23 naranja, 24 blanca, 25 azul, 26
// amarilla), x, y de la celda 16x16]; CAMPO_HOJAS: brotes (fila 9); CAMPO_DIGITALES:
// espigas 16x32 (fila 10); CAMPO_PARCHES: [cx, cy, rx, ry, color] manchas de pasto.
const CAMPO_FLORES = [
  [3,24,465,1250],[6,24,479,1248],[9,24,534,1247],[8,24,473,1238],[5,24,528,1239],[10,24,569,1243],[6,24,537,1255],[3,25,572,1247],
  [4,24,515,1237],[3,24,513,1270],[9,24,564,1254],[9,24,543,1255],[6,24,455,1249],[3,24,540,1241],[6,24,476,1258],[7,24,556,1241],
  [3,24,529,1269],[3,25,489,1249],[6,24,504,1262],[7,24,526,1251],[9,24,470,1251],[9,24,550,1258],[3,24,560,1250],[6,24,551,1247],
  [9,24,492,1254],[7,24,489,1241],[6,24,487,1256],[6,24,560,1245],[2,24,494,1231],[7,24,513,1255],[1,25,546,1269],[9,24,543,1249],
  [5,24,485,1263],[7,24,527,1262],[9,24,461,1245],[7,24,512,1246],[10,24,541,1263],[2,24,525,1277],[3,24,498,1256],[8,25,491,1269],
  [6,25,495,1243],[5,24,521,1240],[9,24,503,1244],[9,24,508,1257],[6,24,545,1243],[6,24,504,1256],[10,24,506,1270],[9,24,525,1256],
  [7,24,578,1242],[6,24,525,1245],[3,24,480,1254],[9,25,515,1261],[10,24,467,1260],[6,25,520,1254],[6,25,496,1251],[0,24,511,1278],
  [0,24,475,1267],[6,24,472,1246],[2,24,496,1276],[3,24,498,1267],[3,24,548,1251],[2,24,536,1232],[9,24,565,1247],[10,24,505,1237],
  [7,24,478,1241],[7,25,494,1260],[6,24,508,1251],[1,24,545,1234],[6,24,532,1256],[6,24,518,1247],[9,24,555,1253],[4,24,557,1262],
  [7,24,521,1262],[4,24,536,1276],[3,24,484,1245],[4,24,482,1233],[9,24,533,1263],[1,24,523,1232],[7,24,475,1254],[6,24,483,1250],
  [6,24,502,1251],[9,24,458,1254],[0,24,483,1273],[9,24,579,1248],[3,24,522,1271],[3,25,463,1277],[4,25,456,1270],[3,25,485,1281],
  [8,25,446,1286],[3,24,460,1287],[7,25,472,1277],[3,25,443,1272],[3,25,447,1278],[7,25,455,1281],[9,25,480,1278],[9,24,480,1285],
  [0,25,461,1296],[7,25,474,1283],[7,25,467,1289],[7,25,456,1276],[6,25,449,1271],[6,25,490,1283],[4,25,474,1295],[8,25,453,1290],
  [9,25,467,1281],[10,25,466,1268],[3,25,460,1282],[6,25,468,1273],[6,25,442,1281],[3,26,603,1270],[3,26,577,1267],[1,26,591,1261],
  [7,26,559,1276],[6,26,545,1280],[6,26,583,1274],[3,26,577,1260],[7,26,595,1270],[3,26,593,1278],[7,26,555,1283],[6,26,586,1268],
  [9,26,553,1274],[5,23,567,1261],[7,23,588,1274],[4,26,564,1294],[3,26,570,1272],[7,23,564,1276],[3,26,577,1275],[3,26,557,1270],
  [9,26,583,1281],[3,26,564,1270],[9,26,600,1275],[5,26,553,1291],[10,26,572,1291],[4,26,571,1284],[4,26,578,1286],[3,26,563,1282],
  [6,26,568,1279],[6,26,542,1274],[3,26,550,1280],[9,26,547,1275],[3,26,540,1279],[2,26,585,1290],[5,26,546,1287],[10,25,602,1250],
  [9,25,589,1240],[6,25,596,1247],[6,24,584,1234],[6,25,603,1245],[3,25,595,1239],[10,25,588,1250],[9,25,574,1235],[9,25,583,1240],
  [6,25,590,1245],[8,25,592,1232],[6,25,579,1237],[9,26,479,1305],[3,26,574,1324],[9,26,551,1304],[7,26,547,1322],[10,26,544,1331],
  [3,26,466,1315],[3,26,630,1333],[3,26,612,1314],[9,24,458,1317],[7,26,450,1310],[8,26,525,1322],[3,26,500,1312],[5,26,631,1323],
  [9,26,499,1307],[6,26,480,1318],[8,26,599,1307],[8,24,519,1329],[7,26,512,1296],[9,26,469,1309],[3,26,559,1318],[7,26,610,1328],
  [6,26,529,1301],[7,26,464,1305],[5,24,625,1318],[7,26,621,1330],[9,26,512,1309],[3,26,529,1289],[9,26,535,1306],[6,26,614,1324],
  [7,26,609,1320],[9,26,568,1319],[7,26,571,1309],[3,24,576,1315],[9,26,593,1325],[7,26,561,1302],[9,26,489,1299],[9,26,555,1309],
  [5,26,555,1327],[9,26,594,1317],[3,26,599,1321],[5,26,531,1327],[7,24,631,1328],[7,26,584,1309],[7,26,548,1311],[7,26,477,1311],
  [10,26,472,1320],[9,26,529,1314],[9,26,521,1309],[4,26,584,1335],[0,26,450,1302],[9,24,582,1317],[2,26,562,1340],[9,26,592,1332],
  [3,26,543,1305],[7,26,498,1301],[7,26,621,1323],[6,26,542,1310],[10,26,499,1322],[6,24,443,1312],[3,26,545,1317],[8,26,548,1296],
  [6,26,491,1306],[6,26,504,1307],[8,26,589,1303],[6,26,491,1316],[3,26,457,1309],[9,26,627,1328],[8,26,581,1301],[3,24,539,1317],
  [9,26,598,1327],[7,26,484,1309],[6,26,583,1326],[9,26,537,1312],[3,26,554,1319],[2,26,486,1331],[9,26,505,1316],[6,24,520,1303],
  [3,26,563,1310],[5,26,573,1332],[4,26,565,1329],[4,26,604,1333],[1,26,511,1329],[9,26,527,1308],[5,26,449,1318],[10,26,554,1299],
  [3,26,507,1291],[10,26,615,1335],[6,26,601,1315],[5,26,496,1290],[3,26,441,1307],[10,26,486,1292],[7,26,605,1324],[9,26,578,1321],
  [9,26,515,1317],[0,26,470,1328],[3,26,617,1328],[5,26,541,1295],[2,26,496,1331],[6,26,513,1303],[3,26,589,1315],[7,26,567,1313],
  [6,26,472,1304],[6,26,577,1308],[8,26,502,1284],[9,26,535,1321],[7,26,587,1320],[6,26,521,1293],[7,26,495,1310],[7,26,503,1296],
  [4,26,491,1325],[6,26,507,1303],[2,24,577,1339],[7,24,555,1314],[3,26,574,1302],[9,26,593,1310],[3,26,531,1309],[2,26,442,1322],
  [7,26,522,1316],[9,26,485,1303],[3,26,538,1288],[3,26,636,1327],[1,26,536,1337],[3,26,534,1293],[9,26,461,1310],[3,26,563,1323],
  [1,26,600,1340],[1,26,555,1336],[1,26,589,1343],[5,24,568,1299],[3,26,515,1288],[5,26,462,1323],[6,26,538,1301],[5,23,668,1321],
  [9,23,662,1315],[3,23,692,1323],[6,23,701,1316],[7,23,707,1311],[7,26,679,1308],[4,23,692,1333],[9,23,690,1314],[3,23,681,1323],
  [4,26,655,1322],[5,23,650,1301],[10,26,707,1329],[7,26,733,1309],[3,23,655,1308],[8,23,720,1323],[3,23,718,1305],[7,23,690,1307],
  [1,23,729,1320],[9,23,698,1309],[3,23,665,1304],[5,23,684,1297],[9,23,723,1310],[3,23,708,1320],[3,23,667,1312],[3,23,673,1308],
  [9,23,696,1316],[8,23,708,1297],[10,23,672,1326],[2,26,681,1333],[6,23,729,1313],[3,23,712,1313],[3,26,675,1316],[3,23,699,1300],
  [4,26,698,1328],[5,23,650,1315],[9,23,704,1304],[5,26,659,1300],[7,23,671,1302],[2,23,700,1337],[9,23,711,1305],[7,23,656,1314],
  [6,23,728,1308],[6,23,717,1318],[7,23,687,1319],[6,23,718,1310],[6,23,646,1309],[9,23,678,1300],[6,23,681,1313],[3,23,663,1308],
  [7,23,668,1307],[7,23,701,1322],[10,23,691,1298],[1,23,694,1291],[1,23,667,1293],[3,23,678,1293],[7,23,723,1317],[2,23,724,1299],
  [2,23,715,1294],[3,26,686,1328],[4,23,665,1331],[6,23,686,1310],[3,23,684,1303],[5,23,714,1324],[0,26,686,1288],[10,24,715,1346],
  [9,24,708,1343],[7,24,721,1342],[3,24,650,1338],[6,24,673,1340],[6,24,714,1338],[7,24,686,1333],[4,24,724,1335],[9,24,696,1342],
  [6,26,659,1336],[7,26,684,1341],[3,24,665,1337],[9,24,726,1340],[8,24,662,1348],[3,24,688,1347],[7,24,674,1333],[8,24,679,1348],
  [3,24,705,1336],[5,24,669,1348],[6,24,645,1338],[7,24,658,1342],[9,24,678,1341],[8,24,648,1346],[3,24,716,1331],[6,24,692,1339],
  [3,24,665,1343],[3,24,702,1348],[6,24,719,1337],[1,24,653,1330],[6,24,703,1342],[5,23,495,1338],[6,23,466,1345],[7,26,443,1336],
  [8,23,448,1347],[9,26,480,1344],[4,23,441,1344],[3,23,489,1340],[8,23,477,1332],[6,23,458,1339],[9,23,472,1335],[6,23,467,1340],
  [4,23,459,1346],[7,26,449,1339],[5,23,456,1329],[9,23,461,1334],[7,23,482,1338],[6,23,473,1342],[10,23,448,1330],[6,23,454,1341],
  [5,23,488,1348],[7,23,477,1339],[5,23,474,1350],[7,23,454,1335],[7,23,439,1339],[9,23,485,1343],[6,24,554,1341],[5,24,549,1346],
  [7,24,548,1340],[6,24,543,1338],[3,24,567,1338],[9,24,593,1339],[6,24,582,1344],[10,24,570,1347],[6,24,585,1340],[7,24,605,1342],
  [7,24,559,1347],[4,25,595,1346],[6,24,561,1334],[9,24,571,1341],[5,24,541,1345],[7,25,722,1292],[6,25,701,1290],[9,25,672,1295],
  [5,25,708,1291],[3,25,697,1295],[7,25,704,1294],[6,25,689,1293],[2,26,638,1303],[5,25,456,1225],[10,25,612,1263],[8,23,429,1348],
  [4,24,621,1293],[10,25,438,1234],[2,25,607,1300],[0,24,425,1340],[0,25,598,1288],[4,26,425,1271],[2,23,439,1295],[1,26,564,1231],
  [10,24,427,1227],[10,26,442,1242],[5,25,631,1345],[2,23,604,1226],[0,25,426,1283],[8,25,744,1340],[8,26,640,1350],[1,23,430,1256],
  [0,23,505,1341],[1,23,617,1305],[4,24,525,1346],[8,23,449,1234],[10,24,642,1294],[10,25,744,1351],
];
const CAMPO_HOJAS = [
  [1,9,481,1252],[1,9,538,1258],[3,9,575,1251],[2,9,567,1260],[3,9,546,1261],[3,9,456,1252],[2,9,476,1262],[3,9,531,1274],
  [1,9,473,1255],[1,9,550,1263],[1,9,552,1252],[1,9,561,1249],[2,9,516,1259],[2,9,458,1249],[3,9,494,1248],[1,9,508,1262],
  [3,9,527,1260],[2,9,523,1251],[3,9,514,1266],[3,9,518,1257],[3,9,474,1251],[1,9,496,1272],[1,9,549,1254],[2,9,507,1257],
  [1,9,521,1253],[1,9,519,1266],[2,9,485,1254],[1,9,504,1257],[3,9,460,1259],[1,9,577,1252],[1,9,465,1283],[3,9,485,1284],
  [3,9,457,1292],[1,9,445,1275],[1,9,445,1281],[3,9,456,1284],[3,9,478,1290],[3,9,471,1289],[2,9,493,1287],[1,9,469,1287],
  [1,9,457,1285],[2,9,602,1276],[3,9,577,1272],[2,9,558,1280],[3,9,543,1284],[3,9,594,1274],[2,9,593,1281],[1,9,557,1288],
  [3,9,586,1271],[2,9,586,1279],[2,9,580,1287],[3,9,563,1274],[3,9,599,1278],[3,9,571,1284],[2,9,541,1278],[1,9,547,1279],
  [2,9,589,1244],[1,9,596,1252],[1,9,584,1240],[2,9,572,1240],[3,9,580,1246],[3,9,587,1251],[1,9,477,1308],[3,9,548,1309],
  [2,9,465,1321],[2,9,632,1338],[1,9,456,1321],[3,9,498,1313],[3,9,467,1313],[3,9,532,1304],[2,9,622,1333],[1,9,510,1313],
  [1,9,527,1293],[2,9,611,1330],[2,9,591,1328],[1,9,561,1306],[3,9,592,1323],[1,9,630,1333],[1,9,583,1313],[3,9,546,1315],
  [1,9,518,1314],[1,9,584,1323],[2,9,590,1337],[2,9,546,1308],[2,9,500,1307],[3,9,622,1326],[2,9,542,1315],[1,9,443,1318],
  [1,9,548,1320],[2,9,491,1310],[1,9,454,1315],[1,9,542,1321],[3,9,597,1330],[2,9,583,1332],[1,9,507,1321],[2,9,528,1314],
  [3,9,504,1294],[1,9,602,1320],[1,9,607,1327],[3,9,579,1327],[1,9,513,1309],[3,9,567,1318],[1,9,472,1307],[1,9,574,1313],
  [2,9,585,1324],[2,9,497,1314],[2,9,508,1308],[3,9,572,1306],[1,9,591,1314],[2,9,483,1306],[1,9,538,1292],[1,9,634,1333],
  [1,9,460,1314],[2,9,566,1327],[3,9,661,1318],[1,9,701,1322],[1,9,684,1327],[1,9,734,1314],[2,9,718,1308],[2,9,693,1313],
  [2,9,706,1323],[2,9,665,1318],[2,9,676,1312],[1,9,674,1319],[3,9,703,1307],[1,9,670,1308],[1,9,713,1309],[3,9,663,1311],
  [1,9,667,1313],[2,9,703,1325],[2,9,725,1323],[1,9,688,1315],[3,9,718,1345],[1,9,672,1343],[3,9,689,1336],[1,9,693,1347],
  [2,9,662,1341],[3,9,662,1342],[2,9,727,1344],[1,9,707,1341],[1,9,648,1344],[2,9,656,1346],[1,9,713,1335],[3,9,705,1352],
  [1,9,703,1345],[3,9,440,1340],[1,9,477,1347],[1,9,474,1338],[2,9,469,1344],[3,9,451,1342],[3,9,485,1342],[2,9,451,1347],
  [3,9,479,1343],[2,9,456,1340],[3,9,436,1345],[2,9,487,1349],[1,9,553,1344],[3,9,568,1341],[2,9,593,1342],[3,9,580,1349],
  [1,9,585,1344],[1,9,604,1348],[1,9,561,1352],[2,9,559,1339],[1,9,724,1296],[3,9,669,1301],[3,9,689,1296],
];
const CAMPO_DIGITALES = [[12,10,475,1227],[12,10,497,1230],[13,10,593,1222],[12,10,688,1288],[12,10,715,1286]];
const CAMPO_PARCHES = [
  [528, 1270, 92, 30, "rgba(10,60,10,0.16)"],
  [528, 1322, 105, 26, "rgba(10,60,10,0.15)"],
  [696, 1328, 60, 24, "rgba(10,60,10,0.15)"],
  [472, 1272, 34, 22, "rgba(170,230,90,0.12)"],
  [640, 1310, 40, 18, "rgba(170,230,90,0.09)"],
  [584, 1349, 44, 16, "rgba(170,230,90,0.08)"],
];
const BOSQUE_PIEZAS = [
  [48, 336, 16, 16, 530, 16],[32, 336, 16, 16, 542, 21],[16, 336, 16, 16, 522, 22],[80, 176, 16, 16, 232, 27],
  [96, 176, 16, 16, 243, 37],[96, 176, 16, 16, 234, 33],[80, 144, 32, 32, 167, 36],[16, 144, 16, 16, 223, 51],
  [0, 144, 16, 16, 229, 45],[112, 176, 16, 16, 183, 72],[96, 176, 16, 16, 188, 66],[80, 176, 16, 16, 194, 72],
  [98, 5, 29, 27, 187, 70],[80, 144, 32, 32, 599, 70],[32, 144, 16, 16, 201, 90],[32, 144, 16, 16, 207, 98],
  [80, 144, 32, 32, 282, 85],[2, 5, 29, 27, 218, 103],[50, 5, 29, 27, 524, 105],[2, 5, 29, 27, 249, 119],
  [98, 5, 29, 27, 521, 120],[2, 99, 43, 43, 258, 126],[50, 99, 43, 43, 516, 125],[96, 176, 16, 16, 328, 155],
  [96, 176, 16, 16, 341, 159],[80, 176, 16, 16, 337, 155],[96, 176, 16, 16, 523, 159],[96, 176, 16, 16, 531, 161],
  [96, 176, 16, 16, 523, 159],[50, 99, 43, 43, 308, 156],[50, 5, 29, 27, 331, 166],[112, 176, 16, 16, 369, 169],
  [112, 176, 16, 16, 364, 183],[80, 176, 16, 16, 367, 179],[96, 176, 16, 16, 347, 188],[112, 176, 16, 16, 336, 189],
  [80, 176, 16, 16, 335, 198],[2, 5, 29, 27, 346, 184],[80, 144, 32, 32, 361, 179],[80, 176, 16, 16, 363, 210],
  [96, 176, 16, 16, 370, 208],[80, 176, 16, 16, 365, 202],[48, 336, 16, 16, 480, 207],[32, 336, 16, 16, 492, 212],
  [16, 336, 16, 16, 472, 213],[80, 144, 32, 32, 406, 212],[2, 99, 43, 43, 465, 205],[96, 176, 16, 16, 423, 249],
  [96, 176, 16, 16, 422, 257],[80, 176, 16, 16, 428, 250],[48, 336, 16, 16, 466, 255],[32, 336, 16, 16, 478, 260],
  [16, 336, 16, 16, 458, 261],[80, 176, 16, 16, 467, 273],[112, 176, 16, 16, 453, 278],[80, 176, 16, 16, 469, 271],
  [50, 99, 43, 43, 514, 251],[0, 144, 16, 16, 505, 287],[48, 144, 16, 16, 516, 293],[2, 5, 29, 27, 524, 282],
  [16, 144, 16, 16, 520, 323],[32, 144, 16, 16, 515, 326],[96, 176, 16, 16, 533, 317],[112, 176, 16, 16, 538, 326],
  [96, 176, 16, 16, 536, 316],[50, 5, 29, 27, 568, 329],[96, 176, 16, 16, 612, 346],[80, 176, 16, 16, 603, 337],
  [80, 176, 16, 16, 611, 346],[48, 336, 16, 16, 558, 352],[32, 336, 16, 16, 570, 357],[16, 336, 16, 16, 550, 358],
  [80, 144, 32, 32, 586, 358],[80, 144, 32, 32, 602, 356],[48, 144, 16, 16, 610, 391],[32, 144, 16, 16, 617, 390],
  [48, 336, 16, 16, 298, 40],[32, 336, 16, 16, 310, 45],[16, 336, 16, 16, 288, 46],[0, 336, 16, 16, 302, 50],
  [48, 336, 16, 16, 570, 248],[32, 336, 16, 16, 582, 253],[16, 336, 16, 16, 560, 254],[0, 336, 16, 16, 574, 258],
  [48, 336, 16, 16, 490, 72],[32, 336, 16, 16, 502, 77],[16, 336, 16, 16, 480, 78],[0, 336, 16, 16, 494, 82],
  [48, 336, 16, 16, 330, 184],[32, 336, 16, 16, 342, 189],[16, 336, 16, 16, 320, 190],[0, 336, 16, 16, 334, 194],
  [48, 336, 16, 16, 234, 88],[32, 336, 16, 16, 246, 93],[16, 336, 16, 16, 224, 94],[0, 336, 16, 16, 238, 98],
  [48, 336, 16, 16, 576, 216],[32, 336, 16, 16, 588, 221],[16, 336, 16, 16, 566, 222],[0, 336, 16, 16, 580, 226],
  [48, 336, 16, 16, 432, 120],[32, 336, 16, 16, 444, 125],[16, 336, 16, 16, 422, 126],[0, 336, 16, 16, 436, 130],
  [48, 336, 16, 16, 544, 328],[32, 336, 16, 16, 556, 333],[16, 336, 16, 16, 534, 334],[0, 336, 16, 16, 548, 338],
  [48, 336, 16, 16, 618, 24],[32, 336, 16, 16, 630, 29],[16, 336, 16, 16, 608, 30],[0, 336, 16, 16, 622, 34],
  [48, 336, 16, 16, 426, 168],[32, 336, 16, 16, 438, 173],[16, 336, 16, 16, 416, 174],[0, 336, 16, 16, 430, 178],
  [48, 336, 16, 16, 586, 168],[32, 336, 16, 16, 598, 173],[16, 336, 16, 16, 576, 174],[0, 336, 16, 16, 590, 178],
  [48, 336, 16, 16, 474, 280],[32, 336, 16, 16, 486, 285],[16, 336, 16, 16, 464, 286],[0, 336, 16, 16, 478, 290],
  [0, 352, 16, 16, 466, 106],[16, 352, 16, 16, 490, 74],[0, 352, 16, 16, 586, 330],[0, 352, 16, 16, 530, 74],
  [2, 5, 29, 27, 636, 58],[50, 5, 29, 27, 636, 106],[96, 368, 16, 16, 639, 160],[112, 368, 16, 16, 632, 164],
  [112, 368, 16, 16, 638, 172],[48, 368, 16, 16, 638, 172],[2, 5, 29, 27, 620, 170],[2, 5, 29, 27, 620, 234],
  [2, 5, 29, 27, 620, 266],[2, 5, 29, 27, 636, 266],[48, 336, 16, 16, 160, 262],[32, 336, 16, 16, 172, 267],
  [16, 336, 16, 16, 152, 268],[2, 5, 29, 27, 80, 216],[98, 5, 29, 27, 96, 168],[2, 5, 29, 27, 128, 184],
  [96, 176, 16, 16, 15, 134],[112, 176, 16, 16, 15, 133],[96, 176, 16, 16, 15, 130],[2, 5, 29, 27, 148, 216],
  [2, 5, 29, 27, 180, 248],[2, 5, 29, 27, 4, 248],[80, 176, 16, 16, 57, 193],[112, 176, 16, 16, 61, 196],
  [80, 176, 16, 16, 71, 200],[98, 5, 29, 27, 116, 200],[0, 144, 16, 16, 140, 237],[16, 144, 16, 16, 34, 227],
  [16, 144, 16, 16, 221, 254],[16, 144, 16, 16, 112, 220],[16, 144, 16, 16, 82, 236],[32, 144, 16, 16, 67, 175],
  [48, 144, 16, 16, 141, 257],[16, 144, 16, 16, 159, 242],[48, 144, 16, 16, 16, 209],[16, 144, 16, 16, 60, 224],
  [48, 336, 16, 16, 1104, 166],[32, 336, 16, 16, 1116, 171],[50, 5, 29, 27, 1092, 344],[48, 336, 16, 16, 1104, 454],
  [32, 336, 16, 16, 1116, 459],[16, 336, 16, 16, 1096, 460],[48, 336, 16, 16, 768, 502],[32, 336, 16, 16, 780, 507],
  [16, 336, 16, 16, 760, 508],[48, 336, 16, 16, 832, 486],[32, 336, 16, 16, 844, 491],[16, 336, 16, 16, 824, 492],
  [80, 144, 32, 32, 878, 502],[80, 144, 32, 32, 926, 470],[112, 176, 16, 16, 997, 498],[80, 176, 16, 16, 1001, 504],
  [96, 176, 16, 16, 1016, 502],[48, 336, 16, 16, 1056, 518],[32, 336, 16, 16, 1068, 523],[16, 336, 16, 16, 1048, 524],
  [50, 5, 29, 27, 1088, 472],
  // Setos de arbustos entre plazas y bajo Sierra Nevada (el 7.º valor 1 = bloquea su tile de base).
  [48, 336, 16, 16, 720, 548],[32, 336, 16, 16, 726, 551],[16, 336, 16, 16, 716, 552],[112, 176, 16, 16, 718, 596],
  [112, 176, 16, 16, 716, 595],[48, 336, 16, 16, 720, 644],[32, 336, 16, 16, 726, 647],[16, 336, 16, 16, 716, 648],
  [96, 176, 16, 16, 724, 802],[96, 176, 16, 16, 723, 804],[48, 336, 16, 16, 720, 852],[32, 336, 16, 16, 726, 855],
  [16, 336, 16, 16, 716, 856],[48, 336, 16, 16, 992, 996],[32, 336, 16, 16, 998, 999],[16, 336, 16, 16, 988, 1000],
  [48, 336, 16, 16, 1072, 1028],[32, 336, 16, 16, 1078, 1031],[16, 336, 16, 16, 1068, 1032],[2, 5, 29, 27, 762, 757, 1],
  [2, 5, 29, 27, 826, 757, 1],[50, 5, 29, 27, 890, 757, 1],[98, 5, 29, 27, 954, 757, 1],[50, 5, 29, 27, 1018, 757, 1],
  [48, 336, 16, 16, 800, 756],[32, 336, 16, 16, 808, 759],[16, 336, 16, 16, 794, 760],[112, 176, 16, 16, 871, 755],
  [96, 176, 16, 16, 869, 755],[96, 176, 16, 16, 857, 756],[48, 336, 16, 16, 928, 756],[32, 336, 16, 16, 936, 759],
  [16, 336, 16, 16, 922, 760],[48, 336, 16, 16, 992, 756],[32, 336, 16, 16, 1000, 759],[16, 336, 16, 16, 986, 760],
  [96, 176, 16, 16, 1051, 756],[96, 176, 16, 16, 1053, 755],[112, 176, 16, 16, 1061, 756],[2, 5, 29, 27, 778, 965, 1],
  [2, 5, 29, 27, 842, 965, 1],[2, 5, 29, 27, 906, 965, 1],[98, 5, 29, 27, 970, 965, 1],[2, 5, 29, 27, 1034, 965, 1],
  [96, 176, 16, 16, 821, 976],[80, 176, 16, 16, 822, 977],[80, 176, 16, 16, 808, 978],[96, 176, 16, 16, 883, 980],
  [96, 176, 16, 16, 878, 979],[80, 176, 16, 16, 883, 976],[80, 144, 32, 32, 936, 962],[96, 176, 16, 16, 1012, 980],
  [80, 176, 16, 16, 1003, 980],[112, 176, 16, 16, 1007, 979],[48, 336, 16, 16, 1072, 980],[32, 336, 16, 16, 1080, 983],
  [16, 336, 16, 16, 1066, 984],
  // Sotobosque del borde sur.
  [48,336,16,16,32,1590],[32,336,16,16,44,1595],[16,336,16,16,24,1596],[2,5,29,27,192,1576],[112,176,16,16,313,1599],[80,176,16,16,484,1599],
  [48,336,16,16,512,1574],[32,336,16,16,524,1579],[16,336,16,16,504,1580],[48,336,16,16,608,1574],[32,336,16,16,620,1579],[16,336,16,16,600,1580],
  [80,176,16,16,636,1600],[80,176,16,16,616,1599],[112,176,16,16,617,1598],[112,176,16,16,650,1582],[112,176,16,16,649,1591],[96,176,16,16,656,1587],
  [96,176,16,16,798,1582],[80,176,16,16,791,1591],[80,176,16,16,805,1591],[80,144,32,32,786,1526],[48,336,16,16,848,1558],[32,336,16,16,860,1563],
  [16,336,16,16,840,1564],[2,5,29,27,768,1528],[2,5,29,27,816,1576],[80,144,32,32,802,1574],[2,5,29,27,884,1544],[98,5,29,27,960,1528],
  [80,176,16,16,1016,1572],[112,176,16,16,1014,1567],[112,176,16,16,997,1569],[80,176,16,16,953,1599],[112,176,16,16,962,1599],[98,5,29,27,1072,1512],
  [50,5,29,27,996,1560],[80,144,32,32,1058,1510],[96,176,16,16,740,1566],[112,176,16,16,726,1571],[112,176,16,16,744,1575],[0,144,16,16,621,1586],
  [16,144,16,16,78,1583],[0,144,16,16,319,1550],[0,144,16,16,189,1600],[32,144,16,16,432,1566],[48,144,16,16,797,1601],[48,144,16,16,337,1584],
  [16,144,16,16,483,1550],[48,144,16,16,659,1601],[0,144,16,16,1053,1550],[32,144,16,16,397,1554],[48,144,16,16,770,1569],[48,144,16,16,419,1600],
  [32,144,16,16,354,1536],
  // Hierbas chicas del borde sur: al pie de los troncos, junto al bordillo, al pie del muro y en el prado.
  [48,144,16,16,860,1465],[32,144,16,16,955,1467],[0,144,16,16,871,1468],[32,144,16,16,775,1469],[32,144,16,16,963,1469],[16,144,16,16,767,1470],[16,144,16,16,853,1470],
  [48,144,16,16,762,1472],[32,192,16,16,1104,1522],[48,144,16,16,1097,1523],[16,144,16,16,292,1529],[112,176,16,16,380,1531],[32,144,16,16,23,1532],[32,144,16,16,30,1532],
  [112,176,16,16,152,1533],[96,176,16,16,389,1533],[96,176,16,16,926,1536],[32,144,16,16,295,1537],[0,144,16,16,378,1537],[32,144,16,16,739,1538],[32,144,16,16,934,1538],
  [112,176,16,16,814,1539],[0,144,16,16,590,1543],[0,144,16,16,598,1545],[96,176,16,16,31,1546],[0,144,16,16,872,1549],[112,176,16,16,881,1551],[112,176,16,16,29,1552],
  [32,144,16,16,897,1553],[16,144,16,16,874,1555],[32,144,16,16,904,1555],[32,192,16,16,911,1558],[96,176,16,16,896,1560],[80,176,16,16,887,1561],[16,144,16,16,749,1562],
  [96,176,16,16,741,1564],[48,144,16,16,989,1565],[0,192,16,16,1012,1565],[80,176,16,16,192,1565],[32,192,16,16,722,1566],[96,176,16,16,563,1567],[80,224,16,16,716,1567],
  [80,176,16,16,994,1569],[112,176,16,16,185,1570],[112,176,16,16,513,1571],[16,144,16,16,523,1571],[48,144,16,16,570,1571],[32,144,16,16,708,1571],[48,144,16,16,981,1571],
  [16,144,16,16,1036,1571],[112,176,16,16,1017,1571],[16,144,16,16,750,1573],[0,144,16,16,820,1579],[16,144,16,16,230,1580],[0,144,16,16,680,1581],[0,192,16,16,812,1581],
  [96,224,16,16,217,1581],[112,176,16,16,784,1582],[16,144,16,16,206,1582],[48,144,16,16,65,1583],[16,144,16,16,56,1583],[96,176,16,16,161,1584],[112,176,16,16,750,1584],
  [112,176,16,16,687,1585],[32,144,16,16,656,1585],[16,144,16,16,819,1585],[0,192,16,16,789,1586],[48,144,16,16,756,1587],[112,176,16,16,776,1587],[0,144,16,16,807,1587],
  [48,144,16,16,666,1588],[48,144,16,16,215,1590],[0,144,16,16,625,1595],[48,144,16,16,219,1595],[96,224,16,16,110,1595],[16,144,16,16,421,1595],[16,144,16,16,549,1595],
  [32,144,16,16,658,1595],[0,144,16,16,258,1596],[32,192,16,16,208,1596],[80,224,16,16,322,1596],[48,144,16,16,309,1596],[80,176,16,16,858,1596],[48,144,16,16,970,1596],
  [112,176,16,16,486,1597],[96,176,16,16,916,1597],[96,176,16,16,195,1597],[96,224,16,16,668,1597],[48,144,16,16,750,1597],[16,192,16,16,1097,1597],[48,144,16,16,382,1598],
  [0,192,16,16,631,1598],[16,144,16,16,30,1598],[32,144,16,16,740,1598],[16,144,16,16,852,1598],[96,176,16,16,988,1598],[112,176,16,16,1088,1598],[80,224,16,16,105,1599],
  [112,176,16,16,316,1599],[112,176,16,16,390,1599],[0,192,16,16,937,1599],[48,192,16,16,187,1599],[112,176,16,16,557,1599],[48,192,16,16,441,1600],[16,144,16,16,505,1600],
  [32,144,16,16,38,1600],[16,144,16,16,24,1600],[96,176,16,16,540,1600],[32,144,16,16,117,1601],[0,144,16,16,355,1601],[0,144,16,16,325,1601],[16,144,16,16,452,1601],
  [0,144,16,16,512,1601],[32,144,16,16,1068,1601],[80,176,16,16,1044,1601],[96,224,16,16,1037,1601],[112,176,16,16,213,1601],[16,192,16,16,413,1601],[48,144,16,16,661,1601],
  [48,144,16,16,759,1601],[112,176,16,16,863,1601],[32,144,16,16,1110,1601],[48,144,16,16,262,1602],[80,176,16,16,348,1602],[32,144,16,16,481,1602],[16,192,16,16,624,1602],
  [96,176,16,16,943,1602],[48,144,16,16,421,1602],
];
// Oscurecido del suelo: más oscuro cuanto más adentro del bosque.
const BOSQUE_SUELO = (() => {
  const out = [];
  for (let y = 0; y < 30; y++) {
    for (let x = 10; x <= 38; x++) {
      if (!enBosque(x, y)) continue;
      let d = 4;
      for (let r = 1; r <= 3 && d === 4; r++) {
        for (const [dx, dy] of [[r, 0], [-r, 0], [0, r], [0, -r], [r, r], [-r, -r], [r, -r], [-r, r]]) {
          if (!enBosque(x + dx, y + dy) && y + dy >= 0) { d = r; break; }
        }
      }
      out.push([x, y, [0, 30, 55, 75, 90][d] / 255]);
    }
  }
  return out;
})();
const parqueaderoAutos = () =>
  PARQUEADERO.autos.map((a) => {
    const w = a.w * PARQUEADERO.escala;
    const h = a.h * PARQUEADERO.escala;
    const x = (PARQUEADERO.plazaX0 + a.plaza * PARQUEADERO.plazaW) * TILE + Math.floor((PARQUEADERO.plazaW * TILE - w) / 2);
    const y = (PARQUEADERO.filaY1 + 1) * TILE - 6 - h;
    return { ...a, x, y, w, h };
  });
const ARBOL_GRANDE_TILE = { x: Math.floor(PLAZA_REDONDA.cx), y: Math.floor(PLAZA_REDONDA.cy) };
const enJardinRedondo = (x, y) => Math.hypot(x + 0.5 - PLAZA_REDONDA.cx, y + 0.5 - PLAZA_REDONDA.cy) <= PLAZA_REDONDA.rInt;
// Composición del jardín, armada a mano siguiendo el arte oficial del pack: casi
// todo es pasto liso, con parches de tono distinto y pocos grupos de piezas
// (roca con hongos y guijarros, un matorral pegado al árbol, una mancha de
// flores de un solo color y unos brotes sueltos). Posiciones en px absolutos del
// mapa (esquina superior izquierda de cada pieza); el árbol está en x 99..172,
// con la base del tronco en (136, 1072).
// Pieza: [imagen, sx, sy, ancho, alto, x, y]
const JARDIN_PIEZAS = [
  // Grupo A (oeste): roca gris con guijarros y tres hongos al pie del árbol.
  ["roc", 128, 48, 16, 16, 84, 1068],
  ["roc", 112, 64, 16, 16, 102, 1082],
  ["roc", 144, 80, 16, 16, 72, 1088],
  ["veg", 48, 336, 16, 16, 106, 1070],
  ["veg", 32, 336, 16, 16, 119, 1079],
  ["veg", 16, 336, 16, 16, 96, 1091],
  ["veg", 0, 336, 16, 16, 112, 1094],
  // Grupo B (este): matorral pegado a la copa.
  ["veg", 2, 5, 29, 27, 160, 1039],
  // Grupo C (sureste): mancha suelta de flores blancas.
  ["veg", 96, 384, 16, 16, 150, 1090],
  ["veg", 112, 384, 16, 16, 168, 1094],
  ["veg", 64, 384, 16, 16, 160, 1101],
  ["veg", 80, 384, 16, 16, 144, 1102],
  ["veg", 48, 384, 16, 16, 176, 1086],
  ["veg", 16, 384, 16, 16, 155, 1096],
  // Brotes sueltos, muy espaciados.
  ["veg", 0, 144, 16, 16, 88, 1020],
  ["veg", 16, 144, 16, 16, 176, 1030],
  ["veg", 32, 144, 16, 16, 122, 1104],
  ["veg", 48, 144, 16, 16, 98, 1052],
  ["veg", 16, 176, 16, 16, 172, 1108],
];
// Parches de pasto: [x, y, radio, color], en px absolutos.
const JARDIN_PARCHES = [
  [100, 1090, 24, "rgba(10,50,10,0.14)"],
  [172, 1074, 18, "rgba(10,50,10,0.14)"],
  [132, 1102, 15, "rgba(10,50,10,0.11)"],
  [94, 1032, 14, "rgba(10,50,10,0.12)"],
  [150, 1030, 16, "rgba(170,230,90,0.10)"],
  [112, 1012, 12, "rgba(170,230,90,0.08)"],
];
const DECOR_TAM = { arbol: { w: 3, h: 3, solidas: [2], colsSolidas: [1] }, farola: { w: 2, h: 3, solidas: [2] }, banca: { w: 2, h: 2, solidas: [1] } };
// Camino diagonal desde el respawn (esquina superior izquierda) hasta el camino
// vertical: los tiles a menos de `radio` de la línea quebrada son piso, y cada
// `arbolCada` tiles hay un árbol en el centro (dejando un carril a cada lado).
const CAMINO_DIAGONAL = {
  puntos: [[2.5, 2.5], [42.5, 30.5]], // recta, del respawn al camino vertical
  radio: 2.3,
  extraAbajo: 1.6, // cuánto se ensancha hacia abajo (el árbol queda centrado en el nuevo ancho)
  arbolCada: 7,
  primerArbol: 6,
  margenFinal: 8,
};
function distanciaASegmento(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (ax + dx * t), py - (ay + dy * t));
}
const CAMINO_DIAGONAL_TILES = (() => {
  const { puntos, radio, extraAbajo } = CAMINO_DIAGONAL;
  const tiles = [];
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      for (let i = 0; i < puntos.length - 1; i++) {
        const [ax, ay] = puntos[i];
        const [bx, by] = puntos[i + 1];
        const cerca =
          distanciaASegmento(x + 0.5, y + 0.5, ax, ay, bx, by) <= radio ||
          distanciaASegmento(x + 0.5, y + 0.5, ax, ay + extraAbajo, bx, by + extraAbajo) <= radio;
        if (cerca) {
          tiles.push({ x, y });
          break;
        }
      }
    }
  }
  return tiles;
})();
const CAMINO_DIAGONAL_SET = new Set(CAMINO_DIAGONAL_TILES.map((t) => `${t.x},${t.y}`));
// Farolas en los bordes del camino diagonal, alternando lado (N = borde de arriba,
// S = borde de abajo). La base (2 tiles) queda dentro del piso, pegada al borde.
const CAMINO_DIAGONAL_FAROLAS = [
  { col: 10, lado: "N" }, { col: 22, lado: "N" }, { col: 34, lado: "N" },
  { col: 4, lado: "S" }, { col: 20, lado: "S" }, { col: 27, lado: "S" },
].map(({ col, lado }) => {
  const filasDe = (c) => CAMINO_DIAGONAL_TILES.filter((t) => t.x === c).map((t) => t.y);
  const a = filasDe(col - 1);
  const b = filasDe(col);
  const baseFila = lado === "N" ? Math.max(Math.min(...a), Math.min(...b)) : Math.min(Math.max(...a), Math.max(...b));
  return { tipo: "farola", x: col - 1, y: baseFila - 2 };
});
const CAMINO_DIAGONAL_ARBOLES = (() => {
  const { puntos, arbolCada, primerArbol, margenFinal, extraAbajo } = CAMINO_DIAGONAL;
  let largo = 0;
  for (let i = 0; i < puntos.length - 1; i++) largo += Math.hypot(puntos[i + 1][0] - puntos[i][0], puntos[i + 1][1] - puntos[i][1]);
  const enCamino = CAMINO_DIAGONAL_SET;
  const out = [];
  let acum = 0;
  let prox = primerArbol;
  for (let i = 0; i < puntos.length - 1; i++) {
    const [ax, ay] = puntos[i];
    const [bx, by] = puntos[i + 1];
    const seg = Math.hypot(bx - ax, by - ay);
    while (prox <= acum + seg && prox <= largo - margenFinal) {
      const t = (prox - acum) / seg;
      // El árbol se dibuja con la copa arriba y la jardinera abajo, así que se
      // centra la JARDINERA (a 2.5 tiles del borde de arriba de su bloque de 3x3)
      // entre el borde de arriba y el de abajo del camino, en su columna.
      const px = ax + (bx - ax) * t;
      const py = ay + (by - ay) * t + extraAbajo / 2;
      const col = Math.floor(px);
      let arriba = Math.floor(py);
      let abajo = arriba;
      while (enCamino.has(`${col},${arriba - 1}`)) arriba--;
      while (enCamino.has(`${col},${abajo + 1}`)) abajo++;
      out.push({ tipo: "arbol", x: Math.round(px - 1.5), y: Math.round((arriba + abajo + 1) / 2 - 2.5) });
      prox += arbolCada;
    }
    acum += seg;
  }
  return out;
})();
const DECOR_FIJA = [
  { tipo: "arbol", x: 44, y: 22 }, { tipo: "arbol", x: 63, y: 22 },
  { tipo: "farola", x: 50, y: 20 }, { tipo: "farola", x: 60, y: 20 },
  { tipo: "banca", x: 52, y: 20 }, { tipo: "banca", x: 57, y: 20 },
  // Plaza Ciénaga sin árboles, farola ni banca; dos bancas al pie de la fachada (base en la fila 41).
  { tipo: "banca", x: 53, y: 40 }, { tipo: "banca", x: 55, y: 40 },
  // Plaza Sierra Nevada: sin la banca del centro; una banca a cada lado al pie de la fachada (base fila 57).
  { tipo: "banca", x: 52, y: 56 }, { tipo: "banca", x: 61, y: 56 },
  { tipo: "farola", x: 61, y: 58 }, { tipo: "farola", x: 65, y: 58 },
  // Frente de la Biblioteca (plaza sin árboles): una farola a cada lado de la puerta y una
  // banca en cada nicho, sobre la franja de pasto al pie de la fachada (base en la fila 72).
  { tipo: "farola", x: 52, y: 70 }, { tipo: "farola", x: 61, y: 70 },
  { tipo: "banca", x: 48, y: 71 }, { tipo: "banca", x: 66, y: 71 },
  // Farolas a los lados del camino vertical (bordes oeste y este).
  // Los postes quedan sobre la línea de cada borde (x 40 y x 45), entre árboles.
  ...[33, 40, 47, 54, 61, 68].flatMap((y) => [{ tipo: "farola", x: 39, y }, { tipo: "farola", x: 44, y }]),
  // Árboles en el centro del camino, cada 7 tiles.
  { tipo: "arbol", x: 41, y: 30 }, { tipo: "arbol", x: 41, y: 37 }, { tipo: "arbol", x: 41, y: 44 },
  { tipo: "arbol", x: 41, y: 51 }, { tipo: "arbol", x: 41, y: 58 }, { tipo: "arbol", x: 41, y: 65 },
];
const DECOR = [...DECOR_FIJA, ...CAMINO_DIAGONAL_ARBOLES, ...CAMINO_DIAGONAL_FAROLAS];
const CANAL_BRIDGE = { x: 20, yWater0: 36, yWater1: 39 };
const BRIDGE_FURNITURE_FRAMES = {
  "25,36": { row: 35, col: 1 },
  "26,36": { row: 34, col: 0 },
  "27,36": { row: 35, col: 3 },
  "25,37": { row: 38, col: 0 },
  "26,37": { row: 38, col: 0 },
  "27,37": { row: 38, col: 0 },
};
// Piezas que son solo un adorno chico (no tapan el tile entero), así que
// van ENCIMA de lo que ya está horneado ahí (pasto, camino, etc.) en vez
// de reemplazarlo. Sirve tanto para tiles de puente como de pasto/camino
// (por ejemplo para estirar la punta del puente sobre tierra firme).
const FURNITURE_OVERLAYS = {
  "24,36": { row: 34, col: 4 },
  "24,37": { row: 38, col: 1 },
  "28,36": { row: 38, col: 4 },
  "28,37": { row: 38, col: 3 },
};
// Animación del borde de arriba del lago (pedida a mano, 4 cuadros del
// mismo tileset de agua): fila4, columnas 2/8/14/20.
const WATER_TOP_ANIM_FRAMES = [4 * 25 + 2, 4 * 25 + 8, 4 * 25 + 14, 4 * 25 + 20];
// Animación del borde derecho del lago: fila2, columnas 0/6/12/18.
const WATER_RIGHT_ANIM_FRAMES = [2 * 25 + 0, 2 * 25 + 6, 2 * 25 + 12, 2 * 25 + 18];
// Animación del borde izquierdo del lago: fila2, columnas 4/10/16/22.
const WATER_LEFT_ANIM_FRAMES = [2 * 25 + 4, 2 * 25 + 10, 2 * 25 + 16, 2 * 25 + 22];
// Animación del borde de abajo del lago: fila0, columnas 2/8/14/20.
const WATER_BOTTOM_ANIM_FRAMES = [0 * 25 + 2, 0 * 25 + 8, 0 * 25 + 14, 0 * 25 + 20];
// Punta de agua angosta apuntando al noroeste (tierra al sur y este):
// fila1, columnas 1/7/13/19 (corregido mirando la esquina real del lago
// en x27/y45 contra la imagen de Water_tiles).
const WATER_NW_ANIM_FRAMES = [1 * 25 + 1, 1 * 25 + 7, 1 * 25 + 13, 1 * 25 + 19];
// Punta de agua angosta apuntando al noreste (tierra al sur y oeste):
// fila1, columnas 3/9/15/21 (corregido mirando la esquina real del lago
// en x14/y49 contra la imagen de Water_tiles).
const WATER_NE_ANIM_FRAMES = [1 * 25 + 3, 1 * 25 + 9, 1 * 25 + 15, 1 * 25 + 21];
// Punta de agua angosta apuntando al suroeste (tierra al norte y este):
// fila3, columnas 1/7/13/19 (corregido mirando la esquina real del lago
// en x21/y22 contra la imagen de Water_tiles).
const WATER_SW_ANIM_FRAMES = [3 * 25 + 1, 3 * 25 + 7, 3 * 25 + 13, 3 * 25 + 19];
// Punta de agua angosta apuntando al sureste (tierra al norte y oeste):
// fila3, columnas 3/9/15/21 (corregido mirando la esquina real del lago
// en x14/y22 contra la imagen de Water_tiles).
const WATER_SE_ANIM_FRAMES = [3 * 25 + 3, 3 * 25 + 9, 3 * 25 + 15, 3 * 25 + 21];
// Agua que toca tierra solo por la esquina noroeste (los otros 3 lados
// del tile de agua siguen siendo agua abierta, sin ningún lado entero de
// tierra): fila3, columnas 4/10/16/22.
const WATER_NW_DIAG_ANIM_FRAMES = [3 * 25 + 4, 3 * 25 + 10, 3 * 25 + 16, 3 * 25 + 22];
// Agua que toca tierra solo por la esquina sureste (mismo caso que
// WATER_NW_DIAG_ANIM_FRAMES pero del otro lado): fila0, columnas
// 1/7/13/19.
const WATER_SE_DIAG_ANIM_FRAMES = [0 * 25 + 1, 0 * 25 + 7, 0 * 25 + 13, 0 * 25 + 19];
// Agua que toca tierra solo por la esquina noreste (mismo caso, otra
// esquina): fila4, columnas 1/7/13/19 (corregido contra la imagen de
// Water_tiles).
const WATER_NE_DIAG_ANIM_FRAMES = [4 * 25 + 1, 4 * 25 + 7, 4 * 25 + 13, 4 * 25 + 19];
// Agua que toca tierra solo por la esquina suroeste (mismo caso, última
// esquina): fila0, columnas 3/9/15/21.
const WATER_SW_DIAG_ANIM_FRAMES = [0 * 25 + 3, 0 * 25 + 9, 0 * 25 + 15, 0 * 25 + 21];
const WATER_TOP_ANIM_SPEED = 0.35; // segundos entre cuadros
k.loadSprite("water-anim", "Pixel Crawler - Free Pack/Environment/Tilesets/Water_tiles.png", {
  sliceX: 25,
  sliceY: 25,
});
// Animaciones pequeñas del agua abierta (cuadros de Water_tiles, fila*25 + columna).
// Cada cuadro trae el mismo color de fondo que el agua horneada, así que se apoya
// directo sobre el tile. "pausa": se reproduce una vez y espera unos segundos.
const WATER_DECOR_ANIM = {
  b: { frames: [0 * 25 + 0, 0 * 25 + 6, 0 * 25 + 12, 0 * 25 + 18], velocidad: 0.5 }, // burbujas
  w: { frames: [0 * 25 + 4, 0 * 25 + 10, 0 * 25 + 16, 0 * 25 + 22], velocidad: 0.5 }, // burbujas blancas
  c: { frames: [0 * 25 + 5, 0 * 25 + 11, 0 * 25 + 17, 0 * 25 + 23], velocidad: 0.5 }, // movimiento circular
  s: { frames: [1 * 25 + 5, 1 * 25 + 11, 1 * 25 + 17, 1 * 25 + 23], velocidad: 0.3, pausa: [4, 9] }, // salpicadura
};
// [x, y, tipo] en tiles: al menos 2 tiles de cualquier orilla, ni bajo puentes.
const WATER_DECOR_TILES = [
  [3, 38, "b"],[4, 41, "b"],[5, 39, "s"],[6, 32, "c"],[6, 34, "b"],[6, 36, "w"],
  [7, 38, "b"],[7, 43, "c"],[8, 40, "w"],[10, 34, "b"],[10, 44, "b"],[11, 37, "b"],
  [11, 40, "b"],[13, 32, "b"],[13, 34, "w"],[14, 37, "b"],[14, 41, "w"],[16, 37, "c"],
  [18, 38, "b"],[23, 37, "c"],[25, 27, "b"],[25, 34, "b"],[25, 41, "b"],[25, 44, "b"],
  [25, 49, "b"],[25, 54, "b"],[25, 62, "b"],[26, 30, "b"],[26, 36, "w"],[26, 38, "b"],
  [26, 46, "w"],[26, 52, "w"],[26, 56, "w"],[26, 58, "b"],[26, 60, "w"],[26, 64, "c"],
  [27, 28, "c"],[27, 41, "w"],[27, 43, "s"],[27, 49, "c"],[28, 32, "w"],[28, 34, "s"],
  [28, 52, "b"],[28, 55, "b"],[28, 59, "s"],[28, 62, "b"],[29, 30, "b"],[29, 47, "b"],
  [30, 34, "b"],[30, 37, "w"],[30, 44, "b"],[30, 58, "c"],[31, 40, "b"],[31, 46, "w"],
  [31, 49, "s"],[32, 33, "w"],[32, 60, "w"],[32, 62, "b"],[33, 36, "b"],[33, 44, "b"],
  [33, 47, "b"],[33, 58, "b"],[34, 33, "b"],[34, 40, "w"],[34, 49, "c"],[35, 44, "w"],
  [35, 59, "s"],[36, 34, "c"],[36, 37, "b"],[36, 39, "c"],[36, 41, "b"],[36, 46, "b"],
  [36, 50, "b"],[36, 57, "b"],
];

// Personaje: por ahora el "modelo en blanco" del pack (cuerpo base sin
// ropa ni género), solo para ver cómo se mueve. Cuando haya un sprite
// real de ella, esto es lo único que cambia (las rutas de abajo).
// Personaje principal: retrato propio (Codex), generado sobre la plantilla de New_Version para
// que el movimiento (respiración, pasos) coincida entre direcciones. Las 4 direcciones ya están
// listas (frente, espalda, derecha, izquierda), todas de 64x64 con los pies en y=48, así que no
// hace falta voltear ningún sprite: cada una usa su propio arte.
const PLAYER_SHEETS = {
  down: { idle: "Free/Personaje_Frente_Idle-Sheet.png", walk: "Free/Personaje_Frente_Walk-Sheet.png" },
  up: { idle: "Free/Personaje_Espalda_Idle-Sheet.png", walk: "Free/Personaje_Espalda_Walk-Sheet.png" },
  right: { idle: "Free/Personaje_Derecha_Idle-Sheet.png", walk: "Free/Personaje_Derecha_Walk-Sheet.png" },
  left: { idle: "Free/Personaje_Izquierda_Idle-Sheet.png", walk: "Free/Personaje_Izquierda_Walk-Sheet.png" },
};
Object.entries(PLAYER_SHEETS).forEach(([dir, { idle, walk }]) => {
  k.loadSprite(`idle-${dir}`, idle, {
    sliceX: 4,
    sliceY: 1,
    anims: { move: { from: 0, to: 3, loop: true, speed: 6 } },
  });
  k.loadSprite(`run-${dir}`, walk, {
    sliceX: 6,
    sliceY: 1,
    anims: { move: { from: 0, to: 5, loop: true, speed: 9 } },
  });
});
const CHAR_SPRITE_SCALE = 0.8 * 1.4; // +40% de su tamaño original (0.8)

// El sapo (guiño a lo que cuenta Tiana sobre su "amado convertido en
// sapo" cerca del lago): sprite de 4 cuadros de 48x64, animación de
// respiración (la papada se infla y desinfla) en loop.
k.loadSprite("sapo", "Free/Sapo_Idle-Sheet.png", {
  sliceX: 4,
  sliceY: 1,
  anims: { breathe: { from: 0, to: 3, loop: true, speed: 3 } },
});
// Cuadro de diálogo: paleta crema y café, fuente pixel (Pixelify Sans, licencia OFL en Free/).
k.loadFont("pixelify", "Free/PixelifySans.ttf");
const DLG = {
  cafe: [58, 36, 34], // contorno y texto
  crema: [255, 246, 238], // relleno
  borde: [196, 150, 112], // borde de color (café claro)
  suave: [150, 110, 90], // texto secundario
  cuerpo: 10, // tamaño del texto
  titulo: 12, // tamaño del nombre en la pestaña
  chico: 8,
  lineas: 4, // líneas por pantalla
};
// Retratos: por ahora un recorte del sprite actual de cada personaje sobre un fondo de su color
// (el mismo de sus puntos en el mapa); se reemplazan por los sprites de Codex más adelante.
const RETRATOS = {
  // Koya (BT21) reemplaza a Namjoon: retrato propio de 48x64. Sus ojos ya son rayitas, así que el
  // "parpadeo" es igual al neutral (sin efecto visible).
  cafeteria: {
    hoja: "Free/Namjoon_Idle-Sheet.png",
    color: [180, 110, 255],
    fondo: [255, 244, 228],
    hojaRetrato: "Free/Koya_Retrato-Sheet.png",
    cuadros: { neutral: 0, habla: [1, 2], parpadeo: 3 },
    alto: 64,
  },
  // Tikki ya tiene su retrato propio (4 cuadros de 48x48: neutral, habla A, habla B, parpadeo).
  hangares: {
    hoja: "Free/Tikki_Idle-Sheet.png",
    color: [255, 150, 190],
    fondo: [255, 240, 226], // fondo claro: su cuerpo es rojo rosado y con fondo rosa casi no contrasta
    hojaRetrato: "Free/Tikki_Retrato-Sheet.png",
    cuadros: { neutral: 0, habla: [1, 2], parpadeo: 3 },
  },
  // Tiana: retrato propio de 48x64 (busto con tiara y collar), mismos 4 cuadros que el de Tikki.
  mar_caribe: {
    hoja: "Free/Tiana_Idle-Sheet.png",
    color: [60, 200, 140],
    fondo: [255, 244, 228], // crema: su tiara es verde claro y sobre verde menta se perdería
    hojaRetrato: "Free/Tiana_Retrato-Sheet.png",
    cuadros: { neutral: 0, habla: [1, 2], parpadeo: 3 },
    alto: 64,
  },
  // Rapunzel: retrato propio de 48x64 (busto con pelo largo y blusa lila), mismos 4 cuadros.
  cienaga: {
    hoja: "Free/Rapunzel_Idle-Sheet.png",
    color: [255, 240, 120],
    fondo: [226, 232, 248], // lavanda muy claro: el crema se confundía con el pelo dorado
    hojaRetrato: "Free/Rapunzel_Retrato-Sheet.png",
    cuadros: { neutral: 0, habla: [1, 2], parpadeo: 3 },
    alto: 64,
  },
  // Bibi: retrato propio de 48x64 (busto con chaqueta morada), mismos 4 cuadros.
  sierra_nevada: {
    hoja: "Free/Bibi_Idle-Sheet.png",
    color: [240, 90, 240],
    fondo: [255, 244, 228],
    hojaRetrato: "Free/Bibi_Retrato-Sheet.png",
    cuadros: { neutral: 0, habla: [1, 2], parpadeo: 3 },
    alto: 64,
  },
  // Flynn Rider: easter egg oculto (no es un NPC de la lista, no tiene marcador ni sprite en el
  // mapa). Retrato propio de 48x64, mismos 4 cuadros que el resto.
  flynn: {
    hojaRetrato: "assets/flynn-dialogue-spritesheet.png",
    color: [70, 130, 140],
    fondo: [255, 244, 228],
    cuadros: { neutral: 0, habla: [1, 2], parpadeo: 3 },
    alto: 64,
  },
  // Ladybug: easter egg oculto, visible desde el inicio (no es un NPC de la lista). Retrato
  // propio de 48x64, mismos 4 cuadros que el resto.
  ladybug: {
    hojaRetrato: "assets/ladybug-dialogue-spritesheet.png",
    color: [200, 40, 50],
    fondo: [255, 244, 228],
    cuadros: { neutral: 0, habla: [1, 2], parpadeo: 3 },
    alto: 64,
  },
};
await Promise.all(
  Object.entries(RETRATOS).map(async ([id, r]) => {
    if (r.hojaRetrato) {
      k.loadSprite(`retrato-${id}`, `${r.hojaRetrato}?v=${ASSET_VERSION}`, { sliceX: 4, sliceY: 1 });
      return;
    }
    const img = await loadImageEl(r.hoja);
    const fw = img.width / 4; // los 4 cuadros van en fila; se usa el primero
    const src = document.createElement("canvas");
    src.width = fw;
    src.height = img.height;
    const sctx = src.getContext("2d");
    sctx.drawImage(img, 0, 0, fw, img.height, 0, 0, fw, img.height);
    const px = sctx.getImageData(0, 0, fw, img.height).data;
    let x0 = fw, y0 = img.height, x1 = 0, y1 = 0;
    for (let y = 0; y < img.height; y++) {
      for (let x = 0; x < fw; x++) {
        if (px[(y * fw + x) * 4 + 3] > 0) {
          x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
        }
      }
    }
    const w = x1 - x0 + 1;
    const h = y1 - y0 + 1;
    const esc = Math.min(44 / w, 44 / h);
    const cv = document.createElement("canvas");
    cv.width = Math.max(1, Math.round(w * esc));
    cv.height = Math.max(1, Math.round(h * esc));
    const cx = cv.getContext("2d");
    cx.imageSmoothingEnabled = false;
    cx.drawImage(src, x0, y0, w, h, 0, 0, cv.width, cv.height);
    k.loadSprite(`retrato-${id}`, cv);
  })
);
const SAPO_SCALE = 0.6 * 0.9 * 0.6; // -10% y después otro -40% adicional
const SAPO_POS = { x: 23 + LEFT_PAD, y: 36 + TOP_PAD }; // pasto, pegado a la entrada oeste del puente

// Koya (BT21) reemplaza a Namjoon: sprite de 4 cuadros de 64x64 (el koala mide ~46 px de alto y
// tiene los pies en la fila de abajo del cuadro), con un vaivén sutil de cabeza y orejas.
k.loadSprite("koya", "Free/Koya_Idle-Sheet.png", {
  sliceX: 4,
  sliceY: 1,
  anims: { breathe: { from: 0, to: 3, loop: true, speed: 3 } },
});
// El novio espera junto al Bloque 3: usa las cuatro poses de reposo del
// spritesheet generado a partir de la referencia fotográfica, con el mismo
// tamaño visual que la protagonista.
k.loadSprite("novio", `Free/Novio_Idle-Sheet.png?v=${ASSET_VERSION}`, {
  sliceX: 4,
  sliceY: 1,
  anims: { breathe: { from: 0, to: 3, loop: true, speed: 3 } },
});
const NAMJOON_POS = { x: 13 + LEFT_PAD, y: 66 + TOP_PAD }; // pasto, frente a La Cafetería
// Igualar el tamaño de FRAME (64x64 vs 64x128) no alcanza: el personaje
// principal tiene un montón de aire de sobra dentro de su frame (el
// cuerpo solo ocupa ~29px de los 64px de alto), mientras que el recorte
// de Namjoon casi no tiene margen (~117px de los 128px). Por eso hay que
// igualar la altura real del PERSONAJE, no la del frame entero, si no
// Namjoon queda dibujado el doble de grande aunque el frame "combine".
const PLAYER_CONTENT_H = 30; // alto real del cuerpo dentro del frame 64x64 de la mesera (Tavern_B)
const NAMJOON_CONTENT_H = 46; // alto real de Koya dentro de su frame 64x64 (orejas a pies)
// Koya es un chibi: un poco más bajo que ella (90 % de su altura).
const NAMJOON_SCALE = (CHAR_SPRITE_SCALE * PLAYER_CONTENT_H * 0.9) / NAMJOON_CONTENT_H;
const NOVIO_SCALE = CHAR_SPRITE_SCALE * 0.88;

// Tikki: sprite de 4 cuadros de 64x64, animación de vuelo (el cuerpo
// sube y baja, las antenas se rezagan). Va flotando en la zona de Los
// Hangares.
k.loadSprite("tikki", "Free/Tikki_Idle-Sheet.png", {
  sliceX: 4,
  sliceY: 1,
  anims: { hover: { from: 0, to: 3, loop: true, speed: 3 } },
});
const TIKKI_POS = { x: 7, y: 26 }; // Los Hangares (lado sur, sobre el camino B)
// Es una criatura chica (como el sapo), no del porte de un personaje:
// ~54px de cuerpo real dentro del frame de 64px, escalado para que en
// pantalla quede bastante más chica que el jugador.
const TIKKI_CONTENT_H = 54;
const TIKKI_SCALE = (24 / TIKKI_CONTENT_H) * 0.6; // -40% de su tamaño original
const TIKKI_FLOAT_HEIGHT = 14; // px extra de altura sobre el piso (además del vuelo del sprite)

// Ladybug: easter egg oculto (igual que el sapo/Flynn/Máximus), visible desde el inicio, sin
// marcador ni desbloqueo. Va parada cerca de Tikki, su kwami, en Los Hangares.
k.loadSprite("ladybug", `assets/ladybug-idle-spritesheet.png?v=${ASSET_VERSION}`, {
  sliceX: 4,
  sliceY: 1,
  anims: { breathe: { from: 0, to: 3, loop: true, speed: 3 } },
});
const LADYBUG_CONTENT_H = 57; // alto real del cuerpo dentro del frame 64x64
const LADYBUG_SCALE = (CHAR_SPRITE_SCALE * PLAYER_CONTENT_H) / LADYBUG_CONTENT_H;

// Corazón animado (late/pulso, 4 cuadros de 32x32): se usa en el diálogo final de la reunión y
// en la escena "ending", en vez del "♥" de texto plano.
k.loadSprite("heart-pulse", "assets/heart-pulse-spritesheet.png", {
  sliceX: 4,
  sliceY: 1,
  anims: { beat: { from: 0, to: 3, loop: true, speed: 4 } },
});

// Tiana: sprite de 4 cuadros de 64x64, animación de respiración sutil
// (hombros/pecho) en loop. Va parada cerca de Mar Caribe.
k.loadSprite("tiana", "Free/Tiana_Idle-Sheet.png", {
  sliceX: 4,
  sliceY: 1,
  anims: { breathe: { from: 0, to: 3, loop: true, speed: 3 } },
});
const TIANA_POS = { x: 45 + LEFT_PAD, y: 5 + TOP_PAD }; // pasto, pegado a Mar Caribe
const TIANA_CONTENT_H = 57; // alto real del cuerpo dentro del frame 64x64
const TIANA_SCALE = (CHAR_SPRITE_SCALE * PLAYER_CONTENT_H) / TIANA_CONTENT_H;

// Rapunzel: sprite de 4 cuadros de 64x64, animación de respiración sutil
// (hombros/pecho) en loop. Va parada junto al marcador del Edificio
// Ciénaga (donde la NPC cuenta su parte de la historia).
k.loadSprite("rapunzel", "Free/Rapunzel_Idle-Sheet.png", {
  sliceX: 4,
  sliceY: 1,
  anims: { breathe: { from: 0, to: 3, loop: true, speed: 3 } },
});
const RAPUNZEL_POS = { x: 37 + LEFT_PAD, y: 26 + TOP_PAD }; // pasto, al lado del marcador de Ciénaga
const RAPUNZEL_CONTENT_H = 57; // alto real del cuerpo dentro del frame 64x64
const RAPUNZEL_SCALE = (CHAR_SPRITE_SCALE * PLAYER_CONTENT_H) / RAPUNZEL_CONTENT_H;

// Máximus: el caballo de Rapunzel, parado un poco más allá de ella. Easter egg oculto (igual que
// el sapo): no da objeto ni desbloquea nada, solo tiene un diálogo curioso al acercarse.
k.loadSprite("maximus", `assets/maximus-idle-spritesheet.png?v=${ASSET_VERSION}`, {
  sliceX: 4,
  sliceY: 1,
  anims: { breathe: { from: 0, to: 3, loop: true, speed: 3 } },
});
const MAXIMUS_CONTENT_H = 44; // alto real del cuerpo dentro del frame 96x64
const MAXIMUS_SCALE = (CHAR_SPRITE_SCALE * PLAYER_CONTENT_H) / MAXIMUS_CONTENT_H;

// Bibi (Brawl Stars): sprite de 4 cuadros de 64x64, animación de
// respiración sutil (hombro/brazo/bate como bloque rígido) en loop. Va
// parada junto al marcador del Edificio Sierra Nevada.
k.loadSprite("bibi", "Free/Bibi_Idle-Sheet.png", {
  sliceX: 4,
  sliceY: 1,
  anims: { breathe: { from: 0, to: 3, loop: true, speed: 3 } },
});
const BIBI_POS = { x: 41 + LEFT_PAD, y: 42 + TOP_PAD }; // pasto, al lado del marcador de Sierra Nevada
const BIBI_CONTENT_H = 57; // alto real del cuerpo dentro del frame 64x64
const BIBI_SCALE = (CHAR_SPRITE_SCALE * PLAYER_CONTENT_H) / BIBI_CONTENT_H;

// El bloque amarillo de interacción de cada NPC va pegado al lado izquierdo de su personaje (una
// casilla a la izquierda de su posición), en vez del punto que elegía findMarkerSpot antes.
const MARCADOR_MANUAL = {
  hangares: { x: TIKKI_POS.x - 1, y: TIKKI_POS.y },
  mar_caribe: { x: TIANA_POS.x - 1, y: TIANA_POS.y },
  cienaga: { x: RAPUNZEL_POS.x - 1, y: RAPUNZEL_POS.y },
  sierra_nevada: { x: BIBI_POS.x - 1, y: BIBI_POS.y },
  cafeteria: { x: NAMJOON_POS.x - 1, y: NAMJOON_POS.y },
};

// Flynn Rider: easter egg oculto (esposo de Rapunzel). Sprite de 4 cuadros de 64x64, misma
// animación de respiración en loop que el resto de los NPCs. Su posición (FLYNN_POS) se calcula
// más abajo, relativa al edificio de Sierra Nevada ya construido, no es una coordenada fija.
k.loadSprite("flynn", `assets/flynn-idle-spritesheet.png?v=${ASSET_VERSION}`, {
  sliceX: 4,
  sliceY: 1,
  anims: { breathe: { from: 0, to: 3, loop: true, speed: 3 } },
});
const FLYNN_CONTENT_H = 57; // alto real del cuerpo dentro del frame 64x64
const FLYNN_SCALE = (CHAR_SPRITE_SCALE * PLAYER_CONTENT_H) / FLYNN_CONTENT_H;

// ---- Botones de HUD (pack de UI pixel-art, con estado "presionado" propio) ----
// Engranaje (arriba a la izquierda): abre el menú de pausa (salir/reanudar/reiniciar).
// Copa (abajo): abre el panel de objetos que se van desbloqueando.
["gear", "trophy"].forEach((n) => {
  k.loadSprite(`ui-${n}-normal`, `assets/ui-${n}-normal.png`);
  k.loadSprite(`ui-${n}-pressed`, `assets/ui-${n}-pressed.png`);
});
const HUD_ICON_H = 22; // alto en pantalla de los botones de HUD

// Botones del menú de pausa (mismo pack, versión "cápsula" con texto).
["nuevojuego", "iniciar", "salir"].forEach((n) => {
  k.loadSprite(`ui-${n}-normal`, `assets/ui-${n}-normal.png`);
  k.loadSprite(`ui-${n}-pressed`, `assets/ui-${n}-pressed.png`);
});
const MENU_BTN_H = 22; // alto en pantalla de los botones del menú de pausa
const MENU_BTN_SCALE = MENU_BTN_H / 100; // 100px ≈ alto real de los recortes "normal"

// ---------------------------------------------------------------------
// "Sprites" placeholder por color. Cuando tengas el tileset pixelado,
// esto es lo único que cambia: en vez de k.color(...) se usa
// k.sprite("nombre"), y el sprite de cada edificio se declara en
// blueprint.js. La lógica del mapa no se toca.
// ---------------------------------------------------------------------
const COLORS = {
  grass: [86, 168, 92],
  path: [214, 186, 130],
  bridge: [156, 112, 70],
  water: [72, 122, 192],
  wall: [52, 88, 54],
  building: [150, 140, 120],
  markerA: [240, 200, 60],
  marker: [250, 230, 90],
  sweetheart: [235, 110, 160],
  player: [220, 70, 70],
};

const WALKABLE = new Set(["grass", "path", "bridge", "markerA", "marker", "sweetheart"]);

// Para dibujar la orilla: un tile vecino cuenta como "tierra" si no es
// agua ni puente (el puente pasa por encima del agua, no necesita borde).
function isLand(grid, x, y) {
  if (y < 0 || y >= grid.length || x < 0 || x >= grid[0].length) return false;
  const t = grid[y][x];
  return t !== "water" && t !== "bridge";
}

// Dibuja el terreno completo (pasto/agua/orilla/camino/puente) una sola
// vez sobre un canvas en memoria, así el juego termina con un solo
// sprite gigante en vez de un objeto por tile.
function bakeTerrain(
  grid,
  hangarRects,
  topShoreTiles,
  rightShoreTiles,
  leftShoreTiles,
  bottomShoreTiles,
  nwShoreTiles,
  neShoreTiles,
  swShoreTiles,
  seShoreTiles,
  nwDiagShoreTiles,
  seDiagShoreTiles,
  neDiagShoreTiles,
  swDiagShoreTiles,
  cafeteriaBuilding,
  bibliotecaBuilding,
  marCaribeBuilding,
  cienagaBuilding,
  sierraBuilding,
  bloque8Building,
  bloque3Building,
  paved,
  decor
) {
  const canvas = document.createElement("canvas");
  canvas.width = COLS * TILE;
  canvas.height = ROWS * TILE;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  function draw(img, frame, dx, dy, angleDeg = 0) {
    const SLICE = 25; // las 3 imágenes tienen 25 columnas de 16px
    const sx = (frame % SLICE) * TILE;
    const sy = Math.floor(frame / SLICE) * TILE;
    if (angleDeg) {
      ctx.save();
      ctx.translate(dx + TILE / 2, dy + TILE / 2);
      ctx.rotate((angleDeg * Math.PI) / 180);
      ctx.drawImage(img, sx, sy, TILE, TILE, -TILE / 2, -TILE / 2, TILE, TILE);
      ctx.restore();
    } else {
      ctx.drawImage(img, sx, sy, TILE, TILE, dx, dy, TILE, TILE);
    }
  }

  // Como draw(), pero recibe fila/columna directas en vez de un índice
  // de frame único: hace falta para tilesets con un ancho de columnas
  // distinto a 25 (Furniture.png tiene 50).
  function drawRC(img, row, col, dx, dy) {
    ctx.drawImage(img, col * TILE, row * TILE, TILE, TILE, dx, dy, TILE, TILE);
  }

  function isPath(grid, x, y) {
    return !!grid[y] && (grid[y][x] === "path" || grid[y][x] === "bridge");
  }

  // Pieza real de borde: en el mismo sheet, pegada al bloque sólido de
  // roca (fila10 col6-8), hay un anillo de tiles (filas0-4, cols5-9)
  // que son roca sólida con una mordida orgánica hacia el agujero
  // central (que deja ver el pasto). Esa mordida ES la transición ya
  // hecha por el pack — acá solo se usa tal cual, rotada según hacia
  // dónde da el pasto, en vez de inventar un recorte a mano.
  const EDGE_TILE_SX = 6 * TILE; // col6
  const EDGE_TILE_SY = 1 * TILE; // fila1: sólido con mordida en la esquina SE
  const ANGLE_FOR_CORNER = { se: 0, sw: 90, nw: 180, ne: 270 };
  const ANGLE_FOR_SIDE = { e: 0, s: 90, w: 180, n: 270 };

  // Borde derecho externo: pieza específica pedida (fila7, columna5),
  // sólida con la transparencia orgánica pegada del lado derecho — no
  // hace falta rotarla, ya viene orientada para ese lado.
  const EDGE_RIGHT_TILE_SX = 5 * TILE; // col5
  const EDGE_RIGHT_TILE_SY = 7 * TILE; // fila7

  // Borde izquierdo externo: fila7, columna9 — sólida con la
  // transparencia orgánica pegada del lado izquierdo, tampoco necesita
  // rotación.
  const EDGE_LEFT_TILE_SX = 9 * TILE; // col9
  const EDGE_LEFT_TILE_SY = 7 * TILE; // fila7

  // Borde de abajo externo: fila5, columna7.
  const EDGE_BOTTOM_TILE_SX = 7 * TILE; // col7
  const EDGE_BOTTOM_TILE_SY = 5 * TILE; // fila5

  // Borde de arriba externo: fila5, columna2 (grupo de pasto, pedido así).
  const EDGE_TOP_TILE_SX = 2 * TILE; // col2
  const EDGE_TOP_TILE_SY = 5 * TILE; // fila5

  function drawRockPiece(dx, dy, sx, sy, angle) {
    draw(imgTiles, TILE_FRAMES.grass, dx, dy);
    ctx.save();
    ctx.translate(dx + TILE / 2, dy + TILE / 2);
    ctx.rotate((angle * Math.PI) / 180);
    ctx.translate(-TILE / 2, -TILE / 2);
    ctx.drawImage(imgTiles, sx, sy, TILE, TILE, 0, 0, TILE, TILE);
    ctx.restore();
  }

  function roundGrassCorner(dx, dy, corner) {
    drawRockPiece(dx, dy, EDGE_TILE_SX, EDGE_TILE_SY, ANGLE_FOR_CORNER[corner]);
  }

  function drawGrassEdge(dx, dy, side) {
    if (side === "e") {
      drawRockPiece(dx, dy, EDGE_RIGHT_TILE_SX, EDGE_RIGHT_TILE_SY, 0);
      return;
    }
    if (side === "w") {
      drawRockPiece(dx, dy, EDGE_LEFT_TILE_SX, EDGE_LEFT_TILE_SY, 0);
      return;
    }
    if (side === "s") {
      drawRockPiece(dx, dy, EDGE_BOTTOM_TILE_SX, EDGE_BOTTOM_TILE_SY, 0);
      return;
    }
    if (side === "n") {
      drawRockPiece(dx, dy, EDGE_TOP_TILE_SX, EDGE_TOP_TILE_SY, 0);
      return;
    }
    drawRockPiece(dx, dy, EDGE_TILE_SX, EDGE_TILE_SY, ANGLE_FOR_SIDE[side]);
  }

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const type = grid[y][x];
      const dx = x * TILE;
      const dy = y * TILE;
      if (type === "grass" || type === "cafe" || type === "biblioteca" || type === "mar" || type === "aulas" || type === "b8" || type === "b3" || type === "deco") {
        draw(imgTiles, TILE_FRAMES.grass, dx, dy);
      } else if (type === "water") {
        draw(imgWater, TILE_FRAMES.water, dx, dy);
        const n = isLand(grid, x, y - 1);
        const s = isLand(grid, x, y + 1);
        const w = isLand(grid, x - 1, y);
        const e = isLand(grid, x + 1, y);
        if (n && w) {
          // Tierra al norte y al oeste: el agua que queda es una cuña
          // angosta que apunta al sureste. Pieza animada (ver
          // WATER_SE_ANIM_FRAMES).
          seShoreTiles.push({ x, y });
        } else if (n && e) {
          // Tierra al norte y al este: el agua que queda es una cuña
          // angosta que apunta al suroeste. Pieza animada (ver
          // WATER_SW_ANIM_FRAMES).
          swShoreTiles.push({ x, y });
        } else if (s && w) {
          // Tierra al sur y al oeste: el agua que queda es una cuña
          // angosta que apunta al noreste. Pieza animada (ver
          // WATER_NE_ANIM_FRAMES).
          neShoreTiles.push({ x, y });
        } else if (s && e) {
          // La tierra está al sur y al este: el agua que queda en este
          // tile es una cuña angosta que apunta al noroeste. Pieza
          // animada (ver WATER_NW_ANIM_FRAMES; el nombre es por hacia
          // dónde apunta la punta del agua, no por dónde está la tierra).
          nwShoreTiles.push({ x, y });
        } else if (n) {
          // El borde de arriba del lago es animado (ver
          // WATER_TOP_ANIM_FRAMES): acá no se hornea nada, solo se
          // anota la posición para poner un sprite animado encima.
          topShoreTiles.push({ x, y });
        } else if (s) {
          // Borde de abajo del lago, también animado (ver
          // WATER_BOTTOM_ANIM_FRAMES).
          bottomShoreTiles.push({ x, y });
        } else if (w) {
          // Borde izquierdo del lago, también animado (ver
          // WATER_LEFT_ANIM_FRAMES).
          leftShoreTiles.push({ x, y });
        } else if (e) {
          // Borde derecho del lago, también animado (ver
          // WATER_RIGHT_ANIM_FRAMES).
          rightShoreTiles.push({ x, y });
        } else if (isLand(grid, x - 1, y - 1)) {
          // Ninguno de los 4 lados es tierra, pero la tierra toca esta
          // agua por la esquina noroeste (un pixel de tierra metido en
          // el lago). Pieza animada (ver WATER_NW_DIAG_ANIM_FRAMES).
          nwDiagShoreTiles.push({ x, y });
        } else if (isLand(grid, x + 1, y + 1)) {
          // Mismo caso que arriba pero la tierra toca por la esquina
          // sureste. Pieza animada (ver WATER_SE_DIAG_ANIM_FRAMES).
          seDiagShoreTiles.push({ x, y });
        } else if (isLand(grid, x + 1, y - 1)) {
          // Mismo caso pero la tierra toca por la esquina noreste.
          // Pieza animada (ver WATER_NE_DIAG_ANIM_FRAMES).
          neDiagShoreTiles.push({ x, y });
        } else if (isLand(grid, x - 1, y + 1)) {
          // Mismo caso pero la tierra toca por la esquina suroeste.
          // Pieza animada (ver WATER_SW_DIAG_ANIM_FRAMES).
          swDiagShoreTiles.push({ x, y });
        }
      } else if (type === "path") {
        draw(imgTiles, TILE_FRAMES.path, dx, dy);
        // Transición orgánica con el pasto: en las esquinas (donde el
        // camino gira o termina) se recorta con la pieza de esquina; en
        // los tramos rectos (un solo lado da a pasto) con la pieza de
        // borde. Ambas son recortes reales del sheet, no algo geométrico.
        const n = !isPath(grid, x, y - 1);
        const s = !isPath(grid, x, y + 1);
        const w = !isPath(grid, x - 1, y);
        const e = !isPath(grid, x + 1, y);
        const nw = n && w;
        const ne = n && e;
        const sw = s && w;
        const se = s && e;
        if (nw) roundGrassCorner(dx, dy, "nw");
        if (ne) roundGrassCorner(dx, dy, "ne");
        if (sw) roundGrassCorner(dx, dy, "sw");
        if (se) roundGrassCorner(dx, dy, "se");
        if (!nw && !ne && !sw && !se) {
          if (n) drawGrassEdge(dx, dy, "n");
          else if (s) drawGrassEdge(dx, dy, "s");
          else if (w) drawGrassEdge(dx, dy, "w");
          else if (e) drawGrassEdge(dx, dy, "e");
        }
        const pathOverlay = FURNITURE_OVERLAYS[`${x - LEFT_PAD},${y - TOP_PAD}`];
        if (pathOverlay) {
          drawRC(imgFurniture, pathOverlay.row, pathOverlay.col, dx, dy);
        }
      } else if (type === "bridge") {
        const key = `${x - LEFT_PAD},${y - TOP_PAD}`;
        const furn = BRIDGE_FURNITURE_FRAMES[key];
        if (furn) {
          drawRC(imgFurniture, furn.row, furn.col, dx, dy);
        } else {
          // Ya no queda ningún tile de puente sin textura de Furniture:
          // acá va pasto liso de base (la textura vieja del puente, de
          // Dungeon_Tiles, se sacó del todo).
          draw(imgTiles, TILE_FRAMES.grass, dx, dy);
        }
        const overlay = FURNITURE_OVERLAYS[key];
        if (overlay) {
          drawRC(imgFurniture, overlay.row, overlay.col, dx, dy);
        }
      }
    }
  }

  // Puente vertical del canal: se arma la tira horizontal del puente de madera
  // (punta + 3 tablones + tablón repetido + punta) y se gira 90 grados.
  {
    const strip = document.createElement("canvas");
    strip.width = 6 * TILE;
    strip.height = 2 * TILE;
    const sctx = strip.getContext("2d");
    const piece = (row, col, i, j) => sctx.drawImage(imgFurniture, col * TILE, row * TILE, TILE, TILE, i * TILE, j * TILE, TILE, TILE);
    [[34, 4], [35, 1], [34, 0], [34, 0], [35, 3], [38, 4]].forEach(([r, c], i) => piece(r, c, i, 0));
    [[38, 1], [38, 0], [38, 0], [38, 0], [38, 0], [38, 3]].forEach(([r, c], i) => piece(r, c, i, 1));
    const bx = CANAL_BRIDGE.x * TILE;
    const by = (CANAL_BRIDGE.yWater0 - 1) * TILE;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.translate(bx + 2 * TILE, by);
    ctx.rotate(Math.PI / 2);
    ctx.drawImage(strip, 0, 0);
    ctx.restore();
  }

  // Los Hangares son una sola imagen prearmada por galpón (no un tile
  // repetido), así que se pegan enteras encima del pasto ya horneado.
  hangarRects.forEach((rect) => {
    const src = HANGAR_SRC[rect.color];
    ctx.drawImage(
      imgIndustrial,
      src.sx,
      src.sy,
      src.sw,
      src.sh,
      rect.x0 * TILE,
      rect.y0 * TILE,
      HANGAR_TILE_W * TILE,
      HANGAR_TILE_H * TILE
    );
  });

  // La Cafetería: mismo criterio que Los Hangares, una imagen entera
  // pegada encima del pasto ya horneado (el edificio bloquea el paso
  // porque su tile de grid es "cafe", no "grass"; las mesas son solo
  // decoración, van sobre pasto caminable).
  // Plazas y caminos: se dibuja el rombo que toca por posición, se recorta en
  // las esquinas redondeadas (para que se vea el pasto) y encima va el bordillo
  // en el límite con el pasto.
  {
    const isP = (x, y) => !!paved[y] && !!paved[y][x];
    const POS = { N: [0, 0], E: [1, 0], S: [2, 0], W: [3, 0], NW: [0, 1], NE: [1, 1], SE: [2, 1], SW: [3, 1], iNW: [0, 2], iNE: [1, 2], iSE: [2, 2], iSW: [3, 2] };
    const tmp = document.createElement("canvas");
    tmp.width = TILE;
    tmp.height = TILE;
    const tctx = tmp.getContext("2d");
    tctx.imageSmoothingEnabled = false;
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const tipo = paved[y][x];
        if (!tipo) continue;
        const dx = x * TILE;
        const dy = y * TILE;
        draw(imgTiles, TILE_FRAMES.grass, dx, dy);
        const n = !isP(x, y - 1);
        const e = !isP(x + 1, y);
        const s = !isP(x, y + 1);
        const w = !isP(x - 1, y);
        const usar = [];
        if (n && w) usar.push("NW");
        else if (n) usar.push("N");
        else if (w) usar.push("W");
        if (n && e) usar.push("NE");
        else if (e && !n) usar.push("E");
        if (s && e) usar.push("SE");
        else if (s && !e) usar.push("S");
        if (s && w) usar.push("SW");
        if (!n && !w && !isP(x - 1, y - 1)) usar.push("iNW");
        if (!n && !e && !isP(x + 1, y - 1)) usar.push("iNE");
        if (!s && !e && !isP(x + 1, y + 1)) usar.push("iSE");
        if (!s && !w && !isP(x - 1, y + 1)) usar.push("iSW");
        const asfalto = tipo === "A";
        const sx = asfalto ? PARQUEADERO.asfalto.sx : (x % 4) * TILE;
        const sy = asfalto ? PARQUEADERO.asfalto.sy : (y % 2) * TILE;
        const src = asfalto ? imgCiudad : imgPisoA;
        tctx.globalCompositeOperation = "source-over";
        tctx.clearRect(0, 0, TILE, TILE);
        tctx.drawImage(src, sx, sy, TILE, TILE, 0, 0, TILE, TILE);
        tctx.globalCompositeOperation = "destination-in";
        usar.forEach((u) => tctx.drawImage(imgBordilloCorte, POS[u][0] * TILE, POS[u][1] * TILE, TILE, TILE, 0, 0, TILE, TILE));
        ctx.drawImage(tmp, dx, dy);
        usar.forEach((u) => ctx.drawImage(imgBordillo, POS[u][0] * TILE, POS[u][1] * TILE, TILE, TILE, dx, dy, TILE, TILE));
      }
    }
    // Parches de tono en el pasto del jardín (borde irregular, solo dentro del jardín).
    JARDIN_PARCHES.forEach(([cx, cy, r, color]) => {
      ctx.fillStyle = color;
      for (let py = Math.floor(cy - r - 2); py <= Math.ceil(cy + r + 2); py++) {
        for (let px = Math.floor(cx - r - 2); px <= Math.ceil(cx + r + 2); px++) {
          if (!enJardinRedondo(Math.floor(px / TILE), Math.floor(py / TILE))) continue;
          const ruido = (((px * 73856093) ^ (py * 19349663)) & 255) / 255;
          if (Math.hypot(px - cx, py - cy) + (ruido - 0.5) * 5 < r) ctx.fillRect(px, py, 1, 1);
        }
      }
    });
    JARDIN_PIEZAS.forEach(([img, sx, sy, w, h, x, y]) => {
      ctx.drawImage(img === "veg" ? imgVegetacion : imgRocas, sx, sy, w, h, x, y, w, h);
    });
    // Bosque: suelo oscurecido y sotobosque (los árboles son objetos del juego).
    BOSQUE_SUELO.forEach(([x, y, a]) => {
      ctx.fillStyle = `rgba(0,30,0,${a})`;
      ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
    });
    BOSQUE_PIEZAS.forEach(([sx, sy, w, h, x, y]) => ctx.drawImage(imgVegetacion, sx, sy, w, h, x, y, w, h));
    CAMPO_PARCHES.forEach(([cx, cy, rx, ry, color]) => {
      ctx.fillStyle = color;
      for (let py = Math.floor(cy - ry - 2); py <= Math.ceil(cy + ry + 2); py++) {
        for (let px = Math.floor(cx - rx - 2); px <= Math.ceil(cx + rx + 2); px++) {
          const ruido = (((px * 73856093) ^ (py * 19349663)) & 255) / 255;
          if (Math.hypot((px - cx) / rx, (py - cy) / ry) + (ruido - 0.5) * 0.12 < 1) ctx.fillRect(px, py, 1, 1);
        }
      }
    });
    CAMPO_HOJAS.forEach(([c, r, x, y]) => ctx.drawImage(imgVegetacion, c * 16, r * 16, 16, 16, x, y, 16, 16));
    CAMPO_DIGITALES.forEach(([c, r, x, y]) => ctx.drawImage(imgVegetacion, c * 16, r * 16, 16, 32, x, y, 16, 32));
    [...CAMPO_FLORES].sort((a, b) => a[3] - b[3]).forEach(([c, r, x, y]) => ctx.drawImage(imgVegetacion, c * 16, r * 16, 16, 16, x, y, 16, 16));
    ORILLA_PIEZAS.forEach(([img, sx, sy, w, h, x, y]) => ctx.drawImage(img === "veg" ? imgVegetacion : imgRocas, sx, sy, w, h, x, y, w, h));
    // Estacionamiento: solo los autos, sobre el asfalto.
    {
      const P = PARQUEADERO;
      parqueaderoAutos().forEach((a) => ctx.drawImage(imgCiudad, a.sx, a.sy, a.w / P.escala, a.h / P.escala, a.x, a.y, a.w, a.h));
    }
    // Los árboles no se hornean: son objetos del juego (ver escena "game"), para
    // que el personaje pueda quedar detrás de la copa.
    decor.forEach((d) => {
      if (d.tipo === "arbol" || d.objeto) return;
      const img = d.tipo === "farola" ? imgDecoFarola : imgDecoBanca;
      ctx.drawImage(img, d.x * TILE, d.y * TILE);
    });
  }

  if (cafeteriaBuilding) {
    ctx.drawImage(
      imgCafeteria,
      cafeteriaBuilding.x0 * TILE,
      cafeteriaBuilding.y0 * TILE,
      CAFETERIA_BUILDING_W * TILE,
      CAFETERIA_BUILDING_H * TILE
    );
  }
  if (bloque3Building) {
    ctx.drawImage(
      imgBloque3,
      bloque3Building.x0 * TILE,
      bloque3Building.y0 * TILE,
      BLOQUE3_W * TILE,
      BLOQUE3_H * TILE
    );
  }
  if (bloque8Building) {
    ctx.drawImage(
      imgBloque8,
      bloque8Building.x0 * TILE,
      bloque8Building.y0 * TILE,
      BLOQUE8_W * TILE,
      BLOQUE8_H * TILE
    );
    ctx.drawImage(
      imgCiudad,
      MAQUINA.sx,
      MAQUINA.sy,
      MAQUINA.w,
      MAQUINA.h,
      (bloque8Building.x1 + 1) * TILE - 32,
      (bloque8Building.y1 + 1) * TILE + 2 - MAQUINA.h,
      MAQUINA.w,
      MAQUINA.h
    );
  }
  if (sierraBuilding) {
    ctx.drawImage(
      imgAulasSierra,
      sierraBuilding.x0 * TILE,
      sierraBuilding.y0 * TILE,
      AULAS_W * TILE,
      AULAS_H * TILE
    );
  }
  if (cienagaBuilding) {
    ctx.drawImage(
      imgAulas,
      cienagaBuilding.x0 * TILE,
      cienagaBuilding.y0 * TILE,
      AULAS_W * TILE,
      AULAS_H * TILE
    );
    // Máquina expendedora al pie de la fachada, junto a la puerta izquierda.
    ctx.drawImage(imgCiudad, MAQUINA.sx, MAQUINA.sy, MAQUINA.w, MAQUINA.h, MAQUINA_CIENAGA.x, MAQUINA_CIENAGA.y, MAQUINA.w, MAQUINA.h);
  }
  if (marCaribeBuilding) {
    ctx.drawImage(
      imgMarCaribe,
      marCaribeBuilding.x0 * TILE,
      marCaribeBuilding.y0 * TILE,
      MAR_CARIBE_W * TILE,
      MAR_CARIBE_H * TILE
    );
  }
  if (bibliotecaBuilding) {
    ctx.drawImage(
      imgBiblioteca,
      bibliotecaBuilding.x0 * TILE,
      bibliotecaBuilding.y0 * TILE,
      BIBLIOTECA_W * TILE,
      BIBLIOTECA_H * TILE
    );
    // Máquina expendedora frente a la fachada, entre la puerta y el nicho derecho.
    ctx.drawImage(imgCiudad, MAQUINA.sx, MAQUINA.sy, MAQUINA.w, MAQUINA.h, MAQUINA_BIBLIOTECA.x, MAQUINA_BIBLIOTECA.y, MAQUINA.w, MAQUINA.h);
  }

  return canvas;
}

function charToTile(ch) {
  if (ch === "#") return "grass"; // los caminos se sacaron, va pasto en su lugar
  if (ch === "~") return "water";
  if (ch === "=") return "bridge";
  if (ch === "o") return "grass"; // la mini isla es tierra rodeada de agua
  const info = BUILDING_CHARS[ch];
  if (info && info.id !== "generico") return "building";
  return "grass"; // "." y "A", y también "g" (relleno genérico sin nombre)
}

// Recorta los caminos ("path") de su ancho crudo (4 u 8 tiles, según el
// plano) a un ancho real prolijo, distinguiendo avenida principal de
// caminos secundarios. Funciona sobre la grilla ya expandida, no sobre
// el texto del plano: mide, para cada tile de camino, el largo de la
// franja contigua en horizontal y en vertical. El eje MÁS LARGO es la
// dirección en la que "corre" el camino; el eje corto es su grosor, que
// se recorta centrado al ancho objetivo. Las esquinas/cruces (donde
// ambos ejes miden parecido) se dejan intactas para no cortar el paso.
function narrowPaths(grid) {
  const isPath = (x, y) => grid[y] && grid[y][x] === "path";

  // Largo de la franja horizontal/vertical contigua que pasa por cada tile,
  // junto con dónde arranca esa franja (para poder centrar el recorte).
  const hLen = Array.from({ length: ROWS }, () => new Int16Array(COLS));
  const hStart = Array.from({ length: ROWS }, () => new Int16Array(COLS));
  for (let y = 0; y < ROWS; y++) {
    let runStart = -1;
    for (let x = 0; x <= COLS; x++) {
      if (isPath(x, y)) {
        if (runStart === -1) runStart = x;
      } else if (runStart !== -1) {
        for (let k = runStart; k < x; k++) {
          hLen[y][k] = x - runStart;
          hStart[y][k] = runStart;
        }
        runStart = -1;
      }
    }
  }
  const vLen = Array.from({ length: ROWS }, () => new Int16Array(COLS));
  const vStart = Array.from({ length: ROWS }, () => new Int16Array(COLS));
  for (let x = 0; x < COLS; x++) {
    let runStart = -1;
    for (let y = 0; y <= ROWS; y++) {
      if (isPath(x, y)) {
        if (runStart === -1) runStart = y;
      } else if (runStart !== -1) {
        for (let k = runStart; k < y; k++) {
          vLen[k][x] = y - runStart;
          vStart[k][x] = runStart;
        }
        runStart = -1;
      }
    }
  }

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (!isPath(x, y)) continue;
      const h = hLen[y][x];
      const v = vLen[y][x];
      if (h > v) {
        // Franja horizontal: el grosor es "v" (vertical), se recorta.
        const target = v >= MAIN_PATH_MIN_THICKNESS ? MAIN_PATH_WIDTH : SECONDARY_PATH_WIDTH;
        if (v <= target) continue;
        const start = vStart[y][x] + Math.floor((v - target) / 2);
        if (y < start || y >= start + target) grid[y][x] = "grass";
      } else if (v > h) {
        // Franja vertical: el grosor es "h" (horizontal), se recorta.
        const target = h >= MAIN_PATH_MIN_THICKNESS ? MAIN_PATH_WIDTH : SECONDARY_PATH_WIDTH;
        if (h <= target) continue;
        const start = hStart[y][x] + Math.floor((h - target) / 2);
        if (x < start || x >= start + target) grid[y][x] = "grass";
      }
      // h === v: esquina o cruce, se deja completo para no cortar el paso.
    }
  }
}

function carveCircle(grid, cx, cy, r, type) {
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
    for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
      if (Math.hypot(x - cx, y - cy) <= r && grid[y] && grid[y][x] !== undefined) {
        grid[y][x] = type;
      }
    }
  }
}

// Busca un tile caminable pegado al edificio para poner su marcador.
// Prueba primero abajo (el frente), después arriba, izquierda y derecha.
function findMarkerSpot(grid, box) {
  const midX = Math.floor((box.x0 + box.x1) / 2);
  const midY = Math.floor((box.y0 + box.y1) / 2);
  const candidates = [];
  for (let d = 1; d <= 10; d++) {
    candidates.push({ x: midX, y: box.y1 + d });
    candidates.push({ x: midX, y: box.y0 - d });
    candidates.push({ x: box.x0 - d, y: midY });
    candidates.push({ x: box.x1 + d, y: midY });
  }
  const walkable = candidates.filter((c) => grid[c.y] && WALKABLE.has(grid[c.y][c.x]));
  // Primero se busca un lugar que caiga sobre la avenida (así el
  // marcador queda enfrente del edificio, sobre el camino).
  return walkable.find((c) => grid[c.y][c.x] === "path") || walkable[0] || null;
}

function buildLevel() {
  // --- 1. Expandir el plano de texto a tiles ---
  const grid = [];
  for (let y = 0; y < ROWS; y++) grid.push(new Array(COLS).fill("grass"));

  const boxes = {}; // id -> caja en tiles
  const islandChars = [];
  let entradaChar = null;

  for (let cy = 0; cy < MAP_BLUEPRINT.length; cy++) {
    const row = MAP_BLUEPRINT[cy];
    for (let cx = 0; cx < row.length; cx++) {
      const ch = row[cx];
      const type = charToTile(ch);

      if (ch === "A") entradaChar = { cx, cy };
      if (ch === "o") islandChars.push({ cx, cy });

      const info = BUILDING_CHARS[ch];
      if (info && info.id !== "generico") {
        const b = boxes[info.id] || (boxes[info.id] = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity, info });
        b.x0 = Math.min(b.x0, cx * CHAR_SCALE);
        b.y0 = Math.min(b.y0, cy * CHAR_SCALE);
        b.x1 = Math.max(b.x1, cx * CHAR_SCALE + CHAR_SCALE - 1);
        b.y1 = Math.max(b.y1, cy * CHAR_SCALE + CHAR_SCALE - 1);
      }

      for (let dy = 0; dy < CHAR_SCALE; dy++) {
        for (let dx = 0; dx < CHAR_SCALE; dx++) {
          grid[cy * CHAR_SCALE + dy][cx * CHAR_SCALE + dx] = type;
        }
      }
    }
  }

  // --- 2. Volver a tallar la isla ---
  // Antes acá se llamaba a smoothWater(grid, 2) para "redondear" el lago,
  // pero esa suavizada orgánica (regla de mayoría de 8 vecinos) convierte
  // el borde en una escalera de 1 tile por fila. Las piezas de orilla
  // animadas (ver WATER_*_ANIM_FRAMES más abajo) solo cubren tramos
  // rectos largos y una esquina de 90° por vez —no hay pieza para una
  // escalera diagonal— así que esa escalera se veía como una fila de
  // puntas triangulares en vez de una curva prolija. El plano en texto
  // (blueprint.js) ya dibuja el angostamiento arriba/abajo del lago a
  // mano, así que se deja tal cual sale de ahí.
  if (islandChars.length) {
    const cx =
      (islandChars.reduce((s, c) => s + c.cx, 0) / islandChars.length) * CHAR_SCALE + CHAR_SCALE / 2;
    const cy =
      (islandChars.reduce((s, c) => s + c.cy, 0) / islandChars.length) * CHAR_SCALE + CHAR_SCALE / 2;
    carveCircle(grid, cx, cy, CHAR_SCALE * 1.2, "grass");
  }
  LAGO_REDONDO.forEach((c) => carveCircle(grid, c.cx, c.cy, c.r, "water"));
  LAGO_NORTE.forEach((r) => {
    for (let y = r.y0; y <= LAGO_NORTE_Y1; y++) {
      for (let x = r.x0; x <= r.x1; x++) if (grid[y][x] === "grass") grid[y][x] = "water";
    }
  });
  // Puente vertical sobre el canal del oeste.
  for (let y = CANAL_BRIDGE.yWater0; y <= CANAL_BRIDGE.yWater1; y++) {
    for (let x = CANAL_BRIDGE.x; x < CANAL_BRIDGE.x + 2; x++) grid[y][x] = "bridge";
  }
  // Los puentes se vuelven a pintar por si el suavizado los rozó.
  for (let cy = 0; cy < MAP_BLUEPRINT.length; cy++) {
    for (let cx = 0; cx < MAP_BLUEPRINT[cy].length; cx++) {
      if (MAP_BLUEPRINT[cy][cx] !== "=") continue;
      for (let dy = 0; dy < CHAR_SCALE; dy++) {
        for (let dx = 0; dx < CHAR_SCALE; dx++) {
          grid[cy * CHAR_SCALE + dy][cx * CHAR_SCALE + dx] = "bridge";
        }
      }
    }
  }

  // --- 2.5. Recortar los caminos al ancho real (principal/secundario) ---
  narrowPaths(grid);

  // --- 3. Borde del mapa ---
  for (let x = 0; x < COLS; x++) {
    grid[0][x] = "wall";
    grid[ROWS - 1][x] = "wall";
  }
  for (let y = 0; y < ROWS; y++) {
    grid[y][0] = "wall";
    grid[y][COLS - 1] = "wall";
  }

  // --- 3.5. Los Hangares: 4 galpones sueltos en vez de un bloque sólido ---
  // La zona "H" del plano es un rectángulo grande (para reservar espacio
  // en el plano), pero visualmente queremos 4 edificios angostos y
  // separados. Se vacía el rectángulo a pasto y se tallan 4 galpones de
  // HANGAR_TILE_W x HANGAR_TILE_H, alternando color.
  const hangarRects = [];
  const hangarZone = boxes.hangares;
  if (hangarZone) {
    for (let y = hangarZone.y0; y <= hangarZone.y1; y++) {
      for (let x = hangarZone.x0; x <= hangarZone.x1; x++) {
        grid[y][x] = "grass";
      }
    }
    const offsets = [
      { dx: 0, dy: 0, color: "blue" },
      { dx: 7, dy: 0, color: "green" },
      { dx: 0, dy: 4, color: "green" },
      { dx: 7, dy: 4, color: "blue" },
    ];
    offsets.forEach(({ dx, dy, color }) => {
      const x0 = HANGARES_X + dx;
      const y0 = hangarZone.y0 + dy;
      const rect = { x0, y0, x1: x0 + HANGAR_TILE_W - 1, y1: y0 + HANGAR_TILE_H - 1, color };
      hangarRects.push(rect);
      for (let y = rect.y0; y <= rect.y1; y++) {
        for (let x = rect.x0; x <= rect.x1; x++) {
          if (grid[y] && grid[y][x] !== undefined) grid[y][x] = "hangar";
        }
      }
    });
    // El marcador/etiqueta de "Los Hangares" debe quedar pegado a un
    // galpón real (el primero), no flotando en el pasto del medio.
    boxes.hangares = { ...hangarRects[0], info: hangarZone.info };
  }

  // --- 3.6. La Cafetería: edificio real en la zona, sin llenarla ---
  // La zona "F" del plano es un rectángulo grande (igual que Hangares),
  // pero acá no hace falta llenarla: se vacía a pasto (caminable) y
  // adentro se talla solo el edificio (bloquea el paso). OJO: no se toca `boxes.cafeteria` — se
  // deja tal cual para que el marcador/diálogo siga apareciendo en el
  // mismo lugar de siempre (justo debajo de toda la zona).
  let cafeteriaBuilding = null;
  const cafeteriaZone = boxes.cafeteria;
  if (cafeteriaZone) {
    for (let y = cafeteriaZone.y0; y <= cafeteriaZone.y1; y++) {
      for (let x = cafeteriaZone.x0; x <= cafeteriaZone.x1; x++) {
        if (grid[y] && grid[y][x] !== undefined) grid[y][x] = "grass";
      }
    }
    const bx0 = CAFETERIA_BUILDING_X;
    const by0 = cafeteriaZone.y1 - CAFETERIA_BUILDING_H + 1;
    cafeteriaBuilding = { x0: bx0, y0: by0, x1: bx0 + CAFETERIA_BUILDING_W - 1, y1: by0 + CAFETERIA_BUILDING_H - 1 };
    for (let y = cafeteriaBuilding.y0; y <= cafeteriaBuilding.y1; y++) {
      for (let x = cafeteriaBuilding.x0; x <= cafeteriaBuilding.x1; x++) {
        if (CAFETERIA_MASK[y - by0][x - bx0] && grid[y] && grid[y][x] === "grass") grid[y][x] = "cafe";
      }
    }
  }

  // --- 3.7. La Biblioteca: un edificio real en la zona, sin llenarla ---
  // Igual que la cafetería: no se toca `boxes.biblioteca` para que el
  // marcador de diálogo siga cayendo debajo de toda la zona.
  let bibliotecaBuilding = null;
  const bibliotecaZone = boxes.biblioteca;
  if (bibliotecaZone) {
    for (let y = bibliotecaZone.y0; y <= bibliotecaZone.y1; y++) {
      for (let x = bibliotecaZone.x0; x <= bibliotecaZone.x1; x++) {
        if (grid[y] && grid[y][x] !== undefined) grid[y][x] = "grass";
      }
    }
    const bx0 = BIBLIOTECA_X;
    const by0 = bibliotecaZone.y0;
    bibliotecaBuilding = { x0: bx0, y0: by0, x1: bx0 + BIBLIOTECA_W - 1, y1: by0 + BIBLIOTECA_H - 1 };
    for (let y = bibliotecaBuilding.y0; y <= bibliotecaBuilding.y1; y++) {
      for (let x = bibliotecaBuilding.x0; x <= bibliotecaBuilding.x1; x++) {
        if (BIBLIOTECA_MASK[y - by0][x - bx0] && grid[y] && grid[y][x] === "grass") grid[y][x] = "biblioteca";
      }
    }
  }
  // Ladybug (easter egg) va en el pasto junto a la Biblioteca.
  const ladybugPos = bibliotecaBuilding ? { x: bibliotecaBuilding.x1 + 2, y: bibliotecaBuilding.y1 - 2 } : null;

  // --- 3.8. Mar Caribe: edificio grande, arrimado al fondo de su zona ---
  let marCaribeBuilding = null;
  const marCaribeZone = boxes.mar_caribe;
  if (marCaribeZone) {
    const bx0 = MAR_CARIBE_X;
    const by0 = marCaribeZone.y1 - MAR_CARIBE_H + 1;
    marCaribeBuilding = { x0: bx0, y0: by0, x1: bx0 + MAR_CARIBE_W - 1, y1: marCaribeZone.y1 };
    for (let y = marCaribeZone.y0; y <= marCaribeZone.y1; y++) {
      for (let x = marCaribeZone.x0; x <= marCaribeZone.x1; x++) {
        if (grid[y] && grid[y][x] !== undefined) grid[y][x] = "grass";
      }
    }
    for (let y = by0; y <= marCaribeBuilding.y1; y++) {
      for (let x = bx0; x < bx0 + MAR_CARIBE_W; x++) {
        if (MAR_CARIBE_MASK[y - by0][x - bx0] && grid[y] && grid[y][x] === "grass") grid[y][x] = "mar";
      }
    }
  }

  // --- 3.9. Ciénaga Grande: edificio de aulas, arrimado al fondo de su zona ---
  let cienagaBuilding = null;
  const cienagaZone = boxes.cienaga;
  if (cienagaZone) {
    const bx0 = CIENAGA_X;
    const by0 = cienagaZone.y1 - AULAS_H + 1;
    cienagaBuilding = { x0: bx0, y0: by0, x1: bx0 + AULAS_W - 1, y1: cienagaZone.y1 };
    for (let y = cienagaZone.y0; y <= cienagaZone.y1; y++) {
      for (let x = cienagaZone.x0; x <= cienagaZone.x1; x++) {
        if (grid[y] && grid[y][x] !== undefined) grid[y][x] = "grass";
      }
    }
    for (let y = by0; y <= cienagaBuilding.y1; y++) {
      for (let x = bx0; x < bx0 + AULAS_W; x++) {
        if (AULAS_MASK[y - by0][x - bx0] && grid[y] && grid[y][x] === "grass") grid[y][x] = "aulas";
      }
    }
  }

  // --- 3.10. Sierra Nevada: el mismo edificio de aulas que Ciénaga ---
  let sierraBuilding = null;
  const sierraZone = boxes.sierra_nevada;
  if (sierraZone) {
    const bx0 = SIERRA_X;
    const by0 = sierraZone.y1 - AULAS_H + 1;
    sierraBuilding = { x0: bx0, y0: by0, x1: bx0 + AULAS_W - 1, y1: sierraZone.y1 };
    for (let y = sierraZone.y0; y <= sierraZone.y1; y++) {
      for (let x = sierraZone.x0; x <= sierraZone.x1; x++) {
        if (grid[y] && grid[y][x] !== undefined) grid[y][x] = "grass";
      }
    }
    for (let y = by0; y <= sierraBuilding.y1; y++) {
      for (let x = bx0; x < bx0 + AULAS_W; x++) {
        if (AULAS_MASK[y - by0][x - bx0] && grid[y] && grid[y][x] === "grass") grid[y][x] = "aulas";
      }
    }
  }

  // --- 3.11. Bloque 8: edificio cuadrado, arriba de su zona ---
  let bloque8Building = null;
  const bloque8Zone = boxes.bloque8;
  if (bloque8Zone) {
    const bx0 = BLOQUE8_X;
    const by0 = bloque8Zone.y0 + BLOQUE8_DROP; // un poco más abajo del tope de su zona
    bloque8Building = { x0: bx0, y0: by0, x1: bx0 + BLOQUE8_W - 1, y1: by0 + BLOQUE8_H - 1 };
    for (let y = bloque8Zone.y0; y <= bloque8Zone.y1; y++) {
      for (let x = bloque8Zone.x0; x <= bloque8Zone.x1; x++) {
        if (grid[y] && grid[y][x] !== undefined) grid[y][x] = "grass";
      }
    }
    for (let y = by0; y <= bloque8Building.y1; y++) {
      for (let x = bx0; x < bx0 + BLOQUE8_W; x++) {
        if (BLOQUE8_MASK[y - by0][x - bx0] && grid[y] && grid[y][x] === "grass") grid[y][x] = "b8";
      }
    }
  }
  // Máximus (el caballo de Rapunzel) va en el pasto junto a Bloque 8, lejos de ella.
  const maximusPos = bloque8Building ? { x: bloque8Building.x1 + 2, y: bloque8Building.y1 } : null;

  // --- 3.12. Bloque 3: edificio alargado, centrado en su zona ---
  let bloque3Building = null;
  const bloque3Zone = boxes.bloque3;
  if (bloque3Zone) {
    const zoneW = bloque3Zone.x1 - bloque3Zone.x0 + 1;
    const bx0 = bloque3Zone.x0 + Math.floor((zoneW - BLOQUE3_W) / 2);
    const by0 = bloque3Zone.y1 - BLOQUE3_H + 1;
    bloque3Building = { x0: bx0, y0: by0, x1: bx0 + BLOQUE3_W - 1, y1: bloque3Zone.y1 };
    for (let y = bloque3Zone.y0; y <= bloque3Zone.y1; y++) {
      for (let x = bloque3Zone.x0; x <= bloque3Zone.x1; x++) {
        if (grid[y] && grid[y][x] !== undefined) grid[y][x] = "grass";
      }
    }
    for (let y = by0; y <= bloque3Building.y1; y++) {
      for (let x = bx0; x < bx0 + BLOQUE3_W; x++) {
        if (BLOQUE3_MASK[y - by0][x - bx0] && grid[y] && grid[y][x] === "grass") grid[y][x] = "b3";
      }
    }
  }

  // --- 3.13. Plazas, caminos y decoración ---
  const paved = Array.from({ length: ROWS }, () => new Array(COLS).fill(""));
  const pintarPiso = (rects, val) =>
    rects.forEach((r) => {
      for (let y = r.y0; y <= r.y1; y++) {
        for (let x = r.x0; x <= r.x1; x++) {
          if (grid[y] && grid[y][x] === "grass" && !paved[y][x]) paved[y][x] = val;
        }
      }
    });
  pintarPiso(PLAZAS, "P");
  pintarPiso(CAMINOS, "P");
  CAMINO_DIAGONAL_TILES.forEach(({ x, y }) => {
    if (grid[y] && grid[y][x] === "grass" && !paved[y][x]) paved[y][x] = "P";
  });
  const rectsLargos = CAMINOS_LARGOS.map((c) => (c.dir === "v" ? { ...c, x1: c.x0 + 4 } : { ...c, y1: c.y0 + 4 }));
  pintarPiso(rectsLargos, "P");
  pintarPiso([CAMINO_A_ANEXO], "P");
  pintarPiso(CAMINO_BORDE_ESTE, "P");
  pintarPiso([PLAZA_CAFETERIA], "P");
  pintarPiso([PARQUEADERO], "A");
  {
    const { cx, cy, rExt, rInt, conector } = PLAZA_REDONDA;
    for (let y = Math.floor(cy - rExt); y <= Math.ceil(cy + rExt); y++) {
      for (let x = Math.floor(cx - rExt); x <= Math.ceil(cx + rExt); x++) {
        const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
        if (d > rInt && d <= rExt && grid[y] && grid[y][x] === "grass" && !paved[y][x]) paved[y][x] = "P";
      }
    }
    pintarPiso([conector, PLAZA_REDONDA.camino], "P");
    if (grid[ARBOL_GRANDE_TILE.y] && grid[ARBOL_GRANDE_TILE.y][ARBOL_GRANDE_TILE.x] === "grass") grid[ARBOL_GRANDE_TILE.y][ARBOL_GRANDE_TILE.x] = "deco";
    BOSQUE_ARBOLES.forEach(([, , bx, by, tronco]) => {
      if (tronco && grid[by] && grid[by][bx] === "grass") grid[by][bx] = "deco";
    });
    [...BOSQUE_PIEZAS.map(([, , w, h, x, y, solido]) => [w, h, x, y, solido]), ...ORILLA_PIEZAS.map(([, , , w, h, x, y, solido]) => [w, h, x, y, solido])].forEach(([w, h, x, y, solido]) => {
      const tx = Math.floor((x + w / 2) / TILE);
      const ty = Math.floor((y + h - 1) / TILE);
      if (solido && grid[ty] && grid[ty][tx] === "grass") grid[ty][tx] = "deco";
    });
    for (let y = 0; y < ROWS; y++) {
      for (let x = 10; x <= 38; x++) {
        if (enBosque(x, y) && grid[y] && grid[y][x] === "grass") grid[y][x] = "deco";
      }
    }
    parqueaderoAutos().forEach((a) => {
      for (let ty = Math.floor(a.y / TILE); ty <= Math.floor((a.y + a.h - 1) / TILE); ty++) {
        for (let tx = Math.floor(a.x / TILE); tx <= Math.floor((a.x + a.w - 1) / TILE); tx++) {
          const cx = tx * TILE + TILE / 2;
          const cy = ty * TILE + TILE / 2;
          if (cx >= a.x && cx <= a.x + a.w && cy >= a.y && cy <= a.y + a.h && grid[ty] && grid[ty][tx] === "grass") grid[ty][tx] = "deco";
        }
      }
    });
    if (bloque8Building) {
      const mx = Math.floor(((bloque8Building.x1 + 1) * TILE - 32) / TILE);
      for (let x = mx; x <= bloque8Building.x1; x++) {
        const y = bloque8Building.y1 + 1;
        if (grid[y] && grid[y][x] === "grass") grid[y][x] = "deco";
      }
    }
  }

  // Árboles y farolas de los caminos largos. Un objeto se pone solo si todo su
  // rectángulo cae sobre pasto, no toca otro camino ni otro objeto, y queda a
  // más de un tile de los personajes, marcadores y el respawn.
  const decor = DECOR.filter((d) => (d.tipo !== "farola" || !enSinFarolas(d)) && !enPlazaCafeteria(d.x, d.y));
  const ocupado = new Set();
  const marcar = (d) => {
    const t = DECOR_TAM[d.tipo];
    for (let dy = 0; dy < t.h; dy++) for (let dx = 0; dx < t.w; dx++) ocupado.add(`${d.x + dx},${d.y + dy}`);
  };
  decor.forEach(marcar);
  const evitar = [NAMJOON_POS, SAPO_POS, TIKKI_POS, TIANA_POS, RAPUNZEL_POS, BIBI_POS, SPAWN_TILE];
  if (maximusPos) evitar.push(maximusPos);
  if (ladybugPos) evitar.push(ladybugPos);
  const duenos = new Map();
  rectsLargos.forEach((r, i) => {
    for (let y = r.y0; y <= r.y1; y++) for (let x = r.x0; x <= r.x1; x++) {
      const k2 = `${x},${y}`;
      duenos.set(k2, [...(duenos.get(k2) || []), i]);
    }
  });
  const intentar = (d, propio) => {
    const t = DECOR_TAM[d.tipo];
    if (d.tipo === "farola" && enSinFarolas(d)) return;
    for (let dy = 0; dy < t.h; dy++) {
      for (let dx = 0; dx < t.w; dx++) {
        if (enPlazaCafeteria(d.x + dx, d.y + dy)) return;
        const x = d.x + dx;
        const y = d.y + dy;
        if (!grid[y] || grid[y][x] !== "grass") return;
        if (ocupado.has(`${x},${y}`)) return;
        if ((duenos.get(`${x},${y}`) || []).some((j) => j !== propio)) return;
        if (evitar.some((p) => Math.abs(p.x - x) <= 1 && Math.abs(p.y - y) <= 1)) return;
        // Entrada a la plaza redonda: nada que estorbe el paso.
        if (x >= 12 && x <= 18 && y >= 63 && y <= 69) return;
        // Acceso al puente del canal: nada de árboles ni farolas ahí.
        if (x >= CANAL_BRIDGE.x - 1 && x <= CANAL_BRIDGE.x + 2 && y >= CANAL_BRIDGE.yWater0 - 2 && y <= CANAL_BRIDGE.yWater1 + 2) return;
      }
    }
    decor.push(d);
    marcar(d);
  };
  rectsLargos.forEach((r, i) => {
    if (r.dir === "v") {
      for (let y = r.y0 + 2; y + 2 <= r.y1; y += 7) {
        intentar({ tipo: "arbol", x: r.x0 + 1, y }, i);
        intentar({ tipo: "farola", x: r.x0 - 1, y: y + 3 }, i);
        intentar({ tipo: "farola", x: r.x0 + 4, y: y + 3 }, i);
      }
    } else {
      for (let x = r.x0 + 2; x + 2 <= r.x1; x += 7) {
        intentar({ tipo: "arbol", x, y: r.y0 + 1 }, i);
        intentar({ tipo: "farola", x: x + 4, y: r.y0 - 2 }, i);
        intentar({ tipo: "farola", x: x + 4, y: r.y0 + 2 }, i);
      }
    }
  });

  // Las farolas pegadas al bosque se dibujan como objetos del juego (delante de las
  // copas de los árboles que quedan detrás), no horneadas en el terreno.
  decor.forEach((d) => {
    if (d.tipo !== "farola") return;
    for (let ty = d.y - 1; ty <= d.y + 3; ty++) {
      for (let tx = d.x - 1; tx <= d.x + 2; tx++) {
        if (enBosque(tx, ty)) d.objeto = true;
      }
    }
    BOSQUE_ARBOLES.forEach(([tam, , bx, by, tronco]) => {
      if (!tronco) return;
      const { w, h } = BOSQUE_TAM[tam];
      const x0 = bx * TILE + 8 - w / 2;
      const y0 = (by + 1) * TILE - h;
      if (d.x * TILE < x0 + w && d.x * TILE + 32 > x0 && d.y * TILE < y0 + 0.7 * h && d.y * TILE + 48 > y0) d.objeto = true;
    });
  });
  // Farolas y bancas son objetos del juego (el personaje queda detrás si está al norte
  // de la base). La farola se corre 8 px para que el poste caiga en el centro de UN solo
  // tile, el de la base (d.col: 0 = izquierdo, 1 = derecho): el que no es piso, para
  // que el poste quede en el pasto junto al borde y no le quite ancho al camino.
  decor.forEach((d) => {
    if (d.tipo === "farola") {
      const fila = d.y + 2;
      const piso = (x) => !!(paved[fila] && paved[fila][x]);
      d.col = piso(d.x) && !piso(d.x + 1) ? 1 : 0;
      d.objeto = true;
    } else if (d.tipo === "banca") {
      d.objeto = true;
    }
  });
  decor.forEach((d) => {
    const t = DECOR_TAM[d.tipo];
    const cols = d.tipo === "farola" ? [d.col] : t.colsSolidas;
    t.solidas.forEach((fila) => {
      for (let dx = 0; dx < t.w; dx++) {
        if (cols && !cols.includes(dx)) continue;
        const x = d.x + dx;
        const y = d.y + fila;
        if (grid[y] && grid[y][x] === "grass") grid[y][x] = "deco";
      }
    });
  });

  terrazaPiezas().forEach((pz) => {
    pz.tiles.forEach(([tx, ty]) => {
      if (grid[ty] && grid[ty][tx] === "grass") grid[ty][tx] = "deco";
    });
  });

  // --- 4. Etiquetas y marcadores de cada edificio ---
  const labels = [];
  const stopTiles = new Map();
  const stopMarks = {};

  Object.entries(boxes).forEach(([id, box]) => {
    const entry = TIMELINE.find((t) => t.id === id);
    const text = entry ? entry.place : box.info.label;
    // La etiqueta va arriba del edificio real (que puede estar corrido o ser
    // más alto que su zona), no arriba de la zona.
    const shape = { cafeteria: cafeteriaBuilding, biblioteca: bibliotecaBuilding, mar_caribe: marCaribeBuilding, cienaga: cienagaBuilding, sierra_nevada: sierraBuilding, bloque8: bloque8Building, bloque3: bloque3Building }[id] || box;
    if (text) labels.push({ x: shape.x0, y: shape.y0 - 1, text });

    if (!entry) return;
    const spot = MARCADOR_MANUAL[id] || findMarkerSpot(grid, box);
    if (!spot) return;
    grid[spot.y][spot.x] = "marker";
    stopTiles.set(`${spot.x},${spot.y}`, entry);
    stopMarks[id] = spot;
  });

  // --- 5. Entrada y punto de reencuentro ---
  const entrada = entradaChar
    ? { x: entradaChar.cx * CHAR_SCALE + 2, y: entradaChar.cy * CHAR_SCALE + 2 }
    : SPAWN_TILE;
  grid[entrada.y][entrada.x] = "markerA";

  // El reencuentro con vos queda pegado al marcador ("!") de Bloque 3: ese marcador es lo que
  // dispara el diálogo (ver el caso especial de "bloque3" en checkTrigger), no el acercarse al
  // personaje que espera ahí.
  const b3 = stopMarks.bloque3;
  const sweetheart = b3 ? { x: b3.x + 1, y: b3.y } : { x: 2, y: 3 };
  grid[sweetheart.y][sweetheart.x] = "sweetheart";

  return { grid, labels, stopTiles, stopMarks, entrada, sweetheart, hangarRects, cafeteriaBuilding, bibliotecaBuilding, marCaribeBuilding, cienagaBuilding, sierraBuilding, bloque8Building, bloque3Building, paved, decor, maximusPos, ladybugPos };
}

// El plano no cambia en tiempo real, así que el nivel se arma y se
// hornea una sola vez acá (no cada vez que se entra a la escena "game").
const LEVEL = buildLevel();
const WATER_TOP_SHORE_TILES = [];
const WATER_RIGHT_SHORE_TILES = [];
const WATER_LEFT_SHORE_TILES = [];
const WATER_BOTTOM_SHORE_TILES = [];
const WATER_NW_SHORE_TILES = [];
const WATER_NE_SHORE_TILES = [];
const WATER_SW_SHORE_TILES = [];
const WATER_SE_SHORE_TILES = [];
const WATER_NW_DIAG_SHORE_TILES = [];
const WATER_SE_DIAG_SHORE_TILES = [];
const WATER_NE_DIAG_SHORE_TILES = [];
const WATER_SW_DIAG_SHORE_TILES = [];
k.loadSprite("deco-arbol", imgDecoArbol);
k.loadSprite("deco-farola", imgDecoFarola);
k.loadSprite("deco-banca", imgDecoBanca);
k.loadSprite("terraza-mesa", "Free/Terraza_Mesa.png");
k.loadSprite("terraza-silla-atras-1", "Free/Terraza_Silla_Atras_1.png");
k.loadSprite("terraza-silla-atras-2", "Free/Terraza_Silla_Atras_2.png");
k.loadSprite("terraza-silla-lado", "Free/Terraza_Silla_Lado.png");
k.loadSprite("objeto-aretes", "Free/Objeto_Aretes_Marinette.png");
k.loadSprite("objeto-tiara", "Free/Objeto_Tiara_Tiana.png");
k.loadSprite("objeto-sarten", "Free/Objeto_Sarten_Rapunzel.png");
k.loadSprite("objeto-stardrop", "Free/Objeto_StarDrop_Bibi.png");
k.loadSprite("objeto-armybomb", "Free/Objeto_ArmyBomb_Koya.png");
const arbolGrandeCanvas = document.createElement("canvas");
arbolGrandeCanvas.width = PLAZA_REDONDA.arbol.w;
arbolGrandeCanvas.height = PLAZA_REDONDA.arbol.h;
arbolGrandeCanvas.getContext("2d").drawImage(imgArbolGrande, PLAZA_REDONDA.arbol.srcX, PLAZA_REDONDA.arbol.srcY, PLAZA_REDONDA.arbol.w, PLAZA_REDONDA.arbol.h, 0, 0, PLAZA_REDONDA.arbol.w, PLAZA_REDONDA.arbol.h);
k.loadSprite("arbol-grande", arbolGrandeCanvas);
const BOSQUE_IMG = { L: imgArbolL, M: imgArbolGrande, S: imgArbolS, X: imgArbolX };
new Set(BOSQUE_ARBOLES.map((a) => a[0] + a[1])).forEach((clave) => {
  const [ox, oy] = BOSQUE_ORIGEN[clave[0]][clave[1]];
  const { w, h } = BOSQUE_TAM[clave[0]];
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  cv.getContext("2d").drawImage(BOSQUE_IMG[clave[0]], ox, oy, w, h, 0, 0, w, h);
  k.loadSprite(`bosque-${clave}`, cv);
});
k.loadSprite(
  "terrain",
  bakeTerrain(
    LEVEL.grid,
    LEVEL.hangarRects,
    WATER_TOP_SHORE_TILES,
    WATER_RIGHT_SHORE_TILES,
    WATER_LEFT_SHORE_TILES,
    WATER_BOTTOM_SHORE_TILES,
    WATER_NW_SHORE_TILES,
    WATER_NE_SHORE_TILES,
    WATER_SW_SHORE_TILES,
    WATER_SE_SHORE_TILES,
    WATER_NW_DIAG_SHORE_TILES,
    WATER_SE_DIAG_SHORE_TILES,
    WATER_NE_DIAG_SHORE_TILES,
    WATER_SW_DIAG_SHORE_TILES,
    LEVEL.cafeteriaBuilding,
    LEVEL.bibliotecaBuilding,
    LEVEL.marCaribeBuilding,
    LEVEL.cienagaBuilding,
    LEVEL.sierraBuilding,
    LEVEL.bloque8Building,
    LEVEL.bloque3Building,
    LEVEL.paved,
    LEVEL.decor
  )
);

// ---------------------------------------------------------------------
// Escena: título
// ---------------------------------------------------------------------
k.loadSprite("title-bg", `assets/title-bg.png?v=${ASSET_VERSION}`);
k.loadSprite("title-logo", `assets/title-logo.png?v=${ASSET_VERSION}`);
k.scene("title", () => {
  // El color de fondo del motor es el verde del pasto (para que combine con el mapa mientras se
  // juega); en el título, con la foto de fondo, esas franjas del letterbox quedaban verdes y
  // desentonaban. Acá se cambia a un tono oscuro que se mezcla mejor, y se restaura al entrar a
  // "game" (ver más abajo).
  k.setBackground(14, 16, 26);
  k.add([k.sprite("title-bg"), k.pos(0, 0), k.z(0)]);
  k.add([k.sprite("title-logo"), k.anchor("top"), k.pos((VIEW_COLS * TILE) / 2, 10), k.z(1)]);
  k.add([
    k.text("Presiona Espacio para empezar", { size: 8 }),
    k.anchor("center"),
    k.pos((VIEW_COLS * TILE) / 2, VIEW_ROWS * TILE - 16),
    k.color(50, 34, 30), // oscuro: el fondo ahí es claro (pasto/manta), un color claro no se leía
    k.z(1),
  ]);
  // Música de la pantalla de título: arranca al entrar y se corta al pasar al juego. El
  // navegador bloquea el autoplay con sonido hasta la primera interacción de la persona con la
  // página (política estándar, no un bug): por eso, además de intentarlo de una, se reintenta en
  // el primer click/tecla si el primer intento fue bloqueado.
  const musicaTitulo = new Audio("assets/title-theme.mp3");
  musicaTitulo.loop = true;
  musicaTitulo.volume = TITULO_VOLUMEN;
  const intentarReproducirTitulo = () => {
    if (!musicaTitulo.paused) return;
    const p = musicaTitulo.play();
    if (p?.catch) p.catch(() => {});
  };
  intentarReproducirTitulo();
  document.addEventListener("pointerdown", intentarReproducirTitulo);
  document.addEventListener("keydown", intentarReproducirTitulo);

  k.onKeyPress("space", () => {
    document.removeEventListener("pointerdown", intentarReproducirTitulo);
    document.removeEventListener("keydown", intentarReproducirTitulo);
    musicaTitulo.pause();
    k.go("game");
  });
});

// ---------------------------------------------------------------------
// Escena: juego
// ---------------------------------------------------------------------
k.scene("game", () => {
  k.setBackground(0, 0, 0); // letterbox negro, igual que el título y el final
  const { grid, labels, stopTiles, stopMarks, entrada, sweetheart } = LEVEL;

  // Música ambiente del juego: arranca en loop y se pausa/reanuda sola al hablar con los NPCs
  // (ver iniciarMusicaDialogo/detenerMusicaDialogo).
  musicaAmbiente = new Audio("assets/game-theme.mp3");
  musicaAmbiente.loop = true;
  musicaAmbiente.volume = AMBIENTE_VOLUMEN;
  const reproduccionAmbiente = musicaAmbiente.play();
  if (reproduccionAmbiente?.catch) reproduccionAmbiente.catch(() => {});

  // Progreso lineal: al empezar solo se puede interactuar con Tikki; cada NPC desbloquea el
  // siguiente de esta lista al entregar su objeto. Bloque 3 (el reencuentro) queda como el
  // último paso, después de Koya: recién ahí se ve su "!".
  const ORDEN_NPCS = ["hangares", "mar_caribe", "cienaga", "sierra_nevada", "cafeteria", "bloque3"];
  // Bloque 3 no es un fragmento: es la interacción final, que se desbloquea al juntar los 5
  // objetos (uno por cada NPC de RECOMPENSA_SPRITES). Por eso el total sale de ahí y no de
  // TIMELINE.length (que incluye también a Bloque 3).
  const TOTAL_FRAGMENTS = Object.keys(RECOMPENSA_SPRITES).length;
  const collected = cargarProgreso();
  const desbloqueado = (id) => {
    const i = ORDEN_NPCS.indexOf(id);
    return i === -1 || i <= collected.size;
  };

  // El terreno (pasto/agua/camino/puente) ya viene horneado en un solo
  // sprite (ver bakeTerrain). Acá solo faltan los tiles "especiales"
  // (pared, edificio, marcadores), que se siguen agrupando por fila en
  // un rectángulo para no crear un objeto por tile.
  k.add([k.sprite("terrain"), k.pos(0, 0), k.z(0)]);

  // Bordes del lago animados: unos pocos tiles nada más (no todo el
  // mapa), así que van como objetos normales encima del terreno
  // horneado, ciclando entre los 4 cuadros a la vez.
  function addShoreAnim(tiles, frames) {
    const objs = tiles.map(({ x, y }) =>
      k.add([k.sprite("water-anim", { frame: frames[0] }), k.pos(x * TILE, y * TILE), k.z(1)])
    );
    if (!objs.length) return;
    let i = 0;
    k.loop(WATER_TOP_ANIM_SPEED, () => {
      i = (i + 1) % frames.length;
      const frame = frames[i];
      objs.forEach((obj) => (obj.frame = frame));
    });
  }
  addShoreAnim(WATER_TOP_SHORE_TILES, WATER_TOP_ANIM_FRAMES);
  addShoreAnim(WATER_RIGHT_SHORE_TILES, WATER_RIGHT_ANIM_FRAMES);
  addShoreAnim(WATER_LEFT_SHORE_TILES, WATER_LEFT_ANIM_FRAMES);
  addShoreAnim(WATER_BOTTOM_SHORE_TILES, WATER_BOTTOM_ANIM_FRAMES);
  addShoreAnim(WATER_NW_SHORE_TILES, WATER_NW_ANIM_FRAMES);
  addShoreAnim(WATER_NE_SHORE_TILES, WATER_NE_ANIM_FRAMES);
  addShoreAnim(WATER_SW_SHORE_TILES, WATER_SW_ANIM_FRAMES);
  addShoreAnim(WATER_SE_SHORE_TILES, WATER_SE_ANIM_FRAMES);
  addShoreAnim(WATER_NW_DIAG_SHORE_TILES, WATER_NW_DIAG_ANIM_FRAMES);
  addShoreAnim(WATER_SE_DIAG_SHORE_TILES, WATER_SE_DIAG_ANIM_FRAMES);
  addShoreAnim(WATER_NE_DIAG_SHORE_TILES, WATER_NE_DIAG_ANIM_FRAMES);
  addShoreAnim(WATER_SW_DIAG_SHORE_TILES, WATER_SW_DIAG_ANIM_FRAMES);

  // Animaciones sueltas del agua abierta: cada una arranca en un punto distinto de su
  // ciclo (fase fija según su posición) para que no parpadeen todas a la vez.
  const animsAgua = WATER_DECOR_TILES.filter(([x, y]) => grid[y] && grid[y][x] === "water").map(([x, y, tipo]) => {
    const def = WATER_DECOR_ANIM[tipo];
    const obj = k.add([k.sprite("water-anim", { frame: def.frames[0] }), k.pos(x * TILE, y * TILE), k.opacity(1), k.z(1)]);
    const util = def.frames.length * def.velocidad;
    const espera = def.pausa ? def.pausa[0] + ((x * 3 + y * 5) % (def.pausa[1] - def.pausa[0] + 1)) : 0;
    const ciclo = util + espera;
    return { obj, def, util, ciclo, desfase: (((x * 7 + y * 13) % 16) / 16) * ciclo };
  });
  k.onUpdate(() => {
    const t = k.time();
    animsAgua.forEach((a) => {
      const p = (t + a.desfase) % a.ciclo;
      if (p >= a.util) {
        if (a.obj.opacity !== 0) a.obj.opacity = 0;
        return;
      }
      if (a.obj.opacity !== 1) a.obj.opacity = 1;
      const frame = a.def.frames[Math.floor(p / a.def.velocidad)];
      if (a.obj.frame !== frame) a.obj.frame = frame;
    });
  });

  for (let y = 0; y < ROWS; y++) {
    let x = 0;
    while (x < COLS) {
      const type = grid[y][x];
      if (type === "grass" || type === "water" || type === "path" || type === "bridge" || type === "hangar" || type === "cafe" || type === "biblioteca" || type === "mar" || type === "aulas" || type === "b8" || type === "b3" || type === "deco" || type === "marker" || type === "sweetheart") {
        // "marker" se dibuja aparte, más abajo, tile por tile (ver npcMarkerObjs): cada uno
        // aparece o se oculta según el progreso, así que no puede ir en este bloque agrupado.
        x++;
        continue;
      }
      let end = x;
      while (end + 1 < COLS && grid[y][end + 1] === type) end++;
      const len = end - x + 1;
      k.add([k.rect(TILE * len, TILE), k.pos(x * TILE, y * TILE), k.color(...COLORS[type]), k.z(0)]);

      if (type === "markerA") {
        k.add([k.text("A", { size: 8 }), k.pos(x * TILE + 4, y * TILE - 1), k.color(90, 70, 10), k.z(5)]);
      } else if (type === "sweetheart") {
        k.add([k.text("♥", { size: 8 }), k.pos(x * TILE + 4, y * TILE - 1), k.color(200, 30, 90), k.z(5)]);
      }
      x = end + 1;
    }
  }

  // Marcador ("!") de cada NPC: solo se ve el del siguiente paso desbloqueado (y los ya
  // visitados). npcMarkerObjs guarda sus piezas para poder mostrarlas cuando avanza el progreso.
  const npcMarkerObjs = {};
  Object.entries(stopMarks).forEach(([id, spot]) => {
    const x = spot.x * TILE;
    const y = spot.y * TILE;
    npcMarkerObjs[id] = [
      k.add([k.rect(TILE, TILE), k.pos(x, y), k.color(...COLORS.marker), k.opacity(0), k.z(0)]),
      k.add([k.text("!", { size: 8 }), k.pos(x + 5, y - 3), k.color(90, 60, 10), k.opacity(0), k.z(5)]),
    ];
  });
  function actualizarMarcadoresNPC() {
    Object.entries(npcMarkerObjs).forEach(([id, objs]) => {
      const visible = desbloqueado(id) ? 1 : 0;
      objs.forEach((o) => (o.opacity = visible));
    });
  }
  actualizarMarcadoresNPC();

  // La recompensa se muestra solo durante su aviso. Aparece sobre la protagonista,
  // no junto al NPC, y luego se retira al cerrar la caja de diálogo.
  const recompensaObjs = new Map();
  function mostrarRecompensa(id) {
    const spriteKey = RECOMPENSA_SPRITES[id];
    if (!spriteKey || recompensaObjs.has(id)) return () => {};
    const centro = k.vec2(player.pos.x, player.pos.y - 34);
    const halo = k.add([
      k.circle(13),
      k.pos(centro),
      k.color(255, 220, 92),
      k.opacity(0.22),
      k.z(20),
    ]);
    const objeto = k.add([
      k.sprite(spriteKey),
      k.anchor("center"),
      k.pos(centro),
      k.scale(0.75),
      k.z(21),
    ]);
    recompensaObjs.set(id, { halo, objeto, centro, fase: id.length * 0.7 });
    return () => {
      const recompensa = recompensaObjs.get(id);
      if (!recompensa) return;
      k.destroy(recompensa.halo);
      k.destroy(recompensa.objeto);
      recompensaObjs.delete(id);
    };
  }
  k.onUpdate(() => {
    const tiempo = k.time();
    recompensaObjs.forEach(({ halo, objeto, centro, fase }) => {
      const pulso = (Math.sin(tiempo * 3 + fase) + 1) / 2;
      halo.opacity = 0.16 + pulso * 0.2;
      halo.scale = k.vec2(0.9 + pulso * 0.16);
      objeto.pos.y = centro.y - pulso * 2;
    });
  });

  labels.forEach((l) => {
    k.add([k.text(l.text, { size: 6 }), k.pos(l.x * TILE, l.y * TILE - 4), k.color(245, 245, 250), k.z(5)]);
  });

  // El corazón marcaba el punto de reencuentro; ahora lo ocupa el novio para
  // que la protagonista vea directamente a quién estaba buscando. No se muestra (ni en el mapa
  // ni en el minimapa) hasta juntar todos los objetos: recién ahí se puede ver e interactuar.
  const novio = k.add([
    k.sprite("novio"),
    k.anchor("bot"),
    k.scale(NOVIO_SCALE),
    k.pos(sweetheart.x * TILE + TILE / 2, sweetheart.y * TILE + TILE),
    k.opacity(collected.size >= TOTAL_FRAGMENTS ? 1 : 0),
    k.z(10),
  ]);
  novio.play("breathe");
  novio.onUpdate(() => (novio.opacity = collected.size >= TOTAL_FRAGMENTS ? 1 : 0));

  const sapo = k.add([
    k.sprite("sapo"),
    k.anchor("bot"),
    k.scale(SAPO_SCALE),
    k.pos(SAPO_POS.x * TILE + TILE / 2, SAPO_POS.y * TILE + TILE),
    k.z(2),
  ]);
  sapo.play("breathe");

  const namjoon = k.add([
    k.sprite("koya"),
    k.anchor("bot"),
    k.scale(NAMJOON_SCALE),
    k.pos(NAMJOON_POS.x * TILE + TILE / 2, NAMJOON_POS.y * TILE + TILE),
    k.z(2),
  ]);
  namjoon.play("breathe");

  const tikki = k.add([
    k.sprite("tikki"),
    k.anchor("bot"),
    k.scale(TIKKI_SCALE),
    k.pos(TIKKI_POS.x * TILE + TILE / 2, TIKKI_POS.y * TILE + TILE - TIKKI_FLOAT_HEIGHT),
    k.z(2),
  ]);
  tikki.play("hover");

  const tiana = k.add([
    k.sprite("tiana"),
    k.anchor("bot"),
    k.scale(TIANA_SCALE),
    k.pos(TIANA_POS.x * TILE + TILE / 2, TIANA_POS.y * TILE + TILE),
    k.z(2),
  ]);
  tiana.play("breathe");

  const rapunzel = k.add([
    k.sprite("rapunzel"),
    k.anchor("bot"),
    k.scale(RAPUNZEL_SCALE),
    k.pos(RAPUNZEL_POS.x * TILE + TILE / 2, RAPUNZEL_POS.y * TILE + TILE),
    k.z(2),
  ]);
  rapunzel.play("breathe");

  const bibi = k.add([
    k.sprite("bibi"),
    k.anchor("bot"),
    k.scale(BIBI_SCALE),
    k.pos(BIBI_POS.x * TILE + TILE / 2, BIBI_POS.y * TILE + TILE),
    k.z(2),
  ]);
  bibi.play("breathe");

  // Los cuadros del personaje son de 64x64 y los pies quedan en y=48: hay 16 px vacíos
  // debajo. Anclar en "bot" lo dibujaba ~1 tile más arriba que su tile lógico (parecía
  // chocar antes de llegar a árboles, farolas y bancas). Se ancla a la altura de los pies.
  const player = k.add([
    k.sprite("idle-down"),
    k.anchor(k.vec2(0, 0.5)),
    k.scale(CHAR_SPRITE_SCALE),
    k.pos(entrada.x * TILE + TILE / 2, entrada.y * TILE + TILE),
    k.z(10),
    { gridX: entrada.x, gridY: entrada.y, moving: false, dir: "down", spriteKey: "idle-down" },
  ]);
  player.play("move");

  // Árboles de las plazas y caminos: si el personaje está al norte de la base
  // del tronco (detrás o bajo la copa) el árbol se dibuja por encima de él; si
  // está a la altura del tronco o al sur, por debajo.
  const Z_ARBOL_ATRAS = 4;
  const Z_ARBOL_ADELANTE = 12;
  const arboles = LEVEL.decor.filter((d) => d.tipo === "arbol").map((d) => ({
    baseY: (d.y + 2) * TILE,
    obj: k.add([k.sprite("deco-arbol"), k.pos(d.x * TILE, d.y * TILE), k.z(Z_ARBOL_ATRAS)]),
  }));
  arboles.push({
    baseY: ARBOL_GRANDE_TILE.y * TILE,
    obj: k.add([
      k.sprite("arbol-grande"),
      k.pos(ARBOL_GRANDE_TILE.x * TILE + TILE / 2 - Math.round(PLAZA_REDONDA.arbol.w / 2), (ARBOL_GRANDE_TILE.y + 1) * TILE - PLAZA_REDONDA.arbol.h),
      k.z(Z_ARBOL_ATRAS),
    ]),
  });
  LEVEL.decor.filter((d) => d.objeto).forEach((d) => {
    const base = d.tipo === "banca" ? d.y + 1 : d.y + 2;
    const desvio = d.tipo === "farola" ? (d.col ? TILE / 2 : -TILE / 2) : 0;
    arboles.push({
      baseY: base * TILE,
      dz: base * 0.0005,
      obj: k.add([k.sprite(d.tipo === "banca" ? "deco-banca" : "deco-farola"), k.pos(d.x * TILE + desvio, d.y * TILE), k.z(Z_ARBOL_ATRAS)]),
    });
  });
  terrazaPiezas().forEach((pz) => {
    arboles.push({
      baseY: pz.baseY,
      dz: pz.dz,
      obj: k.add([k.sprite(pz.sprite, { flipX: !!pz.flip }), k.pos(pz.x, pz.y), k.z(Z_ARBOL_ATRAS)]),
    });
  });
  BOSQUE_ARBOLES.forEach(([tam, col, bx, by, tronco, dx = 0]) => {
    const { w, h } = BOSQUE_TAM[tam];
    const x0 = bx * TILE + 8 - Math.floor(w / 2) + dx;
    const y0 = (by + 1) * TILE - h;
    arboles.push({
      baseY: by * TILE,
      dz: by * 0.0005,
      fade: tronco ? { x0, x1: x0 + w, y0, y1: y0 + 0.7 * h } : null,
      obj: k.add([k.sprite(`bosque-${tam}${col}`), k.pos(x0, y0), k.opacity(1), k.z(Z_ARBOL_ATRAS)]),
    });
  });
  k.onUpdate(() => {
    arboles.forEach((a) => {
      const delante = player.pos.y <= a.baseY;
      a.obj.z = (delante ? Z_ARBOL_ADELANTE : Z_ARBOL_ATRAS) + (a.dz || 0);
      if (a.fade) {
        const f = a.fade;
        const py = player.pos.y - 10;
        a.obj.opacity = delante && player.pos.x >= f.x0 && player.pos.x <= f.x1 && py >= f.y0 && py <= f.y1 ? 0.5 : 1;
      }
    });
  });

  // Solo cambia (y reinicia) el sprite cuando hace falta: pasar de un
  // tile a otro es más rápido que un ciclo de animación completo, así
  // que si llamamos player.use() en cada paso la animación nunca llega
  // a completarse (se ve trabada). Reusar el sprite actual entre pasos
  // consecutivos en la misma dirección deja que la animación corra.
  function setPlayerSprite(key) {
    if (player.spriteKey === key) return;
    player.spriteKey = key;
    player.use(k.sprite(key));
    player.play("move");
  }

  // ---- Fragmentos de historia + objetos (recompensa por cada uno) ----
  // ---- Botones de HUD: engranaje (pausa) arriba a la izquierda, copa (objetos) abajo ----
  // Por ahora el engranaje solo pausa/reanuda (bloquea el movimiento, igual que un diálogo
  // abierto); los botones de salir y reiniciar dentro del menú se agregan cuando lleguen esos
  // íconos. La copa muestra, reutilizando el cuadro de diálogo, los objetos ya encontrados.
  let paused = false;
  let objetosAbiertos = false;
  const HUD_ICON_SCALE = HUD_ICON_H / 95; // 95px = alto real de los recortes ui-gear/ui-trophy "normal"
  const gearBtn = k.add([
    k.sprite("ui-gear-normal"),
    k.anchor("topleft"),
    k.pos(6, 6),
    k.scale(HUD_ICON_SCALE),
    k.area(),
    k.fixed(),
    k.z(210),
  ]);
  const trophyBtn = k.add([
    k.sprite("ui-trophy-normal"),
    k.anchor("bot"),
    k.pos(VIEW_COLS * TILE - 16, VIEW_ROWS * TILE - 6),
    k.scale(HUD_ICON_SCALE),
    k.area(),
    k.fixed(),
    k.z(210),
  ]);

  // Mientras hay un diálogo abierto (de un NPC, no el de pausa) el cuadro ocupa casi todo el
  // ancho de abajo, así que los botones de HUD se ocultan para no superponerse.
  gearBtn.onUpdate(() => (gearBtn.opacity = dialogOpen && !paused ? 0 : 1));
  trophyBtn.onUpdate(() => (trophyBtn.opacity = dialogOpen && !objetosAbiertos ? 0 : 1));

  // No reusa showDialog (esa se cierra con Espacio, letra por letra): la pausa la abre y la
  // cierra el mismo botón, así que el panel es propio y estático.
  let pausaElementos = null;
  function togglePausa() {
    if (dialogOpen && !paused) return; // no pausar encima de un diálogo de NPC
    if (paused) {
      pausaElementos.forEach((e) => k.destroy(e));
      pausaElementos = null;
      paused = false;
      dialogOpen = false;
      gearBtn.use(k.sprite("ui-gear-normal"));
      return;
    }
    paused = true;
    dialogOpen = true; // reusa el mismo bloqueo de movimiento que un diálogo
    gearBtn.use(k.sprite("ui-gear-pressed"));
    const W = VIEW_COLS * TILE, H = VIEW_ROWS * TILE;
    const boxW = 110, boxH = 106;
    const boxX = Math.round((W - boxW) / 2), boxY = Math.round((H - boxH) / 2);
    const cerrarPausa = () => togglePausa();
    const nuevoJuego = () => {
      try {
        localStorage.removeItem(SAVE_KEY);
      } catch (e) {
        // localStorage puede estar bloqueado (modo privado); no es crítico.
      }
      musicaAmbiente?.pause();
      k.go("game");
    };
    const salirAlMenu = () => {
      musicaAmbiente?.pause();
      k.go("title");
    };
    // Botones apilados dentro del panel: cada uno es un sprite clickeable que se destruye junto
    // con el resto del panel al cerrar la pausa.
    const botonMenu = (nombre, y, onClick) => {
      const btn = k.add([
        k.sprite(`ui-${nombre}-normal`),
        k.anchor("top"),
        k.pos(boxX + boxW / 2, y),
        k.scale(MENU_BTN_SCALE),
        k.area(),
        k.fixed(),
        k.z(308),
      ]);
      btn.onClick(() => {
        btn.use(k.sprite(`ui-${nombre}-pressed`));
        onClick();
      });
      return btn;
    };
    pausaElementos = [
      ...marcoPixel(boxX, boxY, boxW, boxH, DLG.borde, DLG.crema, 300),
      k.add([k.text("Pausa", { size: DLG.titulo, font: "pixelify" }), k.pos(boxX + 8, boxY + 7), k.color(...DLG.cafe), k.fixed(), k.z(308)]),
      botonMenu("iniciar", boxY + 26, cerrarPausa),
      botonMenu("nuevojuego", boxY + 52, nuevoJuego),
      botonMenu("salir", boxY + 78, salirAlMenu),
    ];
  }
  gearBtn.onClick(togglePausa);

  // Igual que la pausa: el panel es propio (no showDialog) y el mismo botón lo abre y lo cierra.
  // Los objetos van en fila, con el sprite real de cada uno; el que todavía no se encontró se ve
  // oscurecido (silueta) en vez de con sus colores.
  let objetosElementos = null;
  const SLOT = 28, SLOT_GAP = 6;
  function toggleObjetos() {
    if (dialogOpen && !objetosAbiertos) return; // no abrir encima de otro diálogo/pausa
    if (objetosAbiertos) {
      objetosElementos.forEach((e) => k.destroy(e));
      objetosElementos = null;
      objetosAbiertos = false;
      dialogOpen = false;
      trophyBtn.use(k.sprite("ui-trophy-normal"));
      return;
    }
    objetosAbiertos = true;
    dialogOpen = true;
    trophyBtn.use(k.sprite("ui-trophy-pressed"));
    const W = VIEW_COLS * TILE, H = VIEW_ROWS * TILE;
    const fragmentos = TIMELINE.filter((e) => Object.prototype.hasOwnProperty.call(RECOMPENSA_SPRITES, e.id));
    const n = fragmentos.length;
    const boxW = n * SLOT + (n + 1) * SLOT_GAP;
    const boxH = 56;
    const boxX = Math.round((W - boxW) / 2), boxY = Math.round((H - boxH) / 2);
    const contador = `${collected.size}/${TOTAL_FRAGMENTS}`;
    objetosElementos = [
      ...marcoPixel(boxX, boxY, boxW, boxH, DLG.borde, DLG.crema, 300),
      k.add([k.text("Objetos", { size: DLG.titulo, font: "pixelify" }), k.pos(boxX + 8, boxY + 6), k.color(...DLG.cafe), k.fixed(), k.z(308)]),
      k.add([
        k.text(contador, { size: DLG.chico, font: "pixelify" }),
        k.pos(boxX + boxW - 8 - medirTexto(contador, DLG.chico), boxY + 9),
        k.color(...DLG.suave),
        k.fixed(),
        k.z(308),
      ]),
    ];
    const slotY = boxY + 24;
    fragmentos.forEach((entry, i) => {
      const x = boxX + SLOT_GAP + i * (SLOT + SLOT_GAP);
      const encontrado = collected.has(entry.id);
      objetosElementos.push(...marcoPixel(x, slotY, SLOT, SLOT, [120, 96, 78], encontrado ? DLG.crema : [70, 64, 60], 302));
      const spriteName = RECOMPENSA_SPRITES[entry.id];
      if (spriteName) {
        const icon = k.add([
          k.sprite(spriteName),
          k.anchor("center"),
          k.pos(x + SLOT / 2, slotY + SLOT / 2),
          k.scale((SLOT - 6) / 48),
          k.fixed(),
          k.z(304),
        ]);
        if (!encontrado) {
          icon.color = k.rgb(35, 35, 35); // oscurece el sprite: sigue siendo su silueta real
          icon.opacity = 0.85;
        }
        objetosElementos.push(icon);
      }
    });
  }
  trophyBtn.onClick(toggleObjetos);

  // ---- Mini-mapa (arriba a la derecha) ----
  const MINI_W = 56;
  const MINI_H = Math.round((MINI_W * ROWS) / COLS);
  const miniX = VIEW_COLS * TILE - MINI_W - 6;
  const miniY = 6;
  const miniScaleX = MINI_W / COLS;
  const miniScaleY = MINI_H / ROWS;

  k.add([k.rect(MINI_W, MINI_H), k.pos(miniX, miniY), k.color(20, 40, 24), k.fixed(), k.z(199)]);

  const miniDots = {};
  Object.entries(stopMarks).forEach(([id, pos]) => {
    miniDots[id] = k.add([
      k.rect(3, 3),
      k.pos(miniX + pos.x * miniScaleX, miniY + pos.y * miniScaleY),
      k.color(...(collected.has(id) ? [150, 150, 150] : COLORS.marker)),
      k.opacity(desbloqueado(id) ? 1 : 0),
      k.fixed(),
      k.z(201),
    ]);
  });
  const miniSweetheart = k.add([
    k.rect(4, 4),
    k.pos(miniX + sweetheart.x * miniScaleX, miniY + sweetheart.y * miniScaleY),
    k.color(...COLORS.sweetheart),
    k.opacity(collected.size >= TOTAL_FRAGMENTS ? 1 : 0),
    k.fixed(),
    k.z(201),
  ]);
  miniSweetheart.onUpdate(() => (miniSweetheart.opacity = collected.size >= TOTAL_FRAGMENTS ? 1 : 0));
  const miniPlayerDot = k.add([
    k.rect(3, 3),
    k.pos(miniX, miniY),
    k.color(...COLORS.player),
    k.fixed(),
    k.z(202),
  ]);

  let dialogOpen = false;
  let sapoDialogoVisto = false;
  let flynnDialogoVisto = false;
  let maximusDialogoVisto = false;
  let ladybugDialogoVisto = false;
  // Easter egg oculto de Flynn: tiene sprite parado en el mapa (sin marcador "!" ni punto en el
  // minimapa, es opcional y no forma parte de ORDEN_NPCS), pegado a la pared este de Sierra
  // Nevada. Se calcula en base al edificio ya construido para no depender de coordenadas fijas.
  const FLYNN_POS = LEVEL.sierraBuilding
    ? { x: LEVEL.sierraBuilding.x1 + 2, y: LEVEL.sierraBuilding.y0 + 4 }
    : null;
  // Máximus: en el pasto junto a Bloque 8, lejos de Rapunzel (ver maximusPos en buildLevel).
  const MAXIMUS_POS = LEVEL.maximusPos;
  if (MAXIMUS_POS) {
    const maximus = k.add([
      k.sprite("maximus"),
      k.anchor("bot"),
      k.scale(MAXIMUS_SCALE),
      k.pos(MAXIMUS_POS.x * TILE + TILE / 2, MAXIMUS_POS.y * TILE + TILE),
      k.z(2),
    ]);
    maximus.play("breathe");
  }
  // Ladybug: en el pasto junto a la Biblioteca (ver ladybugPos en buildLevel).
  const LADYBUG_POS = LEVEL.ladybugPos;
  if (LADYBUG_POS) {
    const ladybug = k.add([
      k.sprite("ladybug"),
      k.anchor("bot"),
      k.scale(LADYBUG_SCALE),
      k.pos(LADYBUG_POS.x * TILE + TILE / 2, LADYBUG_POS.y * TILE + TILE),
      k.z(2),
    ]);
    ladybug.play("breathe");
  }
  if (FLYNN_POS) {
    const flynn = k.add([
      k.sprite("flynn"),
      k.anchor("bot"),
      k.scale(FLYNN_SCALE),
      k.pos(FLYNN_POS.x * TILE + TILE / 2, FLYNN_POS.y * TILE + TILE),
      k.z(2),
    ]);
    flynn.play("breathe");
  }

  // Marco pixel-art hecho con rectángulos: contorno oscuro, borde de color y relleno, con las
  // esquinas escalonadas de 1 px. Sirve para el cuadro, la pestaña y el marco del retrato.
  function marcoPixel(x, y, w, h, borde, relleno, z) {
    const out = [];
    [DLG.cafe, borde, relleno].forEach((c, i) => {
      const xx = x + i, yy = y + i, ww = w - 2 * i, hh = h - 2 * i;
      out.push(k.add([k.rect(ww - 2, hh), k.pos(xx + 1, yy), k.color(...c), k.fixed(), k.z(z + i)]));
      out.push(k.add([k.rect(ww, hh - 2), k.pos(xx, yy + 1), k.color(...c), k.fixed(), k.z(z + i)]));
    });
    return out;
  }
  const medirTexto = (txt, size) => {
    try {
      return k.formatText({ text: txt, size, font: "pixelify" }).width;
    } catch (e) {
      return txt.length * size * 0.62;
    }
  };
  // Parte un texto en líneas que caben en "ancho" (respeta los saltos de línea que ya trae).
  function envolver(texto, ancho, size) {
    const lineas = [];
    texto.split("\n").forEach((par) => {
      let actual = "";
      par.split(" ").forEach((pal) => {
        const prueba = actual ? `${actual} ${pal}` : pal;
        if (!actual || medirTexto(prueba, size) <= ancho) actual = prueba;
        else {
          lineas.push(actual);
          actual = pal;
        }
      });
      lineas.push(actual);
    });
    return lineas;
  }

  // "content" puede ser un solo texto o un array de textos: cada uno es una pantalla; si un
  // texto no cabe en las 4 líneas del cuadro, se parte solo en varias pantallas. Se avanza con
  // Espacio. "retratoId" (opcional) muestra el retrato del personaje a la izquierda.
  function showDialog(title, subtitle, content, onClose, retratoId, iconoFinal) {
    dialogOpen = true;
    iniciarMusicaDialogo(retratoId);
    const ret = retratoId && RETRATOS[retratoId];
    const W = VIEW_COLS * TILE;
    const H = VIEW_ROWS * TILE;
    const altoRet = ret ? ret.alto || 48 : 0; // alto del arte del retrato (ancho fijo 48)
    const boxX = 6, boxW = W - 12, boxH = ret ? 80 : 64;
    const maxLineas = ret ? 5 : DLG.lineas;
    const boxY = H - 6 - boxH;
    const acento = ret ? ret.color : DLG.borde;
    const acentoOsc = acento.map((v) => Math.round(v * 0.62));
    const textX = boxX + (ret ? 8 + 52 + 8 : 10);
    const textW = boxX + boxW - 10 - textX;

    const paginas = [];
    (Array.isArray(content) ? content : [content]).forEach((pg) => {
      const lineas = envolver(String(pg), textW, DLG.cuerpo);
      for (let i = 0; i < lineas.length; i += maxLineas) paginas.push(lineas.slice(i, i + maxLineas).join("\n"));
    });
    if (!paginas.length) paginas.push("");
    let idx = 0;

    let retObj = null;
    const elementos = [...marcoPixel(boxX, boxY, boxW, boxH, DLG.borde, DLG.crema, 100)];
    // pestaña con el nombre y, en letra chica, el lugar (queda unida al cuadro: se tapa el borde de
    // arriba entre sus lados)
    if (title) {
      const wTitulo = Math.round(medirTexto(title, DLG.titulo));
      const wSub = subtitle ? Math.round(medirTexto(subtitle, DLG.chico)) + 7 : 0;
      const tabW = Math.max(44, wTitulo + wSub + 18);
      const tabX = boxX + 8, tabY = boxY - 14;
      elementos.push(...marcoPixel(tabX, tabY, tabW, 16, acento, DLG.crema, 104));
      elementos.push(k.add([k.rect(tabW - 4, 3), k.pos(tabX + 2, boxY), k.color(...DLG.crema), k.fixed(), k.z(107)]));
      elementos.push(k.add([k.text(title, { size: DLG.titulo, font: "pixelify" }), k.pos(tabX + 9, tabY + 1), k.color(...DLG.cafe), k.fixed(), k.z(108)]));
      if (subtitle) {
        elementos.push(
          k.add([k.text(subtitle, { size: DLG.chico, font: "pixelify" }), k.pos(tabX + 9 + wTitulo + 7, tabY + 4), k.color(...DLG.suave), k.fixed(), k.z(108)])
        );
      }
    }
    if (ret) {
      const px = boxX + 8, py = boxY + Math.round((boxH - (altoRet + 4)) / 2);
      elementos.push(...marcoPixel(px, py, 52, altoRet + 4, acentoOsc, ret.fondo || acento, 104));
      retObj = k.add(
        ret.cuadros
          ? [k.sprite(`retrato-${retratoId}`, { frame: ret.cuadros.neutral }), k.anchor("topleft"), k.pos(px + 2, py + 2), k.fixed(), k.z(108)]
          : [k.sprite(`retrato-${retratoId}`), k.anchor("bot"), k.pos(px + 26, py + altoRet + 1), k.fixed(), k.z(108)]
      );
      elementos.push(retObj);
    }
    const textEl = k.add([
      k.text("", { size: DLG.cuerpo, font: "pixelify", lineSpacing: 2 }),
      k.pos(textX, boxY + 8),
      k.color(...DLG.cafe),
      k.fixed(),
      k.z(108),
    ]);
    elementos.push(textEl);
    // triángulo parpadeante de "continuar" (solo cuando ya se escribió toda la pantalla) y contador
    const flecha = k.add([
      k.polygon([k.vec2(0, 0), k.vec2(9, 0), k.vec2(4.5, 5)]),
      k.pos(boxX + boxW - 17, boxY + boxH - 13),
      k.color(...DLG.cafe),
      k.opacity(0),
      k.fixed(),
      k.z(108),
    ]);
    elementos.push(flecha);
    const contador = k.add([
      k.text("", { size: DLG.chico, font: "pixelify" }),
      k.anchor("botright"),
      k.pos(boxX + boxW - 24, boxY + boxH - 6),
      k.color(...DLG.suave),
      k.fixed(),
      k.z(108),
    ]);
    const marcarPagina = () => {
      contador.text = paginas.length > 1 ? `${idx + 1}/${paginas.length}` : "";
    };
    marcarPagina();
    elementos.push(contador);

    // Escritura letra por letra (el texto ya viene partido en líneas, así que no se reacomoda).
    const VEL = 42; // letras por segundo
    let acumulado = 0;
    let revelados = 0;
    let proxParpadeo = k.time() + 1.5;
    let parpadeoHasta = 0;
    const animado = ret && ret.cuadros;
    // Corazón animado que aparece cerca de la pestaña del nombre cuando termina de escribirse la
    // última página (se usa en el diálogo del reencuentro, en vez del "♥" de texto plano).
    let heartIcon = null;
    textEl.onUpdate(() => {
      const total = paginas[idx].length;
      if (revelados < total) {
        acumulado += k.dt() * VEL;
        const n = Math.min(total, Math.floor(acumulado));
        if (n !== revelados) {
          revelados = n;
          textEl.text = paginas[idx].slice(0, n);
        }
      }
      const hablando = revelados < total;
      flecha.opacity = hablando ? 0 : Math.floor(k.time() * 2.5) % 2 === 0 ? 1 : 0.15;
      if (animado && retObj) {
        const t = k.time();
        if (!hablando && t >= proxParpadeo) {
          parpadeoHasta = t + 0.14;
          proxParpadeo = t + 2.4 + Math.random() * 2.4;
        }
        if (hablando) retObj.frame = ret.cuadros.habla[Math.floor(t * 8) % ret.cuadros.habla.length];
        else retObj.frame = t < parpadeoHasta ? ret.cuadros.parpadeo : ret.cuadros.neutral;
      }
      if (iconoFinal) {
        const esUltima = idx === paginas.length - 1 && !hablando;
        if (esUltima && !heartIcon) {
          // Lo ubicamos justo al lado de la última línea de texto (no en una esquina fija).
          const lineas = paginas[idx].split("\n");
          const ultimaLinea = lineas[lineas.length - 1];
          const anchoLinea = medirTexto(ultimaLinea, DLG.cuerpo);
          const yLinea = boxY + 8 + (lineas.length - 1) * (DLG.cuerpo + 2) + DLG.cuerpo / 2;
          heartIcon = k.add([
            k.sprite("heart-pulse"),
            k.anchor("left"),
            k.pos(textX + anchoLinea + 6, yLinea),
            k.scale(0.5),
            k.fixed(),
            k.z(109),
          ]);
          heartIcon.play("beat");
          elementos.push(heartIcon);
        } else if (!esUltima && heartIcon) {
          k.destroy(heartIcon);
          heartIcon = null;
        }
      }
    });

    const handler = k.onKeyPress("space", () => {
      // Espacio completa lo que falta de la pantalla; con la pantalla completa, avanza.
      if (revelados < paginas[idx].length) {
        revelados = paginas[idx].length;
        acumulado = revelados;
        textEl.text = paginas[idx];
        return;
      }
      idx++;
      if (idx < paginas.length) {
        revelados = 0;
        acumulado = 0;
        textEl.text = "";
        marcarPagina();
        return;
      }
      elementos.forEach((e) => k.destroy(e));
      dialogOpen = false;
      detenerMusicaDialogo();
      handler.cancel();
      if (onClose) onClose();
    });
  }

  function checkTrigger(x, y) {
    const key = `${x},${y}`;
    if (stopTiles.has(key)) {
      const entry = stopTiles.get(key);
      // El marcador de este NPC está oculto hasta que le toque su turno (ver ORDEN_NPCS), así
      // que si el tile igual se pisa antes de tiempo, no pasa nada.
      if (!desbloqueado(entry.id)) return;
      // El "!" de Bloque 3 no es un fragmento (no da objeto ni suma al contador): es lo que
      // dispara el reencuentro. Ya no se activa por acercarse al personaje, solo pisando este
      // marcador.
      if (entry.id === "bloque3") {
        showDialog(
          entry.npc || "Tu novio",
          entry.place,
          REUNION.pages,
          () => {
            musicaAmbiente?.pause();
            k.go("ending");
          },
          null,
          true
        );
        return;
      }
      const esFragmento = Object.prototype.hasOwnProperty.call(RECOMPENSA_SPRITES, entry.id);
      const isNew = esFragmento && !collected.has(entry.id);
      showDialog(entry.npc || entry.place, entry.place, entry.pages, () => {
        if (!isNew) return;
        collected.add(entry.id);
        guardarProgreso(collected);
        if (miniDots[entry.id]) miniDots[entry.id].color = k.rgb(150, 150, 150);
        // Al entregar el objeto se desbloquea el siguiente NPC de la lista.
        Object.entries(miniDots).forEach(([mid, dot]) => (dot.opacity = desbloqueado(mid) ? 1 : 0));
        actualizarMarcadoresNPC();
        const ocultarRecompensa = mostrarRecompensa(entry.id);
        showDialog("Objeto encontrado", null, RECOMPENSA_TEXTOS[entry.id] || entry.item, ocultarRecompensa);
      }, entry.id);
      return;
    }
    // Interacción secreta: basta con acercarse a una casilla del sapo. El
    // diálogo se muestra una sola vez por partida y no consume ningún objeto.
    const distanciaSapo = Math.abs(x - SAPO_POS.x) + Math.abs(y - SAPO_POS.y);
    if (!sapoDialogoVisto && distanciaSapo <= 1) {
      sapoDialogoVisto = true;
      showDialog("El sapo", null, [
        "Parece que el sapo intenta decirte algo...",
        "Croac, croac... croac.",
        "No entiendes nada porque es un sapo.",
      ]);
    }
    // Easter egg oculto de Flynn (esposo de Rapunzel): igual que el del sapo, sin marcador en el
    // mapa ni en el minimapa, se ve una sola vez por partida.
    if (FLYNN_POS) {
      const distanciaFlynn = Math.abs(x - FLYNN_POS.x) + Math.abs(y - FLYNN_POS.y);
      if (!flynnDialogoVisto && distanciaFlynn <= 1) {
        flynnDialogoVisto = true;
        showDialog(
          "Flynn Rider",
          "Marido de Rapunzel",
          [
            "El hombre mira a su alrededor, un poco desorientado. Parece que lleva un rato intentando encontrar el camino.",
            "\"Estoy buscando a Rapunzel y a nuestro caballo, Máximus. Me separé de los dos y terminé completamente perdido por aquí.\"",
            "\"Rapunzel también debe estar buscándome. Ojalá Máximus haya encontrado el camino antes que nosotros.\"",
            "Después de agradecerte, Flynn vuelve a mirar los caminos, decidido a encontrar a su esposa.",
          ],
          null,
          "flynn"
        );
      }
    }
    // Easter egg oculto de Máximus (el caballo de Rapunzel), igual que el del sapo: sin marcador
    // en el mapa ni en el minimapa, un diálogo curioso que se ve una sola vez por partida.
    if (MAXIMUS_POS) {
      const distanciaMaximus = Math.abs(x - MAXIMUS_POS.x) + Math.abs(y - MAXIMUS_POS.y);
      if (!maximusDialogoVisto && distanciaMaximus <= 1) {
        maximusDialogoVisto = true;
        showDialog("Máximus", null, [
          "El caballo bufa y te mira fijamente, sin moverse de su lugar.",
          "Tiene puesta una montura de cuero que se ve bastante usada... ¿Será que es el caballo de Rapunzel?",
          "Como buen caballo de la guardia real, no te responde. Solo sigue masticando pasto tranquilamente.",
        ]);
      }
    }
    // Easter egg oculto de Ladybug, igual que los demás: visible desde el inicio, sin marcador
    // ni desbloqueo, diálogo una sola vez por partida.
    if (LADYBUG_POS) {
      const distanciaLadybug = Math.abs(x - LADYBUG_POS.x) + Math.abs(y - LADYBUG_POS.y);
      if (!ladybugDialogoVisto && distanciaLadybug <= 1) {
        ladybugDialogoVisto = true;
        showDialog(
          "Ladybug",
          null,
          [
            "\"¡Hola! Estaba patrullando por la zona y Tikki me contó que andas juntando pistas por toda la universidad.\"",
            "\"No te voy a mentir, un poco de esta historia me suena conocida... pero no diré nada más.\"",
            "Te guiña un ojo y sigue su camino, lista para seguir vigilando la ciudad.",
          ],
          null,
          "ladybug"
        );
      }
    }
  }

  function tryMove(dx, dy) {
    if (dialogOpen || player.moving) return;
    const nx = player.gridX + dx;
    const ny = player.gridY + dy;
    if (ny < 0 || ny >= ROWS || nx < 0 || nx >= COLS) return;
    if (!WALKABLE.has(grid[ny][nx])) return;

    // Las 4 direcciones tienen su propio arte (ver PLAYER_SHEETS), así que no hace falta voltear
    // ningún sprite.
    if (dy < 0) player.dir = "up";
    else if (dy > 0) player.dir = "down";
    else if (dx < 0) player.dir = "left";
    else if (dx > 0) player.dir = "right";

    player.moving = true;
    setPlayerSprite(`run-${player.dir}`);
    k.tween(
      player.pos,
      k.vec2(nx * TILE + TILE / 2, ny * TILE + TILE),
      MOVE_TIME,
      (p) => (player.pos = p),
      k.easings.linear
    ).onEnd(() => {
      player.gridX = nx;
      player.gridY = ny;
      player.moving = false;
      // Si seguís apretando una tecla de movimiento, no cortes a "quieto"
      // entre un tile y el siguiente: eso es lo que reiniciaba la
      // animación de correr cada 0.12s y se sentía trabada/incompleta.
      const stillMoving = ["left", "right", "up", "down", "a", "d", "w", "s"].some((key) =>
        k.isKeyDown(key)
      );
      if (!stillMoving) setPlayerSprite(`idle-${player.dir}`);
      checkTrigger(nx, ny);
    });
  }

  // onKeyDown (no onKeyPress) para que mantener la tecla apretada mueva
  // sin cortes: se dispara todos los frames mientras está apretada, y
  // tryMove ya se encarga de esperar a que termine el paso anterior.
  k.onKeyDown("left", () => tryMove(-1, 0));
  k.onKeyDown("right", () => tryMove(1, 0));
  k.onKeyDown("up", () => tryMove(0, -1));
  k.onKeyDown("down", () => tryMove(0, 1));
  k.onKeyDown("a", () => tryMove(-1, 0));
  k.onKeyDown("d", () => tryMove(1, 0));
  k.onKeyDown("w", () => tryMove(0, -1));
  k.onKeyDown("s", () => tryMove(0, 1));

  const halfViewX = (VIEW_COLS * TILE) / 2;
  const halfViewY = (VIEW_ROWS * TILE) / 2;
  const minCamX = halfViewX;
  const maxCamX = COLS * TILE - halfViewX;
  const minCamY = halfViewY;
  const maxCamY = ROWS * TILE - halfViewY;
  k.onUpdate(() => {
    const camX = k.clamp(player.pos.x, minCamX, maxCamX);
    const camY = k.clamp(player.pos.y, minCamY, maxCamY);
    k.setCamPos(k.vec2(camX, camY));
    miniPlayerDot.pos = k.vec2(
      miniX + (player.pos.x / TILE) * miniScaleX,
      miniY + (player.pos.y / TILE) * miniScaleY
    );
  });

  // Mensaje de bienvenida + mini tutorial, antes de poder moverte.
  showDialog("", null, INTRO.pages);
});

// ---------------------------------------------------------------------
// Escena: final
// ---------------------------------------------------------------------
k.scene("ending", () => {
  k.setBackground(0, 0, 0);
  k.add([k.rect(VIEW_COLS * TILE, VIEW_ROWS * TILE), k.pos(0, 0), k.color(0, 0, 0)]);

  // La música de la pantalla de título vuelve a sonar acá, de fondo.
  const musicaFinal = new Audio("assets/title-theme.mp3");
  musicaFinal.loop = true;
  musicaFinal.volume = TITULO_VOLUMEN;
  const reproduccionFinal = musicaFinal.play();
  if (reproduccionFinal?.catch) reproduccionFinal.catch(() => {});

  // Los dos personajes (los sprites reales del juego, no placeholders) se acercan y se
  // encuentran en el medio.
  const midX = (VIEW_COLS * TILE) / 2;
  const animY = 60;
  const her = k.add([
    k.sprite("idle-down"),
    k.anchor("bot"),
    k.scale(CHAR_SPRITE_SCALE),
    k.pos(20, animY),
    k.z(10),
  ]);
  her.play("move");
  const him = k.add([
    k.sprite("novio"),
    k.anchor("bot"),
    k.scale(NOVIO_SCALE),
    k.pos(VIEW_COLS * TILE - 20, animY),
    k.z(10),
  ]);
  him.play("breathe");
  let heart = null;
  k.tween(her.pos, k.vec2(midX - 10, animY), 1, (p) => (her.pos = p), k.easings.easeOutQuad);
  k.tween(him.pos, k.vec2(midX + 10, animY), 1, (p) => (him.pos = p), k.easings.easeOutQuad).onEnd(() => {
    heart = k.add([k.sprite("heart-pulse"), k.anchor("center"), k.pos(midX, animY - 44), k.scale(0.9), k.z(11)]);
    heart.play("beat");
  });

  const reunionElementos = [
    her,
    him,
    k.add([
      k.text(ENDING.text, { size: 8, width: VIEW_COLS * TILE - 32 }),
      k.pos(16, 84),
      k.color(255, 210, 220),
    ]),
  ];
  const continuarTxt = k.add([
    k.text("Clic para continuar", { size: 7 }),
    k.anchor("center"),
    k.pos((VIEW_COLS * TILE) / 2, VIEW_ROWS * TILE - 14),
    k.color(180, 180, 190),
    k.opacity(0),
  ]);
  continuarTxt.onUpdate(() => (continuarTxt.opacity = Math.floor(k.time() * 1.5) % 2 === 0 ? 1 : 0.3));

  // Se avanza a los créditos con un clic (no automático), para que a ella le dé tiempo de leer
  // el mensaje con calma.
  const empezarCreditos = () => {
    handlerClic.cancel();
    reunionElementos.forEach((e) => k.destroy(e));
    if (heart) k.destroy(heart);
    k.destroy(continuarTxt);

    // Cada línea es [ROL, "nombre"]. Es todo en broma: el "equipo" completo del juego.
    const CREDITOS = [
      ["DIRECCIÓN GENERAL", "Tu novio"],
      ["GUION ORIGINAL", "Tu novio (con 3 cafés encima)"],
      ["PRODUCTOR EJECUTIVO", "Tu novio, otra vez"],
      ["ASISTENTE DE PRODUCCIÓN", "Nadie, lo hizo todo solo"],
      ["PROGRAMACIÓN", "Tu novio, Claude y ChatGPT (por turnos)"],
      ["CONSULTORÍA DE IA", "Claude (Anthropic) y ChatGPT (OpenAI)"],
      ["ARTE PIXEL", "Codex, supervisado muy de cerca"],
      ["DIRECCIÓN DE ARTE", "Tu novio, con gusto cuestionable"],
      ["DISEÑO DE NIVELES", "Tu novio y 40 pestañas abiertas"],
      ["CONTROL DE CALIDAD", "Tu novio, probando el mismo diálogo 40 veces"],
      ["DEBUGGING NOCTURNO", "Tu novio, 2 AM, sin dormir"],
      ["BANDA SONORA", "8-Bit Misfits (versiones chiptune de Disney)"],
      ["DISEÑO DE SONIDO", "El ventilador de la PC a las 3 AM"],
      ["VESTUARIO DE PERSONAJES", "Pixel Crawler Free Pack"],
      ["TRADUCTOR DE COREANO", "El celular de Koya (y algo de suerte)"],
      ["CASTING PRINCIPAL", "Tikki, Tiana, Rapunzel, Bibi y Koya"],
      ["CABALLOS ACROBÁTICOS", "Máximus"],
      ["APARICIONES ESPECIALES", "Flynn Rider, Ladybug y un sapo confundido"],
      ["SEGURIDAD EN EL SET", "La cerradura de la puerta del cuarto"],
      ["CATERING", "Café, más café, y agua de vez en cuando"],
      ["EFECTOS ESPECIALES", "CSS y muchas ganas"],
      ["CONTROL DE VERSIONES", "Git (a veces ignorado)"],
      ["GESTIÓN DE PROYECTO", "Notion, con demasiadas pestañas"],
      ["RELACIONES PÚBLICAS", "Nadie, esto era secreto hasta hoy"],
      ["INSPIRACIÓN", "Tres años de recuerdos contigo"],
      ["AGRADECIMIENTOS ESPECIALES", "Por aguantar tantas pistas raras"],
      ["UN AGRADECIMIENTO MUY ESPECIAL", "Por decir que sí hace 3 años"],
      ["PRODUCIDO CON", "Mucho amor y bastante código"],
      ["Y ESPECIALMENTE", "Feliz aniversario. Te amo."],
    ];

    const W = VIEW_COLS * TILE, H = VIEW_ROWS * TILE;
    const LINE_H = 14;
    const contentH = CREDITOS.length * LINE_H;
    // Contenedor: sus hijos se posicionan relativos a él, así que animar su "y" mueve todo el
    // bloque de créditos junto, sin tener que tweenear cada línea por separado.
    const root = k.add([k.pos(W / 2, H + 20), k.z(20)]);
    CREDITOS.forEach(([rol, nombre], i) => {
      root.add([
        k.text(rol, { size: 6 }),
        k.anchor("botright"),
        k.pos(-6, i * LINE_H),
        k.color(255, 255, 255),
      ]);
      root.add([
        k.text(nombre, { size: 6 }),
        k.anchor("botleft"),
        k.pos(6, i * LINE_H),
        k.color(190, 190, 200),
      ]);
    });
    // Duración del recorrido completo (pantalla + contenido): antes 30s, ahora más lento.
    k.tween(root.pos, k.vec2(W / 2, -(contentH + 20)), 55, (p) => (root.pos = p), k.easings.linear).onEnd(() => {
      musicaFinal.pause();
      k.go("title");
    });
  };
  const handlerClic = k.onClick(empezarCreditos);
});

k.go("title");
