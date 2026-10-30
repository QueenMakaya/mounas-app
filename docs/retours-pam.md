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

## 26 octobre 2026 (retours sur le lien de test)

- [x] **« 👀 Je lis / 👂 J'écoute »** : le choix était caché au niveau 1 depuis le 9 octobre ; il est maintenant proposé à tous les niveaux.
- [x] **Calcul en « Mélange » par défaut** : séries de 10 calculs comme une page Kumon, surtout le niveau de l'enfant
  avec environ un calcul sur trois déjà vu (même opération d'abord). Le parent peut choisir « Seulement son niveau » et le niveau.
- [x] **Nouveau design du calcul** : fini le pavé de calculatrice. Le calcul en très gros, la réponse sur une ligne en pointillés,
  des jetons ronds 1 à 0, vérification dès que la réponse a le bon nombre de chiffres, puis calcul suivant.
  Brouillon à côté (sous le calcul sur téléphone) pour faire des ronds, des bâtons…

## 26 octobre 2026 (syllabes, Trouve le mot, Ma phrase)

- [x] **Syllabes** : le nombre de syllabes reste un « ? » ; il n'apparaît qu'une fois toutes les syllabes tapées.
- [x] **« Trouve le mot » remplace « Le mot qui manque »** dans les mini-jeux du jour. L'app dit le mot, l'enfant le touche
  parmi des mots qui lui ressemblent, avec des pièges : lettres miroir (b/d, p/q, m/n, n/u, f/t, a/o, i/l), deux lettres
  inversées (lapin → lpain), une lettre en plus ou en moins (lapins), un vrai mot proche (sapin).
  Niveau 1 : 3 mots et le modèle affiché ; niveau 2 : 4 ; niveau 3 : 5 ; niveau 4 : 6, à l'oreille seulement.
  Base pédagogique : identification rapide des mots du CP (exercices « comparer des suites de lettres »), confusions
  visuelles classiques du lecteur débutant, « orthographic mapping » (L. Ehri) : regarder chaque lettre dans l'ordre.
  Airtable : nouvelle colonne « Mots pièges » (Activités App), facultative ; vide = l'app fabrique les pièges.
  Le code de « Le mot qui manque » est gardé, il peut revenir.
- [x] **« Chanson » devient « Ma phrase et ma poésie »** (pour tous les mots) : l'enfant invente sa phrase avec le mot,
  le parent l'écrit (gardée sur l'appareil), l'enfant la dit en chanson ou en récitant. La poésie du mot (champ
  « Song lyrics ») se lit, se chante, se récite ; dès le niveau 3, « Par cœur » cache les mots petit à petit.

## 26 octobre 2026 (calcul sans défiler)

- [x] **Plus besoin de défiler pendant une série** : la série prend tout l'écran et le calcul s'ajuste à la place
  disponible (en ligne ou en colonnes, avec les jetons, le clavier ou le brouillon ouvert). Vérifié sur iPhone SE,
  iPhone récent, iPad portrait et paysage.
- [x] **Répondre avec les jetons ou le clavier** : bouton 🔢 Jetons / ⌨️ Clavier en haut. Le clavier ouvre le pavé
  chiffré du téléphone ou de la tablette (un clavier physique marchait déjà). Le choix est retenu sur l'appareil.

## 27 octobre 2026

- [x] **Syllabes en trois temps** : l'enfant écrit d'abord combien de syllabes il entend (case « ? », jetons 1 à 6
  ou clavier), puis on vérifie en tapant dans les mains, puis le nombre est dévoilé à côté de sa réponse.
- [x] **Bug « c » de arc-en-ciel** : dans le « Rappel des sons » et la pêche, l'app surlignait le premier « c »
  du mot (celui d'*arc*, qui fait « k ») au lieu de celui de *ciel*. Elle surligne maintenant le son là où on l'entend.
- [x] **Mots en double** : ARC-EN-CIEL existe deux fois dans Airtable (rec1XDVKJyFDIDGdj, Couleurs, sans comptine,
  et reccCMFTkAkkrDUuG, Nature, avec comptine). L'app n'affiche plus qu'une fois chaque mot dans les jeux et rappels.
  La fiche en trop reste dans Airtable : à Pam de choisir laquelle garder.
- [x] **« Le dire » (dire le mot 3 fois) retiré**, à la demande de Pam.
- [x] **« Ma phrase et ma comptine »** : la phrase de l'enfant et la comptine sur le même écran ; on fait sa phrase
  et on récite (ou chante) la comptine ; « Par cœur » dès le niveau 3. Les mots sans comptine dans Airtable
  (28 sur 183, dont CERVEAU) proposent « Dis ta phrase » à la place.

## 30 octobre 2026

- [x] **Le son « œu »** (sœur, cœur, œuf, bœuf) : c'est maintenant une carte-son à part. SŒUR se lit s | œu | r
  (avant : s | o | eu | r quand le mot est écrit « soeur »), et le « Rappel des sons » propose CŒUR avant les autres
  mots en « eu ». Pour l'instant l'app joue l'enregistrement du son « eu » ; un `sons/oeu.mp3` pourra le remplacer.
  À vérifier dans Airtable : si la colonne « Graphèmes » de SŒUR contient `s|o|eu|r`, la changer en `s|oeu|r`.
- [x] **Mission « Plus difficile »** : la réponse n'est plus écrite ni lue dans la consigne. L'app sépare la question
  de la réponse (texte après le dernier « ? », ou après « Réponse : ») et l'enfant répond comme dans la mission :
  « ? » avec les chiffres, ou les choix, ou le parent vérifie. Le défi s'ouvre une fois la mission trouvée.
- [x] **Effacer = une gomme** : dessin de gomme sur la touche d'effacement des missions, du calcul et de la dictée.
- [x] **Indices du mot mystère** : plus d'indice « nombre de syllabes », puisque c'est demandé ensuite à l'enfant.
- [x] **Missions à choix** (ex. le cadeau caché dans une boîte) : « Écouter la mission » lit aussi les réponses
  possibles, et chaque réponse a son 🔈, pour que l'enfant seul puisse choisir sans savoir lire.
- [x] **Fin de mission** : boutons « Mission suivante → » et « 🧩 Toutes les missions » sous la mission.
