"""Le tambour qui dessine - 20 s prototype.
One pattern drives both the synthesized drums and the shapes, so they are exactly in sync.
"""
import math, subprocess, sys, wave
import numpy as np
from PIL import Image, ImageDraw

OUT = sys.argv[1]
SR, FPS, DUR = 44100, 30, 20.0
BPM = 105
BEAT = 60 / BPM
BARS = 8
W, H, SS = 1280, 720, 2  # SS = supersampling for smooth edges

# ---------- pattern (beats inside a bar) ----------
BASS = [0, 2]
TONE = [(1, 0), (3, 1), (3.5, 0)]            # (beat, side) side 0 = left, 1 = right
SHAKE = [i * 0.5 for i in range(8)]
MEL_A = [(0, 0), (1, 2), (1.5, 3), (2, 4), (3, 3)]   # (beat, bar index)
MEL_B = [(0, 4), (1, 3), (1.5, 2), (2, 1), (3, 0)]
NOTES = [261.63, 293.66, 329.63, 392.00, 440.00]     # C D E G A
ENTRY = {"bass": 0, "tone": 2, "shake": 4, "bala": 6}  # bar where each layer joins

ev = {"bass": [], "tone": [], "shake": [], "bala": []}
for bar in range(BARS):
    t0 = bar * 4 * BEAT
    if bar >= ENTRY["bass"]:
        ev["bass"] += [t0 + b * BEAT for b in BASS]
    if bar >= ENTRY["tone"]:
        ev["tone"] += [(t0 + b * BEAT, s) for b, s in TONE]
    if bar >= ENTRY["shake"]:
        ev["shake"] += [t0 + b * BEAT for b in SHAKE]
    if bar >= ENTRY["bala"]:
        mel = MEL_A if bar % 2 == 0 else MEL_B
        ev["bala"] += [(t0 + b * BEAT, n) for b, n in mel]
END = BARS * 4 * BEAT
ev["bass"].append(END)  # final resolving hit

# ---------- audio ----------
rng = np.random.default_rng(7)
audio = np.zeros(int(SR * DUR))

def add(sig, t, gain):
    i = int(t * SR)
    n = min(len(sig), len(audio) - i)
    if n > 0:
        audio[i:i + n] += sig[:n] * gain

def env(n, tau):
    return np.exp(-np.arange(n) / (tau * SR))

def bass_hit():
    n = int(0.6 * SR); t = np.arange(n) / SR
    f = 55 + 70 * np.exp(-t / 0.05)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.16)

def tone_hit(f):
    n = int(0.3 * SR); t = np.arange(n) / SR
    body = np.sin(2 * np.pi * f * t) * env(n, 0.07)
    skin = rng.standard_normal(n) * env(n, 0.012) * 0.25
    return body + skin

def shake_hit():
    n = int(0.09 * SR)
    x = rng.standard_normal(n)
    x = np.diff(x, prepend=0)  # crude high-pass
    a = np.minimum(np.arange(n) / (0.004 * SR), 1) * env(n, 0.02)
    return x * a

def bala_hit(f):
    n = int(0.7 * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * f * t) * env(n, 0.18)
            + 0.3 * np.sin(2 * np.pi * 4 * f * t) * env(n, 0.04))

for t in ev["bass"]:
    add(bass_hit(), t, 0.9)
for t, s in ev["tone"]:
    add(tone_hit(300 if s == 0 else 360), t, 0.45)
for i, t in enumerate(ev["shake"]):
    add(shake_hit(), t, 0.10 if i % 2 else 0.16)
for t, n in ev["bala"]:
    add(bala_hit(NOTES[n] * 2), t, 0.30)

fade = int(0.5 * SR)
audio[-fade:] *= np.linspace(1, 0, fade)
audio = np.tanh(audio * 1.1) * 0.85
wav_path = OUT.replace(".mp4", ".wav")
with wave.open(wav_path, "wb") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((audio * 32767).astype(np.int16).tobytes())

# ---------- visuals ----------
BG = (38, 16, 66)
AMBER, AMBER_D = (244, 163, 64), (214, 128, 40)
TEAL, TEAL_D = (46, 196, 182), (20, 150, 140)
CREAM = (253, 246, 236)
BAR_COL = [(232, 112, 90), (244, 163, 64), (240, 200, 110), (46, 196, 182), (150, 110, 200)]

def mix(a, b, k):
    return tuple(int(a[i] + (b[i] - a[i]) * k) for i in range(3))

def pulse(t, times, tau=0.22, attack=0.05):
    """Soft swell: quick ease-in, slow ease-out. Never an instant jump."""
    v = 0.0
    for h in times:
        d = t - h
        if 0 <= d < 1.5:
            a = min(d / attack, 1.0)
            v = max(v, a * math.exp(-max(d - attack, 0) / tau))
    return v

def layer_in(t, name):
    start = ENTRY[name] * 4 * BEAT
    k = (t - start + BEAT) / BEAT          # fades in over the beat before it plays
    return max(0.0, min(1.0, k))

def circle(d, cx, cy, r, col):
    d.ellipse([(cx - r) * SS, (cy - r) * SS, (cx + r) * SS, (cy + r) * SS], fill=col)

def ring(d, cx, cy, r, col, w):
    d.ellipse([(cx - r) * SS, (cy - r) * SS, (cx + r) * SS, (cy + r) * SS], outline=col, width=int(w * SS))

tone_t = [[t for t, s in ev["tone"] if s == k] for k in (0, 1)]
bala_t = [[t for t, n in ev["bala"] if n == k] for k in range(5)]

def frame(t):
    im = Image.new("RGB", (W * SS, H * SS), BG)
    d = ImageDraw.Draw(im)
    cx, cy = W / 2, H / 2 - 40
    out = max(0.0, min(1.0, (DUR - t) / 1.2))   # calm ending

    # faint wax-style backdrop, completely still
    for r in range(120, 900, 90):
        ring(d, cx, cy, r, mix(BG, (90, 50, 130), 0.35), 2)

    # djembe bass: big amber circle that swells
    p = pulse(t, ev["bass"], tau=0.28)
    for h in ev["bass"]:                         # soft ripple travelling outwards
        dt = t - h
        if 0 <= dt < 1.1:
            k = dt / 1.1
            ring(d, cx, cy, 170 + 260 * k, mix(BG, AMBER, 0.30 * (1 - k)), 6)
    R = 150 * (1 + 0.20 * p)
    circle(d, cx, cy, R, mix(BG, AMBER, out))
    circle(d, cx, cy, R * 0.72, mix(BG, AMBER_D, out))
    circle(d, cx, cy, R * 0.46, mix(BG, AMBER, out))
    circle(d, cx, cy, R * 0.20, mix(BG, CREAM, 0.9 * out))

    # djembe tone: teal circles left and right
    a = layer_in(t, "tone") * out
    if a > 0:
        for k, x in ((0, cx - 400), (1, cx + 400)):
            q = pulse(t, tone_t[k], tau=0.18)
            r = 70 * (1 + 0.28 * q)
            circle(d, x, cy, r, mix(BG, TEAL, a))
            circle(d, x, cy, r * 0.6, mix(BG, TEAL_D, a))
            circle(d, x, cy, r * 0.25, mix(BG, CREAM, 0.9 * a))

    # shekere: ring of small dots that turns a step on every shake (no brightness change)
    a = layer_in(t, "shake") * out
    if a > 0:
        step = 0.0
        for h in ev["shake"]:
            dd = t - h
            if dd >= 0:
                step += 1 - math.exp(-dd / 0.08)
        ang0 = step * (2 * math.pi / 32)
        rr = 245 + 8 * p
        for i in range(16):
            ang = ang0 + i * 2 * math.pi / 16
            circle(d, cx + rr * math.cos(ang), cy + rr * math.sin(ang), 9,
                   mix(BG, CREAM, 0.8 * a))

    # balafon: five bars along the bottom, each lifts and warms when struck
    a = layer_in(t, "bala") * out
    if a > 0:
        bw, gap = 150, 30
        x0 = cx - (5 * bw + 4 * gap) / 2
        for i in range(5):
            q = pulse(t, bala_t[i], tau=0.25)
            hgt = 70 - i * 6
            y = H - 70 - 14 * q
            col = mix(mix(BG, BAR_COL[i], 0.70), BAR_COL[i], q)
            col = mix(BG, col, a)
            x = x0 + i * (bw + gap)
            d.rounded_rectangle([x * SS, (y - hgt / 2) * SS, (x + bw) * SS, (y + hgt / 2) * SS],
                                radius=18 * SS, fill=col)
    return im.resize((W, H), Image.LANCZOS)

ff = subprocess.Popen(
    ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
     "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-i", wav_path,
     "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-c:a", "aac", "-b:a", "192k",
     "-shortest", OUT], stdin=subprocess.PIPE)

lum, prev, max_step = [], None, 0.0
for n in range(int(DUR * FPS)):
    im = frame(n / FPS)
    ff.stdin.write(im.tobytes())
    arr = np.asarray(im, dtype=np.float32) / 255
    L = (0.2126 * arr[..., 0] + 0.7152 * arr[..., 1] + 0.0722 * arr[..., 2])
    lum.append(float(L.mean()))
    if prev is not None:
        # share of the screen whose brightness changed by more than 10 % in one frame
        max_step = max(max_step, float((np.abs(L - prev) > 0.10).mean()))
    prev = L
    if n in (60, 300, 500):
        im.save(OUT.replace(".mp4", f"_f{n}.png"))
ff.stdin.close(); ff.wait()

lum = np.array(lum)
print(f"mean screen brightness: min {lum.min():.3f}  max {lum.max():.3f}")
print(f"largest frame-to-frame change in mean brightness: {np.abs(np.diff(lum)).max():.4f}")
print(f"largest share of screen changing >10% brightness in one frame: {max_step*100:.2f}%")
