# Le format interactif des vidéos Les Mounas

Validé par Pam sur « Un, deux, trois : les trois sons » (novembre 2026). À reprendre pour chaque nouvelle vidéo éducative.

## Ordre

1. Page titre (logo, titre de la leçon, Amara, confettis).
2. Accroche pour l'enfant : Amara dit bonjour et lance la notion tout de suite, puis annonce le bricolage de la fin.
3. Mot aux parents (le matériel), seulement après l'accroche.
4. Ancrage à Mounaville, notion en petites étapes, jeu du corps, quiz, défi sensoriel, atelier, on joue, récap, au revoir.

## À l'écran

- Amara vit : elle cligne des yeux, bouge légèrement, sa bouche suit la voix (`amara()` le fait tout seul).
- Chaque mot entre quand la voix le dit : `at(secondes, élément)`, calé sur les pauses de l'enregistrement.
- Les éléments nouveaux d'un écran entrent l'un après l'autre (automatique avec `svg(...)`).
- Après chaque « Répète avec moi » : pastille « À toi ! » et minuteur, deux à trois secondes de silence.
- Comptes à rebours du quiz avec minuteur ; jamais dit à voix haute et affiché en même temps.
- Sauts fluides dans le jeu du corps (`[[HOP]]`), confettis qui tombent pour les bravos.
- Barre d'avancement en bas de l'écran.
- Animations courtes et utiles : on montre le mot ou le son, on n'agite pas l'écran.

## Au son

- Bruitages à notes claires uniquement (balafon, cloche, pop). Aucun bruitage fait de souffle.
- Musique entraînante qui baisse sous la voix (`MUSIC_FILE` pour un morceau fourni).
- Voix de Pam : réparer la saturation, couper le grave sous 100 Hz, retirer le bruit de la pièce prélevé dans les silences, égaliser le volume réplique par réplique. Ne pas compresser avec un gros gain.
- Retirer les consignes lues à voix haute, les faux départs et les mots en double.

## Avec chaque vidéo

- Une fiche Skool de trois pages : la leçon pour le parent, les exercices pour l'enfant, le matériel de l'atelier à découper.
- Le texte à enregistrer, numéroté, avec la phrase du titre en premier.
- Le pack promo : miniature, Reel 9:16, carrousel de neuf images en JPG.
