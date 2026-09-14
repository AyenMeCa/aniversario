import { TIMELINE, LOCKED, REUNION, ENDING, TITLE_SCREEN, INTRO } from "./timeline.js";

// ---------------------------------------------------------------------
// Config del mapa
// ---------------------------------------------------------------------
// El campus es VERTICAL (más alto que ancho), igual que el plano de
// referencia: 100 x 150 tiles, la misma proporción que el dibujo.
const TILE = 16;
const COLS = 100;
const ROWS = 150;
const VIEW_COLS = 22; // cuánto se ve en pantalla (la cámara hace scroll)
const VIEW_ROWS = 16;
const SCALE = 3;
const MOVE_TIME = 0.12;

// ---------------------------------------------------------------------
// MAPA COMO DATOS (para poder reemplazarlo después)
// ---------------------------------------------------------------------
// Todo lo que se ve (edificios, lago, isla, avenidas) está descrito acá
// como datos, no "dibujado a mano". Cada cosa tiene un campo "sprite"
// que hoy vale null (por eso se dibuja como un bloque de color): el día
// que tengas la textura pixelada, se le pone el nombre del sprite acá y
// se ajusta una sola función de dibujado. La lógica del juego (mapa,
// movimiento, diálogos) no se toca.
//
// Los edificios cuyo id coincide con un fragmento de TIMELINE (ver
// src/timeline.js) quedan interactivos solos: el juego les pone el
// marcador enfrente y el diálogo. Los que llevan "label" son ambiente.
const BUILDINGS = [
  // --- franja de arriba ---
  { id: "hangares", x: 2, y: 16, w: 18, h: 11, sprite: null },
  { id: "gen_arriba_centro", x: 31, y: 2, w: 19, h: 9, sprite: null },
  { id: "mar_caribe", x: 42, y: 12, w: 19, h: 12, sprite: null },
  { id: "gen_arriba_derecha", x: 83, y: 2, w: 14, h: 11, sprite: null },
  { id: "gen_derecha_alta", x: 63, y: 15, w: 18, h: 12, sprite: null },
  { id: "gen_derecha_lejos", x: 85, y: 18, w: 12, h: 9, sprite: null },
  // --- franja del medio ---
  { id: "cienaga", x: 66, y: 36, w: 29, h: 11, sprite: null },
  { id: "gen_medio_derecha", x: 64, y: 50, w: 16, h: 12, sprite: null },
  { id: "sierra_nevada", x: 76, y: 63, w: 20, h: 13, sprite: null },
  { id: "bloque8", shape: "oval", cx: 12, cy: 78, rx: 10, ry: 14, label: "Bloque 8", sprite: null },
  // --- franja de abajo ---
  { id: "biblioteca", x: 53, y: 95, w: 26, h: 11, label: "Biblioteca", sprite: null },
  { id: "cafeteria", x: 15, y: 107, w: 27, h: 13, sprite: null },
  { id: "gen_abajo_izquierda", x: 2, y: 121, w: 12, h: 12, sprite: null },
  { id: "otros_bloques", x: 67, y: 131, w: 29, h: 12, label: "Otros Bloques", sprite: null },
];

// El Bloque 3 se maneja aparte: el fragmento 6 (la niña de pequeña)
// queda EN el edificio y el punto de reencuentro queda justo al lado,
// los dos del mismo costado para que el camino los alcance.
const BLOQUE3_BUILDING = { id: "bloque3", x: 25, y: 131, w: 24, h: 12, label: "Bloque 3", sprite: null };

const ENTRADA = { x: 25, y: 6 };

// El lago: alargado hacia abajo (dos óvalos unidos, como en el plano),
// con la mini isla adentro y los puentes que la conectan.
const LAKE_SHAPES = [
  { cx: 42, cy: 62, rx: 13, ry: 15, sprite: null },
  { cx: 43, cy: 73, rx: 10, ry: 9, sprite: null }, // une los dos lóbulos
  { cx: 45, cy: 84, rx: 13, ry: 13, sprite: null },
];
const ISLAND = { cx: 49, cy: 84, r: 4, sprite: null };
const BRIDGES = [
  { kind: "h", y: 74, from: 30, to: 57 }, // cruce principal del lago
  { kind: "v", x: 49, from: 74, to: 80 }, // bajada a la mini isla
];

// Guiño al chiste de Tiana: un sapito en el lago.
const FROG_SPOT = { x: 40, y: 88 };

// Avenidas: anchas y en diagonal, como en el plano. Cada una es una
// línea con grosor en tiles.
const ROADS = [
  // avenida principal de la izquierda: baja en diagonal desde arriba y
  // sigue pegada al lago (entre el Bloque 8 y el agua)
  { x1: 40, y1: 8, x2: 26, y2: 50, w: 3 },
  { x1: 26, y1: 50, x2: 24, y2: 104, w: 3 },
  { x1: 24, y1: 104, x2: 14, y2: 104, w: 3 },
  { x1: 14, y1: 104, x2: 14, y2: 124, w: 3 },
  // avenida principal de la derecha: diagonal larga de arriba a abajo
  { x1: 84, y1: 12, x2: 96, y2: 28, w: 3 },
  { x1: 96, y1: 28, x2: 60, y2: 92, w: 3 },
  { x1: 58, y1: 92, x2: 80, y2: 92, w: 3 },
  { x1: 80, y1: 92, x2: 96, y2: 124, w: 3 },
  // conexiones hacia los edificios del este
  { x1: 60, y1: 30, x2: 96, y2: 30, w: 3 },
  { x1: 66, y1: 47, x2: 96, y2: 47, w: 3 },
  { x1: 70, y1: 76, x2: 96, y2: 76, w: 3 },
  { x1: 96, y1: 28, x2: 96, y2: 124, w: 3 },
  // avenida de abajo
  { x1: 8, y1: 124, x2: 96, y2: 124, w: 3 },
  // conexión de arriba (Hangares -> Mar Caribe)
  { x1: 8, y1: 28, x2: 62, y2: 28, w: 3 },
];

// Árboles sueltos, solo de ambiente.
const TREE_SPOTS = [
  { x: 8, y: 8 },
  { x: 55, y: 8 },
  { x: 22, y: 40 },
  { x: 60, y: 38 },
  { x: 8, y: 60 },
  { x: 62, y: 70 },
  { x: 90, y: 60 },
  { x: 20, y: 100 },
  { x: 62, y: 90 },
  { x: 70, y: 110 },
  { x: 90, y: 110 },
  { x: 50, y: 118 },
  { x: 8, y: 140 },
  { x: 60, y: 145 },
  { x: 35, y: 145 },
  { x: 82, y: 20 },
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

function setTile(grid, x, y, type) {
  if (grid[y] && grid[y][x] !== undefined) grid[y][x] = type;
}

function carveBuilding(grid, b) {
  if (b.shape === "oval") {
    carveEllipse(grid, b, "building");
    return;
  }
  for (let y = b.y; y < b.y + b.h; y++) {
    for (let x = b.x; x < b.x + b.w; x++) {
      setTile(grid, x, y, "building");
    }
  }
}

// Caja que ocupa un edificio (sirve para poner la etiqueta arriba).
function buildingBounds(b) {
  if (b.shape === "oval") {
    return { x: b.cx - b.rx, y: b.cy - b.ry, w: b.rx * 2, h: b.ry * 2 };
  }
  return { x: b.x, y: b.y, w: b.w, h: b.h };
}

function carveEllipse(grid, shape, type) {
  for (let y = shape.cy - shape.ry; y <= shape.cy + shape.ry; y++) {
    for (let x = shape.cx - shape.rx; x <= shape.cx + shape.rx; x++) {
      const nx = (x - shape.cx) / shape.rx;
      const ny = (y - shape.cy) / shape.ry;
      if (nx * nx + ny * ny <= 1) setTile(grid, x, y, type);
    }
  }
}

function carveCircle(grid, shape, type) {
  for (let y = shape.cy - shape.r; y <= shape.cy + shape.r; y++) {
    for (let x = shape.cx - shape.r; x <= shape.cx + shape.r; x++) {
      if (Math.hypot(x - shape.cx, y - shape.cy) <= shape.r) setTile(grid, x, y, type);
    }
  }
}

function carveBridge(grid, bridge) {
  if (bridge.kind === "h") {
    for (let x = bridge.from; x <= bridge.to; x++) setTile(grid, x, bridge.y, "bridge");
  } else {
    for (let y = bridge.from; y <= bridge.to; y++) setTile(grid, bridge.x, y, "bridge");
  }
}

// Avenida ancha: una línea (recta o diagonal) de "w" tiles de grosor.
// Solo pinta sobre pasto, así nunca tapa un edificio ni el agua.
function paintWideLine(grid, x1, y1, x2, y2, w) {
  const half = Math.floor(w / 2);
  const dx = Math.abs(x2 - x1);
  const dy = Math.abs(y2 - y1);
  const sx = x1 < x2 ? 1 : -1;
  const sy = y1 < y2 ? 1 : -1;
  let err = dx - dy;
  let x = x1;
  let y = y1;
  for (;;) {
    for (let oy = -half; oy <= half; oy++) {
      for (let ox = -half; ox <= half; ox++) {
        if (grid[y + oy] && grid[y + oy][x + ox] === "grass") grid[y + oy][x + ox] = "path";
      }
    }
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

// Camino en L (horizontal y después vertical), para garantizar que se
// pueda llegar caminando a cada parada.
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

  // 1) Lago + isla + puentes
  LAKE_SHAPES.forEach((shape) => carveEllipse(grid, shape, "water"));
  carveCircle(grid, ISLAND, "grass");
  BRIDGES.forEach((b) => carveBridge(grid, b));

  // 2) Edificios
  const labels = [];
  const stopTiles = new Map(); // "x,y" -> entrada de TIMELINE
  const stopMarks = {}; // id -> {x,y}

  BUILDINGS.forEach((b) => {
    carveBuilding(grid, b);
    const box = buildingBounds(b);
    const entry = TIMELINE.find((t) => t.id === b.id);
    if (entry) {
      labels.push({ x: box.x, y: box.y - 1, text: entry.place });
      const markX = box.x + Math.floor(box.w / 2);
      const markY = box.y + box.h;
      setTile(grid, markX, markY, "marker");
      stopTiles.set(`${markX},${markY}`, entry);
      stopMarks[b.id] = { x: markX, y: markY };
    } else if (b.label) {
      labels.push({ x: box.x, y: box.y - 1, text: b.label });
    }
  });

  const b3 = BLOQUE3_BUILDING;
  carveBuilding(grid, b3);
  labels.push({ x: b3.x, y: b3.y - 1, text: b3.label });
  const bloque3Mark = { x: b3.x + Math.floor(b3.w / 2), y: b3.y - 1 };
  const sweetheart = { x: bloque3Mark.x + 1, y: bloque3Mark.y };

  // 3) Avenidas anchas (solo sobre pasto)
  ROADS.forEach((r) => paintWideLine(grid, r.x1, r.y1, r.x2, r.y2, r.w));

  // 4) Ruta que garantiza llegar caminando a cada parada (sin cruzar
  // ningún edificio ni el agua).
  const entrada = ENTRADA;
  const route = [
    entrada,
    { x: 25, y: 27 },
    stopMarks.hangares,
    { x: 51, y: 27 },
    stopMarks.mar_caribe,
    { x: 51, y: 32 },
    { x: 60, y: 32 },
    { x: 60, y: 47 },
    stopMarks.cienaga,
    { x: 97, y: 47 },
    { x: 97, y: 76 },
    stopMarks.sierra_nevada,
    { x: 97, y: 76 },
    { x: 97, y: 124 },
    { x: 28, y: 124 },
    stopMarks.cafeteria,
    { x: 28, y: 124 },
    { x: bloque3Mark.x, y: 124 },
    bloque3Mark,
    sweetheart,
  ].filter(Boolean);

  for (let i = 0; i < route.length - 1; i++) {
    paintPath(grid, route[i].x, route[i].y, route[i + 1].x, route[i + 1].y);
  }

  // 5) Árboles (solo sobre pasto libre)
  TREE_SPOTS.forEach((t) => {
    if (grid[t.y] && grid[t.y][t.x] === "grass") grid[t.y][t.x] = "wall";
  });

  // 6) Marcadores (van arriba de todo lo demás)
  setTile(grid, entrada.x, entrada.y, "markerA");
  setTile(grid, bloque3Mark.x, bloque3Mark.y, "marker");
  const bloque3Entry = TIMELINE.find((t) => t.id === "bloque3");
  if (bloque3Entry) stopTiles.set(`${bloque3Mark.x},${bloque3Mark.y}`, bloque3Entry);
  setTile(grid, sweetheart.x, sweetheart.y, "sweetheart");

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

  // Dibujado del mapa: se juntan los tiles iguales de cada fila en un
  // solo rectángulo (así un mapa grande no crea miles de objetos). El
  // pasto no se dibuja porque ya es el color de fondo.
  for (let y = 0; y < ROWS; y++) {
    let x = 0;
    while (x < COLS) {
      const type = grid[y][x];
      if (type === "grass") {
        x++;
        continue;
      }
      let end = x;
      while (end + 1 < COLS && grid[y][end + 1] === type) end++;
      const len = end - x + 1;
      k.add([k.rect(TILE * len, TILE), k.pos(x * TILE, y * TILE), k.color(...COLORS[type]), k.z(0)]);

      if (type === "marker") {
        k.add([k.text("!", { size: 8 }), k.pos(x * TILE + 5, y * TILE - 3), k.color(90, 60, 10), k.z(5)]);
      } else if (type === "markerA") {
        k.add([k.text("A", { size: 8 }), k.pos(x * TILE + 4, y * TILE - 1), k.color(90, 70, 10), k.z(5)]);
      } else if (type === "sweetheart") {
        k.add([k.text("♥", { size: 8 }), k.pos(x * TILE + 4, y * TILE - 1), k.color(200, 30, 90), k.z(5)]);
      }
      x = end + 1;
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

  // ---- Mini-mapa (arriba a la derecha) ----
  const MINI_W = 60;
  const MINI_H = 90;
  const miniX = VIEW_COLS * TILE - MINI_W - 6;
  const miniY = 6;
  const miniScaleX = MINI_W / COLS;
  const miniScaleY = MINI_H / ROWS;

  k.add([k.rect(MINI_W, MINI_H), k.pos(miniX, miniY), k.color(20, 40, 24), k.fixed(), k.z(199)]);

  const miniDots = {};
  TIMELINE.forEach((entry) => {
    const pos = entry.id === "bloque3" ? { x: sweetheart.x - 1, y: sweetheart.y } : stopMarks[entry.id];
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
