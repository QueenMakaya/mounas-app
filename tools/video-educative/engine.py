"""Mini moteur vidéo Les Mounas : timeline d'écrans SVG + voix TTS + SFX + musique, rendu MP4."""
import os, hashlib, subprocess, wave
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.environ.get('MOUNAS_OUT', os.path.join(HERE, 'out'))
os.makedirs(os.path.join(OUT, 'png'), exist_ok=True)
os.makedirs(os.path.join(OUT, 'tts'), exist_ok=True)
SR = int(os.environ.get('SR', 24000))
FPS = 24
T = []          # {svg, dur, audio: [(offset_s, samples)], voice: bool}
LINES = []      # répliques à enregistrer
DRY = os.environ.get('DRY') == '1'   # pas de TTS : durées estimées (pour vérifier les visuels vite)

_k = None
def _kokoro():
    global _k
    if _k is None:
        from kokoro_onnx import Kokoro
        _k = Kokoro(os.path.join(HERE, 'models/kokoro-v1.0.onnx'), os.path.join(HERE, 'models/voices-v1.0.bin'))
    return _k

def tts(text):
    h = hashlib.md5(text.encode()).hexdigest()[:16]
    p = os.path.join(OUT, 'tts', h + '.npy')
    if os.path.exists(p):
        return np.load(p)
    if DRY:
        return np.zeros(int(SR * (0.6 + len(text) * 0.075)), dtype=np.float32)
    s, sr = _kokoro().create(text, voice='ff_siwis', speed=0.86, lang='fr-fr')
    assert sr == SR
    s = s.astype(np.float32)
    np.save(p, s)
    return s

# ---------- SFX ----------
def _env(n, a=0.005, d=6.0):
    t = np.arange(n) / SR
    return np.minimum(t / a, 1) * np.exp(-d * t)

def sfx(name):
    def tone(f, dur, d=8.0, h=0.0):
        n = int(SR * dur); t = np.arange(n) / SR
        return (np.sin(2*np.pi*f*t) + h*np.sin(2*np.pi*2*f*t)) * _env(n, d=d)
    rng = np.random.default_rng(3)
    if name == 'tic':  return 0.35 * tone(1300, 0.08, 45)
    if name == 'tac':  return 0.35 * tone(950, 0.08, 45)
    if name == 'ding':
        return 0.3 * (tone(1318.5, 0.9, 5, 0.3) + np.pad(tone(1760, 0.75, 5, 0.3), (int(SR*0.15), 0)))
    if name == 'pop':
        n = int(SR*0.12); t = np.arange(n)/SR
        return 0.4 * np.sin(2*np.pi*(700*t - 1800*t*t)) * _env(n, d=25)
    if name == 'boing':
        n = int(SR*0.35); t = np.arange(n)/SR
        return 0.35 * np.sin(2*np.pi*(260*t + 30*np.sin(2*np.pi*9*t))) * _env(n, d=7)
    if name == 'whoosh':
        n = int(SR*0.5); x = rng.standard_normal(n)
        x = np.convolve(x, np.ones(24)/24, 'same'); t = np.arange(n)/n
        return 0.5 * x * np.sin(np.pi*t)**2
    if name == 'clap':
        n = int(SR*0.12); return 0.3 * rng.standard_normal(n) * _env(n, d=40)
    if name == 'tada':
        out = np.zeros(int(SR*1.4))
        for i, f in enumerate([523.25, 659.25, 783.99, 1046.5]):
            s = 0.22 * tone(f, 1.0, 4, 0.4); o = int(SR*0.11*i); out[o:o+len(s)] += s
        return out
    raise KeyError(name)

# ---------- timeline ----------
def _q(d):
    return max(1, round(d * FPS)) / FPS

# Voix de Pam : VOICE_WAV = enregistrement nettoyé, VOICE_ORDER = json [[début, fin] ou null] par appel say
_voice = None; _order = None; _nsay = [0]
if os.environ.get('VOICE_WAV'):
    import soundfile as _sf, json as _json
    _voice, _vsr = _sf.read(os.environ['VOICE_WAV']); assert _vsr == SR
    _order = _json.load(open(os.environ['VOICE_ORDER']))

def _pam(i):
    o = _order[i]
    if o is None: return np.zeros(int(SR * 1.2), dtype=np.float32)
    s = _voice[int(o[0]*SR):int(o[1]*SR)].astype(np.float32) * 0.75
    f = int(SR * 0.02); s[:f] *= np.linspace(0, 1, f); s[-f:] *= np.linspace(1, 0, f)
    return s

def say(svg, text, tts_text=None, pad=0.55, sfx_name=None, record=True):
    """Affiche svg pendant la réplique. tts_text : orthographe phonétique pour la voix brouillon."""
    if _order is not None:
        s = _pam(_nsay[0]); _nsay[0] += 1; pad = min(pad, 0.4)
    else:
        s = tts(tts_text or text)
    au = [(0.15, s, True)]
    if sfx_name: au.append((0.0, sfx(sfx_name), False))
    T.append(dict(svg=svg, dur=_q(0.15 + len(s)/SR + pad), audio=au))
    if record: LINES.append(text)

def hold(svg, s, sfx_name=None, at=0.0):
    au = [(at, sfx(sfx_name), False)] if sfx_name else []
    T.append(dict(svg=svg, dur=_q(s), audio=au))

def countdown(fn, n):
    for k in range(n, 0, -1):
        hold(fn(k), 1.0, 'tic' if k % 2 else 'tac')
    LINES.append(f'⏱ (silence : compte à rebours de {n} secondes à l\'écran)')

# ---------- musique ----------
def music(total):
    bpm = 100; beat = 60 / bpm; n = int(SR * total)
    out = np.zeros(n + SR * 2)
    scale = [392.0, 440.0, 523.25, 587.33, 659.25, 783.99]   # sol pentatonique
    pat = [0, 2, 4, 2, 3, 5, 4, 2, 0, 3, 2, 4, 1, 3, 2, 0]
    def bal(f):
        m = int(SR*0.5); t = np.arange(m)/SR
        return (np.sin(2*np.pi*f*t) + 0.35*np.sin(2*np.pi*4*f*t)*np.exp(-30*t)) * np.exp(-9*t) * np.minimum(t/0.003, 1)
    def djem(low):
        m = int(SR*0.25); t = np.arange(m)/SR
        if low: return np.sin(2*np.pi*(95*t - 60*t*t)) * np.exp(-14*t)
        r = np.random.default_rng(1).standard_normal(m)
        return 0.5*(np.sin(2*np.pi*330*t) + 0.5*r) * np.exp(-38*t)
    notes = {f: bal(f) for f in scale}; dl, dh = djem(True), djem(False)
    step = beat / 2; i = 0; t = 0.0
    while t < total:
        o = int(SR*t)
        s = notes[scale[pat[i % 16]]]
        if (i // 16) % 4 != 3 or i % 2 == 0:
            out[o:o+len(s)] += 0.5 * s
        if i % 8 == 0: out[o:o+len(dl)] += 0.9 * dl
        if i % 8 in (3, 6): out[o:o+len(dh)] += 0.45 * dh
        i += 1; t += step
    return out[:n]

# ---------- rendu ----------
def png_for(svg):
    import cairosvg
    h = hashlib.md5(svg.encode()).hexdigest()[:16]
    p = os.path.join(OUT, 'png', h + '.png')
    if not os.path.exists(p):
        cairosvg.svg2png(bytestring=svg.encode(), write_to=p, output_width=1920, output_height=1080)
    return p

def total():
    return sum(e['dur'] for e in T)

def render(name, video=True):
    tot = total(); n = int(SR * tot) + SR
    voice = np.zeros(n); fx = np.zeros(n)
    lst = []; t = 0.0
    for e in T:
        p = png_for(e['svg'])
        lst.append(f"file '{p}'\nduration {e['dur']:.6f}\n")
        for off, s, is_voice in e['audio']:
            o = int(SR * (t + off)); s = s[:n - o]
            (voice if is_voice else fx)[o:o+len(s)] += s
        t += e['dur']
    lst.append(f"file '{p}'\n")
    if not video:
        return tot
    # la musique baisse sous la voix
    env = np.abs(voice); w = int(SR*0.35)
    env = np.convolve(env, np.ones(w)/w, 'same')
    duck = np.where(env > 0.004, 1.0, 0.0)
    duck = np.convolve(duck, np.ones(SR//2)/(SR//2), 'same')
    mus = music(tot + 1)[:n] * (0.16 - 0.115 * duck)
    fade = np.minimum(1, np.minimum(np.arange(n)/SR/1.5, (n - np.arange(n))/SR/2.5))
    mix = voice * 0.95 + fx * 0.8 + mus * fade
    mix = np.clip(mix, -1, 1)
    wav = os.path.join(OUT, name + '.wav')
    with wave.open(wav, 'wb') as f:
        f.setnchannels(1); f.setsampwidth(2); f.setframerate(SR)
        f.writeframes((mix * 32000).astype(np.int16).tobytes())
    ff = os.path.join(OUT, name + '.ffconcat')
    open(ff, 'w').write('ffconcat version 1.0\n' + ''.join(lst))
    mp4 = os.path.join(OUT, name + '.mp4')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', ff, '-i', wav,
                    '-vf', f'fps={FPS},format=yuv420p', '-c:v', 'libx264', '-preset', 'medium', '-crf', '21',
                    '-tune', 'stillimage', '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11', '-ar', '48000',
                    '-c:a', 'aac', '-b:a', '160k', '-t', f'{tot:.3f}', '-movflags', '+faststart', mp4], check=True)
    return mp4
