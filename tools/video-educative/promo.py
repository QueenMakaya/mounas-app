"""Pack promo « Les 4 saisons » : reel 9:16 + carrousel bricolage (9 JPG 1080x1350)."""
import io, os, subprocess
import cairosvg, numpy as np, soundfile as sf
from PIL import Image
from draw import *
from engine import music, SR

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, 'out', 'promo')
os.makedirs(OUT, exist_ok=True)
VIDEO = os.path.join(ROOT, 'out', 'saisons_pam.mp4')
CUTS = [(23.10, 44.60), (426.40, 437.10)]  # intro Amara + quiz Abidjan jusqu'à la révélation


def page(w, h, body, dots=True):
    o = f'<rect width="{w}" height="{h}" fill="{CREAM}"/>'
    if dots:
        o += ''.join(f'<circle cx="{x}" cy="{y}" r="2.2" fill="#E8DCC8"/>' for x in range(30, w, 46) for y in range(30, h, 46))
        o += (f'<circle cx="{w - 40}" cy="40" r="110" fill="{TEAL}" opacity=".45"/><circle cx="40" cy="{h - 40}" r="120" fill="{YEL}" opacity=".85"/>'
              f'<circle cx="{w - 70}" cy="{h - 90}" r="34" fill="{RED}" opacity=".6"/>')
    o += body
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">{o}</svg>')


def logo(x, y, w=300):
    return f'<image x="{x - w / 2}" y="{y}" width="{w}" height="{w * 46 / 250:.0f}" href="data:image/png;base64,{open(os.path.join(ROOT, "logo_b64.txt")).read()}"/>'


def png(svg_, path, w, h, jpg=False):
    data = cairosvg.svg2png(bytestring=svg_.encode(), output_width=w, output_height=h)
    im = Image.open(io.BytesIO(data))
    if jpg:
        bgim = Image.new('RGB', im.size, 'white'); bgim.paste(im, mask=im.split()[-1] if im.mode == 'RGBA' else None)
        bgim.save(path, 'JPEG', quality=90)
    else:
        im.save(path)
    return path


# ---------------- reel ----------------
VY = 640  # haut de la vidéo 1080x608


def reel_frame():
    b = logo(540, 120, 320)
    b += text(540, 360, "Quand est-ce qu'il", 78, PUR) + text(540, 450, 'va neiger ?', 92, RED)
    b += f'<rect x="20" y="{VY - 20}" width="1040" height="648" rx="36" fill="white"/>'
    b += text(540, 1420, 'Vidéo complète', 60, PUR) + text(540, 1495, '+ bricolage sur YouTube', 60, PUR)
    b += pill(540, 1620, 'LES 4 SAISONS', TEAL, 'white', 40)
    b += ''.join(g(ic, x, 1780, .9) for ic, x in [(flower(0, 0, 1, PINK, YEL, False), 300), (sun(0, 0, 40, False), 460),
                                                   (leaf(0, 0, 1.2, 20, ORANGE), 620), (snowflake(0, 0, 1.1, 0, SKY), 780)])
    return page(1080, 1920, b)


def reel_card():
    b = logo(540, 150, 360)
    b += amara(540, 760, 1.05, 'up')
    b += text(540, 1210, '14 JOURS', 120, RED) + text(540, 1340, 'GRATUITS', 120, RED)
    b += text(540, 1460, 'Une activité de 10 minutes', 50, PUR, FN) + text(540, 1525, 'chaque jour', 50, PUR, FN)
    b += pill(540, 1680, 'lesmounas.school/connect', PUR, 'white', 42)
    return page(1080, 1920, b)


def build_reel():
    fr = png(reel_frame(), f'{OUT}/reel_cadre.png', 1080, 1920)
    card = png(reel_card(), f'{OUT}/reel_carte.png', 1080, 1920)
    m = music(6.5)
    m = (m / (np.abs(m).max() + 1e-6) * .35).astype(np.float32)
    f = int(1.2 * SR); m[-f:] *= np.linspace(1, 0, f); m[:int(.2 * SR)] *= np.linspace(0, 1, int(.2 * SR))
    sf.write(f'{OUT}/reel_carte.wav', m, SR)
    clips = []
    for i, (a, b) in enumerate(CUTS):
        c = f'{OUT}/cut{i}.mp4'
        subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', VIDEO, '-filter_complex',
                        f'[0:v]trim={a}:{b},setpts=PTS-STARTPTS,scale=1080:608,fps=24[v];[0:a]atrim={a}:{b},asetpts=PTS-STARTPTS,'
                        f'afade=t=in:d=0.15,afade=t=out:st={b - a - .25:.2f}:d=0.25[a]', '-map', '[v]', '-map', '[a]',
                        '-c:v', 'libx264', '-crf', '16', '-preset', 'fast', '-c:a', 'pcm_s16le', c.replace('.mp4', '.mov')], check=True)
        clips.append(c.replace('.mp4', '.mov'))
    n = len(clips)
    fc = (''.join(f'[{i}:v][{i}:a]' for i in range(n)) + f'concat=n={n}:v=1:a=1[cv][ca];'
          f'[{n}:v][cv]overlay=0:{VY}:shortest=1,fps=24,format=yuv420p,setsar=1[m2];'
          f'[{n + 1}:v]scale=1080:1920,setsar=1,fps=24,format=yuv420p,trim=0:6.5[card];'
          f'[m2][ca][card][{n + 2}:a]concat=n=2:v=1:a=1[v][a];[a]loudnorm=I=-14:TP=-1.5:LRA=11[an]')
    out = f'{OUT}/reel_4_saisons.mp4'
    ins = sum([['-i', c] for c in clips], [])
    subprocess.run(['ffmpeg', '-y', '-v', 'error', *ins, '-loop', '1', '-i', fr, '-loop', '1', '-i', card, '-i', f'{OUT}/reel_carte.wav',
                    '-filter_complex', fc, '-map', '[v]', '-map', '[an]', '-c:v', 'libx264', '-preset', 'medium', '-crf', '21',
                    '-c:a', 'aac', '-b:a', '160k', '-ar', '48000', '-movflags', '+faststart', out], check=True)
    return out


# ---------------- carrousel ----------------
CW, CH = 1080, 1350


def slide(n, body, title=None):
    b = logo(540, 50, 260)
    if title:
        b += pill(540, 190, title, TEAL, 'white', 36)
    b += body
    b += text(CW - 130, CH - 40, f'{n}/9', 34, PUR, FN, 'end')
    return page(CW, CH, b)


def step_slide(n, k, art, l1, l2='', l3='', badge=None):
    b = pill(540, 290, f'ÉTAPE {k}', RED, 'white', 40) + art
    b += text(540, 1060, l1, 58, PUR) + (text(540, 1130, l2, 58, PUR) if l2 else '') + (text(540, 1200, l3, 40, RED, FN) if l3 else '')
    if badge == 'adult':
        b += g(f'<rect x="-210" y="-40" width="420" height="80" rx="40" fill="{YEL}"/>' + text(0, 14, "Un adulte t'aide", 38, PUR, FN), 540, 960)
    return slide(n, b, 'LA ROUE DES SAISONS')


def carousel():
    S = []
    S.append(slide(1, text(540, 380, 'La roue', 110, PUR) + text(540, 500, 'des saisons', 110, RED)
                   + plate(540, 860, 300, True, 4, True, 45, True) + text(540, 1250, 'Le bricolage de la semaine · 3 à 6 ans', 40, PUR, FN)))
    mats = [(plate(0, 0, 80), 'une assiette en carton'), (marker(0, 0, .55, 30) + marker(30, 10, .55, 50, TEAL), 'des feutres'),
            (f'<rect x="-80" y="-55" width="160" height="110" rx="8" fill="#C79A5B"/>', 'un morceau de carton'),
            (brad(0, -20, 1.1), 'une attache parisienne'), (scissors(-15, 0, .6), 'des ciseaux (adulte)')]
    m = text(540, 330, 'Le matériel', 80, PUR)
    for i, (ic, lab) in enumerate(mats):
        y = 470 + i * 160
        m += f'<rect x="140" y="{y - 65}" width="800" height="130" rx="65" fill="white"/>' + g(ic, 250, y) + text(360, y + 16, lab, 46, PUR, FN, 'start')
    S.append(slide(2, m))
    S.append(step_slide(3, 1, plate(540, 650, 300, True) + marker(760, 560, .9, 30), 'Trace une croix', 'sur ton assiette.', '4 parts = 4 saisons'))
    S.append(step_slide(4, 2, plate(540, 650, 300, True, 4), 'Dessine une saison', 'dans chaque part.', 'fleurs · soleil · feuilles · bonhomme de neige'))
    S.append(step_slide(5, 3, f'<rect x="320" y="420" width="440" height="440" rx="10" fill="#D9B27A"/>' + cardboard_arrow(540, 640, 1.4) + scissors(820, 800, .8, -30),
                        'Découpe une flèche', 'dans le carton.', badge='adult'))
    S.append(step_slide(6, 4, plate(500, 650, 280, True, 4, True) + cardboard_arrow(870, 680, .75, 20), 'Un petit trou au milieu', 'et au bout de la flèche.', badge='adult'))
    S.append(step_slide(7, 5, plate(500, 650, 300, True, 4, False, 30, True) + brad(880, 560, 1.1, True), "Glisse l'attache", 'et ouvre ses pattes.'))
    S.append(step_slide(8, 6, season_wheel(540, 650, 310, None, True, 112), 'Fais tourner la flèche :', 'on joue !', '« Montre-moi la saison des glaces ! »'))
    S.append(slide(9, amara(540, 560, .8, 'up') + text(540, 900, '14 JOURS GRATUITS', 76, RED)
                   + text(540, 975, 'Une activité de 10 minutes chaque jour', 40, PUR, FN)
                   + pill(540, 1080, 'lesmounas.school/connect', PUR, 'white', 40)
                   + text(540, 1210, 'Vidéo complète sur YouTube', 44, PUR)))
    paths = []
    for i, s_ in enumerate(S, 1):
        paths.append(png(s_, f'{OUT}/carrousel_{i:02d}.jpg', CW, CH, jpg=True))
    return paths


if __name__ == '__main__':
    print(carousel())
    print(build_reel())
