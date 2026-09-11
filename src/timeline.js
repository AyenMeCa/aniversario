// ---------------------------------------------------------------------
// LA HISTORIA DEL JUEGO
// ---------------------------------------------------------------------
// Cada entrada de PLACES es una parada del campus donde el jugador se
// cruza con alguien (un amigo/a en común) que cuenta una curiosidad o
// anécdota. El "id" tiene que coincidir con uno de los lugares definidos
// en LEVEL_PLACES dentro de src/main.js (ahí está la posición en el mapa).
//
// Si más adelante se te ocurre un lugar nuevo, avisame en el chat y lo
// agregamos acá + su posición en el mapa.
// ---------------------------------------------------------------------

export const TIMELINE = [
  {
    id: "cafeteria",
    place: "La Cafetería",
    npc: "TODO: nombre de un amigo/a en común",
    text: "TODO: la anécdota de acá (ej: la fila para reclamar su almuerzo).",
  },
  {
    id: "hogares",
    place: "Zona de los Hogares",
    npc: "TODO: nombre de un amigo/a en común",
    text: "TODO: otra anécdota de cuando se cruzaban por acá dando clase.",
  },
  {
    id: "mar_caribe",
    place: "Zona Mar Caribe",
    npc: "TODO: nombre de un amigo/a en común",
    text: "TODO: anécdota de cuando se cruzaban por acá dando clase.",
  },
  {
    id: "bloque3_atras",
    place: "Detrás del Bloque 3",
    npc: "TODO: nombre de un amigo/a en común (o dejalo vacío)",
    text: "TODO: el lugar donde siempre se sentaban juntos.",
  },
];

// Lo que se muestra apenas el jugador llega al Bloque 3 y la ve, antes
// del mensaje final. Podés cambiar este texto por lo que quieras.
export const REUNION = {
  text: "Ahí está. Después de recorrer todo el camino, la encontrás.",
};

// Mensaje final del juego (después de la reunión en el Bloque 3).
export const ENDING = {
  title: "Hoy",
  text: "TODO: el mensaje final para el aniversario (puede ser una declaración, una propuesta, lo que quieras).",
};

// Título y subtítulo de la pantalla de inicio.
export const TITLE_SCREEN = {
  title: "Mi aventura para encontrarte",
  subtitle: "Un juego para nuestro aniversario",
};
