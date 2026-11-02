# Vidéo éducative Les Mounas (moteur cloud)

Reconstruction du moteur `engine.py` / `draw.py` pour les sessions cloud (le code du Projet n'y est pas accessible).

- `engine.py` : timeline (`say`, `hold`, `countdown`, `anim`), voix TTS Kokoro `ff_siwis`, SFX et musique balafon/djembé synthétisés, rendu ffconcat + loudnorm -16 LUFS. Sortie : variable `MOUNAS_OUT` (défaut `out/`).
- `draw.py` : palette, fond crème, Amara, Kofi, arbres des 4 saisons, Terre/Soleil, Noël, bricolage.
- `script_saisons.py` : épisode « Quand est-ce qu'il va neiger ? Les 4 saisons » (nov. 2026).

```bash
pip install --break-system-packages kokoro-onnx soundfile cairosvg scipy fonttools
# modèles Kokoro dans ~/kokoro, polices Fraunces/Nunito/Fredoka statiques dans ~/.fonts
python3 script_saisons.py           # génère voix + images, affiche la durée
python3 script_saisons.py --build   # rend out/saisons.mp4 + out/saisons_lignes.json
```
