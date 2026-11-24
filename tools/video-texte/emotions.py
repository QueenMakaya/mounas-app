"""Vidéo « texte à l'écran » 9:16 : accueillir les émotions de son enfant.

Chaque mot entre quand la voix le dit (voix clonée de Pam via HeyGen, horodatage mot à mot).
  python3 emotions.py voice   # génère (ou relit en cache) la voix de chaque scène
  python3 emotions.py still   # une image par scène dans out/stills/
  python3 emotions.py video   # rend out/emotions.mp4
Polices : FONT_DIR (Fraunces-Black.ttf, Nunito-ExtraBold.ttf). Musique : MUSIC_FILE (wav, facultatif).
"""
import hashlib, json, os, subprocess, sys, urllib.request
import numpy as np
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'out'); CACHE = os.path.join(OUT, 'voice')
FONT_DIR = os.environ.get('FONT_DIR', os.path.expanduser('~/.fonts'))
VOICE_ID = 'c06838141b3d4fcb829df27b7ffa4a88'   # « Pam Maman Les Mounas »
W, H, FPS, SR = 1080, 1920, 30, 48000
YEL, RED, PUR, TEAL, CREAM = '#FEBD57', '#F30041', '#4D0065', '#00CFBF', '#FDF6EC'
GOLD, TEALT = '#D98A00', '#00A99C'
THEMES = {  # fond, texte, couleurs d'accent, pastilles de décor
    'cream': (CREAM, PUR, [RED, TEALT, GOLD], ['#F7D9E0', '#CFF3EF', '#FDE1B0']),
    'purple': (PUR, CREAM, [YEL, TEAL, '#FF7A9C'], ['#5E1477', '#641A7D', '#5A0F72']),
}
# Zone sûre (interfaces Instagram / TikTok / Shorts) : rien d'important hors de ce cadre.
SAFE_TOP, SAFE_BOTTOM, MAXW = 300, 1440, 880

# Une scène : lignes à l'écran (*mot* = accent), thème, n = numéro du geste (dit à voix haute, affiché en pastille).
SCENES = [
    dict(t='purple', gap=0.7, lines=['“Arrête de pleurer,', 'ou je vais te donner', 'une *vraie* *raison*', 'de pleurer.”']),
    dict(t='cream', lines=["Tu l'as entendue,", 'cette phrase ?', '*Moi* *aussi.*']),
    dict(t='cream', lines=['Nos parents', 'nous ont aimés *fort*.', 'Ils nous ont donné', 'le *respect*,', 'la *force*,', 'le *courage*.']),
    dict(t='purple', gap=0.6, lines=['Mais les *émotions*…', "on n'en parlait pas."]),
    dict(t='cream', lines=['Alors quand', 'notre enfant pleure', 'ou crie,', 'on ne sait pas', 'quoi faire.', "C'est normal :", '*personne* ne nous', 'a montré.']),
    dict(t='purple', lines=['Voici *quatre* *gestes*', 'pour commencer,', 'dès tout petit.']),
    dict(t='cream', n=1, say='Un.', lines=['Je respire', "*d'abord*.", 'Mon calme,', "c'est son", '*premier* *outil*.']),
    dict(t='cream', n=2, say='Deux.', lines=['Je nomme', 'ce que je vois.', '“Tu es *en* *colère*.', 'Tu voulais', 'encore jouer.”']),
    dict(t='cream', n=3, say='Trois.', lines=["J'accueille l'émotion,", 'et je garde *la* *limite*.', '“Tu as le droit', "d'être en colère.", "Tu n'as *pas* le droit", 'de taper.”']),
    dict(t='cream', n=4, say='Quatre.', lines=['Je lui donne', '*un* *outil*.', 'On sent la fleur…', 'on souffle la bougie.', 'Trois fois.']),
    dict(t='purple', lines=['En zoulou,', 'on se salue en disant', '*Sawubona*.', 'Mot à mot :', '“*nous* *te* *voyons*”.'],
         tts='En zoulou, on se salue en disant Sawoubona. Mot à mot : nous te voyons.'),
    dict(t='cream', gap=0.6, lines=["C'est ce que", 'ton enfant demande :', 'être *vu*.']),
    dict(t='cream', lines=['Accueillir ses émotions,', "ce n'est pas", 'tout lui permettre.', 'Le *respect* reste.', 'On ajoute *les* *mots*.']),
    dict(t='purple', gap=0.7, lines=['On garde ce que', 'nos parents', 'nous ont donné.', 'Et on ajoute', 'ce qui nous a *manqué*.']),
    dict(t='cream', end=True, gap=2.2, lines=['Enregistre cette vidéo.', 'Et dis-moi', 'en commentaire :', "c'était quoi,", '*la* *phrase*, chez toi ?']),
]


def font(name, size, _c={}):
    k = (name, size)
    if k not in _c: _c[k] = ImageFont.truetype(os.path.join(FONT_DIR, name), size)
    return _c[k]

def tokens(sc):
    """[(ligne, mot affiché, accent?)] ; la ponctuation isolée ( ? : ) reste collée au mot d'avant."""
    out = []
    for li, line in enumerate(sc['lines']):
        for w in line.split():
            hi = '*' in w; w = w.replace('*', '')
            if out and out[-1][0] == li and not any(c.isalnum() for c in w):
                out[-1] = (li, out[-1][1] + ' ' + w, out[-1][2])
            else: out.append((li, w, hi))
    return out

def spoken(sc):
    txt = sc.get('tts') or ' '.join(l.replace('*', '') for l in sc['lines']).replace('“', '').replace('”', '')
    return (sc['say'] + ' ' if sc.get('say') else '') + txt

def tts(sc):
    """Voix de la scène : (échantillons mono 48 kHz, [début de chaque mot])."""
    os.makedirs(CACHE, exist_ok=True)
    text = spoken(sc); key = hashlib.sha1((VOICE_ID + text).encode()).hexdigest()[:12]
    jp, mp = os.path.join(CACHE, key + '.json'), os.path.join(CACHE, key + '.mp3')
    if not os.path.exists(jp):
        req = urllib.request.Request('https://api.heygen.com/v1/audio/text_to_speech', method='POST',
            data=json.dumps({'text': text, 'voice_id': VOICE_ID}).encode(),
            headers={'x-api-key': os.environ.get('HEYGEN_API_KEY', 'dummy'), 'content-type': 'application/json'})
        d = json.load(urllib.request.urlopen(req, timeout=120))['data']
        urllib.request.urlretrieve(d['audio_url'], mp)
        json.dump(d, open(jp, 'w'))
    d = json.load(open(jp))
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', mp, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'],
                         capture_output=True, check=True).stdout
    starts = [w['start'] for w in d['word_timestamps'] if any(c.isalnum() for c in w['word'].strip('<>')) and w['word'] not in ('<start>', '<end>')]
    return np.frombuffer(raw, np.float32), starts

def layout(sc):
    """Taille de police la plus grande qui tient dans la zone sûre, puis position de chaque mot."""
    toks = tokens(sc); nl = len(sc['lines'])
    top = SAFE_TOP + (230 if sc.get('n') else 0); bottom = SAFE_BOTTOM - (150 if sc.get('end') else 0)
    for size in range(124, 50, -2):
        f = font('Fraunces-Black.ttf', size); sp = f.getlength(' '); lh = size * 1.22
        widths = [sum(f.getlength(w) for l, w, _ in toks if l == li) + sp * (sum(1 for l, _, _ in toks if l == li) - 1) for li in range(nl)]
        if max(widths) <= MAXW and lh * nl <= bottom - top: break
    y0 = top + (bottom - top - lh * nl) / 2
    pos = []; x = 0; cur = -1
    for li, w, hi in toks:
        if li != cur: cur = li; x = (W - widths[li]) / 2
        pos.append((x, y0 + li * lh, w, hi)); x += f.getlength(w) + sp
    return size, pos, y0

def rgba(hexc, a=255):
    return tuple(int(hexc[i:i + 2], 16) for i in (1, 3, 5)) + (int(a),)

_logo = None
def background(sc):
    bg, fg, _, dots = THEMES[sc['t']]
    im = Image.new('RGB', (W, H), bg); d = ImageDraw.Draw(im)
    for (x, y, r), c in zip([(70, 110, 150), (1010, 190, 100), (130, 1790, 130), (990, 1760, 170), (1040, 1000, 46), (40, 760, 34)], dots * 2):
        d.ellipse([x - r, y - r, x + r, y + r], fill=c)
    global _logo
    if _logo is None:
        lg = Image.open(os.path.join(HERE, '../../public/logo-mounas-wordmark.png')).convert('RGBA')
        lg = lg.crop(lg.getbbox()); _logo = lg.resize((250, round(250 * lg.height / lg.width)), Image.LANCZOS)
    if sc['t'] == 'cream': im.paste(_logo, ((W - 250) // 2, 170), _logo)
    else:
        d.text((W / 2, 200), 'LES MOUNAS', font=font('Nunito-ExtraBold.ttf', 36), fill=YEL, anchor='mm')
    return im

def ease(u):
    u = min(max(u, 0.0), 1.0); return 1 - (1 - u) ** 3

def frame(sc, lay, base, starts, t, dur):
    size, pos, y0 = lay; _, fg, acc, _ = THEMES[sc['t']]
    im = base.copy(); ov = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(ov)
    f = font('Fraunces-Black.ttf', size)
    if sc.get('n'):
        a = ease(t / 0.3); r = 92 * (0.7 + 0.3 * a); cy = y0 - 150
        col = acc[(sc['n'] - 1) % 3]
        d.ellipse([W / 2 - r, cy - r, W / 2 + r, cy + r], fill=rgba(col, 255 * a))
        d.text((W / 2, cy - 6), str(sc['n']), font=font('Fraunces-Black.ttf', 110), fill=rgba(CREAM, 255 * a), anchor='mm')
    k = 0
    for i, (x, y, w, hi) in enumerate(pos):
        a = ease((t - starts[i] + 0.06) / 0.22)
        if a <= 0: continue
        col = fg
        if hi: col = acc[(sc.get('n', 1) - 1 + k) % 3] if sc.get('n') else acc[0]
        d.text((x, y + 26 * (1 - a)), w, font=f, fill=rgba(col, 255 * a))
    if sc.get('end'):
        a = ease((t - starts[-1] - 0.9) / 0.5)
        if a > 0:
            y = SAFE_BOTTOM - 110
            d.rounded_rectangle([W / 2 - 330, y - 48, W / 2 + 330, y + 48], radius=48, fill=rgba(PUR, 255 * a))
            d.text((W / 2, y - 2), 'lesmounas.school/connect', font=font('Nunito-ExtraBold.ttf', 42), fill=rgba(CREAM, 255 * a), anchor='mm')
    im.paste(ov, (0, 0), ov)
    fade = min(t / 0.18, (dur - t) / 0.18, 1.0)   # fondu court entre les scènes
    if fade < 1 and not (sc.get('end') and t > 1):
        im = Image.blend(Image.new('RGB', (W, H), THEMES[sc['t']][0]), im, max(fade, 0))
    return im

def prepare():
    plan = []
    for sc in SCENES:
        audio, starts = tts(sc)
        if sc.get('say'): starts = starts[1:]
        n = len(tokens(sc))
        if len(starts) != n:   # découpage différent de la voix : on répartit sur la durée
            print('  répartition régulière :', spoken(sc)[:40], len(starts), n)
            starts = list(np.linspace(0.15 + (0.6 if sc.get('say') else 0), len(audio) / SR * 0.9, n))
        dur = round((len(audio) / SR + sc.get('gap', 0.45)) * FPS) / FPS
        plan.append((sc, layout(sc), audio, starts, dur))
    return plan

def music(total):
    mf = os.environ.get('MUSIC_FILE')
    if not mf: return np.zeros(int(total * SR), np.float32)
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', mf, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    m = np.frombuffer(raw, np.float32); n = int(total * SR)
    return np.tile(m, n // len(m) + 1)[:n]

def main(mode):
    os.makedirs(OUT, exist_ok=True); plan = prepare()
    total = sum(p[4] for p in plan); print(f'{len(plan)} scènes, {total:.1f} s')
    if mode == 'voice': return
    if mode == 'still':
        os.makedirs(os.path.join(OUT, 'stills'), exist_ok=True)
        for i, (sc, lay, audio, starts, dur) in enumerate(plan):
            frame(sc, lay, background(sc), starts, dur - 0.3, dur).save(os.path.join(OUT, 'stills', f'{i + 1:02d}.png'))
        return
    # son : voix + musique qui baisse sous la voix
    voice = np.zeros(int(total * SR), np.float32); t = 0.0; cues = []
    for sc, lay, audio, starts, dur in plan:
        o = int((t + 0.12) * SR); voice[o:o + len(audio)] += audio[:len(voice) - o]
        cues.append((t, dur, sc, starts)); t += dur
    voice *= 0.9 / max(np.abs(voice).max(), 1e-6)
    mus = music(total); w = int(SR * 0.4); env = np.convolve(np.abs(voice), np.ones(w) / w, 'same')
    duck = 1 - 0.6 * np.clip(env / 0.04, 0, 1)
    edge = np.clip(np.minimum(np.arange(len(mus)) / SR / 1.0, (len(mus) - np.arange(len(mus))) / SR / 1.8), 0, 1)
    mix = np.clip(voice + mus * duck * edge * float(os.environ.get('MUSIC_GAIN', '0.16')), -1, 1)
    wav = os.path.join(OUT, 'mix.f32'); mix.astype(np.float32).tofile(wav)
    out = os.path.join(OUT, 'emotions.mp4')
    ff = subprocess.Popen(['ffmpeg', '-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                           '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', wav, '-c:v', 'libx264', '-preset', 'medium', '-crf', '18',
                           '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-movflags', '+faststart', '-shortest', out], stdin=subprocess.PIPE)
    for t0, dur, sc, starts in cues:
        base = background(sc); lay = layout(sc); st = [s + 0.12 for s in starts]
        for k in range(round(dur * FPS)):
            ff.stdin.write(frame(sc, lay, base, st, k / FPS, dur).tobytes())
    ff.stdin.close(); ff.wait(); os.remove(wav)
    # sous-titres
    def tc(x): return f'{int(x // 3600):02d}:{int(x % 3600 // 60):02d}:{int(x % 60):02d},{int(x % 1 * 1000):03d}'
    with open(os.path.join(OUT, 'emotions.srt'), 'w') as f:
        for i, (t0, dur, sc, _) in enumerate(cues):
            f.write(f"{i + 1}\n{tc(t0)} --> {tc(t0 + dur - 0.05)}\n{' '.join(l.replace('*', '') for l in sc['lines'])}\n\n")
    print('→', out)

if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else 'video')
