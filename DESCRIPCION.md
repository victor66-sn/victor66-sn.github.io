# 🎸 GuitarraIA – Réplica Web

Aplicación web (SPA) para **explorar el mástil de la guitarra**: muestra dónde están las notas de tríadas, escalas, acordes, terceras y sextas con cualquier afinación.

Es una réplica fiel de la aplicación original en Python/Streamlit (`app.py` + `src/guitarraia/`), reescrita en **HTML + CSS + JavaScript puro**: sin backend, sin dependencias y sin paso de compilación.

---

## 1. Cómo ejecutarla

| Opción | Pasos |
|---|---|
| Directa | Abrir `index.html` en el navegador (doble clic). |
| Servidor local | `python3 -m http.server -d Replica-web 8000` → `http://localhost:8000` |
| Publicación | Subir la carpeta a cualquier hosting estático (GitHub Pages, Netlify, Vercel…). |

Requisitos: un navegador moderno (Chrome, Firefox, Edge o Safari). La única petición externa es la fuente *Inter* de Google Fonts; sin conexión se usa la fuente del sistema.

---

## 2. Estructura

```
Replica-web/
├── index.html           Estructura de la página (panel lateral + 4 secciones)
├── css/styles.css       Tema oscuro y diseño adaptable (responsive)
├── js/core.js           Lógica musical (port de core.py + afinaciones.py)
├── js/visualization.js  Dibujo del mástil en SVG (port de visualization.py)
├── js/app.js            Interfaz, estado y acciones (port de app.py)
└── DESCRIPCION.md       Este documento
```

Los scripts se cargan en este orden: `core.js` → `visualization.js` → `app.js`.

---

## 3. Funcionalidades

### 3.1 Configuración de afinación (panel lateral)
- **Preset**: 11 afinaciones predefinidas: Estándar (EADGBE), Drop D, Double Drop D, DADGAD, Open G, Open D, Open E, Open C, Open A, Half Step Down y Full Step Down. Además está la opción *Personalizada*.
- **Ajuste por cuerda**: un selector de nota para cada cuerda, de la 6ª (grave) a la 1ª (aguda).
- Las notas en bemol (por ejemplo Eb) se convierten a su equivalente en sostenido (D#).

### 3.2 Configuración de búsqueda
| Modo | Tipos disponibles |
|---|---|
| **Tríada** | Mayor, Menor, Disminuida, Aumentada, Sus2, Sus4 |
| **Escala** | Mayor, Menor, Mayor Pentatónica, Menor Pentatónica, Blues |
| **Acordes típicos** | Mayor 7, Menor 7, Dominante 7, Mayor 9, Menor 9, Dominante 9, Mayor 6, Menor 6 |
| **Terceras** | Mayor / Menor + par de cuerdas (1ra-2da … 5ta-6ta) |
| **Sextas** | Mayor / Menor + par de cuerdas (1ra-3ra … 4ta-6ta) |

- **Nota raíz**: las 12 notas cromáticas (C … B).
- **Rango de trastes**: control deslizante doble entre 0 y 19.
- **Información de afinación**: panel desplegable con las notas de cada cuerda, el número de cuerdas y el número de trastes.

Cada cambio recalcula y redibuja el mástil al instante.

### 3.3 Visualización del mástil
- Diapasón de madera, cejuela, trastes, cuerdas de distinto grosor y puntos en los trastes 3, 5, 7, 9, 12 (doble), 15, 17 y 19.
- La 1ª cuerda aparece arriba. Las etiquetas del eje Y indican el número de cuerda y su nota al aire (ej. `1ª E`).
- Las notas encontradas se dibujan como círculos con su nombre, **coloreados según la nota base**:

| C | D | E | F | G | A | B |
|---|---|---|---|---|---|---|
| Rojo | Naranja | Amarillo | Verde | Azul | Índigo | Violeta |

  (Las alteraciones toman el color de su letra: C# → rojo.)
- **Tooltip** al pasar el ratón: nota con octava (ej. `G3`), cuerda, traste y función de la nota (tónica, tercera…).
- Título dinámico: `<Modo> <Raíz> <Tipo> — <Preset>`.

### 3.4 Acciones
| Botón | Comportamiento |
|---|---|
| 💾 **Exportar Imagen** | Genera un PNG en alta resolución (2×) del mástil: `guitarraia_<raíz>_<tipo>.png`. |
| 💾 **Guardar Configuración** | Descarga `configuracion_guitarraia.json` y guarda una copia en `localStorage`. |
| 📂 **Cargar Configuración** | Restaura la copia del navegador o un archivo JSON elegido. Se aplica al instante. |

Formato del JSON (compatible con el original):
```json
{
  "afinacion_notas": ["E","A","D","G","B","E"],
  "afinacion_octavas": [2,2,3,3,3,4],
  "preset_selector": "Estándar (EADGBE)",
  "modo_vista": "Tríada",
  "nota_raiz": "C",
  "tipo_triada": "Mayor",
  "cuerdas": "1ra-2da",
  "traste_rango": [0, 5]
}
```

### 3.5 Diseño adaptable (responsive)
- **Escritorio**: panel lateral fijo y tres columnas.
- **Móvil o tableta (≤ 900 px)**: el panel lateral se oculta tras el botón ☰, los controles quedan en una columna y el mástil se desplaza horizontalmente.

---

## 4. Cómo funciona internamente

### 4.1 Modelo musical (`core.js`)
1. Cada cuerda se convierte a número MIDI: `midi = (octava + 1) × 12 + índice_nota` (E2 = 40).
2. `FretboardMatrix` genera una matriz de 6 × 21 posiciones, donde `matriz[cuerda][traste] = midi_cuerda + traste`.
3. Una búsqueda calcula las notas objetivo (`raíz + intervalos`) y recorre el rango de trastes. Una posición coincide cuando `midi % 12 === objetivo % 12`, y entonces se le asigna su función (rol).
4. Cada resultado devuelve `{cuerda, traste, nota_midi, nota_nombre, nota_nombre_completo, tipo, color}`.

Funciones principales:

| Función / clase | Descripción |
|---|---|
| `normalizarNota(n)` | Mayúscula inicial y conversión de bemoles a sostenidos. |
| `notaAMidi(n, oct)` | Nota → MIDI, o → clase de nota (0-11) si no se indica octava. |
| `midiANota`, `midiANotaConOctava` | MIDI → `"C#"` / `"C#4"`. |
| `crearAfinacionDesdeNombres(notas, octavas)` | 6 notas → 6 valores MIDI. |
| `FretboardMapper.buscarTriadaEnSeccion` | Busca las posiciones de una tríada. |
| `FretboardMapper.buscarEscalaEnSeccion` | Busca las posiciones de una escala. |
| `FretboardMapper.buscarAcordeEnSeccion` | Busca las posiciones de un acorde típico. |
| `FretboardMapper.buscarIntervalosEnSeccion` | Busca terceras o sextas en cuerdas concretas (disponible, igual que en el original). |
| `FretboardMapper.obtenerInfoAfinacion` | Devuelve los datos de la afinación actual. |

### 4.2 Visualización (`visualization.js`)
`visualizarMastil(matriz, notas, ini, fin, titulo, cuerdasSel, noteColorMap)` devuelve un `<svg>` de 1000 × 420 que reproduce la figura de Plotly original: mismos márgenes, rangos de ejes y colores, el eje Y invertido y las notas centradas entre trastes (`x = traste − 0.5`).

### 4.3 Interfaz (`app.js`)
- Un objeto `state` sustituye a `st.session_state` de Streamlit.
- Cada control actualiza `state` y llama a `render()`. Esta función crea el mapper, ejecuta la búsqueda del modo elegido, actualiza el panel de información y redibuja el SVG.
- **Terceras / Sextas**: igual que en `app.py`, se calcula la escala Mayor o Menor de la raíz y se filtran solo las dos cuerdas elegidas.

---

## 5. Equivalencia con la versión original

| Original (Python) | Réplica web |
|---|---|
| Streamlit (servidor) | HTML + JS en el navegador |
| Plotly | SVG nativo |
| `kaleido` para exportar PNG | Canvas del navegador |
| Archivo JSON en el servidor | Descarga / subida de JSON + `localStorage` |
| NumPy (matriz) | Arrays de JavaScript |

Paridad comprobada: con la misma afinación y búsqueda (Half Step Down, C Dominante 9, trastes 0-7), la versión JS y la de Python devuelven los mismos resultados (mismo hash MD5).

---

## 6. Posibles extensiones
- Reproducir las notas con la Web Audio API.
- Más cuerdas (7 u 8) o más trastes.
- Mostrar en Terceras/Sextas solo el intervalo (`buscarIntervalosEnSeccion`).
- Funcionamiento sin conexión e instalación como app (PWA con service worker).
