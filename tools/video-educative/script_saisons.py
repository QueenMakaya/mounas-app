"""Épisode « Quand est-ce qu'il va neiger ? Les 4 saisons » (nov. 2026)."""
import math, random, sys
from draw import *
from engine import Timeline

T = Timeline('saisons')
say, hold, countdown, anim = T.say, T.hold, T.countdown, T.anim
ORDER = ['printemps', 'ete', 'automne', 'hiver']


def moon(x, y, s=1):
    return g(f'<circle r="60" fill="{YEL}"/><circle cx="28" cy="-18" r="56" fill="{CREAM}"/>', x, y, s)


def sunset(x, y, s=1):
    return g(f'<clipPath id="ss"><rect x="-90" y="-100" width="180" height="100"/></clipPath>'
             f'<g clip-path="url(#ss)">{sun(0, 0, 50, False)}</g><rect x="-100" y="-4" width="200" height="10" rx="5" fill="{PUR}"/>', x, y, s)


def caption_rows(rows, n, x=1000, y0=260, step=175):
    o = ''
    for i, (ic, cap) in enumerate(rows[:n]):
        y = y0 + i * step
        o += f'<rect x="{x}" y="{y - 70}" width="800" height="140" rx="70" fill="white" opacity=".9"/>'
        o += g(ic, x + 85, y, 1)
        o += text(x + 180, y + 18, cap, 46, PUR, FN, 'start')
    return o


def season_scene(key, rows, n, extra='', fall=0.0, ground=True):
    name, col, dark = SEASON[key]
    c = ''
    if ground:
        gc = {'printemps': '#CDEFB0', 'ete': '#BFE8A0', 'automne': '#F5D9A8', 'hiver': '#FFFFFF'}[key]
        c += f'<ellipse cx="520" cy="930" rx="460" ry="70" fill="{gc}"/>'
    c += extra
    c += tree(key, 520, 920, 1.25, fall=fall)
    c += caption_rows(rows, n)
    return bg(c, name, col)


# ================= 0. Mot aux parents =================
mats = [(plate(0, 0, 90), 'une assiette\nen carton'), (marker(0, 0, .6, 30) + marker(30, 10, .6, 50, TEAL), 'des feutres'),
        (f'<rect x="-90" y="-60" width="180" height="120" rx="8" fill="#C79A5B"/>', 'un morceau\nde carton'),
        (brad(0, -20, 1.2), 'une attache\nparisienne'), (scissors(-40, 0, .9), 'des ciseaux\n(adulte)')]


def parents(n):
    c = text(W / 2, 220, 'Matériel du bricolage', 64, PUR)
    for i, (ic, lab) in enumerate(mats[:n]):
        x = 260 + i * 350
        c += card(x - 145, 330, 290, 420, g(ic, x, 480) + text(x, 640, lab, 34, PUR, FN))
    return bg(c, 'MOT AUX PARENTS', PUR)


say(parents(0), "Bonjour les parents ! Aujourd'hui, on découvre les quatre saisons avec votre enfant.", 'whoosh')
say(parents(0), "À la fin de la vidéo, on fabrique ensemble une roue des saisons.")
say(parents(5), "Préparez une assiette en carton, des feutres, un petit morceau de carton, une attache parisienne et des ciseaux.", 'pop')
say(parents(5), "Pour les ciseaux et le petit trou, un adulte aide. C'est parti !")

# ================= 1. Intro =================
def intro(t, mouth='smile', arms='down', bubble=None, snow=False):
    inside = ''
    rnd = random.Random(2)
    inside += tree('automne', 520, 830, .9, fall=t)
    if snow:
        for i in range(24):
            ph = (t + i / 24) % 1
            inside += snowflake(220 + (i * 53) % 640, 220 + ph * 640, .35, 0, '#5BB8E0')
    c = window(200, 200, 640, 640, inside)
    c += amara(1300, 640, 1.15, arms, mouth)
    if bubble:
        c += (f'<path d="M1180 360 L1230 450 L1270 360 Z" fill="white"/>'
              f'<rect x="980" y="150" width="720" height="230" rx="50" fill="white"/>' + text(1340, 250, bubble, 52, PUR, FT))
    return bg(c)


anim(lambda t: intro(t, 'smile', 'wave'), 3, text="Coucou ! C'est moi, Amara !", sfx_='tada')
anim(lambda t: intro(t, 'o', 'think', 'Quel jour\nil va neiger ?'), 3,
     text="Ce matin, j'ai regardé par la fenêtre, et j'ai demandé à Maman : quel jour il va neiger ?")
anim(lambda t: intro(t, 'smile', 'down', 'Ça dépend\nde la saison !'), 3, text="Et Maman m'a répondu : ça dépend de la saison !")
anim(lambda t: intro(t, 'o', 'think', 'Les saisons ?\nC\'est quoi ?'), 3, text="Les saisons ? C'est quoi, les saisons ?", sfx_='boing')


def title_card(k=4):
    c = text(W / 2, 330, "Quand est-ce qu'il", 92, PUR) + text(W / 2, 440, 'va neiger ?', 92, RED)
    for i, key in enumerate(ORDER[:k]):
        x = 420 + i * 360
        c += f'<circle cx="{x}" cy="700" r="130" fill="{SEASON[key][1]}"/>'
        ic = {'printemps': flower(0, -10, 1.4, 'white', YEL, False), 'ete': sun(0, 0, 60, True), 'automne': leaf(0, 0, 1.8, 25, '#A93C06'),
              'hiver': snowflake(0, 0, 1.6)}[key]
        c += g(ic, x, 690)
        c += text(x, 880, SEASON[key][0], 40, SEASON[key][2], FT)
    return bg(c, 'LES 4 SAISONS', RED)


for k in range(1, 5):
    hold(title_card(k), .45, 'pop')
say(title_card(), "Aujourd'hui, on découvre les saisons ensemble.")
say(title_card(), "Et à la fin, tu vas fabriquer ta propre roue des saisons ! Prêt ? Prête ? On y va !", 'tada')

# ================= 2. Mounaville =================
def park(t, n=0, leafbig=False):
    c = f'<rect x="0" y="820" width="{W}" height="260" fill="#F5D9A8"/>'
    c += tree('automne', 420, 860, 1.3, fall=t) + tree('automne', 1700, 840, .8, fall=(t + .5) % 1)
    c += amara(900, 640, .95, 'point' if n else 'down', 'o' if n else 'smile')
    c += kofi(1270, 650, .95, 'up' if leafbig else 'wave')
    if leafbig:
        c += leaf(1400, 420, 2.2, 25, ORANGE)
    c += pill(W / 2, 64, 'MOUNAVILLE', PUR)
    return bg(c, logo=True)


anim(lambda t: park(t), 3, text="À Mounaville, je me promène au parc avec mon ami Kofi.")
anim(lambda t: park(t, 0, True), 3, text="Kofi ramasse une feuille toute orange. Il me dit : regarde, Amara ! Les arbres changent de couleur !")
anim(lambda t: park(t, 1, True), 3, text="C'est vrai ! Avant, les feuilles étaient vertes. Pourquoi elles changent ? Parce que les saisons changent !")

# ================= 3a. Une année, quatre saisons =================
def year(hi=None, k=4, arrow=None, label=True):
    c = season_wheel(W / 2, 580, 360, hi, True, arrow)
    if label:
        c += text(W / 2, 175, 'Une année = 4 saisons', 60, PUR)
    return bg(c, 'LES SAISONS', TEAL)


say(year(), "Une année, c'est long, très long. Dans une année, il y a quatre saisons.")
for key, line in zip(ORDER, ["Le printemps,", "l'été,", "l'automne,", "et l'hiver."]):
    say(year(key), line, 'pop', pad=.25)
anim(lambda t: year(None, arrow=t * 360 + 45), 4, text="Et après l'hiver ? Ça recommence ! Le printemps revient. Les saisons font une grande ronde, comme une roue qui tourne.", sfx_='whoosh')

# ================= 3b. Printemps =================
R_P = [(sun(0, 0, 34, False), 'Il fait plus doux'), (flower(0, -20, .7), 'Les fleurs sortent'),
       (leaf(0, 0, .9, 20, LGREEN), 'Des feuilles toutes neuves'), (bird(0, 0, 1.2), 'Les oiseaux chantent')]
flw = ''.join(flower(x, 900, .7, c) for x, c in [(150, PINK), (260, YEL), (780, 'white'), (880, PINK)])
say(season_scene('printemps', R_P, 0), "Commençons par le printemps !", 'tada')
say(season_scene('printemps', R_P, 1), "Au printemps, il fait de plus en plus doux.", 'pop')
say(season_scene('printemps', R_P, 2, flw), "La neige fond, et les fleurs sortent de la terre.", 'pop')
say(season_scene('printemps', R_P, 3, flw), "Les arbres se couvrent de petites feuilles toutes neuves.", 'pop')
say(season_scene('printemps', R_P, 4, flw + bird(300, 260, 1.2) + bird(420, 200)), "Les oiseaux chantent, et beaucoup de bébés animaux naissent.", 'birds')

# ================= 3c. Été =================
R_E = [(sun(0, 0, 34, True), 'Il fait chaud !'), (sunset(0, 20, .8), 'Les journées sont longues'),
       (icecream(0, 10, .55), 'On mange des glaces'), (swimsuit(0, 0, .6), 'On se baigne')]
say(season_scene('ete', R_E, 0, sun(150, 230, 80)), "Ensuite vient l'été !", 'tada')
say(season_scene('ete', R_E, 1, sun(150, 230, 80)), "En été, il fait chaud ! C'est la saison la plus chaude de l'année.", 'pop')
say(season_scene('ete', R_E, 2, sun(150, 230, 80)), "Les journées sont très longues : parfois, il fait encore jour quand on va au lit !", 'pop')
say(season_scene('ete', R_E, 4, sun(150, 230, 80)), "On mange des glaces, on se baigne, et on n'oublie pas la crème solaire.", 'pop')

# ================= 3d. Automne =================
R_A = [(cloud(0, 0, .45, '#B8C4D6'), 'Il fait plus frais'), (leaf(0, 0, 1, 20, ORANGE), 'Les feuilles tombent'),
       (squirrel(0, 10, .45), "L'écureuil cache\ndes noisettes"), (bird(-20, -10, .8) + bird(20, 15, .8), 'Des oiseaux partent\nvers le chaud')]
R_A2 = [(a, b.replace('\n', ' ')) if i < 2 else (a, b) for i, (a, b) in enumerate(R_A)]
say(season_scene('automne', R_A, 0), "Après l'été, voici l'automne ! C'est la réponse à la question de Kofi.", 'tada')
say(season_scene('automne', R_A, 1), "En automne, il fait plus frais. On sort les vestes.", 'wind')
anim(lambda t: season_scene('automne', R_A, 2, fall=t), 4,
     text="Les feuilles de beaucoup d'arbres deviennent jaunes, orange et rouges. Puis elles tombent, tout doucement.")
say(season_scene('automne', R_A, 3, fall=.6), "L'écureuil cache des noisettes pour l'hiver.", 'pop')
say(season_scene('automne', R_A, 4, fall=.8), "Et certains oiseaux s'envolent vers des pays plus chauds.", 'birds')

# ================= 3e. Hiver =================
R_H = [(bonnet(0, 10, .45), 'Il fait froid'), (moon(0, 0, .8), 'La nuit arrive tôt'),
       (snowflake(0, 0, 1.1, 0, SKY), 'Parfois, il neige'), (marmot(0, 10, .28), 'La marmotte dort')]


def winter(n, t=0.0, extra=''):
    fl = ''.join(snowflake(80 + (i * 97) % 880, 150 + ((t + i / 18) % 1) * 800, .4, i * 20, SKY) for i in range(18))
    return season_scene('hiver', R_H, n, snowman(880, 930, .55) + extra + fl)


say(winter(0), "Et enfin, l'hiver !", 'tada')
say(winter(1, .1), "En hiver, il fait froid. C'est la saison la plus froide de l'année.", 'brr')
say(winter(2, .2), "Les journées sont courtes : il fait nuit très tôt, parfois avant le repas du soir.", 'pop')
anim(lambda t: winter(3, t), 3, text="Et dans beaucoup d'endroits, il neige !", sfx_='pop')
say(winter(4, .5), "La marmotte, elle, dort presque tout l'hiver, bien au chaud dans son terrier.", 'pop')


# ================= 3f. La neige =================
def snow_cloud(t, big=False):
    c = cloud(W / 2, 260, 2.2, '#B8C4D6')
    for i in range(26):
        ph = (t + i / 26) % 1
        c += snowflake(560 + (i * 131) % 800, 380 + ph * 620, .55, ph * 180, '#5BB8E0')
    if big:
        c = f'<circle cx="{W / 2}" cy="580" r="330" fill="{SKY}" opacity=".35"/>' + snowflake(W / 2, 580, 6.5, t * 30, '#5BB8E0')
        c += text(W / 2, 1010, '6 branches', 60, PUR)
    return bg(c, 'LA NEIGE', SKY)


anim(lambda t: snow_cloud(t), 4, text="Mais comment elle se fabrique, la neige ?")
anim(lambda t: snow_cloud(t), 5, text="Quand il fait très, très froid, l'eau des nuages se transforme en tout petits cristaux de glace. Ce sont les flocons de neige !")
anim(lambda t: snow_cloud(t, True), 4, text="Regarde bien un flocon de près : il a souvent six branches. Compte avec moi : un, deux, trois, quatre, cinq, six !")


# ================= 3g. Alors, quel jour ? =================
def meteo(n=0):
    days = [('LUN', sun(0, 0, 38, False)), ('MAR', cloud(0, 0, .5, '#B8C4D6')), ('MER', rain(0, -20, .5)),
            ('JEU', snowflake(0, 0, 1.2, 0, SKY)), ('VEN', snowflake(0, 0, 1.2, 0, SKY))]
    c = f'<rect x="260" y="230" width="1400" height="560" rx="40" fill="{PUR}"/><rect x="290" y="260" width="1340" height="500" rx="26" fill="#2A0640"/>'
    c += text(W / 2, 345, 'MÉTÉO', 60, YEL)
    for i, (d, ic) in enumerate(days[:n] if n else days):
        x = 420 + i * 270
        c += f'<rect x="{x - 110}" y="400" width="220" height="300" rx="24" fill="{ICE if i >= 3 else "white"}"/>'
        c += text(x, 460, d, 42, PUR, FN) + g(ic, x, 580)
    c += amara(1720, 840, .6, 'point')
    return bg(c, 'QUEL JOUR IL VA NEIGER ?', RED)


say(intro(.3, 'o', 'think', 'Quel jour\nil va neiger ?'), "Alors, Amara, quel jour il va neiger ?", 'boing')
say(intro(.4, 'smile', 'down', 'Personne ne le\nsait longtemps\nà l\'avance !'), "Personne ne le sait longtemps à l'avance !")
say(year('hiver'), "La neige arrive en hiver, et parfois déjà à la fin de l'automne.")
say(meteo(), "Pour connaître le jour, on regarde la météo, à la télé ou sur le téléphone. Elle peut le dire quelques jours avant.", 'ding')

# ================= 3h. Pourquoi des saisons ? =================
CX, CY = W / 2, 590


def orbit_frame(t, labels=False, rays=False, focus=None, tilt_note=False):
    a = 2 * math.pi * t
    ex, ey = CX + 640 * math.cos(a), CY + 260 * math.sin(a)
    c = f'<ellipse cx="{CX}" cy="{CY}" rx="640" ry="260" fill="none" stroke="white" stroke-width="4" stroke-dasharray="14 14" opacity=".5"/>'
    c += sun(CX, CY, 120, True)
    if labels:
        c += text(CX + 640, CY - 200, 'ÉTÉ chez nous', 44, YEL, FN) + text(CX - 640, CY - 200, 'HIVER chez nous', 44, SKY, FN)
    pin = f'<circle cx="0" cy="-58" r="12" fill="{RED}" stroke="white" stroke-width="4"/>'
    if rays and focus:
        side = 1 if focus == 'ete' else -1
        for dy in (-40, 0, 40):
            c += f'<line x1="{CX + side * 160}" y1="{CY + dy}" x2="{CX + side * 520}" y2="{CY + dy * .6}" stroke="{YEL}" stroke-width="10" stroke-dasharray="20 14" stroke-linecap="round"/>'
    c += earth(ex, ey, 95, -23.5, True, True, (pin,))
    if tilt_note:
        c += text(ex, ey + 190, 'penchée', 44, 'white', FN)
    return space_bg(c, 'POURQUOI ?')


say(orbit_frame(0), "Mais pourquoi est-ce qu'il y a des saisons ?", 'whoosh')
anim(lambda t: orbit_frame(t), 6, text="Tu te souviens ? La Terre tourne autour du Soleil. Un tour complet, ça dure une année.")
say(orbit_frame(.25, tilt_note=True), "Et regarde bien : la Terre est un peu penchée, comme une toupie qui penche.")
say(orbit_frame(0, True, True, 'ete'), "Quand notre côté de la Terre est penché vers le Soleil, ses rayons nous chauffent fort : c'est l'été.", 'pop')
say(orbit_frame(.5, True, True, 'hiver'), "Quand notre côté est penché de l'autre côté, les rayons nous chauffent moins : c'est l'hiver.", 'pop')
anim(lambda t: orbit_frame(t, True), 5, text="Et entre les deux, c'est le printemps et l'automne. La Terre tourne, et les saisons changent !")

# ================= 4. Jeu du corps =================
def body(key, arms, mouth='smile', big=None, extra=''):
    c = extra + amara(W / 2, 640, 1.2, arms, mouth)
    if big:
        c += text(W / 2, 1010, big, 64, SEASON[key][2] if key else PUR)
    title = SEASON[key][0] if key else 'DEBOUT !'
    return bg(c, title, SEASON[key][1] if key else RED)


fall_leaves = lambda t: ''.join(leaf(560 + (i * 113) % 800, 200 + ((t + i / 10) % 1) * 600, .8, i * 40 + t * 300, [ORANGE, YEL][i % 2]) for i in range(10))
say(body(None, 'up', big='On fait l\'arbre des saisons !'), "Debout ! On joue à l'arbre des saisons.", 'tada')
say(body(None, 'up', big='Pieds = racines · Bras = branches'), "Lève-toi et deviens un arbre. Tes pieds sont les racines, tes bras sont les branches.")
say(body('printemps', 'up', extra=''.join(flower(x, y, .8) for x, y in [(560, 300), (1360, 300), (600, 700), (1320, 700)]), big='Ouvre grand tes mains !'),
    "Au printemps, l'arbre se réveille : ouvre grand tes mains, comme des petites feuilles !", 'pop')
hold(body('printemps', 'up', extra=''.join(flower(x, y, .8) for x, y in [(560, 300), (1360, 300), (600, 700), (1320, 700)]), big='Ouvre grand tes mains !'), 2.5)
say(body('ete', 'up', extra=sun(1500, 260, 90), big='Les bras vers le soleil !'), "En été, le soleil brille : lève les bras très haut, vers le soleil !", 'pop')
hold(body('ete', 'up', extra=sun(1500, 260, 90), big='Les bras vers le soleil !'), 2.5)
anim(lambda t: body('automne', 'down', 'o', 'Les feuilles tombent...', fall_leaves(t)), 4,
     text="En automne, les feuilles tombent : fais descendre tes doigts tout doucement, jusqu'au sol.", sfx_='wind')
anim(lambda t: body('automne', 'down', 'o', 'Les feuilles tombent...', fall_leaves(t)), 2.5)
anim(lambda t: body('hiver', 'shiver', 'brr', 'Brrr ! On grelotte !', ''.join(snowflake(560 + (i * 113) % 800, 200 + ((t + i / 12) % 1) * 600, .5, 0, SKY) for i in range(12))), 4,
     text="En hiver, brrr, il fait froid ! Serre tes bras et grelotte !", sfx_='brr')
hold(body('hiver', 'shiver', 'brr', 'Brrr ! On grelotte !'), 2)
say(body(None, 'up', big='Plus vite !'), "Encore une fois, plus vite !", 'boing')
for key, arms, word in [('printemps', 'up', 'Printemps !'), ('ete', 'up', 'Été !'), ('automne', 'down', 'Automne !'), ('hiver', 'shiver', 'Hiver !')]:
    say(body(key, arms, big=word), word, 'pop', pad=1.2)
say(body(None, 'wave', big='Bravo !'), "Bravo ! Tu es un super arbre. Tu peux t'asseoir.", 'tada')


# ================= 5. Toujours chaud =================
AFR = [(-17, 21), (-16, 15), (-17, 13), (-11, 7), (-8, 4.5), (-2, 5), (5, 6), (9, 4), (10, 1), (9, -2), (12, -6), (13, -12), (12, -17), (15, -27),
       (18, -34), (20, -35), (26, -34), (31, -29), (33, -26), (35, -24), (40, -15), (40, -10), (39, -5), (42, 0), (46, 2), (51, 11), (44, 11),
       (43, 12), (39, 17), (35, 23), (33, 28), (32, 31), (25, 32), (20, 31), (11, 33), (10, 37), (3, 37), (-2, 35), (-6, 36), (-10, 30), (-13, 27)]


def africa(x0, y0, k, n_city=2):
    P = lambda lo, la: (x0 + (lo + 20) * k, y0 + (38 - la) * k)
    pts = ' '.join(f'{P(a, b)[0]:.0f},{P(a, b)[1]:.0f}' for a, b in AFR)
    mad = ' '.join(f'{P(a, b)[0]:.0f},{P(a, b)[1]:.0f}' for a, b in [(44, -25), (47, -25), (50, -15), (49, -12), (44, -17)])
    c = f'<rect x="{x0 - 40}" y="{y0 - 40}" width="{75 * k + 80}" height="{76 * k + 80}" rx="30" fill="#BFE6F7"/>'
    c += f'<polygon points="{pts}" fill="{LGREEN}" stroke="{GREEN}" stroke-width="5"/><polygon points="{mad}" fill="{LGREEN}" stroke="{GREEN}" stroke-width="5"/>'
    ey = P(0, 0)[1]
    c += f'<line x1="{x0 - 40}" y1="{ey}" x2="{x0 + 75 * k + 40}" y2="{ey}" stroke="{RED}" stroke-width="8" stroke-dasharray="22 14"/>'
    c += text(x0 + 75 * k + 20, ey - 18, "l'équateur", 40, RED, FN, 'end')
    for i, (nm, lo, la, dx) in enumerate([('Abidjan', -4, 5.3, -1), ('Kinshasa', 15.3, -4.3, 1)][:n_city]):
        px, py = P(lo, la)
        c += f'<circle cx="{px:.0f}" cy="{py:.0f}" r="16" fill="{PUR}" stroke="white" stroke-width="5"/>'
        c += text(px + (30 if dx > 0 else -30), py + 60 if dx > 0 else py - 26, nm, 40, PUR, FN, 'start' if dx > 0 else 'end')
    return c


def globe(t=0.0, eq=True):
    c = earth(W / 2, 580, 330, 0, False, eq)
    if eq:
        c += text(W / 2 + 420, 595, "l'équateur", 54, RED, FN, 'start')
    return bg(c, 'PARTOUT PAREIL ?', PUR)


say(globe(eq=False), "Mais attention : il n'y a pas quatre saisons partout sur la Terre !", 'boing')
say(globe(), "Au milieu de la Terre, il y a une ligne imaginaire qui fait le tour : on l'appelle l'équateur.", 'pop')
say(bg(africa(200, 180, 10.5, 0) + sun(1450, 380, 130) + text(1450, 720, 'Souvent chaud', 66, RED) + text(1450, 800, "toute l'année !", 66, RED), 'PRÈS DE L\'ÉQUATEUR', YEL),
    "Près de l'équateur, dans beaucoup d'endroits, il fait chaud toute l'année, et il ne neige pas.", 'pop')
say(bg(africa(200, 180, 10.5, 1) + palm(1450, 900, 1.3) + sun(1650, 260, 80), 'PRÈS DE L\'ÉQUATEUR', YEL),
    "Par exemple, à Abidjan, en Côte d'Ivoire, ou à Kinshasa, en RD Congo.", 'pop')


def two_seasons(n=2):
    c = card(260, 220, 640, 640, sun(580, 470, 110) + text(580, 720, 'La saison sèche', 52, '#C77700') + text(580, 790, 'il pleut peu', 40, PUR, FN), stroke=YEL)
    if n > 1:
        c += card(1020, 220, 640, 640, rain(1340, 430, 1.4) + text(1340, 720, 'La saison des pluies', 50, '#1F7FA8') + text(1340, 790, 'il pleut beaucoup', 40, PUR, FN), stroke=TEAL)
    return bg(c, 'À ABIDJAN', YEL)


say(two_seasons(1), "Là-bas, on parle plutôt de deux saisons. La saison sèche, quand il pleut peu...", 'pop')
say(two_seasons(2), "Et la saison des pluies, quand il pleut beaucoup.", 'pop')


# ================= 6. Noël sans neige =================
def noel_q():
    c = amara(560, 640, 1.1, 'think', 'o')
    c += (f'<path d="M820 430 L760 520 L900 470 Z" fill="white"/><rect x="820" y="230" width="900" height="300" rx="60" fill="white"/>'
          + text(1270, 340, 'Mais alors... comment', 56, PUR) + text(1270, 420, 'on fête Noël sans neige ?', 56, PUR))
    return bg(c + sapin(1500, 960, .5) + palm(1230, 960, .6, True), 'NOËL', RED)


def noel_split(n=2):
    c = card(200, 190, 720, 760, f'<rect x="206" y="700" width="708" height="244" rx="20" fill="white"/>'
             + sapin(450, 840, .62, True) + snowman(740, 860, .5) + ''.join(snowflake(260 + i * 75, 260 + (i % 3) * 60, .35, 0, SKY) for i in range(9))
             + text(560, 915, 'Au Canada, en France...', 40, PUR, FN), stroke=SKY)
    if n > 1:
        c += card(1000, 190, 720, 760, f'<rect x="1006" y="700" width="708" height="244" rx="20" fill="#F5E2B8"/>'
                  + palm(1230, 850, .95, True) + sun(1580, 320, 70) + gift(1520, 830, .9) + gift(1630, 840, .6, TEAL, RED)
                  + text(1360, 915, 'À Abidjan', 40, PUR, FN), stroke=YEL)
    return bg(c, 'NOËL', RED)


def australia():
    c = f'<rect x="0" y="700" width="{W}" height="380" fill="#F5E2B8"/><rect x="0" y="560" width="{W}" height="150" fill="#5BC0EB"/>'
    c += sun(1650, 250, 100) + beach_umbrella(1150, 820, 1.2) + sapin(700, 900, .55) + gift(880, 880, .7) + gift(520, 890, .6, TEAL, RED)
    c += text(500, 330, 'En Australie,', 66, PUR) + text(500, 420, 'Noël en plein été !', 66, RED)
    return bg(c, 'NOËL', RED)


def noel_fete(t=0.0):
    c = confetti(4, 70, t)
    c += sapin(W / 2, 940, .8) + amara(560, 680, .95, 'up') + kofi(1360, 690, .95, 'up')
    c += gift(820, 960, .7) + gift(1100, 960, .6, TEAL, RED)
    c += text(W / 2, 220, 'Avec ou sans neige,', 64, PUR) + text(W / 2, 310, "c'est la fête !", 72, RED)
    return bg(c, 'NOËL', RED)


say(noel_q(), "Hmm, mais attends : s'il ne neige jamais à Abidjan, comment on fête Noël ?", 'boing')
say(noel_q(), "Très bonne question !")
say(noel_split(1), "Noël, c'est une fête. Pour beaucoup de familles, c'est le vingt-cinq décembre.")
say(noel_split(1), "Au Canada ou en France, Noël arrive en hiver. Alors, il y a parfois de la neige.")
say(noel_split(2), "À Abidjan, il fait chaud à Noël. On fait la fête sous le soleil, avec des décorations qui brillent !", 'pop')
say(australia(), "Et en Australie, de l'autre côté de la Terre, les saisons sont à l'envers : Noël arrive en plein été ! Certaines familles fêtent Noël à la plage.", 'whoosh')
anim(noel_fete, 5, text="Avec ou sans neige, Noël, c'est toujours la fête : on se retrouve en famille, on chante, et on partage un bon repas.", sfx_='tada')


# ================= 7. Quiz =================
QUIZ = [
    ("C'est quelle saison ?", lambda: ''.join(leaf(760 + (i * 97) % 400, 300 + (i * 61) % 420, 1.4, i * 47, [ORANGE, YEL, '#E8572A'][i % 3]) for i in range(9)),
     "Les feuilles deviennent orange et tombent des arbres. C'est quelle saison ?", 'automne', "L'automne !"),
    ("C'est quelle saison ?", lambda: bonnet(800, 520, 1.2) + mitten(1120, 560, 1.2, 15) + snowflake(1000, 300, 1.2, 0, SKY),
     "On met un bonnet et des moufles, et il neige. C'est quelle saison ?", 'hiver', "L'hiver !"),
    ("C'est quelle saison ?", lambda: flower(780, 520, 1.6) + flower(980, 560, 1.4, YEL, RED) + flower(1180, 520, 1.6, 'white') + bird(980, 280, 1.6),
     "La neige fond, les fleurs sortent et les oiseaux chantent. C'est quelle saison ?", 'printemps', "Le printemps !"),
    ("Qu'est-ce qu'on met en été ?", lambda: card(560, 300, 380, 420, bonnet(750, 540, .9)) + card(1000, 300, 380, 420, sunglasses(1190, 510, 1.2))
     + text(750, 790, 'A', 60, PUR) + text(1190, 790, 'B', 60, PUR),
     "Qu'est-ce qu'on met en été ? Un bonnet, ou des lunettes de soleil ?", 'ete', "Des lunettes de soleil !"),
    ("À Abidjan, à Noël...", lambda: palm(860, 820, .9, True) + sun(1150, 380, 90) + text(1150, 640, 'chaud ?', 60, RED) + text(1150, 740, 'froid ?', 60, '#1F7FA8'),
     "À Abidjan, à Noël, il fait chaud ou il fait froid ?", 'ete', "Il fait chaud !"),
]


def qscreen(i, n=None, reveal=False):
    q, art, _, key, ans = QUIZ[i]
    c = text(W / 2, 200, q, 64, PUR)
    c += art()
    if n is not None:
        c += countdown_circle(1620, 560, n, 5)
    if reveal:
        c += f'<rect x="460" y="850" width="1000" height="130" rx="65" fill="{SEASON[key][1]}"/>' + text(W / 2, 940, ans, 66, 'white')
        c += check(1560, 560, 1.6)
    return bg(c, f'QUIZ · {i + 1}/5', RED)


say(bg(text(W / 2, 470, "C'est l'heure", 110, PUR) + text(W / 2, 620, 'du quiz !', 130, RED) + amara(1580, 760, .7, 'up') + kofi(340, 760, .7, 'up'), 'QUIZ', RED),
    "C'est l'heure du quiz ! Je pose la question, et tu réponds à voix haute avant la fin du compte à rebours.", 'tada')
for i, (_, _, line, key, ans) in enumerate(QUIZ):
    say(qscreen(i), line, 'pop')
    countdown(lambda k, i=i: qscreen(i, k), 5)
    say(qscreen(i, reveal=True), ans + (" Bravo !" if i % 2 == 0 else " Bien joué !"), 'ding')


# ================= 8. Défi des 10 secondes =================
def defi(n=None, hands=False, warm=False):
    c = amara(620, 640, 1.15, 'hug', 'smile' if not warm else 'o')
    if hands:
        c += ''.join(f'<path d="M{560 + i * 40} {560 - (i % 2) * 20} q20 -20 0 -40" stroke="{RED}" stroke-width="6" fill="none" opacity=".6"/>' for i in range(4))
    if n is not None:
        c += countdown_circle(1350, 560, n, 10, 160)
    else:
        c += text(1350, 470, 'Frotte tes mains', 66, PUR) + text(1350, 560, 'très vite !', 66, RED)
    if warm:
        c = amara(620, 640, 1.15, 'hug', 'smile') + text(1350, 470, 'Tes mains', 66, PUR) + text(1350, 560, 'sont chaudes !', 66, RED) + sun(1350, 780, 70)
    return bg(c, 'DÉFI DES 10 SECONDES', TEAL)


say(defi(), "Défi des dix secondes ! En hiver, quand on a froid, on frotte ses mains pour les réchauffer.", 'tada')
say(defi(), "Frotte tes mains très, très vite. Prêt ? Prête ? C'est parti !")
countdown(lambda k: defi(k, True), 10)
say(defi(warm=True), "Stop ! Pose tes mains sur tes joues. C'est chaud ? Bravo, tu as fabriqué de la chaleur !", 'ding')


# ================= 9. Atelier : la roue des saisons =================
def step(n, art, line1, line2='', pause=False, adult=False):
    c = pill(W / 2, 170, f'ÉTAPE {n}', RED, 'white', 40) + art
    c += text(1340, 470, line1, 54, PUR) + (text(1340, 550, line2, 54, PUR) if line2 else '')
    if pause:
        c += pause_badge(1340, 760)
    if adult:
        c += adult_badge(1340, 720 if not pause else 900)
    return bg(c, 'LA ROUE DES SAISONS', TEAL)


say(bg(plate(700, 580, 300, True, 4, True, 40, True) + text(1400, 470, 'On fabrique', 76, PUR) + text(1400, 570, 'la roue', 76, RED) + text(1400, 670, 'des saisons !', 76, RED),
       'ATELIER', TEAL), "À toi de jouer ! On fabrique la roue des saisons.", 'tada')
say(bg(''.join(card(180 + i * 330, 300, 270, 380, g(ic, 315 + i * 330, 450, .8) + text(315 + i * 330, 620, lab.replace('\n', ' ') if len(lab) < 14 else lab.split('\n')[0], 30, PUR, FN))
               for i, (ic, lab) in enumerate(mats)) + text(W / 2, 830, 'Va chercher ton matériel !', 60, RED), 'MATÉRIEL', TEAL)
    + '', "Va chercher ton matériel : une assiette en carton, des feutres, un morceau de carton, une attache parisienne et des ciseaux.")
say(step(1, plate(560, 600, 300, True) + marker(780, 520, .9, 30), "Trace une croix", "sur ton assiette."),
    "Étape un : avec un feutre, trace une croix sur ton assiette. Elle est coupée en quatre parts.", 'pop')
anim(lambda t: step(2, plate(560, 600, 300, True, 1 + min(3, int(t * 4))), "Dessine une saison", "dans chaque part."), 4,
     text="Étape deux : dans chaque part, dessine une saison. Des fleurs pour le printemps, un grand soleil pour l'été,", sfx_='pop')
say(step(2, plate(560, 600, 300, True, 4), "Dessine une saison", "dans chaque part.", pause=True),
    "des feuilles orange pour l'automne, et un bonhomme de neige pour l'hiver. Mets sur pause, et prends ton temps !")
hold(step(2, plate(560, 600, 300, True, 4), "Dessine une saison", "dans chaque part.", pause=True), 3, 'ding')
say(step(3, f'<rect x="300" y="380" width="460" height="440" rx="10" fill="#D9B27A"/>' + cardboard_arrow(530, 600, 1.4) + scissors(820, 760, .8, -30),
         "Découpe une flèche", "dans le carton.", adult=True),
    "Étape trois : découpe une flèche dans le carton. Un adulte t'aide avec les ciseaux.", 'pop')
say(step(4, plate(560, 600, 300, True, 4, True) + cardboard_arrow(900, 640, .8, 20), "Un petit trou au milieu", "et au bout de la flèche.", adult=True),
    "Étape quatre : un adulte fait un petit trou au milieu de l'assiette, et un autre au bout de la flèche.", 'pop')
say(step(5, plate(560, 600, 300, True, 4, False, 30, True) + brad(900, 520, 1.2, True), "Glisse l'attache", "et ouvre ses pattes."),
    "Étape cinq : pose la flèche sur l'assiette. Glisse l'attache parisienne dans les deux trous, et ouvre ses pattes derrière.", 'pop')
anim(lambda t: step(6, plate(560, 600, 300, True, 4, False, t * 360, True), "Fais tourner", "ta flèche !"), 3,
     text="Étape six : fais tourner ta flèche. Ta roue des saisons est prête ! Bravo !", sfx_='tada')


# ================= 10. On joue =================
ANG = {'printemps': 45, 'ete': 135, 'automne': 225, 'hiver': 315}


def play(q, key=None, n=None, arrow=0):
    c = season_wheel(700, 590, 330, key, True, arrow)
    c += text(1420, 420, q[0], 54, PUR) + text(1420, 500, q[1], 54, PUR)
    if n is not None:
        c += countdown_circle(1420, 730, n, 5, 100)
    if key:
        c += check(1420, 730, 1.3)
    return bg(c, 'ON JOUE !', TEAL)


say(play(('Montre-moi', 'la bonne saison !'), arrow=0), "Maintenant, on joue avec ta roue ! Je dis quelque chose, et tu tournes la flèche sur la bonne saison.", 'tada')
for q, line, key in [(('La saison des', 'bonshommes de neige'), "Montre-moi la saison des bonshommes de neige.", 'hiver'),
                     (('La saison où', 'les feuilles tombent'), "Montre-moi la saison où les feuilles tombent.", 'automne'),
                     (('La saison des glaces', 'et de la plage'), "Montre-moi la saison des glaces et de la plage.", 'ete')]:
    say(play(q), line, 'pop')
    countdown(lambda k, q=q: play(q, n=k), 5)
    anim(lambda t, q=q, key=key: play(q, key if t > .99 else None, arrow=ANG[key] * min(1, t * 1.3)), 1.5, sfx_='whoosh')
    say(play(q, key, arrow=ANG[key]), {'hiver': "L'hiver", 'automne': "L'automne", 'ete': "L'été"}[key] + ' ! Bravo !', 'ding')

say(bg(season_wheel(700, 590, 330, None, True, 315) + text(1420, 330, 'Ton défi', 64, RED) + text(1420, 450, 'Chaque matin, regarde', 46, PUR, FN)
       + text(1420, 515, 'par la fenêtre et tourne', 46, PUR, FN) + text(1420, 580, 'la flèche sur la saison', 46, PUR, FN) + text(1420, 645, 'du jour !', 46, PUR, FN)
       + window(1260, 720, 320, 220, tree('automne', 160 + 1260, 940, .38)), 'TON DÉFI', RED),
    "Ton défi : chaque matin, regarde par la fenêtre et tourne la flèche sur la saison du jour.", 'pop')
say(bg(card(560, 220, 800, 640, sun(800, 470, 90) + rain(1120, 440, 1.1) + text(960, 700, 'Au dos de ta roue :', 46, PUR, FN)
                + text(960, 780, 'saison sèche et saison des pluies', 44, RED, FN)), 'BONUS', YEL),
    "Et en bonus, au dos de ton assiette, tu peux dessiner la saison sèche et la saison des pluies !", 'pop')


# ================= 11. Récap =================
def recap(n):
    rows = [(season_wheel(0, 0, 60, labels=False), 'Il y a 4 saisons dans une année'),
            (earth(0, 0, 55, -23.5, True), 'La Terre penchée tourne autour du Soleil'),
            (sun(0, 0, 40, False), "Près de l'équateur, il fait souvent chaud toute l'année"),
            (sapin(0, 60, .2), 'Noël, avec ou sans neige, c\'est la fête !')]
    c = ''
    for i, (ic, cap) in enumerate(rows[:n]):
        y = 260 + i * 185
        c += f'<rect x="260" y="{y - 75}" width="1400" height="150" rx="75" fill="white"/>' + g(ic, 370, y) + text(480, y + 16, cap, 44, PUR, FN, 'start')
    return bg(c, "AUJOURD'HUI, J'AI APPRIS", PUR)


say(recap(0), "Bravo ! Aujourd'hui, tu as appris plein de choses.", 'tada')
say(recap(1), "Dans une année, il y a quatre saisons : le printemps, l'été, l'automne et l'hiver.", 'pop')
say(recap(2), "La Terre est penchée, et elle tourne autour du Soleil : c'est pour ça qu'il y a des saisons.", 'pop')
say(recap(3), "Près de l'équateur, il fait souvent chaud toute l'année.", 'pop')
say(recap(4), "Et Noël, avec ou sans neige, c'est toujours la fête !", 'pop')


def bye(t=0.0):
    c = confetti(9, 80, t) + amara(700, 650, 1.05, 'wave') + kofi(1220, 660, 1.05, 'wave')
    c += text(W / 2, 220, 'À bientôt', 90, PUR) + text(W / 2, 320, 'chez les Mounas !', 90, RED)
    return bg(c)


say(intro(.5, 'smile', 'wave', 'On regardera\nla météo ensemble !'), "Et la neige ? On regardera la météo ensemble pour savoir quand elle arrive !")
anim(bye, 4, text="Au revoir ! À bientôt chez les Mounas !", sfx_='tada')
anim(bye, 3)

if __name__ == '__main__':
    print(f'durée : {T.t / 60:.1f} min, {len(T.frames)} images, {len(T.lines)} répliques')
    if '--build' in sys.argv:
        print(T.build())
