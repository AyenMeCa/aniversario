// ---------------------------------------------------------------------
// LA HISTORIA DEL JUEGO
// ---------------------------------------------------------------------
// Cada entrada de TIMELINE es un "fragmento de historia": una parada del
// campus donde el jugador se cruza con alguien (un amigo/a en común) que
// cuenta una anécdota y entrega un objeto especial como recompensa. El
// "id" tiene que coincidir con uno de los lugares definidos en
// LEVEL_PLACES dentro de src/main.js (ahí está la posición en el mapa).
//
// Hay que juntar TODOS los fragmentos de esta lista para poder acceder
// al Bloque 3 y encontrarte con ella. Si más adelante se te ocurre un
// lugar nuevo, avisame en el chat y lo agregamos acá + su posición.
// ---------------------------------------------------------------------

export const TIMELINE = [
  {
    id: "cafeteria",
    place: "La Cafetería",
    npc: "TODO: nombre de un amigo/a en común",
    text: "TODO: la anécdota de acá (ej: la fila para reclamar su almuerzo).",
    item: "TODO: nombre de un objeto especial",
  },
  {
    id: "hogares",
    place: "Zona de los Hogares",
    npc: "TODO: nombre de un amigo/a en común",
    text: "TODO: otra anécdota de cuando se cruzaban por acá dando clase.",
    item: "TODO: nombre de un objeto especial",
  },
  {
    id: "mar_caribe",
    place: "Zona Mar Caribe",
    npc: "TODO: nombre de un amigo/a en común",
    text: "TODO: anécdota de cuando se cruzaban por acá dando clase.",
    item: "TODO: nombre de un objeto especial",
  },
  {
    id: "cienaga",
    place: "Edificio Ciénaga",
    npc: "TODO: nombre de un amigo/a en común (o dejalo vacío)",
    text: "TODO: algo de cuando daban clases acá.",
    item: "TODO: nombre de un objeto especial",
  },
  {
    id: "sierra_nevada",
    place: "Edificio Sierra Nevada",
    npc: "TODO: nombre de un amigo/a en común (o dejalo vacío)",
    text: "TODO: algo de cuando daban clases acá.",
    item: "TODO: nombre de un objeto especial",
  },
  {
    id: "bloque3_atras",
    place: "Detrás del Bloque 3",
    npc: "TODO: nombre de un amigo/a en común (o dejalo vacío)",
    text: "TODO: el lugar donde siempre se sentaban juntos.",
    item: "TODO: nombre de un objeto especial",
  },
];

// Lo que se muestra si llegás al Bloque 3 sin haber juntado todos los
// fragmentos todavía.
export const LOCKED = {
  text: "Todavía faltan recuerdos por encontrar antes de poder verla...",
};

// Lo que se muestra apenas el jugador llega al Bloque 3 (ya con todos
// los fragmentos) y la ve, antes del mensaje final.
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
