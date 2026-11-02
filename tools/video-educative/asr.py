"""Transcrit les segments de la voix de Pam (Whisper small int8, français)."""
import json, sys, os, glob
import numpy as np, soundfile as sf, sherpa_onnx
from scipy.signal import resample_poly
D = sys.argv[1]
M = glob.glob(os.path.expanduser('~/asr/*whisper*'))[0]
rec = sherpa_onnx.OfflineRecognizer.from_whisper(encoder=f'{M}/small-encoder.int8.onnx', decoder=f'{M}/small-decoder.int8.onnx',
                                                 tokens=f'{M}/small-tokens.txt', language='fr', task='transcribe', num_threads=4)
a, sr = sf.read(f'{D}/raw.wav', dtype='float32')
segs = json.load(open(f'{D}/segs.json'))
out = {}
p = f'{D}/asr.json'
if os.path.exists(p): out = json.load(open(p))
for i, (s, e) in enumerate(segs):
    if str(i) in out: continue
    x = resample_poly(a[int(s * sr):int(e * sr)], 1, 3).astype(np.float32)
    pieces = [x[k:k + 16000 * 28] for k in range(0, len(x), 16000 * 28)]
    txt = []
    for pc in pieces:
        st = rec.create_stream(); st.accept_waveform(16000, pc); rec.decode_stream(st); txt.append(st.result.text.strip())
    out[str(i)] = ' '.join(txt)
    json.dump(out, open(p, 'w'), ensure_ascii=False, indent=0)
    print(i, round(s, 1), out[str(i)], flush=True)
