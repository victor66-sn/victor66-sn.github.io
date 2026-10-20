/* Port de src/guitarraia/core.py (lógica musical) a JavaScript puro */
'use strict';

const NOTAS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTA_A_INDICE = Object.fromEntries(NOTAS.map((n, i) => [n, i]));
const ENARMONICOS = { Db: 'C#', Eb: 'D#', Gb: 'F#', Ab: 'G#', Bb: 'A#', Cb: 'B', Fb: 'E' };

const AFINACION_ESTANDAR = [40, 45, 50, 55, 59, 64];
const OCTAVAS_ESTANDAR = [2, 2, 3, 3, 3, 4];
const NUM_CUERDAS = 6;
const NUM_TRASTES = 20;

const O = [2, 2, 3, 3, 3, 4];
const PRESETS_AFINACION = {
  'Estándar (EADGBE)': { notas: ['E', 'A', 'D', 'G', 'B', 'E'], octavas: O },
  'Drop D': { notas: ['D', 'A', 'D', 'G', 'B', 'E'], octavas: O },
  'Double Drop D': { notas: ['D', 'A', 'D', 'G', 'B', 'D'], octavas: O },
  'DADGAD': { notas: ['D', 'A', 'D', 'G', 'A', 'D'], octavas: O },
  'Open G': { notas: ['D', 'G', 'D', 'G', 'B', 'D'], octavas: O },
  'Open D': { notas: ['D', 'A', 'D', 'F#', 'A', 'D'], octavas: O },
  'Open E': { notas: ['E', 'B', 'E', 'G#', 'B', 'E'], octavas: O },
  'Open C': { notas: ['C', 'G', 'C', 'G', 'C', 'E'], octavas: O },
  'Open A': { notas: ['E', 'A', 'C#', 'E', 'A', 'E'], octavas: O },
  'Half Step Down': { notas: ['Eb', 'Ab', 'Db', 'Gb', 'Bb', 'Eb'], octavas: O },
  'Full Step Down': { notas: ['D', 'G', 'C', 'F', 'A', 'D'], octavas: O },
};
// afinaciones.py: presets populares (mismo contenido)
const PRESETS_POPULARES = PRESETS_AFINACION;

const TRIADAS = {
  'Mayor': [0, 4, 7], 'Menor': [0, 3, 7], 'Disminuida': [0, 3, 6],
  'Aumentada': [0, 4, 8], 'Sus2': [0, 2, 7], 'Sus4': [0, 5, 7],
};
const ROLES_TRIADA = {
  'Mayor': ['fundamental', 'tercera', 'quinta'],
  'Menor': ['fundamental', 'tercera', 'quinta'],
  'Disminuida': ['fundamental', 'tercera', 'quinta'],
  'Aumentada': ['fundamental', 'tercera', 'quinta'],
  'Sus2': ['fundamental', 'segunda', 'quinta'],
  'Sus4': ['fundamental', 'cuarta', 'quinta'],
};
const ESCALAS = {
  'Mayor': [0, 2, 4, 5, 7, 9, 11],
  'Menor': [0, 2, 3, 5, 7, 8, 10],
  'Mayor Pentatónica': [0, 2, 4, 7, 9],
  'Menor Pentatónica': [0, 3, 5, 7, 10],
  'Blues': [0, 3, 5, 6, 7, 10],
};
const ROLES_ESCALA = {
  'Mayor': ['tónica', 'supertonica', 'mediante', 'subdominante', 'dominante', 'supertónica', 'séptima'],
  'Menor': ['tónica', 'supertonica', 'mediante', 'subdominante', 'dominante', 'submediante', 'subtonica'],
  'Mayor Pentatónica': ['tónica', 'supertonica', 'mediante', 'dominante', 'supertónica'],
  'Menor Pentatónica': ['tónica', 'subtonica', 'cuarta', 'dominante', 'subtonica'],
  'Blues': ['tónica', 'subtonica', 'cuarta', 'quinta disminuida', 'quinta', 'subtonica'],
};
const COLORES_TRIADA = { fundamental: '#FF4444', tercera: '#4444FF', quinta: '#44FF44', segunda: '#FF8800', cuarta: '#AA44FF' };
const COLORES_ESCALA = {
  'tónica': '#FF4444', 'supertonica': '#FF8800', 'mediante': '#FFFF00', 'subdominante': '#00FF00',
  'dominante': '#00FFFF', 'supertónica': '#0000FF', 'séptima': '#FF00FF', 'submediante': '#8800FF',
  'subtonica': '#FF0088', 'quinta disminuida': '#FFFF00',
};
const ACORDES_TIPICOS = {
  'Mayor 7': [0, 4, 7, 11], 'Menor 7': [0, 3, 7, 10], 'Dominante 7': [0, 4, 7, 10],
  'Mayor 9': [0, 4, 7, 11, 14], 'Menor 9': [0, 3, 7, 10, 14], 'Dominante 9': [0, 4, 7, 10, 14],
  'Mayor 6': [0, 4, 7, 9], 'Menor 6': [0, 3, 7, 9],
};
const ROLES_ACORDES = {
  'Mayor 7': ['fundamental', 'tercera', 'quinta', 'séptima'],
  'Menor 7': ['fundamental', 'tercera', 'quinta', 'séptima menor'],
  'Dominante 7': ['fundamental', 'tercera', 'quinta', 'séptima menor'],
  'Mayor 9': ['fundamental', 'tercera', 'quinta', 'séptima', 'nona'],
  'Menor 9': ['fundamental', 'tercera', 'quinta', 'séptima menor', 'nona'],
  'Dominante 9': ['fundamental', 'tercera', 'quinta', 'séptima menor', 'nona'],
  'Mayor 6': ['fundamental', 'tercera', 'quinta', 'sexta'],
  'Menor 6': ['fundamental', 'tercera', 'quinta', 'sexta menor'],
};
const COLORES_ACORDES = {
  ...COLORES_TRIADA, 'séptima': '#FF00FF', 'séptima menor': '#FF0088', 'nona': '#88FF00',
  'sexta': '#00FF00', 'sexta menor': '#008800',
};
const COLORES_GRADOS = ['#e53935', '#fb8c00', '#c9a800', '#43a047', '#00acc1', '#3949ab', '#8e24aa'];

function normalizarNota(nota) {
  nota = String(nota).trim();
  if (!nota) return nota;
  nota = nota[0].toUpperCase() + nota.slice(1);
  return ENARMONICOS[nota] || nota;
}

function notaAMidi(nota, octava = null) {
  nota = normalizarNota(nota);
  if (!(nota in NOTA_A_INDICE)) throw new Error(`Nota no válida: ${nota}`);
  const idx = NOTA_A_INDICE[nota];
  return octava !== null && octava !== undefined ? (octava + 1) * 12 + idx : idx;
}

const NOMBRES_INTERVALO = ['fundamental', 'novena menor', 'novena / segunda', 'tercera menor', 'tercera', 'cuarta',
  'quinta disminuida', 'quinta', 'quinta aumentada', 'sexta / séptima disminuida', 'séptima menor', 'séptima mayor'];

/**
 * Notación de Acordes Full: un carácter por cuerda, de la 1ª a la 6ª.
 * 0-9 = traste, a=10, b=11, c=12 … (base 36), X = cuerda no tocada.
 * Si viene con 7 caracteres empezando por X (errata del CSV, ej. "XFGHGFX"), se descarta la X inicial.
 */
function parsearNotacion(notacion) {
  let s = String(notacion).trim().replace(/\s+/g, '');
  if (s.length === 7 && /^x/i.test(s)) s = s.slice(1);
  if (s.length !== 6) throw new Error(`Notación inválida "${notacion}" (se esperan 6 caracteres)`);
  return [...s].map((ch) => {
    if (/x/i.test(ch)) return null;
    const v = parseInt(ch, 36);
    if (Number.isNaN(v)) throw new Error(`Carácter inválido "${ch}" en la notación "${notacion}"`);
    return v;
  });
}

const midiANota = (m) => NOTAS[((m % 12) + 12) % 12];
const midiANotaConOctava = (m) => `${midiANota(m)}${Math.floor(m / 12) - 1}`;

class FretboardMatrix {
  constructor(afinacion, numTrastes = NUM_TRASTES) {
    this.numCuerdas = afinacion.length;
    this.numTrastes = numTrastes;
    this.afinacion = afinacion;
    this.matriz = afinacion.map((base) => Array.from({ length: numTrastes + 1 }, (_, t) => base + t));
  }
  obtenerNota(c, t) { return this.matriz[c][t]; }
  obtenerNombreNota(c, t) { return midiANota(this.obtenerNota(c, t)); }
  obtenerNombreNotaConOctava(c, t) { return midiANotaConOctava(this.obtenerNota(c, t)); }
}

class FretboardMapper {
  constructor(afinacion = null, numTrastes = NUM_TRASTES) {
    this.afinacion = afinacion || AFINACION_ESTANDAR;
    this.numTrastes = numTrastes;
    this.matriz = new FretboardMatrix(this.afinacion, numTrastes);
  }

  _validarRango(ini, fin) {
    if (ini < 0 || fin > this.numTrastes) throw new Error(`Rango de trastes inválido: ${ini}-${fin} (máx: ${this.numTrastes})`);
    if (ini > fin) throw new Error('Traste inicial no puede ser mayor que traste final');
  }

  _buscar(raiz, intervalos, roles, colores, ini, fin, cuerdas = null, coloresPorIndice = null) {
    this._validarRango(ini, fin);
    const midiRaiz = notaAMidi(raiz);
    const objetivos = intervalos.map((i) => midiRaiz + i);
    const lista = cuerdas || [...Array(this.matriz.numCuerdas).keys()];
    const res = [];
    for (const c of lista) {
      for (let t = ini; t <= fin; t++) {
        const m = this.matriz.obtenerNota(c, t);
        objetivos.forEach((obj, i) => {
          if (m % 12 === obj % 12) {
            const tipo = roles[i];
            res.push({
              cuerda: c, traste: t, nota_midi: m,
              nota_nombre: this.matriz.obtenerNombreNota(c, t),
              nota_nombre_completo: this.matriz.obtenerNombreNotaConOctava(c, t),
              tipo,
              color: coloresPorIndice ? coloresPorIndice[i] : (colores[tipo] || '#888888'),
            });
          }
        });
      }
    }
    return res;
  }

  buscarTriadaEnSeccion(raiz, tipo, ini, fin) {
    if (!(tipo in TRIADAS)) throw new Error(`Tipo de tríada no válido: ${tipo}`);
    return this._buscar(raiz, TRIADAS[tipo], ROLES_TRIADA[tipo], COLORES_ESCALA, ini, fin);
  }
  buscarEscalaEnSeccion(raiz, tipo, ini, fin) {
    if (!(tipo in ESCALAS)) throw new Error(`Tipo de escala no válido: ${tipo}`);
    return this._buscar(raiz, ESCALAS[tipo], ROLES_ESCALA[tipo], COLORES_ESCALA, ini, fin);
  }
  buscarAcordeEnSeccion(raiz, tipo, ini, fin) {
    if (!(tipo in ACORDES_TIPICOS)) throw new Error(`Tipo de acorde no válido: ${tipo}`);
    return this._buscar(raiz, ACORDES_TIPICOS[tipo], ROLES_ACORDES[tipo], COLORES_ACORDES, ini, fin);
  }
  buscarIntervalosEnSeccion(raiz, tipoIntervalo, mayorMenor, ini, fin, cuerdas) {
    let intervalos, roles, colores;
    if (tipoIntervalo === 'terceras') {
      intervalos = mayorMenor === 'Mayor' ? [0, 4] : [0, 3];
      roles = ['fundamental', 'tercera'];
      colores = [COLORES_TRIADA.fundamental, COLORES_TRIADA.tercera];
    } else if (tipoIntervalo === 'sextas') {
      intervalos = mayorMenor === 'Mayor' ? [0, 9] : [0, 8];
      roles = ['fundamental', 'sexta'];
      colores = [COLORES_ACORDES.sexta, COLORES_ACORDES['sexta menor']];
    } else throw new Error(`Tipo de intervalo no válido: ${tipoIntervalo}`);
    for (const c of cuerdas) {
      if (c < 0 || c >= this.matriz.numCuerdas) throw new Error(`Cuerda fuera de rango: ${c}`);
    }
    return this._buscar(raiz, intervalos, roles, null, ini, fin, cuerdas, colores);
  }

  /**
   * Acordes Full: dibuja una digitación concreta del diccionario (ACORDES_FULL).
   * Devuelve { notas, posicion, total, descripcion, notacion, trastes }.
   */
  buscarAcordeFull(raiz, tipo, indice) {
    const lista = (typeof ACORDES_FULL !== 'undefined' && ACORDES_FULL[raiz] && ACORDES_FULL[raiz][tipo]) || [];
    if (!lista.length) throw new Error(`No hay digitaciones para ${raiz} ${tipo}`);
    const i = Math.max(0, Math.min(indice, lista.length - 1));
    const { notacion, descripcion, pos } = lista[i];
    let trastes = parsearNotacion(notacion);
    const usados = trastes.filter((t) => t !== null);
    if (Math.max(...usados) > this.numTrastes && Math.min(...usados) >= 12) {
      trastes = trastes.map((t) => (t === null ? null : t - 12)); // misma digitación una octava más grave
    }
    const midiRaiz = notaAMidi(raiz);
    const notas = [];
    trastes.forEach((t, k) => {
      if (t === null) return;
      const c = this.matriz.numCuerdas - 1 - k; // carácter k = cuerda (k+1)ª; índice 0 = 6ª cuerda
      if (t > this.numTrastes) throw new Error(`Traste ${t} fuera del mástil (máx: ${this.numTrastes})`);
      const m = this.matriz.obtenerNota(c, t);
      const intervalo = (((m - midiRaiz) % 12) + 12) % 12;
      notas.push({
        cuerda: c, traste: t, nota_midi: m,
        nota_nombre: this.matriz.obtenerNombreNota(c, t),
        nota_nombre_completo: this.matriz.obtenerNombreNotaConOctava(c, t),
        tipo: NOMBRES_INTERVALO[intervalo], color: '#888888',
      });
    });
    return { notas, posicion: pos, indice: i, total: lista.length, descripcion, notacion, trastes };
  }

  /**
   * Tercera-Full: para la escala (TERCERAS_FULL[tipoEscala][escala]) y un par de cuerdas,
   * devuelve cada grado como terceras (nota raíz en la cuerda grave + tercera en la aguda)
   * en todas sus posiciones del rango de trastes. Ambas notas deben caber en el rango.
   */
  buscarTerceraFull(escala, tipoEscala, cuerdaAguda, cuerdaGrave, ini, fin) {
    return this._buscarIntervaloFull(typeof TERCERAS_FULL !== 'undefined' ? TERCERAS_FULL : null, 'tercera', 'terceras',
      escala, tipoEscala, cuerdaAguda, cuerdaGrave, ini, fin);
  }

  /** Sexta-Full: igual que Tercera-Full pero con la sexta (SEXTAS_FULL) en la cuerda aguda. */
  buscarSextaFull(escala, tipoEscala, cuerdaAguda, cuerdaGrave, ini, fin) {
    return this._buscarIntervaloFull(typeof SEXTAS_FULL !== 'undefined' ? SEXTAS_FULL : null, 'sexta', 'sextas',
      escala, tipoEscala, cuerdaAguda, cuerdaGrave, ini, fin);
  }

  _buscarIntervaloFull(base, clave, plural, escala, tipoEscala, cuerdaAguda, cuerdaGrave, ini, fin) {
    this._validarRango(ini, fin);
    const grados = (base && base[tipoEscala] && base[tipoEscala][escala]) || [];
    if (!grados.length) throw new Error(`No hay datos de ${plural} para la escala ${escala} ${tipoEscala}`);
    const a = this.afinacion[cuerdaGrave], b = this.afinacion[cuerdaAguda];
    const res = [];
    grados.forEach((g, gi) => {
      const pcRaiz = notaAMidi(g.raiz), pcSegunda = notaAMidi(g[clave]);
      const intervalo = (((pcSegunda - pcRaiz) % 12) + 12) % 12;
      const tipo = `Grado ${g.grado}`;
      const color = COLORES_GRADOS[gi % COLORES_GRADOS.length];
      for (let f = ini; f <= fin; f++) {
        if ((a + f) % 12 !== pcRaiz) continue;
        const f2 = a + f + intervalo - b;
        if (f2 < ini || f2 > fin) continue;
        [[cuerdaGrave, f, g.raiz], [cuerdaAguda, f2, g[clave]]].forEach(([c, t, nombre]) => res.push({
          cuerda: c, traste: t, nota_midi: this.matriz.obtenerNota(c, t),
          nota_nombre: nombre, // cifrado americano tal como viene del CSV (ej. Bb)
          nota_nombre_completo: `${nombre}${Math.floor(this.matriz.obtenerNota(c, t) / 12) - 1}`,
          tipo, color,
        }));
      }
    });
    return res;
  }

  obtenerNotasAfinacion() { return this.afinacion.map(midiANota); }
  obtenerInfoAfinacion() {
    return {
      afinacion_midi: [...this.afinacion],
      afinacion_notas: this.obtenerNotasAfinacion(),
      num_cuerdas: this.matriz.numCuerdas,
      num_trastes: this.numTrastes,
    };
  }
}

function crearAfinacionDesdeNombres(notas, octavas = null) {
  if (notas.length !== 6) throw new Error('Se requieren exactamente 6 notas para la afinación');
  octavas = octavas || [...OCTAVAS_ESTANDAR];
  if (octavas.length !== 6) throw new Error('Se requieren exactamente 6 octavas');
  return notas.map((n, i) => notaAMidi(n, octavas[i]));
}
