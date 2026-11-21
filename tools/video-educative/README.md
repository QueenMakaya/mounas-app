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

## Avec la voix de Pam

```bash
# pam_clean.wav : l'enregistrement nettoyé, mono 48 kHz
SR=48000 VOICE_WAV=pam_clean.wav VOICE_ORDER=voix-pam-sons-order.json python3 script_sons.py video
# musique fournie (sinon groove synthétisé) : ajouter MUSIC_FILE=ma-musique.mp3
```

`voix-pam-sons-order.json` donne, pour chaque réplique (par clé), le passage [début, fin] en secondes dans l'enregistrement (`null` : pas de voix).

Nettoyage de la voix (dans cet ordre) : `adeclip` pour réparer la saturation, passe-haut 100 Hz contre le ronflement grave, `noisereduce` avec le bruit de la pièce prélevé entre les répliques, puis porte de bruit douce, dé-esseur, compression 2,5:1 sans gain de rattrapage. Ne pas compresser avec un gros gain : cela remonte le bruit de fond.

`anim.py` : les écrans portent des jetons `[[NOM args]]` (entrée des éléments, bouche et yeux d'Amara, sauts, minuteur, confettis, barre d'avancement) résolus image par image. Le rendu complet prend environ 8 minutes sur 4 cœurs.
