// ---------------------------------------------------------------------
// PLANO DEL CAMPUS
// ---------------------------------------------------------------------
// Este es el mapa dibujado en texto, calcado del plano de referencia.
// Cada carácter es un bloque de 4x4 tiles del juego, así que este plano
// de 25 x 38 caracteres genera un campus de 100 x 152 tiles.
//
// Es la fuente de verdad del mapa: mover una letra acá mueve la cosa en
// el juego. No hace falta tocar ningún otro archivo.
//
//   .  pasto              #  avenida / camino
//   ~  agua (lago)        o  mini isla
//   =  puente             A  entrada (donde arranca ella)
//
//   H  Hangares           M  Mar Caribe
//   C  Ciénaga            S  Sierra Nevada
//   F  Cafetería          3  Bloque 3 (reencuentro)
//   8  Bloque 8           B  Biblioteca
//   O  Otros Bloques      g  bloque genérico (ambiente)
// ---------------------------------------------------------------------

export const CHAR_SCALE = 4; // cada carácter = 4x4 tiles

export const MAP_BLUEPRINT = [
  "............A#..MMMMMMM..",
  "........ggg.##..MMMMMMM..",
  "........ggg.##..MMMMMMM..",
  "HHHHHH..ggg.#...MMMMMMM..",
  "HHHHHH..ggg##............",
  "HHHHHH.....##..........gg",
  "HHHHHH....##...........gg",
  "###################......",
  "###################......",
  ".....##.......#CCCCCCC..g",
  ".....##.......#CCCCCCC..g",
  ".....##~~~~...#CCCCCCC..g",
  ".....##~~~~~~.#CCCCCCC...",
  "......#~~~~~~~#..........",
  "....8.#~~~~~~~#...ggggg..",
  "...888#~~~~~~~#...ggggg..",
  "..8888#~~~~~~~#...ggggg..",
  ".88888#~~~~~~~#..SSSSSSS.",
  ".88888#~~~oo==#..SSSSSSS.",
  ".88888#~~~oo~~#..SSSSSSS.",
  ".88888#~~~~~~~#..SSSSSSS.",
  "..8888#~~~~~~~#..........",
  "...888#~~~~~~~#..........",
  "....8.#~~~~~~.#..BBBBBBB.",
  "......#~~~~~..#..BBBBBBB.",
  "......######..#..BBBBBBB.",
  "...FFFFFFFF##.#..BBBBBBB.",
  "...FFFFFFFF#..##.........",
  "...FFFFFFFF#...##........",
  "...FFFFFFFF#....##.......",
  "gg..FFFFFF.#.....##......",
  "gg.........#......##.....",
  "#########################",
  "gg....3333333...OOOOOOOO.",
  "gg....3333333...OOOOOOOO.",
  "......3333333...OOOOOOOO.",
  "......3333333...OOOOOOOO.",
  ".........................",
];

// Qué letra corresponde a qué edificio. El "id" tiene que coincidir con
// el id del fragmento en timeline.js para que quede interactivo.
// "sprite" queda en null: cuando tengas la textura pixelada se pone acá
// y solo cambia el dibujado, no la lógica.
export const BUILDING_CHARS = {
  H: { id: "hangares", sprite: null },
  M: { id: "mar_caribe", sprite: null },
  C: { id: "cienaga", sprite: null },
  S: { id: "sierra_nevada", sprite: null },
  F: { id: "cafeteria", sprite: null },
  3: { id: "bloque3", label: "Bloque 3", sprite: null },
  8: { id: "bloque8", label: "Bloque 8", sprite: null },
  B: { id: "biblioteca", label: "Biblioteca", sprite: null },
  O: { id: "otros_bloques", label: "Otros Bloques", sprite: null },
  g: { id: "generico", sprite: null },
};
