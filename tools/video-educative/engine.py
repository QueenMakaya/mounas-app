"""Moteur vidéo Les Mounas : timeline d'images SVG + voix + SFX + musique -> MP4.

API : say(svg, texte) · hold(svg, s, sfx) · countdown(fn, n) · anim(fn, s, fps=12, text=)
"""
import hashlib, json, math, os, subprocess
import numpy as np
import soundfile as sf
import cairosvg
from scipy.signal import resample_poly

SR = 48000
FPS = 24
ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.environ.get('MOUNAS_OUT', os.path.join(ROOT, 'out'))
CACHE = os.path.join(ROOT, 'cache')
for d in (OUT, CACHE, f'{CACHE}/img', f'{CACHE}/tts'):
    os.makedirs(d, exist_ok=True)

_kokoro = None
SPEED = 0.86
PAD = 0.45  # silence après chaque réplique


def _h(s):
    return hashlib.md5(s.encode()).hexdigest()[:16]


def render(svg):
    p = f'{CACHE}/img/{_h(svg)}.png'
    if not os.path.exists(p):
        cairosvg.svg2png(bytestring=svg.encode(), write_to=p, output_width=1920, output_height=1080)
    return p


def tts(text):
    global _kokoro
    p = f'{CACHE}/tts/{_h(text + str(SPEED))}.wav'
    if not os.path.exists(p):
        if _kokoro is None:
            from kokoro_onnx import Kokoro
            k = os.path.expanduser('~/kokoro')
            _kokoro = Kokoro(f'{k}/kokoro-v1.0.onnx', f'{k}/voices-v1.0.bin')
        a, sr = _kokoro.create(text, voice='ff_siwis', speed=SPEED, lang='fr-fr')
        a = resample_poly(a, SR, sr).astype(np.float32)
        # retire les silences de bord
        idx = np.where(np.abs(a) > 0.01)[0]
        if len(idx):
            a = a[max(0, idx[0] - 1200):idx[-1] + 2400]
        sf.write(p, a, SR)
    return sf.read(p, dtype='float32')[0]


# ---------------- SFX synthétisés ----------------
def _env(n, a=0.002, d=0.1):
    t = np.arange(n) / SR
    return np.minimum(1, t / a) * np.exp(-t / d)


def sfx(name):
    rnd = np.random.default_rng(len(name))
    if name in ('tic', 'tac'):
        n = int(.06 * SR); t = np.arange(n) / SR
        f = 2600 if name == 'tic' else 1900
        return (np.sin(2 * np.pi * f * t) * _env(n, .001, .012) * .5).astype(np.float32)
    if name == 'clap':
        n = int(.18 * SR)
        return (rnd.standard_normal(n) * _env(n, .001, .03) * .45).astype(np.float32)
    if name == 'ding':
        n = int(1.2 * SR); t = np.arange(n) / SR
        s = sum(np.sin(2 * np.pi * f * t) * w for f, w in [(1318, 1), (2637, .4), (3951, .15)])
        return (s * _env(n, .002, .35) * .32).astype(np.float32)
    if name == 'pop':
        n = int(.12 * SR); t = np.arange(n) / SR
        f = 400 + 900 * np.exp(-t / .02)
        return (np.sin(2 * np.pi * np.cumsum(f) / SR) * _env(n, .001, .04) * .5).astype(np.float32)
    if name == 'whoosh':
        n = int(.7 * SR); t = np.arange(n) / SR
        noise = rnd.standard_normal(n)
        k = np.ones(40) / 40
        noise = np.convolve(noise, k, 'same')
        return (noise * np.sin(np.pi * t / .7) ** 2 * 1.4).astype(np.float32)
    if name == 'tada':
        out = np.zeros(int(1.4 * SR), np.float32)
        for i, f in enumerate([523, 659, 784, 1046]):
            n = int(1.0 * SR); t = np.arange(n) / SR
            s = (np.sin(2 * np.pi * f * t) + .3 * np.sin(4 * np.pi * f * t)) * _env(n, .005, .3) * .22
            o = int(i * .09 * SR); out[o:o + n] += s[:len(out) - o]
        return out
    if name == 'boing':
        n = int(.5 * SR); t = np.arange(n) / SR
        f = 180 + 120 * np.sin(2 * np.pi * 9 * t) * np.exp(-t / .2)
        return (np.sin(2 * np.pi * np.cumsum(f) / SR) * _env(n, .002, .18) * .5).astype(np.float32)
    if name == 'wind':
        n = int(2.0 * SR); t = np.arange(n) / SR
        noise = np.convolve(rnd.standard_normal(n), np.ones(120) / 120, 'same')
        return (noise * np.sin(np.pi * t / 2.0) * 4).astype(np.float32)
    if name == 'birds':
        out = np.zeros(int(1.6 * SR), np.float32)
        for i in range(5):
            n = int(.12 * SR); t = np.arange(n) / SR
            f = 3200 + 1200 * np.sin(2 * np.pi * 18 * t)
            s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / .12) * .18
            o = int((.05 + i * .28 + (i % 2) * .06) * SR); out[o:o + n] += s
        return out
    if name == 'brr':
        n = int(.8 * SR); t = np.arange(n) / SR
        return (np.sin(2 * np.pi * 110 * t) * (0.5 + .5 * np.sign(np.sin(2 * np.pi * 28 * t))) * _env(n, .01, .4) * .25).astype(np.float32)
    raise KeyError(name)


# ---------------- musique balafon + djembé ----------------
def music(dur, bpm=100):
    n = int(dur * SR)
    out = np.zeros(n + SR * 2, np.float32)
    beat = 60 / bpm
    step = beat / 2
    scale = [392, 440, 523, 587, 659, 784, 880]  # pentatonique en sol
    pattern = [0, 2, 4, 2, 5, 4, 2, 1, 0, 2, 4, 5, 6, 5, 4, 2]
    bass = [196, 196, 220, 174.6]
    bn = int(.5 * SR); bt = np.arange(bn) / SR
    def bal(f):
        s = np.sin(2 * np.pi * f * bt) + .35 * np.sin(2 * np.pi * f * 3.9 * bt) * np.exp(-bt / .03)
        return s * _env(bn, .002, .16) * .10
    dn = int(.3 * SR); dt_ = np.arange(dn) / SR
    rnd = np.random.default_rng(5)
    low = np.sin(2 * np.pi * (70 + 60 * np.exp(-dt_ / .03)) * dt_) * _env(dn, .001, .12) * .22
    slap = rnd.standard_normal(dn) * _env(dn, .001, .02) * .08
    i = 0; t = 0.0
    while t < dur:
        o = int(t * SR)
        bar = (i // 16) % 4
        if i % 2 == 0 or pattern[i % 16] in (4, 6):
            out[o:o + bn] += bal(scale[pattern[i % 16]] * (1 if bar < 2 else 1.0))
        if i % 8 == 0:
            out[o:o + bn] += bal(bass[bar] / 2) * 1.2
        if i % 4 == 0:
            out[o:o + dn] += low
        if i % 4 == 2 or (i % 8 == 7):
            out[o:o + dn] += slap
        i += 1; t += step
    return out[:n]


class Timeline:
    def __init__(self, name):
        self.name = name
        self.frames = []  # (png, durée)
        self.t = 0.0
        self.voice = []  # (t, audio)
        self.fx = []
        self.lines = []  # texte à enregistrer
        self.music_off = []  # (t0, t1) sans musique
        # voix enregistrée : MOUNAS_VOICE = dossier de 000.wav, 001.wav... (une par réplique)
        self.voice_dir = os.environ.get('MOUNAS_VOICE')
        self.k = 0

    def _voice(self, text):
        self.lines.append(text)
        if self.voice_dir:
            a = sf.read(f'{self.voice_dir}/{self.k:03d}.wav', dtype='float32')[0]
        else:
            a = tts(text)
        self.k += 1
        return a

    def _add(self, png, d):
        nf = max(1, round(d * FPS))
        self.frames.append((png, nf))
        self.t += nf / FPS
        return nf / FPS

    def say(self, svg, text, sfx_=None, pad=PAD):
        a = self._voice(text)
        if sfx_:
            self.fx.append((self.t, sfx(sfx_)))
        self.voice.append((self.t + .15, a))
        self._add(render(svg), .15 + len(a) / SR + pad)

    def hold(self, svg, s, sfx_=None):
        if sfx_:
            self.fx.append((self.t, sfx(sfx_)))
        self._add(render(svg), s)

    def countdown(self, fn, n):
        self.lines.append(f'⏱ (compte à rebours de {n} s, ne rien dire)')
        for k in range(n, 0, -1):
            self.fx.append((self.t, sfx('tic' if k % 2 == 0 else 'tac')))
            self._add(render(fn(k)), 1.0)

    def anim(self, fn, s, fps=12, text=None, sfx_=None):
        t0 = self.t
        if text:
            a = self._voice(text)
            self.voice.append((t0 + .15, a))
            s = max(s, .15 + len(a) / SR + PAD)
        if sfx_:
            self.fx.append((t0, sfx(sfx_)))
        n = max(1, round(s * fps))
        for i in range(n):
            self._add(render(fn(i / n)), 1 / fps)

    # ---------------- rendu ----------------
    def build(self, preview=False):
        dur = self.t
        voice = np.zeros(int((dur + 1) * SR), np.float32)
        for t, a in self.voice:
            o = int(t * SR); voice[o:o + len(a)] += a[:len(voice) - o]
        fx = np.zeros_like(voice)
        for t, a in self.fx:
            o = int(t * SR); fx[o:o + len(a)] += a[:len(fx) - o]
        mus = music(len(voice) / SR)
        # ducking sous la voix
        env = np.abs(voice)
        win = int(.25 * SR)
        env = np.convolve(env, np.ones(win) / win, 'same')
        duck = np.where(env > .004, .28, 1.0).astype(np.float32)
        duck = np.convolve(duck, np.ones(int(.3 * SR)) / int(.3 * SR), 'same')
        mix = voice * 1.0 + fx * .9 + mus * .55 * duck
        # fondu musique début/fin
        f = int(2 * SR)
        mix[-f:] *= np.linspace(1, 0, f)
        mix = np.clip(mix, -1, 1)
        wav = f'{OUT}/{self.name}{os.environ.get("MOUNAS_SUFFIX", "")}_mix.wav'
        sf.write(wav, mix, SR)
        cc = f'{OUT}/{self.name}.ffconcat'
        with open(cc, 'w') as fh:
            fh.write('ffconcat version 1.0\n')
            for png, nf in self.frames:
                fh.write(f"file '{png}'\nduration {nf / FPS:.6f}\n")
            fh.write(f"file '{self.frames[-1][0]}'\n")
        mp4 = f'{OUT}/{self.name}{os.environ.get("MOUNAS_SUFFIX", "")}.mp4'
        cmd = ['ffmpeg', '-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', cc, '-i', wav,
               '-vf', f'fps={FPS},format=yuv420p', '-c:v', 'libx264', '-preset', 'medium', '-crf', '20',
               '-tune', 'stillimage', '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11', '-c:a', 'aac', '-b:a', '160k',
               '-ar', '48000', '-shortest', '-movflags', '+faststart', mp4]
        subprocess.run(cmd, check=True)
        with open(f'{OUT}/{self.name}_lignes.json', 'w') as fh:
            json.dump(self.lines, fh, ensure_ascii=False, indent=1)
        return mp4, dur
