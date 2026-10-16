# Plan : mode enfant autonome (inspiré de Reading.com et des apps où l'enfant joue seul)

## Ce qu'on retient de l'étude

- **Reading.com** est pensé pour l'adulte et l'enfant ensemble : leçons scriptées pour le parent. Sa meilleure idée est le **curseur sous le mot** (« sound sliders ») :
  - barre longue pour les sons qu'on peut tenir (m, s, ch…) ;
  - point court pour les sons qui claquent (p, t…) ;
  - l'enfant prononce les sons pendant que son doigt glisse, de plus en plus vite, jusqu'au mot entier.
- Pour **l'autonomie**, les modèles sont Khan Academy Kids, Teach Your Monster to Read et Endless Reader :
  - consignes dites à voix haute et icônes au lieu du texte ;
  - un personnage qui guide l'enfant ;
  - jamais d'échec, pas de chrono ;
  - les erreurs font revenir les sons ratés plus souvent ;
  - des mini-jeux variés et une carte ou un monde à faire grandir.

## Plan proposé (par priorité)

1. **Mode enfant (L)** : bouton ▶ « C'est parti » sur l'accueil.
   - Masque les longs textes, les astuces parent et le lien Accueil.
   - Les étapes facultatives (On en parle, Chanson) restent côté parent.
2. **Icônes de consigne et consignes dites à voix haute (M)** :
   - Pictos SVG : écouter, toucher, glisser, écrire, dire, taper des mains, suivant, rejouer.
   - La voix dit la consigne à l'ouverture de chaque étape, puis la répète si l'enfant ne fait rien pendant 8 s.
3. **Glisse-sons (M)** : en cours sur la branche feat/ecriture-lecture.
   - Au premier passage, le son est joué.
   - Au deuxième passage, on coupe le son et l'enfant le dit lui-même.
   - À la fin, le mot entier.
4. **Passage automatique à l'étape suivante (S)** : quand l'étape est réussie, carillon, puis une félicitation sur l'effort, puis l'étape suivante.
   - L'écriture fait exception : l'enfant touche ✓ quand il a fini.
5. **Mini-jeux qui changent chaque jour (L)** : chaque jour, 3 ou 4 jeux tirés au sort.
   - « Trouve l'image »
   - « La pêche aux sons »
   - « Le mot qui manque »
   - « Nourris le Mounas »
6. **Révision espacée (M)** : 1 minute « Les mots qui reviennent » en début de parcours, avec des mots déjà vus à J+1, J+3, J+7 et J+14.
7. **Enchaîner les mots (M)** : « Un autre mot ? » à la fin, jusqu'à un maximum par jour fixé par le parent (3 par défaut).
8. **Mounaville à construire (M)** : chaque mot appris ajoute une case, un baobab, un étal ou un tambour au village. Aucun score.
9. **Erreur sans échec et main qui montre le geste (S)** :
   - Une tuile tremble quand l'enfant se trompe, et la voix dit « Écoute encore ».
   - Après 2 essais, une main animée montre la bonne réponse.
10. **Espace parent séparé et verrou parent (M)** :
    - Pour sortir, appui long de 3 s, puis « touche le nombre sept ».
    - Le parent y règle le nombre de mots par jour et voit ce que l'enfant a fait seul.

Plus tard : enregistrer la voix de Pam pour une vingtaine de consignes. Elle serait plus chaleureuse et plus fiable que la voix du navigateur.

## Sources principales
- https://reading-com.helpscoutdocs.com/article/302-sound-sliders
- https://apps.apple.com/us/app/learn-to-read-reading-com/id1534938305
- https://learn.khanacademy.org/khan-academy-kids/
- https://www.teachyourmonster.org/tymtr-mini-games
- https://hbook.com/story/endless-reader-app-review
- https://kb.readingeggs.com/en_US/4-begin-with-the-lessons

## Décisions de Pam (16 octobre 2026)

1. **Mode enfant** : oui, avec un gros bouton ▶ « C'est parti ». **Mais les textes et les astuces pour le parent restent visibles** : on continue de guider les parents.
2. **Pictos et consigne dite à voix haute** à l'ouverture de chaque étape : oui. **La voix ne se répète pas** quand l'enfant ne fait rien.
3. **Glisse-sons** : au premier passage, l'app dit chaque son. Aux passages suivants, l'enfant le dit lui-même (son coupé).
4. **Pas de passage automatique** : une **flèche « suivant » bien visible** (elle s'anime quand l'étape est réussie), mais c'est l'enfant qui touche.
5. **Mini-jeux qui changent chaque jour** : oui (« Trouve l'image », « La pêche aux sons », « Le mot qui manque », « Nourris le Mounas »).
6. **Les mots qui reviennent** (révision espacée) : oui.
7. **« Un autre mot ? »**, jusqu'à 3 mots par jour par défaut (réglable par le parent) : oui.
8. **Mounaville à construire** (case, baobab, tambour… aucun score) : oui.
9. **Erreur sans échec** (la tuile tremble, « Écoute encore », une main montre le geste après 2 essais) : oui.
10. **Espace parent protégé** (appui long, puis « touche le nombre sept ») et réglage du nombre de mots par jour : oui.
