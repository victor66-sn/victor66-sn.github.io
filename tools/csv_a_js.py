#!/usr/bin/env python3
"""Convierte 'Diccionari_Full Acordes.csv' en js/acordes_full.js.
Uso: python3 tools/csv_a_js.py  (desde la raíz del proyecto)
Volver a ejecutar cada vez que se edite el CSV."""
import csv, json, pathlib

raiz = pathlib.Path(__file__).resolve().parent.parent
datos = {}
omitidas = []


def normalizar(notacion, pos):
    """Devuelve la notación válida (6 caracteres) o None."""
    s = notacion.strip().replace(' ', '')
    if len(s) == 7 and s[0] in 'xX':  # errata: X inicial sobrante
        s = s[1:]
    # Posición abierta con ceros iniciales perdidos por la hoja de cálculo (ej. 1220 -> 001220)
    if len(s) < 6 and pos == 1 and s.isdigit():
        s = s.zfill(6)
    return s if len(s) == 6 and all(c in 'xX' or c.isalnum() for c in s) else None

with open(raiz / 'Diccionari_Full Acordes.csv', encoding='utf-8') as f:
    lector = csv.reader(f)
    next(lector)  # cabecera
    for fila in lector:
        if not fila or not fila[0].strip():
            continue
        nota = fila[0].split('/')[0].strip()  # "C# / Db" -> "C#"
        tipo = fila[1].strip()
        posiciones = []
        for i in range(2, len(fila) - 2, 3):
            pos, notacion, desc = (c.strip() for c in fila[i:i + 3])
            if not notacion:
                continue
            n = normalizar(notacion, int(pos or 0))
            if n is None:
                omitidas.append(f'{nota} {tipo} pos {pos}: "{notacion}"')
                continue
            posiciones.append({'pos': int(pos or len(posiciones) + 1), 'notacion': n, 'descripcion': desc})
        datos.setdefault(nota, {})[tipo] = posiciones

salida = raiz / 'js' / 'acordes_full.js'
salida.write_text(
    "/* Generado automáticamente desde 'Diccionari_Full Acordes.csv' por tools/csv_a_js.py. No editar a mano. */\n"
    "'use strict';\n"
    f"const ACORDES_FULL = {json.dumps(datos, ensure_ascii=False, indent=1)};\n",
    encoding='utf-8')
print(f'OK: {sum(len(v) for v in datos.values())} acordes -> {salida}')
if omitidas:
    print(f'ATENCIÓN: {len(omitidas)} notaciones inválidas omitidas (corregir en el CSV):')
    print('\n'.join('  - ' + o for o in omitidas))
