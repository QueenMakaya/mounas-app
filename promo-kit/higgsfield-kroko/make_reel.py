# -*- coding: utf-8 -*-
"""Kroko reel, 1080x1920, about 20 s: three animated shots + the 14-day CTA card.

    python3 make_reel.py            -> out/kroko_reel_higgsfield.mp4 (or _preview.mp4)
    python3 make_reel.py --control  -> out/kroko_reel_slideshow.mp4 (the current format, for the A/B test)

Put the Higgsfield clips in clips/ as shot_a.mp4, shot_b.mp4, shot_c.mp4. A missing
clip is replaced by a slow push-in on its start image (frames/), so the reel can be
previewed before any generation; the file is then named *_preview.mp4.
Optional: audio/vo.wav (Pam's voice-over) is mixed over the music, which is lowered.
All text is drawn here, never by the video model.
"""
import os, sys, subprocess, tempfile
from PIL import Image, ImageDraw, ImageFont, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
CARDS = os.path.join(HERE, "..", "..", "public", "promo", "plus-grand-que")
LOGO = os.path.join(HERE, "..", "..", "public", "logo-mounas-wordmark.png")
OUT = os.path.join(HERE, "out")
W, H, FPS = 1080, 1920, 30
CREAM = (253, 246, 236)
PURPLE, CORAL, TEAL, ORANGE = "#4D0065", "#F30041", "#00CFBF", "#E8961E"

# shot id, duration (s)
SHOTS = [("a", 5.0), ("b", 5.0), ("c", 5.0)]
END_DUR = 5.5
CTA_FROM = 7.5  # the "14 jours gratuits" banner shows from here until the end card


def font(name, size):
    return ImageFont.truetype(os.path.join(HERE, "fonts", name + ".ttf"), size)


def line(d, cy, segments, f, x=W / 2):
    """Centred line made of (text, colour) or (text, colour, font) segments."""
    segs = [(s[0], s[1], s[2] if len(s) > 2 else f) for s in segments]
    total = sum(d.textlength(t, font=sf) for t, _, sf in segs)
    cx = x - total / 2
    for t, c, sf in segs:
        d.text((cx, cy), t, font=sf, fill=c, anchor="lm")
        cx += d.textlength(t, font=sf)


def pill(d, cy, text, f, bg, fg="#FFFFFF", pad=46, h=96):
    w = d.textlength(text, font=f) + 2 * pad
    d.rounded_rectangle([W / 2 - w / 2, cy - h / 2, W / 2 + w / 2, cy + h / 2], radius=h / 2, fill=bg)
    d.text((W / 2, cy), text, font=f, fill=fg, anchor="mm")


def overlay(path, draw_fn):
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw_fn(ImageDraw.Draw(im), im)
    im.save(path)
    return path


def build_overlays(tmp):
    """(png, start, end) list, times on the final timeline."""
    big = font("Fraunces-Black", 104)
    mid = font("Fraunces-Black", 80)
    num = font("Fraunces-Black", 300)
    small = font("Nunito-ExtraBold", 50)
    tiny = font("Nunito-ExtraBold", 40)
    sign = font("Nunito-ExtraBold", 130)  # Fraunces draws > and < too small
    p = lambda n: os.path.join(tmp, n + ".png")
    t_end = sum(d for _, d in SHOTS)

    def logo(d, im):
        lg = Image.open(LOGO).convert("RGBA")
        lg = lg.resize((300, round(lg.height * 300 / lg.width)), Image.LANCZOS)
        im.alpha_composite(lg, ((W - lg.width) // 2, 150))

    return [
        (overlay(p("logo"), logo), 0, t_end),
        # A. Hook, aimed at the parent
        (overlay(p("a1"), lambda d, im: (
            line(d, 400, [("Ton enfant confond", PURPLE)], mid),
            line(d, 530, [(">", CORAL, sign), (" et ", PURPLE), ("<", CORAL, sign), (" ?", PURPLE)], big))), 0.15, 2.7),
        (overlay(p("a2"), lambda d, im: (
            line(d, 400, [("Un crocodile", PURPLE)], mid),
            line(d, 520, [("règle ça.", CORAL)], big))), 2.7, 5.0),
        # B. The rule
        (overlay(p("b1"), lambda d, im: (
            line(d, 400, [("Sa bouche s'ouvre", PURPLE)], mid),
            line(d, 510, [("vers le plus ", PURPLE), ("GRAND", CORAL)], mid))), 5.15, 10.0),
        (overlay(p("b2"), lambda d, im: (
            d.text((125, 975), "5", font=num, fill=PURPLE, anchor="mm"),
            d.text((960, 975), "2", font=num, fill=TEAL, anchor="mm"),
            line(d, 1240, [("5 > 2 : 5 est plus grand que 2", PURPLE)], small))), 5.6, 10.0),
        # C. The 10-minute game
        (overlay(p("c1"), lambda d, im: (
            line(d, 400, [("Le festin de Kroko", ORANGE)], mid),
            line(d, 500, [("le jeu des 10 minutes", PURPLE)], small))), 10.15, 15.0),
        (overlay(p("c2"), lambda d, im: line(d, 1470, [("2 bols · des graines · 2 bâtonnets", PURPLE)], tiny)),
         10.6, 15.0),
        # Mid-video offer
        (overlay(p("cta"), lambda d, im: (
            pill(d, 1585, "14 JOURS GRATUITS", small, CORAL),
            line(d, 1680, [("lesmounas.school/connect", PURPLE)], tiny))), CTA_FROM, t_end),
    ]


def run(cmd):
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)


def segment_from_clip(src, dur, dst):
    run(["ffmpeg", "-y", "-i", src, "-t", str(dur), "-an", "-vf",
         f"scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},fps={FPS},"
         f"tpad=stop_mode=clone:stop_duration={dur},format=yuv420p",
         "-t", str(dur), "-c:v", "libx264", "-crf", "16", "-preset", "fast", dst])


def segment_from_still(src, dur, dst, zoom=0.06):
    n = int(dur * FPS)
    run(["ffmpeg", "-y", "-loop", "1", "-framerate", str(FPS), "-i", src, "-vf",
         f"scale={W * 2}:{H * 2},zoompan=z='1+{zoom}*on/{n}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'"
         f":d=1:s={W}x{H}:fps={FPS},format=yuv420p",
         "-frames:v", str(n), "-c:v", "libx264", "-crf", "16", "-preset", "fast", dst])


def card_frame(card, dst, shadow=False):
    """A 4:5 card on the 9:16 cream background (end card, or slideshow frame)."""
    bg = Image.new("RGBA", (W, H), CREAM + (255,))
    d = ImageDraw.Draw(bg, "RGBA")
    for x, y, r, c in [(90, 120, 130, (247, 217, 224, 128)), (1000, 160, 90, (207, 243, 239, 140)),
                       (980, 1780, 150, (253, 225, 176, 128)), (110, 1800, 120, (247, 217, 224, 128))]:
        d.ellipse([x - r, y - r, x + r, y + r], fill=c)
    im = Image.open(os.path.join(CARDS, card)).convert("RGBA")
    if shadow:  # same look as the campaign skill's reel.py
        cw, ch = 940, 1175
        im = im.resize((cw, ch), Image.LANCZOS)
        mask = Image.new("L", (cw, ch), 0)
        ImageDraw.Draw(mask).rounded_rectangle([0, 0, cw - 1, ch - 1], radius=46, fill=255)
        im.putalpha(mask)
        x, y = (W - cw) // 2, (H - ch) // 2
        sh = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        solid = Image.new("RGBA", (cw, ch), (60, 30, 15, 110))
        solid.putalpha(mask)
        sh.paste(solid, (x, y + 18), solid)
        bg.alpha_composite(sh.filter(ImageFilter.GaussianBlur(26)))
        bg.alpha_composite(im, (x, y))
    else:
        bg.alpha_composite(im, (0, (H - im.height) // 2))
    bg.convert("RGB").save(dst)
    return dst


def audio_args(total):
    """Music (+ optional voice-over), normalised for social at -14 LUFS."""
    music = os.path.join(HERE, "audio", "groove.m4a")
    vo = os.path.join(HERE, "audio", "vo.wav")
    fade = f"afade=t=in:d=0.3,afade=t=out:st={total - 0.8}:d=0.8"
    if os.path.exists(vo):
        return (["-i", music, "-i", vo],
                f"[1:a]volume=0.28[m];[2:a]apad[v];[m][v]amix=inputs=2:duration=first:normalize=0,"
                f"atrim=0:{total},{fade},loudnorm=I=-14:TP=-1.5[aout]")
    return ["-i", music], f"[1:a]atrim=0:{total},{fade},loudnorm=I=-14:TP=-1.5[aout]"


def encode(video_in, overlays, total, dst):
    """Burn the timed overlays (with soft fades) and mix the audio, in one pass."""
    a_inputs, a_filter = audio_args(total)
    cmd = ["ffmpeg", "-y", "-i", video_in] + a_inputs
    first_ov = 1 + len(a_inputs) // 2
    chain, last = [], "[0:v]"
    for i, (png, s, e) in enumerate(overlays):
        cmd += ["-loop", "1", "-framerate", str(FPS), "-t", str(total), "-i", png]
        k = first_ov + i
        chain.append(f"[{k}:v]format=rgba,fade=t=in:st={s}:d=0.25:alpha=1,"
                     f"fade=t=out:st={max(s, e - 0.2)}:d=0.2:alpha=1[o{i}]")
        chain.append(f"{last}[o{i}]overlay=0:0:enable='between(t,{s},{e})'[v{i}]")
        last = f"[v{i}]"
    vf = ";".join(chain + [f"{last}fade=t=out:st={total - 0.4}:d=0.4,format=yuv420p[vout]", a_filter])
    cmd += ["-filter_complex", vf, "-map", "[vout]", "-map", "[aout]", "-t", str(total),
            "-c:v", "libx264", "-profile:v", "high", "-crf", "19", "-preset", "medium", "-g", "60",
            "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", dst]
    run(cmd)


def concat(parts, dst, tmp):
    lst = os.path.join(tmp, "list.txt")
    open(lst, "w").write("".join(f"file '{p}'\n" for p in parts))
    run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", lst, "-c", "copy", dst])


def main():
    os.makedirs(OUT, exist_ok=True)
    tmp = tempfile.mkdtemp(prefix="kroko_")
    if "--control" in sys.argv:
        cards = ["kroko_00_cover.png", "kroko_01_card_1_kroko.png", "kroko_02_card_2_plus_grand_que.png",
                 "kroko_03_card_3_plus_petit_que.png", "kroko_04_card_4_au_march.png",
                 "kroko_05_card_5_le_festin_de_kroko.png", "kroko_06_cta.png"]
        durs = [3.0, 2.6, 2.6, 2.6, 2.6, 2.6, 3.4]  # campaign skill defaults
        parts = []
        for i, (c, du) in enumerate(zip(cards, durs)):
            seg = os.path.join(tmp, f"s{i}.mp4")
            segment_from_still(card_frame(c, os.path.join(tmp, f"s{i}.png"), shadow=True), du, seg, zoom=0)
            parts.append(seg)
        joined = os.path.join(tmp, "joined.mp4")
        concat(parts, joined, tmp)
        dst = os.path.join(OUT, "kroko_reel_slideshow.mp4")
        encode(joined, [], sum(durs), dst)
        print("control reel:", dst)
        return

    parts, missing = [], []
    for sid, dur in SHOTS:
        clip = os.path.join(HERE, "clips", f"shot_{sid}.mp4")
        seg = os.path.join(tmp, f"shot_{sid}.mp4")
        if os.path.exists(clip):
            segment_from_clip(clip, dur, seg)
        else:
            missing.append(sid)
            segment_from_still(os.path.join(HERE, "frames", f"shot_{sid}.png"), dur, seg)
        parts.append(seg)
    end = os.path.join(tmp, "end.mp4")
    segment_from_still(card_frame("kroko_06_cta.png", os.path.join(tmp, "end.png")), END_DUR, end, zoom=0.04)
    parts.append(end)
    joined = os.path.join(tmp, "joined.mp4")
    concat(parts, joined, tmp)

    total = sum(d for _, d in SHOTS) + END_DUR
    name = "kroko_reel_higgsfield_preview.mp4" if missing else "kroko_reel_higgsfield.mp4"
    dst = os.path.join(OUT, name)
    encode(joined, build_overlays(tmp), total, dst)
    if missing:
        print("no clip yet for shot(s):", ", ".join(missing), "-> still image used")
    print("reel:", dst)


if __name__ == "__main__":
    main()
