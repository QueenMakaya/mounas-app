"""Palette, fond, Amara, Kofi et composants des écrans Les Mounas (SVG 1920x1080)."""
import os, random
from PIL import ImageFont

YEL, RED, PUR, TEAL, CREAM = '#FEBD57', '#F30041', '#4D0065', '#00CFBF', '#FDF6EC'
GOLD = '#D98A00'      # jaune assez foncé pour du texte
TEALT = '#00A99C'     # teal assez foncé pour du texte
SKIN, HAIR = '#7B4A2A', '#2A1A12'
C1, C2, C3 = TEALT, RED, GOLD          # couleurs des sons un / eu / oi
FD = os.path.expanduser('~/.fonts')
FONTS = {'black': ('Fraunces Black', 'FrauncesBlack.ttf'), 'semi': ('Fraunces Semi', 'FrauncesSemi.ttf'),
         'nx': ('Nunito XB', 'NunitoXB.ttf'), 'nb': ('Nunito B', 'NunitoB.ttf'), 'fr': ('Fredoka SB', 'FredokaSB.ttf')}
_fc = {}
def width(s, size, font='black'):
    k = (font, size)
    if k not in _fc: _fc[k] = ImageFont.truetype(os.path.join(FD, FONTS[font][1]), size)
    return _fc[k].getlength(s)

def esc(s):
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')

def text(x, y, s, size=60, fill=PUR, font='black', anchor='middle', op=1):
    return (f'<text x="{x}" y="{y}" font-family="{FONTS[font][0]}" font-size="{size}" fill="{fill}" '
            f'text-anchor="{anchor}" opacity="{op}" xml:space="preserve">{esc(s)}</text>')

def rich(x, y, s, size=120, hi=RED, base=PUR, font='black', mute='#C9BBD0'):
    """Mot centré en x. 'l|un|di' : le morceau entre barres prend la couleur hi. 'deu(x)' : lettre muette grisée."""
    parts = []; cur = base
    buf = ''; i = 0; on = False
    while i < len(s):
        c = s[i]
        if c == '{':
            if buf: parts.append((buf, hi if on else base)); buf = ''
            j = s.index('}', i); parts.append((s[i+2:j], {'1': C1, '2': C2, '3': C3}[s[i+1]])); i = j
        elif c == '|':
            if buf: parts.append((buf, hi if on else base)); buf = ''
            on = not on
        elif c == '(':
            if buf: parts.append((buf, hi if on else base)); buf = ''
            j = s.index(')', i); parts.append((s[i+1:j], mute)); i = j
        else:
            buf += c
        i += 1
    if buf: parts.append((buf, hi if on else base))
    full = ''.join(p for p, _ in parts)
    w = width(full, size, font); cx = x - w / 2; out = []
    done = ''
    for p, col in parts:
        px = cx + width(done, size, font)
        out.append(text(round(px, 1), y, p, size, col, font, 'start'))
        done += p
    return ''.join(out)

def lines(x, y, rows, size=52, fill=PUR, font='black', lh=1.25):
    return ''.join(text(x, y + i * size * lh, r, size, fill, font) for i, r in enumerate(rows))

def logo(x=40, y=74, size=58):
    out = []; cx = x
    for ch, col in zip('MOUNAS', [YEL, TEAL, YEL, RED, PUR, RED]):
        out.append(text(cx, y, ch, size, col, 'black', 'start')); cx += width(ch, size) + 1
    return ''.join(out)

def pill(cx, y, s, col=RED, size=30, fg='#fff', h=None, font='black'):
    w = width(s, size, font) + size * 1.6; h = h or size * 1.75
    return (f'<rect x="{cx - w/2}" y="{y}" width="{w}" height="{h}" rx="{h/2}" fill="{col}"/>'
            + text(cx, y + h/2 + size*0.35, s, size, fg, font))

def bg(title=None, col=RED, deco=True):
    dots = ''.join(f'<circle cx="{x}" cy="{y}" r="2.2" fill="#EADFCF"/>' for x in range(40, 1920, 50) for y in range(140, 1080, 50))
    d = ''
    if deco:
        d = (f'<circle cx="1870" cy="40" r="105" fill="{TEAL}" opacity=".45"/><circle cx="160" cy="210" r="22" fill="{PUR}" opacity=".5"/>'
             f'<circle cx="80" cy="1020" r="115" fill="{YEL}" opacity=".8"/><circle cx="1830" cy="1020" r="40" fill="{RED}" opacity=".6"/>')
    return (f'<rect width="1920" height="1080" fill="{CREAM}"/>{dots}{d}{logo()}'
            + (pill(960, 36, title, col) if title else ''))

def svg(*parts):
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="1920" height="1080">' + ''.join(parts) + '</svg>'

def confetti(seed=1, n=70):
    r = random.Random(seed); out = []
    for _ in range(n):
        x, y = r.randint(20, 1900), r.randint(20, 1060)
        out.append(f'<rect x="{x}" y="{y}" width="12" height="6" fill="{r.choice([YEL, RED, PUR, TEAL])}" transform="rotate({r.randint(0,180)} {x} {y})"/>')
    return ''.join(out)

# ---------- personnages ----------
def _face(mouth='smile'):
    m = {'smile': '<path d="M-22 26 Q0 48 22 26 Q0 34 -22 26Z" fill="#fff"/>',
         'o': '<ellipse cx="0" cy="34" rx="11" ry="13" fill="#3A1410"/>',
         'wide': '<ellipse cx="0" cy="34" rx="20" ry="17" fill="#3A1410"/><ellipse cx="0" cy="41" rx="11" ry="6" fill="#E0566F"/>',
         'flat': '<ellipse cx="0" cy="34" rx="15" ry="7" fill="#3A1410"/>'}[mouth]
    return (f'<circle cx="-30" cy="-2" r="15" fill="#fff"/><circle cx="30" cy="-2" r="15" fill="#fff"/>'
            f'<circle cx="-28" cy="0" r="8" fill="{HAIR}"/><circle cx="32" cy="0" r="8" fill="{HAIR}"/>'
            f'<circle cx="-56" cy="36" r="15" fill="{RED}" opacity=".45"/><circle cx="56" cy="36" r="15" fill="{RED}" opacity=".45"/>{m}')

def _arm(side, pose):
    s = -1 if side == 'L' else 1
    d = {'down': f'M{s*112} 175 Q{s*150} 290 {s*132} 400', 'up': f'M{s*112} 175 Q{s*185} 120 {s*172} -10',
         'out': f'M{s*112} 175 Q{s*200} 190 {s*255} 150', 'nose': f'M{s*112} 175 Q{s*190} 150 {s*22} 22',
         'hip': f'M{s*112} 175 Q{s*200} 260 {s*118} 330'}[pose]
    return f'<path d="{d}" stroke="{SKIN}" stroke-width="32" stroke-linecap="round" fill="none"/>'

def amara(x, y, sc=1.0, L='down', R='up', mouth='smile'):
    """x,y = centre du visage. Hauteur ~520 px à sc=1."""
    hair = ''.join(f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{HAIR}"/>' for cx, cy, r in
                   [(-95, -40, 52), (-70, -95, 50), (-15, -120, 52), (45, -112, 50), (92, -70, 50), (108, -10, 46), (-108, 15, 44), (0, -60, 90)])
    g = (f'{_arm("L", L)}{_arm("R", R) if R != "nose" else ""}'
         f'<rect x="-22" y="80" width="44" height="60" fill="{SKIN}"/>'
         f'<path d="M-100 130 Q-104 122 -92 122 H92 Q104 122 100 130 L118 420 H-118Z" fill="{RED}"/>'
         f'<path d="M-94 190 H94" stroke="{YEL}" stroke-width="10" stroke-dasharray="20 14"/>'
         f'{hair}<circle cx="0" cy="0" r="92" fill="{SKIN}"/><circle cx="68" cy="-78" r="15" fill="{YEL}"/>{_face(mouth)}'
         f'{_arm("R", R) if R == "nose" else ""}')
    return f'<g transform="translate({x} {y}) scale({sc})">{g}</g>'

def kofi(x, y, sc=1.0, L='down', R='up', mouth='smile'):
    g = (f'{_arm("L", L)}{_arm("R", R)}<rect x="-22" y="80" width="44" height="60" fill="{SKIN}"/>'
         f'<path d="M-100 130 Q-104 122 -92 122 H92 Q104 122 100 130 L110 420 H-110Z" fill="{TEAL}"/>'
         f'<circle cx="0" cy="250" r="34" fill="{YEL}"/>'
         f'<path d="M-96 -18 A96 100 0 0 1 96 -18 Q60 -62 0 -60 Q-60 -62 -96 -18Z" fill="{HAIR}"/><circle cx="0" cy="0" r="92" fill="{SKIN}"/>'
         f'<path d="M-90 -22 A92 92 0 0 1 90 -22 Q50 -58 0 -56 Q-50 -58 -90 -22Z" fill="{HAIR}"/>{_face(mouth)}')
    return f'<g transform="translate({x} {y}) scale({sc})">{g}</g>'

# ---------- composants ----------
def card(x, y, w, h, col=PUR, fill='#fff', sw=6, rx=26):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}" stroke="{col}" stroke-width="{sw}"/>'

def badge(cx, cy, n, col, r=70):
    return f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{col}"/>' + text(cx, cy + r*0.38, str(n), int(r*1.15), '#fff', 'fr')

def check(cx, cy, r=46):
    return (f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="#22A66B"/>'
            f'<path d="M{cx-r*.45} {cy} l{r*.32} {r*.32} l{r*.6} -{r*.62}" stroke="#fff" stroke-width="{r*.2}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>')

def cross(cx, cy, r=46):
    return (f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{RED}"/>'
            f'<path d="M{cx-r*.4} {cy-r*.4} l{r*.8} {r*.8} M{cx+r*.4} {cy-r*.4} l-{r*.8} {r*.8}" stroke="#fff" stroke-width="{r*.2}" stroke-linecap="round"/>')

def sheet(x, y, n, graph, col, w=300, h=390, rot=0, hl=False):
    """Une feuille de la marelle : chiffre + lettres du son."""
    glow = f'<rect x="{x-18}" y="{y-18}" width="{w+36}" height="{h+36}" rx="30" fill="{col}" opacity=".25"/>' if hl else ''
    g = (f'{glow}<rect x="{x+8}" y="{y+10}" width="{w}" height="{h}" rx="14" fill="#000" opacity=".08"/>'
         f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="14" fill="#fff" stroke="{col}" stroke-width="7"/>'
         + (text(x + w/2, y + h*0.52, str(n), int(h*0.5), col, 'fr') if n else '')
         + (text(x + w/2, y + h*0.86, graph, int(h*0.2), PUR, 'black') if graph else ''))
    return f'<g transform="rotate({rot} {x+w/2} {y+h/2})">{g}</g>'

def wordcard(cx, cy, w_, s, hi, size=64, w=330, h=120):
    return card(cx - w/2, cy - h/2, w, h, hi, sw=5, rx=20) + rich(cx, cy + size*0.33, s, size, hi)

def houses(y=560):
    out = [f'<rect x="0" y="{y+150}" width="1920" height="{1080-y-150}" fill="#BFE8A6"/>']
    for i, (x, c, r) in enumerate([(60, YEL, RED), (250, TEAL, PUR), (1400, '#F7A1C0', TEAL), (1590, YEL, RED), (1770, TEAL, '#F7A1C0')]):
        out.append(f'<rect x="{x}" y="{y}" width="150" height="160" fill="{c}"/><path d="M{x-14} {y} L{x+75} {y-80} L{x+164} {y}Z" fill="{r}"/>')
    return ''.join(out)

# petits objets du marché (centrés en cx, cy)
def parfum(cx, cy, s=1):
    return (f'<g transform="translate({cx} {cy}) scale({s})"><rect x="-22" y="-120" width="44" height="36" rx="6" fill="{YEL}"/>'
            f'<rect x="-12" y="-88" width="24" height="22" fill="{PUR}"/><rect x="-70" y="-68" width="140" height="150" rx="26" fill="#F7A1C0" stroke="{PUR}" stroke-width="7"/>'
            f'<rect x="-44" y="-20" width="88" height="56" rx="8" fill="#fff"/><circle cx="96" cy="-120" r="7" fill="{TEAL}"/><circle cx="118" cy="-98" r="5" fill="{TEAL}"/><circle cx="122" cy="-136" r="5" fill="{TEAL}"/></g>')

def oeuf(cx, cy, s=1):
    return (f'<g transform="translate({cx} {cy}) scale({s})"><path d="M0 -85 C48 -85 66 -5 66 28 A66 62 0 0 1 -66 28 C-66 -5 -48 -85 0 -85Z" fill="#FFF3DC" stroke="{GOLD}" stroke-width="7"/>'
            f'<ellipse cx="-22" cy="-22" rx="12" ry="20" fill="#fff"/></g>')

def coco(cx, cy, s=1):
    return (f'<g transform="translate({cx} {cy}) scale({s})"><circle r="76" fill="#6B3F1D" stroke="#3E2410" stroke-width="7"/>'
            f'<circle cx="-22" cy="-30" r="9" fill="#3E2410"/><circle cx="22" cy="-30" r="9" fill="#3E2410"/><circle cx="0" cy="2" r="9" fill="#3E2410"/>'
            f'<path d="M-50 40 q20 14 44 4 M10 46 q22 6 40 -10" stroke="#8A5A30" stroke-width="5" fill="none"/></g>')
