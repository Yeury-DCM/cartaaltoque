"""Quita el fondo de los logos oficiales (brand/originals) y deja PNG transparentes en brand/out.

Método: el canal alfa sale de cuánto se aleja cada píxel del color de fondo (blanco o negro),
y el color se "des-premultiplica" para que los bordes suavizados no queden con halo.
Uso:  python scripts/make-logos.py
"""
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "brand" / "originals"
OUT = ROOT / "brand" / "out"
OUT.mkdir(parents=True, exist_ok=True)


def cut(path: Path, bg: str) -> Image.Image:
    rgb = np.asarray(Image.open(path).convert("RGB")).astype(np.float64) / 255.0
    if bg == "white":
        a = 1.0 - rgb.min(axis=2)  # cuánto se aleja del blanco
        base = 1.0
    else:
        a = rgb.max(axis=2)  # cuánto se aleja del negro
        base = 0.0
    a_true = np.clip(a, 1e-4, 1.0)[..., None]
    color = np.clip((rgb - (1.0 - a_true) * base) / a_true, 0.0, 1.0)
    # Alfa final: ruido de compresión fuera, y lo que ya es casi sólido, sólido (p. ej. el negro del texto).
    alpha = np.clip((a - 0.03) / 0.87, 0.0, 1.0)
    alpha = np.where(alpha < 0.02, 0.0, alpha)
    out = np.dstack([color, alpha[..., None]])
    return Image.fromarray((out * 255 + 0.5).astype(np.uint8), "RGBA")


def trim(img: Image.Image, pad: float = 0.04) -> Image.Image:
    box = img.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox()
    img = img.crop(box)
    p = int(max(img.size) * pad)
    canvas = Image.new("RGBA", (img.width + 2 * p, img.height + 2 * p), (0, 0, 0, 0))
    canvas.paste(img, (p, p))
    return canvas


def fit(img: Image.Image, max_side: int) -> Image.Image:
    s = max_side / max(img.size)
    return img if s >= 1 else img.resize((round(img.width * s), round(img.height * s)), Image.LANCZOS)


PUBLIC = ROOT / "public"
DARK = (13, 13, 13, 255)  # fondo de la app (#0D0D0D)


def on_canvas(img: Image.Image, size: tuple[int, int], bg, fill: float) -> Image.Image:
    """Centra el logo en un lienzo, ocupando `fill` del lado limitante."""
    canvas = Image.new("RGBA", size, bg)
    s = fill * min(size[0] / img.width, size[1] / img.height)
    logo = img.resize((round(img.width * s), round(img.height * s)), Image.LANCZOS)
    canvas.alpha_composite(logo, ((size[0] - logo.width) // 2, (size[1] - logo.height) // 2))
    return canvas


def web_assets() -> None:
    """Archivos que usa el sitio: logos, favicon, iconos e imagen para compartir."""
    claro = Image.open(OUT / "logo-claro.png")
    oscuro = Image.open(OUT / "logo-oscuro.png")
    simbolo = Image.open(OUT / "simbolo.png")
    fit(claro, 900).save(PUBLIC / "logo-claro.png", optimize=True)
    fit(oscuro, 900).save(PUBLIC / "logo-oscuro.png", optimize=True)
    fit(simbolo, 512).save(PUBLIC / "simbolo.png", optimize=True)
    # Favicon y iconos: el símbolo va transparente (se ve bien en pestañas claras y oscuras).
    sq = on_canvas(simbolo, (512, 512), (0, 0, 0, 0), 0.94)
    sq.resize((192, 192), Image.LANCZOS).save(PUBLIC / "icon-192.png", optimize=True)
    sq.save(PUBLIC / "icon-512.png", optimize=True)
    sq.resize((32, 32), Image.LANCZOS).save(PUBLIC / "favicon-32x32.png", optimize=True)
    sq.resize((16, 16), Image.LANCZOS).save(PUBLIC / "favicon-16x16.png", optimize=True)
    sq.save(PUBLIC / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
    # iOS no admite transparencia: se le da el fondo oscuro de la app.
    on_canvas(simbolo, (180, 180), DARK, 0.66).convert("RGB").save(PUBLIC / "apple-touch-icon.png", optimize=True)
    # Imagen que se ve al compartir el enlace (WhatsApp, redes).
    on_canvas(oscuro, (1200, 630), DARK, 0.62).convert("RGB").save(PUBLIC / "og-image.png", optimize=True)


if __name__ == "__main__":
    jobs = [
        ("logo-fondo-blanco.webp", "white", "logo-claro", 1200),
        ("logo-fondo-negro.webp", "black", "logo-oscuro", 1200),
        ("simbolo-fondo-negro.webp", "black", "simbolo", 1024),
    ]
    for name, bg, out, size in jobs:
        img = fit(trim(cut(SRC / name, bg)), size)
        img.save(OUT / f"{out}.png", optimize=True)
        print(out, img.size)
    web_assets()
    print("public/: logos, favicon, iconos y og-image listos")
