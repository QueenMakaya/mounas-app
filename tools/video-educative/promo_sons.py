"""Pack promo « Un, deux, trois : les trois sons » : miniature, habillage du Reel, carte de fin, carrousel."""
import cairosvg, anim, io
from PIL import Image
from draw import *
def out(w, h, body, path, jpg=True):
    s = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">{body}</svg>'
    s = anim.resolve(s, 9, 10, 1.0, 0, 0)
    png = cairosvg.svg2png(bytestring=s.encode(), output_width=w, output_height=h)
    if jpg:
        im = Image.open(io.BytesIO(png)).convert('RGBA'); bgim = Image.new('RGB', im.size, '#FDF6EC'); bgim.paste(im, mask=im.split()[3]); bgim.save(path, quality=90)
    else: open(path, 'wb').write(png)
def base(w, h):
    return (f'<rect width="{w}" height="{h}" fill="{CREAM}"/><circle cx="{w-40}" cy="40" r="120" fill="{TEAL}" opacity=".45"/>'
            f'<circle cx="60" cy="{h-50}" r="130" fill="{YEL}" opacity=".8"/><circle cx="{w-80}" cy="{h-70}" r="42" fill="{RED}" opacity=".6"/>')
def tc(x, y, s, size, fill=PUR, font='black'): return text(x, y, s, size, fill, font)
def biglogo(cx, y, size):
    o = ''; x = cx - width('MOUNAS', size) / 2
    for ch, col in zip('MOUNAS', [YEL, TEAL, YEL, RED, PUR, RED]):
        o += text(x, y, ch, size, col, 'black', 'start'); x += width(ch, size) + 1
    return o
SON = {1: ('un', C1), 2: ('eu', C2), 3: ('oi', C3)}

# --- miniature YouTube 1280x720 ---
out(1280, 720, base(1280, 720) + biglogo(250, 90, 60) + tc(470, 270, 'Un, deux,', 130) + tc(470, 400, 'trois !', 130)
    + pill(470, 440, 'Les sons un · eu · oi', RED, 44) + badge(250, 610, 1, C1, 70) + badge(470, 610, 2, C2, 70) + badge(690, 610, 3, C3, 70)
    + amara(1030, 330, 1.15, L='up', R='up'), 'promo/miniature.jpg')

# --- habillage du Reel 1080x1920 (la vidéo 16:9 se pose au centre) ---
out(1080, 1920, base(1080, 1920) + biglogo(540, 190, 90) + tc(540, 400, 'Un, deux, trois !', 104) + pill(540, 450, 'Trois sons à attraper en sautant', RED, 46)
    + badge(330, 1470, 1, C1, 70) + badge(540, 1470, 2, C2, 70) + badge(750, 1470, 3, C3, 70)
    + pill(540, 1610, 'Vidéo complète + bricolage sur YouTube', PUR, 42), 'promo/reel_bg.png', jpg=False)
out(1080, 1920, base(1080, 1920) + biglogo(540, 330, 110) + amara(540, 640, 1.1, L='up', R='up')
    + tc(540, 1280, '14 JOURS', 150, RED) + tc(540, 1420, 'GRATUITS', 150, RED) + tc(540, 1530, 'Une activité de 10 minutes chaque jour', 46, PUR, 'nx')
    + pill(540, 1600, 'lesmounas.school/connect', PUR, 54), 'promo/reel_fin.png', jpg=False)

# --- carrousel 9 slides 1080x1350 ---
W, H = 1080, 1350
def slide(i, body):
    foot = text(540, 1290, f'{i} / 9', 30, '#7A6A80', 'nx') + biglogo(140, 80, 40)
    out(W, H, base(W, H) + foot + body, f'promo/carrousel-{i:02d}.jpg')
def head(tag, title, col=RED, y=210, size=70):
    rows = title if isinstance(title, list) else [title]
    return pill(540, 120, tag, col, 32) + ''.join(tc(540, y + 90 + k * size * 1.15, r, size) for k, r in enumerate(rows))
slide(1, tc(540, 330, 'Un, deux, trois !', 112) + pill(540, 380, 'La marelle des trois sons', RED, 50)
      + badge(300, 600, 1, C1, 80) + badge(540, 600, 2, C2, 80) + badge(780, 600, 3, C3, 80) + amara(540, 850, 0.86, L='up', R='up')
      + '' )
b = head('LA LEÇON', ['Trois chiffres,', 'trois sons'])
for n, y in zip((1, 2, 3), (560, 790, 1020)):
    g, c = SON[n]; ex = {1: 'l|un|di · parf|um|', 2: 'bl|eu| · n|œu|d · j|e|', 3: 'r|oi| · b|oî|te · v|oy|age'}[n]
    b += card(90, y - 90, 900, 190, c, sw=7) + badge(200, y + 5, n, c, 62) + text(390, y + 40, g, 110, c) + rich(720, y + 28, ex.split(' · ')[0], 60, c) + text(720, y + 78, ' · '.join(x.replace('|', '') for x in ex.split(' · ')[1:]), 36, '#7A6A80', 'nx')
slide(2, b)
slide(3, head('L\'ATELIER', ['Le matériel'], TEAL) + ''.join(card(140, 470 + k * 170, 800, 140, [TEAL, RED, YEL, PUR][k], sw=6) + text(540, 560 + k * 170, s, 54, PUR)
      for k, s in enumerate(['quatre feuilles de papier', 'des feutres', 'du ruban adhésif', 'des ciseaux (un adulte)'])))
slide(4, head('ÉTAPE 1', ['Trois feuilles,', 'trois sons'], TEAL) + ''.join(sheet(x, 590, n, SON[n][0], SON[n][1], 280, 370) for n, x in zip((1, 2, 3), (90, 400, 710)))
      + tc(540, 1110, 'Un chiffre et ses lettres sur chaque feuille', 40, PUR, 'nx'))
ws = [('l|un|di', 1), ('bl|eu|', 2), ('r|oi|', 3), ('br|un|', 1), ('f|eu|', 2), ('ét|oi|le', 3), ('parf|um|', 1), ('j|eu|', 2), ('b|oî|te', 3), ('chac|un|', 1), ('n|œu|d', 2), ('v|oy|age', 3)]
slide(5, head('ÉTAPE 2', ['Douze cartes-mots'], TEAL) + ''.join(card(95 + (k % 3) * 305, 440 + (k // 3) * 170, 280, 140, SON[n][1], sw=5, rx=18) + rich(235 + (k % 3) * 305, 532 + (k // 3) * 170, w, 60, SON[n][1]) for k, (w, n) in enumerate(ws))
      + tc(540, 1180, 'Un adulte découpe, l\'enfant écrit', 40, PUR, 'nx'))
slide(6, head('ÉTAPE 3', ['Au sol, l\'une', 'après l\'autre'], TEAL) + ''.join(sheet(x, 610, n, SON[n][0], SON[n][1], 280, 370) + f'<rect x="{x-25}" y="596" width="70" height="32" fill="{YEL}"/><rect x="{x+235}" y="596" width="70" height="32" fill="{YEL}"/>' for n, x in zip((1, 2, 3), (90, 400, 710)))
      + pill(540, 1090, 'un adulte les colle au sol, pour ne pas glisser', RED, 34))
slide(7, head('ON JOUE !', ['Trois défis'], PUR) + ''.join(card(110, 450 + k * 230, 860, 195, [C1, C2, C3][k], sw=6) + badge(210, 547 + k * 230, k + 1, [C1, C2, C3][k], 55)
      + ''.join(text(300, 525 + k * 230 + j * 56, r, 42, PUR, 'nx', 'start') for j, r in enumerate(rows))
      for k, rows in enumerate([['Pioche une carte, lis le mot,', 'saute sur la bonne feuille'], ['Un adulte dit le mot :', 'écoute, et saute !'], ['Saute sur une feuille,', 'trouve un nouveau mot']])))
slide(8, head('TON DÉFI', ['Invente une phrase', 'avec les trois sons'], RED) + card(90, 620, 900, 330, PUR, sw=6)
      + rich(540, 760, 'L{1un}di, {1un} r{3oi} bl{2eu}', 84) + rich(540, 880, 'compte tr{3oi}s {2œu}fs.', 84)
      + tc(540, 1080, 'Écris la tienne en commentaire !', 46, PUR, 'nx'))
slide(9, amara(540, 420, 0.95, L='up', R='up') + tc(540, 900, 'La vidéo complète', 80) + tc(540, 990, 'est sur YouTube', 80)
      + pill(540, 1040, '14 jours gratuits · lesmounas.school/connect', RED, 38))
print('ok')
