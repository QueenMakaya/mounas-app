"""Épisode « Les sons du nez » : on · an · in (et le retour de un)."""
import sys
from engine import say as _say, hold, countdown, render, total, T, LINES
from draw import *
from draw_nez import *
_sec = ['x']; _n = [0]
def S(name): _sec[0] = name; _n[0] = 0
def say(*a, **k):
    if 'key' in k: return _say(*a, **k)
    key = f'{_sec[0]}{_n[0]}'; _n[0] += 1
    return _say(*a, key=key, **k)
def scr(title, col, *parts, deco=True): return svg(bg(title, col, deco), *parts)
def h1(s, y=230, col=RED, size=64): return text(960, y, s, size, col)
def toi(x=960, y=900): return pill(x - 40, y, 'À toi !', RED, 60) + f'[[RING {x + 200} {y + 52} 40]]'
def cdn(k, x=230, y=470): return (f'<circle cx="{x}" cy="{y}" r="90" fill="{YEL}"/>' + text(x, y + 42, str(k), 120, PUR, 'fr') + f'[[RING {x} {y} 104]]') if k else ''
def trio(y=900, hl=None, r=58):
    """Les trois pastilles 1 on · 2 an · 3 in, en bas d'écran."""
    out = []
    for n, x in zip((1, 2, 3), (560, 960, 1360)):
        g, c = NEZ[n]
        if hl == n: out.append(f'<circle cx="{x}" cy="{y}" r="{r+62}" fill="{c}" opacity=".18" [[PULSE {x} {y}]]/>')
        out.append(f'<g opacity="{1 if hl in (None, n) else .35}">{badge(x - r*1.07, y, n, c, r)}{text(x + r, y + r*.48, g, int(r*1.45), c)}</g>')
    return ''.join(out)
def nose(cx, cy, s=1):
    return f'<g transform="translate({cx} {cy}) scale({s})"><path d="M0 -90 C-10 -20 -70 20 -60 60 C-50 100 50 100 60 60 C70 20 10 -20 0 -90Z" fill="{SKIN}"/><ellipse cx="-26" cy="62" rx="14" ry="10" fill="{HAIR}"/><ellipse cx="26" cy="62" rx="14" ry="10" fill="{HAIR}"/></g>'

# ============ 0. PAGE TITRE ============
def ouverture():
    big = ''; cx = 960 - width('MOUNAS', 150) / 2
    for ch, col in zip('MOUNAS', [YEL, TEAL, YEL, RED, PUR, RED]):
        big += text(cx, 240, ch, 150, col, 'black', 'start'); cx += width(ch, 150) + 2
    return svg(bg(None, prog=False).replace(logo(), ''), confetti(41, 60), big,
               text(700, 470, 'Les sons du nez', 150, PUR), pill(700, 530, 'on · an · in', RED, 60),
               badge(420, 800, 1, CON, 90), badge(700, 800, 2, CAN, 90), badge(980, 800, 3, CIN, 90),
               samba(1480, 560, .85, sing=True))
S('titre')
hold(ouverture(), 1.0, 'tada')
say(ouverture(), "Les sons du nez !")
hold(ouverture(), 0.8)

# ============ 1. ACCROCHE ============
S('intro')
say(svg(bg(None), confetti(4), text(760, 360, 'Pose un doigt', 130, PUR), text(760, 500, 'sur ton nez !', 130, PUR), nose(760, 760, 1.5), amara(1500, 520, 1.15, R='nose')),
    "Coucou ! C'est Amara. Pose un doigt sur ton nez. Prêt ? Prête ?")
say(scr('LES SONS DU NEZ', PUR, h1('Trois sons qui passent par le nez', 260, PUR),
        *[at(t_, badge(x - 150, 580, n, NEZ[n][1], 80) + text(x + 40, 630, NEZ[n][0], 170, NEZ[n][1])) for n, x, t_ in ((1, 420, 3.2), (2, 960, 3.9), (3, 1500, 4.6))], amara(960, 900, .5, L='up', R='up')),
    "Aujourd'hui, on découvre trois sons qui passent par le nez : on, an, in.", "Aujourd'hui, on découvre trois sons qui passent par le nez : on, an, hein.")
def bala3(x=560, y=420, w=250, h=460, hl=None, words=None, gap=30):
    return ''.join(lame(x + i * (w + gap), y, w, h, n, hl=(hl == n), words=(words or {}).get(n, ())) for i, n in enumerate((1, 2, 3)))
say(scr('À LA FIN DE LA VIDÉO', TEAL, h1('Tu vas fabriquer ton balafon des sons du nez', 250), bala3(420, 360, 260, 480), balafon(1500, 420, .5), amara(1560, 780, .6, R='out')),
    "Et à la fin, tu vas fabriquer ton balafon des sons du nez !")

# ============ 2. MOT AUX PARENTS ============
S('parents')
def mat(i, label, sub, icon):
    x = 250 + i * 370
    return (card(x, 330, 310, 360, [TEAL, RED, YEL, PUR][i]) + icon(x + 155, 480) + text(x + 155, 625, label, 34, PUR, 'nx') + text(x + 155, 665, sub, 26, '#7A6A80', 'nb'))
def i_sheets(cx, cy): return ''.join(f'<rect x="{cx-60+d}" y="{cy-85-d/2}" width="110" height="145" rx="6" fill="#fff" stroke="{PUR}" stroke-width="5"/>' for d in (-14, 14))
def i_pens(cx, cy):
    return ''.join(f'<g transform="rotate({a} {cx} {cy})"><rect x="{cx-11}" y="{cy-80}" width="22" height="130" rx="8" fill="{c}"/><path d="M{cx-9} {cy+50} L{cx} {cy+78} L{cx+9} {cy+50}Z" fill="{PUR}"/></g>' for a, c in ((-22, CON), (0, CAN), (22, YEL)))
def i_cis(cx, cy):
    return (f'<circle cx="{cx-28}" cy="{cy+45}" r="26" fill="none" stroke="{RED}" stroke-width="10"/><circle cx="{cx+28}" cy="{cy+45}" r="26" fill="none" stroke="{RED}" stroke-width="10"/>'
            f'<path d="M{cx-18} {cy+22} L{cx+26} {cy-88} M{cx+18} {cy+22} L{cx-26} {cy-88}" stroke="#9AA" stroke-width="10" stroke-linecap="round"/>')
def i_fiche(cx, cy): return f'<rect x="{cx-58}" y="{cy-80}" width="116" height="150" rx="6" fill="#fff" stroke="{PUR}" stroke-width="5"/><path d="M{cx-36} {cy-40} h72 M{cx-36} {cy-10} h72 M{cx-36} {cy+20} h50" stroke="{PUR}" stroke-width="6" stroke-linecap="round"/>'
materiel = scr('MOT AUX PARENTS', PUR, h1('Matériel de l\'atelier', 240, PUR),
               mat(0, 'deux feuilles', 'de papier', i_sheets), mat(1, 'trois feutres', 'vert, rouge, jaune', i_pens),
               mat(2, 'des ciseaux', 'pour un adulte', i_cis), mat(3, 'la fiche', 'à imprimer (facultatif)', i_fiche),
               pill(960, 800, 'La fiche, le balafon et les cartes : dans la communauté Skool', PUR, 34))
say(materiel, "Bonjour les parents ! Pour l'atelier, préparez deux feuilles de papier, trois feutres, un vert, un rouge et un jaune, et des ciseaux pour un adulte.")
say(materiel, "La fiche à imprimer, avec le balafon et les cartes à découper, vous attend dans la communauté Les Mounas, sur Skool.")

# ============ 3. SAMBA L'ÉLÉPHANT ============
S('r')
def savane(k=0):
    it = [baobab(330, 760, .9), baobab(1700, 740, .6)]
    it.append(samba(960, 430, .8, sing=(k >= 2)))
    if k == 1: it.append(pill(960, 250, 'le plus grand nez de la savane : sa trompe !', PUR, 44))
    if k == 2: it += [at([3.4, 4.3, 5.2][i], text(1250 + i * 190, 330 - (i % 2) * 70, NEZ[n][0], 130, NEZ[n][1])) for i, n in enumerate((1, 2, 3))] + [note(1180, 200, .9), note(1760, 220, .9, CON, .4)]
    return svg(bg('DANS LA SAVANE', TEAL, deco=False), f'<rect x="0" y="740" width="1920" height="340" fill="#E9D58A"/>', *it, amara(1500, 700, .62, L='hip', R='out'), kofi(1680, 720, .58, L='out', R='hip'))
say(savane(0), "Dans la savane, tout près de Mounaville, vit Samba l'éléphant.")
say(savane(1), "Samba a le plus grand nez de toute la savane : sa trompe !")
say(savane(2), "Et avec sa trompe, Samba chante trois sons : on... an... in...", "Et avec sa trompe, Samba chante trois sons : on, an, hein.", sfx_name='chant')
say(scr('TU TE SOUVIENS ?', PUR, h1('Le son « un » passe aussi par le nez', 250, PUR), badge(640, 560, 1, CUN, 110), text(960, 640, 'un', 300, CUN), rich(1400, 600, 'l|un|di', 110, RED),
        pill(960, 800, 'aujourd\'hui, il a trois nouveaux amis', PUR, 44)),
    "Tu te souviens du son un, comme dans lundi ? Lui aussi passe par le nez. Aujourd'hui, il a trois nouveaux amis.")

# ============ 4. L'ASTUCE DU NEZ PINCÉ ============
def pince(g, c, pinch, tip, t=False, mouth='o'):
    return scr('L\'ASTUCE DU NEZ PINCÉ', YEL, text(620, 600, f'« {g} »', 300, c), pill(620, 720, tip, PUR, 40), toi(620, 820) if t else '',
               amara(1380, 470, 1.25, L='down', R='nose' if pinch else 'down', mouth=mouth))
say(pince('o', PUR, False, 'dis-le une première fois'), "Voici l'astuce du nez pincé. Dis : o.", sfx_name='tada')
hold(pince('o', PUR, False, 'dis-le une première fois', t=True), 2.4, 'pop')
say(pince('o', PUR, True, 'nez pincé : rien ne change'), "Maintenant, pince ton nez, et dis encore : o. Rien ne change !")
hold(pince('o', PUR, True, 'nez pincé : rien ne change', t=True), 2.4, 'pop')
say(pince('on', CON, True, 'nez pincé : ça fait tout drôle !'), "Garde ton nez pincé, et dis : on.")
hold(pince('on', CON, True, 'nez pincé : ça fait tout drôle !', t=True), 2.6, 'pop')
say(pince('on', CON, False, 'c\'est un son du nez', mouth='smile'), "Ça fait tout drôle ! Le son on passe par ton nez. C'est un son du nez.", sfx_name='ding')

# ============ 5. LES TROIS SONS ============
ORD = ['', 'PREMIER SON DU NEZ', 'DEUXIÈME SON DU NEZ', 'TROISIÈME SON DU NEZ']
MOUTH = {1: 'o', 2: 'wide', 3: 'flat'}
def son_intro(n):
    g, c = NEZ[n]
    return scr(ORD[n], c, badge(520, 520, n, c, 120), text(960, 620, g, 340, c), amara(1500, 470, 1.0, L='down', R='up', mouth=MOUTH[n]))
def lettres(n, a, b):
    g, c = NEZ[n]
    return scr(ORD[n], c, h1(f'Le son « {g} » s\'écrit {a}, {b}', 250, c),
               card(360, 400, 220, 260, PUR) + text(470, 590, a, 190, PUR), text(660, 580, '+', 130, '#7A6A80', 'fr'),
               card(740, 400, 220, 260, PUR) + text(850, 590, b, 190, PUR), text(1040, 580, '=', 130, '#7A6A80', 'fr'),
               card(1120, 400, 330, 260, c, sw=9) + text(1285, 590, g, 190, c), amara(1680, 540, .8, L='down', R='down', mouth=MOUTH[n]), trio(900, n))
def repete(n, tip, t=False):
    g, c = NEZ[n]
    return scr('RÉPÈTE APRÈS MOI', c, text(680, 620, f'« {g} »', 300, c), amara(1400, 480, 1.25, L='down', R='down', mouth=MOUTH[n]), pill(680, 740, tip, PUR, 38), toi(680, 840) if t else '')
def mots(n, title, ws, sub=None, size=110, ts=None, gr=None):
    g, c = NEZ[n]
    xs = {1: [960], 2: [640, 1280], 3: [420, 960, 1500], 4: [330, 750, 1170, 1590]}[len(ws)]
    left = (card(120, 300, 250, 190, c, sw=9) + text(245, 440, gr, 120, c)) if gr else ''
    return scr(title, c, h1(sub, 250, c) if sub else '', left, *[(at(ts[i], rich(x, 620, s, size, c)) if ts else rich(x, 620, s, size, c)) for i, (x, s) in enumerate(zip(xs, ws))], trio(900, n))
# --- on ---
say(son_intro(1), "Premier son du nez : on.", sfx_name='whoosh')
say(lettres(1, 'o', 'n'), "Le son on s'écrit o, n.", "Le son on s'écrit o, ène.")
say(repete(1, 'ta bouche fait un rond, comme un ballon'), "Ta bouche fait un rond, comme un ballon. Répète après moi : on !")
hold(repete(1, 'ta bouche fait un rond, comme un ballon', True), 2.6, 'pop')
say(mots(1, 'LE SON « ON »', ['mout|on|', 'ball|on|', 'balaf|on|'], 'On l\'entend dans...'), "On l'entend dans mouton, dans ballon, et dans balafon.")
say(scr('LE SAVAIS-TU ?', YEL, h1('Le balafon vient d\'Afrique de l\'Ouest', 250, PUR), balafon(960, 600, 1.15), pill(960, 880, 'on tape sur des lames en bois', PUR, 44)),
    "Le balafon, c'est un instrument d'Afrique de l'Ouest : on tape sur des lames en bois.", sfx_name='chant')
# --- an ---
say(son_intro(2), "Deuxième son du nez : an.", sfx_name='whoosh')
say(lettres(2, 'a', 'n'), "Le son an s'écrit a, n.", "Le son an s'écrit a, ène.")
say(repete(2, 'ta bouche s\'ouvre en grand, comme chez le dentiste'), "Ta bouche s'ouvre en grand, comme chez le dentiste. Répète après moi : an !")
hold(repete(2, 'ta bouche s\'ouvre en grand, comme chez le dentiste', True), 2.6, 'pop')
say(mots(2, 'LE SON « AN »', ['mam|an|', 'm|an|gue'], 'On l\'entend dans...', 130), "On l'entend dans maman, et dans mangue.")
say(mots(2, 'LE SON « AN »', ['d|en|t', 'v|en|t', '|en|f|an|t'], 'Mais aussi e, n', 120, gr='en'), "Mais il s'écrit aussi e, n, comme dans dent, et dans vent. Et dans enfant, il y a les deux !",
    "Mais il s'écrit aussi e, ène, comme dans dent, et dans vent. Et dans enfant, il y a les deux !")
# --- in ---
say(son_intro(3), "Troisième son du nez : in.", "Troisième son du nez : hein.", sfx_name='whoosh')
say(lettres(3, 'i', 'n'), "Le son in s'écrit i, n.", "Le son hein s'écrit i, ène.")
say(repete(3, 'ta bouche s\'étire, comme pour un sourire'), "Ta bouche s'étire, comme pour un sourire. Répète après moi : in !", "Ta bouche s'étire, comme pour un sourire. Répète après moi : hein !")
hold(repete(3, 'ta bouche s\'étire, comme pour un sourire', True), 2.6, 'pop')
say(mots(3, 'LE SON « IN »', ['lap|in|', 'mat|in|'], 'On l\'entend dans...', 130), "On l'entend dans lapin, et dans matin.")
say(mots(3, 'LE SON « IN »', ['p|ain|', 'm|ain|'], 'Et parfois a, i, n', 130, gr='ain'), "Et parfois, il s'écrit a, i, n, comme dans pain, et dans main.", "Et parfois, il s'écrit a, i, ène, comme dans pain, et dans main.")

# ============ 6. L'ASTUCE DU M ============
say(scr('L\'ASTUCE', YEL, h1('Devant un b ou un p, le n se déguise en m', 250, PUR),
        card(430, 380, 240, 240, PUR) + text(550, 560, 'n', 190, PUR), '<path d="M720 510 H850 M810 465 L860 510 L810 555" stroke="#7A6A80" stroke-width="18" fill="none" stroke-linecap="round" stroke-linejoin="round"/>', card(910, 380, 240, 240, RED, sw=9) + text(1030, 560, 'm', 190, RED),
        text(1330, 480, 'devant', 60, PUR, 'nx'), text(1330, 600, 'b  p', 150, PUR), samba(1700, 760, .32)),
    "Astuce : devant un b ou un p, le n se déguise en m.", "Astuce : devant un bé ou un pé, le ène se déguise en ème.", sfx_name='ding')
say(scr('L\'ASTUCE', YEL, h1('Devant un b ou un p, le n se déguise en m', 250, PUR),
        rich(480, 520, 't|am|bour', 120, CAN), rich(1440, 520, 'p|om|pier', 120, CON), rich(480, 760, 't|im|bre', 120, CIN), rich(1440, 760, 'S|am|ba', 120, CAN), samba(960, 560, .42)),
    "Tambour. Pompier. Timbre. Et même Samba !")

# ============ 7. LE PIÈGE ============
piege = scr('ATTENTION, UN PIÈGE !', RED, h1('Une voyelle juste après le n : plus de son du nez', 250, RED, 56),
            rich(560, 540, 'ban|ane|', 160, RED), rich(1360, 540, 'sav|ane|', 160, RED), cross(560, 660), cross(1360, 660),
            pill(960, 790, 'pince ton nez : rien ne change', PUR, 40))
say(piege, "Attention, un piège ! S'il y a une voyelle juste après le n, le son du nez disparaît.", "Attention, un piège ! S'il y a une voyelle juste après le ène, le son du nez disparaît.", sfx_name='oops')
say(piege, "Banane. Savane. Pince ton nez : rien ne change. Ce ne sont pas des sons du nez.")

# ============ 8. LE VOYAGE DE SAMBA ============
def voyage(k):
    rows = [('Congo', 1, 'C|on|go'), ('Gabon', 1, 'Gab|on|'), ('Soudan', 2, 'Soud|an|'), ('Ouganda', 2, 'Oug|an|da'), ('Bénin', 3, 'Bén|in|')]
    show = rows[:[0, 2, 4, 5][k]]
    o = [afrique(700, 620, 760, [(n_, s_, '') for n_, s_, _ in show])]
    for i, (n_, s_, lab) in enumerate(show):
        o.append(card(1180, 300 + i * 132, 560, 112, NEZ[s_][1], sw=6, rx=22) + rich(1460, 380 + i * 132, lab, 74, NEZ[s_][1]))
    return scr('LE VOYAGE DE SAMBA', TEAL, *o, samba(250, 820, .3))
say(voyage(0), "Samba part en voyage à travers l'Afrique. Écoute bien le nom des pays !", sfx_name='whoosh')
say(voyage(1), "Au Congo et au Gabon, on entend : on.")
say(voyage(2), "Au Soudan et en Ouganda, on entend : an.")
say(voyage(3), "Et au Bénin, on entend : in.", "Et au Bénin, on entend : hein.")

# ============ 9. LA DANSE DE SAMBA ============
GESTE = {1: 'fais un rond avec tes bras', 2: 'ouvre grand les bras', 3: 'les oreilles de lapin'}
say(scr('DEBOUT ! LA DANSE DE SAMBA', TEAL, h1('On joue avec tout le corps', 260, TEALT), amara(760, 520, 1.1, L='up', R='up'), samba(1300, 520, .6, sing=True)),
    "Debout ! C'est la danse de Samba.", sfx_name='tada')
def regles():
    o = []
    for n, x in zip((1, 2, 3), (400, 960, 1520)):
        g, c = NEZ[n]
        o.append(at([0, .9, 4.0, 7.0][n], card(x - 240, 330, 480, 440, c, sw=8) + text(x, 480, f'« {g} »', 120, c) + lines(x, 600, {1: ['un rond', 'avec tes bras'], 2: ['les bras', 'grands ouverts'], 3: ['des oreilles', 'de lapin']}[n], 50, PUR, 'nx')))
    return scr('DEBOUT ! LA DANSE DE SAMBA', TEAL, h1('Écoute le mot, et danse !', 240, TEALT), *o)
say(regles(), "Si tu entends on, fais un rond avec tes bras. Si tu entends an, ouvre grand les bras. Si tu entends in, fais des oreilles de lapin.",
    "Si tu entends on, fais un rond avec tes bras. Si tu entends an, ouvre grand les bras. Si tu entends hein, fais des oreilles de lapin.")
def danse(word, n=None, hop=False, k=None):
    c = NEZ[n][1] if n else PUR
    pose = {None: ('down', 'down'), 1: ('up', 'up'), 2: ('out', 'out'), 3: ('up', 'up')}[n]
    return scr('DEBOUT ! LA DANSE DE SAMBA', TEAL,
               (rich(700, 520, word, 170, c) if n else text(700, 540, '?', 260, PUR)),
               (text(700, 690, GESTE[n] + ' !', 64, c) if n else pill(700, 640, 'écoute bien...', PUR, 44)), cdn(k, 230, 470),
               f'<ellipse cx="1420" cy="975" rx="150" ry="20" fill="#000" opacity=".12"/>',
               f'<g [[HOP {110 if hop else 0}]]>' + amara(1420, 460, 1.1, L=pose[0], R=pose[1]) + '</g>')
for word, plain, n, phrase, alt in [('mout|on|', 'Mouton.', 1, 'Mouton : on ! Fais un rond !', None), ('mam|an|', 'Maman.', 2, 'Maman : an ! Ouvre grand les bras !', None),
                                     ('lap|in|', 'Lapin.', 3, 'Lapin : in ! Les oreilles de lapin !', 'Lapin : hein ! Les oreilles de lapin !'), ('t|am|bour', 'Tambour.', 2, 'Tambour : an ! Ouvre grand les bras !', None)]:
    say(danse(word), plain, pad=0.3)
    countdown(lambda k: danse(word, k=k), 3)
    say(danse(word, n), phrase, alt, pad=0.2, sfx_name='ding')
    for _ in range(2): hold(danse(word, n, hop=True), 0.55, 'boing')

# ============ 10. QUIZ ============
def quiz(word, k=None, n=None, none_=False):
    if n or none_:
        c = RED if none_ else NEZ[n][1]
        mid = card(480, 330, 960, 280, c, sw=9) + rich(960, 530, word, 160, c) + check(1560, 470, 60)
    else:
        mid = card(480, 330, 960, 280, PUR, sw=9) + text(960, 530, word.replace('|', ''), 160, PUR)
    return scr('PETIT QUIZ', RED, h1('Quel son du nez entends-tu ?', 250), mid, cdn(k, 260, 470), trio(840, n if not none_ else 0),
               pill(960, 965, 'aucun des trois : poing fermé', PUR, 34) if none_ else '')
say(scr('PETIT QUIZ', RED, h1('Quel son du nez entends-tu ?', 260), trio(560, None, 80), pill(960, 760, 'un doigt pour on, deux pour an, trois pour in', PUR, 44)),
    "Petit quiz ! Quel son du nez entends-tu ? Montre un doigt pour on, deux doigts pour an, trois doigts pour in.",
    "Petit quiz ! Quel son du nez entends-tu ? Montre un doigt pour on, deux doigts pour an, trois doigts pour hein.", sfx_name='tada')
for word, plain, n, phrase, alt in [('balaf|on|', 'Balafon.', 1, 'Le son on ! Un doigt.', None), ('éléph|an|t', 'Éléphant.', 2, 'Le son an ! Deux doigts.', None),
                                     ('Bén|in|', 'Bénin.', 3, 'Le son in ! Trois doigts.', 'Le son hein ! Trois doigts.')]:
    say(quiz(word), plain, pad=0.2)
    countdown(lambda k: quiz(word, k), 3)
    say(quiz(word, n=n), phrase, alt, sfx_name='ding')
say(quiz('banane'), "Attention, le dernier est un piège : banane.", pad=0.2)
countdown(lambda k: quiz('banane', k), 3)
say(quiz('ban|ane|', none_=True), "Aucun ! Après le n, il y a un e. Pas de son du nez. Bien joué !", "Aucun ! Après le ène, il y a un e. Pas de son du nez. Bien joué !", sfx_name='ding')

# ============ 11. LA PHRASE MAGIQUE ============
def magique(k, t=False):
    ws = [('|un|', CUN), ('b|on|', CON), ('p|ain|', CIN), ('bl|an|c', CAN)]
    o = [card(140 + i * 420, 400, 380, 260, c, sw=8) + rich(330 + i * 420, 580, w, 130, c) for i, (w, c) in enumerate(ws[:k])]
    return scr('LA PHRASE MAGIQUE', YEL, h1('Tous les sons du nez dans une seule phrase', 250, PUR), *o, toi(960, 760) if t else '', samba(960, 900, .28) if not t else '')
say(magique(4), "Voici la phrase magique, avec tous les sons du nez : un bon pain blanc.", sfx_name='tada')
say(magique(4), "Un. Bon. Pain. Blanc. Répète-la trois fois !")
hold(magique(4, True), 5.0, 'pop')

# ============ 12. L'ATELIER ============
AT = 'L\'ATELIER : LE BALAFON DES SONS DU NEZ'
def etape(n, *parts, sub=None):
    return scr(AT, TEAL, pill(960, 130, f'ÉTAPE {n}', RED, 34), text(960, 290, sub, 50, PUR) if sub else '', *parts)
def pause(msg):
    return scr(AT, TEAL, f'<rect x="860" y="330" width="70" height="230" rx="16" fill="{RED}"/><rect x="990" y="330" width="70" height="230" rx="16" fill="{RED}"/>',
               text(960, 700, 'METS SUR PAUSE', 100, RED), text(960, 790, msg, 46, PUR, 'nx'))
def lame_vide(x, y, w, h, n, graph):
    g_, c = NEZ[n]
    return (f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="24" fill="#fff" stroke="{c}" stroke-width="9"/><rect x="{x}" y="{y}" width="{w}" height="110" rx="24" fill="{c}"/>'
            + (text(x + w / 2, y + 86, g_, 88, '#fff') if graph else ''))
WORDS = {1: ['mout|on|', 'ball|on|', 'sav|on|', 'p|om|pier'], 2: ['mam|an|', 'm|an|gue', 'd|en|t', 't|am|bour'], 3: ['lap|in|', 'mat|in|', 'p|ain|', 't|im|bre']}
say(scr(AT, TEAL, h1('C\'est l\'heure de l\'atelier !', 250), bala3(420, 360, 260, 480), balafon(1500, 420, .5), amara(1560, 780, .6, R='out')),
    "C'est l'heure de l'atelier ! On fabrique le balafon des sons du nez.", sfx_name='tada')
say(etape(1, *[lame_vide(480 + i * 330, 380, 290, 520, n, False) for i, n in enumerate((1, 2, 3))], sub='Trois grandes lames : une verte, une rouge, une jaune'),
    "Sur la première feuille, dessine trois grandes lames, comme sur un balafon : une verte, une rouge, une jaune.")
say(etape(2, *[lame_vide(480 + i * 330, 380, 290, 520, n, True) for i, n in enumerate((1, 2, 3))], sub='Un son du nez sur chaque lame'),
    "Sur la lame verte, écris o, n. Sur la rouge, a, n. Sur la jaune, i, n.", "Sur la lame verte, écris o, ène. Sur la rouge, a, ène. Sur la jaune, i, ène.")
hold(pause('et reviens quand ton balafon est prêt'), 0.4, 'ding')
say(pause('et reviens quand ton balafon est prêt'), "Mets sur pause, et reviens quand ton balafon est prêt.")
hold(pause('et reviens quand ton balafon est prêt'), 2.5)
grid = ''.join(f'<path d="M{765 + i * 130} 360 v480" stroke="{PUR}" stroke-width="4" stroke-dasharray="12 10"/>' for i in (1, 2)) + ''.join(f'<path d="M765 {360 + j * 120} h390" stroke="{PUR}" stroke-width="4" stroke-dasharray="12 10"/>' for j in (1, 2, 3))
say(etape(3, f'<rect x="765" y="360" width="390" height="480" rx="8" fill="#fff" stroke="{PUR}" stroke-width="6"/>', grid, pill(1450, 560, 'un adulte t\'aide', RED, 40), sub='Douze petites cartes'),
    "Un adulte t'aide à couper l'autre feuille en douze petites cartes.")
def cartes():
    o = []
    for n in (1, 2, 3):
        for j, w in enumerate(WORDS[n]):
            x = 330 + j * 420; y = 400 + (n - 1) * 170
            o.append(card(x - 190, y - 65, 380, 130, NEZ[n][1], sw=5, rx=18) + rich(x, y + 24, w, 68, NEZ[n][1]))
    return ''.join(o)
say(etape(4, cartes(), sub='Un mot par carte'), "Sur chaque carte, écris un mot. Les douze mots sont sur la fiche à imprimer.")
say(pause('et écris tes douze cartes'), "Mets sur pause, le temps d'écrire tes cartes.")
hold(pause('et écris tes douze cartes'), 2.5)
say(etape(5, bala3(390, 350, 360, 600, words=WORDS, gap=30), sub='Chaque carte sur la bonne lame'), "Pose chaque carte sur la bonne lame. Ton balafon des sons du nez est prêt !", sfx_name='tada')

# ============ 13. ON JOUE ============
def defi(n, titre_, *parts):
    return scr('ON JOUE !', PUR, pill(960, 130, f'DÉFI {n}' if n else 'TON DÉFI À TOI', RED, 34), lines(960, 270, titre_, 50, PUR), *parts)
say(defi(1, ['Pioche une carte, lis le mot,', 'et pose-la sur la bonne lame'], bala3(640, 430, 250, 420, hl=3), card(170, 560, 380, 130, CIN, sw=5, rx=18) + rich(360, 650, 'mat|in|', 68, CIN)),
    "Défi numéro un. Pioche une carte, lis le mot, et pose-la sur la bonne lame.")
say(defi(2, ['Joue du balafon : tape sur une lame,', 'et dis tous ses mots'], bala3(640, 430, 250, 480, hl=1, words={1: WORDS[1]}), balafon(330, 640, .42)),
    "Défi numéro deux. Joue du balafon : tape sur une lame, et dis tous ses mots.", sfx_name='chant')
say(defi(3, ['Trouve un nouveau mot pour chaque lame'],
         *[at(t_, card(200 + i * 520, 430, 480, 320, NEZ[n][1], sw=7) + text(440 + i * 520, 560, NEZ[n][0], 130, NEZ[n][1]) + text(440 + i * 520, 690, 'comme ' + w, 60, PUR)) for i, (n, w, t_) in enumerate(((1, 'pont', 3.0), (2, 'maman', 4.6), (3, 'matin', 6.2)))]),
    "Défi numéro trois. Trouve un nouveau mot pour chaque lame. ON, comme pont. AN, comme maman. IN, comme matin.",
    "Défi numéro trois. Trouve un nouveau mot pour chaque lame. On, comme pont. An, comme maman. Hein, comme matin.")
say(defi(0, ['Cherche un son du nez dans ton prénom,', 'ou dans celui de quelqu\'un de ta famille'], card(260, 480, 1400, 250, PUR, sw=6) + rich(620, 650, 'S|am|ba', 130, CAN) + rich(1300, 650, 'Mart|in|', 130, CIN), trio(860)),
    "Et ton défi à toi : cherche un son du nez dans ton prénom, ou dans celui de quelqu'un de ta famille.")

# ============ 14. RÉCAP ============
def recap():
    o = []
    data = {1: (['on', 'om'], 'mouton'), 2: (['an', 'en', 'am'], 'maman'), 3: (['in', 'ain', 'im'], 'lapin')}
    for n, x in zip((1, 2, 3), (330, 800, 1270)):
        g, c = NEZ[n]; gs, ex = data[n]
        o.append(card(x - 215, 320, 430, 500, c, sw=8) + badge(x, 410, n, c, 62) + text(x, 600, g, 150, c) + text(x, 690, '  '.join(gs), 50, PUR) + text(x, 770, ex, 40, '#7A6A80', 'nx'))
    o.append(card(1525, 320, 300, 500, CUN, sw=8) + text(1675, 600, 'un', 150, CUN) + text(1675, 690, 'un  um', 50, PUR) + text(1675, 770, 'lundi', 40, '#7A6A80', 'nx'))
    return scr('BRAVO !', RED, confetti(9, 50), h1('Tu connais les sons du nez', 240), *o)
say(recap(), "Bravo ! Tu connais les sons du nez.", sfx_name='tada')
say(recap(), "On, comme dans mouton. An, comme dans maman. In, comme dans lapin. Et un, comme dans lundi.", "On, comme dans mouton. An, comme dans maman. Hein, comme dans lapin. Et un, comme dans lundi.")
say(scr('LA DERNIÈRE ASTUCE', YEL, h1('Apprends la phrase magique à ta famille', 230, PUR), pill(960, 270, 'un bon pain blanc', PUR, 60), amara(660, 640, .9, L='down', R='out'), samba(1250, 620, .55)),
    "Dernière astuce : ce soir, apprends la phrase magique à quelqu'un de ta famille. Un bon pain blanc !")
fin = svg(bg('AU REVOIR', TEAL), confetti(12), amara(560, 420, 1.0, L='down', R='up'), kofi(860, 450, .92, L='up', R='down'), samba(1350, 500, .62, sing=True), text(960, 970, 'À bientôt chez les Mounas !', 80, PUR))
say(fin, "À bientôt chez les Mounas !")
hold(fin, 2.0)

if __name__ == '__main__':
    mode = sys.argv[1] if len(sys.argv) > 1 else 'video'
    if mode == 'lines':
        for i, (k, l) in enumerate(LINES, 1): print(f'{i}. {l}')
    else:
        print(render('sons-du-nez'), round(total()), 's')
