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
    npc: "Koya",
    pages: [
      "Zzz... 어? 아, 안녕하세요! 드디어 오셨네요. 저는 코야예요. 너무 졸려서 무슨 말을 하려고 했는지 잊어버렸어요...",
      "Sacas el celular y abres el traductor para entender a Koya.",
      "Ah, ahora sí me puedes entender. Perdón por no darte tiempo a abrir el traductor antes; a veces se me olvida que no todo el mundo me entiende directamente. Bibi me dijo que ibas a venir, así que intenté mantenerme despierto... pero no me fue muy bien.",
      "Eres tú, ¿verdad? La novia de la persona que ha estado dejando todas estas pistas por la universidad. Tu novio me pidió que te esperara en la Cafetería y que te entregara algo cuando llegaras.",
      "Antes de dormirme, estuvimos hablando un rato sobre ti. Me contó que siempre quiere escucharte, sin importar de qué estés hablando.",
      "Me dijo que le hace muy feliz conocer cada cosa que te gusta: tus personajes favoritos, tus canciones, tus juegos, tus historias y todas esas pequeñas cosas que te emocionan.",
      "También me contó que le encanta escucharte hablar de todo lo que te gusta. Aunque sea un tema que no conozca, le gusta verte emocionada y descubrir el mundo desde tu forma de verlo.",
      "Dijo que nunca quiere que sientas que estás hablando sola. Quiere que sepas que siempre estará ahí para escucharte, acompañarte y darte un espacio donde puedas contarle cualquier cosa.",
      "Creo que eso es algo muy bonito. A veces amar a alguien también significa prestar atención a sus palabras, recordar lo que le importa y quedarse cerca incluso en las conversaciones más sencillas.",
      "Me pidió que te entregara esto. Es un Army Bomb, para que tengas contigo un pequeño recuerdo de todo lo que compartes con él y de todas las historias que todavía les quedan por vivir.",
      "Tu novio me pidió que te dijera algo más: te estará esperando en la parte de atrás del Bloque 3. Cuando estés lista, ve hasta allí. Creo que esta vez sí vale la pena mantenerte despierta... aunque yo probablemente vuelva a dormirme antes.",
    ],
    item: "Un Army Bomb",
  },
  {
    id: "hangares",
    place: "Los Hangares",
    npc: "Tikki",
    pages: [
      "¡Hola! Soy Tikki, el kwami de la creación y compañera de Marinette. Me alegra mucho conocerte; llevaba un rato esperando por ti entre estos hangares.",
      "Marinette pasó por aquí hace un momento. Se distrajo dibujando los edificios de la universidad y, cuando levantó la mirada, ya no sabía por dónde regresar. Creo que a veces su imaginación la lleva demasiado lejos.",
      "Yo estaba intentando encontrarla cuando tu novio me descubrió. Al principio pensó que era una criatura perdida, pero enseguida se dio cuenta de que algo me preocupaba y decidió ayudarme.",
      "No se burló ni siguió de largo. Se quedó conmigo, escuchó lo que me pasaba y me acompañó hasta encontrar el camino. Mientras caminábamos, me habló mucho de ti.",
      "Me dijo que, sin importar lo que ocurra, siempre estará para su novia. En los días fáciles, en los días difíciles y en todos esos momentos en los que simplemente necesitas saber que no estás sola.",
      "Esa promesa me recordó lo que significa ser un verdadero héroe: no se trata solo de tener poderes, sino de cuidar a las personas que amas. Por eso quiero entregarte estos aretes, como un pequeño símbolo de confianza y protección.",
      "No son el Miraculous original de Marinette, pero espero que te acompañen en el camino. Tu próxima pista está en Mar Caribe; allí encontrarás a una princesa que también está buscando a alguien muy especial. ¡Ve, y recuerda que el amor siempre encuentra la manera de guiarnos!",
    ],
    item: "Los aretes de Marinette",
  },
  {
    id: "mar_caribe",
    place: "Mar Caribe",
    npc: "Tiana",
    pages: [
      "¡Hola! Soy Tiana. Llegaste justo a tiempo; estaba a punto de salir a buscar a alguien muy importante para mí.",
      "Mi príncipe Naveen fue víctima de un hechizo y terminó convertido en sapo. Desde entonces no he dejado de buscarlo por los alrededores del lago. Si ves algo saltando entre los juncos, por favor avísame.",
      "Aunque debo admitir que esta búsqueda me ha enseñado algo: no siempre basta con desear que las cosas salgan bien. Hay que trabajar por ellas, tener paciencia y seguir adelante incluso cuando el camino se complica.",
      "Durante mucho tiempo pensé que tendría que hacerlo todo sola. Pero Naveen me recordó que algunos sueños se construyen mejor cuando dos personas deciden caminar juntas.",
      "Tu novio me contó que eres una persona muy importante para él. Me dijo que quiere estar siempre para ti, en los momentos felices y también cuando las cosas se pongan difíciles.",
      "Se notaba en la forma en que hablaba de ti: no estaba preparando esto solo para sorprenderte, sino para recordarte cuánto te ama y cuánto significa tu presencia en su vida.",
      "Después me contó que está preparando algo especial para ti. No me dijo exactamente dónde, pero sí me dejó claro que ha pensado en cada detalle con mucho cariño.",
      "Quiero entregarte esta tiara. No es solo un adorno: representa los sueños que perseguimos, las dificultades que superamos y las personas que nos ayudan a no rendirnos.",
      "Si quieres encontrar la siguiente pista, ve al Edificio Ciénaga. Allí encontrarás a Rapunzel, otra princesa que sabe muy bien lo que significa esperar, tener esperanza y buscar a alguien especial.",
      "Ahora debo volver al lago antes de que Naveen se meta en problemas otra vez. ¡Buena suerte! Y recuerda: los sueños más bonitos no se cumplen solos, se construyen con amor y dedicación.",
    ],
    item: "La tiara de Tiana",
  },
  {
    id: "cienaga",
    place: "Edificio Ciénaga",
    npc: "Rapunzel",
    pages: [
      "¡Hola! Soy Rapunzel. Estoy de visita por la universidad buscando a Flynn y a mi caballo, Máximus. Salí a buscarlos por separado y ahora no encuentro a ninguno de los dos... creo que todos terminamos perdidos.",
      "Tiana me contó que estás siguiendo varias pistas para encontrar a tu novio. Me parece muy emocionante, aunque también un poquito misterioso. ¿Siempre prepara sorpresas tan elaboradas?",
      "Yo sé lo que significa esperar a alguien importante. Durante mucho tiempo estuve encerrada en una torre, soñando con conocer el mundo y esperando el momento en que pudiera salir a descubrirlo por mí misma.",
      "Cuando por fin pude hacerlo, descubrí que perseguir un sueño puede dar miedo. Hay caminos desconocidos, lugares nuevos y momentos en los que una no sabe exactamente qué va a encontrar.",
      "Pero también aprendí que las mejores aventuras son las que compartimos con alguien que nos hace sentir acompañados. A veces no necesitas tener todo el camino planeado; basta con confiar en que vale la pena seguir avanzando.",
      "Tu novio me habló de ti con mucho cariño. Se nota que no solo quiere que encuentres el final, sino que disfrutes cada paso y recuerdes todos los motivos por los que eres tan importante para él.",
      "Quiero darte mi sartén. Me ha acompañado en más de una aventura y puede parecer un objeto extraño, pero nunca sabes cuándo vas a necesitar algo resistente para protegerte o abrirte paso.",
      "La siguiente pista está en el Edificio Sierra Nevada. Allí encontrarás a Bibi, que quizá no tenga una sartén, pero sí conoce a alguien que puede acercarte mucho más a tu novio.",
      "Ahora debo seguir buscando a Flynn y a Máximus antes de que se metan en otra situación extraña. ¡Buena suerte! Y recuerda: incluso los caminos más largos pueden llevarte a un lugar lleno de luz.",
    ],
    item: "El sartén de Rapunzel",
  },
  {
    id: "sierra_nevada",
    place: "Edificio Sierra Nevada",
    npc: "Bibi",
    pages: [
      "¡Hey! Tú debes ser la novia que viene siguiendo todas las pistas. Soy Bibi, y por lo que veo has llegado bastante lejos.",
      "Rapunzel me contó que pasaste por el Edificio Ciénaga. También me dijo que has estado reuniendo objetos y recuerdos, así que supongo que tu novio realmente se tomó en serio esta sorpresa.",
      "No voy a fingir que sé exactamente dónde está. Él fue muy cuidadoso y no quiso contarme todo, pero sí me pidió que esperara aquí para asegurarme de que llegaras hasta la última pista.",
      "Mientras hablábamos, me di cuenta de algo muy bonito: él es feliz con cada pequeña cosa que vive contigo. No necesita que ocurra algo extraordinario para sentirse bien.",
      "Le gusta estar contigo, abrazarte, hablar de cualquier cosa e incluso pasar el rato jugando Brawl Stars. Para él, esos momentos sencillos también son aventuras, porque los está compartiendo contigo.",
      "Me dijo que contigo puede disfrutar tanto de los grandes planes como de los momentos más tranquilos. Y creo que esa es una de las mejores formas de saber que alguien realmente te hace feliz.",
      "Por eso quiero darte este Star Drop. Puede traer algo inesperado, pero esta vez quiero que represente todas esas pequeñas sorpresas y alegrías que aparecen cuando compartes la vida con alguien especial.",
      "Tu siguiente pista está en la Cafetería. Allí encontrarás a Koya, que seguramente sabe algo más sobre el lugar donde tu novio te está esperando.",
      "Ve para allá y dale con todo, como un home run. El final de tu aventura todavía está un poco más adelante, pero cada paso te acerca a él.",
    ],
    item: "Un Star Drop",
  },
  // Bloque 3: no es un fragmento (no aparece en RECOMPENSA_SPRITES ni suma al contador), es el
  // punto del reencuentro. Su "!" es lo que dispara el diálogo; el texto real que muestra es
  // REUNION.pages (ver el caso especial para "bloque3" en checkTrigger, dentro de main.js).
  {
    id: "bloque3",
    place: "Bloque 3",
    npc: "Tu novio",
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
  pages: [
    "Hola, mi amor…",
    "Ya son 3 años, 3 años juntos, 3 años viviendo tantas cosas…",
    "Tantas palabras, y no hay suficientes para explicar todo lo que siento cada vez que pienso en ti.",
    "Felicidad, amor, enamoramiento, orgullo, tranquilidad, paz… Esos sentimientos y más son los que siento al estar contigo, al sentirte, al pensarte, al hablarte. Todo eso es lo que produce tu gran presencia, tu gran amor.",
    "Me hace tan feliz todo lo que hemos recorrido en estos 3 años. Hemos crecido juntos en estos 3 años.",
    "Volteo al pasado y me hace feliz ser mejor hombre de lo que era antes. Me hace feliz que ese hombre sea lo que es gracias a ti.",
    "Me has vuelto una persona tan distinta, mejor, más enfocada, más responsable, con un mejor futuro, con una idea clara de vida, y eso me hace el hombre más afortunado del mundo.",
    "Y así, cada día que pasa, me enamoro más y más de ti, te amo más y más, me encantas más y más. Simplemente, eres lo mejor que le ha pasado a mi vida.",
    "Y recordando nuestro primer año juntos, lo nerviosos que estábamos, lo ajetreado que fue, que todo se complicó, pero que al final todo salió tan bien… De verdad que nuestra relación está hecha de hermosos recuerdos y de muchos más que aún faltan por construir.",
    "Y ahora, hablando de ti, de nuevo gracias, amor. Gracias por escucharme, gracias por estar para mí en los momentos buenos y en los no tan buenos.",
    "Contigo sé que puedo ser yo, contigo sé que puedo comerme el mundo entero, porque siempre que estés a mi lado, mi futuro brilla más y más.",
    "Y tú eres tan perfecta, tan maravillosa. Eres una mujer increíble, inteligente, amable, capaz de todo, aunque no lo creas.",
    "Y lo vuelvo a decir: estoy muy orgulloso de ti, de la mujer que eres, de la mujer que ha evolucionado con los años.",
    "La mujer que ha madurado muchísimo, la mujer de la que aprendo siempre cosas buenas y nuevas, la mujer que me enseñó a ser responsable, a ser competitivo, a ser perfeccionista, la que me enseñó que debo darlo todo.",
    "Eso eres tú para mí, y nunca lo olvides.",
    "Y pese a que este aniversario no fue lo que queríamos, no te preocupes. Veo nuestro futuro tan claro y tan próximo que sé que todo mejorará más y más.",
    "Podremos celebrar este y muchos más aniversarios juntos, mejores, como queremos.",
    "Mientras estemos juntos, el mundo nos queda pequeño, porque juntos somos grandiosos.",
    "Te amo, te amo como el mar ama al cielo, te amo con la intensidad de mil soles.",
    "Te amo tanto, tanto como la cantidad de estrellas que hay en el universo, te amo como la luna ama a la Tierra.",
    "Te amo con tanta pasión que mi vida pertenece a ti, te amo porque eres tú, te amo porque estás aquí.",
    "Te amo porque te amo y te amo porque el amor lo es todo para mí.",
    "Te cielo",
  ],
};

// Mensaje final del juego (después del reencuentro).
export const ENDING = {
  title: "Hoy",
  text: "¡Feliz tercer aniversario! Gracias por estos tres años a tu lado y por todos los que todavía nos quedan por vivir juntos.",
};

// Título y subtítulo de la pantalla de inicio.
export const TITLE_SCREEN = {
  title: "Un Año Más Contigo",
  subtitle: "Un juego para nuestro aniversario",
};

// Lo que se muestra al arrancar el juego, antes de poder moverte: tu
// mensaje + un mini tutorial de controles.
export const INTRO = {
  pages: [
    "Hoy es nuestro aniversario. Quiero regalarte algo distinto: un pequeño juego hecho especialmente para ti.",
    "He preparado un recorrido por la universidad, lleno de cosas lindas y palabras bonitas que quería regalarte. Cada personaje tiene algo especial que decirte.",
    "Tu misión es hablar con ellos y reunir los 5 objetos que preparé para ti. Cada uno guarda un pequeño detalle de todo lo que siento por ti.",
    "Usa las flechas o WASD para moverte. Acércate a los personajes que tengan un signo de admiración (!) para hablar con ellos. Para comenzar, dirígete a Los Hangares.",
  ],
};
