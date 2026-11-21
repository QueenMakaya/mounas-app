"""Éléments afro : djembé, tata Awa la griotte, baobab, main aux voyelles, notes."""
from draw import *
import anim
WOOD, WOOD2, GREEN = '#8A4B22', '#5E3214', '#4FA35A'
VOY = 'aeiouyàâéèêëîïôùûœ'
CV, CC = TEALT, RED          # voyelles en vert, consonnes en rouge

def vc(word):
    """Mot colorié lettre par lettre pour rich() : voyelles en vert, consonnes en rouge."""
    return ''.join(('{1' if ch.lower() in VOY else '{2') + ch + '}' if ch.isalpha() else ch for ch in word)

def djembe(cx, cy, s=1, letter=None, lcol=RED):
    ropes = ''.join(f'<path d="M{x} -112 L{x+18} -30 L{x+36} -112" stroke="{YEL}" stroke-width="6" fill="none" stroke-linejoin="round"/>' for x in range(-108, 90, 36))
    g = (f'<path d="M-112 -118 L112 -118 C112 10 44 30 36 78 L74 205 L-74 205 L-36 78 C-44 30 -112 10 -112 -118Z" fill="{WOOD}" stroke="{WOOD2}" stroke-width="7"/>'
         f'<path d="M-66 190 L66 190" stroke="{PUR}" stroke-width="16"/><path d="M-40 78 L40 78" stroke="{YEL}" stroke-width="12"/>'
         f'{ropes}<path d="M-104 -26 L104 -26" stroke="{YEL}" stroke-width="7"/>'
         f'<ellipse cx="0" cy="-118" rx="112" ry="30" fill="#F7E8CC" stroke="{WOOD2}" stroke-width="7"/>')
    if letter: g += f'<circle cx="0" cy="-40" r="62" fill="#F7E8CC" stroke="{WOOD2}" stroke-width="6"/>' + text(0, -8, letter, 92, lcol, 'black')
    return f'<g transform="translate({cx} {cy}) scale({s})">{g}</g>'

def awa(x, y, sc=1.0, sing=False, L='down', R='out'):
    """Tata Awa, la griotte : foulard, grand boubou, boucles d'oreilles."""
    mouth = anim.MOUTHS['wide'] if sing else anim.MOUTHS['smile']
    wrap = (f'<path d="M-104 -30 C-120 -150 120 -150 104 -30 C60 -70 -60 -70 -104 -30Z" fill="{YEL}"/>'
            f'<ellipse cx="0" cy="-128" rx="78" ry="46" fill="{YEL}"/><ellipse cx="62" cy="-150" rx="40" ry="26" fill="{YEL}" transform="rotate(-25 62 -150)"/>'
            + ''.join(f'<circle cx="{cx}" cy="{cy}" r="9" fill="{PUR}"/>' for cx, cy in [(-60, -100), (-10, -140), (40, -105), (-30, -75), (20, -72), (70, -70), (-75, -55)]))
    def arm(side, pose):
        s = -1 if side == 'L' else 1
        d = {'down': f'M{s*128} 190 Q{s*175} 300 {s*150} 420', 'out': f'M{s*128} 190 Q{s*215} 200 {s*265} 130', 'up': f'M{s*128} 190 Q{s*200} 120 {s*180} -10'}[pose]
        return f'<path d="{d}" stroke="{SKIN}" stroke-width="36" stroke-linecap="round" fill="none"/>'
    g = (f'{arm("L", L)}{arm("R", R)}<rect x="-24" y="84" width="48" height="60" fill="{SKIN}"/>'
         f'<path d="M-118 134 Q-124 124 -108 124 H108 Q124 124 118 134 L165 520 H-165Z" fill="{PUR}"/>'
         + ''.join(f'<path d="M{-150 + i * 60} 470 l30 -40 l30 40" stroke="{YEL}" stroke-width="9" fill="none"/>' for i in range(5))
         + f'<path d="M-60 124 Q0 190 60 124" stroke="{YEL}" stroke-width="12" fill="none"/>'
         f'<circle cx="0" cy="0" r="98" fill="{SKIN}"/>{wrap}<circle cx="-98" cy="40" r="14" fill="{YEL}"/><circle cx="98" cy="40" r="14" fill="{YEL}"/>'
         f'[[EYES 0.3]]<circle cx="-58" cy="38" r="15" fill="{RED}" opacity=".45"/><circle cx="58" cy="38" r="15" fill="{RED}" opacity=".45"/>{mouth}')
    return f'<g data-char="awa" transform="translate({x} {y}) scale({sc})"><g [[BOB 0.7 4]]>{g}</g></g>'

def baobab(x, y, s=1):
    g = (f'<path d="M-70 0 C-40 -120 -60 -220 -120 -300 L-60 -290 L-30 -360 L0 -290 L40 -370 L60 -290 L130 -310 C60 -220 40 -120 70 0Z" fill="{WOOD}"/>'
         + ''.join(f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{GREEN}"/>' for cx, cy, r in [(-130, -330, 62), (-40, -390, 70), (50, -400, 66), (140, -340, 60), (0, -330, 60)]))
    return f'<g transform="translate({x} {y}) scale({s})">{g}</g>'

def note(x, y, s=1, col=TEALT, ph=0):
    return (f'<g transform="translate({x} {y}) scale({s})"><g [[BOB {ph} 9]]><ellipse cx="0" cy="0" rx="22" ry="16" fill="{col}" transform="rotate(-20)"/>'
            f'<path d="M19 -4 V-92 Q52 -84 56 -48" stroke="{col}" stroke-width="9" fill="none" stroke-linecap="round"/></g></g>')

def hand(cx, cy, s=1, letters='aeiou', n=5):
    """Une main ouverte : une voyelle sur chaque doigt (n = nombre de doigts déjà nommés)."""
    fingers = [(-150, -40, -48, 150), (-78, -150, -14, 210), (-8, -172, 0, 230), (62, -150, 14, 210), (124, -96, 28, 170)]
    g = f'<rect x="-110" y="-60" width="230" height="240" rx="70" fill="{SKIN}"/>'
    import math
    for i, (fx, fy, rot, ln) in enumerate(fingers):
        g += f'<g transform="rotate({rot} {fx} {fy + ln})"><rect x="{fx - 30}" y="{fy}" width="60" height="{ln}" rx="30" fill="{SKIN}"/></g>'
        if i < n:
            r = math.radians(rot); px, py = 0, -(ln + 46)
            tx = fx + px * math.cos(r) - py * math.sin(r); ty = fy + ln + px * math.sin(r) + py * math.cos(r)
            g += f'<circle cx="{tx:.0f}" cy="{ty:.0f}" r="42" fill="{CV}"/>' + text(round(tx), round(ty + 20), letters[i], 60, '#fff', 'black')
    return f'<g transform="translate({cx} {cy}) scale({s})">{g}</g>'

def thumb(cx, cy, s=1):
    g = (f'<rect x="-70" y="-10" width="150" height="130" rx="40" fill="{SKIN}"/><rect x="-70" y="-120" width="62" height="160" rx="31" fill="{SKIN}"/>'
         f'<circle cx="-39" cy="-170" r="42" fill="{CV}"/>' + text(-39, -152, 'y', 60, '#fff', 'black'))
    return f'<g transform="translate({cx} {cy}) scale({s})">{g}</g>'
