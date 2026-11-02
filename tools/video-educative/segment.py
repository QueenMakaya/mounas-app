import numpy as np, soundfile as sf, json, sys
D = sys.argv[1]; GAP = float(sys.argv[2]) if len(sys.argv) > 2 else 1.0
a, sr = sf.read(f'{D}/raw.wav', dtype='float32')
hop = int(.02 * sr); n = len(a) // hop
db = 20 * np.log10(np.sqrt((a[:n * hop].reshape(n, hop) ** 2).mean(1) + 1e-12))
on = db > -45
segs = []; i = 0
while i < n:
    if on[i]:
        j = i
        while j < n and on[j]: j += 1
        segs.append([i * .02, j * .02]); i = j
    else: i += 1
m = []
for s in segs:
    if m and s[0] - m[-1][1] < GAP: m[-1][1] = s[1]
    else: m.append(s)
m = [s for s in m if s[1] - s[0] > .15]
json.dump(m, open(f'{D}/segs.json', 'w'))
gaps = [m[k + 1][0] - m[k][1] for k in range(len(m) - 1)]
print(len(m), 'segments; durées', round(min(e - s for s, e in m), 2), round(max(e - s for s, e in m), 2), '; trous min', round(min(gaps), 2))
