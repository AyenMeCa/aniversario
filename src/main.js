import { TIMELINE, LOCKED, REUNION, ENDING, TITLE_SCREEN, INTRO } from "./timeline.js";

// ---------------------------------------------------------------------
// Config del mapa
// ---------------------------------------------------------------------
const TILE = 16;
const COLS = 140; // ancho total del campus (en tiles)
const ROWS = 100; // alto total del campus (en tiles)
const VIEW_COLS = 22; // cuánto se ve en pantalla (la cámara hace scroll)
const VIEW_ROWS = 16;
const SCALE = 3;
const MOVE_TIME = 0.12;

// ---------------------------------------------------------------------
// MAPA COMO DATOS (para poder reemplazarlo después)
// ---------------------------------------------------------------------
// Todo lo que se ve en el mapa (edificios, lago, isla, caminos) está
// descrito acá como datos simples, no "dibujado a mano". Cada edificio
// tiene un campo "sprite" que hoy vale null (por eso se dibuja como un
// rectángulo de color) — el día que tengas la textura pixelada de ese
// edificio, alcanza con poner acá `sprite: "nombre-del-archivo"` y
// cambiar UNA sola función (drawBuilding, más abajo) para que dibuje la
// imagen en vez del rectángulo. El resto del juego (mapa, movimiento,
// diálogos) no se toca.
//
// Edificios con id que coincide con un fragmento de TIMELINE (en
// src/timeline.js) quedan interactivos automáticamente: el juego les
// pone un marcador enfrente y un diálogo. Los que tienen "label" propio
// son solo decorativos.
const BUILDINGS = [
  { id: "hangares", x: 8, y: 6, w: 20, h: 10, sprite: null },
  { id: "mar_caribe", x: 55, y: 6, w: 20, h: 10, sprite: null },
  { id: "cienaga", x: 85, y: 30, w: 20, h: 10, sprite: null },
  { id: "sierra_nevada", x: 85, y: 44, w: 22, h: 10, sprite: null },
  { id: "cafeteria", x: 33, y: 75, w: 18, h: 10, sprite: null },
  { id: "bloque8", x: 6, y: 30, w: 22, h: 26, label: "Bloque 8", sprite: null },
  { id: "biblioteca", x: 58, y: 80, w: 18, h: 10, label: "Biblioteca", sprite: null },
  { id: "otros_bloques", x: 95, y: 88, w: 18, h: 10, label: "Otros Bloques", sprite: null },
];

// El Bloque 3 se maneja aparte porque el fragmento 6 (la niña de
// pequeña) queda EN el edificio, y el punto de reencuentro con vos
// queda justo DETRÁS/al lado — ver comentario más abajo en buildLevel().
const BLOQUE3_BUILDING = { id: "bloque3", x: 10, y: 88, w: 18, h: 10, label: "Bloque 3", sprite: null };

const ENTRADA = { x: 40, y: 4 };

// El lago (union de dos óvalos para que la forma no sea un círculo
// perfecto, como en el bosquejo) + la mini isla del medio + los
// puentes que cruzan. Mismo criterio: "sprite: null" por ahora.
const LAKE_SHAPES = [
  { cx: 50, cy: 45, rx: 18, ry: 16, sprite: null },
  { cx: 62, cy: 56, rx: 14, ry: 14, sprite: null },
];
const ISLAND = { cx: 58, cy: 58, r: 5, sprite: null };
const BRIDGE_Y = 48;
const BRIDGE_X_START = 28;
const BRIDGE_X_END = 80;
const ISLAND_BRIDGE_X = 58;

// Pequeño guiño para el chiste de Tiana: un sapito en el lago.
const FROG_SPOT = { x: 68, y: 60 };

// Árboles sueltos, solo de ambiente.
const TREE_SPOTS = [
  { x: 30, y: 10 },
  { x: 80, y: 10 },
  { x: 110, y: 20 },
  { x: 120, y: 45 },
  { x: 118, y: 60 },
  { x: 115, y: 65 },
  { x: 45, y: 70 },
  { x: 70, y: 72 },
  { x: 120, y: 80 },
  { x: 55, y: 95 },
  { x: 15, y: 20 },
  { x: 100, y: 15 },
];

const k = kaplay({
  width: VIEW_COLS * TILE,
  height: VIEW_ROWS * TILE,
  scale: SCALE,
  crisp: true,
  background: [86, 168, 92],
  font: "monospace",
  letterbox: true,
});

// ---------------------------------------------------------------------
// "Sprites" placeholder por color. Cuando tengas el tileset/personajes
// descargados (ver assets/README.md), esto es lo único que hay que
// cambiar: reemplazar k.color(...) por k.sprite("nombre-del-sprite").
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

function carveBuilding(grid, b) {
  for (let y = b.y; y < b.y + b.h; y++) {
    for (let x = b.x; x < b.x + b.w; x++) {
      grid[y][x] = "building";
    }
  }
}

function carveEllipse(grid, shape, type) {
  for (let y = shape.cy - shape.ry; y <= shape.cy + shape.ry; y++) {
    for (let x = shape.cx - shape.rx; x <= shape.cx + shape.rx; x++) {
      const nx = (x - shape.cx) / shape.rx;
      const ny = (y - shape.cy) / shape.ry;
      if (nx * nx + ny * ny <= 1 && grid[y] && grid[y][x] !== undefined) {
        grid[y][x] = type;
      }
    }
  }
}

function carveCircle(grid, shape, type) {
  for (let y = shape.cy - shape.r; y <= shape.cy + shape.r; y++) {
    for (let x = shape.cx - shape.r; x <= shape.cx + shape.r; x++) {
      if (Math.hypot(x - shape.cx, y - shape.cy) <= shape.r && grid[y] && grid[y][x] !== undefined) {
        grid[y][x] = type;
      }
    }
  }
}

function carveHorizontalBridge(grid, y, xStart, xEnd) {
  for (let x = xStart; x <= xEnd; x++) {
    if (grid[y] && grid[y][x] !== undefined) grid[y][x] = "bridge";
  }
}

function carveVerticalBridge(grid, x, yStart, yEnd) {
  for (let y = yStart; y <= yEnd; y++) {
    if (grid[y] && grid[y][x] !== undefined) grid[y][x] = "bridge";
  }
}

// Camino recto en L (horizontal y después vertical). Se usa para las
// rutas que TIENEN que llegar bien a cada parada.
function paintPath(grid, x1, y1, x2, y2) {
  let x = x1;
  let y = y1;
  while (x !== x2) {
    if (grid[y][x] === "grass") grid[y][x] = "path";
    x += x < x2 ? 1 : -1;
  }
  while (y !== y2) {
    if (grid[y][x] === "grass") grid[y][x] = "path";
    y += y < y2 ? 1 : -1;
  }
  if (grid[y2] && grid[y2][x2] === "grass") grid[y2][x2] = "path";
}

// Camino en diagonal (línea recta), para los senderos que cortan campo
// abierto como en el bosquejo. Es solo decorativo: si se cruza con un
// edificio o el agua, esa porción simplemente no se pinta (el resto del
// camino sigue funcionando igual).
function paintDiagonal(grid, x1, y1, x2, y2) {
  const dx = Math.abs(x2 - x1);
  const dy = Math.abs(y2 - y1);
  const sx = x1 < x2 ? 1 : -1;
  const sy = y1 < y2 ? 1 : -1;
  let err = dx - dy;
  let x = x1;
  let y = y1;
  while (true) {
    if (grid[y] && grid[y][x] === "grass") grid[y][x] = "path";
    if (x === x2 && y === y2) break;
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
  }
}

function buildLevel() {
  const grid = [];
  for (let y = 0; y < ROWS; y++) {
    const row = [];
    for (let x = 0; x < COLS; x++) {
      const isBorder = x === 0 || y === 0 || x === COLS - 1 || y === ROWS - 1;
      row.push(isBorder ? "wall" : "grass");
    }
    grid.push(row);
  }

  LAKE_SHAPES.forEach((shape) => carveEllipse(grid, shape, "water"));
  carveCircle(grid, ISLAND, "grass"); // la mini isla, en medio del lago
  carveHorizontalBridge(grid, BRIDGE_Y, BRIDGE_X_START, BRIDGE_X_END);
  carveVerticalBridge(grid, ISLAND_BRIDGE_X, BRIDGE_Y, ISLAND.cy - ISLAND.r);

  TREE_SPOTS.forEach((t) => {
    if (grid[t.y][t.x] === "grass") grid[t.y][t.x] = "wall";
  });

  const labels = [];
  const stopTiles = new Map(); // "x,y" -> entrada de TIMELINE
  const stopMarks = {}; // id -> {x,y}

  // Edificios: los que tienen un fragmento de historia con el mismo id
  // quedan interactivos (marcador + diálogo al frente); el resto son
  // solo ambientación.
  BUILDINGS.forEach((b) => {
    carveBuilding(grid, b);
    const entry = TIMELINE.find((t) => t.id === b.id);
    if (entry) {
      labels.push({ x: b.x, y: b.y - 1, text: entry.place });
      const markX = b.x + Math.floor(b.w / 2);
      const markY = b.y + b.h;
      grid[markY][markX] = "marker";
      stopTiles.set(`${markX},${markY}`, entry);
      stopMarks[b.id] = { x: markX, y: markY };
    } else {
      labels.push({ x: b.x, y: b.y - 1, text: b.label });
    }
  });

  const entrada = ENTRADA;
  grid[entrada.y][entrada.x] = "markerA";

  // El Bloque 3: el fragmento 6 (niña de pequeña) tiene su marcador
  // justo enfrente del edificio, y el punto de reencuentro con vos
  // queda al lado — ambos del mismo costado para que el camino los
  // pueda alcanzar sin cruzar el edificio.
  const b3 = BLOQUE3_BUILDING;
  carveBuilding(grid, b3);
  labels.push({ x: b3.x, y: b3.y - 1, text: b3.label });
  const bloque3Mark = { x: b3.x + Math.floor(b3.w / 2), y: b3.y - 1 };
  const sweetheart = { x: bloque3Mark.x + 1, y: bloque3Mark.y };
  grid[bloque3Mark.y][bloque3Mark.x] = "marker";
  const bloque3Entry = TIMELINE.find((t) => t.id === "bloque3");
  if (bloque3Entry) stopTiles.set(`${bloque3Mark.x},${bloque3Mark.y}`, bloque3Entry);
  grid[sweetheart.y][sweetheart.x] = "sweetheart";

  // Ruta principal (garantiza que se pueda llegar a cada parada sin
  // cruzar ningún edificio): sube/baja por columnas despejadas entre
  // los edificios y entra a cada uno desde su frente (lado sur, que es
  // donde queda el marcador de cada edificio interactivo).
  const route = [
    entrada,
    { x: entrada.x, y: 16 },
    stopMarks.hangares,
    stopMarks.mar_caribe,
    { x: 80, y: 16 },
    { x: 80, y: 40 },
    stopMarks.cienaga,
    { x: 80, y: 40 },
    { x: 80, y: 54 },
    stopMarks.sierra_nevada,
    { x: 80, y: 54 },
    { x: 80, y: 71 }, // baja por debajo del lago (evita cruzarlo)
    { x: 30, y: 71 },
    { x: 30, y: 85 },
    stopMarks.cafeteria,
    { x: 19, y: 85 },
    { x: 19, y: bloque3Mark.y },
    { x: bloque3Mark.x, y: bloque3Mark.y },
    sweetheart,
  ].filter(Boolean);

  for (let i = 0; i < route.length - 1; i++) {
    paintPath(grid, route[i].x, route[i].y, route[i + 1].x, route[i + 1].y);
  }

  // Senderos diagonales decorativos, como en el bosquejo.
  paintDiagonal(grid, 45, 16, 35, 74);
  paintDiagonal(grid, 20, 26, 32, 60);

  return { grid, labels, stopTiles, stopMarks, entrada, sweetheart };
}

// ---------------------------------------------------------------------
// Escena: título
// ---------------------------------------------------------------------
k.scene("title", () => {
  k.add([k.rect(VIEW_COLS * TILE, VIEW_ROWS * TILE), k.pos(0, 0), k.color(30, 30, 45)]);
  k.add([k.text(TITLE_SCREEN.title, { size: 16, width: VIEW_COLS * TILE - 32 }), k.pos(16, 40), k.color(255, 255, 255)]);
  k.add([k.text(TITLE_SCREEN.subtitle, { size: 8 }), k.pos(16, 90), k.color(200, 200, 220)]);
  k.add([
    k.text("Presiona Espacio para empezar", { size: 8 }),
    k.pos(16, VIEW_ROWS * TILE - 32),
    k.color(255, 220, 120),
  ]);
  k.onKeyPress("space", () => k.go("game"));
});

// ---------------------------------------------------------------------
// Escena: juego
// ---------------------------------------------------------------------
k.scene("game", () => {
  const { grid, labels, stopTiles, stopMarks, entrada, sweetheart } = buildLevel();

  // Solo se crean objetos para tiles que NO son pasto liso (el pasto ya
  // es el color de fondo) — así el mapa puede ser grande sin que el
  // juego tenga que dibujar decenas de miles de rectángulos verdes de
  // más.
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const type = grid[y][x];
      if (type === "grass") continue;
      k.add([k.rect(TILE, TILE), k.pos(x * TILE, y * TILE), k.color(...COLORS[type]), k.z(0)]);

      if (type === "marker") {
        k.add([k.text("!", { size: 8 }), k.pos(x * TILE + 5, y * TILE - 3), k.color(90, 60, 10), k.z(5)]);
      } else if (type === "markerA") {
        k.add([k.text("A", { size: 8 }), k.pos(x * TILE + 4, y * TILE - 1), k.color(90, 70, 10), k.z(5)]);
      } else if (type === "sweetheart") {
        k.add([k.text("♥", { size: 8 }), k.pos(x * TILE + 4, y * TILE - 1), k.color(200, 30, 90), k.z(5)]);
      }
    }
  }

  labels.forEach((l) => {
    k.add([k.text(l.text, { size: 6 }), k.pos(l.x * TILE, l.y * TILE + 2), k.color(230, 230, 235), k.z(5)]);
  });

  // Guiño a Tiana: un sapito escondido en el lago.
  k.add([
    k.text("R", { size: 7 }),
    k.pos(FROG_SPOT.x * TILE + 3, FROG_SPOT.y * TILE - 1),
    k.color(60, 140, 60),
    k.z(6),
  ]);

  const player = k.add([
    k.rect(TILE - 2, TILE - 2),
    k.pos(entrada.x * TILE + 1, entrada.y * TILE + 1),
    k.color(...COLORS.player),
    k.z(10),
    { gridX: entrada.x, gridY: entrada.y, moving: false },
  ]);

  // ---- Fragmentos de historia + objetos (recompensa por cada uno) ----
  const TOTAL_FRAGMENTS = TIMELINE.length;
  const collected = new Set();
  const counter = k.add([
    k.text(`Fragmentos: 0/${TOTAL_FRAGMENTS}`, { size: 7 }),
    k.pos(6, 4),
    k.color(255, 255, 255),
    k.fixed(),
    k.z(200),
  ]);

  // ---- Mini-mapa (arriba a la derecha): dónde está cada fragmento y
  // dónde estás vos ----
  const MINI_W = 110;
  const MINI_H = 80;
  const miniX = VIEW_COLS * TILE - MINI_W - 6;
  const miniY = 6;
  const miniScaleX = MINI_W / COLS;
  const miniScaleY = MINI_H / ROWS;

  k.add([k.rect(MINI_W, MINI_H), k.pos(miniX, miniY), k.color(20, 40, 24), k.fixed(), k.z(199)]);

  const miniDots = {};
  TIMELINE.forEach((entry) => {
    const pos = stopMarks[entry.id];
    if (!pos) return;
    miniDots[entry.id] = k.add([
      k.rect(3, 3),
      k.pos(miniX + pos.x * miniScaleX, miniY + pos.y * miniScaleY),
      k.color(...COLORS.marker),
      k.fixed(),
      k.z(201),
    ]);
  });
  k.add([
    k.rect(4, 4),
    k.pos(miniX + sweetheart.x * miniScaleX, miniY + sweetheart.y * miniScaleY),
    k.color(...COLORS.sweetheart),
    k.fixed(),
    k.z(201),
  ]);
  const miniPlayerDot = k.add([
    k.rect(3, 3),
    k.pos(miniX, miniY),
    k.color(...COLORS.player),
    k.fixed(),
    k.z(202),
  ]);

  let dialogOpen = false;

  // "content" puede ser un solo texto o un array de textos: cada uno es
  // una pantalla, se avanza de una a otra con Espacio.
  function showDialog(title, subtitle, content, onClose) {
    dialogOpen = true;
    const pages = Array.isArray(content) ? content : [content];
    let pageIndex = 0;

    const boxW = VIEW_COLS * TILE - 16;
    const boxH = 52;
    const boxX = 8;
    const boxY = VIEW_ROWS * TILE - boxH - 6;
    const textY = boxY + (subtitle ? 27 : 18);

    const elements = [
      k.add([k.rect(boxW, boxH), k.pos(boxX, boxY), k.color(20, 20, 30), k.fixed(), k.z(100)]),
      k.add([k.rect(boxW - 4, boxH - 4), k.pos(boxX + 2, boxY + 2), k.color(245, 245, 235), k.fixed(), k.z(101)]),
      k.add([k.text(title, { size: 8 }), k.pos(boxX + 8, boxY + 6), k.color(70, 45, 15), k.z(102), k.fixed()]),
    ];

    if (subtitle) {
      elements.push(
        k.add([k.text(subtitle, { size: 6 }), k.pos(boxX + 8, boxY + 17), k.color(120, 100, 70), k.z(102), k.fixed()])
      );
    }

    const textEl = k.add([
      k.text(pages[0], { size: 7, width: boxW - 16 }),
      k.pos(boxX + 8, textY),
      k.color(30, 30, 30),
      k.z(102),
      k.fixed(),
    ]);
    elements.push(textEl);
    elements.push(
      k.add([
        k.text("Espacio para continuar", { size: 6 }),
        k.pos(boxX + 8, boxY + boxH - 10),
        k.color(130, 130, 130),
        k.z(102),
        k.fixed(),
      ])
    );

    const handler = k.onKeyPress("space", () => {
      pageIndex++;
      if (pageIndex < pages.length) {
        textEl.text = pages[pageIndex];
        return;
      }
      elements.forEach((e) => k.destroy(e));
      dialogOpen = false;
      handler.cancel();
      if (onClose) onClose();
    });
  }

  function checkTrigger(x, y) {
    const key = `${x},${y}`;
    if (stopTiles.has(key)) {
      const entry = stopTiles.get(key);
      const isNew = !collected.has(entry.id);
      showDialog(entry.npc || entry.place, entry.place, entry.pages, () => {
        if (!isNew) return;
        collected.add(entry.id);
        counter.text = `Fragmentos: ${collected.size}/${TOTAL_FRAGMENTS}`;
        if (miniDots[entry.id]) miniDots[entry.id].color = k.rgb(150, 150, 150);
        showDialog("¡Conseguiste un objeto!", null, entry.item);
      });
      return;
    }
    if (x === sweetheart.x && y === sweetheart.y) {
      if (collected.size < TOTAL_FRAGMENTS) {
        showDialog("...", null, LOCKED.text);
        return;
      }
      showDialog("♥", null, REUNION.pages, () => k.go("ending"));
    }
  }

  function tryMove(dx, dy) {
    if (dialogOpen || player.moving) return;
    const nx = player.gridX + dx;
    const ny = player.gridY + dy;
    if (ny < 0 || ny >= ROWS || nx < 0 || nx >= COLS) return;
    if (!WALKABLE.has(grid[ny][nx])) return;

    player.moving = true;
    k.tween(
      player.pos,
      k.vec2(nx * TILE + 1, ny * TILE + 1),
      MOVE_TIME,
      (p) => (player.pos = p),
      k.easings.linear
    ).onEnd(() => {
      player.gridX = nx;
      player.gridY = ny;
      player.moving = false;
      checkTrigger(nx, ny);
    });
  }

  k.onKeyPress("left", () => tryMove(-1, 0));
  k.onKeyPress("right", () => tryMove(1, 0));
  k.onKeyPress("up", () => tryMove(0, -1));
  k.onKeyPress("down", () => tryMove(0, 1));
  k.onKeyPress("a", () => tryMove(-1, 0));
  k.onKeyPress("d", () => tryMove(1, 0));
  k.onKeyPress("w", () => tryMove(0, -1));
  k.onKeyPress("s", () => tryMove(0, 1));

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
  k.add([k.rect(VIEW_COLS * TILE, VIEW_ROWS * TILE), k.pos(0, 0), k.color(45, 22, 32)]);

  // Los dos personajes se acercan y se encuentran en el medio.
  const midX = (VIEW_COLS * TILE) / 2;
  const animY = 20;
  const her = k.add([k.rect(10, 10), k.pos(10, animY), k.color(...COLORS.sweetheart), k.z(10)]);
  const him = k.add([k.rect(10, 10), k.pos(VIEW_COLS * TILE - 20, animY), k.color(...COLORS.player), k.z(10)]);
  k.tween(her.pos, k.vec2(midX - 12, animY), 1, (p) => (her.pos = p), k.easings.easeOutQuad);
  k.tween(him.pos, k.vec2(midX + 2, animY), 1, (p) => (him.pos = p), k.easings.easeOutQuad).onEnd(() => {
    k.add([k.text("♥", { size: 12 }), k.pos(midX - 5, animY - 14), k.color(230, 60, 110), k.z(11)]);
  });

  k.add([k.text(ENDING.title, { size: 14 }), k.pos(16, 48), k.color(255, 255, 255)]);
  k.add([
    k.text(ENDING.text, { size: 8, width: VIEW_COLS * TILE - 32 }),
    k.pos(16, 74),
    k.color(255, 210, 220),
  ]);
  k.add([k.text("Feliz aniversario <3", { size: 10 }), k.pos(16, VIEW_ROWS * TILE - 26), k.color(255, 180, 200)]);
});

k.go("title");
