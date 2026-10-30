"""Construye los audios del video a partir de assets-src/ y src/timeline.json.

Salidas:
  public/audio/voice/<id>.wav        tramos de la voz (EQ + compresión + loudness)
  public/audio/music/<montaje>.wav   música de cada montaje (CartaAd, CartaAd15), con ducking bajo la voz

Los efectos (public/audio/sfx/ + src/sfx-manifest.json) vienen ya procesados del proyecto
Odentel.Video (Mixkit); este script no los toca.

Uso: python scripts/build_audio.py <ruta a ffmpeg.exe>
"""
import json
import os
import subprocess
import sys

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FF = sys.argv[1] if len(sys.argv) > 1 else "ffmpeg"
SR = 48000
TL = json.load(open(os.path.join(ROOT, "src", "timeline.json"), encoding="utf-8"))
FPS = TL["fps"]
FRAMES = {s["id"]: s["frames"] for s in TL["scenes"]}


def starts(edit):
    """Inicio (s) de cada escena dentro de un montaje, y duración total."""
    out, acc = {}, 0
    for sid in TL["edits"][edit]:
        out[sid] = acc / FPS
        acc += FRAMES[sid]
    return out, acc / FPS


def decode(path, ch=2):
    raw = subprocess.run(
        [FF, "-v", "error", "-i", path, "-ac", str(ch), "-ar", str(SR), "-f", "f32le", "-"],
        capture_output=True,
        check=True,
    ).stdout
    return np.frombuffer(raw, dtype=np.float32).copy().reshape(-1, ch)


def write(path, a):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    wavfile.write(path, SR, (np.clip(a, -1, 1) * 32767).astype(np.int16))


def db(x):
    return 10 ** (x / 20)


def lp(a, hz):
    return sosfilt(butter(2, hz, "low", fs=SR, output="sos"), a, axis=0)


def fade(a, fin=0.005, fout=0.02):
    a = a.copy()
    n_in, n_out = int(fin * SR), int(fout * SR)
    if n_in:
        a[:n_in] *= np.linspace(0, 1, n_in)[:, None]
    if n_out:
        a[-n_out:] *= np.linspace(1, 0, n_out)[:, None]
    return a


# ---------------------------------------------------------------- voz
def build_voice():
    """Un solo audio de ElevenLabs, cortado en tramos por escena."""
    norm = {}
    for s in sorted({v["src"] for v in TL["voice"]}):
        chain = (
            "highpass=f=75,equalizer=f=220:t=q:w=1.2:g=-1.5,equalizer=f=3200:t=q:w=1.4:g=2,"
            "equalizer=f=9000:t=h:w=0.7:g=1.5,acompressor=threshold=-21dB:ratio=2.6:attack=8:release=140:makeup=2,"
            "loudnorm=I=-16:TP=-1.5:LRA=6"
        )
        raw = subprocess.run(
            [FF, "-v", "error", "-i", os.path.join(ROOT, "assets-src", "voice", s), "-af", chain, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
            capture_output=True,
            check=True,
        ).stdout
        norm[s] = np.frombuffer(raw, dtype=np.float32).copy()
    for v in TL["voice"]:
        seg = norm[v["src"]][int(v["from"] * SR): int(v["to"] * SR)][:, None]
        write(os.path.join(ROOT, "public", "audio", "voice", v["id"] + ".wav"), fade(seg, 0.012, 0.06))
    return norm


def voice_envelope(norm, edit, total):
    """Envolvente de la voz en la línea de tiempo del montaje (para el ducking)."""
    st0, _ = starts(edit)
    n = int(total * SR) + SR
    env = np.zeros(n, dtype=np.float32)
    for v in TL["voice"]:
        if v["scene"] not in st0:
            continue
        a = norm[v["src"]][int(v["from"] * SR): int(v["to"] * SR)]
        st = int((st0[v["scene"]] + v["at"]) * SR)
        env[st: st + len(a)] = np.maximum(env[st: st + len(a)], np.abs(a[: n - st]))
    w = int(0.03 * SR)
    rms = np.sqrt(np.convolve(env.astype(np.float64) ** 2, np.ones(w) / w, "same"))
    active = (rms > db(-38)).astype(np.float64)
    # attack 50 ms / release 380 ms
    out = np.zeros_like(active)
    a_c, r_c = np.exp(-1 / (0.05 * SR)), np.exp(-1 / (0.38 * SR))
    y = 0.0
    for i in range(0, len(active), 48):
        c = (a_c if active[i] > y else r_c) ** 48
        y = c * y + (1 - c) * active[i]
        out[i: i + 48] = y
    return out


# ---------------------------------------------------------------- música
def find_drop(m):
    """Golpe de graves del drop (entre 13.4 y 15.2 s de la pista)."""
    lo = lp(m.mean(1), 150)
    hop = int(0.01 * SR)
    seg = lo[int(13.4 * SR): int(15.2 * SR)]
    e = np.sqrt(np.convolve(seg ** 2, np.ones(hop) / hop, "same"))[::hop]
    return 13.4 + int(np.argmax(np.diff(e))) * 0.01


def build_music(norm, edit):
    m = decode(os.path.join(ROOT, "assets-src", "music", TL["music"]["src"]))
    drop = find_drop(m)
    st, total = starts(edit)
    d = TL["music"]["dropAt"]
    t_drop = st[d["scene"]] + d["at"]  # el drop cae en el giro ("Ahora…")
    off = drop - t_drop
    n = int(total * SR)
    a = np.zeros((n, 2), dtype=np.float32)
    src0 = int(off * SR)
    lo, hi = max(0, src0), min(len(m), src0 + n)
    a[lo - src0: hi - src0] = m[lo:hi]
    # entrada suave del tramo previo al drop
    a = fade(a, 0.25, 0.0)
    fo = int(TL["music"]["fadeOut"] * SR)
    x = np.linspace(0, 1, fo)[:, None]
    tail = a[-fo:]
    a[-fo:] = (tail * (1 - x) + lp(tail, 700) * x) * (1 - x) ** 1.6
    # ducking: ~9 dB bajo la voz; sin voz (E4) la música respira
    env = voice_envelope(norm, edit, total)[:n]
    a *= (db(-11.0) * (1 - env * (1 - db(-9))))[:, None]
    write(os.path.join(ROOT, "public", "audio", "music", f"{edit}.wav"), a)
    print(f"{edit}: {total:.2f}s, drop de la pista en {drop:.3f}s -> {t_drop:.2f}s del montaje")


if __name__ == "__main__":
    norm = build_voice() if TL["voice"] else {}
    for e in TL["edits"]:
        build_music(norm, e)
