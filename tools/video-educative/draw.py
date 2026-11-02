"""Les Mounas : palette, fond, personnages et accessoires (SVG 1920x1080)."""
import math, os, random

W, H = 1920, 1080
YEL, RED, PUR, TEAL, CREAM = '#FEBD57', '#F30041', '#4D0065', '#00CFBF', '#FDF6EC'
PINK, ORANGE, GREEN, LGREEN, SKY, ICE = '#FF7BA8', '#F2711C', '#3BB273', '#8BD66B', '#8FD3F4', '#D8F1FB'
SKIN, SKIN_D, HAIR, BROWN = '#7A4A2A', '#5E3820', '#2B1A12', '#8B5A2B'
SEASON = {  # nom, couleur, couleur de texte
    'printemps': ('LE PRINTEMPS', PINK, '#C2185B'),
    'ete': ("L'ÉTÉ", YEL, '#C77700'),
    'automne': ("L'AUTOMNE", ORANGE, '#B4470A'),
    'hiver': ("L'HIVER", SKY, '#1F7FA8'),
}
FT = "font-family:'Fraunces Black'"
FN = "font-family:'Nunito ExtraBold'"
FB = "font-family:'Nunito Bold'"
FF = "font-family:'Fredoka SemiBold'"

_LOGO = open(os.path.join(os.path.dirname(__file__), 'logo_b64.txt')).read()


def esc(s):
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')


def text(x, y, s, size=60, color=PUR, font=FT, anchor='middle', extra=''):
    lines = s.split('\n')
    out = []
    for i, l in enumerate(lines):
        out.append(f'<text x="{x}" y="{y + i * size * 1.12:.0f}" text-anchor="{anchor}" '
                   f'style="{font};font-size:{size}px;fill:{color}" {extra}>{esc(l)}</text>')
    return ''.join(out)


def pill(x, y, s, bg=TEAL, fg='white', size=34, pad=34):
    w = len(s) * size * 0.66 + pad * 2
    h = size * 1.6
    return (f'<rect x="{x - w / 2:.0f}" y="{y - h / 2:.0f}" width="{w:.0f}" height="{h:.0f}" rx="{h / 2:.0f}" fill="{bg}"/>'
            + text(x, y + size * 0.36, s, size, fg, FT))


def bg(content='', title=None, title_bg=TEAL, logo=True, deco=True, color=CREAM):
    o = [f'<rect width="{W}" height="{H}" fill="{color}"/>']
    if deco:
        dots = ''.join(f'<circle cx="{x}" cy="{y}" r="2.2" fill="#E8DCC8"/>'
                       for x in range(40, W, 48) for y in range(40, H, 48))
        o.append(dots)
        o.append(f'<circle cx="1870" cy="40" r="105" fill="{TEAL}" opacity=".45"/>')
        o.append(f'<circle cx="80" cy="1020" r="115" fill="{YEL}" opacity=".85"/>')
        o.append(f'<circle cx="1830" cy="1020" r="40" fill="{RED}" opacity=".6"/>')
        o.append(f'<circle cx="160" cy="210" r="22" fill="{PUR}" opacity=".55"/>')
    o.append(content)
    if logo:
        o.append(f'<image x="40" y="34" width="250" height="46" href="data:image/png;base64,{_LOGO}"/>')
    if title:
        o.append(pill(W / 2, 64, title, title_bg))
    return svg(''.join(o))


def svg(body):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" '
            f'width="{W}" height="{H}" viewBox="0 0 {W} {H}">{body}</svg>')


def g(content, x=0, y=0, s=1, rot=0, opacity=1):
    return f'<g transform="translate({x:.1f},{y:.1f}) rotate({rot:.1f}) scale({s:.3f})" opacity="{opacity}">{content}</g>'


# ---------------- personnages ----------------
def _arms(arms, skin):
    st = f'stroke="{skin}" stroke-width="34" stroke-linecap="round" fill="none"'
    if arms == 'up':
        return f'<path d="M-95 70 Q-150 -10 -160 -120" {st}/><path d="M95 70 Q150 -10 160 -120" {st}/>'
    if arms == 'wave':
        return f'<path d="M-95 70 Q-140 150 -130 230" {st}/><path d="M95 70 Q160 0 175 -110" {st}/>'
    if arms == 'think':
        return f'<path d="M-95 70 Q-140 150 -130 230" {st}/><path d="M95 70 Q130 120 40 20" {st}/>'
    if arms == 'hug':
        return f'<path d="M-95 70 Q-20 150 60 90" {st}/><path d="M95 70 Q20 150 -60 90" {st}/>'
    if arms == 'point':
        return f'<path d="M-95 70 Q-140 150 -130 230" {st}/><path d="M95 70 Q190 60 260 10" {st}/>'
    if arms == 'shiver':
        return f'<path d="M-95 70 Q-10 130 70 60" {st}/><path d="M95 70 Q10 150 -70 80" {st}/>'
    return f'<path d="M-95 70 Q-130 150 -125 240" {st}/><path d="M95 70 Q130 150 125 240" {st}/>'


def _face(mouth, skin):
    o = (f'<circle cx="0" cy="-110" r="88" fill="{skin}"/>'
         f'<ellipse cx="-30" cy="-118" rx="15" ry="16" fill="white"/><ellipse cx="30" cy="-118" rx="15" ry="16" fill="white"/>'
         f'<circle cx="-28" cy="-116" r="8" fill="{HAIR}"/><circle cx="32" cy="-116" r="8" fill="{HAIR}"/>'
         f'<circle cx="-56" cy="-78" r="15" fill="{RED}" opacity=".45"/><circle cx="56" cy="-78" r="15" fill="{RED}" opacity=".45"/>')
    if mouth == 'o':
        o += f'<ellipse cx="0" cy="-70" rx="13" ry="17" fill="{HAIR}"/>'
    elif mouth == 'brr':
        o += f'<path d="M-24 -72 l8 -6 l8 6 l8 -6 l8 6 l8 -6" stroke="{HAIR}" stroke-width="5" fill="none"/>'
    else:
        o += f'<path d="M-26 -78 Q0 -50 26 -78" stroke="{HAIR}" stroke-width="7" fill="white" stroke-linecap="round"/>'
    return o


def amara(x, y, s=1, arms='down', mouth='smile', outfit=RED, hat=None, scarf=False):
    """Amara : cheveux afro, barrette jaune, haut rouge. (x,y) = milieu du buste."""
    hair = ''.join(f'<circle cx="{90 * math.cos(a):.0f}" cy="{-140 + 70 * math.sin(a):.0f}" r="44" fill="{HAIR}"/>'
                   for a in [i * math.pi / 7 + math.pi for i in range(8)])
    hair += f'<ellipse cx="0" cy="-150" rx="105" ry="82" fill="{HAIR}"/>'
    clip = f'<circle cx="64" cy="-190" r="14" fill="{YEL}"/>'
    body = (f'<rect x="-22" y="-30" width="44" height="50" fill="{SKIN_D}"/>'
            f'<path d="M-105 30 Q-105 10 -80 8 L80 8 Q105 10 105 30 L118 260 L-118 260 Z" fill="{outfit}"/>'
            f'<line x1="-95" y1="70" x2="95" y2="70" stroke="{YEL}" stroke-width="10" stroke-dasharray="16 10"/>')
    extra = ''
    if hat == 'bonnet':
        extra += (f'<path d="M-98 -150 Q-95 -265 0 -268 Q95 -265 98 -150 Z" fill="{TEAL}"/>'
                  f'<rect x="-104" y="-165" width="208" height="34" rx="16" fill="white"/><circle cx="0" cy="-272" r="26" fill="white"/>')
    if hat == 'sun':
        extra += (f'<ellipse cx="0" cy="-185" rx="150" ry="28" fill="{YEL}"/>'
                  f'<path d="M-80 -190 Q-75 -275 0 -278 Q75 -275 80 -190 Z" fill="{YEL}"/><rect x="-80" y="-205" width="160" height="18" fill="{RED}"/>')
    if scarf:
        extra += f'<rect x="-70" y="-20" width="140" height="36" rx="16" fill="{TEAL}"/><rect x="30" y="0" width="34" height="90" rx="12" fill="{TEAL}"/>'
    inner = _arms(arms, SKIN) + body + hair + _face(mouth, SKIN) + (clip if not hat else '') + extra
    return g(inner, x, y, s)


def kofi(x, y, s=1, arms='down', mouth='smile', outfit=TEAL, hat=None):
    """Kofi : cheveux courts, haut turquoise, petites oreilles."""
    skin = '#6B3E22'
    hair = f'<path d="M-86 -130 Q-80 -205 0 -208 Q80 -205 86 -130 Q60 -168 0 -170 Q-60 -168 -86 -130 Z" fill="{HAIR}"/>'
    ears = f'<circle cx="-88" cy="-108" r="18" fill="{skin}"/><circle cx="88" cy="-108" r="18" fill="{skin}"/>'
    body = (f'<rect x="-22" y="-30" width="44" height="50" fill="#55301A"/>'
            f'<path d="M-100 30 Q-100 10 -78 8 L78 8 Q100 10 100 30 L108 260 L-108 260 Z" fill="{outfit}"/>'
            f'<circle cx="0" cy="110" r="30" fill="{YEL}"/>')
    extra = ''
    if hat == 'bonnet':
        extra = (f'<path d="M-92 -140 Q-90 -255 0 -258 Q90 -255 92 -140 Z" fill="{RED}"/>'
                 f'<rect x="-98" y="-155" width="196" height="32" rx="15" fill="white"/><circle cx="0" cy="-262" r="24" fill="white"/>')
    inner = _arms(arms, skin) + body + ears + _face(mouth, skin) + hair + extra
    return g(inner, x, y, s)


# ---------------- nature ----------------
def leaf(x, y, s=1, rot=0, color=ORANGE):
    return g(f'<path d="M0 -40 Q32 -10 0 40 Q-32 -10 0 -40 Z" fill="{color}"/>'
             f'<path d="M0 -34 L0 46" stroke="#7A3E10" stroke-width="3" opacity=".5"/>', x, y, s, rot)


def snowflake(x, y, s=1, rot=0, color='white', stroke=None):
    arms = ''
    for i in range(6):
        a = i * 60
        arms += (f'<g transform="rotate({a})"><line x1="0" y1="0" x2="0" y2="-40" stroke="{color}" stroke-width="7" stroke-linecap="round"/>'
                 f'<path d="M-12 -30 L0 -20 L12 -30" stroke="{color}" stroke-width="5" fill="none" stroke-linecap="round"/></g>')
    if stroke:
        arms = arms.replace(f'stroke="{color}"', f'stroke="{stroke}"')
    return g(arms, x, y, s, rot)


def flower(x, y, s=1, color=PINK, center=YEL, stem=True):
    p = ''.join(f'<ellipse cx="0" cy="-22" rx="14" ry="22" fill="{color}" transform="rotate({i * 72})"/>' for i in range(5))
    st = f'<path d="M0 10 Q4 60 0 110" stroke="{GREEN}" stroke-width="8" fill="none"/><ellipse cx="16" cy="70" rx="18" ry="8" fill="{GREEN}" transform="rotate(-30 16 70)"/>' if stem else ''
    return g(st + p + f'<circle r="13" fill="{center}"/>', x, y, s)


def sun(x, y, r=80, face=True, rot=0):
    rays = ''.join(f'<rect x="-9" y="{-r - 48}" width="18" height="36" rx="9" fill="{YEL}" transform="rotate({i * 30 + rot})"/>' for i in range(12))
    f = ''
    if face:
        f = (f'<circle cx="{-r * .3}" cy="{-r * .1}" r="{r * .09}" fill="{HAIR}"/><circle cx="{r * .3}" cy="{-r * .1}" r="{r * .09}" fill="{HAIR}"/>'
             f'<path d="M{-r * .3} {r * .22} Q0 {r * .5} {r * .3} {r * .22}" stroke="{HAIR}" stroke-width="{r * .07}" fill="none" stroke-linecap="round"/>'
             f'<circle cx="{-r * .52}" cy="{r * .22}" r="{r * .12}" fill="{RED}" opacity=".35"/><circle cx="{r * .52}" cy="{r * .22}" r="{r * .12}" fill="{RED}" opacity=".35"/>')
    return g(rays + f'<circle r="{r}" fill="{YEL}"/><circle r="{r * .8}" fill="#FFD27A"/>' + f, x, y)


def cloud(x, y, s=1, color='white', opacity=1):
    return g(f'<circle cx="-60" cy="10" r="45" fill="{color}"/><circle cx="0" cy="-15" r="62" fill="{color}"/>'
             f'<circle cx="62" cy="8" r="48" fill="{color}"/><rect x="-105" y="10" width="215" height="45" rx="22" fill="{color}"/>', x, y, s, 0, opacity)


def rain(x, y, s=1):
    drops = ''.join(f'<path d="M{dx} {dy} q-6 14 0 20 q6 -6 0 -20 Z" fill="{TEAL}"/>'
                    for dx, dy in [(-70, 70), (-30, 100), (10, 75), (50, 105), (85, 72), (-50, 140), (30, 145)])
    return g(drops + cloud(0, 0, 1, '#B8C4D6'), x, y, s)


def bird(x, y, s=1, color=PUR):
    return g(f'<path d="M-40 0 Q-20 -25 0 0 Q20 -25 40 0" stroke="{color}" stroke-width="8" fill="none" stroke-linecap="round"/>', x, y, s)


def tree(season, x, y, s=1, fall=0.0):
    """Arbre (x,y) = pied du tronc. fall : 0..1 animation des feuilles qui tombent (automne)."""
    trunk = (f'<path d="M-30 0 L-22 -230 L22 -230 L30 0 Z" fill="{BROWN}"/>'
             f'<path d="M-10 -200 Q-80 -260 -120 -330" stroke="{BROWN}" stroke-width="22" fill="none" stroke-linecap="round"/>'
             f'<path d="M10 -210 Q80 -270 125 -340" stroke="{BROWN}" stroke-width="22" fill="none" stroke-linecap="round"/>'
             f'<path d="M0 -220 L0 -380" stroke="{BROWN}" stroke-width="24" stroke-linecap="round"/>')
    blobs = [(-120, -340, 105), (120, -350, 105), (0, -420, 120), (-60, -270, 95), (70, -270, 95), (0, -320, 110)]
    o = ''
    if season == 'hiver':
        o = trunk + (f'<path d="M-120 -330 Q-150 -350 -170 -390" stroke="{BROWN}" stroke-width="14" fill="none" stroke-linecap="round"/>'
                     f'<path d="M125 -340 Q160 -360 175 -400" stroke="{BROWN}" stroke-width="14" fill="none" stroke-linecap="round"/>'
                     f'<path d="M0 -380 Q-30 -420 -40 -460" stroke="{BROWN}" stroke-width="14" fill="none" stroke-linecap="round"/>'
                     f'<path d="M0 -380 Q30 -420 50 -455" stroke="{BROWN}" stroke-width="14" fill="none" stroke-linecap="round"/>')
        o += ''.join(f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="9" fill="white"/>' for cx, cy, rx in
                     [(-120, -338, 26), (125, -348, 26), (-168, -392, 16), (172, -402, 16), (-38, -462, 14), (48, -458, 14), (0, -386, 18)])
        o += '<ellipse cx="0" cy="4" rx="190" ry="24" fill="white"/>'
    else:
        col = {'printemps': [LGREEN, '#A6E07F'], 'ete': [GREEN, '#2E9A5F'], 'automne': [ORANGE, YEL, '#E8572A']}[season]
        crown = ''.join(f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{col[i % len(col)]}"/>' for i, (cx, cy, r) in enumerate(blobs))
        o = trunk + crown
        rnd = random.Random(7)
        if season == 'printemps':
            o += ''.join(flower(rnd.uniform(-190, 190), rnd.uniform(-500, -230), .45, rnd.choice([PINK, 'white']), YEL, False) for _ in range(16))
        if season == 'ete':
            o += ''.join(f'<circle cx="{rnd.uniform(-180, 180):.0f}" cy="{rnd.uniform(-480, -240):.0f}" r="14" fill="{RED}"/>' for _ in range(10))
        if season == 'automne':
            for i in range(12):
                lx, ly = rnd.uniform(-200, 200), rnd.uniform(-430, -250)
                ph = (fall + i / 12) % 1.0 if fall else None
                if ph is not None:
                    ly2 = ly + ph * (abs(ly) + 10)
                    lx2 = lx + 40 * math.sin(ph * 9 + i)
                    o += leaf(lx2, ly2, .55, ph * 400 + i * 30, rnd.choice([ORANGE, YEL, '#E8572A']))
            o += ''.join(leaf(rnd.uniform(-220, 220), rnd.uniform(-12, 8), .5, rnd.uniform(60, 120), rnd.choice([ORANGE, YEL, RED])) for _ in range(9))
    return g(o, x, y, s)


def snowman(x, y, s=1):
    return g(f'<circle cx="0" cy="-70" r="80" fill="white" stroke="#D5E6EE" stroke-width="5"/>'
             f'<circle cx="0" cy="-195" r="58" fill="white" stroke="#D5E6EE" stroke-width="5"/>'
             f'<circle cx="-20" cy="-205" r="7" fill="{HAIR}"/><circle cx="20" cy="-205" r="7" fill="{HAIR}"/>'
             f'<path d="M0 -190 L45 -182 L0 -178 Z" fill="{ORANGE}"/>'
             f'<rect x="-55" y="-150" width="110" height="22" rx="10" fill="{RED}"/>'
             f'<circle cx="0" cy="-90" r="8" fill="{HAIR}"/><circle cx="0" cy="-55" r="8" fill="{HAIR}"/>'
             f'<path d="M-75 -100 L-140 -150" stroke="{BROWN}" stroke-width="9" stroke-linecap="round"/>'
             f'<path d="M75 -100 L140 -150" stroke="{BROWN}" stroke-width="9" stroke-linecap="round"/>'
             f'<rect x="-45" y="-285" width="90" height="40" rx="8" fill="{PUR}"/><rect x="-62" y="-250" width="124" height="14" rx="7" fill="{PUR}"/>', x, y, s)


def icecream(x, y, s=1):
    return g(f'<path d="M-45 -10 L0 120 L45 -10 Z" fill="#E3A65B"/><path d="M-30 20 L30 20 M-20 50 L20 50" stroke="#C4843C" stroke-width="5"/>'
             f'<circle cx="-22" cy="-30" r="38" fill="{PINK}"/><circle cx="22" cy="-30" r="38" fill="#FFF1C9"/><circle cx="0" cy="-70" r="38" fill="#7A4A2A"/>'
             f'<circle cx="0" cy="-112" r="12" fill="{RED}"/>', x, y, s)


def sunglasses(x, y, s=1):
    return g(f'<rect x="-120" y="-35" width="100" height="70" rx="28" fill="{PUR}"/><rect x="20" y="-35" width="100" height="70" rx="28" fill="{PUR}"/>'
             f'<path d="M-20 -12 Q0 -26 20 -12" stroke="{PUR}" stroke-width="10" fill="none"/>'
             f'<path d="M-100 -20 L-70 -20" stroke="white" stroke-width="8" stroke-linecap="round" opacity=".6"/>'
             f'<path d="M40 -20 L70 -20" stroke="white" stroke-width="8" stroke-linecap="round" opacity=".6"/>', x, y, s)


def bonnet(x, y, s=1):
    return g(f'<path d="M-110 30 Q-105 -120 0 -125 Q105 -120 110 30 Z" fill="{TEAL}"/>'
             f'<path d="M-60 -60 L60 -60 M-80 -10 L80 -10" stroke="white" stroke-width="10" stroke-dasharray="14 12" opacity=".7"/>'
             f'<rect x="-120" y="15" width="240" height="50" rx="22" fill="white"/><circle cx="0" cy="-130" r="34" fill="white"/>', x, y, s)


def mitten(x, y, s=1, rot=0, color=RED):
    return g(f'<path d="M-45 70 L-50 -30 Q-50 -90 0 -90 Q50 -90 50 -30 L45 70 Z" fill="{color}"/>'
             f'<path d="M-48 -10 Q-95 -20 -85 -60 Q-75 -80 -50 -50" fill="{color}"/>'
             f'<rect x="-52" y="55" width="104" height="30" rx="10" fill="white"/>', x, y, s, rot)


def swimsuit(x, y, s=1):
    return g(f'<path d="M-70 -90 L-40 -90 Q0 -40 40 -90 L70 -90 L60 0 Q75 70 40 90 L-40 90 Q-75 70 -60 0 Z" fill="{RED}"/>'
             f'<circle cx="-20" cy="10" r="10" fill="{YEL}"/><circle cx="20" cy="40" r="10" fill="{YEL}"/><circle cx="25" cy="-20" r="10" fill="{YEL}"/>', x, y, s)


def squirrel(x, y, s=1):
    c = '#C0662B'
    return g(f'<path d="M60 40 Q170 20 150 -90 Q130 -170 60 -130 Q120 -80 70 -20 Z" fill="{c}"/>'
             f'<ellipse cx="0" cy="20" rx="62" ry="58" fill="{c}"/><circle cx="-30" cy="-50" r="42" fill="{c}"/>'
             f'<path d="M-50 -85 L-42 -120 L-25 -88 Z" fill="{c}"/><circle cx="-45" cy="-56" r="7" fill="{HAIR}"/>'
             f'<ellipse cx="0" cy="30" rx="34" ry="36" fill="#F2C9A0"/>'
             f'<ellipse cx="-58" cy="10" rx="20" ry="22" fill="{BROWN}"/><path d="M-70 -8 Q-58 -18 -46 -8" stroke="#5A3A1A" stroke-width="6" fill="none"/>', x, y, s)


def marmot(x, y, s=1):
    c = '#A0703F'
    return g(f'<ellipse cx="0" cy="0" rx="230" ry="120" fill="#6B4A2E"/>'
             f'<ellipse cx="10" cy="20" rx="120" ry="70" fill="{c}"/><circle cx="-90" cy="0" r="55" fill="{c}"/>'
             f'<path d="M-112 -2 Q-102 8 -92 -2 M-78 -2 Q-68 8 -58 -2" stroke="{HAIR}" stroke-width="5" fill="none"/>'
             f'<ellipse cx="-84" cy="22" rx="12" ry="8" fill="{HAIR}"/>'
             + text(120, -60, 'Z', 54, PUR) + text(165, -110, 'Z', 42, PUR) + text(200, -150, 'z', 34, PUR), x, y, s)


def palm(x, y, s=1, lights=False):
    o = f'<path d="M-18 0 Q-10 -200 30 -380 L52 -376 Q15 -200 18 0 Z" fill="{BROWN}"/>'
    for a, c in [(-160, GREEN), (-120, LGREEN), (-60, GREEN), (-20, LGREEN), (-95, GREEN)]:
        o += f'<path d="M40 -380 Q{40 + 170 * math.cos(math.radians(a)):.0f} {-380 + 130 * math.sin(math.radians(a)) - 40:.0f} {40 + 230 * math.cos(math.radians(a)):.0f} {-380 + 200 * math.sin(math.radians(a)) + 90:.0f} Q{40 + 120 * math.cos(math.radians(a)):.0f} {-370 + 60 * math.sin(math.radians(a)):.0f} 40 -380 Z" fill="{c}"/>'
    o += f'<circle cx="28" cy="-360" r="16" fill="#7A4A2A"/><circle cx="54" cy="-356" r="16" fill="#7A4A2A"/>'
    if lights:
        pts = [(-14, -60), (16, -110), (-6, -160), (24, -210), (6, -260), (34, -310)]
        o += '<path d="M' + ' L'.join(f'{a} {b}' for a, b in pts) + f'" stroke="{PUR}" stroke-width="3" fill="none"/>'
        o += ''.join(f'<circle cx="{a}" cy="{b}" r="11" fill="{[RED, YEL, TEAL][i % 3]}"/>' for i, (a, b) in enumerate(pts))
    return g(o, x, y, s)


def sapin(x, y, s=1, snow=False):
    o = f'<rect x="-22" y="-30" width="44" height="60" fill="{BROWN}"/>'
    for i, (w, yy) in enumerate([(200, -30), (165, -150), (125, -260)]):
        o += f'<path d="M{-w} {yy} L0 {yy - 170} L{w} {yy} Z" fill="{GREEN if i % 2 == 0 else "#2E9A5F"}"/>'
        if snow:
            o += f'<path d="M{-w * .55} {yy - 75} L0 {yy - 170} L{w * .55} {yy - 75} Q0 {yy - 95} {-w * .55} {yy - 75} Z" fill="white"/>'
    o += ''.join(f'<circle cx="{a}" cy="{b}" r="15" fill="{c}"/>' for a, b, c in
                 [(-90, -60, RED), (60, -80, YEL), (-40, -190, TEAL), (70, -200, RED), (0, -300, YEL), (-120, -40, YEL), (130, -45, TEAL)])
    o += f'<path d="M0 -470 l14 32 l34 3 l-26 22 l8 34 l-30 -18 l-30 18 l8 -34 l-26 -22 l34 -3 Z" fill="{YEL}"/>'
    return g(o, x, y, s)


def gift(x, y, s=1, c=RED, r=YEL):
    return g(f'<rect x="-60" y="-80" width="120" height="100" rx="8" fill="{c}"/><rect x="-70" y="-100" width="140" height="30" rx="6" fill="{c}"/>'
             f'<rect x="-10" y="-100" width="20" height="120" fill="{r}"/><path d="M0 -100 Q-50 -150 -40 -110 Z M0 -100 Q50 -150 40 -110 Z" fill="{r}"/>', x, y, s)


def beach_umbrella(x, y, s=1):
    return g(f'<line x1="0" y1="0" x2="0" y2="-260" stroke="{BROWN}" stroke-width="10"/>'
             f'<path d="M-170 -230 Q0 -380 170 -230 Z" fill="{RED}"/><path d="M-60 -230 Q0 -380 60 -230 Z" fill="white"/>', x, y, s)


def window(x, y, w, h, inside):
    return (f'<rect x="{x - 18}" y="{y - 18}" width="{w + 36}" height="{h + 36}" rx="18" fill="{BROWN}"/>'
            f'<clipPath id="win"><rect x="{x}" y="{y}" width="{w}" height="{h}" rx="6"/></clipPath>'
            f'<g clip-path="url(#win)"><rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{ICE}"/>{inside}</g>'
            f'<rect x="{x + w / 2 - 9}" y="{y}" width="18" height="{h}" fill="{BROWN}"/><rect x="{x}" y="{y + h / 2 - 9}" width="{w}" height="18" fill="{BROWN}"/>')


# ---------------- espace ----------------
def earth(x, y, r=70, tilt=-23.5, axis=True, equator=False, marks=()):
    land = (f'<path d="M{-r * .6} {-r * .5} q{r * .3} {-r * .3} {r * .55} {-r * .05} q{r * .1} {r * .35} {-r * .2} {r * .5} q{-r * .3} {r * .1} {-r * .35} {-r * .45} Z" fill="{GREEN}"/>'
            f'<path d="M{r * .1} {r * .05} q{r * .35} {-r * .15} {r * .5} {r * .15} q{-r * .05} {r * .45} {-r * .3} {r * .55} q{-r * .25} {-r * .3} {-r * .2} {-r * .7} Z" fill="{GREEN}"/>')
    o = (f'<clipPath id="ec{int(x)}{int(y)}"><circle r="{r}"/></clipPath><circle r="{r}" fill="#2F8FD8"/>'
         f'<g clip-path="url(#ec{int(x)}{int(y)})">{land}<ellipse cx="0" cy="{-r * .92}" rx="{r * .55}" ry="{r * .2}" fill="white"/>'
         f'<ellipse cx="0" cy="{r * .92}" rx="{r * .55}" ry="{r * .2}" fill="white"/></g>')
    if equator:
        o += f'<line x1="{-r}" y1="0" x2="{r}" y2="0" stroke="{RED}" stroke-width="{max(4, r * .04):.0f}" stroke-dasharray="{r * .1:.0f} {r * .06:.0f}"/>'
    if axis:
        o += f'<line x1="0" y1="{-r * 1.35}" x2="0" y2="{r * 1.35}" stroke="{PUR}" stroke-width="{max(3, r * .05):.0f}" stroke-linecap="round"/>'
    o += ''.join(m for m in marks)
    return g(o, x, y, 1, tilt)


def stars(seed=3, n=70):
    rnd = random.Random(seed)
    return ''.join(f'<circle cx="{rnd.uniform(0, W):.0f}" cy="{rnd.uniform(0, H):.0f}" r="{rnd.uniform(1.5, 4):.1f}" fill="white" opacity="{rnd.uniform(.4, 1):.2f}"/>' for _ in range(n))


def space_bg(content, title=None):
    o = f'<rect width="{W}" height="{H}" fill="#1E0B3A"/>' + stars()
    o += content
    o += (f'<rect x="28" y="22" width="276" height="70" rx="35" fill="{CREAM}"/>'
          f'<image x="40" y="34" width="250" height="46" href="data:image/png;base64,{_LOGO}"/>')
    if title:
        o += pill(W / 2, 64, title, TEAL)
    return svg(o)


# ---------------- interface ----------------
def season_wheel(x, y, r=300, hi=None, labels=True, arrow=None, plate=False):
    """Roue des saisons : printemps en haut à droite, puis sens des aiguilles."""
    order = ['printemps', 'ete', 'automne', 'hiver']
    o = ''
    if plate:
        o += f'<circle r="{r + 34}" fill="white" stroke="#E5DCCB" stroke-width="6"/>'
    for i, k in enumerate(order):
        a0, a1 = math.radians(-90 + 90 * i), math.radians(-90 + 90 * (i + 1))
        col = SEASON[k][1]
        op = 1 if (hi is None or hi == k) else .28
        o += (f'<path d="M0 0 L{r * math.cos(a0):.1f} {r * math.sin(a0):.1f} A{r} {r} 0 0 1 {r * math.cos(a1):.1f} {r * math.sin(a1):.1f} Z" '
              f'fill="{col}" opacity="{op}" stroke="white" stroke-width="8"/>')
        am = math.radians(-45 + 90 * i)
        ix, iy = r * .55 * math.cos(am), r * .55 * math.sin(am)
        ic = {'printemps': flower(0, 0, 1.3, 'white', YEL, False), 'ete': sun(0, 0, 44, False),
              'automne': leaf(0, 0, 1.1, 20, '#A93C06'), 'hiver': snowflake(0, 0, 1.3, 0, 'white')}[k]
        o += g(ic, ix, iy - (18 if labels else 0), r / 300, 0, op)
        if labels:
            o += g(text(0, 0, SEASON[k][0].replace("L'", "l'").replace('LE ', 'le ').lower().capitalize(), 34, 'white', FN), ix, iy + 62 * r / 300, r / 300 * .9, 0, op)
    o += f'<circle r="{r * .12}" fill="white"/>'
    if arrow is not None:
        o += g(f'<path d="M0 0 L0 {-r * .8}" stroke="{PUR}" stroke-width="{r * .07}" stroke-linecap="round"/>'
               f'<path d="M{-r * .1} {-r * .7} L0 {-r * .9} L{r * .1} {-r * .7} Z" fill="{PUR}"/><circle r="{r * .07}" fill="{YEL}"/>', 0, 0, 1, arrow)
    return g(o, x, y)


def countdown_circle(x, y, n, total, r=110):
    frac = n / total
    a = math.radians(-90 + 360 * frac)
    large = 1 if frac > .5 else 0
    arc = (f'<path d="M0 {-r - 16} A{r + 16} {r + 16} 0 {large} 1 {(r + 16) * math.cos(a):.1f} {(r + 16) * math.sin(a):.1f}" '
           f'stroke="{RED}" stroke-width="12" fill="none" stroke-linecap="round"/>') if 0 < frac < 1 else (
        f'<circle r="{r + 16}" stroke="{RED}" stroke-width="12" fill="none"/>' if frac >= 1 else '')
    return g(f'<circle r="{r + 16}" stroke="#EADFF0" stroke-width="12" fill="none"/>{arc}<circle r="{r}" fill="{PUR}"/>'
             + text(0, r * .36, str(n), r, YEL, FF), x, y)


def check(x, y, s=1):
    return g(f'<circle r="60" fill="{GREEN}"/><path d="M-28 2 L-8 24 L30 -22" stroke="white" stroke-width="14" fill="none" stroke-linecap="round" stroke-linejoin="round"/>', x, y, s)


def confetti(seed=1, n=80, t=0.0):
    rnd = random.Random(seed)
    o = ''
    for _ in range(n):
        x0, y0 = rnd.uniform(0, W), rnd.uniform(-300, H)
        y = (y0 + t * 420) % (H + 200) - 100
        c = rnd.choice([YEL, RED, TEAL, PUR, PINK])
        o += f'<rect x="{x0 + 30 * math.sin(t * 3 + x0):.0f}" y="{y:.0f}" width="18" height="10" rx="3" fill="{c}" transform="rotate({rnd.uniform(0, 180) + t * 200:.0f} {x0:.0f} {y:.0f})"/>'
    return o


def card(x, y, w, h, content='', fill='white', stroke=RED):
    return (f'<rect x="{x + 8}" y="{y + 10}" width="{w}" height="{h}" rx="26" fill="#000" opacity=".06"/>'
            f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="26" fill="{fill}" stroke="{stroke}" stroke-width="6"/>' + content)


def pause_badge(x, y):
    return g(f'<circle r="70" fill="{RED}"/><rect x="-26" y="-32" width="18" height="64" rx="6" fill="white"/><rect x="8" y="-32" width="18" height="64" rx="6" fill="white"/>'
             + text(0, 125, 'METS SUR PAUSE', 36, RED, FT), x, y)


def adult_badge(x, y):
    return g(f'<rect x="-210" y="-40" width="420" height="80" rx="40" fill="{YEL}"/>'
             + text(0, 14, 'Un adulte t\'aide', 38, PUR, FN), x, y)


# ---------------- bricolage ----------------
def plate(x, y, r=260, cross=False, drawings=0, hole=False, arrow=None, brad=False):
    o = (f'<circle r="{r}" fill="white" stroke="#E5DCCB" stroke-width="8"/><circle r="{r * .82}" fill="none" stroke="#F0E8DA" stroke-width="5"/>')
    if cross:
        o += (f'<line x1="0" y1="{-r * .95}" x2="0" y2="{r * .95}" stroke="{PUR}" stroke-width="9" stroke-linecap="round"/>'
              f'<line x1="{-r * .95}" y1="0" x2="{r * .95}" y2="0" stroke="{PUR}" stroke-width="9" stroke-linecap="round"/>')
    if drawings:
        q = r * .45
        items = [flower(q, -q - 10, .9 * r / 260, PINK), sun(q, q, 42 * r / 260, True), leaf(-q, q, 1.4 * r / 260, 25, ORANGE),
                 snowman(-q, -q + 95 * r / 260, .42 * r / 260)]
        o += ''.join(items[:drawings])
    if hole:
        o += f'<circle r="10" fill="#CBBFA8"/>'
    if arrow is not None:
        o += g(f'<path d="M-16 20 L-16 {-r * .55} L-40 {-r * .55} L0 {-r * .82} L40 {-r * .55} L16 {-r * .55} L16 20 Z" fill="#C79A5B" stroke="#9C7238" stroke-width="5"/>', 0, 0, 1, arrow)
    if brad:
        o += f'<circle r="20" fill="#D4A933" stroke="#9C7A1C" stroke-width="4"/>'
    return g(o, x, y)


def cardboard_arrow(x, y, s=1, rot=0):
    return g(f'<path d="M-24 120 L-24 -60 L-60 -60 L0 -140 L60 -60 L24 -60 L24 120 Z" fill="#C79A5B" stroke="#9C7238" stroke-width="6"/>'
             f'<circle cx="0" cy="95" r="9" fill="#9C7238"/>', x, y, s, rot)


def brad(x, y, s=1, open_=False):
    legs = (f'<path d="M-6 10 L-40 60" stroke="#C9A12C" stroke-width="12" stroke-linecap="round"/><path d="M6 10 L40 60" stroke="#C9A12C" stroke-width="12" stroke-linecap="round"/>'
            if open_ else f'<rect x="-12" y="10" width="10" height="110" rx="4" fill="#C9A12C"/><rect x="2" y="10" width="10" height="110" rx="4" fill="#C9A12C"/>')
    return g(legs + f'<circle r="34" fill="#E2BB45" stroke="#9C7A1C" stroke-width="5"/>', x, y, s)


def scissors(x, y, s=1, rot=0):
    return g(f'<path d="M0 0 L150 -40" stroke="#9AA6B2" stroke-width="18" stroke-linecap="round"/><path d="M0 0 L150 40" stroke="#B9C3CC" stroke-width="18" stroke-linecap="round"/>'
             f'<circle cx="-40" cy="-30" r="30" fill="none" stroke="{RED}" stroke-width="16"/><circle cx="-40" cy="30" r="30" fill="none" stroke="{RED}" stroke-width="16"/>', x, y, s, rot)


def marker(x, y, s=1, rot=0, color=RED):
    return g(f'<rect x="-20" y="-150" width="40" height="230" rx="14" fill="{color}"/><rect x="-20" y="-150" width="40" height="70" rx="14" fill="{PUR}"/>'
             f'<path d="M-14 80 L0 120 L14 80 Z" fill="{HAIR}"/>', x, y, s, rot)


def hand(x, y, s=1, rot=0):
    return g(f'<ellipse cx="0" cy="0" rx="70" ry="85" fill="{SKIN}"/>'
             + ''.join(f'<rect x="{dx}" y="-150" width="30" height="100" rx="15" fill="{SKIN}" transform="rotate({r} {dx + 15} -50)"/>' for dx, r in [(-62, -12), (-28, -4), (6, 4), (38, 12)])
             + f'<rect x="-120" y="-30" width="30" height="90" rx="15" fill="{SKIN}" transform="rotate(-50 -105 15)"/>', x, y, s, rot)
