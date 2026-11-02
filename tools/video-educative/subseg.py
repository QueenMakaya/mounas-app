"""Découpe des segments en morceaux (pauses internes) et transcrit chaque morceau."""
import json, sys, os, glob
import numpy as np, soundfile as sf, sherpa_onnx
from scipy.signal import resample_poly
D = sys.argv[1]; ids = [int(x) for x in sys.argv[2].split(',')]; GAP = float(sys.argv[3]) if len(sys.argv) > 3 else .25
M = glob.glob(os.path.expanduser('~/asr/*whisper*'))[0]
rec = sherpa_onnx.OfflineRecognizer.from_whisper(encoder=f'{M}/small-encoder.int8.onnx', decoder=f'{M}/small-decoder.int8.onnx',
                                                 tokens=f'{M}/small-tokens.txt', language='fr', task='transcribe', num_threads=4)
a, sr = sf.read(f'{D}/raw.wav', dtype='float32')
segs = json.load(open(f'{D}/segs.json'))
def asr(x):
    x = resample_poly(x, 1, 3).astype(np.float32); z = np.zeros(8000, np.float32)
    st = rec.create_stream(); st.accept_waveform(16000, np.concatenate([z, x, z])); rec.decode_stream(st); return st.result.text.strip()
res = json.load(open(f'{D}/sub.json')) if os.path.exists(f'{D}/sub.json') else {}
for i in ids:
    s, e = segs[i]; x = a[int(s * sr):int(e * sr)]
    hop = int(.02 * sr); n = len(x) // hop
    db = 20 * np.log10(np.sqrt((x[:n * hop].reshape(n, hop) ** 2).mean(1) + 1e-12)); on = db > -45
    pieces = []; k = 0
    while k < n:
        if on[k]:
            j = k
            while j < n and on[j]: j += 1
            if pieces and (k - pieces[-1][1]) * .02 < GAP: pieces[-1][1] = j
            else: pieces.append([k, j])
            k = j
        else: k += 1
    out = []
    for p0, p1 in pieces:
        t0, t1 = s + p0 * .02, s + p1 * .02
        out.append([round(t0, 2), round(t1, 2), asr(a[int(t0 * sr):int(t1 * sr)])])
    res[str(i)] = out
    print(i, out, flush=True)
json.dump(res, open(f'{D}/sub.json', 'w'), ensure_ascii=False, indent=0)
