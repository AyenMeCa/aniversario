import { TIMELINE, LOCKED, REUNION, ENDING, TITLE_SCREEN, INTRO } from "./timeline.js";
import { MAP_BLUEPRINT, BUILDING_CHARS, CHAR_SCALE } from "./blueprint.js";

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

function charToTile(ch) {
  if (ch === "#") return "path";
  if (ch === "~") return "water";
  if (ch === "=") return "bridge";
  if (ch === "o") return "grass"; // la mini isla es tierra rodeada de agua
  if (BUILDING_CHARS[ch]) return "building";
  return "grass"; // "." y "A"
}

// Redondea los bordes del agua para que el lago no se vea cuadriculado.
function smoothWater(grid, passes) {
  for (let p = 0; p < passes; p++) {
    const snap = grid.map((row) => row.slice());
    for (let y = 1; y < ROWS - 1; y++) {
      for (let x = 1; x < COLS - 1; x++) {
        const t = snap[y][x];
        if (t !== "water" && t !== "grass") continue;
        let n = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            if (snap[y + dy][x + dx] === "water") n++;
          }
        }
        if (t === "water" && n < 4) grid[y][x] = "grass";
        else if (t === "grass" && n > 5) grid[y][x] = "water";
      }
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

  // --- 2. Redondear el lago y volver a tallar la isla ---
  smoothWater(grid, 2);
  if (islandChars.length) {
    const cx =
      (islandChars.reduce((s, c) => s + c.cx, 0) / islandChars.length) * CHAR_SCALE + CHAR_SCALE / 2;
    const cy =
      (islandChars.reduce((s, c) => s + c.cy, 0) / islandChars.length) * CHAR_SCALE + CHAR_SCALE / 2;
    carveCircle(grid, cx, cy, CHAR_SCALE * 1.2, "grass");
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

  // --- 3. Borde del mapa ---
  for (let x = 0; x < COLS; x++) {
    grid[0][x] = "wall";
    grid[ROWS - 1][x] = "wall";
  }
  for (let y = 0; y < ROWS; y++) {
    grid[y][0] = "wall";
    grid[y][COLS - 1] = "wall";
  }

  // --- 4. Etiquetas y marcadores de cada edificio ---
  const labels = [];
  const stopTiles = new Map();
  const stopMarks = {};

  Object.entries(boxes).forEach(([id, box]) => {
    const entry = TIMELINE.find((t) => t.id === id);
    const text = entry ? entry.place : box.info.label;
    if (text) labels.push({ x: box.x0, y: box.y0 - 1, text });

    if (!entry) return;
    const spot = findMarkerSpot(grid, box);
    if (!spot) return;
    grid[spot.y][spot.x] = "marker";
    stopTiles.set(`${spot.x},${spot.y}`, entry);
    stopMarks[id] = spot;
  });

  // --- 5. Entrada y punto de reencuentro ---
  const entrada = entradaChar
    ? { x: entradaChar.cx * CHAR_SCALE + 2, y: entradaChar.cy * CHAR_SCALE + 2 }
    : { x: 2, y: 2 };
  grid[entrada.y][entrada.x] = "markerA";

  // El reencuentro con vos queda pegado al marcador del Bloque 3.
  const b3 = stopMarks.bloque3;
  const sweetheart = b3 ? { x: b3.x + 1, y: b3.y } : { x: 2, y: 3 };
  grid[sweetheart.y][sweetheart.x] = "sweetheart";

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

  // Dibujado: se juntan los tiles iguales de cada fila en un solo
  // rectángulo, así un mapa grande no crea miles de objetos. El pasto no
  // se dibuja porque ya es el color de fondo.
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
    k.add([k.text(l.text, { size: 6 }), k.pos(l.x * TILE, l.y * TILE - 4), k.color(245, 245, 250), k.z(5)]);
  });

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
