# Voix de Pam : ce qu'il reste à enregistrer

**État au 11 nov. 2026** : tout est enregistré, découpé dans `public/voix/` et branché dans
`src/lib/voice-clips.ts` et `src/lib/voice-clips-words.ts` : consignes, petites phrases, bravos,
calcul (0 à 100), les 37 sons (réenregistrés le 2 nov.), les 182 mots d'Airtable et les 219 syllabes.
**Au 11 nov. 2026, il reste (par priorité) :**

## F. La lettre Y (vidéo prévue jeudi 16 h + leçon de l'app)

Script complet : `docs/script-video-lettre-y.md` (branche `claude/loving-mayer-li2v85`).
Fichier A : les 40 répliques de la vidéo. Fichier B, pour l'app, un mot à la fois :

stylo · cygne · yaourt · yoga · crayon · noyau · voyage · yoyo · goyave · Bravo !

## G. Les échecs de Mounaville (18 phrases)

1. Voici le Roi !
2. Voici la Reine !
3. Voici le Rhinocéros !
4. Voici l'Éléphant !
5. Voici la Gazelle !
6. Voici le Mouna !
7. Parfait ! Trois étoiles !
8. Bravo, toutes les mangues sont ramassées !
9. Le Soleil a gagné la course !
10. La Lune a gagné la course !
11. Échec ! Attention au Roi !
12. Échec… mais le Roi peut encore s'échapper. Essaie autre chose !
13. Pas encore. Essaie un autre coup !
14. Échec et mat ! Bravo, tu as attrapé le Roi !
15. Échec et mat ! Le Soleil a gagné !
16. Échec et mat ! La Lune a gagné !
17. Match nul ! Personne ne gagne.
18. Le Mouna est arrivé au bout : il devient une Reine !

## H. Les 37 nouveaux mots d'Airtable (statut « À produire »)

Dans cet ordre (thème puis alphabet) :

- Animaux : abeille
- Corps : bras · dent · doigt · jambe · langue · voix
- Couleurs : argenté · couleur · doré · gris · indigo · marron
- Cuisine Afro : cacao
- Émotions : amour · déçu · espoir · gentil · inquiet · rire
- Famille : enfant · ensemble
- Maison : maison
- Musique : chanson · chorale · guitare · rythme · trompette
- Nature : montagne · neige · vent
- Nourriture : haricot · maïs · soupe
- Quotidien : fête · merci · village

Puis leurs 29 syllabes qui n'ont pas encore ta voix (le champ « Syllables » est encore vide dans
Airtable ; découpage proposé : a-beil-le, en-sem-ble, trom-pet-te…) :

beil · ci · cot · dé · es · fant · fê · gen · gui · ha · in · jam · leur · mai · mon · mour · nei ·
pet · poir · quiet · ron · ryth · sem · til · trom · té · vil · çu · ïs

Les mots ajoutés plus tard dans Airtable : enregistrer le mot et ses syllabes de la même façon,
ou laisser le clone de voix s'en charger.

---

Parties A à D (faites) :

Ces phrases sont dites par l'app, mais pour l'instant avec la voix du navigateur.

Comment enregistrer :
- un fichier par partie (A, B, C, D) ;
- environ 2 s de silence entre deux répliques ;
- ne pas dire les numéros ;
- même pièce et même micro pour tout ;
- si une réplique est ratée, la redire juste après : c'est la dernière prise qui compte.

Déjà enregistré le 13 oct. (Drive), à ne pas refaire : les sons (`Mounas son app.m4a`),
les mots (`Mots les mounas app.m4a`), les syllabes (`Syllabes les mounas app.m4a`).

## A. Consignes (au début de chaque étape)

1. Touche les cartes, puis lis le mot tout seul.
2. Écoute bien le mot, puis écris-le avec les sons.
3. Tape dans tes mains à chaque syllabe.
4. Glisse ton doigt sous le mot.
5. Dis le mot trois fois.
6. On en parle ensemble.
7. Invente ta phrase avec le mot, puis dis-la !
8. Touche les sons dans le bon ordre.
9. Écris le mot avec ton doigt.
10. Écoute bien la mission.
11. Écoute le mot, puis touche la bonne image.
12. Pêche les mots qui ont ce son.
13. Trouve le mot qui manque dans la phrase.
14. Écoute le mot, puis touche-le. Attention aux pièges !
15. Donne les sons au Mounas, dans le bon ordre.
16. Lis ces mots, puis écoute-les pour vérifier.

## B. Petites phrases qui reviennent

17. Écoute encore.
18. À toi de dire les sons !
19. Un autre mot ?
20. Tu as bien travaillé aujourd'hui, à demain !
21. Presque ! Essaie encore.
22. Bravo, tu passes au niveau suivant !

## C. Bravos

23. Bel effort !
24. Tu as bien écouté !
25. Tu as pris ton temps, bravo !
26. Tu as bien cherché !
27. Tu as essayé jusqu'au bout, bravo !
28. Bravo, tu as bien cherché !
29. Tu as pris le temps de réfléchir, et tu as trouvé !
30. Super, tu as essayé, tu as cherché, et tu as trouvé !
31. Quel beau travail de recherche !
32. Tu as utilisé un indice, c'est une très bonne façon de chercher. Bravo !
33. Tu n'as pas abandonné, et tu as trouvé. Bravo pour ta patience !

## D. Calcul (pour que l'app lise « 7 plus 5 » avec ta voix)

34. plus
35. moins
36. fois

Puis les nombres, un par un, de **zéro à quatre-vingt-dix-neuf** (0, 1, 2 … 99).
Les calculs vont jusqu'à 99. Si c'est trop long d'un coup, commence par 0 à 20 :
ça couvre presque tous les calculs des petits niveaux.

## Ce qui ne sera pas enregistré à la main

Les nouveaux mots ajoutés dans Airtable, les phrases d'exemple, les poésies et les missions
changent tout le temps. Ils seront dits par le clone de ta voix (voir la discussion sur ElevenLabs),
avec la voix du navigateur en secours tant que le fichier n'existe pas.
