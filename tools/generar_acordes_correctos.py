#!/usr/bin/env python3
"""
Generador y Validador de Acordes Full con 100% de Coherencia Musical.
Produce 4 posiciones reales, tocables y musicalmente correctas para:
12 notas raíz x 10 tipos de acorde = 120 filas x 4 posiciones = 480 digitaciones.
"""
import csv, pathlib

AFINACION = [64, 59, 55, 50, 45, 40] # 1ra (E4) a 6ta (E2)
NOTAS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
RAICES = [
    ("C", 0), ("C# / Db", 1), ("D", 2), ("D# / Eb", 3),
    ("E", 4), ("F", 5), ("F# / Gb", 6), ("G", 7),
    ("G# / Ab", 8), ("A", 9), ("A# / Bb", 10), ("B", 11)
]

CHORD_SPECS = {
    "Mayor": {"notes": {0, 4, 7}, "req": {0, 4, 7}},
    "Menor": {"notes": {0, 3, 7}, "req": {0, 3, 7}},
    "7 (Dominante)": {"notes": {0, 4, 7, 10}, "req": {0, 4, 10}},
    "Maj7": {"notes": {0, 4, 7, 11}, "req": {0, 4, 11}},
    "m7": {"notes": {0, 3, 7, 10}, "req": {0, 3, 10}},
    "dim7": {"notes": {0, 3, 6, 9}, "req": {0, 3, 6, 9}},
    "aug": {"notes": {0, 4, 8}, "req": {0, 4, 8}},
    "9": {"notes": {0, 4, 7, 10, 2}, "req": {0, 4, 10, 2}},
    "m9": {"notes": {0, 3, 7, 10, 2}, "req": {0, 3, 10, 2}},
    "maj9": {"notes": {0, 4, 7, 11, 2}, "req": {0, 4, 11, 2}},
}

def to_b36(trastes):
    return "".join("X" if t is None else (str(t) if t < 10 else chr(ord("A") + t - 10)) for t in trastes)

def validate_voicing(trastes, raiz_idx, chord_type):
    spec = CHORD_SPECS[chord_type]
    notes_present = set()
    fretted = []
    for s_idx, t in enumerate(trastes):
        if t is not None:
            if t < 0 or t > 19:
                return False, f"Traste {t} fuera de mástil (0-19)"
            fretted.append(t)
            midi = AFINACION[s_idx] + t
            pc = (midi - raiz_idx) % 12
            if pc not in spec["notes"]:
                return False, f"Nota {NOTAS[midi%12]} no pertenece al acorde {chord_type}"
            notes_present.add(pc)
    if not spec["req"].issubset(notes_present):
        missing = [NOTAS[(raiz_idx + r)%12] for r in (spec["req"] - notes_present)]
        return False, f"Faltan notas esenciales: {missing}"
    non_open = [t for t in fretted if t > 0]
    if non_open and max(non_open) - min(non_open) > 4:
        return False, f"Apertura de mano excesiva: {max(non_open) - min(non_open)} trastes"
    return True, "OK"

# Posiciones abiertas icónicas cuando aplican
OPEN_CHORDS = {
    # (raiz_idx, tipo): (trastes, desc)
    (0, "Mayor"): ([0, 1, 0, 2, 3, None], "Abierta"),
    (2, "Mayor"): ([2, 3, 2, 0, None, None], "Abierta"),
    (4, "Mayor"): ([0, 0, 1, 2, 2, 0], "Abierta"),
    (7, "Mayor"): ([3, 0, 0, 0, 2, 3], "Abierta"),
    (9, "Mayor"): ([0, 2, 2, 2, 0, None], "Abierta"),
    
    (2, "Menor"): ([1, 3, 2, 0, None, None], "Abierta"),
    (4, "Menor"): ([0, 0, 0, 2, 2, 0], "Abierta"),
    (9, "Menor"): ([0, 1, 2, 2, 0, None], "Abierta"),
    
    (0, "7 (Dominante)"): ([0, 1, 3, 2, 3, None], "Abierta (5ta)"),
    (2, "7 (Dominante)"): ([2, 1, 2, 0, None, None], "Abierta"),
    (4, "7 (Dominante)"): ([0, 0, 1, 0, 2, 0], "Abierta"),
    (7, "7 (Dominante)"): ([1, 0, 0, 0, 2, 3], "Abierta"),
    (9, "7 (Dominante)"): ([0, 2, 0, 2, 0, None], "Abierta"),
    (11, "7 (Dominante)"): ([2, 0, 2, 1, 2, None], "Abierta"),
    
    (0, "Maj7"): ([0, 0, 0, 2, 3, None], "Abierta"),
    (2, "Maj7"): ([2, 2, 2, 0, None, None], "Abierta"),
    (4, "Maj7"): ([0, 0, 1, 1, 2, 0], "Abierta"),
    (5, "Maj7"): ([0, 1, 2, 3, None, None], "Abierta (4ta)"),
    (7, "Maj7"): ([2, 0, 0, 0, 2, 3], "Abierta"),
    (9, "Maj7"): ([0, 2, 1, 2, 0, None], "Abierta"),
    
    (2, "m7"): ([1, 1, 2, 0, None, None], "Abierta"),
    (4, "m7"): ([0, 0, 0, 0, 2, 0], "Abierta"),
    (9, "m7"): ([0, 1, 0, 2, 0, None], "Abierta"),
    (11, "m7"): ([2, 3, 2, 4, 2, None], "Abierta"),
    
    (0, "aug"): ([0, 1, 1, 2, 3, None], "Abierta"),
    (4, "aug"): ([0, 1, 1, 2, None, 0], "Abierta"),
}

def generar_posiciones(raiz_idx, tipo):
    """Genera 4 posiciones impecables para una nota y tipo."""
    f6 = (raiz_idx - 4) % 12 # traste en 6ta cuerda
    f5 = (raiz_idx - 9) % 12 # traste en 5ta cuerda
    f4 = (raiz_idx - 2) % 12 # traste en 4ta cuerda
    
    pos = []
    
    # 1. MAYOR
    if tipo == "Mayor":
        # Pos 1: Abierta si existe, o Forma A / C
        if (raiz_idx, tipo) in OPEN_CHORDS:
            pos.append((OPEN_CHORDS[(raiz_idx, tipo)][0], OPEN_CHORDS[(raiz_idx, tipo)][1]))
        else:
            t = [f5, f5+2, f5+2, f5+2, f5, None]
            pos.append((t, "Forma A (5ta)"))
            
        # Pos 2: Forma E (6ta)
        t = [f6, f6, f6+1, f6+2, f6+2, f6]
        pos.append((t, "Forma E (6ta)"))
        
        # Pos 3: Forma D (4ta)
        t = [f4+2, f4+3, f4+2, f4, None, None]
        pos.append((t, "Forma D (4ta)"))
        
        # Pos 4: Forma C (5ta) o Forma A alternativa
        if f5 >= 3:
            t = [f5-3, f5-2, f5-3, f5-1, f5, None]
            pos.append((t, "Forma C (5ta)"))
        else:
            t = [f5, f5+2, f5+2, f5+2, f5, None]
            pos.append((t, "Forma A (5ta)"))

    # 2. MENOR
    elif tipo == "Menor":
        if (raiz_idx, tipo) in OPEN_CHORDS:
            pos.append((OPEN_CHORDS[(raiz_idx, tipo)][0], OPEN_CHORDS[(raiz_idx, tipo)][1]))
        else:
            t = [f5, f5+1, f5+2, f5+2, f5, None]
            pos.append((t, "Forma Am (5ta)"))
            
        t = [f6, f6, f6, f6+2, f6+2, f6]
        pos.append((t, "Forma Em (6ta)"))
        
        t = [f4+1, f4+3, f4+2, f4, None, None]
        pos.append((t, "Forma Dm (4ta)"))
        
        if f5 + 12 <= 17:
            t = [f5+12, f5+13, f5+14, f5+14, f5+12, None]
            pos.append((t, "Forma Am (5ta, octava alta)"))
        else:
            t = [f5, f5+1, f5+2, f5+2, f5, None]
            pos.append((t, "Forma Am (5ta)"))

    # 3. 7 (DOMINANTE)
    elif tipo == "7 (Dominante)":
        if (raiz_idx, tipo) in OPEN_CHORDS:
            pos.append((OPEN_CHORDS[(raiz_idx, tipo)][0], OPEN_CHORDS[(raiz_idx, tipo)][1]))
        else:
            t = [f5, f5+2, f5, f5+2, f5, None]
            pos.append((t, "Forma A7 (5ta)"))
            
        t = [f6, f6, f6+1, f6, f6+2, f6]
        pos.append((t, "Forma E7 (6ta)"))
        
        t = [f4+2, f4+1, f4+2, f4, None, None]
        pos.append((t, "Forma D7 (4ta)"))
        
        if f5 >= 2:
            t = [None, f5-2, f5, f5-1, f5, None]
            pos.append((t, "Forma C7 (5ta)"))
        else:
            t = [f5, f5+2, f5, f5+2, f5, None]
            pos.append((t, "Forma A7 (5ta)"))

    # 4. MAJ7
    elif tipo == "Maj7":
        if (raiz_idx, tipo) in OPEN_CHORDS:
            pos.append((OPEN_CHORDS[(raiz_idx, tipo)][0], OPEN_CHORDS[(raiz_idx, tipo)][1]))
        else:
            t = [f5, f5+2, f5+1, f5+2, f5, None]
            pos.append((t, "Forma Amaj7 (5ta)"))
            
        t = [None, f6, f6+1, f6+1, None, f6]
        pos.append((t, "Forma Emaj7 (6ta)"))
        
        t = [f4+2, f4+2, f4+2, f4, None, None]
        pos.append((t, "Forma Dmaj7 (4ta)"))
        
        t = [f5, f5+2, f5+1, f5+2, f5, None]
        pos.append((t, "Forma Amaj7 (5ta)"))

    # 5. M7
    elif tipo == "m7":
        if (raiz_idx, tipo) in OPEN_CHORDS:
            pos.append((OPEN_CHORDS[(raiz_idx, tipo)][0], OPEN_CHORDS[(raiz_idx, tipo)][1]))
        else:
            t = [f5, f5+1, f5, f5+2, f5, None]
            pos.append((t, "Forma Am7 (5ta)"))
            
        t = [f6, f6, f6, f6, f6+2, f6]
        pos.append((t, "Forma Em7 (6ta)"))
        
        t = [f4+1, f4+1, f4+2, f4, None, None]
        pos.append((t, "Forma Dm7 (4ta)"))
        
        t = [None, f6, f6, f6, None, f6]
        pos.append((t, "Drop 3 (6ta)"))

    # 6. DIM7
    elif tipo == "dim7":
        # Simétrico cada 3 semitonos
        t5_base = f5 if f5 >= 1 else f5 + 3
        t = [None, t5_base+1, t5_base-1, t5_base+1, t5_base, None]
        pos.append((t, "Raíz 5ta cuerda"))
        
        t6_base = f6 if f6 >= 1 else f6 + 3
        t = [None, t6_base-1, t6_base, t6_base-1, None, t6_base]
        pos.append((t, "Raíz 6ta cuerda"))
        
        t = [f4+1, f4, f4+1, f4, None, None]
        pos.append((t, "Raíz 4ta cuerda"))
        
        t_inv = [t_ + 3 if t_ is not None else None for t_ in pos[0][0]]
        if max(x for x in t_inv if x is not None) <= 19:
            pos.append((t_inv, "Inversión (+3 trastes)"))
        else:
            t_inv = [t_ - 3 if t_ is not None else None for t_ in pos[0][0]]
            pos.append((t_inv, "Inversión (-3 trastes)"))

    # 7. AUG
    elif tipo == "aug":
        if (raiz_idx, tipo) in OPEN_CHORDS:
            pos.append((OPEN_CHORDS[(raiz_idx, tipo)][0], OPEN_CHORDS[(raiz_idx, tipo)][1]))
        else:
            # 5ta cuerda: R, 4ta: 3, 3ra: #5, 2da: R
            # Para C (f5=3): 5ta=3, 4ta=2, 3ra=1, 2da=1 -> [None, f5-2, f5-2, f5-1, f5, None]
            base_f5 = f5 if f5 >= 2 else f5 + 4
            t = [None, base_f5-2, base_f5-2, base_f5-1, base_f5, None]
            pos.append((t, "Raíz 5ta cuerda"))
            
        base_f6 = f6 if f6 >= 2 else f6 + 4
        # 6ta=R, 4ta=R, 3ra=3, 2da=#5
        # Para E (f6=0): 6ta=0, 4ta=2(E), 3ra=1(G#), 2da=1(C)
        t = [None, base_f6+1, base_f6+1, base_f6+2, None, base_f6]
        pos.append((t, "Raíz 6ta cuerda"))
        
        t = [f4+2, f4+3, f4+3, f4, None, None]
        pos.append((t, "Raíz 4ta cuerda"))
        
        base_inv = f5 if f5 <= 15 else f5 - 4
        t = [None, base_inv+2, base_inv+2, base_inv+3, base_inv, None]
        # Verificar y ajustar si cabe
        pos.append((t, "Forma alternativa"))

    # 8. 9
    elif tipo == "9":
        # Pos 1: Clásica 9na en 5ta cuerda (C9: X3323X o 33323X)
        b5 = f5 if f5 >= 1 else f5 + 12
        t = [b5, b5, b5, b5-1, b5, None]
        pos.append((t, "Raíz 5ta cuerda"))
        
        # Pos 2: 9na en 6ta cuerda (G9: X32323)
        b6 = f6 if f6 >= 1 else f6 + 12
        t = [None, b6, b6-1, b6, b6-1, b6]
        pos.append((t, "Raíz 6ta cuerda"))
        
        # Pos 3: 9na en 4ta cuerda
        # 4ta=R, 3ra=5ta, 2da=b7, 1ra=9na o 3ra
        # En D (f4=0): 4ta=0(D), 3ra=2(A=5ta), 2da=1(C=b7), 1ra=0(E=9na) o 1ra=2(F#=3ra)
        # Con 3ra y 9na: 4ta=f4(R), 3ra=f4+2(9na? wait: 55+f4-1 = 3ra)
        # Voicing compacto: 4ta=f4(R), 3ra=f4-1(3ra: 55+f4-1 = R+4), 2da=f4+1(b7: 59+f4+1 = R+10), 1ra=f4(9na: 64+f4 = R+2)
        b4 = f4 if f4 >= 1 else f4 + 12
        t = [b4, b4+1, b4-1, b4, None, None]
        pos.append((t, "Raíz 4ta cuerda"))
        
        # Pos 4: Variante compacta 5ta cuerda
        t = [None, b5, b5, b5-1, b5, None]
        pos.append((t, "Variante 5ta cuerda"))

    # 9. M9
    elif tipo == "m9":
        # Pos 1: Raíz 5ta cuerda (Cm9: X3313X)
        b5 = f5 if f5 >= 2 else f5 + 12
        t = [None, b5, b5, b5-2, b5, None]
        pos.append((t, "Raíz 5ta cuerda"))
        
        # Pos 2: Raíz 6ta cuerda (Gm9: 5333X3)
        b6 = f6 if f6 <= 17 else f6 - 12
        t = [b6+2, b6, b6, b6, None, b6]
        pos.append((t, "Raíz 6ta cuerda"))
        
        # Pos 3: Raíz 4ta cuerda (Dm9: 4ta=R, 3ra=b3, 2da=b7, 1ra=9na)
        # 4ta: b4(R), 3ra: b4-2(b3: 55+b4-2 = R+3), 2da: b4+1(b7: 59+b4+1 = R+10), 1ra: b4(9na: 64+b4 = R+2)
        b4 = f4 if f4 >= 2 else f4 + 12
        t = [b4, b4+1, b4-2, b4, None, None]
        pos.append((t, "Raíz 4ta cuerda"))
        
        # Pos 4: Forma m9 en 5ta cuerda extendida
        t = [None, b5, b5, b5-2, b5, None]
        pos.append((t, "Variante 5ta cuerda"))

    # 10. MAJ9
    elif tipo == "maj9":
        # Pos 1: Raíz 5ta cuerda (Cmaj9: X3423X)
        b5 = f5 if f5 >= 1 else f5 + 12
        t = [None, b5, b5+1, b5-1, b5, None]
        pos.append((t, "Raíz 5ta cuerda"))
        
        # Pos 2: Raíz 6ta cuerda (Drop 2 Maj9: 6ta=R, 4ta=7ma, 3ra=9na, 2da=3ra)
        # 6ta: b6(R), 4ta: b6+1(7ma: 50+b6+1 = R+11), 3ra: b6-1(9na: 55+b6-1 = R+2), 2da: b6-3(3ra: 59+b6-3 = R+4)
        b6 = f6 if f6 >= 3 else f6 + 12
        t = [None, b6-3, b6-1, b6+1, None, b6]
        pos.append((t, "Raíz 6ta cuerda"))
        
        # Pos 3: Raíz 4ta cuerda (Dmaj9: 4ta=R, 3ra=3ra, 2da=7ma, 1ra=9na)
        # 4ta: b4(R), 3ra: b4-1(3ra: 55+b4-1 = R+4), 2da: b4+2(7ma: 59+b4+2 = R+11), 1ra: b4(9na: 64+b4 = R+2)
        b4 = f4 if f4 >= 1 else f4 + 12
        t = [b4, b4+2, b4-1, b4, None, None]
        pos.append((t, "Raíz 4ta cuerda"))
        
        # Pos 4: Variante 5ta cuerda
        t = [None, b5, b5+1, b5-1, b5, None]
        pos.append((t, "Variante 5ta cuerda"))

    return pos

if __name__ == "__main__":
    # Test all 120 chords
    total_voiced = 0
    errors = []
    
    for nota_nombre, raiz_idx in RAICES:
        for tipo in CHORD_SPECS.keys():
            posiciones = generar_posiciones(raiz_idx, tipo)
            if len(posiciones) != 4:
                errors.append(f"{nota_nombre} {tipo}: expected 4 positions, got {len(posiciones)}")
            for idx, (trastes, desc) in enumerate(posiciones, 1):
                total_voiced += 1
                ok, msg = validate_voicing(trastes, raiz_idx, tipo)
                if not ok:
                    errors.append(f"{nota_nombre} {tipo} Pos {idx} ({desc}): {to_b36(trastes)} -> {msg}")
                    
    print(f"Total voicings probados: {total_voiced}")
    if errors:
        print(f"ERRORES ENCONTRADOS ({len(errors)}):")
        for e in errors[:25]:
            print("  *", e)
        exit(1)
    else:
        print("PERFECTO: Los 480 acordes pasaron la validación musical y técnica al 100%!")

    # Escribir el nuevo CSV
    csv_path = pathlib.Path(__file__).resolve().parent.parent / "Diccionari_Full Acordes.csv"
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        escritor = csv.writer(f)
        escritor.writerow([
            "Nota", "Tipo",
            "Pos 1", "Notacion 1", "Descripcion 1",
            "Pos2", "Notacion 2", "Descripcion 2",
            "Pos3", "Notacion 3", "Descripcion 3",
            "Pos4", "Notacion 4", "Descripcion 4"
        ])
        for nota_nombre, raiz_idx in RAICES:
            for tipo in CHORD_SPECS.keys():
                posiciones = generar_posiciones(raiz_idx, tipo)
                fila = [nota_nombre, tipo]
                for idx, (trastes, desc) in enumerate(posiciones, 1):
                    fila.extend([str(idx), to_b36(trastes), desc])
                escritor.writerow(fila)
    print(f"Archivo actualizado exitosamente: {csv_path}")
