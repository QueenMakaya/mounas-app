"""Pack promo « Voyelles et consonnes » : miniature, story, habillage du Reel, carte de fin, carrousel."""
import os, io
os.environ['DRY'] = '1'
import cairosvg, anim
from PIL import Image
from draw import *
from draw_afro import *
from script_voyelles import tambour
D = 'promov/'
def out(w, h, body, path, jpg=True):
    s = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">{body}</svg>'
    s = anim.resolve(s, 9, 10, 1.0, 0, 0)
    png = cairosvg.svg2png(bytestring=s.encode(), output_width=w, output_height=h)
    if jpg:
        im = Image.open(io.BytesIO(png)).convert('RGBA'); b = Image.new('RGB', im.size, '#FDF6EC'); b.paste(im, mask=im.split()[3]); b.save(D + path, quality=90)
    else: open(D + path, 'wb').write(png)
def base(w, h):
    return (f'<rect width="{w}" height="{h}" fill="{CREAM}"/><circle cx="{w-40}" cy="40" r="120" fill="{TEAL}" opacity=".45"/>'
            f'<circle cx="60" cy="{h-50}" r="130" fill="{YEL}" opacity=".8"/><circle cx="{w-80}" cy="{h-70}" r="42" fill="{RED}" opacity=".6"/>')
def tc(x, y, s, size, fill=PUR, font='black'): return text(x, y, s, size, fill, font)
def biglogo(cx, y, size):
    o = ''; x = cx - width('MOUNAS', size) / 2
    for ch, col in zip('MOUNAS', [YEL, TEAL, YEL, RED, PUR, RED]):
        o += text(x, y, ch, size, col, 'black', 'start'); x += width(ch, size) + 1
    return o
def shift(dx, dy, el, s=1): return f'<g transform="translate({dx} {dy}) scale({s})">{el}</g>'

# --- miniature YouTube 1280x720 ---
out(1280, 720, base(1280, 720) + biglogo(250, 90, 60) + tc(440, 270, 'Voyelles', 128, CV) + tc(440, 400, 'et consonnes', 104, CC)
    + pill(440, 440, 'Elles chantent, elles frappent !', PUR, 40) + djembe(250, 610, .55) + note(420, 640, 1.2) + note(520, 600, 1.0, YEL)
    + ''.join(text(620 + i * 46, 650, v, 60, CV) for i, v in enumerate('aeiou'))
    + amara(1030, 330, 1.15, L='up', R='up'), 'miniature.jpg')

# --- story 1080x1920 ---
out(1080, 1920, base(1080, 1920) + biglogo(540, 230, 100) + pill(540, 300, 'NOUVELLE VIDÉO', RED, 44) + tc(540, 560, 'Voyelles', 170, CV) + tc(540, 730, 'et consonnes', 138, CC)
    + pill(540, 790, 'Les lettres qui chantent, les lettres qui frappent', PUR, 36) + djembe(250, 1250, .9) + note(420, 1080, 1.6) + amara(700, 1180, 1.15, L='up', R='up')
    + pill(540, 1700, 'Sur YouTube · lien en bio', PUR, 50), 'story.jpg')

# --- habillage du Reel 1080x1920 ---
out(1080, 1920, base(1080, 1920) + biglogo(540, 190, 90) + tc(540, 390, 'Voyelles et consonnes', 88) + pill(540, 440, 'Les lettres qui chantent, les lettres qui frappent', RED, 36)
    + djembe(300, 1500, .55) + note(480, 1470, 1.3) + ''.join(text(600 + i * 60, 1510, v, 80, CV) for i, v in enumerate('aeiou'))
    + pill(540, 1640, 'Vidéo complète + bricolage sur YouTube', PUR, 42), 'reel_bg.png', jpg=False)
out(1080, 1920, base(1080, 1920) + biglogo(540, 330, 110) + amara(540, 640, 1.1, L='up', R='up')
    + tc(540, 1280, '14 JOURS', 150, RED) + tc(540, 1420, 'GRATUITS', 150, RED) + tc(540, 1530, 'Une activité de 10 minutes chaque jour', 46, PUR, 'nx')
    + pill(540, 1600, 'lesmounas.school/commencer', PUR, 54), 'reel_fin.png', jpg=False)

# --- carrousel 9 slides 1080x1350 ---
W, H = 1080, 1350
def slide(i, body):
    out(W, H, base(W, H) + text(540, 1290, f'{i} / 9', 30, '#7A6A80', 'nx') + biglogo(140, 80, 40) + body, f'carrousel-{i:02d}.jpg')
def head(tag, title, col=RED, y=210, size=70):
    rows = title if isinstance(title, list) else [title]
    return pill(540, 120, tag, col, 32) + ''.join(tc(540, y + 90 + k * size * 1.15, r, size) for k, r in enumerate(rows))
slide(1, tc(540, 320, 'Voyelles', 140, CV) + tc(540, 450, 'et consonnes', 112, CC) + pill(540, 490, 'Le tambour à syllabes', PUR, 50)
      + djembe(250, 900, .8) + note(420, 760, 1.4) + amara(680, 840, .86, L='up', R='up'))
slide(2, head('LA LEÇON', ['Le secret des lettres'])
      + card(90, 440, 900, 330, CV, sw=7) + text(540, 540, 'les voyelles chantent', 64, CV) + ''.join(text(215 + i * 130, 690, v, 120, CV) for i, v in enumerate('aeiouy')) 
      + card(90, 810, 900, 330, CC, sw=7) + text(540, 910, 'les consonnes frappent', 64, CC) + text(540, 1050, 'b  d  k  m  t...', 100, CC))
slide(3, head('L\'ASTUCE', ['Une voyelle', 'sur chaque doigt'], YEL) + hand(460, 860, 1.15) + thumb(930, 990, 1.0) + tc(540, 1210, 'et le y lève le pouce !', 44, PUR, 'nx'))
slide(4, head('L\'ATELIER', ['Le matériel'], TEAL) + ''.join(card(140, 470 + k * 170, 800, 140, [TEAL, CV, RED, PUR][k], sw=6) + text(540, 560 + k * 170, s, 54, PUR)
      for k, s in enumerate(['deux feuilles de papier', 'un feutre vert', 'un feutre rouge', 'des ciseaux (un adulte)'])))
slide(5, head('ÉTAPE 1', ['Un grand djembé,', 'la consonne m en rouge'], TEAL, size=62) + tambour(540, 800, 1.5, strip=False, slits=False))
slide(6, head('ÉTAPE 2', ['Deux fentes, et une', 'bande de voyelles en vert'], TEAL, size=62) + tambour(430, 840, 1.25, strip=False)
      + f'<rect x="860" y="500" width="130" height="680" rx="8" fill="#FFF8E8" stroke="{CV}" stroke-width="6"/>' + ''.join(text(925, 620 + i * 128, v, 104, CV) for i, v in enumerate('aeiou'))
      + pill(430, 1150, 'un adulte découpe', RED, 36))
slide(7, head('ÉTAPE 3', ['Glisse, tire, et lis !'], TEAL) + tambour(540, 670, 1.15, off=144)
      + ''.join(card(70 + i * 192, 1040, 172, 150, PUR, sw=5, rx=18) + rich(156 + i * 192, 1142, vc(s_), 84) for i, s_ in enumerate(['ma', 'me', 'mi', 'mo', 'mu'])))
slide(8, head('TON DÉFI', ['Écris ton prénom', 'en deux couleurs'], RED) + card(90, 600, 900, 300, PUR, sw=6) + rich(540, 810, vc('Amara'), 200)
      + pill(320, 960, 'voyelles en vert', CV, 40) + pill(770, 960, 'consonnes en rouge', CC, 40) + tc(540, 1140, 'Poste la photo en commentaire !', 46, PUR, 'nx'))
slide(9, amara(540, 420, 0.95, L='up', R='up') + tc(540, 900, 'La vidéo complète', 80) + tc(540, 990, 'est sur YouTube', 80)
      + pill(540, 1040, '14 jours gratuits · lesmounas.school/commencer', RED, 38))
print('ok')
