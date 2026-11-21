"""Épisode « Un, deux, trois : les trois sons » (un · eu · oi). Brouillon voix TTS."""
import sys
from engine import say as _say, hold, countdown, render, total, T, LINES
_sec = ['x']; _n = [0]
def S(name): _sec[0] = name; _n[0] = 0
def say(*a, **k):
    key = f'{_sec[0]}{_n[0]}'; _n[0] += 1
    return _say(*a, key=key, **k)
from draw import *

def scr(title, col, *parts, deco=True):
    return svg(bg(title, col, deco), *parts)

def h1(s, y=230, col=RED, size=64):
    return text(960, y, s, size, col)

SON = {1: ('un', C1, 'un'), 2: ('eu', C2, 'deux'), 3: ('oi', C3, 'trois')}
def trio(y=900, hl=None, r=58):
    """Les trois pastilles 1 un · 2 eu · 3 oi, en bas d'écran."""
    out = []
    for n, x in zip((1, 2, 3), (560, 960, 1360)):
        g, c, _ = SON[n]
        if hl == n: out.append(f'<circle cx="{x}" cy="{y}" r="{r+62}" fill="{c}" opacity=".18" [[PULSE {x} {y}]]/>')
        op = 1 if hl in (None, n) else .35
        out.append(f'<g opacity="{op}">{badge(x - r*1.07, y, n, c, r)}{text(x + r, y + r*.48, g, int(r*1.45), c)}</g>')
    return ''.join(out)

# ============ 0. PAGE TITRE ============
def ouverture():
    big = ''; cx = 960 - width('MOUNAS', 150) / 2
    for ch, col in zip('MOUNAS', [YEL, TEAL, YEL, RED, PUR, RED]):
        big += text(cx, 250, ch, 150, col, 'black', 'start'); cx += width(ch, 150) + 2
    return svg(bg(None, prog=False).replace(logo(), ''), confetti(21, 60), big,
               text(820, 470, 'Un, deux, trois !', 150, PUR), pill(820, 530, 'Les trois sons : « un », « eu », « oi »', RED, 48),
               badge(540, 820, 1, C1, 95), badge(820, 820, 2, C2, 95), badge(1100, 820, 3, C3, 95),
               amara(1560, 640, 1.05, L='up', R='up'))
S('titre')
hold(ouverture(), 1.0, 'tada')
say(ouverture(), "Un, deux, trois : les trois sons !")
hold(ouverture(), 0.8)

# ============ 1. ACCROCHE ============
S('intro')
def titre(conf=True):
    return svg(bg(None), confetti(4) if conf else '', text(800, 330, 'Un, deux, trois !', 150, PUR),
               pill(800, 400, 'Les trois sons cachés dans les chiffres', RED, 46),
               badge(520, 690, 1, C1, 95), badge(800, 690, 2, C2, 95), badge(1080, 690, 3, C3, 95),
               amara(1520, 520, 1.15))
hold(titre(), 1.2, 'tada')
say(titre(), "Coucou ! C'est Amara. Aujourd'hui, on compte jusqu'à trois. Prêt ? Prête ?")

def compte(k, words=False):
    out = []
    for n, x in zip((1, 2, 3), (480, 960, 1440)):
        if n > k: continue
        g, c, w = SON[n]
        out.append(text(x, 560, str(n), 380, c, 'fr'))
        if words:
            out.append(rich(x, 760, {1: '|un|', 2: 'd|eu|x', 3: 'tr|oi|s'}[n], 120, c))
        else:
            out.append(text(x, 760, w, 120, PUR))
    return scr('ON COMPTE', TEAL, *out)
say(compte(1), "Un !", sfx_name='pop')
say(compte(2), "Deux !", sfx_name='pop')
say(compte(3), "Trois !", sfx_name='pop')
say(compte(3, True), "Dans ces trois petits mots se cachent trois sons magiques.", sfx_name='ding')
def marelle_row(y=380, hl=None, w=280, h=364):
    return ''.join(sheet(x, y, n, SON[n][0], SON[n][1], w, h, hl=(hl == n)) for n, x in zip((1, 2, 3), (480, 820, 1160)))
say(scr('À LA FIN DE LA VIDÉO', TEAL, h1('Tu vas fabriquer la marelle des trois sons', 250), marelle_row(360),
        amara(1700, 560, .8, R='out')),
    "Et à la fin, tu vas fabriquer la marelle des trois sons, pour sauter de son en son !")

# ============ 2. MOT AUX PARENTS ============
S('parents')
def mat(i, label, sub, icon):
    x = 250 + i * 370
    return (card(x, 330, 310, 360, [TEAL, RED, YEL, PUR][i]) + icon(x + 155, 480)
            + text(x + 155, 625, label, 34, PUR, 'nx') + text(x + 155, 665, sub, 26, '#7A6A80', 'nb'))
def i_sheets(cx, cy):
    return ''.join(f'<rect x="{cx-60+d}" y="{cy-85-d/2}" width="110" height="145" rx="6" fill="#fff" stroke="{PUR}" stroke-width="5"/>' for d in (-24, 0, 24))
def i_sheet(cx, cy):
    return (f'<rect x="{cx-58}" y="{cy-80}" width="116" height="150" rx="6" fill="#fff" stroke="{PUR}" stroke-width="5"/>'
            f'<path d="M{cx-58} {cy-30} h116 M{cx-58} {cy+20} h116 M{cx-19} {cy-80} v150 M{cx+19} {cy-80} v150" stroke="{PUR}" stroke-width="3" stroke-dasharray="8 7"/>')
def i_pens(cx, cy):
    return ''.join(f'<g transform="rotate({a} {cx} {cy})"><rect x="{cx-11}" y="{cy-80}" width="22" height="130" rx="8" fill="{c}"/><path d="M{cx-9} {cy+50} L{cx} {cy+78} L{cx+9} {cy+50}Z" fill="{PUR}"/></g>'
                   for a, c in ((-22, RED), (0, TEAL), (22, YEL)))
def i_tape(cx, cy):
    return f'<circle cx="{cx}" cy="{cy-5}" r="70" fill="{YEL}" stroke="{GOLD}" stroke-width="6"/><circle cx="{cx}" cy="{cy-5}" r="30" fill="{CREAM}" stroke="{GOLD}" stroke-width="6"/>'
materiel = scr('MOT AUX PARENTS', PUR, h1('Matériel de l\'atelier', 240, PUR),
               mat(0, 'trois feuilles', 'pour la marelle', i_sheets), mat(1, 'une feuille', 'pour les cartes-mots', i_sheet),
               mat(2, 'des feutres', '', i_pens), mat(3, 'du ruban adhésif', 'et des ciseaux (adulte)', i_tape),
               pill(960, 800, 'La fiche à imprimer : dans la communauté Skool', PUR, 34))
say(materiel, "Bonjour les parents ! Pour l'atelier, à la fin de la vidéo, préparez quatre feuilles de papier, des feutres, du ruban adhésif, et des ciseaux pour un adulte.")
say(materiel, "La fiche d'exercices à imprimer vous attend dans la communauté Les Mounas.")

# ============ 3. AU MARCHÉ DE MOUNAVILLE ============
S('r')
def marche(k=0, words=False):
    items = []
    if k >= 1: items.append(badge(650, 250, 1, C1, 50) + parfum(650, 430, .9))
    if k >= 2: items.append(badge(960, 250, 2, C2, 50) + oeuf(915, 430, .8) + oeuf(1010, 440, .8))
    if k >= 3: items.append(badge(1290, 250, 3, C3, 50) + coco(1220, 440, .62) + coco(1330, 440, .62) + coco(1275, 360, .62))
    if words:
        items += [at(2.5, rich(650, 610, 'parf|um|', 64, C1)), at(4.05, rich(960, 610, '|œu|fs', 64, C2)), at(5.45, rich(1290, 610, 'n|oi|x', 64, C3))]
    return svg(bg('AU MARCHÉ DE MOUNAVILLE', TEAL, deco=False), houses(590), amara(330, 620, .82, L='hip', R='out'),
               kofi(1650, 640, .78, L='out', R='hip'), *items)
say(marche(0), "Ce matin, à Mounaville, Amara et son ami Kofi vont au marché.")
say(marche(1), "Dans leur panier, il y a un parfum pour mamie,", sfx_name='pop')
say(marche(2), "deux œufs,", sfx_name='pop')
say(marche(3), "et trois noix de coco.", sfx_name='pop')
say(marche(3, True), "Un parfum, deux œufs, trois noix. Tu entends ? Les sons de un, deux, trois sont partout !")

# ============ 4. LES TROIS SONS ============
def son_intro(n, mouth, tip):
    g, c, w = SON[n]
    return scr(['', 'PREMIER SON', 'DEUXIÈME SON', 'TROISIÈME SON'][n], c,
               badge(520, 500, n, c, 120), text(960, 590, g, 330, c),
               rich(960, 790, {1: '|un|', 2: 'd|eu|(x)', 3: 'tr|oi|(s)'}[n], 100, c) if n > 1 else '',
               amara(1500, 470, 1.0, L='down', R='up', mouth=mouth), pill(960, 880, tip, PUR, 36) if tip else '')
def lettres(n, a, b, mouth, tip):
    g, c, w = SON[n]
    return scr(['', 'PREMIER SON', 'DEUXIÈME SON', 'TROISIÈME SON'][n], c,
               card(360, 380, 220, 260, PUR) + text(470, 570, a, 190, PUR),
               text(660, 560, '+', 130, '#7A6A80', 'fr'),
               card(740, 380, 220, 260, PUR) + text(850, 570, b, 190, PUR),
               text(1040, 560, '=', 130, '#7A6A80', 'fr'),
               card(1120, 380, 330, 260, c, sw=9) + text(1285, 570, g, 190, c),
               amara(1680, 520, .8, L='down', R='down', mouth=mouth), pill(905, 760, tip, c, 40))
def mots(n, title, ws, sub=None, size=110, ts=None):
    g, c, w = SON[n]
    xs = {1: [960], 2: [640, 1280], 3: [420, 960, 1500], 4: [330, 750, 1170, 1590]}[len(ws)]
    return scr(title, c, h1(sub, 250, c) if sub else '', *[(at(ts[i], rich(x, 560, s, size, c)) if ts else rich(x, 560, s, size, c)) for i, (x, s) in enumerate(zip(xs, ws))], trio(900, n))
def repete(n, mouth, tip, toi=False):
    g, c, w = SON[n]
    return scr('RÉPÈTE AVEC MOI', c, text(700, 620, f'« {g} »', 300, c), amara(1400, 480, 1.25, L='down', R='down', mouth=mouth),
               pill(700, 760, tip, PUR, 38),
               (pill(660, 850, 'À toi !', RED, 60) + '[[RING 900 902 40]]') if toi else '')

# --- un ---
say(son_intro(1, 'smile', None), "Premier son. Écoute bien : un.", sfx_name='whoosh')
say(lettres(1, 'u', 'n', 'flat', 'u et n chantent ensemble'), "Il s'écrit avec deux lettres : u, et n. Ensemble, elles chantent : un.",
    "Il s'écrit avec deux lettres : u, et ène. Ensemble, elles chantent : un.")
say(repete(1, 'flat', 'le son passe par ton nez'), "Le son passe par ton nez. Répète avec moi : un.")
hold(repete(1, 'flat', 'le son passe par ton nez', toi=True), 2.8, 'pop')
say(mots(1, 'LE SON « UN »', ['l|un|di', 'br|un|', 'chac|un|'], 'On l\'entend dans...', ts=[1.7, 3.7, 5.0]), "On l'entend dans lundi, dans brun, et dans chacun.")
say(scr('UNE AUTRE FAÇON DE L\'ÉCRIRE', C1, h1('Parfois, avec un m', 250, C1), at(3.0, card(560, 360, 260, 230, C1, sw=9) + text(690, 530, 'um', 150, C1)),
        at(5.2, rich(1160, 530, 'parf|um|', 150, C1) + parfum(1160, 740, .7)), trio(940, 1, 46)),
    "Parfois, il s'écrit avec un m : u, m. Comme dans parfum.", "Parfois, il s'écrit avec un m : u, ème. Comme dans parfum.")
piege1 = scr('ATTENTION, UN PIÈGE !', RED, h1('Une voyelle juste après le n : le son change', 250, RED, 56),
             at(6.5, rich(600, 540, 'l|une|', 170, RED)), at(7.7, rich(1320, 540, '|une|', 170, RED)),
             at(9.3, cross(600, 660) + cross(1320, 660) + pill(960, 790, 'ici, on n\'entend pas « un »', PUR, 40)))
say(piege1, "Attention, un piège ! S'il y a une voyelle juste après le n, le son change. Lune. Une. Ici, on n'entend pas le son un.",
    "Attention, un piège ! S'il y a une voyelle juste après le ène, le son change. Lune. Une. Ici, on n'entend pas le son un.", sfx_name='oops')

# --- eu ---
say(son_intro(2, 'o', None), "Deuxième son. Écoute bien : eu.", "Deuxième son. Écoute bien : euh.", sfx_name='whoosh')
say(lettres(2, 'e', 'u', 'o', 'e et u chantent ensemble'), "Il s'écrit e, u. Ensemble, ils chantent : eu.", "Il s'écrit e, u. Ensemble, ils chantent : euh.")
say(repete(2, 'o', 'ta bouche fait un petit rond, comme pour un bisou'), "Ta bouche fait un petit rond, comme pour un bisou. Répète avec moi : eu.",
    "Ta bouche fait un petit rond, comme pour un bisou. Répète avec moi : euh.")
hold(repete(2, 'o', 'ta bouche fait un petit rond, comme pour un bisou', toi=True), 2.8, 'pop')
say(mots(2, 'LE SON « EU »', ['bl|eu|', 'f|eu|', 'j|eu|', 'chev|eu|'], 'On l\'entend dans...', 100, ts=[1.0, 1.75, 2.75, 3.95]), "On l'entend dans bleu, dans feu, dans jeu, et dans cheveu.")
say(scr('UNE AUTRE FAÇON DE L\'ÉCRIRE', C2, h1('Le o et le e se collent, puis vient le u', 250, C2, 56),
        card(300, 380, 300, 230, C2, sw=9) + text(450, 550, 'œu', 150, C2),
        at(3.85, rich(880, 540, 'v|œu|', 140, C2)), at(5.6, rich(1330, 540, 'n|œu|(d)', 140, C2)), at(7.4, rich(1090, 740, 'des |œu|(fs)', 110, C2)), trio(940, 2, 46)),
    "Parfois, le o et le e se collent, et le u les suit. Comme dans vœu, dans nœud, et dans des œufs.")
say(scr('LE E TOUT SEUL', C2, h1('Un petit e tout seul chante presque pareil', 250, C2, 56),
        card(300, 400, 220, 230, C2, sw=9) + text(410, 570, 'e', 150, C2),
        at(4.1, rich(760, 520, 'd|e|', 130, C2)), at(5.5, rich(1080, 520, 'l|e|', 130, C2)), at(6.9, rich(1400, 520, 'j|e|', 130, C2)),
        at(8.1, rich(1080, 720, 'p|e|tit', 130, C2)), trio(940, 2, 46)),
    "Et parfois, un petit e tout seul suffit ! Comme dans de, dans le, dans je, et dans petit.")
say(scr('CHUT ! LES LETTRES MUETTES', PUR, h1('On les écrit, mais on ne les entend pas', 250, PUR, 56),
        rich(560, 560, 'd|eu|(x)', 170, C2), rich(1360, 560, 'n|œu|(d)', 170, C2),
        amara(960, 560, .7, L='down', R='nose', mouth='o'), pill(960, 900, 'le x de deux et le d de nœud sont muets', PUR, 40)),
    "Et regarde le mot deux : à la fin, il y a un x qu'on n'entend pas. C'est une lettre muette. Chut !")

# --- oi ---
say(son_intro(3, 'wide', None), "Troisième son. Écoute bien : oi.", "Troisième son. Écoute bien : oua.", sfx_name='whoosh')
say(lettres(3, 'o', 'i', 'wide', 'on n\'entend ni « o », ni « i » !'), "Il s'écrit o, i. Mais surprise : on n'entend ni o, ni i ! Ensemble, ils font : oi.",
    "Il s'écrit o, i. Mais surprise : on n'entend ni o, ni i ! Ensemble, ils font : oua.")
say(repete(3, 'wide', 'ta bouche s\'ouvre en grand'), "Ta bouche s'ouvre en grand. Répète avec moi : oi.", "Ta bouche s'ouvre en grand. Répète avec moi : oua.")
hold(repete(3, 'wide', 'ta bouche s\'ouvre en grand', toi=True), 2.8, 'pop')
say(mots(3, 'LE SON « OI »', ['r|oi|', 'ét|oi|le', 'p|oi|sson'], 'On l\'entend dans...', ts=[1.0, 2.45, 3.65]), "On l'entend dans roi, dans étoile, et dans poisson.")
def deguise(k):
    rows = [('oî', 'b|oî|te', 'avec un chapeau sur le i'), ('oy', 'v|oy|age', 'avec un y, qui vaut deux i'), ('oê', 'p|oê|le', 'avec o, e et un chapeau')]
    out = []
    for i, (g, w, sub) in enumerate(rows[:k]):
        y = 330 + i * 190
        out.append(card(330, y, 220, 150, C3, sw=8) + text(440, y + 108, g, 100, C3) + rich(900, y + 112, w, 110, C3)
                   + text(1180, y + 98, sub, 38, '#7A6A80', 'nx', 'start'))
    return scr('LE SON « OI » SE DÉGUISE', C3, h1('D\'autres façons de l\'écrire', 240, C3), *out, trio(950, 3, 44))
say(deguise(1), "Le son oi aime se déguiser. Avec un petit chapeau sur le i : boîte.", "Le son oua aime se déguiser. Avec un petit chapeau sur le i : boîte.")
say(deguise(2), "Avec un y : voyage. Tu te souviens ? Le y vaut deux i.", "Avec un i grec : voyage. Tu te souviens ? Le i grec vaut deux i.")
say(deguise(3), "Et même avec o, e, et un chapeau : poêle.")
say(scr('CHUT ! LES LETTRES MUETTES', PUR, h1('À la fin du mot, une lettre qui dort', 250, PUR, 56),
        at(1.7, rich(420, 580, 'tr|oi|(s)', 150, C3)), at(4.6, rich(960, 580, 't|oi|(t)', 150, C3)), at(6.6, rich(1500, 580, 'n|oi|(x)', 150, C3)), trio(900, 3)),
    "Et à la fin de trois, le s est muet. Comme le t de toit, et le x de noix.",
    "Et à la fin de trois, le èsse est muet. Comme le té de toit, et le ixe de noix.")
say(scr('ATTENTION, UN PIÈGE !', RED, h1('o, i, n : c\'est un autre son', 250, RED),
        at(7.5, rich(600, 540, 'p|oin|t', 170, RED)), at(9.0, rich(1320, 540, 'l|oin|', 170, RED)),
        at(9.7, cross(600, 660) + cross(1320, 660) + pill(960, 790, 'ici, on n\'entend plus « oi »', PUR, 40))),
    "Attention, un piège ! Avec un n juste après, o, i, n, c'est un autre son : point, loin.",
    "Attention, un piège ! Avec un ène juste après, o, i, ène, c'est un autre son : point, loin.", sfx_name='oops')

# ============ 5. JEU DU CORPS ============
def regles():
    out = []
    for n, x in zip((1, 2, 3), (400, 960, 1520)):
        g, c, _ = SON[n]
        out.append(at([0, .9, 4.4, 6.5][n], card(x - 230, 330, 460, 420, c) + text(x, 470, f'« {g} »', 110, c)
                   + ''.join(f'<path d="M{x - (n-1)*55 + i*110 - 34} 640 q34 -90 68 0" stroke="{c}" stroke-width="12" fill="none" stroke-linecap="round"/>' for i in range(n))
                   + text(x, 715, ['', 'un saut', 'deux sauts', 'trois sauts'][n], 44, PUR, 'nx')))
    return scr('DEBOUT ! ON JOUE', TEAL, h1('Écoute le mot, et saute !', 240, TEALT), *out)
say(scr('DEBOUT ! ON JOUE', TEAL, h1('On joue avec tout le corps', 260, TEALT), amara(960, 520, 1.2, L='up', R='up')),
    "Debout ! On joue avec tout le corps.", sfx_name='tada')
say(regles(), "Si tu entends le son un, tu fais un saut. Le son eu, deux sauts. Le son oi, trois sauts.",
    "Si tu entends le son un, tu fais un saut. Le son euh, deux sauts. Le son oua, trois sauts.")
def saut(word, n=None, up=False, hop=False):
    reveal = n is not None
    c = SON[n][1] if reveal else PUR
    return scr('DEBOUT ! ON JOUE', TEAL,
               (rich(700, 520, word, 180, c) if reveal else text(700, 540, '?', 260, PUR)),
               (text(700, 700, ['', 'un saut !', 'deux sauts !', 'trois sauts !'][n], 80, c) if reveal else pill(700, 640, 'écoute bien...', PUR, 44)),
               f'<ellipse cx="1420" cy="975" rx="{120 if up else 150}" ry="20" fill="#000" opacity=".12"/>',
               f'<g [[HOP {150 if hop else 0}]]>' + amara(1420, 460, 1.1, L='up' if hop else 'down', R='up' if hop else 'down') + '</g>')
for word, plain, n, phrase in [('bl|eu|', 'Bleu.', 2, 'Bleu : deux sauts !'), ('l|un|di', 'Lundi.', 1, 'Lundi : un saut !'),
                               ('ét|oi|le', 'Étoile.', 3, 'Étoile : trois sauts !'), ('parf|um|', 'Parfum.', 1, 'Parfum : un saut !')]:
    say(saut(word), plain, pad=0.3)
    hold(saut(word), 2.6)   # le temps de répondre
    say(saut(word, n), phrase, pad=0.2, sfx_name='ding')
    for _ in range(n):
        hold(saut(word, n, hop=True), 0.62, 'boing')
    hold(saut(word, n), 0.6)


# ============ 6. QUIZ ============
def quiz(word, k=None, n=None, none_=False):
    if n or none_:
        c = RED if none_ else SON[n][1]
        mid = card(560, 330, 800, 280, c, sw=9) + rich(960, 530, word, 170, c) + check(1470, 470, 60)
    else:
        mid = card(560, 330, 800, 280, PUR, sw=9) + text(960, 530, word.replace('|', ''), 170, PUR)
    cd = (f'<circle cx="300" cy="470" r="90" fill="{YEL}"/>' + text(300, 512, str(k), 120, PUR, 'fr') + '[[RING 300 470 104]]') if k else ''
    low = trio(840, n) if not none_ else trio(840, 0)
    return scr('PETIT QUIZ', RED, h1('Quel son entends-tu ?', 250), mid, cd, low,
               pill(960, 965, 'aucun des trois : poing fermé', PUR, 34) if none_ else '')
say(scr('PETIT QUIZ', RED, h1('Quel son entends-tu ?', 260), trio(560, None, 80),
        pill(960, 760, 'montre un, deux ou trois doigts', PUR, 44)),
    "Petit quiz ! Quel son entends-tu ? Montre un, deux ou trois doigts.", sfx_name='tada')
for word, plain, n, phrase, alt in [
        ('n|œu|(d)', 'Nœud.', 2, 'Le son eu ! Deux doigts.', 'Le son euh ! Deux doigts.'),
        ('v|oy|age', 'Voyage.', 3, 'Le son oi ! Trois doigts.', 'Le son oua ! Trois doigts.'),
        ('br|un|', 'Brun.', 1, 'Le son un ! Un doigt.', None)]:
    say(quiz(word.replace('(', '').replace(')', '')), plain, pad=0.2)
    countdown(lambda k: quiz(word.replace('(', '').replace(')', ''), k), 3)
    say(quiz(word, n=n), phrase, alt, sfx_name='ding')
say(quiz('lune'), "Attention, le dernier est un piège : lune.", pad=0.2)
countdown(lambda k: quiz('lune', k), 3)
say(quiz('l|une|', none_=True), "Aucun des trois ! Après le n, il y a un e : le son un a disparu. Bien joué !",
    "Aucun des trois ! Après le ène, il y a un e : le son un a disparu. Bien joué !", sfx_name='ding')

# ============ 7. LE DÉFI DU NEZ ============
def nez(g, c, pinch, tip):
    return scr('LE DÉFI DU NEZ', PUR, text(620, 560, f'« {g} »', 280, c), pill(620, 700, tip, PUR, 40),
               amara(1380, 470, 1.25, L='down', R='nose' if pinch else 'down', mouth='o' if g == 'eu' else 'flat'))
say(nez('eu', C2, False, 'dis-le une première fois'), "Voici le défi du nez ! Dis : eu.", "Voici le défi du nez ! Dis : euh.", sfx_name='tada')
hold(nez('eu', C2, False, 'dis-le une première fois'), 1.5)
say(nez('eu', C2, True, 'pince ton nez : ça marche encore'), "Maintenant, pince ton nez, et dis encore : eu. Ça marche toujours !",
    "Maintenant, pince ton nez, et dis encore : euh. Ça marche toujours !")
hold(nez('eu', C2, True, 'pince ton nez : ça marche encore'), 1.5)
say(nez('un', C1, True, 'pince ton nez : ça fait tout drôle !'), "Garde ton nez pincé, et dis : un. Ça fait tout drôle !")
hold(nez('un', C1, True, 'pince ton nez : ça fait tout drôle !'), 1.5)
say(nez('un', C1, False, 'le son « un » passe par le nez'), "C'est parce que le son un passe par ton nez. Tu es une vraie petite tête chercheuse !")

# ============ 8. L'ATELIER ============
AT = 'L\'ATELIER : LA MARELLE DES TROIS SONS'
def etape(n, *parts, sub=None):
    return scr(AT, TEAL, pill(960, 130, f'ÉTAPE {n}', RED, 34), text(960, 290, sub, 50, PUR) if sub else '', *parts)
def pause(msg):
    return scr(AT, TEAL, f'<rect x="860" y="330" width="70" height="230" rx="16" fill="{RED}"/><rect x="990" y="330" width="70" height="230" rx="16" fill="{RED}"/>',
               text(960, 700, 'METS SUR PAUSE', 100, RED), text(960, 790, msg, 46, PUR, 'nx'))
say(scr(AT, TEAL, h1('C\'est l\'heure de l\'atelier !', 250), marelle_row(350), amara(1700, 560, .8, R='out')),
    "C'est l'heure de l'atelier ! On fabrique la marelle des trois sons.", sfx_name='tada')
say(etape(1, sheet(810, 370, 1, 'un', C1, 300, 390), f'<g transform="translate(-1300 -640) scale(2)">{i_pens(1300, 640)}</g>', sub='Le chiffre un, et les lettres u, n'),
    "Sur la première feuille, écris en grand le chiffre un, et les lettres u, n.", "Sur la première feuille, écris en grand le chiffre un, et les lettres u, ène.")
say(etape(2, sheet(470, 370, 1, 'un', C1, 300, 390), sheet(810, 370, 2, 'eu', C2, 300, 390), sheet(1150, 370, 3, 'oi', C3, 300, 390),
          sub='Deux avec e, u · trois avec o, i'),
    "Sur la deuxième feuille, le chiffre deux, et les lettres e, u. Sur la troisième, le chiffre trois, et les lettres o, i.")
hold(pause('et reviens quand tes trois feuilles sont prêtes'), 0.4, 'ding')
say(pause('et reviens quand tes trois feuilles sont prêtes'), "Mets sur pause, et reviens quand tes trois feuilles sont prêtes.")
hold(pause('et reviens quand tes trois feuilles sont prêtes'), 2.5)
grid = ''.join(f'<path d="M{700 + i*130} 360 v480" stroke="{PUR}" stroke-width="4" stroke-dasharray="12 10"/>' for i in (1, 2)) + \
       ''.join(f'<path d="M700 {360 + j*120} h390" stroke="{PUR}" stroke-width="4" stroke-dasharray="12 10"/>' for j in (1, 2, 3))
say(etape(3, f'<rect x="700" y="360" width="390" height="480" rx="8" fill="#fff" stroke="{PUR}" stroke-width="6"/>', grid,
          pill(1400, 560, 'un adulte t\'aide', RED, 40), sub='Douze petites cartes'),
    "Un adulte t'aide à couper la dernière feuille en douze petites cartes.")
WORDS = [('l|un|di', 1), ('br|un|', 1), ('parf|um|', 1), ('chac|un|', 1), ('bl|eu|', 2), ('f|eu|', 2), ('j|eu|', 2), ('n|œu|d', 2),
         ('r|oi|', 3), ('ét|oi|le', 3), ('b|oî|te', 3), ('v|oy|age', 3)]
def cartes(colored=True):
    out = []
    for i, (w, n) in enumerate(WORDS):
        x = 330 + (i % 4) * 420; y = 390 + (i // 4) * 170
        c = SON[n][1]
        out.append(card(x - 185, y - 65, 370, 130, c if colored else PUR, sw=5, rx=18) + rich(x, y + 24, w if colored else w.replace('|', ''), 70, c))
    return ''.join(out)
say(etape(4, cartes(), sub='Un mot par carte'), "Sur chaque carte, écris un mot. Les douze mots sont sur la fiche à imprimer.")
say(pause('et écris tes douze cartes'), "Mets sur pause, le temps d'écrire tes cartes.")
hold(pause('et écris tes douze cartes'), 2.5)
def sol(hl=None, who=None):
    sh = ''.join(sheet(x, 420, n, SON[n][0], SON[n][1], 260, 340, hl=(hl == n)) for n, x in zip((1, 2, 3), (500, 830, 1160)))
    tape = ''.join(f'<rect x="{x-30}" y="405" width="60" height="30" fill="{YEL}" opacity=".9"/><rect x="{x+230}" y="405" width="60" height="30" fill="{YEL}" opacity=".9"/>' for x in (500, 830, 1160))
    return sh + tape
say(etape(5, sol(), pill(960, 860, 'un adulte les colle au sol, pour ne pas glisser', RED, 38), sub='Les trois feuilles par terre, l\'une après l\'autre'),
    "Pose les trois feuilles par terre, l'une après l'autre. Un adulte les colle au sol avec du ruban adhésif, pour ne pas glisser. Ta marelle est prête !", sfx_name='tada')

# ============ 9. ON JOUE ============
def defi(n, titre_, *parts):
    return scr('ON JOUE !', PUR, pill(960, 130, f'DÉFI {n}' if n else 'TON DÉFI À TOI', RED, 34), lines(960, 270, titre_, 50, PUR), *parts)
say(defi(1, ['Pioche une carte, lis le mot,', 'et saute sur la bonne feuille'], sol(3).replace('y="420"', 'y="420"'),
         wordcard(250, 640, 0, 'ét|oi|le', C3)),
    "Défi numéro un. Pioche une carte, lis le mot, et saute sur la bonne feuille.")
say(defi(2, ['Un adulte dit un mot, sans montrer la carte.', 'Écoute, et saute !'], sol(2),
         card(120, 570, 290, 140, PUR, sw=5, rx=20) + text(265, 680, '?', 110, PUR)),
    "Défi numéro deux. Un adulte dit un mot, sans te montrer la carte. Écoute bien, et saute !")
say(defi(3, ['Saute sur une feuille,', 'et trouve un nouveau mot avec ce son'], sol(1),
         text(1650, 600, 'un... ', 70, C1), text(1650, 690, 'lundi !', 70, PUR)),
    "Défi numéro trois. Saute sur une feuille, et trouve un nouveau mot avec ce son.")
say(defi(0, ['Invente une phrase avec les trois sons'],
         card(210, 420, 1500, 220, PUR, sw=6) + rich(960, 565, 'L{1un}di, {1un} r{3oi} bl{2eu} compte tr{3oi}s {2œu}fs.', 76),
         trio(820)),
    "Et ton défi à toi : invente une phrase avec les trois sons. Par exemple : lundi, un roi bleu compte trois œufs.")

# ============ 10. RÉCAP ============
def recap():
    out = []
    data = {1: (['un', 'um'], 'lundi · parfum'), 2: (['eu', 'œu', 'e'], 'deux · nœud · je'), 3: (['oi', 'oî', 'oy', 'oê'], 'trois · boîte · voyage')}
    for n, x in zip((1, 2, 3), (380, 960, 1540)):
        g, c, _ = SON[n]; gs, ex = data[n]
        out.append(card(x - 260, 300, 520, 520, c, sw=8) + badge(x, 400, n, c, 70) + text(x, 600, g, 150, c)
                   + text(x, 690, '  '.join(gs), 54, PUR) + text(x, 770, ex, 36, '#7A6A80', 'nx'))
    return scr('BRAVO !', RED, confetti(9, 50), h1('Tu connais les trois sons', 240), *out)
say(recap(), "Bravo ! Aujourd'hui, tu as appris trois sons.", sfx_name='tada')
say(recap(), "Un, comme dans lundi et parfum. Eu, comme dans deux, nœud et je. Oi, comme dans trois, boîte et voyage.",
    "Un, comme dans lundi et parfum. Euh, comme dans deux, nœud et je. Oua, comme dans trois, boîte et voyage.")
fin = svg(bg('AU REVOIR', TEAL), confetti(12), amara(820, 420, 1.0, L='down', R='up'), kofi(1120, 450, .92, L='up', R='down'),
          text(960, 960, 'À bientôt chez les Mounas !', 80, PUR))
say(fin, "Un, deux, trois... à bientôt chez les Mounas !")
hold(fin, 2.0)

if __name__ == '__main__':
    mode = sys.argv[1] if len(sys.argv) > 1 else 'video'
    if mode == 'lines':
        for i, (k, l) in enumerate(LINES, 1): print(f'{i}. {l}')
    else:
        print(render('sons-un-deux-trois'), round(total()), 's')
