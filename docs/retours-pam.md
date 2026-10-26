# Retours de Pam sur l'app Les Mounas

Liste vivante des améliorations demandées. On coche quand c'est fait (avec la PR).

## 16 octobre 2026

- [x] **Écriture (la partie préférée !)** : proposer plusieurs options
  - [x] écrire en CAPITALES
  - [x] écrire en minuscules (cursive actuelle)
  - [x] feuille blanche (dessiner/écrire librement, sans modèle)
- [x] **Bug écriture** : la lettre « l » est coupée (le haut de la boucle sort du cadre).
- [x] **Lire les sons ensemble** : ajouter un *slider* sous les sons, comme dans Reading.com
  (l'enfant fait glisser le doigt sous le mot, chaque son s'allume et se lit au passage).
- [x] **Autonomie de l'enfant** : il doit pouvoir enchaîner les mots seul (mode enfant, branche feat/mode-enfant).
  - trop de texte pour l'instant ;
  - remplacer les consignes par des **symboles / pictos** (écouter, toucher, glisser, écrire, suivant) ;
  - le parent ne doit pas être obligé d'être là.
- [x] **Le flow** : Pam l'aime beaucoup, mais il paraît parfois répétitif → varier les étapes / l'ordre / les jeux
  (branche feat/jeux-mounaville : 1 ou 2 mini-jeux différents chaque jour, « Les mots qui reviennent » en échauffement, Mounaville sur la page des progrès).
- [x] **Étudier Reading.com** (reverse engineering des meilleures fonctionnalités) et implémenter les meilleures idées
  (étude : docs/plan-mode-enfant.md ; glisse-sons en deux temps : l'app dit les sons, puis l'enfant les dit seul).

## 26 octobre 2026

- [x] **Révision = une option, pas le début de la journée** : le parcours commence toujours par le mot mystère.
  « Revoir des mots d'avant » est proposé sous la première étape et à la fin (à côté d'« Un autre mot ? »).
  Les jours sans mot à revoir, l'option propose quelques mots déjà appris.
- [x] **Écriture** : l'écran s'ouvre toujours sur le mot en pointillés (Minuscules) ; le dernier choix n'est plus mémorisé.
- [x] **« 👀 Je lis / 👂 J'écoute »** : de nouveau sur le premier écran (à partir du niveau 2, comme avant).
- [ ] **Mini-jeux du jour / mise à jour du 19 octobre** : on ne touche à rien pour l'instant, Pam veut d'abord bien comprendre.
- [x] **Calcul façon Kumon** (/app/calcul) : additions, soustractions, puis tables une par une ; sans limite par jour.
  Le parent choisit le niveau du cahier ; l'app avance quand 18 des 20 derniers calculs sont justes du premier coup
  et faits sans trop chercher, revient au niveau d'avant si beaucoup d'erreurs, et refait passer les calculs ratés.

## 26 octobre 2026 (suite)

- [x] **Chaque rubrique a sa place, sans chercher** : une rangée d'icônes en haut de chaque écran de l'app
  (✨ Mot du jour · 📒 Dictée · 1+2 Calcul · 🧩 Missions · 📊 Progrès). Masquée pendant le mot lui-même
  (le mode enfant ne doit pas pouvoir partir ailleurs). Les cartes « Encore plus » de l'accueil restent.
- [x] **Suivi du calcul dans Airtable** (LES MOUNAS — App → Familles) : nouvelles colonnes « Niveau calcul »,
  « Calculs faits » et « Calcul · derniers jours ».
