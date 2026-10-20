"""Local CloudEdTech branded image composition.

This module creates corporate graphic templates, not AI-generated images.
No publication or external API calls occur here.
"""

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import textwrap
from io import BytesIO

NAVY = "#080A27"
ORANGE = "#FF7400"
WHITE = "#FFFFFF"

SIZES = {
    "linkedin": (1200, 627),
    "x": (1200, 675),
    "discord": (1200, 675),
}


def _font(size: int, bold: bool = False):
    windows = Path("C:/Windows/Fonts")
    candidates = (
        ["arialbd.ttf", "segoeuib.ttf"]
        if bold else
        ["arial.ttf", "segoeui.ttf"]
    )
    for name in candidates:
        path = windows / name
        if path.exists():
            return ImageFont.truetype(str(path), size)
    return ImageFont.load_default()



def _brand_icon():
    """Render the official CloudEdTech SVG with resvg."""
    import resvg_py

    asset = (
        Path(__file__).resolve().parents[3]
        / "frontend/public/brand/cloudedtech-icon.svg"
    )

    if not asset.is_file():
        raise FileNotFoundError("Official brand icon not found")

    png_data = resvg_py.svg_to_bytes(
        svg_string=asset.read_text(encoding="utf-8"),
        width=112,
        height=80,
    )

    return Image.open(BytesIO(png_data)).convert("RGBA")


def generar_pieza_corporativa(
    plataforma: str,
    titulo: str,
    mensaje: str,
    destino: str | Path,
) -> Path:
    """Generate a branded PNG locally without publishing it."""

    if plataforma not in SIZES:
        raise ValueError("Unsupported platform")

    if not titulo.strip() or not mensaje.strip():
        raise ValueError("Title and message are required")

    width, height = SIZES[plataforma]
    image = Image.new("RGB", (width, height), NAVY)
    draw = ImageDraw.Draw(image)

    draw.rounded_rectangle(
        (65, 65, width - 65, height - 65),
        radius=35,
        fill="#11153B",
        outline="#303759",
        width=2,
    )

    draw.rounded_rectangle(
        (100, 105, 250, 117),
        radius=6,
        fill=ORANGE,
    )

    icon = _brand_icon()
    if icon is not None:
        image.paste(icon, (width - 230, 115), icon)

    draw.text(
        (100, 145),
        "CloudEdTech",
        font=_font(45, bold=True),
        fill=WHITE,
    )

    if titulo.strip().casefold() != "cloudedtech":
        draw.text(
            (100, 218),
            titulo.strip()[:65],
            font=_font(39, bold=True),
            fill=ORANGE,
        )

    available_width = width - 230
    body_font = _font(29)
    words = " ".join(mensaje.split()).split()
    lines = []
    current = ""

    for word in words:
        candidate = f"{current} {word}".strip()
        box = draw.textbbox((0, 0), candidate, font=body_font)
        if box[2] <= available_width:
            current = candidate
        else:
            if current:
                lines.append(current)
            current = word

    if current:
        lines.append(current)

    y = 300
    max_lines = max(1, (height - 440) // 46 + 1)
    for line in lines[:max_lines]:
        draw.text(
            (100, y),
            line,
            font=body_font,
            fill=WHITE,
        )
        y += 46

    draw.text(
        (100, height - 115),
        "Comunidad | Innovacion | Inteligencia Artificial",
        font=_font(22),
        fill="#C7CCE5",
    )

    path = Path(destino)
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, format="PNG", optimize=True)
    return path
