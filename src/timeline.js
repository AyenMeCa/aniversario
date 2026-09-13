// ---------------------------------------------------------------------
// LA HISTORIA DEL JUEGO
// ---------------------------------------------------------------------
// Cada entrada de TIMELINE es un "fragmento de historia": una parada del
// campus donde el jugador se cruza con un personaje que cuenta algo y
// entrega un objeto especial como recompensa. El "id" tiene que coincidir
// con uno de los lugares definidos en LEVEL_PLACES dentro de src/main.js
// (ahí está la posición en el mapa).
//
// "pages" es un array: cada elemento es una pantalla de diálogo, se
// avanza de una a la otra con Espacio (como cualquier RPG). Puedes poner
// solo una si no necesitas varias.
//
// Hay que juntar TODOS los fragmentos de esta lista para poder acceder
// al Bloque 3 y encontrarte con ella. Si más adelante se te ocurre un
// lugar nuevo, avísame en el chat y lo agregamos acá + su posición.
// ---------------------------------------------------------------------

export const TIMELINE = [
  {
    id: "cafeteria",
    place: "La Cafetería",
    npc: "Namjoon (BTS)",
    pages: [
      "Annyeonghaseyo! 안녕하세요, 반가워요...",
      "(No entiendes nada de lo que dice. Sacas el teléfono para traducir.)",
      "Ah, perdón — ¡hola! Tu novio me pidió que te esperara acá. Eres súper fan nuestra, ¿no? Qué lindo conocerte.",
      "Lamento no poder quedarme más — el resto del grupo me espera, salimos de gira hoy mismo. Pero antes, toma esto.",
      "Tu novio te está esperando en algún lugar de la universidad... la verdad no recuerdo bien dónde. Pero en la Zona de los Hogares alguien sabe más que yo.",
    ],
    item: "Un Army Bomb",
  },
  {
    id: "hogares",
    place: "Zona de los Hogares",
    npc: "Tikki",
    pages: [
      "¡Hola! Soy Tikki. Tu novio me ayudó a encontrar a Marinette cuando andaba perdida por acá.",
      "Como agradecimiento quiero darte algo: unos aretes iguales a los que usa ella para transformarse.",
      "Estos aretes te van a guiar hacia el próximo lugar... siento que hay una princesa esperándote en la Zona Mar Caribe.",
    ],
    item: "Los aretes de Marinette",
  },
  {
    id: "mar_caribe",
    place: "Zona Mar Caribe",
    npc: "Tiana",
    pages: [
      "¡Hola! Yo también ando buscando a alguien especial — mi amado se convirtió en sapo por un hechizo.",
      "Voy a buscarlo por la zona del lago... dicen que anda saltando por ahí (guiño, guiño).",
      "No puedo ayudarte a encontrar a tu novio, pero en el Edificio Ciénaga hay otra princesa que seguro sabe más que yo.",
    ],
    item: "La tiara de Tiana",
  },
  {
    id: "cienaga",
    place: "Edificio Ciénaga",
    npc: "Rapunzel",
    pages: [
      "¡Hola! Estoy de visita por la universidad, paseando con mi caballo mientras espero a Flynn — fue al baño y no vuelve más.",
      "Sé que tu novio te está esperando en su lugar especial, pero no estoy segura de cuál es exactamente.",
      "En el Edificio Sierra Nevada hay alguien que seguro te puede ayudar más que yo.",
    ],
    item: "El sartén de Rapunzel",
  },
  {
    id: "sierra_nevada",
    place: "Edificio Sierra Nevada",
    npc: "Bibi (Brawl Stars)",
    pages: [
      "¡Hey! ¿Buscas a tu novio? No sé exactamente dónde está, ¡pero conozco a alguien que seguro sí!",
      "En el Bloque 3 vas a encontrar la última pista. ¡Ve para allá y dale con todo, como un home run!",
    ],
    item: "TODO: nombre de un objeto especial (algo de Bibi/Brawl Stars, ej. su bate o una estrella)",
  },
  {
    id: "bloque3",
    place: "Bloque 3",
    npc: "Ella, de pequeña",
    pages: ["TODO: todavía estás construyendo este diálogo."],
    item: "Las flores hechas en papel (tu primer regalo para ella)",
  },
];

// Lo que se muestra si llega detrás del Bloque 3 sin haber juntado
// todos los fragmentos todavía.
export const LOCKED = {
  text: "Todavía faltan recuerdos por encontrar antes de poder verla...",
};

// El reencuentro: lo que dices tú cuando la ves esperándote detrás del
// Bloque 3 (con todos los fragmentos ya juntados), antes del mensaje
// final. Puede ser una sola pantalla o varias (array).
export const REUNION = {
  pages: ["TODO: todavía estás construyendo este mensaje."],
};

// Mensaje final del juego (después del reencuentro).
export const ENDING = {
  title: "Hoy",
  text: "TODO: el mensaje final para el aniversario (puede ser una declaración, una propuesta, lo que quieras).",
};

// Título y subtítulo de la pantalla de inicio.
export const TITLE_SCREEN = {
  title: "Mi aventura para encontrarte",
  subtitle: "Un juego para nuestro aniversario",
};

// Lo que se muestra al arrancar el juego, antes de poder moverte: tu
// mensaje + un mini tutorial de controles.
export const INTRO = {
  pages: [
    "Hoy es nuestro aniversario. Quiero regalarte algo distinto: un recorrido por los lugares que nos formaron como pareja. Junta los recuerdos que dejé por el camino y descubre dónde encontrarme.",
    "Usa las flechas o WASD para moverte. Acércate a los que tengan un ¡ para hablar con ellos. Cuando juntes los 6 fragmentos, ve al Bloque 3.",
  ],
};
