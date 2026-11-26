# Africa Expo Abidjan : de « je veux une place » à « mon enfant lit »

Pour les familles qui paient par Mobile Money (ou en espèces au stand). Elles ne
passent pas par Stripe : leur accès s'ouvre depuis la table Airtable
**« Accès offerts »** (base « LES MOUNAS — App »).

Offre : **Famille Fondatrice d'Abidjan**, 30 000 FCFA pour un an, 20 places.

## À préparer avant le salon

- [ ] Le ou les numéros qui reçoivent l'argent (Wave, Orange Money, MTN MoMo, Moov Money) et le nom qui s'affiche à l'envoi. Les mettre à la place de `[NUMÉRO]` et `[NOM]` dans les messages ci-dessous.
- [ ] Qui confirme les paiements, et sur quel téléphone arrivent les SMS de réception.
- [ ] L'app Airtable installée sur le téléphone du stand, table « Accès offerts » ouverte.
- [ ] Les 4 messages ci-dessous enregistrés en « réponses rapides » dans WhatsApp Business.

## Les 5 étapes

### 1. La famille écrit sur WhatsApp
Le QR code et la page `/abidjan` ouvrent WhatsApp avec « MOUNAS ABIDJAN » déjà écrit.
Répondre avec le **message 1**.

### 2. Elle essaie la première leçon
Gratuite, sans compte : `https://www.lesmounas.school/commencer`. Au stand, la faire sur le téléphone du parent, avec l'enfant.

### 3. Elle paie
Envoyer le **message 2**. Demander en même temps son **adresse email** : c'est avec elle que la famille se connecte (le code d'entrée arrive par email). Pas d'email, pas de connexion : l'aider à en créer une au stand si besoin.

### 4. On confirme et on ouvre l'accès
Ne rien ouvrir sur une simple capture d'écran : attendre le **SMS ou la notification de réception** sur le téléphone qui encaisse, et vérifier le montant (30 000 FCFA).

Puis ajouter une ligne dans « Accès offerts » :

| Champ | Quoi mettre |
|---|---|
| Email | l'adresse de la famille, sans faute |
| Actif | coché |
| Nom | nom du parent |
| Offre | **Famille Fondatrice Abidjan** |
| Expire le | la date du paiement + 1 an (payé le 28 nov. 2026 → 2027-11-28) |
| Paiement | Wave, Orange Money, MTN MoMo, Moov Money ou Espèces |
| Référence paiement | montant, date et numéro de transaction |
| WhatsApp | son numéro, format +225… |
| Notes | prénom et âge de l'enfant, ce qu'on a promis |

Dès que la ligne existe :
- la famille peut se connecter ;
- la page `/abidjan` compte une place de moins (mise à jour en une minute environ) ;
- l'accès s'arrête tout seul après la date « Expire le ».

### 5. On accueille la famille
Envoyer le **message 3**. Rester avec elle jusqu'à ce qu'elle soit connectée : le premier code par email est le moment où l'on perd des familles.

## Si quelque chose coince

- **« Je n'ai pas reçu le code »** : regarder les indésirables, vérifier l'orthographe de l'email dans Airtable, redemander un code après une minute.
- **Paiement envoyé au mauvais numéro ou montant incomplet** : ne pas ouvrir l'accès, régler d'abord avec la famille.
- **Remboursement** (satisfait ou remboursé 30 jours) : renvoyer l'argent par le même moyen, décocher « Actif », noter la date dans Notes. La place redevient libre sur la page.
- **Les 20 places sont prises** : la page l'affiche toute seule et propose la liste d'attente. Envoyer le **message 4**.

## Les messages WhatsApp

**Message 1 : réponse à « MOUNAS ABIDJAN »**

```
Bonjour et bienvenue chez Les Mounas 🌱

Merci pour votre message ! Avant de réserver, faites essayer votre enfant : sa première leçon est gratuite, sans compte et sans rien télécharger.

👉 https://www.lesmounas.school/commencer

Dites-moi comment cela s'est passé, et je vous explique comment confirmer votre place de Famille Fondatrice (30 000 FCFA pour un an, 20 places seulement).
```

**Message 2 : le paiement**

```
Avec plaisir ! Pour confirmer votre place de Famille Fondatrice :

1. Envoyez 30 000 FCFA par Wave ou Orange Money au [NUMÉRO] (au nom de [NOM]).
2. Envoyez-moi ici la capture du paiement.
3. Donnez-moi l'adresse email avec laquelle vous vous connecterez.

Dès que le paiement est reçu, j'ouvre votre accès pour un an et je vous envoie votre lien.

🛡️ Satisfait ou remboursé 30 jours.
```

**Message 3 : l'accès est ouvert**

```
C'est confirmé, bienvenue parmi les Familles Fondatrices d'Abidjan 🎉

Votre accès est ouvert pour un an, jusqu'au [DATE].

Pour vous connecter :
1. Ouvrez https://www.lesmounas.school/connexion
2. Entrez votre adresse : [EMAIL]
3. Vous recevez un code à 6 chiffres par email (regardez aussi dans les indésirables)
4. Entrez le code, et c'est parti !

Pas de mot de passe à retenir : un nouveau code à chaque connexion.

10 minutes par jour suffisent. Écrivez-moi ici à la moindre question.
```

**Message 4 : liste d'attente**

```
Merci pour votre message 🌱

Les 20 places de Famille Fondatrice sont déjà prises. Je vous inscris sur la liste d'attente et je vous écris dès qu'une place se libère ou qu'une nouvelle offre ouvre.

En attendant, la première leçon reste gratuite : https://www.lesmounas.school/commencer
```

## Chaque soir du salon

- Comparer les réceptions Mobile Money du jour avec les lignes « Famille Fondatrice Abidjan » : même nombre, mêmes montants.
- Relancer les familles qui ont essayé la leçon sans payer.
- Vérifier que chaque famille inscrite s'est connectée au moins une fois (table « Familles »).

## Essai gratuit sans carte (formulaire `/mobile-money`)

Pour toutes les familles sans carte bancaire, partout (pas seulement au salon).
Le lien « 📱 Pas de carte bancaire ? » est sous chaque bouton « Essai gratuit »
(accueil, démo, abonnement, fin du questionnaire).

1. La famille remplit le formulaire : nom, email, WhatsApp, pays, âge de l'enfant, Wave / Orange Money / MTN MoMo.
2. Le site ajoute **tout seul** une ligne dans « Accès offerts » : Actif coché, Offre **Essai Mobile Money**, « Expire le » = 14 jours (aujourd'hui compris). L'accès est ouvert tout de suite.
3. La famille reçoit un email « comment se connecter ». Pam reçoit l'alerte « 📱 Nouvel essai Mobile Money » avec un lien WhatsApp déjà rédigé.
4. **Avant la date « Expire le »**, envoyer le message 2 (paiement) sur WhatsApp.
5. Paiement reçu (SMS vérifié) : dans la même ligne, repousser « Expire le » (1 mois, ou 1 an pour l'offre Famille Fondatrice — dans ce cas changer aussi « Offre »), remplir « Référence paiement ».
6. Pas de paiement : rien à faire, l'accès se ferme seul le lendemain de « Expire le ».

Un seul essai par email : si la ligne existe déjà, le formulaire renvoie vers WhatsApp.
