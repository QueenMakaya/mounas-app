"""Animation : les écrans contiennent des jetons [[NOM args]] remplacés image par image."""
import re, math, random
HAIR, RED_ = '#2A1A12', '#F30041'
PAL = ['#FEBD57', '#F30041', '#4D0065', '#00CFBF']
TOK = re.compile(r'\[\[(\w+)([^\]]*)\]\]')
P = '<!--P-->'

def ease(x):
    x = min(1.0, max(0.0, x)); return 1 - (1 - x) ** 3
def back(x):
    x = min(1.0, max(0.0, x)); c = 1.9
    return 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2

MOUTHS = {'smile': '<path d="M-22 26 Q0 48 22 26 Q0 34 -22 26Z" fill="#fff"/>',
          'o': '<ellipse cx="0" cy="34" rx="11" ry="13" fill="#3A1410"/>',
          'wide': '<ellipse cx="0" cy="34" rx="20" ry="17" fill="#3A1410"/><ellipse cx="0" cy="41" rx="11" ry="6" fill="#E0566F"/>',
          'flat': '<ellipse cx="0" cy="34" rx="15" ry="7" fill="#3A1410"/>',
          'mid': '<ellipse cx="0" cy="34" rx="17" ry="11" fill="#3A1410"/><ellipse cx="0" cy="39" rx="9" ry="4" fill="#E0566F"/>'}
EYES_OPEN = (f'<circle cx="-30" cy="-2" r="15" fill="#fff"/><circle cx="30" cy="-2" r="15" fill="#fff"/>'
             f'<circle cx="-28" cy="0" r="8" fill="{HAIR}"/><circle cx="32" cy="0" r="8" fill="{HAIR}"/>')
EYES_SHUT = (f'<path d="M-44 -1 q14 9 28 0 M16 -1 q14 9 28 0" stroke="{HAIR}" stroke-width="5" fill="none" stroke-linecap="round"/>')

def prepare(svg, prev):
    """Les morceaux nouveaux par rapport à l'écran précédent entrent en douceur, l'un après l'autre."""
    if P not in svg: return svg
    strip = lambda s: re.sub(r'^<!--AT [\d.]+-->', '', s)
    parts = svg.split(P); old = set(strip(x) for x in prev.split(P)) if prev else set()
    title = lambda s: (re.search(r'<!--T:(.*?)-->', s) or [None, ''])[1]
    new_section = (not prev) or title(prev) != title(svg)
    out = [parts[0]]; k = 0
    for p in parts[1:-1]:
        m = re.match(r'<!--AT ([\d.]+)-->', p)
        if p in old and not m:      # déjà à l'écran : ne bouge pas
            out.append(p); continue
        if 'data-char' in p and not new_section and not m:
            out.append(p); continue
        d = float(m.group(1)) if m else min(0.6, 0.1 + 0.09 * k); k += 0 if m else 1
        out.append(f'<g [[IN {d:.2f}]]>{p}</g>')
    return ''.join(out) + parts[-1]

def resolve(tpl, t, dur, tg, lvl, prog):
    def f(m):
        name, a = m.group(1), m.group(2).split()
        if name == 'IN':
            e = ease((t - float(a[0])) / 0.38)
            return f'transform="translate(0 {28 * (1 - e):.1f})" opacity="{e:.3f}"'
        if name == 'BOB':
            amp = float(a[1]) * (1.6 if lvl > 0.12 else 1.0)
            return f'transform="translate(0 {amp * math.sin(2 * math.pi * (0.42 * tg + float(a[0]))):.1f})"'
        if name == 'MOUTH':
            if a[0] == 'mute': return MOUTHS['smile']
            if lvl > 0.10:
                return MOUTHS[['mid', 'wide', 'o', 'mid', 'flat'][int(tg * 9) % 5] if lvl > 0.3 else ['mid', 'flat', 'o'][int(tg * 9) % 3]]
            return MOUTHS[a[0]]
        if name == 'EYES':
            ph = (tg + float(a[0]) * 1.7) % 3.6
            return EYES_SHUT if ph < 0.13 else EYES_OPEN
        if name == 'HOP':
            h = abs(math.sin(math.pi * min(1.0, t / max(dur, 0.01)))) * float(a[0])
            return f'transform="translate(0 {-h:.1f})"'
        if name == 'PULSE':
            s = 1 + 0.07 * math.sin(2 * math.pi * 1.1 * tg); cx, cy = a
            return f'transform="translate({cx} {cy}) scale({s:.3f}) translate(-{cx} -{cy})"'
        if name == 'RING':
            cx, cy, r = map(float, a); fr = max(0.0, 1 - t / dur); ang = 2 * math.pi * fr
            if fr > 0.999: return f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="#F30041" stroke-width="14"/>'
            x = cx + r * math.sin(ang); y = cy - r * math.cos(ang)
            return f'<path d="M{cx} {cy - r} A{r} {r} 0 {1 if fr > .5 else 0} 1 {x:.1f} {y:.1f}" fill="none" stroke="#F30041" stroke-width="14" stroke-linecap="round"/>'
        if name == 'PROG':
            return f'<rect x="0" y="1070" width="1920" height="10" fill="#EADFCF"/><rect x="0" y="1070" width="{1920 * prog:.1f}" height="10" rx="5" fill="#00CFBF"/>'
        if name == 'CONF':
            r = random.Random(int(a[0])); o = []
            for _ in range(int(a[1])):
                x, y0, v, rot, w = r.randint(20, 1900), r.randint(0, 1080), r.uniform(90, 240), r.randint(0, 180), r.uniform(.6, 1.6)
                y = (y0 + v * tg) % 1120 - 20; xx = x + 22 * math.sin(tg * w + rot)
                o.append(f'<rect x="{xx:.0f}" y="{y:.0f}" width="13" height="7" fill="{r.choice(PAL)}" transform="rotate({rot + tg * 90 * w:.0f} {xx:.0f} {y:.0f})"/>')
            return ''.join(o)
        if name == 'WAVE':
            return f'transform="rotate({10 * max(0.0, 1 - t / 1.8) * math.sin(2 * math.pi * 1.6 * t):.1f} {a[0]} {a[1]})"'
        return ''
    return TOK.sub(f, tpl)

def dynamic(tpl):
    return bool(TOK.search(tpl))
