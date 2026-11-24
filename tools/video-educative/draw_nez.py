"""Éléments de l'épisode « Les sons du nez » : Samba l'éléphant, le balafon, la carte d'Afrique."""
from draw import *
from draw_afro import note, baobab, WOOD, WOOD2, GREEN
GREY, GREY2 = '#9AA3B2', '#6F7888'
CON, CAN, CIN, CUN = TEALT, RED, GOLD, PUR      # on · an · in · un
NEZ = {1: ('on', CON), 2: ('an', CAN), 3: ('in', CIN)}

def samba(cx, cy, s=1, sing=False):
    """Samba l'éléphant, vu de face : grandes oreilles, trompe levée quand il chante."""
    trunk = ('M0 50 C-10 170 90 230 190 170 C260 128 262 30 226 -30' if sing else 'M0 50 C-8 150 -14 240 20 290 C46 326 96 312 100 270')
    g = (f'<ellipse cx="0" cy="250" rx="190" ry="170" fill="{GREY}"/>'
         f'<rect x="-150" y="330" width="90" height="150" rx="36" fill="{GREY2}"/><rect x="60" y="330" width="90" height="150" rx="36" fill="{GREY2}"/>'
         f'<ellipse cx="-190" cy="-10" rx="130" ry="170" fill="{GREY2}"/><ellipse cx="190" cy="-10" rx="130" ry="170" fill="{GREY2}"/>'
         f'<ellipse cx="-190" cy="-10" rx="86" ry="120" fill="#F7A1C0" opacity=".55"/><ellipse cx="190" cy="-10" rx="86" ry="120" fill="#F7A1C0" opacity=".55"/>'
         f'<ellipse cx="0" cy="0" rx="150" ry="160" fill="{GREY}"/>'
         f'<path d="M-70 90 Q-110 150 -84 196" stroke="#FFF8E8" stroke-width="26" fill="none" stroke-linecap="round"/><path d="M70 90 Q110 150 84 196" stroke="#FFF8E8" stroke-width="26" fill="none" stroke-linecap="round"/>'
         f'<path d="{trunk}" stroke="{GREY2}" stroke-width="78" fill="none" stroke-linecap="round"/><path d="{trunk}" stroke="{GREY}" stroke-width="64" fill="none" stroke-linecap="round"/><path d="{trunk}" stroke="{GREY2}" stroke-width="6" fill="none" stroke-linecap="round" stroke-dasharray="2 26" opacity=".6"/>'
         f'<circle cx="-62" cy="-30" r="20" fill="#fff"/><circle cx="62" cy="-30" r="20" fill="#fff"/><circle cx="-58" cy="-26" r="10" fill="{HAIR}"/><circle cx="66" cy="-26" r="10" fill="{HAIR}"/>'
         f'<circle cx="-104" cy="30" r="18" fill="{RED}" opacity=".35"/><circle cx="104" cy="30" r="18" fill="{RED}" opacity=".35"/>')
    return f'<g data-char="samba" transform="translate({cx} {cy}) scale({s})"><g [[BOB 0.5 5]]>{g}</g></g>'

def balafon(cx, cy, s=1, n=7):
    """Un balafon : des lames en bois de plus en plus courtes, des calebasses dessous, deux baguettes."""
    g = f'<path d="M-330 -70 L330 -40 L330 40 L-330 70Z" fill="none" stroke="{WOOD2}" stroke-width="12" stroke-linejoin="round"/>'
    cols = [TEAL, RED, YEL, PUR, TEAL, RED, YEL]
    for i in range(n):
        x = -290 + i * 96; h = 230 - i * 22
        g += f'<circle cx="{x}" cy="{h/2 + 34}" r="{30 - i * 2}" fill="{YEL}" stroke="{GOLD}" stroke-width="5"/>'
        g += f'<rect x="{x - 36}" y="{-h/2}" width="72" height="{h}" rx="14" fill="{WOOD}" stroke="{WOOD2}" stroke-width="6"/><rect x="{x - 36}" y="{-h/2 + 16}" width="72" height="14" fill="{cols[i]}"/>'
    g += (f'<path d="M-200 -210 L-110 -70" stroke="{WOOD2}" stroke-width="12" stroke-linecap="round"/><circle cx="-110" cy="-70" r="22" fill="{PUR}"/>'
          f'<path d="M210 -200 L120 -66" stroke="{WOOD2}" stroke-width="12" stroke-linecap="round"/><circle cx="120" cy="-66" r="22" fill="{PUR}"/>')
    return f'<g transform="translate({cx} {cy}) scale({s})">{g}</g>'

def lame(x, y, w, h, n, graph=True, hl=False, words=()):
    """Une lame du balafon à fabriquer : une couleur et un son."""
    g_, c = NEZ[n]
    o = (f'<rect x="{x - 14}" y="{y - 14}" width="{w + 28}" height="{h + 28}" rx="34" fill="{c}" opacity=".25"/>' if hl else '')
    o += f'<rect x="{x + 8}" y="{y + 10}" width="{w}" height="{h}" rx="24" fill="#000" opacity=".08"/><rect x="{x}" y="{y}" width="{w}" height="{h}" rx="24" fill="#fff" stroke="{c}" stroke-width="9"/>'
    o += f'<rect x="{x}" y="{y}" width="{w}" height="{min(h * .26, 110)}" rx="24" fill="{c}"/>'
    if graph: o += text(x + w / 2, y + min(h * .26, 110) * .78, g_, int(min(h * .26, 110) * .8), '#fff')
    for i, wd in enumerate(words):
        o += rich(x + w / 2, y + min(h * .26, 110) + 70 + i * 74, wd, 54, c)
    return o

AFR = 'M22 8 C34 2 44 4 50 3 C56 6 58 10 64 9 C68 8 70 8 72 9 C76 16 78 22 80 26 C82 30 84 34 86 36 C92 36 96 36 98 38 C96 44 92 48 88 52 C86 58 84 62 82 66 C82 72 82 74 80 78 C76 84 74 90 70 94 C66 98 62 99 58 98 C54 94 52 90 50 86 C48 80 47 76 46 70 C46 64 45 60 44 56 C42 52 41 50 40 48 C38 46 36 46 34 46 C30 48 26 48 22 48 C18 48 14 48 10 46 C6 42 4 38 3 34 C3 30 4 26 5 22 C10 16 16 12 22 8Z'
PAYS = {'Bénin': (30, 43), 'Gabon': (44, 57), 'Congo': (57, 58), 'Soudan': (69, 30), 'Ouganda': (72, 55)}
def afrique(cx, cy, size=700, pins=()):
    """Carte simplifiée de l'Afrique avec des repères. pins : (pays, numéro du son, texte en couleurs pour rich())."""
    k = size / 100
    o = f'<g transform="translate({cx - size / 2} {cy - size / 2}) scale({k})"><path d="{AFR}" fill="#F6D9A6" stroke="{GOLD}" stroke-width=".9" stroke-linejoin="round"/></g>'
    for name, n, lab in pins:
        px, py = PAYS[name]; x = cx - size / 2 + px * k; y = cy - size / 2 + py * k; c = NEZ[n][1]
        o += f'<circle cx="{x:.0f}" cy="{y:.0f}" r="20" fill="{c}" stroke="#fff" stroke-width="5"/>'
    return o
def pays_xy(cx, cy, size, name):
    k = size / 100; px, py = PAYS[name]; return cx - size / 2 + px * k, cy - size / 2 + py * k
