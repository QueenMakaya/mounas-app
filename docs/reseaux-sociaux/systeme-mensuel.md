# Les Mounas — Système de contenu mensuel

Système qui planifie et produit chaque mois le contenu de Les Mounas pour
**Meta (Instagram + Facebook)**, **TikTok**, **YouTube** et **Skool**.
Deux routines Claude tournent automatiquement ; tu valides entre les deux.

```
 le 20 (7 h 47, Toronto)          du 20 au 25              le 26 (7 h 53, Toronto)
 ┌───────────────────────┐   ┌──────────────────────┐   ┌────────────────────────────┐
 │ 1. PLAN               │   │ 2. TA VALIDATION     │   │ 3. PRODUCTION              │
 │ ~85 lignes « Idea »   │──▶│ Idea → Draft = OK    │──▶│ visuels + vidéos           │
 │ dans Airtable         │   │ « Mes retours »      │   │ → Google Drive             │
 │ + e-mail récap        │   │ supprimer = refusé   │   │ → « Ready to Post »        │
 └───────────────────────┘   └──────────────────────┘   │ + e-mail récap             │
                                                        └────────────────────────────┘
```

## Où sont les choses

| Quoi | Où |
|---|---|
| Calendrier éditorial | Airtable · base **LES MOUNAS Homeschool Content Manager** (`app7O1jzwEVSeDgrS`) · table **Calendrier Réseaux** (`tbl0HTkMgVT6w9hIo`) |
| Mots du Jour (rotation hebdo) | même base · table **Mot du Jour** (`tblKjVt0SqVyr1QQU`) |
| Assets finaux | Google Drive · `04_LES_MOUNAS/Les Mounas – Réseaux sociaux/AAAA-MM/S<n> · <thème> (dates)/` (un dossier par thème hebdo : un même reel sert IG, TikTok et YouTube) |
| Récaps | e-mail à alfred.pam@gmail.com |

## Les statuts (colonne Status)

| Statut | Sens |
|---|---|
| **Idea** | Proposé par le run du 20. En attente de ta validation. |
| **Draft** | Validé par toi → sera produit le 26. |
| **Ready to Post** | Asset produit, dans Drive (`Lien Drive`) et en pièce jointe (`Images`). |
| **Programmed** | Programmé dans Meta Business Suite / TikTok / YouTube Studio / Skool. |
| **Posted** | Publié. |

Pour valider : filtre `Mois = AAAA-MM` et `Status = Idea`, puis passe en **Draft**
ce que tu gardes. Écris tes corrections dans **Mes retours** (le run de production
les applique). Supprime ou laisse en *Idea* ce que tu refuses.

## Cadence « intense » (~85 pièces / mois)

| Plateforme (champ `Platform Social Media`) | Volume / mois | Formats |
|---|---|---|
| **Instagram** = Meta (publié sur IG **et** FB) | 30 (1/jour) | 12 Reels · 10 Carrousels · 8 Posts image (+ Stories du Mot du Jour) |
| **TikTok** | 30 (1/jour) | 12 Reels déclinés en 9:16 natif · 18 vidéos TikTok natives (Mot du Jour, tendances, coulisses) |
| **YouTube** | 9 | 8 Shorts (2/semaine) · 1 vidéo longue (fable / épisode) |
| **Skool** | 14 | 12 discussions/activités (3/semaine) · 1 Défi du mois · 1 annonce de lancement du mois |

Les lignes **Mot du Jour** déjà créées pour le mois (WhatsApp, Skool, IG, TikTok)
comptent dans ces volumes : le run du 20 les détecte et complète autour, sans doublon.

### Équilibre des piliers (champ `Pilier`)

| Pilier | Part |
|---|---|
| Éducation 0-5 ans | 25 % |
| Mot du Jour | 20 % |
| Culture afro & langues | 15 % |
| Fables & histoires | 15 % |
| Vie de famille & routines | 10 % |
| Communauté & témoignages | 5 % |
| Promo (Skool, app, offres) | 10 % max (règle 90/10 : on donne avant de vendre) |

### Structure du mois

- **4 thèmes hebdo** (un par semaine), choisis selon les dates du mois
  (rentrée, fêtes, Mois de l'histoire des Noirs en février, etc.).
  Chaque thème = une campagne `mounas-campagne-thematique` : carrousel + post image +
  reel IG + vidéo TikTok + Short YouTube + discussion Skool.
- **Mot du Jour** quotidien selon la rotation de la table *Mot du Jour*
  (lun Nature · mar Famille · mer Cuisine afro · jeu Émotions · ven Musique · sam Couleurs · dim Corps).
- **1 fable longue YouTube** par mois, découpée ensuite en Shorts/Reels.
- **1 Défi Skool** du mois, relayé en Reel + TikTok le jour du lancement.

### Horaires de publication suggérés (heure de Toronto)

| Plateforme | Créneau |
|---|---|
| Meta | 19 h 30 (après le souper, quand les parents scrollent) |
| TikTok | 20 h 00 |
| YouTube Shorts | mar & ven 17 h 00 · vidéo longue : samedi 9 h 00 |
| Skool | lun/mer/ven 8 h 00 |

## Règles de création

- **Français d'abord**, ancrage afro, ton chaleureux de « grande sœur éducatrice » ; jamais culpabilisant.
- Toujours charger la marque Les Mounas (Mounaville) avant de créer — passer par les skills, pas à la main :
  - planification : `content-calendar`
  - campagne d'un thème : `mounas-campagne-thematique`
  - carte quotidienne : `mounas-mot-du-jour`
  - visuels isolés : `brand-post-visuals` (Canva)
  - vidéo narrée / fable : `brand-video-builder` ; carte promo animée : `brand-promo-reel`
- Formats : Reel/TikTok/Short **1080×1920** · Carrousel/Post **1080×1350** · YouTube long **1920×1080**.
- Chaque ligne Airtable = 1 asset × 1 plateforme. `Body` = la caption native complète
  (hook, corps, CTA, hashtags adaptés à la plateforme).
- Titre de ligne : `<Thème ou mot> · <angle> — <Plateforme>` (ex. `Cauri · Compter au marché — TikTok`).

## Limites connues

- **Vidéos longues YouTube** : le run produit le pack complet (script, storyboard, visuels de scènes,
  sous-titres .srt, plan de montage). Le rendu MP4 final se fait dans CapCut/Canva.
- **Facebook** n'est pas une option du champ Plateforme : une ligne *Instagram* = publication IG + FB.
- La **publication** elle-même (Meta Business Suite, TikTok, YouTube Studio, Skool) reste manuelle
  ou passe par ton outil de programmation ; le système livre des assets prêts à programmer.
- Les runs ont besoin des connecteurs **Airtable, Canva, Google Drive et Gmail**. Les routines créées
  depuis une session n'en ont aucun : les ajouter dans l'écran Routines de claude.ai.
- **Upload Drive** : le connecteur Google Drive exige le contenu du fichier dans l'appel, ce qui ne
  marche pas pour les PNG/MP4. Les dossiers et docs texte se créent bien ; les médias sont livrés
  dans la conversation (session interactive) ou sur une branche `contenu/AAAA-MM` du dépôt, à glisser dans Drive.
- Les lignes « À FILMER PAR TOI » (face caméra, POV) sont tournées par toi : le script est dans `Body`.
