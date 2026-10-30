"""Masteriza el audio del render final (dos pasadas de loudnorm: -14 LUFS, -1 dBTP) sin re-codificar el video.

Uso: python scripts/master.py <ffmpeg.exe> out/carta-al-toque-18s_raw.mp4 out/carta-al-toque-18s.mp4
"""
import json
import re
import subprocess
import sys

ff, src, dst = sys.argv[1:4]
glue = "acompressor=threshold=-20dB:ratio=1.8:attack=25:release=220:makeup=1.5"
target = "I=-14:TP=-1.5:LRA=9"  # -1.5 interno: el AAC sube ~0.5 dB el pico
p1 = subprocess.run(
    [ff, "-hide_banner", "-i", src, "-af", f"{glue},loudnorm={target}:print_format=json", "-f", "null", "-"],
    capture_output=True,
    text=True,
)
m = json.loads(re.findall(r"\{[^{}]*\"input_i\"[^{}]*\}", p1.stderr)[-1])
print("medido:", {k: m[k] for k in ("input_i", "input_tp", "input_lra")})
af = (
    f"{glue},loudnorm={target}:measured_I={m['input_i']}:measured_TP={m['input_tp']}:"
    f"measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true"
)
subprocess.run(
    [ff, "-hide_banner", "-y", "-i", src, "-c:v", "copy", "-af", af, "-ar", "48000", "-c:a", "aac", "-b:a", "320k", "-movflags", "+faststart", dst],
    check=True,
)
p3 = subprocess.run([ff, "-hide_banner", "-i", dst, "-af", "loudnorm=print_format=json", "-f", "null", "-"], capture_output=True, text=True)
r = json.loads(re.findall(r"\{[^{}]*\"input_i\"[^{}]*\}", p3.stderr)[-1])
print("final:", {k: r[k] for k in ("input_i", "input_tp")})
