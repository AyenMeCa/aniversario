// ---------------------------------------------------------------------
// PLANO DEL CAMPUS
// ---------------------------------------------------------------------
// Este es el mapa dibujado en texto, calcado del plano de referencia.
// Cada carácter es un bloque de 2x2 tiles del juego, así que este plano
// de 36 x 51 caracteres genera un campus de 72 x 102 tiles. Alrededor hay una
// franja de pasto de 10 tiles por lado, y arriba de todo una franja extra
// pensada para Mar Caribe, que es un edificio enorme.
//
// Es la fuente de verdad del mapa: mover una letra acá mueve la cosa en
// el juego. No hace falta tocar ningún otro archivo.
//
//   .  pasto              #  avenida / camino
//   ~  agua (lago y canal del oeste)        o  mini isla
//   =  puente             (la entrada ya no se marca acá: ver SPAWN_TILE en main.js)
//
//   H  Hangares           M  Mar Caribe
//   C  Ciénaga            S  Sierra Nevada
//   F  Cafetería          3  Bloque 3 (reencuentro)
//   8  Bloque 8           B  Biblioteca
//   g  bloque genérico (ambiente)
// ---------------------------------------------------------------------

export const CHAR_SCALE = 2; // cada carácter = 2x2 tiles

export const MAP_BLUEPRINT = [
  "....................................",
  "....................................",
  "....................................",
  ".....................MMMMMMMMMMMMMM.",
  ".....................MMMMMMMMMMMMMM.",
  ".....................MMMMMMMMMMMMMM.",
  ".....................MMMMMMMMMMMMMM.",
  ".....................MMMMMMMMMMMMMM.",
  ".....................MMMMMMMMMMMMMM.",
  ".....HHHHHH..ggg.....MMMMMMMMMMMMMM.",
  ".....HHHHHH..ggg....................",
  ".....HHHHHH..ggg....................",
  ".....HHHHHH..ggg##..................",
  "................##..........gg......",
  "...............##...........gg......",
  ".....###################............",
  ".....###################............",
  "..........##.......#CCCCCCC..g......",
  "........~~~~~~~~...#CCCCCCC..g......",
  "........~~~~~~~~...#CCCCCCC..g......",
  "..........##~~~~~~.#CCCCCCC.........",
  "...........#~~~~~~~#................",
  ".........8.#~~~~~~~#...ggggg........",
  "........888#~~~~~~~#...ggggg........",
  ".......8888#~~~~~~~#...ggggg........",
  "......88888#~~~~~~~#..SSSSSSS.......",
  "......88888#~~~oo==#..SSSSSSS.......",
  "......88888#~~~oo~~#..SSSSSSS.......",
  "......88888#~~~~~~~#..SSSSSSS.......",
  ".......8888#~~~~~~~#................",
  "........888#~~~~~~~#................",
  ".........8.#~~~~~~.#..BBBBBBB.......",
  "...........#~~~~~..#..BBBBBBB.......",
  "...........######..#..BBBBBBB.......",
  "................##.#..BBBBBBB.......",
  "................#..##...............",
  "........FFFFFFFF#...##..............",
  "........FFFFFFFF#....##.............",
  ".....gg.FFFFFFFF#.....##............",
  ".....gg.FFFFFFFF#......##...........",
  ".....####FFFFFF###############......",
  ".....gg.............................",
  ".....gg.............................",
  "...............3333333..............",
  "...............3333333..............",
  "...............3333333..............",
  "...............3333333..............",
  "....................................",
  "....................................",
  "....................................",
  "....................................",
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
  g: { id: "generico", sprite: null },
};
