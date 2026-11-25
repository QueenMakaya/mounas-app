# Le tambour qui dessine

Prototype de clip musical « sensoriel » Les Mounas : chaque instrument a sa forme, et la forme bouge exactement sur le son.

```
python3 make.py sortie.mp4
```

Il faut Python (numpy, Pillow) et ffmpeg. Le script fabrique la batterie (105 BPM) et l'image à partir du même motif, puis affiche les contrôles de luminosité.

Règles de sécurité visuelle appliquées :
- les formes grossissent et rétrécissent, elles ne clignotent jamais ;
- une pulsation par temps au maximum ;
- couleurs adoucies sur fond sombre, pas de rouge saturé ni de blanc plein écran ;
- un seul plan continu, fin calme.

`tambour-qui-dessine.mp4` est le premier rendu (20 s, sons de synthèse provisoires).
