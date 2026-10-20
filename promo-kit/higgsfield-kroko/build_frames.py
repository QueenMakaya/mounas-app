# -*- coding: utf-8 -*-
"""Start images for Higgsfield (image-to-video), 1080x1920, without any text.

The Kroko, tomato and bowl drawings are cut out of the carousel cards in
public/promo/plus-grand-que/ so the animated shots keep the exact campaign style.
Text, numbers and the logo are added later by make_reel.py, never by the AI model.

    python3 build_frames.py        -> frames/shot_a.png, shot_b.png, shot_c.png
"""
import os
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
CARDS = os.path.join(HERE, "..", "..", "public", "promo", "plus-grand-que")
OUT = os.path.join(HERE, "frames")
W, H = 1080, 1920
CREAM = (253, 246, 236)


def sprite(card, box, drop=None):
    """Cut a drawing out of a card: the cream background (and the pastel circles)
    reachable from the crop border becomes transparent, enclosed pale areas such as
    the white of Kroko's eye stay opaque. `drop` blanks rectangles (e.g. a sign)."""
    im = Image.open(os.path.join(CARDS, card)).convert("RGB").crop(box)
    if drop:
        d = ImageDraw.Draw(im)
        for r in drop:
            d.rectangle(r, fill=CREAM)
    w, h = im.size
    px = im.load()
    mask = Image.new("L", (w, h), 255)
    m = mask.load()
    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y]
            if min(r, g, b) > 200 and max(r, g, b) - min(r, g, b) < 30:
                m[x, y] = 0  # pale and unsaturated: background candidate
    for x in range(w):
        for y in (0, h - 1):
            if m[x, y] == 0:
                ImageDraw.floodfill(mask, (x, y), 128)
    for y in range(h):
        for x in (0, w - 1):
            if m[x, y] == 0:
                ImageDraw.floodfill(mask, (x, y), 128)
    alpha = mask.point(lambda v: 0 if v == 128 else 255)
    im = im.convert("RGBA")
    im.putalpha(alpha)
    return im.crop(alpha.getbbox())


def background():
    bg = Image.new("RGBA", (W, H), CREAM + (255,))
    d = ImageDraw.Draw(bg, "RGBA")
    for x, y, r, c in [(90, 260, 150, (247, 217, 224, 120)), (1010, 330, 100, (207, 243, 239, 140)),
                       (980, 1700, 190, (253, 225, 176, 120)), (100, 1760, 130, (247, 217, 224, 110))]:
        d.ellipse([x - r, y - r, x + r, y + r], fill=c)
    return bg


def place(bg, spr, cx, cy, width):
    s = spr.resize((width, round(spr.height * width / spr.width)), Image.LANCZOS)
    bg.alpha_composite(s, (round(cx - s.width / 2), round(cy - s.height / 2)))


def main():
    os.makedirs(OUT, exist_ok=True)
    kroko = sprite("kroko_00_cover.png", (150, 555, 985, 945))
    piles = sprite("kroko_04_card_4_au_march.png", (200, 180, 880, 515))
    big_pile = piles.crop((0, 0, piles.width // 2, piles.height))
    small_pile = piles.crop((piles.width // 2, 0, piles.width, piles.height))
    bowls = sprite("kroko_05_card_5_le_festin_de_kroko.png", (200, 200, 880, 525),
                   drop=[(265, 0, 405, 330), (0, 0, 25, 330)])  # the purple ">" and a circle edge

    # A. Hook: Kroko faces the bigger pile of tomatoes (left), the smaller one sits on the right.
    a = background()
    place(a, big_pile.crop(big_pile.getbbox()), 300, 1290, 380)
    place(a, small_pile.crop(small_pile.getbbox()), 800, 1325, 300)
    place(a, kroko, 560, 900, 760)
    a.convert("RGB").save(os.path.join(OUT, "shot_a.png"))

    # B. The rule: Kroko alone, centred and smaller, leaving room for the 5 and the 2 on each side.
    b = background()
    place(b, kroko, 540, 960, 500)
    b.convert("RGB").save(os.path.join(OUT, "shot_b.png"))

    # C. Kroko's feast: two bowls of seeds, Kroko above, mouth towards the fuller bowl (left).
    c = background()
    place(c, bowls.crop(bowls.getbbox()), 540, 1260, 900)
    place(c, kroko, 560, 800, 620)
    c.convert("RGB").save(os.path.join(OUT, "shot_c.png"))
    print("frames written to", OUT)


if __name__ == "__main__":
    main()
