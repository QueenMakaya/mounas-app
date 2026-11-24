"""Mini moteur vidéo Les Mounas : écrans SVG animés + voix (TTS ou Pam) + bruitages + musique, rendu MP4."""
import os, io, hashlib, subprocess, wave, json
import numpy as np
import anim

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.environ.get('MOUNAS_OUT', os.path.join(HERE, 'out'))
os.makedirs(os.path.join(OUT, 'tts'), exist_ok=True)
SR = int(os.environ.get('SR', 24000))
FPS = 24
T = []          # {svg, dur, audio: [(offset_s, samples, is_voice)]}
LINES = []      # répliques à enregistrer
DRY = os.environ.get('DRY') == '1'

# ---------- voix ----------
_k = None
def tts(text):
    global _k
    h = hashlib.md5(text.encode()).hexdigest()[:16]
    p = os.path.join(OUT, 'tts', h + '.npy')
    if os.path.exists(p): return np.load(p)
    if DRY: return np.zeros(int(SR * (0.6 + len(text) * 0.075)), dtype=np.float32)
    if _k is None:
        from kokoro_onnx import Kokoro
        _k = Kokoro(os.path.join(HERE, 'models/kokoro-v1.0.onnx'), os.path.join(HERE, 'models/voices-v1.0.bin'))
    s, sr = _k.create(text, voice='ff_siwis', speed=0.86, lang='fr-fr')
    assert sr == SR
    s = s.astype(np.float32); np.save(p, s)
    return s

# Voix de Pam : VOICE_WAV = enregistrement nettoyé, VOICE_ORDER = json {clé de réplique: [début, fin] ou null}
_voice = None; _order = None
if os.environ.get('VOICE_WAV'):
    import soundfile as _sf
    _voice, _vsr = _sf.read(os.environ['VOICE_WAV']); assert _vsr == SR
    _order = json.load(open(os.environ['VOICE_ORDER']))

def _pam(key):
    o = _order[key]
    if o is None: return np.zeros(int(SR * 1.2), dtype=np.float32)
    if isinstance(o, (int, float)): return np.zeros(int(SR * o), dtype=np.float32)   # réplique non enregistrée : silence de o secondes
    s = _voice[int(o[0]*SR):int(o[1]*SR)].astype(np.float32).copy()
    # même volume pour chaque réplique : niveau mesuré sur les passages parlés, gain borné à ±6 dB
    h = int(SR * 0.05); k = len(s) // h
    r = np.sqrt((s[:k*h].reshape(k, h) ** 2).mean(1)); act = r[r > r.max() * 0.1]
    s *= float(np.clip(10 ** (-21 / 20) / (np.sqrt((act ** 2).mean()) + 1e-9), 0.5, 2.0))
    pk = np.abs(s).max()
    if pk > 0.8: s *= 0.8 / pk
    f = int(SR * 0.04); s[:f] *= np.linspace(0, 1, f); s[-f:] *= np.linspace(1, 0, f)
    return s

# ---------- bruitages : uniquement des sons à notes claires (pas de souffle) ----------
def _note(f, dur, d=8.0, h=0.3, a=0.004):
    n = int(SR * dur); t = np.arange(n) / SR
    return (np.sin(2*np.pi*f*t) + h*np.sin(2*np.pi*2*f*t) + 0.25*h*np.sin(2*np.pi*4*f*t)*np.exp(-25*t)) * np.minimum(t/a, 1) * np.exp(-d*t)

def _seq(notes, step, dur=0.5, d=7.0, vol=0.24):
    out = np.zeros(int(SR * (step * len(notes) + dur)))
    for i, f in enumerate(notes):
        s = vol * _note(f, dur, d); o = int(SR * step * i); out[o:o+len(s)] += s
    return out

def sfx(name):
    if name == 'tic':  return 0.3 * _note(1300, 0.08, 45, 0)
    if name == 'tac':  return 0.3 * _note(950, 0.08, 45, 0)
    if name == 'ding': return _seq([1318.5, 1760.0], 0.14, 0.9, 5, 0.26)
    if name == 'pop':
        n = int(SR*0.11); t = np.arange(n)/SR
        return 0.3 * np.sin(2*np.pi*(520*t + 2600*t*t)) * np.minimum(t/0.003, 1) * np.exp(-28*t)
    if name == 'boing':
        n = int(SR*0.32); t = np.arange(n)/SR
        return 0.3 * np.sin(2*np.pi*(240*t + 520*t*t)) * np.minimum(t/0.004, 1) * np.exp(-8*t)
    if name == 'whoosh':   # transition : trois notes de balafon qui montent
        return _seq([659.25, 783.99, 1046.5], 0.075, 0.45, 9, 0.22)
    if name == 'oops':     # piège : deux notes qui descendent
        return _seq([440.0, 349.23], 0.16, 0.5, 7, 0.24)
    if name == 'djembe':   # un coup grave puis un coup clair
        n = int(SR*0.3); t = np.arange(n)/SR
        low = np.sin(2*np.pi*(78*t + 2.2*(1-np.exp(-35*t)))) * np.exp(-11*t)
        hi = 0.7*np.sin(2*np.pi*330*t) * np.exp(-30*t) * np.minimum(t/0.002, 1)
        out = np.zeros(int(SR*0.75)); out[:n] += 0.6*low; o = int(SR*0.22); out[o:o+n] += 0.45*hi; o = int(SR*0.4); out[o:o+n] += 0.6*low[:len(out)-o]
        return out
    if name == 'chant':    # trois notes tenues, comme une voix qui chante
        return _seq([523.25, 659.25, 783.99], 0.22, 0.9, 2.5, 0.16)
    if name == 'tada':
        return _seq([523.25, 659.25, 783.99, 1046.5], 0.10, 1.0, 4, 0.2)
    raise KeyError(name)

# ---------- timeline ----------
def _q(d): return max(1, round(d * FPS)) / FPS
_prev = ['']
def _add(svg, dur, audio):
    tpl = anim.prepare(svg, _prev[0]); _prev[0] = svg
    T.append(dict(svg=tpl, dur=dur, audio=audio))

def say(svg, text, tts_text=None, pad=0.55, sfx_name=None, record=True, key=None):
    """Affiche svg pendant la réplique. key : nom de la réplique dans l'enregistrement de Pam."""
    if _order is not None:
        s = _pam(key); pad = min(pad, 0.4)
    else:
        s = tts(tts_text or text)
    au = [(0.15, s, True)]
    if sfx_name: au.append((0.0, sfx(sfx_name), False))
    _add(svg, _q(0.15 + len(s)/SR + pad), au)
    if record: LINES.append((key, text))

def hold(svg, s, sfx_name=None, at=0.0):
    _add(svg, _q(s), [(at, sfx(sfx_name), False)] if sfx_name else [])

def countdown(fn, n):
    for k in range(n, 0, -1):
        hold(fn(k), 1.0, 'tic' if k % 2 else 'tac')
    LINES.append((None, f'⏱ (silence : compte à rebours de {n} secondes à l\'écran)'))

# ---------- musique ----------
def music(total):
    """Groove afro entraînant, 112 BPM : grosse caisse, shaker, basse, balafon à deux phrases, accords."""
    f = os.environ.get('MUSIC_FILE')
    n = int(SR * total)
    if f:
        import soundfile as sf, librosa
        x, sr = sf.read(f)
        if x.ndim > 1: x = x.mean(1)
        if sr != SR: x = librosa.resample(x.astype(np.float32), orig_sr=sr, target_sr=SR)
        x = x / (np.abs(x).max() + 1e-9) * 0.6
        return np.tile(x, n // len(x) + 1)[:n]
    bpm = 112; st = 60 / bpm / 4            # double-croche
    bar = 16; L = int(SR * st * bar * 8) + SR
    out = np.zeros(L); rng = np.random.default_rng(5)
    def put(s, step, vol):
        o = int(SR * st * step); e = min(L, o + len(s)); out[o:e] += vol * s[:e-o]
    def kick():
        m = int(SR*0.22); t = np.arange(m)/SR; return np.sin(2*np.pi*(55*t + 70*np.exp(-28*t)/28*28*t*0 + 3.2*(1-np.exp(-30*t)))) * np.exp(-16*t)
    def shaker():
        m = int(SR*0.05); x = rng.standard_normal(m); x = x - np.convolve(x, np.ones(6)/6, 'same'); return x * np.exp(-70*np.arange(m)/SR)
    def conga(fr):
        m = int(SR*0.18); t = np.arange(m)/SR; return np.sin(2*np.pi*fr*t) * np.exp(-24*t) * np.minimum(t/0.002, 1)
    def bass(fr, d=0.3):
        m = int(SR*d); t = np.arange(m)/SR; return (np.sin(2*np.pi*fr*t) + 0.3*np.sin(4*np.pi*fr*t)) * np.minimum(t/0.008, 1) * np.exp(-5*t)
    K, SH, CH, CL = kick(), shaker(), conga(330), conga(220)
    C, D, E, G, A = 261.63, 293.66, 329.63, 392.0, 440.0
    chords = [(C, [C*2, E*2, G*2]), (A/2, [A, C*2, E*2]), (C*2/3*1.0 if False else 174.61, [174.61*2, A, C*2]), (G/2, [G, 246.94*2, D*2])]  # do, la m, fa, sol
    melA = {0: G*2, 3: A*2, 6: C*4, 8: A*2, 10: G*2, 12: E*2, 14: G*2}
    melB = {0: C*4, 2: C*4, 4: A*2, 6: G*2, 8: E*2, 11: G*2, 12: A*2, 14: C*4}
    for b in range(8):
        root, ch = chords[b % 4]; o = b * bar
        for s in range(bar):
            if s % 4 == 0: put(K, o + s, 0.9)
            put(SH, o + s, 0.10 if s % 2 else 0.2)
            if s in (3, 10): put(CH, o + s, 0.3)
            if s in (6, 13, 15): put(CL, o + s, 0.3)
        for s, mul in ((0, 1), (3, 1), (6, 1.5), (8, 1), (11, 2), (14, 1.5)):
            put(bass(root / 2 * mul), o + s, 0.5)
        for s in (2, 10):
            for fr in ch: put(_note(fr, 0.35, 10, 0.2), o + s, 0.10)
        for s, fr in (melA if b % 4 < 2 else melB).items():
            put(_note(fr, 0.45, 9, 0.35), o + s, 0.34)
    loop = out[:int(SR * st * bar * 8)]
    loop = loop / np.abs(loop).max() * 0.6
    return np.tile(loop, n // len(loop) + 1)[:n]

# ---------- rendu ----------
def total(): return sum(e['dur'] for e in T)

def _frame(svg):
    from cairosvg.surface import PNGSurface
    from cairosvg.parser import Tree
    s = PNGSurface(Tree(bytestring=svg.encode()), io.BytesIO(), 96, output_width=1920, output_height=1080)
    d = bytes(s.cairo.get_data()); s.finish()
    return d

def _chunk(args):
    path, jobs = args      # jobs : (gabarit, t local, durée, t global, niveau de voix, avancement)
    ff = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'bgra', '-s', '1920x1080', '-r', str(FPS), '-i', '-',
                           '-vf', 'format=yuv420p', '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', path], stdin=subprocess.PIPE)
    last = None; data = None
    for tpl, t, dur, tg, lvl, prog in jobs:
        svg = anim.resolve(tpl, t, dur, tg, lvl, prog)
        if svg != last: data = _frame(svg); last = svg
        ff.stdin.write(data)
    ff.stdin.close(); ff.wait()
    return path

def still(i, t=None, path=None):
    """Image de contrôle de l'écran i (à t secondes, par défaut vers la fin)."""
    import cairosvg
    e = T[i]; t = e['dur'] * 0.95 if t is None else t
    tg = sum(x['dur'] for x in T[:i]) + t
    svg = anim.resolve(e['svg'], t, e['dur'], tg, 0, tg / total())
    return cairosvg.svg2png(bytestring=svg.encode(), write_to=path, output_width=1920, output_height=1080)

def render(name, workers=4):
    from multiprocessing import Pool
    tot = total(); n = int(SR * tot) + SR
    voice = np.zeros(n); fx = np.zeros(n); t = 0.0
    for e in T:
        for off, s, is_voice in e['audio']:
            o = int(SR * (t + off)); s = s[:n - o]
            (voice if is_voice else fx)[o:o+len(s)] += s
        t += e['dur']
    # niveau de voix image par image (pour la bouche d'Amara)
    h = SR // FPS; nf = int(round(tot * FPS))
    lv = np.sqrt((voice[:nf*h].reshape(nf, h) ** 2).mean(1)) / 0.07
    jobs = []; t = 0.0; fi = 0
    for e in T:
        k = int(round(e['dur'] * FPS))
        for j in range(k):
            jobs.append((e['svg'], j / FPS, e['dur'], t + j / FPS, float(lv[min(fi, nf-1)]), (t + j / FPS) / tot)); fi += 1
        t += e['dur']
    per = len(jobs) // workers + 1
    parts = [(os.path.join(OUT, f'{name}.part{i}.mp4'), jobs[i*per:(i+1)*per]) for i in range(workers)]
    with Pool(workers) as p: files = p.map(_chunk, parts)
    # la musique baisse sous la voix
    env = np.abs(voice); w = int(SR*0.35); env = np.convolve(env, np.ones(w)/w, 'same')
    duck = np.convolve(np.where(env > 0.004, 1.0, 0.0), np.ones(SR//2)/(SR//2), 'same')
    mus = music(tot + 1)[:n] * (0.30 - 0.235 * duck)
    fade = np.minimum(1, np.minimum(np.arange(n)/SR/1.0, (n - np.arange(n))/SR/2.5))
    mix = np.clip(voice * (1.15 if _order is not None else 0.95) + fx * 0.6 + mus * fade, -1, 1)
    wav = os.path.join(OUT, name + '.wav')
    with wave.open(wav, 'wb') as f:
        f.setnchannels(1); f.setsampwidth(2); f.setframerate(SR); f.writeframes((mix * 32000).astype(np.int16).tobytes())
    lst = os.path.join(OUT, name + '.txt'); open(lst, 'w').write(''.join(f"file '{p}'\n" for p in files))
    mp4 = os.path.join(OUT, name + '.mp4')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', lst, '-i', wav, '-c:v', 'copy',
                    '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11', '-ar', '48000', '-c:a', 'aac', '-b:a', '160k',
                    '-t', f'{tot:.3f}', '-movflags', '+faststart', mp4], check=True)
    for p in files: os.remove(p)
    return mp4
