import { TIMELINE, ENDING, TITLE_SCREEN } from "./timeline.js";

// ---------------------------------------------------------------------
// Config del mapa
// ---------------------------------------------------------------------
const TILE = 16;
const COLS = 30;
const ROWS = 9;
const VIEW_COLS = 20;
const SCALE = 3;
const MOVE_TIME = 0.12;

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
// descargados (ver README), esto es lo único que hay que cambiar:
// reemplazar k.color(...) por k.sprite("nombre-del-sprite") y cargar
// las imágenes con k.loadSprite() antes de kaplay() construir el mapa.
// ---------------------------------------------------------------------
const COLORS = {
  grass: [86, 168, 92],
  path: [214, 186, 130],
  wall: [52, 88, 54],
  markerA: [240, 200, 60],
  markerB: [230, 90, 120],
  marker: [250, 230, 90],
  player: [220, 70, 70],
};

const WALKABLE = new Set(["grass", "path", "markerA", "markerB", "marker"]);

function buildLevel() {
  const grid = [];
  for (let y = 0; y < ROWS; y++) {
    const row = [];
    for (let x = 0; x < COLS; x++) {
      const isBorder = x === 0 || y === 0 || x === COLS - 1 || y === ROWS - 1;
      let type = "grass";
      if (isBorder) type = "wall";
      else if (y === 4) type = "path";
      else if ((y === 1 || y === ROWS - 2) && x % 4 === 2) type = "wall";
      row.push(type);
    }
    grid.push(row);
  }

  const pointA = { x: 2, y: 4 };
  const pointB = { x: COLS - 3, y: 4 };
  grid[pointA.y][pointA.x] = "markerA";
  grid[pointB.y][pointB.x] = "markerB";

  const markers = new Map(); // "x,y" -> entrada de TIMELINE
  const usableStart = 5;
  const usableEnd = COLS - 5;
  const span = usableEnd - usableStart;
  TIMELINE.forEach((entry, i) => {
    const x = usableStart + Math.round(((i + 1) * span) / (TIMELINE.length + 1));
    grid[4][x] = "marker";
    markers.set(`${x},4`, entry);
  });

  return { grid, pointA, pointB, markers };
}

// ---------------------------------------------------------------------
// Escena: título
// ---------------------------------------------------------------------
k.scene("title", () => {
  k.add([k.rect(VIEW_COLS * TILE, ROWS * TILE), k.pos(0, 0), k.color(30, 30, 45)]);
  k.add([k.text(TITLE_SCREEN.title, { size: 16 }), k.pos(16, 40), k.color(255, 255, 255)]);
  k.add([k.text(TITLE_SCREEN.subtitle, { size: 8 }), k.pos(16, 68), k.color(200, 200, 220)]);
  k.add([
    k.text("Presioná Espacio para empezar", { size: 8 }),
    k.pos(16, 112),
    k.color(255, 220, 120),
  ]);
  k.onKeyPress("space", () => k.go("game"));
});

// ---------------------------------------------------------------------
// Escena: juego
// ---------------------------------------------------------------------
k.scene("game", () => {
  const { grid, pointA, markers } = buildLevel();

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const type = grid[y][x];
      k.add([k.rect(TILE, TILE), k.pos(x * TILE, y * TILE), k.color(...COLORS[type]), k.z(0)]);

      if (type === "marker") {
        k.add([k.text("!", { size: 8 }), k.pos(x * TILE + 5, y * TILE - 3), k.color(90, 60, 10), k.z(5)]);
      } else if (type === "markerA") {
        k.add([k.text("A", { size: 8 }), k.pos(x * TILE + 4, y * TILE - 1), k.color(90, 70, 10), k.z(5)]);
      } else if (type === "markerB") {
        k.add([k.text("B", { size: 8 }), k.pos(x * TILE + 4, y * TILE - 1), k.color(90, 20, 40), k.z(5)]);
      }
    }
  }

  const player = k.add([
    k.rect(TILE - 2, TILE - 2),
    k.pos(pointA.x * TILE + 1, pointA.y * TILE + 1),
    k.color(...COLORS.player),
    k.z(10),
    { gridX: pointA.x, gridY: pointA.y, moving: false },
  ]);

  let dialogOpen = false;

  function showDialog(title, text, onClose) {
    dialogOpen = true;
    const boxW = VIEW_COLS * TILE - 16;
    const boxH = 44;
    const boxX = 8;
    const boxY = ROWS * TILE - boxH - 6;

    const elements = [
      k.add([k.rect(boxW, boxH), k.pos(boxX, boxY), k.color(20, 20, 30), k.fixed(), k.z(100)]),
      k.add([k.rect(boxW - 4, boxH - 4), k.pos(boxX + 2, boxY + 2), k.color(245, 245, 235), k.fixed(), k.z(101)]),
      k.add([k.text(title, { size: 8 }), k.pos(boxX + 8, boxY + 6), k.color(70, 45, 15), k.z(102), k.fixed()]),
      k.add([
        k.text(text, { size: 7, width: boxW - 16 }),
        k.pos(boxX + 8, boxY + 18),
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
      ]),
    ];

    const handler = k.onKeyPress("space", () => {
      elements.forEach((e) => k.destroy(e));
      dialogOpen = false;
      handler.cancel();
      if (onClose) onClose();
    });
  }

  function checkTrigger(x, y) {
    const key = `${x},${y}`;
    if (markers.has(key)) {
      const entry = markers.get(key);
      showDialog(entry.title, entry.text);
      return;
    }
    const type = grid[y][x];
    if (type === "markerB") {
      showDialog("...", "Llegaste.", () => k.go("ending"));
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
