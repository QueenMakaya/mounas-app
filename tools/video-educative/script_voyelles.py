"""Épisode « Voyelles et consonnes » : les lettres qui chantent, les lettres qui frappent."""
import sys
from engine import say as _say, hold, countdown, render, total, T, LINES
from draw import *
from draw_afro import *
_sec = ['x']; _n = [0]
def S(name): _sec[0] = name; _n[0] = 0
def say(*a, **k):
    key = f'{_sec[0]}{_n[0]}'; _n[0] += 1
    return _say(*a, key=key, **k)
def scr(title, col, *parts, deco=True): return svg(bg(title, col, deco), *parts)
def h1(s, y=230, col=RED, size=64): return text(960, y, s, size, col)
def toi(x=960, y=900): return pill(x - 40, y, 'À toi !', RED, 60) + f'[[RING {x + 200} {y + 52} 40]]'
def duo(y=930, hl=None):
    """Rappel permanent : voyelles = on chante (vert), consonnes = on frappe (rouge)."""
    o = ''
    for k, (x, lab, c) in enumerate(((620, 'voyelle : on chante', CV), (1300, 'consonne : on frappe', CC))):
        o += f'<g opacity="{1 if hl in (None, k) else .3}">' + pill(x, y, lab, c, 40) + '</g>'
    return o
VLET = ['a', 'e', 'i', 'o', 'u', 'y']
def six(y=560, k=6, size=190):
    return [text(260 + i * 280, y, v, size, CV) for i, v in enumerate(VLET[:k])]

# ============ 0. PAGE TITRE ============
def ouverture():
    big = ''; cx = 960 - width('MOUNAS', 150) / 2
    for ch, col in zip('MOUNAS', [YEL, TEAL, YEL, RED, PUR, RED]):
        big += text(cx, 240, ch, 150, col, 'black', 'start'); cx += width(ch, 150) + 2
    return svg(bg(None, prog=False).replace(logo(), ''), confetti(31, 60), big,
               text(760, 440, 'Voyelles', 150, CV), text(760, 590, 'et consonnes', 150, CC),
               pill(760, 650, 'Les lettres qui chantent, les lettres qui frappent', PUR, 44),
               djembe(330, 880, .8), note(560, 830, 1.1), note(660, 880, .9, YEL, .3),
               amara(1560, 640, 1.05, L='up', R='up'))
S('titre')
hold(ouverture(), 1.0, 'tada')
say(ouverture(), "Voyelles et consonnes !")
hold(ouverture(), 0.8)

# ============ 1. ACCROCHE ============
S('intro')
say(svg(bg(None), confetti(4), text(760, 330, 'C\'est la fête', 130, PUR), text(760, 470, 'à Mounaville !', 130, PUR),
        baobab(300, 1000, .9), djembe(700, 800, .8), amara(1500, 520, 1.15)),
    "Coucou ! C'est Amara. Aujourd'hui, c'est la fête à Mounaville ! Prêt ? Prête ?")
say(scr('LE SECRET DES LETTRES', PUR, h1('Il y a des lettres qui chantent...', 260, CV), note(700, 600, 2.2), note(960, 520, 2.6, CV, .3), note(1220, 610, 2.0, CV, .6),
        amara(1650, 600, .8, R='up')),
    "Écoute bien. Il y a des lettres qui chantent...", sfx_name='chant')
say(scr('LE SECRET DES LETTRES', PUR, h1('...et des lettres qui frappent !', 260, CC), djembe(960, 600, 1.5), amara(1650, 600, .8, R='up')),
    "et des lettres qui frappent, comme un tambour !", sfx_name='djembe')
def tambour(cx, cy, s=1, strip=True, off=0, letter='m', slits=True):
    """Le bricolage : un djembé dessiné sur une feuille, une bande de voyelles qui glisse dans deux fentes."""
    w, h = 560 * s, 420 * s
    o = f'<rect x="{cx - w/2 + 8}" y="{cy - h/2 + 10}" width="{w}" height="{h}" rx="14" fill="#000" opacity=".08"/><rect x="{cx - w/2}" y="{cy - h/2}" width="{w}" height="{h}" rx="14" fill="#fff" stroke="{PUR}" stroke-width="6"/>'
    o += djembe(cx - 110 * s, cy + 10 * s, .95 * s, letter)
    bx = cx + 120 * s
    if strip:
        cid = f'clip{int(cx)}{int(cy)}{int(off)}'
        o += (f'<defs><clipPath id="{cid}"><rect x="{bx - 80 * s}" y="{cy - h/2 - 75 * s}" width="{160 * s}" height="{h + 150 * s}"/></clipPath></defs><g clip-path="url(#{cid})">'
              f'<rect x="{bx - 55 * s}" y="{cy - 330 * s + off}" width="{110 * s}" height="{660 * s}" rx="8" fill="#FFF8E8" stroke="{CV}" stroke-width="5"/>')
        for i, v in enumerate('aeiou'):
            o += text(bx, cy - 215 * s + i * 125 * s + off, v, int(96 * s), CV)
        o += '</g>'
        # la feuille repasse par-dessus la bande, sauf entre les deux fentes
        o += f'<rect x="{bx - 70 * s}" y="{cy - h/2 + 3}" width="{140 * s}" height="{h/2 - 78 * s}" fill="#fff"/><rect x="{bx - 70 * s}" y="{cy + 75 * s}" width="{140 * s}" height="{h/2 - 78 * s}" fill="#fff"/>'
    if slits:
        o += ''.join(f'<path d="M{bx - 68 * s} {cy + dy * s} h{136 * s}" stroke="{PUR}" stroke-width="6" stroke-linecap="round"/>' for dy in (-75, 75))
    return o
say(scr('À LA FIN DE LA VIDÉO', TEAL, h1('Tu vas fabriquer ton tambour à syllabes', 250), tambour(860, 660, .9, off=-112), amara(1650, 600, .8, R='out')),
    "Et à la fin, tu vas fabriquer ton tambour à syllabes !")

# ============ 2. MOT AUX PARENTS ============
S('parents')
def mat(i, label, sub, icon, n=4):
    x = 250 + i * 370
    return (card(x, 330, 310, 360, [TEAL, RED, YEL, PUR][i]) + icon(x + 155, 480)
            + text(x + 155, 625, label, 34, PUR, 'nx') + text(x + 155, 665, sub, 26, '#7A6A80', 'nb'))
def i_sheets(cx, cy): return ''.join(f'<rect x="{cx-60+d}" y="{cy-85-d/2}" width="110" height="145" rx="6" fill="#fff" stroke="{PUR}" stroke-width="5"/>' for d in (-14, 14))
def i_pen(col):
    return lambda cx, cy: f'<g transform="rotate(20 {cx} {cy})"><rect x="{cx-14}" y="{cy-90}" width="28" height="140" rx="10" fill="{col}"/><path d="M{cx-11} {cy+50} L{cx} {cy+82} L{cx+11} {cy+50}Z" fill="{PUR}"/></g>'
def i_cis(cx, cy):
    return (f'<circle cx="{cx-28}" cy="{cy+45}" r="26" fill="none" stroke="{RED}" stroke-width="10"/><circle cx="{cx+28}" cy="{cy+45}" r="26" fill="none" stroke="{RED}" stroke-width="10"/>'
            f'<path d="M{cx-18} {cy+22} L{cx+26} {cy-88} M{cx+18} {cy+22} L{cx-26} {cy-88}" stroke="#9AA" stroke-width="10" stroke-linecap="round"/>')
materiel = scr('MOT AUX PARENTS', PUR, h1('Matériel de l\'atelier', 240, PUR),
               mat(0, 'deux feuilles', 'de papier', i_sheets), mat(1, 'un feutre vert', 'pour les voyelles', i_pen(CV)),
               mat(2, 'un feutre rouge', 'pour les consonnes', i_pen(CC)), mat(3, 'des ciseaux', 'pour un adulte', i_cis),
               pill(960, 800, 'La fiche et le tambour à découper : dans la communauté Skool', PUR, 34))
say(materiel, "Bonjour les parents ! Pour l'atelier, préparez deux feuilles de papier, un feutre vert, un feutre rouge, et des ciseaux pour un adulte.")
say(materiel, "La fiche à imprimer, avec le tambour à découper, vous attend dans la communauté Les Mounas, sur Skool.")

# ============ 3. LA FÊTE À MOUNAVILLE ============
S('r')
def fete(k=0):
    it = [baobab(960, 760, .95)]
    if k >= 1: it.append(awa(520, 470, .78, sing=(k == 2)))
    if k == 2: it += [text(770 + i * 150, 330 - (i % 2) * 60, v, 120, CV) for i, v in enumerate('AOI')] + [note(700, 240, .9), note(1230, 250, .9, CV, .4)]
    if k >= 3: it += [kofi(1400, 560, .8, L='out', R='out'), djembe(1400, 850, .78)]
    if k == 3: it += [text(1130 + i * 150, 330 - (i % 2) * 60, v, 120, CC) for i, v in enumerate('BDK')]
    return svg(bg('LA FÊTE À MOUNAVILLE', TEAL, deco=False), houses(590), *it, amara(180, 660, .7, L='hip', R='down'))
say(fete(0), "Sur la place de Mounaville, sous le grand baobab, tout le monde se prépare pour la fête.")
say(fete(1), "Voici tata Awa. C'est une griotte : elle garde les histoires et les chansons du village.")
say(fete(2), "Tata Awa chante avec sa voix : A... O... I...", "Tata Awa chante avec sa voix : a, o, i.", sfx_name='chant')
say(fete(3), "Et Kofi frappe sur son djembé : B ! D ! K !", "Et Kofi frappe sur son djembé : bé ! dé ! ka !", sfx_name='djembe')
say(scr('LE SECRET DES LETTRES', PUR, h1('C\'est exactement comme les lettres !', 250, PUR),
        card(200, 360, 700, 420, CV, sw=8) + note(400, 560, 1.6) + text(650, 560, 'voix', 110, CV) + text(550, 720, 'elle chante', 54, PUR, 'nx'),
        card(1020, 360, 700, 420, CC, sw=8) + djembe(1200, 590, .7) + text(1480, 560, 'tambour', 100, CC) + text(1370, 720, 'il frappe', 54, PUR, 'nx')),
    "La voix qui chante, le tambour qui frappe : c'est exactement comme les lettres !", sfx_name='ding')

# ============ 4. LES VOYELLES ============
say(scr('LES LETTRES QUI CHANTENT', CV, text(960, 520, 'les voyelles', 220, CV), note(330, 320, 1.4), note(1600, 330, 1.4, CV, .5), amara(960, 860, .55, L='up', R='up')),
    "D'abord, les lettres qui chantent. On les appelle les voyelles.", sfx_name='whoosh')
say(scr('LES LETTRES QUI CHANTENT', CV, h1('Il y en a six', 250, CV), *six(), duo(900, 0)),
    "Il y en a six : A, E, I, O, U, et Y.", "Il y en a six : a, e, i, o, u, et i grec.")
say(scr('L\'ASTUCE', YEL, h1('Voyelle commence comme voix', 250, PUR),
        rich(960, 520, '|voy|elle', 200, CV), rich(960, 760, '|voi|x', 200, CV), note(420, 700, 1.5), note(1500, 480, 1.5, CV, .5)),
    "Astuce : voyelle, ça commence comme voix. Les voyelles, ce sont les lettres de la voix.", sfx_name='ding')
def appel(v, t=False):
    return scr('RÉPÈTE APRÈS MOI', CV, text(640, 640, v, 420, CV), amara(1400, 480, 1.25, L='down', R='down', mouth={'a': 'wide', 'o': 'o', 'i': 'flat'}[v]),
               pill(640, 760, 'bouche ouverte, rien ne se touche', PUR, 38), toi(640, 860) if t else '')
say(appel('a'), "Quand tu dis une voyelle, ta bouche est ouverte, et rien ne se touche. Répète après moi : A !", "Quand tu dis une voyelle, ta bouche est ouverte, et rien ne se touche. Répète après moi : a !")
hold(appel('a', True), 2.6, 'pop')
say(appel('o'), "O !", "o !"); hold(appel('o', True), 2.6, 'pop')
say(appel('i'), "I !", "i !"); hold(appel('i', True), 2.6, 'pop')
say(scr('L\'ASTUCE DES DOIGTS', YEL, h1('Une voyelle sur chaque doigt', 250, PUR), hand(700, 650, 1.15), at(4.5, thumb(1300, 700, 1.3)),
        at(4.5, text(1300, 930, 'et le y lève le pouce !', 50, PUR, 'nx'))),
    "Compte-les sur tes doigts : A, E, I, O, U. Et le Y ? Il lève le pouce de l'autre main !",
    "Compte-les sur tes doigts : a, e, i, o, u. Et le i grec ? Il lève le pouce de l'autre main !")

# ============ 5. LES CONSONNES ============
say(scr('LES LETTRES QUI FRAPPENT', CC, text(960, 520, 'les consonnes', 200, CC), djembe(300, 760, .8), djembe(1620, 760, .8), amara(960, 860, .55, L='up', R='up')),
    "Maintenant, les lettres qui frappent. On les appelle les consonnes.", sfx_name='djembe')
def alphabet():
    o = ''
    for i, ch in enumerate('abcdefghijklmnopqrstuvwxyz'):
        x = 210 + (i % 9) * 188; y = 440 + (i // 9) * 170
        o += text(x, y, ch, 130, CV if ch in 'aeiouy' else CC)
    return o
say(scr('LES LETTRES QUI FRAPPENT', CC, h1('Toutes les autres lettres : il y en a vingt', 250, CC), alphabet(), duo(940, 1)),
    "Toutes les autres lettres sont des consonnes. Il y en a vingt !")
def bouche(k):
    rows = [('tes lèvres', 'm  p  b'), ('ta langue', 't  d  l'), ('tes dents', 'f  v')]
    o = []
    for i, (lab, ls) in enumerate(rows[:k]):
        y = 400 + i * 170
        o.append(card(260, y - 90, 420, 140, CC, sw=7) + text(470, y + 4, lab, 60, PUR) + text(1000, y + 20, ls, 130, CC))
    return scr('LES LETTRES QUI FRAPPENT', CC, h1('Dans ta bouche, quelque chose se touche', 250, CC), *o, amara(1600, 560, .9, L='down', R='down', mouth='flat'))
say(bouche(1), "Pour dire une consonne, quelque chose se touche dans ta bouche. Tes lèvres : M, P, B.",
    "Pour dire une consonne, quelque chose se touche dans ta bouche. Tes lèvres : mmm, peu, beu.")
say(bouche(2), "Ta langue : T, D, L.", "Ta langue : teu, deu, leu.")
say(bouche(3), "Tes dents sur ta lèvre : F, V.", "Tes dents sur ta lèvre : fff, vvv.")

# ============ 6. ENSEMBLE ============
say(scr('ENSEMBLE, ELLES DANSENT', PUR, h1('Une frappe + un chant', 250, PUR),
        djembe(430, 600, .9, 'b'), text(720, 620, '+', 150, '#7A6A80', 'fr'), card(830, 440, 260, 300, CV, sw=9) + text(960, 660, 'a', 220, CV),
        text(1220, 620, '=', 150, '#7A6A80', 'fr'), at(4.6, card(1330, 440, 400, 300, PUR, sw=9) + rich(1530, 660, vc('ba'), 220))),
    "Et le plus beau, c'est quand elles jouent ensemble. Une frappe, plus un chant : B, A... BA !",
    "Et le plus beau, c'est quand elles jouent ensemble. Une frappe, plus un chant : beu, a... ba !", sfx_name='djembe')
say(scr('L\'ASTUCE', YEL, h1('Consonne veut dire : qui sonne avec', 250, PUR),
        rich(960, 540, '|con|sonne', 200, CC), text(960, 740, 'elle sonne avec une voyelle', 70, PUR), djembe(330, 800, .6), note(1600, 760, 1.5)),
    "Astuce : consonne, ça veut dire qui sonne avec. Une consonne sonne avec une voyelle.", sfx_name='ding')
say(scr('ENSEMBLE, ELLES DANSENT', PUR, h1('Dans chaque morceau, une voyelle chante', 250, PUR), baobab(330, 900, .75),
        at(3.2, card(640, 430, 300, 240, PUR, sw=6) + rich(790, 600, vc('ba'), 150)), at(4.0, card(980, 430, 220, 240, PUR, sw=6) + rich(1090, 600, vc('o'), 150)),
        at(4.8, card(1240, 430, 380, 240, PUR, sw=6) + rich(1430, 600, vc('bab'), 150)), text(1130, 800, 'baobab', 90, PUR)),
    "Écoute le mot baobab. BA, O, BAB. Dans chaque morceau, il y a une voyelle qui chante.",
    "Écoute le mot baobab. Ba. O. Bab. Dans chaque morceau, il y a une voyelle qui chante.")

# ============ 7. LA DANSE DES LETTRES ============
say(scr('DEBOUT ! LA DANSE DES LETTRES', TEAL, h1('On joue avec tout le corps', 260, TEALT), amara(960, 520, 1.2, L='up', R='up')),
    "Debout ! C'est la danse des lettres.", sfx_name='tada')
say(scr('DEBOUT ! LA DANSE DES LETTRES', TEAL, h1('Regarde la lettre, et danse !', 240, TEALT),
        card(200, 340, 700, 440, CV, sw=8) + text(550, 470, 'voyelle', 100, CV) + note(430, 640, 1.3) + note(640, 620, 1.3, CV, .4) + text(550, 740, 'ouvre les bras et chante', 46, PUR, 'nx'),
        at(4.2, card(1020, 340, 700, 440, CC, sw=8) + text(1370, 470, 'consonne', 100, CC) + djembe(1370, 610, .45) + text(1370, 740, 'tape dans tes mains', 46, PUR, 'nx'))),
    "Si tu vois une voyelle, ouvre grand les bras et chante. Si tu vois une consonne, tape dans tes mains, comme sur un djembé.")
def danse(L, kind=None, hop=False):
    c = PUR if kind is None else (CV if kind == 'v' else CC)
    return scr('DEBOUT ! LA DANSE DES LETTRES', TEAL, text(680, 640, L, 460, c),
               (text(680, 800, 'une voyelle : on chante !' if kind == 'v' else 'une consonne : on frappe !', 70, c) if kind else pill(680, 760, 'voyelle ou consonne ?', PUR, 46)),
               f'<ellipse cx="1420" cy="975" rx="150" ry="20" fill="#000" opacity=".12"/>',
               f'<g [[HOP {120 if hop else 0}]]>' + amara(1420, 460, 1.1, L='up' if kind == 'v' else 'down', R='up' if kind == 'v' else 'down', mouth='wide' if kind == 'v' else 'smile') + '</g>')
for L, name, tname, kind in [('a', 'A.', 'a.', 'v'), ('m', 'M.', 'ème.', 'c'), ('o', 'O.', 'o.', 'v'), ('k', 'K.', 'ka.', 'c')]:
    say(danse(L), name, tname, pad=0.3)
    hold(danse(L), 2.6)
    if kind == 'v':
        say(danse(L, 'v'), f"{name[0]} : une voyelle ! On chante !", f"{tname[:-1]} : une voyelle ! On chante !", pad=0.2, sfx_name='chant'); hold(danse(L, 'v'), 0.8)
    else:
        say(danse(L, 'c'), f"{name[0]} : une consonne ! On frappe !", f"{tname[:-1]} : une consonne ! On frappe !", pad=0.2, sfx_name='djembe')
        for _ in range(2): hold(danse(L, 'c', hop=True), 0.5, 'boing')

# ============ 8. QUIZ ============
def quiz(word, k=None, ans=None):
    mid = card(460, 330, 1000, 280, PUR, sw=9) + (rich(960, 530, vc(word), 170) if ans else text(960, 530, word, 170, PUR))
    cd = (f'<circle cx="240" cy="470" r="90" fill="{YEL}"/>' + text(240, 512, str(k), 120, PUR, 'fr') + '[[RING 240 470 104]]') if k else ''
    res = (check(1600, 470, 60) + pill(960, 700, ans, CV, 56)) if ans else pill(960, 700, 'montre le nombre avec tes doigts', PUR, 40)
    return scr('PETIT QUIZ', RED, h1('Combien de voyelles dans ce mot ?', 250), mid, cd, res)
say(scr('PETIT QUIZ', RED, h1('Combien de voyelles dans ce mot ?', 300), *six(620, 6, 150), pill(960, 780, 'montre le nombre avec tes doigts', PUR, 44)),
    "Petit quiz ! Combien de voyelles dans ce mot ? Montre le nombre avec tes doigts.", sfx_name='tada')
for word, plain, ans, phrase, alt in [
        ('kora', "Kora. C'est l'instrument à cordes des griots.", 'deux : o, a', "Deux voyelles : O, et A.", "Deux voyelles : o, et a."),
        ('amara', "Amara.", 'trois : a, a, a', "Trois voyelles : A, A, A ! Mon prénom chante beaucoup !", "Trois voyelles : a, a, a ! Mon prénom chante beaucoup !"),
        ('stylo', "Attention, un piège : stylo.", 'deux : y, o', "Deux ! Le Y est une voyelle, lui aussi. Bien joué !", "Deux ! Le i grec est une voyelle, lui aussi. Bien joué !")]:
    say(quiz(word), plain, pad=0.2)
    countdown(lambda k: quiz(word, k), 3)
    say(quiz(word, ans=ans), phrase, alt, sfx_name='ding')

# ============ 9. LES DÉFIS DE LA BOUCHE ============
def defib(big, c, tip, mouth='smile', pose='down', t=False):
    return scr('LE DÉFI DES LÈVRES' if 'maman' in big else 'L\'ASTUCE DU MENTON', PUR, rich(620, 560, big, 190, c), pill(620, 700, tip, PUR, 40),
               toi(620, 800) if t else '', amara(1380, 470, 1.25, L='down', R=pose, mouth=mouth))
say(defib('maman', CC, 'sans que tes lèvres se touchent'), "Voici le défi des lèvres ! Essaie de dire maman, sans que tes lèvres se touchent.", sfx_name='tada')
hold(defib('maman', CC, 'sans que tes lèvres se touchent', t=True), 3.2, 'pop')
say(defib('|m|a|m|an', CC, 'le m est une consonne : les lèvres frappent', 'flat'), "Impossible ! Le M est une consonne : tes lèvres doivent frapper.",
    "Impossible ! Le ème est une consonne : tes lèvres doivent frapper.", sfx_name='oops')
say(defib(vc('baobab'), PUR, 'une main sous ton menton', 'wide', 'nose'), "Maintenant, pose ta main sous ton menton, et dis : baobab.")
hold(defib(vc('baobab'), PUR, 'une main sous ton menton', 'wide', 'nose', t=True), 3.0, 'pop')
say(defib(vc('baobab'), PUR, 'ton menton descend à chaque voyelle', 'smile', 'nose'), "Ton menton est descendu trois fois : une fois pour chaque voyelle. C'est l'astuce du menton !", sfx_name='ding')

# ============ 10. L'ATELIER ============
AT = 'L\'ATELIER : LE TAMBOUR À SYLLABES'
def etape(n, *parts, sub=None):
    return scr(AT, TEAL, pill(960, 130, f'ÉTAPE {n}', RED, 34), text(960, 290, sub, 50, PUR) if sub else '', *parts)
def pause(msg):
    return scr(AT, TEAL, f'<rect x="860" y="330" width="70" height="230" rx="16" fill="{RED}"/><rect x="990" y="330" width="70" height="230" rx="16" fill="{RED}"/>',
               text(960, 700, 'METS SUR PAUSE', 100, RED), text(960, 790, msg, 46, PUR, 'nx'))
say(scr(AT, TEAL, h1('C\'est l\'heure de l\'atelier !', 250), tambour(860, 670, .9, off=-112), amara(1650, 600, .8, R='out')),
    "C'est l'heure de l'atelier ! On fabrique le tambour à syllabes.", sfx_name='tada')
say(etape(1, tambour(960, 640, 1.1, strip=False, slits=False), sub='Un grand djembé, et la consonne m en rouge'),
    "Sur la première feuille, dessine un grand djembé. Écris dessus la consonne M, en rouge.", "Sur la première feuille, dessine un grand djembé. Écris dessus la consonne ème, en rouge.")
say(etape(2, tambour(960, 640, 1.1, strip=False), pill(1500, 600, 'un adulte t\'aide', RED, 40), sub='Deux petites fentes à côté du m'),
    "Un adulte coupe deux petites fentes, juste à côté du M.", "Un adulte coupe deux petites fentes, juste à côté du ème.")
bande = (f'<rect x="900" y="340" width="120" height="640" rx="8" fill="#FFF8E8" stroke="{CV}" stroke-width="6"/>' + ''.join(text(960, 450 + i * 122, v, 100, CV) for i, v in enumerate('aeiou')))
say(etape(3, bande, pill(1400, 600, 'un adulte découpe la bande', RED, 40), sub='Une longue bande, les voyelles en vert'),
    "Dans l'autre feuille, un adulte découpe une longue bande. Écris les voyelles en vert, l'une sous l'autre : A, E, I, O, U.",
    "Dans l'autre feuille, un adulte découpe une longue bande. Écris les voyelles en vert, l'une sous l'autre : a, e, i, o, u.")
hold(pause('et reviens quand ton tambour et ta bande sont prêts'), 0.4, 'ding')
say(pause('et reviens quand ton tambour et ta bande sont prêts'), "Mets sur pause, et reviens quand ton tambour et ta bande sont prêts.")
hold(pause('et reviens quand ton tambour et ta bande sont prêts'), 2.5)
say(etape(4, tambour(960, 680, 1.0, off=-125), sub='La bande glisse dans les deux fentes'), "Glisse la bande dans les deux fentes.")
def lire(i):
    syl = ['ma', 'me', 'mi', 'mo', 'mu'][i]
    return etape(5, tambour(760, 680, 1.0, off=(2 - i) * 125), card(1330, 480, 420, 300, PUR, sw=8) + rich(1540, 700, vc(syl), 200), sub='Tire doucement, et lis')
say(lire(0), "Tire tout doucement, et lis : MA !", "Tire tout doucement, et lis : ma !", pad=0.2)
for i, (s_, t_) in enumerate([('ME !', 'meu !'), ('MI !', 'mi !'), ('MO !', 'mo !'), ('MU !', 'mu !')], 1):
    say(lire(i), s_, t_, pad=0.15, sfx_name='pop')
say(lire(4), "Ton tambour à syllabes est prêt !", sfx_name='tada')

# ============ 11. ON JOUE ============
def defi(n, titre_, *parts):
    return scr('ON JOUE !', PUR, pill(960, 130, f'DÉFI {n}' if n else 'TON DÉFI À TOI', RED, 34), lines(960, 270, titre_, 50, PUR), *parts)
say(defi(1, ['Lis les cinq syllabes', 'en tapant le rythme sur la table'], *[card(180 + i * 320, 480, 280, 240, PUR, sw=6) + rich(320 + i * 320, 650, vc(s_), 150) for i, s_ in enumerate(['ma', 'me', 'mi', 'mo', 'mu'])]),
    "Défi numéro un. Lis les cinq syllabes, en tapant le rythme sur la table.")
say(defi(2, ['Change de consonne : colle un petit papier', 'avec un b, un k ou un t'], djembe(420, 720, .85, 'b'), djembe(960, 720, .85, 'k'), djembe(1500, 720, .85, 't')),
    "Défi numéro deux. Change de consonne : colle un petit papier avec un B, un K, ou un T, et lis encore.",
    "Défi numéro deux. Change de consonne : colle un petit papier avec un bé, un ka, ou un té, et lis encore.")
say(defi(3, ['Trouve un mot qui commence par ta syllabe'], card(240, 420, 640, 330, PUR, sw=6) + rich(560, 560, vc('ma'), 130) + text(560, 690, 'comme mangue', 64, PUR),
         at(4.6, card(1040, 420, 640, 330, PUR, sw=6) + rich(1360, 560, vc('ko'), 130) + text(1360, 690, 'comme kora', 64, PUR))),
    "Défi numéro trois. Trouve un mot qui commence par ta syllabe. MA, comme mangue. KO, comme kora.",
    "Défi numéro trois. Trouve un mot qui commence par ta syllabe. Ma, comme mangue. Ko, comme kora.")
say(defi(0, ['Écris ton prénom : les voyelles en vert,', 'les consonnes en rouge'], card(360, 470, 1200, 280, PUR, sw=6) + rich(960, 670, vc('Amara'), 200), duo(860)),
    "Et ton défi à toi : écris ton prénom. Les voyelles en vert, les consonnes en rouge.")

# ============ 12. RÉCAP ============
def recap():
    return scr('BRAVO !', RED, confetti(9, 50), h1('Tu connais le secret des lettres', 240),
               card(140, 320, 800, 500, CV, sw=8) + text(540, 430, 'les voyelles chantent', 62, CV) + ''.join(text(215 + i * 130, 590, v, 120, CV) for i, v in enumerate(VLET)) + note(540, 730, 1.2),
               card(980, 320, 800, 500, CC, sw=8) + text(1380, 430, 'les consonnes frappent', 62, CC) + text(1380, 570, 'b  d  k  m  t...', 100, CC) + djembe(1380, 710, .42),
               pill(960, 880, 'ensemble, elles font danser les mots', PUR, 46))
say(recap(), "Bravo ! Tu connais le secret des lettres.", sfx_name='tada')
say(recap(), "Les voyelles chantent : A, E, I, O, U, Y. Les consonnes frappent. Et ensemble, elles font danser les mots.",
    "Les voyelles chantent : a, e, i, o, u, i grec. Les consonnes frappent. Et ensemble, elles font danser les mots.")
say(scr('LA DERNIÈRE ASTUCE', YEL, h1('Explique-le à quelqu\'un de ta famille', 230, PUR), pill(960, 270, 'quand on explique, on retient encore mieux', PUR, 44),
        amara(700, 600, .95, L='down', R='out'), awa(1250, 570, .8)),
    "Dernière astuce : ce soir, explique-le à quelqu'un de ta famille. Quand on explique, on retient encore mieux !")
fin = svg(bg('AU REVOIR', TEAL), confetti(12), amara(700, 420, 1.0, L='down', R='up'), kofi(1000, 450, .92, L='up', R='down'), djembe(1330, 700, .8), text(960, 970, 'À bientôt chez les Mounas !', 80, PUR))
say(fin, "À bientôt chez les Mounas !")
hold(fin, 2.0)

if __name__ == '__main__':
    mode = sys.argv[1] if len(sys.argv) > 1 else 'video'
    if mode == 'lines':
        for i, (k, l) in enumerate(LINES, 1): print(f'{i}. {l}')
    else:
        print(render('voyelles-consonnes'), round(total()), 's')
