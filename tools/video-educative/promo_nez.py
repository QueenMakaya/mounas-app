"""Pack promo « Les sons du nez » : miniature, story, habillage du Reel, carte de fin, carrousel."""
import os, io
os.environ['DRY'] = '1'
import cairosvg, anim
from PIL import Image
from draw import *
from draw_nez import *
from script_nez import bala3, WORDS, cartes, nose
D = 'promon/'
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
def trois(cx, y, r=70, gap=230):
    return ''.join(badge(cx + (n - 2) * gap - r * .9, y, n, NEZ[n][1], r) + text(cx + (n - 2) * gap + r * .95, y + r * .5, NEZ[n][0], int(r * 1.5), NEZ[n][1]) for n in (1, 2, 3))

out(1280, 720, base(1280, 720) + biglogo(250, 90, 60) + tc(430, 270, 'Les sons', 128) + tc(430, 400, 'du nez', 128)
    + pill(430, 440, 'on · an · in', RED, 50) + trois(430, 610, 52, 210) + samba(1010, 330, .78, sing=True), 'miniature.jpg')
out(1080, 1920, base(1080, 1920) + biglogo(540, 230, 100) + pill(540, 300, 'NOUVELLE VIDÉO', RED, 44) + tc(540, 560, 'Les sons', 170) + tc(540, 730, 'du nez', 170)
    + pill(540, 790, 'Samba l\'éléphant chante on, an, in', PUR, 40) + samba(540, 1180, 1.0, sing=True) + pill(540, 1740, 'Sur YouTube · lien en bio', PUR, 50), 'story.jpg')
out(1080, 1920, base(1080, 1920) + biglogo(540, 190, 90) + tc(540, 390, 'Les sons du nez', 104) + pill(540, 440, 'Samba l\'éléphant chante on, an, in', RED, 40)
    + trois(540, 1480, 60, 260) + pill(540, 1640, 'Vidéo complète + bricolage sur YouTube', PUR, 42), 'reel_bg.png', jpg=False)
out(1080, 1920, base(1080, 1920) + biglogo(540, 330, 110) + amara(540, 640, 1.1, L='up', R='up')
    + tc(540, 1280, '14 JOURS', 150, RED) + tc(540, 1420, 'GRATUITS', 150, RED) + tc(540, 1530, 'Une activité de 10 minutes chaque jour', 46, PUR, 'nx')
    + pill(540, 1600, 'lesmounas.school/commencer', PUR, 54), 'reel_fin.png', jpg=False)

W, H = 1080, 1350
def slide(i, body): out(W, H, base(W, H) + text(540, 1290, f'{i} / 9', 30, '#7A6A80', 'nx') + biglogo(140, 80, 40) + body, f'carrousel-{i:02d}.jpg')
def head(tag, title, col=RED, y=210, size=70):
    rows = title if isinstance(title, list) else [title]
    return pill(540, 120, tag, col, 32) + ''.join(tc(540, y + 90 + k * size * 1.15, r, size) for k, r in enumerate(rows))
def sh(dx, dy, s, el): return f'<g transform="translate({dx} {dy}) scale({s})">{el}</g>'
slide(1, tc(540, 320, 'Les sons du nez', 124) + pill(540, 370, 'Le balafon des sons du nez', RED, 50) + trois(540, 560, 62, 290) + samba(540, 880, .72, sing=True))
b = head('LA LEÇON', ['Trois sons qui passent', 'par le nez'], size=64)
for n, y in zip((1, 2, 3), (560, 790, 1020)):
    g, c = NEZ[n]; ex = {1: ['mout|on|', 'ballon · balafon'], 2: ['mam|an|', 'mangue · dent'], 3: ['lap|in|', 'matin · pain']}[n]
    b += card(90, y - 90, 900, 190, c, sw=7) + badge(200, y + 5, n, c, 62) + text(390, y + 40, g, 110, c) + rich(720, y + 28, ex[0], 60, c) + text(720, y + 78, ex[1], 36, '#7A6A80', 'nx')
slide(2, b)
slide(3, head('L\'ASTUCE', ['Le nez pincé'], YEL) + nose(540, 560, 1.4)
      + card(110, 760, 400, 300, PUR, sw=7) + tc(310, 900, '« o »', 120, PUR) + tc(310, 1000, 'rien ne change', 40, PUR, 'nx')
      + card(570, 760, 400, 300, CON, sw=7) + tc(770, 900, '« on »', 120, CON) + tc(770, 1000, 'ça fait tout drôle !', 40, PUR, 'nx')
      + tc(540, 1170, 'Si ça change, c\'est un son du nez', 44, PUR, 'nx'))
slide(4, head('LA PHRASE MAGIQUE', ['Tous les sons du nez', 'dans une seule phrase'], YEL, size=62)
      + ''.join(card(110 + (i % 2) * 450, 520 + (i // 2) * 290, 410, 250, c, sw=8) + rich(315 + (i % 2) * 450, 690 + (i // 2) * 290, w, 130, c) for i, (w, c) in enumerate([('|un|', CUN), ('b|on|', CON), ('p|ain|', CIN), ('bl|an|c', CAN)]))
      + tc(540, 1180, 'Apprends-la à quelqu\'un de ta famille', 44, PUR, 'nx'))
slide(5, head('L\'ATELIER', ['Le matériel'], TEAL) + ''.join(card(140, 470 + k * 170, 800, 140, [TEAL, CON, RED, PUR][k], sw=6) + text(540, 560 + k * 170, s, 50, PUR)
      for k, s in enumerate(['deux feuilles de papier', 'trois feutres : vert, rouge, jaune', 'des ciseaux (un adulte)', 'la fiche à imprimer (facultatif)'])))
slide(6, head('ÉTAPE 1', ['Trois grandes lames,', 'un son sur chacune'], TEAL, size=62) + bala3(105, 500, 270, 620, gap=30))
slide(7, head('ÉTAPE 2', ['Douze cartes-mots'], TEAL) + sh(-30, 130, .6, cartes()) .replace('scale(0.6)', 'scale(0.59)') + tc(540, 1110, 'Un adulte découpe, l\'enfant écrit', 44, PUR, 'nx'))
slide(8, head('ÉTAPE 3', ['Chaque carte', 'sur la bonne lame'], TEAL, size=62) + bala3(105, 500, 270, 620, words=WORDS, gap=30) + tc(540, 1200, 'Puis on joue du balafon : on tape et on lit !', 40, PUR, 'nx'))
slide(9, amara(540, 420, 0.95, L='up', R='up') + tc(540, 900, 'La vidéo complète', 80) + tc(540, 990, 'est sur YouTube', 80) + pill(540, 1040, '14 jours gratuits · lesmounas.school/commencer', RED, 38))
print('ok')
