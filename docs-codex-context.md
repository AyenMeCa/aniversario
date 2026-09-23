# Contexto y metodología para Codex — "aniversario-juego"

Este documento resume el proyecto, cómo se trabajó hasta ahora (con Claude) y las reglas que hay
que seguir para seguir editando `src/main.js` y compañía sin romper nada. Es un regalo de
aniversario: un juego 2D top-down hecho con **Kaplay.js**, donde la protagonista recorre un
campus universitario recreado en pixel art, se encuentra con NPCs (personajes conocidos/íconos
elegidos por el dueño del proyecto) que le dan pistas y objetos, y al final se reencuentra con su
pareja.

## Stack y arquitectura

- **Motor:** Kaplay.js 3001.0.19, cargado desde `<script src="https://unpkg.com/kaplay@...">` en
  `index.html`. El código del juego es un solo módulo ES (`type="module"`) en `src/main.js`.
- **Mapa:** definido como un plano de texto en `src/blueprint.js` (una grilla de caracteres,
  escalada ×`CHAR_SCALE`), convertido a una grilla de tiles (`TILE = 16` px) en `buildLevel()`
  dentro de `src/main.js`.
- **Terreno horneado:** el pasto/agua/caminos/edificios se dibujan UNA sola vez en un `<canvas>`
  gigante (`bakeTerrain(...)`) que se carga como un único sprite `"terrain"`. No se crea un objeto
  Kaplay por tile (con ~16.000 tiles eso generaba lag) — solo los elementos animados (agua,
  árboles, NPCs, marcadores) son objetos reales de la escena.
- **Historia:** `src/timeline.js` exporta `TIMELINE` (un array de paradas: `id`, `place`, `npc`,
  `pages`, `item`), más `LOCKED`, `REUNION`, `ENDING`, `TITLE_SCREEN`, `INTRO`.
- **Personaje principal:** sprite propio en las 4 direcciones (frente/espalda/derecha/izquierda),
  generado con IA sobre una plantilla de animación para que el movimiento (respiración, pasos)
  sea consistente. Ver `PLAYER_SHEETS` en `main.js`.
- **NPCs:** cada uno tiene un sprite de "idle" en el mapa y, desde hace poco, un **retrato propio**
  para el cuadro de diálogo (`RETRATOS` en `main.js`), generado con IA con 4 cuadros (neutral,
  habla A, habla B, parpadeo).
- **Progreso lineal:** los NPCs se desbloquean en orden (`ORDEN_NPCS` dentro de la escena "game"):
  Tikki → Tiana → Rapunzel → Bibi → Koya → Bloque 3. Solo el marcador del NPC activo (y los ya
  visitados) se dibuja en el mapa y en el minimapa; el resto está oculto hasta que le toca su
  turno. Ver `desbloqueado()`, `npcMarkerObjs`, `actualizarMarcadoresNPC()`, `miniDots`.

## Convenciones de código

- **Todo el código y los comentarios están en español**, con un tono explicativo (los comentarios
  explican el *por qué*, no solo el *qué* — mantené ese estilo).
- **Constantes en MAYÚSCULAS** para configuración de posiciones, tamaños y paletas (por ejemplo
  `TIKKI_POS`, `BOSQUE_TAM`, `DLG`).
- Los cambios de mapa/decoración suelen ir acompañados de un comentario que explica la regla de
  negocio (ej. "el árbol bloquea solo el tronco para poder caminar bajo la copa").

## Pipeline de assets con IA (Codex/Gemini) — muy importante

Todo el arte nuevo (edificios, personajes, retratos) se generó pidiéndole a una IA de imágenes
(Codex o Gemini) un sprite sheet, siguiendo siempre estas reglas en el prompt:

1. **Fondo magenta plano `#FF00FF`** (nunca transparencia real, porque las IAs de imagen no la
   generan de forma confiable) — se convierte a transparencia por código después.
2. **Vista 3/4 o de frente**, coherente con el resto del pack (Pixel Crawler Free Pack, en
   `Pixel Crawler - Free Pack/`, más assets sueltos en `Free/`).
3. **Grilla de 16 px** (o múltiplos: 32, 48, 64) — el resultado tiene que poder dividirse en
   celdas cuadradas exactas. Frecuentemente la IA entrega una imagen con una escala entera "x8"
   (cada "píxel" de arte es un bloque de 8×8 reales) en vez del tamaño final pedido; en ese caso
   hay que **reconstruir la rejilla** (medir el tamaño real de bloque, muestrear por mediana/moda
   de cada bloque, no solo achicar con un resize normal) antes de usarlo. Cuando el usuario ya
   pide explícitamente los archivos "-x8.png", ese trabajo de reconstrucción es directo (dividir
   por 8 y tomar el color de moda por bloque).
4. **Colisión por silueta:** para edificios, se genera una máscara de opacidad (≥35% opaco) para
   que el jugador choque con la forma real, no con un rectángulo.
5. Se manda siempre una **guía de cuadrícula** (`Free/Guia_Cuadricula_*.png`, fondo magenta con
   líneas y números) junto con las referencias de estilo, para que la IA sepa el tamaño exacto
   esperado.
6. Los prompts ya escritos para cada asset quedan documentados en archivos
   `docs-codex-<algo>-prompt.md` en la raíz del proyecto — podés reusar ese formato para pedir
   arte nuevo.

## Regla de caché — la que más tiempo hizo perder

El script se carga como `<script src="./src/main.js?v=N">` en `index.html`. El navegador cachea
por esa URL exacta. **Cada vez que se edita `src/main.js`, hay que subir en 1 tanto el número de
`?v=N` en `index.html` como la constante `ASSET_VERSION` dentro de `main.js`** (esta última se usa
para el cache-busting de imágenes cargadas dinámicamente). Si no se hace, quien pruebe el juego va
a ver una versión vieja sin ningún aviso de error — parece que "no pasó nada" o que "no responde".

## Cómo se prueban los cambios

**Regla nueva y explícita del dueño del proyecto: Codex no debe probar los cambios en el
navegador/preview por su cuenta.** Se hacen los cambios, se deja el código listo y con la versión
cacheada subida correctamente, y es el dueño del proyecto quien lo prueba a mano en su propio
navegador. No hace falta (ni se pide) abrir un panel de previsualización, simular teclas, ni sacar
capturas de pantalla para verificar — eso consumió mucho tiempo y no es el flujo que se quiere.
Si hace falta revisar algo visualmente antes de darlo por terminado, generar una imagen estática
(un recorte del mapa, un mockup) es aceptable; controlar el juego en vivo no.

Sí conviene, antes de entregar, un chequeo estático liviano: que el archivo no tenga errores de
sintaxis (por ejemplo `node --check archivo.js` si se tiene Node disponible) y una relectura del
diff para confirmar que no quedaron variables sin usar, hooks de depuración (`window.__algo`) ni
`console.log` de prueba olvidados.

## Estado actual (resumen de lo ya hecho)

- Mapa completo: campus con edificios (Cafetería, Los Hangares, Mar Caribe, Ciénaga, Sierra
  Nevada, Biblioteca, Bloque 3, Bloque 8), lagos, canal, puentes, caminos, plazas, terraza de
  mesas, campo de flores, bosques y bosquecillos, parqueadero, máquinas expendedoras.
- Animaciones de agua (orillas + burbujas/salpicaduras sueltas en el agua abierta).
- Cuadro de diálogo propio (marco pixel-art crema/café, fuente Pixelify Sans, escritura letra por
  letra, retrato animado a la izquierda cuando el NPC tiene uno).
- Personaje principal con sprite propio en las 4 direcciones.
- Retratos propios ya integrados para: Tikki, Tiana, Bibi, Rapunzel, Koya (el NPC de la cafetería
  cambió de "Namjoon (BTS)" a **Koya**, el personaje de BT21 — ya tiene retrato y sprite de mapa
  propio, y su diálogo en `timeline.js` ya se reescribió con ese tono).
- Progreso lineal de NPCs (Tikki → Tiana → Rapunzel → Bibi → Koya → Bloque 3): implementado en la
  escena "game" de `main.js`, con los marcadores ocultos hasta que corresponde.

## Pendiente / TODOs conocidos

Buscá `"TODO"` dentro de `src/timeline.js` — quedan sin terminar:

- El diálogo de **Bloque 3** ("Ella, de pequeña"): `pages: ["TODO: todavía estás construyendo
  este diálogo."]`.
- El objeto que entrega **Bibi**: `item: "TODO: nombre de un objeto especial..."`.
- El mensaje de **REUNION** (lo que dice el jugador al encontrarse con ella).
- El **ENDING** (mensaje final del aniversario).

Fuera de `timeline.js`, no hay tareas abiertas documentadas más allá de lo que el dueño del
proyecto pida en la conversación — preguntale a él qué sigue antes de asumir alcance nuevo.
