"""Remplace la voix TTS par la voix de Pam : une plage de l'enregistrement par réplique.

ORDER : une entrée par appel say/anim(text=...), dans l'ordre du script.
Chaque entrée = (segments, depuis, jusqu'à) ; seuls les morceaux de parole
(transcription non vide, pas un bruit) entre ces bornes sont gardés.
"""
import json, os, re, subprocess, sys
import numpy as np, soundfile as sf

D = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'pam')
SR = 48000
NOISE = re.compile(r'bruit|musique|rire|^\W*$|^\(?\.\.\.\)?$', re.I)
sub = {}
for f in ('sub.json', 'sub_fine.json'):
    sub.update(json.load(open(f'{D}/{f}')))


def S(*segs, t0=None, t1=None):
    return (segs, t0, t1)


ORDER = [
    S(0), S(1, t1=10.8), S(1, t0=12.3), S(2), S(3), S(4, 5), S(6), S(7), S(8), S(9),              # 1-10
    S(10), S(11), S(12), S(13, t1=86.6), S(13, t0=87.5), S(14), S(15, t1=93.5), S(15, t0=94), S(16), S(17),  # 11-20
    S(18), S(19), S(20), S(21), S(22), S(23), S(24), S(25), S(26, t1=157.2), S(26, t0=158, t1=162),      # 21-30
    S(26, t0=162.1), S(27), S(28), S(30), S(31), S(32), S(33), S(34), S('35f', t1=208.1), S('35f', t0=209.1),  # 31-40
    S(36, 37), S(39), S(40, t1=239.7), S(40, t0=239.9), S(41), S(43), S(44, t1=263.8), S(44, t0=264.5), S(45), S(46),  # 41-50
    S(47, 48), S(49), S(50, 51), S(52, 53), S(54), S(55, t0=330.3), S(56), S(57), S(58), S(59, t1=351.2),  # 51-60
    S(59, t0=351.4), S(60), S(63), S(64, 65), S(66), S(67), S('68f', t0=394), S(70), S(71), S(72),          # 61-70
    S(73), S(74), S(75, 76), S(77, t1=446.4), S(77, t0=447.9), S(79), S(81), S(83), S(84), S(85),          # 71-80
    S(86), S(87), S(88), S(89, 90), S(91), S(92), S(93), S(94), S(95), S(97, 98),                          # 81-90
    S(100, 101), S(102, 103), S(104, 105), S(106), S(107), S(108), S(109), S(111), S(112), S(114, t0=668.8),  # 91-100
    S(115), S(117), S(118), S(119), S(120, t0=700.2), S(121), S(122), S(123), S(124, 125), S(126),         # 101-110
    S(127), S(128), S(129, t0=748, t1=752.3), S(129, t0=753.5), S(130),                                    # 111-115
]


def span(entry):
    segs, t0, t1 = entry
    pieces = []
    for s in segs:
        key = s[:-1] if isinstance(s, str) else str(s)
        src = sub[key] if not isinstance(s, str) else json.load(open(f'{D}/sub_fine.json'))[key]
        pieces += [p for p in src if not NOISE.search(p[2]) and p[1] - p[0] >= .25
                   and (t0 is None or p[0] >= t0) and (t1 is None or p[1] <= t1)]
    assert pieces, entry
    return pieces[0][0], pieces[-1][1], ' '.join(p[2] for p in pieces)


def clean():
    out = f'{D}/clean.wav'
    if not os.path.exists(out):
        subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', f'{D}/raw.wav', '-af',
                        'highpass=f=80,afftdn=nr=8:nf=-50,equalizer=f=250:t=q:w=1:g=-2,equalizer=f=3500:t=q:w=1:g=2.5,'
                        'acompressor=threshold=-20dB:ratio=3:attack=10:release=150:makeup=2', '-ar', str(SR), '-ac', '1', out], check=True)
    return out


def build():
    a, sr = sf.read(clean(), dtype='float32')
    lines = [l for l in json.load(open(os.path.join(os.path.dirname(D), 'out', 'saisons_lignes.json'))) if not l.startswith('⏱')]
    assert len(lines) == len(ORDER), (len(lines), len(ORDER))
    os.makedirs(f'{D}/lines', exist_ok=True)
    rep = []
    for i, e in enumerate(ORDER):
        s, t, heard = span(e)
        x = a[int((s - .06) * sr):int((t + .12) * sr)].copy()
        f = int(.015 * sr); x[:f] *= np.linspace(0, 1, f); x[-f:] *= np.linspace(1, 0, f)
        sf.write(f'{D}/lines/{i:03d}.wav', x, sr)
        rep.append(f'{i + 1:3d} [{s:6.1f}-{t:6.1f}] {lines[i]}\n      entendu : {heard}')
    open(f'{D}/alignement.txt', 'w').write('\n'.join(rep) + '\n')
    print(f'{len(ORDER)} répliques -> {D}/lines')


if __name__ == '__main__':
    build()
