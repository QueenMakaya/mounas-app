"""Vérifie la synchro voix/image : 14 fenêtres de 5 s transcrites + image affichée au milieu."""
import glob, os, subprocess, sys
import numpy as np, soundfile as sf, sherpa_onnx
from PIL import Image, ImageDraw, ImageFont

mp4 = sys.argv[1]; out = sys.argv[2]
dur = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mp4]))
wav = out + '.wav'
subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', mp4, '-ac', '1', '-ar', '16000', wav], check=True)
a, sr = sf.read(wav, dtype='float32')
M = glob.glob(os.path.expanduser('~/asr/*whisper*'))[0]
rec = sherpa_onnx.OfflineRecognizer.from_whisper(encoder=f'{M}/small-encoder.int8.onnx', decoder=f'{M}/small-decoder.int8.onnx',
                                                 tokens=f'{M}/small-tokens.txt', language='fr', task='transcribe', num_threads=4)
font = ImageFont.truetype(os.path.expanduser('~/.fonts/NunitoBold.ttf'), 22)
tiles = []
for k in range(14):
    t = 20 + k * (dur - 40) / 13
    st = rec.create_stream(); st.accept_waveform(sr, a[int(t * sr):int((t + 5) * sr)]); rec.decode_stream(st)
    png = f'{out}_{k}.png'
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-ss', f'{t + 2.5:.2f}', '-i', mp4, '-frames:v', '1', '-vf', 'scale=640:-1', png], check=True)
    im = Image.open(png).convert('RGB'); c = Image.new('RGB', (640, 430), 'white'); c.paste(im, (0, 0))
    d = ImageDraw.Draw(c); txt = f'{t:.0f}s : ' + st.result.text.strip()
    lines, cur = [], ''
    for w in txt.split():
        if len(cur) + len(w) > 52: lines.append(cur); cur = w
        else: cur = (cur + ' ' + w).strip()
    lines.append(cur)
    for i, l in enumerate(lines[:3]): d.text((8, 364 + i * 22), l, fill='black', font=font)
    tiles.append(c); print(txt, flush=True)
g = Image.new('RGB', (640 * 2, 430 * 7), 'white')
for i, tl in enumerate(tiles): g.paste(tl, ((i % 2) * 640, (i // 2) * 430))
g.save(out + '.jpg', quality=85)
