# Vidéo éducative : mini moteur

Moteur léger pour les vidéos éducatives Les Mounas (écrans SVG, voix brouillon, bruitages, musique, rendu MP4).

- `engine.py` : timeline (`say`, `hold`, `countdown`), voix brouillon Kokoro, bruitages et musique synthétisés, rendu ffmpeg.
- `draw.py` : palette, fond, Amara, Kofi, cartes, pastilles.
- `script_sons.py` : épisode « Un, deux, trois : les trois sons ».
- `fiche-sons.html` + `fiche-pdf.js` : la fiche Skool, exportée en PDF avec Playwright (`node fiche-pdf.js <html> <pdf>`).

## Lancer

```bash
pip install kokoro-onnx soundfile cairosvg fonttools pillow numpy
# modèles de voix dans tools/video-educative/models/ (non versionnés)
#   https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
#   https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin
# polices dans ~/.fonts : « Fraunces Black », « Fraunces Semi », « Nunito XB », « Nunito B », « Fredoka SB »
python3 script_sons.py video    # rend out/sons-un-deux-trois.mp4
python3 script_sons.py lines    # liste des répliques à enregistrer
DRY=1 python3 script_sons.py frames   # écrans seuls, sans voix
```
