#!/usr/bin/env python3
"""Convierte los CSV de terceras y sextas en js/terceras_full.js y js/sextas_full.js.
Uso: python3 tools/csv_terceras_a_js.py  (desde la raíz del proyecto)
Guarda, por escala, los 7 grados con su nota raíz y su tercera/sexta (cifrado americano).
Las posiciones en el mástil se calculan en JS según la afinación y el par de cuerdas.
Cada escala se valida contra la teoría musical y se corrigen los nombres erróneos del CSV."""
import csv, json, pathlib, re

raiz = pathlib.Path(__file__).resolve().parent.parent
LATINO = {'Do': 'C', 'Re': 'D', 'Mi': 'E', 'Fa': 'F', 'Sol': 'G', 'La': 'A', 'Si': 'B'}
CROMATICA = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
BEMOL = {'C#': 'Db', 'D#': 'Eb', 'F#': 'Gb', 'G#': 'Ab', 'A#': 'Bb'}
A_SOSTENIDO = {'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#', 'Cb': 'B'}
INTERVALOS = {'Mayor': [0, 2, 4, 5, 7, 9, 11], 'Menor': [0, 2, 3, 5, 7, 8, 10]}

# clave de la 2ª nota, columna del CSV, salto en grados de escala, constante JS, archivo de salida, CSV por tipo
TIPOS = [
    dict(clave='tercera', columna='Nota_3ra', salto=2, const='TERCERAS_FULL', salida='terceras_full.js',
         csv={'Mayor': 'Escala_Mayores_Terceras.csv', 'Menor': 'Escalas_Menores_Terceras.csv'}),
    dict(clave='sexta', columna='Nota_6ta', salto=5, const='SEXTAS_FULL', salida='sextas_full.js',
         csv={'Mayor': 'Escalas_Mayores_Sextas.csv', 'Menor': 'Escalas_Menores_Sextas.csv'}),
]


def americano(nombre):
    """Do# -> C#, Sib -> Bb; los nombres ya en cifrado americano no cambian."""
    m = re.fullmatch(r'(Do|Re|Mi|Fa|Sol|La|Si)([#b]?)', nombre.strip())
    return LATINO[m.group(1)] + m.group(2) if m else nombre.strip()


def pc(nombre):
    return CROMATICA.index(A_SOSTENIDO.get(nombre, nombre))


def validar(tipo, escala, grados, clave, salto):
    """Comprueba raíz y 2ª nota de cada grado contra la escala teórica y corrige los errores."""
    esc = [(pc(escala) + i) % 12 for i in INTERVALOS[tipo]]
    usa_bemoles = any('b' in n for g in grados for n in (g['raiz'], g[clave]) if len(n) > 1)
    for i, g in enumerate(grados):
        for k, esperado in (('raiz', esc[i]), (clave, esc[(i + salto) % 7])):
            if pc(g[k]) != esperado:
                nuevo = CROMATICA[esperado]
                if usa_bemoles and nuevo in BEMOL:
                    nuevo = BEMOL[nuevo]
                print(f'CORREGIDO: {clave} escala {escala} {tipo}, grado {g["grado"]}, {k}: {g[k]} -> {nuevo}')
                g[k] = nuevo


for cfg in TIPOS:
    datos = {}
    for tipo, archivo in cfg['csv'].items():
        escalas = {}
        with open(raiz / archivo, encoding='utf-8') as f:
            for fila in csv.DictReader(f):
                if 'Octava' in fila['Grado']:
                    continue  # el grado I/i repetido una octava arriba
                escala = fila['Escala'].removesuffix('m')
                grado = fila['Grado'].replace('Grado', '').strip()
                g = {'grado': grado, 'calidad': fila['Tipo'], 'raiz': americano(fila['Nota_Raiz']),
                     cfg['clave']: americano(fila[cfg['columna']])}
                lista = escalas.setdefault(escala, [])
                previo = next((x for x in lista if x['grado'] == grado), None)
                if previo is None:
                    lista.append(g)
                elif previo != g:
                    print(f'ATENCIÓN: {archivo} {escala} grado {grado} difiere entre pares de cuerdas: {previo} vs {g}')
        for escala, grados in escalas.items():
            validar(tipo, escala, grados, cfg['clave'], cfg['salto'])
        datos[tipo] = escalas

    salida = raiz / 'js' / cfg['salida']
    salida.write_text(
        f"/* Generado automáticamente por tools/csv_terceras_a_js.py desde los CSV de {cfg['clave']}s. No editar a mano. */\n"
        "'use strict';\n"
        f"const {cfg['const']} = {json.dumps(datos, ensure_ascii=False, indent=1)};\n",
        encoding='utf-8')
    print('OK', cfg['const'], {t: len(es) for t, es in datos.items()})
