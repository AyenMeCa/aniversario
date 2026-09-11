import { TIMELINE, REUNION, ENDING, TITLE_SCREEN } from "./timeline.js";

// ---------------------------------------------------------------------
// Config del mapa
// ---------------------------------------------------------------------
const TILE = 16;
const COLS = 48;
const ROWS = 18;
const VIEW_COLS = 24;
const SCALE = 3;
const MOVE_TIME = 0.12;

// Mapa estilizado del campus (no es geográficamente exacto: son las zonas
// que importan en la historia + algunos edificios genéricos de relleno
// para que se sienta como un campus real). "w"/"h" = tamaño del edificio
// en tiles; los lugares de la historia (los que están en TIMELINE) no
// llevan "w"/"h" salvo que representen un edificio real.
const LEVEL_PLACES = {
  entrada: { x: 3, y: 15 },
  cafeteria: { x: 6, y: 12, w: 4, h: 3 },
  hogares: { x: 13, y: 8, w: 5, h: 3 },
  mar_caribe: { x: 24, y: 8, w: 5, h: 3 },
  bloque3_atras: { x: 38, y: 11 },
  bloque3: { x: 35, y: 13, w: 6, h: 4 },
};

// Edificios decorativos (sin diálogo), solo para que el campus se sienta
// más completo. Se pueden ajustar libremente sin romper nada.
const DECOR_BUILDINGS = [
  { x: 5, y: 2, w: 4, h: 3, label: "Bloque 1" },
  { x: 13, y: 2, w: 5, h: 3, label: "Biblioteca" },
  { x: 22, y: 2, w: 4, h: 3, label: "Bloque 2" },
  { x: 34, y: 3, w: 7, h: 4, label: "Estadio" },
];

const k = kaplay({
  width: VIEW_COLS * TILE,
  height: ROWS * TILE,
  scale: SCALE,
  crisp: true,
  background: [40, 44, 52],
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
  wall: [52, 88, 54],
  building: [150, 140, 120],
  markerA: [240, 200, 60],
  marker: [250, 230, 90],
  sweetheart: [235, 110, 160],
  player: [220, 70, 70],
};

const WALKABLE = new Set(["grass", "path", "markerA", "marker", "sweetheart"]);

function carveBuilding(grid, b) {
  for (let y = b.y; y < b.y + b.h; y++) {
    for (let x = b.x; x < b.x + b.w; x++) {
      grid[y][x] = "building";
    }
  }
}

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

  const labels = [];
  DECOR_BUILDINGS.forEach((b) => {
    carveBuilding(grid, b);
    labels.push({ x: b.x, y: b.y - 1, text: b.label });
  });

  const stopTiles = new Map(); // "x,y" -> entrada de TIMELINE
  const orderedStops = [];

  TIMELINE.forEach((entry) => {
    const place = LEVEL_PLACES[entry.id];
    if (!place) return;

    let markX = place.x;
    let markY = place.y;

    if (place.w) {
      carveBuilding(grid, place);
      labels.push({ x: place.x, y: place.y - 1, text: entry.place });
      markX = place.x + Math.floor(place.w / 2);
      markY = place.y + place.h;
    }

    grid[markY][markX] = "marker";
    stopTiles.set(`${markX},${markY}`, entry);
    orderedStops.push({ x: markX, y: markY });
  });

  const entrada = LEVEL_PLACES.entrada;
  grid[entrada.y][entrada.x] = "markerA";

  const b3 = LEVEL_PLACES.bloque3;
  carveBuilding(grid, b3);
  labels.push({ x: b3.x, y: b3.y - 1, text: "Bloque 3" });
  const b3X = b3.x + Math.floor(b3.w / 2);
  const b3Y = b3.y - 1; // tile justo enfrente (arriba) de la entrada del edificio
  grid[b3Y][b3X] = "sweetheart";

  // Camino visual conectando entrada -> paradas -> bloque 3 (en línea recta
  // entre puntos consecutivos; es solo estético, se puede caminar por
  // cualquier parte del pasto igual).
  const route = [entrada, ...orderedStops, { x: b3X, y: b3Y }];
  for (let i = 0; i < route.length - 1; i++) {
    paintPath(grid, route[i].x, route[i].y, route[i + 1].x, route[i + 1].y);
  }

  return { grid, labels, stopTiles, entrada, sweetheart: { x: b3X, y: b3Y } };
}

// ---------------------------------------------------------------------
// Escena: título
// ---------------------------------------------------------------------
k.scene("title", () => {
  k.add([k.rect(VIEW_COLS * TILE, ROWS * TILE), k.pos(0, 0), k.color(30, 30, 45)]);
  k.add([k.text(TITLE_SCREEN.title, { size: 16, width: VIEW_COLS * TILE - 32 }), k.pos(16, 40), k.color(255, 255, 255)]);
  k.add([k.text(TITLE_SCREEN.subtitle, { size: 8 }), k.pos(16, 90), k.color(200, 200, 220)]);
  k.add([
    k.text("Presioná Espacio para empezar", { size: 8 }),
    k.pos(16, ROWS * TILE - 32),
    k.color(255, 220, 120),
  ]);
  k.onKeyPress("space", () => k.go("game"));
});

// ---------------------------------------------------------------------
// Escena: juego
// ---------------------------------------------------------------------
k.scene("game", () => {
  const { grid, labels, stopTiles, entrada, sweetheart } = buildLevel();

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const type = grid[y][x];
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

  const player = k.add([
    k.rect(TILE - 2, TILE - 2),
    k.pos(entrada.x * TILE + 1, entrada.y * TILE + 1),
    k.color(...COLORS.player),
    k.z(10),
    { gridX: entrada.x, gridY: entrada.y, moving: false },
  ]);

  let dialogOpen = false;

  function showDialog(title, subtitle, text, onClose) {
    dialogOpen = true;
    const boxW = VIEW_COLS * TILE - 16;
    const boxH = 52;
    const boxX = 8;
    const boxY = ROWS * TILE - boxH - 6;

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

    elements.push(
      k.add([
        k.text(text, { size: 7, width: boxW - 16 }),
        k.pos(boxX + 8, boxY + (subtitle ? 27 : 18)),
        k.color(30, 30, 30),
        k.z(102),
        k.fixed(),
      ]),
      k.add([
        k.text("Espacio para continuar", { size: 6 }),
        k.pos(boxX + 8, boxY + boxH - 10),
        k.color(130, 130, 130),
        k.z(102),
        k.fixed(),
      ])
    );

    const handler = k.onKeyPress("space", () => {
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
      showDialog(entry.npc || entry.place, entry.place, entry.text);
      return;
    }
    if (x === sweetheart.x && y === sweetheart.y) {
      showDialog("♥", null, REUNION.text, () => k.go("ending"));
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

  const halfView = (VIEW_COLS * TILE) / 2;
  const minCamX = halfView;
  const maxCamX = COLS * TILE - halfView;
  k.onUpdate(() => {
    const camX = k.clamp(player.pos.x, minCamX, maxCamX);
    k.setCamPos(k.vec2(camX, (ROWS * TILE) / 2));
  });
});

// ---------------------------------------------------------------------
// Escena: final
// ---------------------------------------------------------------------
k.scene("ending", () => {
  k.add([k.rect(VIEW_COLS * TILE, ROWS * TILE), k.pos(0, 0), k.color(45, 22, 32)]);
  k.add([k.text(ENDING.title, { size: 14 }), k.pos(16, 26), k.color(255, 255, 255)]);
  k.add([
    k.text(ENDING.text, { size: 8, width: VIEW_COLS * TILE - 32 }),
    k.pos(16, 54),
    k.color(255, 210, 220),
  ]);
  k.add([k.text("Feliz aniversario <3", { size: 10 }), k.pos(16, ROWS * TILE - 26), k.color(255, 180, 200)]);
});

k.go("title");
