"""Rend un post vertical 1080x1920 : voix de Pam + sous-titres animés + Amara qui parle + onde sonore.
Usage: python3 render.py <slug|all> [--draft]    (UPLOADS=dossier des .m4a)"""
import sys, os, re, json, math, random, subprocess, re as _re
import numpy as np, cairosvg, io
from PIL import Image, ImageDraw, ImageFont
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', 'video-educative'))
import draw as D
from posts import POSTS, SRC

W, H, FPS = 1080, 1920, 30
UP = os.environ.get('UPLOADS', '/root/.claude/uploads/b46cd828-ae0c-5786-a622-e55ea4a9078d')
FD = os.path.expanduser('~/.fonts')
OUT = os.path.join(HERE, 'out'); WORK = os.path.join(HERE, 'work')
os.makedirs(OUT, exist_ok=True); os.makedirs(WORK, exist_ok=True)
CREAM, PUR, RED, YEL, TEAL = (253, 246, 236), (77, 0, 101), (243, 0, 65), (254, 189, 87), (0, 207, 191)
ACC = {'teal': (0, 150, 138), 'red': (243, 0, 65), 'gold': (200, 120, 0)}
ACC_BG = {'teal': TEAL, 'red': RED, 'gold': YEL}
TAIL = 3.0
_f = {}
def font(name, size):
    k = (name, size)
    if k not in _f: _f[k] = ImageFont.truetype(os.path.join(FD, name), size)
    return _f[k]
BODY, HI = 'Nunito-ExtraBold.ttf', 'Fraunces-Black.ttf'
NB = ' '

def ease_back(x):
    x = min(1, max(0, x)); c = 1.7
    return 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2

def lerp(a, b, t): return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))

# ---------- Amara ----------
def sprites():
    svg = D.amara(0, 0, 1.0, 'down', 'up', 'smile')
    svg = re.sub(r'\[\[(BOB|WAVE)[^\]]*\]\]', '', svg)
    ms = {'closed': D.__dict__.get('x') or '<path d="M-22 26 Q0 48 22 26 Q0 34 -22 26Z" fill="#fff"/>',
          'o': '<ellipse cx="0" cy="34" rx="11" ry="13" fill="#3A1410"/>',
          'mid': '<ellipse cx="0" cy="34" rx="17" ry="11" fill="#3A1410"/><ellipse cx="0" cy="39" rx="9" ry="4" fill="#E0566F"/>',
          'wide': '<ellipse cx="0" cy="34" rx="20" ry="17" fill="#3A1410"/><ellipse cx="0" cy="41" rx="11" ry="6" fill="#E0566F"/>'}
    eo = (f'<circle cx="-30" cy="-2" r="15" fill="#fff"/><circle cx="30" cy="-2" r="15" fill="#fff"/>'
          f'<circle cx="-28" cy="0" r="8" fill="{D.HAIR}"/><circle cx="32" cy="0" r="8" fill="{D.HAIR}"/>')
    es = f'<path d="M-44 -1 q14 9 28 0 M16 -1 q14 9 28 0" stroke="{D.HAIR}" stroke-width="5" fill="none" stroke-linecap="round"/>'
    out = {}
    for mk, mv in ms.items():
        for ek, ev in (('o', eo), ('s', es)):
            s = re.sub(r'\[\[EYES[^\]]*\]\]', ev, svg); s = re.sub(r'\[\[MOUTH[^\]]*\]\]', mv, s)
            doc = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="-270 -170 540 610" width="{int(540*SC)}" height="{int(610*SC)}">{s}</svg>'
            out[(mk, ek)] = Image.open(io.BytesIO(cairosvg.svg2png(bytestring=doc.encode()))).convert('RGBA')
    return out
SC = 0.68

# ---------- audio ----------
def prep_audio(p):
    key, fn = SRC[p['src']]
    words = [w for seg in json.load(open(os.path.join(HERE, 'src', key + '.words.json'))) for w in seg]
    segs = json.load(open(os.path.join(HERE, 'src', key + '.words.json')))
    chunks = []
    for a, b, txt in p['chunks']:
        sel = [s for s in segs if s and a < (s[0][0] + s[-1][1]) / 2 < b]
        if not sel: raise SystemExit(f'{p["slug"]}: aucun segment dans {a}-{b}')
        chunks.append((sel[0][0][0], sel[-1][-1][1], txt))
    t0 = max(0, chunks[0][0] - 0.25); t1 = chunks[-1][1] + 0.45
    wav = os.path.join(WORK, p['slug'] + '.wav')
    af = ('highpass=f=90,afftdn=nr=12:nf=-45,acompressor=threshold=-21dB:ratio=3:attack=6:release=90:makeup=3,'
          'loudnorm=I=-16:TP=-1.5:LRA=9')
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-ss', f'{t0:.2f}', '-t', f'{t1-t0:.2f}', '-i', os.path.join(UP, [f for f in os.listdir(UP) if f.endswith(fn[-14:])][0]),
                    '-af', af + f',afade=t=in:d=0.05,apad=pad_dur={TAIL}', '-ar', '44100', '-ac', '2', wav], check=True)
    pcm = np.frombuffer(subprocess.check_output(['ffmpeg', '-loglevel', 'error', '-i', wav, '-f', 's16le', '-ar', '16000', '-ac', '1', '-']), np.int16).astype(np.float32) / 32768
    n = int((t1 - t0 + TAIL) * FPS); hop = 16000 // FPS
    env = np.array([np.sqrt(np.mean(pcm[i*hop:(i+1)*hop+hop//2] ** 2)) if i*hop < len(pcm) else 0 for i in range(n)])
    env = env / (np.percentile(env, 95) + 1e-9)
    return wav, [(a - t0, b - t0, t) for a, b, t in chunks], np.clip(env, 0, 1.3), t1 - t0

# ---------- texte ----------
def tokens(txt):
    out = []
    for i, part in enumerate(re.split(r'\*', txt)):
        for w in part.replace(' ?', NB + '?').replace(' !', NB + '!').replace(' :', NB + ':').replace('« ', '«' + NB).replace(' »', NB + '»').split():
            out.append((w, i % 2 == 1))
    return out

def layout(toks, maxw, maxh):
    for size in range(70, 40, -2):
        fb, fh = font(BODY, size), font(HI, size)
        lines, cur, cw = [], [], 0
        sp = fb.getlength(' ')
        for i, (w, hi) in enumerate(toks):
            ww = (fh if hi else fb).getlength(w)
            if cur and cw + sp + ww > maxw: lines.append(cur); cur, cw = [], 0
            cx = cw + (sp if cur else 0); cur.append((i, w, hi, cx, ww)); cw = cx + ww
        if cur: lines.append(cur)
        lh = int(size * 1.32)
        if len(lines) * lh <= maxh: return size, lh, lines
    return size, lh, lines

# ---------- rendu ----------
def static_layer(p):
    im = Image.new('RGB', (W, H), CREAM); d = ImageDraw.Draw(im)
    ac = ACC_BG[p['accent']]
    d.ellipse((W-300, -170, W+120, 250), fill=lerp(CREAM, TEAL, .45)); d.ellipse((-110, 1480, 330, 1920), fill=lerp(CREAM, YEL, .8))
    d.ellipse((60, 330, 120, 390), fill=lerp(CREAM, PUR, .35)); d.ellipse((W-150, 1380, W-90, 1440), fill=lerp(CREAM, RED, .5))
    d.ellipse((W-210, 520, W-30, 700), fill=lerp(CREAM, ac, .22))
    # logo MOUNAS
    f = font(HI, 84); cols = [YEL, TEAL, YEL, RED, PUR, RED]; tw = sum(f.getlength(c) + 2 for c in 'MOUNAS'); x = (W - tw) / 2
    for ch, c in zip('MOUNAS', cols): d.text((x, 70), ch, font=f, fill=c); x += f.getlength(ch) + 2
    # kicker pill
    fk = font(BODY, 32); k = p['kicker']; kw = fk.getlength(k) + 70
    d.rounded_rectangle(((W-kw)/2, 200, (W+kw)/2, 262), 31, fill=ac); d.text((W/2, 232), k, font=fk, fill='white', anchor='mm')
    # titre
    ft = font(HI, 70)
    for i, ln in enumerate(p['title']):
        d.text((W/2, 315 + i * 86), ln, font=ft, fill=PUR, anchor='mm')
    # carte sous-titres
    d.rounded_rectangle((60, 900, W-60, 1560), 44, fill='white', outline=PUR, width=6)
    return im

def render(p, draft=False):
    wav, chunks, env, speech_end = prep_audio(p)
    n = len(env); acc = ACC[p['accent']]
    base = static_layer(p); spr = sprites()
    # mise en page des chunks + temps par mot (proportionnel aux caractères)
    CH = []
    for a, b, txt in chunks:
        toks = tokens(txt); size, lh, lines = layout(toks, W - 2 * 60 - 90, 660 - 70)
        tot = sum(len(w) + 1 for w, _ in toks); acc_c = 0; wt = []
        for w, _ in toks: wt.append(a + (b - a) * acc_c / tot); acc_c += len(w) + 1
        CH.append((a, b, toks, size, lh, lines, wt))
    cmd = ['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-', '-i', wav,
           '-c:v', 'libx264', '-preset', 'veryfast' if draft else 'medium', '-crf', '24' if draft else '19', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-shortest',
           '-movflags', '+faststart', os.path.join(OUT, p['slug'] + ('-draft' if draft else '') + '.mp4')]
    pr = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    rnd = random.Random(p['slug']); phases = [rnd.random() * 6.28 for _ in range(31)]
    smooth = 0.0; blink_at = 2.0
    cols = [YEL, TEAL, RED, PUR]
    for fi in range(n):
        t = fi / FPS; im = base.copy(); d = ImageDraw.Draw(im)
        e = float(env[fi]); smooth = smooth * 0.55 + e * 0.45
        talking = t < speech_end
        # Amara
        if t >= blink_at: 
            if t > blink_at + 0.13: blink_at = t + 2.5 + rnd.random() * 2
        eye = 's' if blink_at <= t <= blink_at + 0.13 else 'o'
        lvl = smooth if talking else 0
        mk = 'closed' if lvl < 0.18 else ('mid' if lvl < 0.45 else ('o' if (fi // 3) % 3 == 0 else 'wide')) if lvl >= 0.18 else 'closed'
        sp = spr[(mk, eye)]; bob = math.sin(t * 3.2) * 7 + (lvl * 6 if talking else 0)
        im.paste(sp, (int(W/2 - sp.width/2), int(600 - 170*SC - bob)), sp)
        # sous-titres
        if t < speech_end + 0.2:
            cur = None
            for c in CH:
                if t >= c[0] - 0.05: cur = c
            if cur:
                a, b, toks, size, lh, lines, wt = cur
                fb, fh = font(BODY, size), font(HI, size)
                y0 = 900 + (660 - len(lines) * lh) / 2
                for li, ln in enumerate(lines):
                    lw = ln[-1][3] + ln[-1][4]; x0 = (W - lw) / 2
                    for i, w, hi, cx, ww in ln:
                        age = t - wt[i]
                        if age < 0: continue
                        k = ease_back(age / 0.22); col0 = acc if hi else PUR
                        col = lerp((255, 255, 255), col0, min(1, age / 0.14))
                        rise = (1 - k) * 18
                        d.text((x0 + cx, y0 + li * lh + rise), w, font=fh if hi else fb, fill=col)
        else:
            # carte finale
            ca = min(1, (t - speech_end - 0.2) / 0.35); 
            d.rounded_rectangle((60, 900, W-60, 1560), 44, fill='white', outline=PUR, width=6)
            ft = font(HI, 84); d.text((W/2, 1060), 'On apprend', font=ft, fill=PUR, anchor='mm'); d.text((W/2, 1160), 'en jouant.', font=ft, fill=acc, anchor='mm')
            d.rounded_rectangle((160, 1270, W-160, 1370), 50, fill=PUR); d.text((W/2, 1320), 'lesmounas.school', font=font(BODY, 54), fill='white', anchor='mm')
            d.text((W/2, 1470), 'Quelques minutes par jour. Chaque jour.', font=font(BODY, 36), fill=PUR, anchor='mm')
            if ca < 1:
                ov = Image.new('RGB', (W - 130, 640), 'white'); 
        # onde sonore
        bw, gap, nb = 16, 12, 31; x0 = (W - (nb * bw + (nb - 1) * gap)) / 2
        for i in range(nb):
            lvlb = smooth if talking else 0.05
            hgt = 16 + 150 * min(1, lvlb) * (0.45 + 0.55 * abs(math.sin(t * 7 + phases[i] + i * .5)))
            xx = x0 + i * (bw + gap); d.rounded_rectangle((xx, 1630 - hgt / 2, xx + bw, 1630 + hgt / 2), 8, fill=cols[i % 4])
        # progression
        d.rounded_rectangle((60, 1770, W-60, 1782), 6, fill=lerp(CREAM, PUR, .15)); d.rounded_rectangle((60, 1770, 60 + (W-120) * min(1, t / (speech_end + TAIL)), 1782), 6, fill=acc)
        d.text((W/2, 1850), 'Les Mounas · On apprend en jouant', font=font(BODY, 34), fill=lerp(CREAM, PUR, .75), anchor='mm')
        pr.stdin.write(im.tobytes())
    pr.stdin.close(); pr.wait()
    print('ok', p['slug'], f'{n/FPS:.0f}s', flush=True)

if __name__ == '__main__':
    arg = sys.argv[1]; draft = '--draft' in sys.argv
    for p in POSTS:
        if arg == 'all' or p['slug'].startswith(arg): render(p, draft)
