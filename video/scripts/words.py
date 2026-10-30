"""Tiempos por palabra de la voz con faster-whisper (modelo local ya descargado).

Uso: python scripts/words.py assets-src/voice/voz.mp3 > assets-src/voice/words.json
"""
import json
import sys

from faster_whisper import WhisperModel

m = WhisperModel("small", device="cpu", compute_type="int8", local_files_only=True)
segs, _ = m.transcribe(
    sys.argv[1], language="es", word_timestamps=True, vad_filter=False, beam_size=5,
)
out = [{"w": w.word.strip(), "t0": round(w.start, 3), "t1": round(w.end, 3), "p": round(w.probability, 2)} for s in segs for w in s.words]
print(json.dumps(out, ensure_ascii=False, indent=1))
