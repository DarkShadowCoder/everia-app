# EVERIA — SPÉCIFICATION PRODUIT COMPLÈTE

**Version : 1.0 — Document de référence produit, fonctionnel et opérationnel**

---

## 1. Vision générale

Everia est une application mobile de **mémoire événementielle collaborative, interactive et personnalisée**.

L'idée centrale est qu'un événement est vécu collectivement, mais que chaque personne en possède une expérience différente. Everia rassemble les photos, vidéos, interactions et contributions de tous les participants pour construire une mémoire collective, puis utilise ces données pour générer une expérience personnelle pour chaque participant.

### Promesse

> **One Event. Many Perspectives. One Everia.**

Autre formulation :

> **Everia transforme les souvenirs dispersés de plusieurs personnes en une mémoire collective, puis transforme cette mémoire collective en une expérience personnelle pour chaque participant.**

Everia ne doit donc pas être positionnée comme un simple espace de stockage ou une simple galerie photo.

---

## 2. Problème utilisateur

Lors d'un événement, les souvenirs sont dispersés :

- les photos des invités restent dans leurs téléphones ;
- les vidéos restent dans différentes galeries ;
- les photos professionnelles appartiennent au photographe ;
- les meilleures scènes sont réparties entre plusieurs personnes ;
- WhatsApp et les réseaux sociaux compressent ou dispersent le contenu ;
- après l'événement, retrouver les souvenirs devient difficile ;
- aucune personne ne possède nécessairement toute l'histoire de l'événement.

Everia crée un espace commun autour de l'événement et permet à chaque participant d'apporter sa propre perspective.

---

## 3. Positionnement

Everia est à l'intersection de :

- photo sharing ;
- albums collaboratifs ;
- événementiel ;
- réseau social privé ;
- gamification ;
- intelligence artificielle appliquée aux souvenirs ;
- storytelling ;
- archivage de souvenirs.

Le produit doit cependant être présenté comme :

> **La plateforme de mémoire des moments partagés.**

Un album partagé organise des fichiers. Everia cherche à organiser des **moments vécus**.

---

# 4. Concept fondamental : un événement, plusieurs expériences

Le même événement est partagé par tous, mais l'expérience affichée à chaque personne peut évoluer selon :

- les photos qu'elle prend ;
- les vidéos qu'elle capture ;
- les personnes qu'elle photographie ;
- les personnes avec lesquelles elle apparaît ;
- les moments auxquels elle contribue ;
- les défis qu'elle accomplit ;
- ses interactions ;
- ses préférences comportementales pendant l'événement.

### Modèle

```text
                         EVENT
                           │
          ┌────────────────┼────────────────┐
          │                │                │
        Alice             Yvan             Paul
          │                │                │
   Experience A      Experience B      Experience C
          │                │                │
   ses médias       ses médias       ses médias
   ses moments      ses moments      ses moments
   ses défis        ses défis        ses défis
   ses personnes    ses personnes    ses personnes
          │                │                │
          └────────────────┼────────────────┘
                           │
                    MEMORY COLLECTIVE
```

### Principe

> **Everia ne montre pas seulement l'événement. Everia montre l'expérience de chaque personne dans l'événement.**

---

# 5. Acteurs du système

## 5.1 Utilisateur authentifié

Utilisateur disposant d'un compte Everia.

Fonctions :

- créer des événements ;
- rejoindre des événements ;
- gérer son profil ;
- contribuer à des événements ;
- relever des défis ;
- consulter ses souvenirs ;
- recevoir des notifications ;
- acheter des offres ;
- consulter ses expériences passées.

## 5.2 Organisateur

Créateur et administrateur d'un événement.

Fonctions :

- créer l'événement ;
- le personnaliser ;
- inviter ;
- configurer l'accès ;
- gérer les participants ;
- créer des défis ;
- gérer les albums ;
- modérer ;
- gérer Live Wall ;
- suivre les statistiques ;
- générer/consulter Best Of et Replay ;
- gérer la conservation et les exports.

## 5.3 Participant

Utilisateur ou invité qui participe à l'événement.

Fonctions :

- accéder ;
- prendre/importer des photos ;
- enregistrer des vidéos ;
- consulter ;
- réagir ;
- commenter ;
- participer au guestbook ;
- accomplir des défis ;
- consulter son expérience personnalisée.

## 5.4 Invité sans compte

Participant entrant via QR code, lien ou code événement.

Objectif principal : **zéro friction**.

Il doit pouvoir :

- rejoindre ;
- prendre une photo ;
- l'envoyer ;
- participer aux défis compatibles ;
- consulter la galerie autorisée ;
- interagir selon les permissions.

La création de compte est facultative dans les scénarios où elle n'est pas nécessaire.

## 5.5 Photographe / vidéaste

Profil professionnel destiné aux événements.

Peut disposer à terme de :

- upload professionnel ;
- galerie client ;
- livraison ;
- watermark ;
- vente de photos ;
- statut professionnel ;
- gestion multi-événements.

## 5.6 Agence / Wedding Planner / Entreprise

Utilise Everia pour plusieurs événements.

Besoins :

- multi-événements ;
- équipe ;
- branding ;
- statistiques ;
- white-label ;
- exports ;
- gestion des accès.

## 5.7 Administrateur Everia

Rôle plateforme.

Fonctions :

- modération globale ;
- support ;
- sécurité ;
- gestion de comptes ;
- gestion des plans ;
- conformité ;
- surveillance système ;
- audit.

---

# 6. Types d'événements

Everia doit rester générique :

- mariage ;
- anniversaire ;
- baptême ;
- fête familiale ;
- remise de diplôme ;
- voyage ;
- réunion ;
- conférence ;
- séminaire ;
- team building ;
- festival ;
- concert ;
- compétition ;
- lancement de produit ;
- événement associatif ;
- événement communautaire ;
- événement commémoratif.

---

# 7. Cycle de vie d'un événement

```text
DRAFT
  ↓
ACTIVE
  ↓
LIVE
  ↓
CLOSING
  ↓
COMPLETED
  ↓
ARCHIVED
```

## DRAFT

L'événement existe mais n'est pas encore ouvert.

## ACTIVE

L'événement est préparé et accessible selon ses paramètres.

## LIVE

L'événement se déroule et les contributions circulent en temps réel.

## CLOSING

L'événement est terminé mais la collecte peut rester ouverte pendant un délai.

## COMPLETED

La collecte est terminée ; les traitements de fin sont exécutés.

## ARCHIVED

Le contenu final est conservé comme souvenir.

---

# 8. Création d'un événement

Le parcours organisateur est :

```text
Créer un événement
      ↓
Nom
      ↓
Type
      ↓
Date / heure
      ↓
Lieu
      ↓
Description
      ↓
Couverture
      ↓
Confidentialité
      ↓
Options
      ↓
Créer
      ↓
Event Dashboard
```

Données importantes :

- event_id ;
- owner_id ;
- nom ;
- catégorie ;
- slug ;
- event_code ;
- cover ;
- dates ;
- lieu ;
- visibilité ;
- règles d'accès ;
- paramètres d'upload ;
- règles de modération ;
- options de défis ;
- options Live ;
- options Replay.

---

# 9. Accès à un événement

Trois modes principaux :

1. invitation ;
2. QR code ;
3. lien/code événement.

### Flux connecté

```text
QR / Link / Code
       ↓
Résolution Event
       ↓
Validation accès
       ↓
Supabase Auth
       ↓
Event Membership
       ↓
Event Home
```

### Flux invité

```text
QR / Link
    ↓
Guest Access
    ↓
Validation événement
    ↓
Guest Session
    ↓
Event Home
```

---

# 10. Accès invité sans compte

L'invité possède une session temporaire.

Le système conserve :

- guest_id ;
- event_id ;
- token_hash ;
- expiration ;
- dernière activité ;
- informations techniques minimales anti-abus.

Le token réel ne doit pas être stocké en clair dans la base.

L'invité ne reçoit pas de privilèges généraux `anon` sur PostgreSQL.

Les opérations sensibles passent par des fonctions serveur / Edge Functions spécifiques.

---

# 11. Invitations

L'organisateur peut inviter par :

- lien ;
- QR code ;
- code événement ;
- partage natif mobile ;
- email ;
- SMS selon l'intégration activée.

Une invitation peut contenir :

- event_id ;
- inviter ;
- destinataire ;
- rôle ;
- token ;
- statut ;
- expiration.

---

# 12. RSVP

Les événements configurés en mode RSVP proposent :

- Oui ;
- Non ;
- Peut-être.

Informations optionnelles :

- nombre de participants ;
- accompagnants ;
- note ;
- préférences.

---

# 13. Rôles dans l'événement

Les rôles recommandés :

```text
OWNER
ADMIN
MODERATOR
PHOTOGRAPHER
PARTICIPANT
GUEST
```

Chaque rôle possède des droits différents.

---

# 14. Permissions

Le système vérifie toujours :

```text
USER
 +
EVENT
 +
ROLE
 +
RESOURCE
 +
ACTION
```

Exemple :

```text
User X
Event Y
Role PARTICIPANT
Resource Media Z
Action DELETE
```

Résultat : autorisé uniquement si la règle le permet.

---

# 15. Capture de souvenirs

Un souvenir peut être créé depuis :

- caméra ;
- galerie ;
- sélection multiple ;
- enregistrement vidéo ;
- contenu lié à un défi.

Parcours idéal :

```text
CAMERA
  ↓
TAKE PHOTO
  ↓
PREVIEW
  ↓
SEND
  ↓
UPLOADING
  ↓
READY
```

---

# 16. Upload en masse

L'utilisateur peut sélectionner plusieurs fichiers.

Le système utilise :

- queue locale ;
- progression individuelle ;
- retry ;
- reprise ;
- contrôle de concurrence ;
- adaptation réseau ;
- traitement asynchrone.

Une mauvaise connexion ne doit pas faire perdre la contribution.

---

# 17. Pipeline média

```text
Mobile
  ↓
Validation fichier
  ↓
Upload sécurisé
  ↓
Storage
  ↓
Media Record
  ↓
Processing Job
  ↓
Thumbnail / Display / Original
  ↓
Metadata extraction
  ↓
Moderation
  ↓
AI Analysis
  ↓
READY
  ↓
PUBLISHED
```

---

# 18. États d'un média

```text
PENDING
UPLOADING
UPLOADED
PROCESSING
READY
PUBLISHED
HIDDEN
DELETED
FAILED
```

Le système doit permettre le retry des opérations récupérables.

---

# 19. Storage

Buckets recommandés :

```text
avatars
 event-media
 event-covers
 replays
 exports
```

Les originaux et dérivés doivent être séparés logiquement.

Exemple :

```text
event-media/
  {event_id}/
    originals/
    display/
    thumbnails/
```

Les événements privés utilisent des accès temporaires signés plutôt que des URLs publiques permanentes.

---

# 20. Galerie

La galerie événementielle propose au minimum :

- grille ;
- affichage photo plein écran ;
- vidéo ;
- pagination ;
- filtres ;
- tri ;
- favoris ;
- commentaires ;
- réactions.

Elle doit être conçue pour plusieurs milliers de médias : pas de chargement intégral au démarrage.

---

# 21. Albums

Albums manuels :

- cérémonie ;
- famille ;
- amis ;
- soirée ;
- coulisses.

Albums intelligents :

- par période ;
- par type ;
- par personne ;
- par moment ;
- par catégorie.

---

# 22. Moments — fonctionnalité clé

Un **Moment** est un regroupement de plusieurs médias autour d'un même instant ou d'une même scène.

Exemple :

```text
Moment: First Dance
  ├── Photo A
  ├── Photo B
  ├── Photo C
  └── Video D
```

Les groupes peuvent être construits à partir de :

- timestamp ;
- proximité temporelle ;
- similarité visuelle ;
- lieu ;
- personnes ;
- contexte ;
- analyse IA.

---

# 23. Plusieurs perspectives d'un moment

Everia peut présenter :

> **12 perspectives of the same moment.**

Ainsi, une scène n'est plus liée à une seule photo.

Le système passe de :

```text
PHOTO
```

à :

```text
MOMENT
  ↓
MULTIPLE PERSPECTIVES
```

C'est un des éléments différenciateurs du produit.

---

# 24. Timeline

Les Moments sont ordonnés dans le temps.

Exemple :

```text
14:00 Arrival
15:30 Ceremony
17:00 Cocktail
19:00 Dinner
20:30 First Dance
21:00 Cake
23:00 Party
```

La timeline constitue une première forme de storytelling automatique.

---

# 25. People

Everia peut disposer d'une couche « People ».

Relations :

```text
PERSON
 ↓
MEDIA
 ↓
MOMENT
```

Avec consentement approprié, l'utilisateur peut retrouver les médias associés à sa présence.

Exemple :

> **64 memories featuring you.**

---

# 26. Recherche intelligente

La recherche peut porter sur :

- personnes ;
- moments ;
- catégories ;
- vidéos ;
- dates ;
- contenu personnel.

Exemples :

```text
Photos avec Sarah
Vidéos de la soirée
Photos où je suis présent
Photos de la cérémonie
```

---

# 27. Défis

Les défis transforment les invités en participants actifs.

Exemples :

- Take a photo with someone you just met.
- Capture the funniest moment.
- Take a photo with the bride and groom.
- Find three generations in one photo.
- Capture the best dance move.
- Capture something blue.
- Photograph your full group.

---

# 28. Cycle opérationnel d'un défi

```text
CHALLENGE
   ↓
MISSION
   ↓
CAPTURE
   ↓
SUBMISSION
   ↓
VALIDATION
   ↓
REWARD
   ↓
PROGRESS
```

Une soumission peut être liée à :

- photo ;
- vidéo ;
- texte ;
- équipe.

---

# 29. Validation des défis

Méthodes :

### Règles

Exemple : nombre minimal de personnes ou présence d'un média.

### IA

Analyse du contenu.

### Organisateur

Validation manuelle.

### Communauté

Vote des participants.

### Hybride

Combinaison de plusieurs méthodes.

---

# 30. Défis personnalisés

Tous les participants ne doivent pas nécessairement recevoir les mêmes défis.

Everia peut observer le comportement.

Exemple :

Utilisateur A → photographie beaucoup de portraits.

Everia propose :

> Capture 3 candid portraits.

Utilisateur B → filme beaucoup.

Everia propose :

> Capture a 10-second reaction.

Cette adaptation constitue une partie importante de l'expérience personnalisée.

---

# 31. Défis collectifs et équipes

Types :

- individuel ;
- collectif ;
- équipe.

Exemple :

**Team Bride vs Team Groom**

Les équipes cumulent des points à partir des soumissions validées.

---

# 32. Gamification

Récompenses possibles :

- points ;
- badges ;
- niveaux ;
- progression ;
- classement optionnel.

Badges possibles :

- Photographer ;
- Memory Hunter ;
- People Hunter ;
- Storyteller ;
- Social Memory ;
- Challenge Master ;
- Memory Maker.

La gamification reste facultative et doit renforcer la mémoire, pas détourner le produit vers un jeu pur.

---

# 33. Participation Profile

Pour chaque utilisateur et événement, Everia peut calculer un profil :

```text
photos_count
videos_count
moments_count
people_count
challenges_completed
likes_received
comments_received
participation_score
activity_level
favorite_categories
```

Ce profil ne représente pas un profil global permanent : il représente la manière dont une personne a vécu **cet événement**.

---

# 34. My Experience

Dans un événement, l'utilisateur doit pouvoir voir :

- Mes photos ;
- Mes vidéos ;
- Mes moments ;
- Les photos où je suis ;
- Mes défis ;
- Mes badges ;
- Les personnes avec lesquelles j'ai partagé des souvenirs ;
- Mes statistiques ;
- Mes highlights ;
- Mon Replay.

---

# 35. Expérience personnalisée en temps réel

L'interface peut évoluer pendant l'événement.

Exemple :

> Welcome to Sarah & David's Wedding.

Puis :

> You captured 18 memories.

Puis :

> You appeared in 7 memories.

Puis :

> You shared 5 moments with Alice.

Puis :

> You completed 3 challenges.

Le contenu devient de plus en plus contextualisé.

---

# 36. Live Event

Pendant l'événement, Everia devient un espace temps réel.

Flux :

```text
UPLOAD
  ↓
PROCESSING
  ↓
PUBLISH
  ↓
REALTIME UPDATE
  ↓
CONNECTED CLIENTS
```

Une photo peut donc apparaître dans la galerie ou le Live Wall peu après son envoi.

---

# 37. Everia Live Wall

Destinations :

- smartphone ;
- tablette ;
- TV ;
- vidéoprojecteur ;
- écran événementiel.

Le système peut filtrer :

- contenu supprimé ;
- contenu non approuvé ;
- doublons ;
- médias trop similaires.

---

# 38. Réactions et commentaires

Interactions privées à l'événement :

- like ;
- love ;
- laugh ;
- wow ;
- celebrate ;
- fire.

Les utilisateurs peuvent également commenter un média ou un moment.

---

# 39. Guestbook

Le livre d'or permet :

- messages texte ;
- messages vidéo ;
- éventuellement audio.

Les contenus du guestbook sont conservés avec l'événement.

---

# 40. Notifications

Événements déclencheurs :

- invitation ;
- nouveau commentaire ;
- réaction ;
- nouveau moment ;
- défi disponible ;
- défi validé ;
- nouveau badge ;
- Replay prêt ;
- Best Of prêt ;
- événement bientôt terminé ;
- souvenir retrouvé.

Canaux :

- in-app ;
- push ;
- email ;
- SMS selon configuration.

---

# 41. Modération

La modération fonctionne sur plusieurs niveaux :

```text
UPLOAD
  ↓
AUTOMATIC CHECK
  ↓
AI / RULES
  ↓
┌───────────────┬────────────────┐
│ Safe          │ Suspicious     │
↓               ↓                │
Publish       Human Review      │
```

L'organisateur peut :

- approuver ;
- masquer ;
- supprimer ;
- examiner les signalements.

---

# 42. Sécurité et confidentialité

Everia doit appliquer le principe :

> **Private by default.**

Principes :

- accès par événement ;
- permissions par rôle ;
- RLS sur les tables ;
- URLs Storage signées pour les fichiers privés ;
- tokens invités temporaires ;
- absence de privilèges larges pour `anon` ;
- journalisation d'actions sensibles ;
- contrôle de suppression ;
- consentements explicites pour les fonctionnalités sensibles ;
- possibilité de demande d'export et de suppression.

---

# 43. IA

L'IA est une couche de service, pas le produit lui-même.

Elle peut intervenir pour :

### Analyse de médias

- scène ;
- personnes ;
- catégories ;
- similarité.

### Moments

Regroupement automatique.

### People

Association et détection avec consentement.

### Recherche

Recherche naturelle.

### Défis

Validation de certaines missions.

### Best Of

Classement et sélection.

### Replay

Sélection et storytelling.

### Personnalisation

Compréhension du comportement dans l'événement.

---

# 44. Best Of

À la fin de la collecte, Everia peut générer :

## Event Best Of

Sélection générale de l'événement.

## My Best Of

Sélection personnalisée pour un utilisateur.

Sélection possible selon :

- qualité ;
- diversité ;
- moments ;
- personnes ;
- réactions ;
- participation ;
- règles IA.

---

# 45. Replay

Le Replay est une vidéo ou expérience narrative de l'événement.

Pipeline :

```text
MEDIA
  ↓
MOMENTS
  ↓
BEST OF
  ↓
STORY ORDERING
  ↓
MUSIC
  ↓
TRANSITIONS
  ↓
RENDER
  ↓
REPLAY
```

Il existe deux concepts :

### Event Replay

Le récit collectif.

### My Replay

Le récit personnel d'un participant.

---

# 46. Exemple de My Replay

```text
YOUR NIGHT

You joined at 18:42.

You captured 38 memories.

You appeared in 17 memories.

You shared moments with 12 people.

You completed 6 challenges.

Your favorite moment:
First Dance

Your memory style:
Social Explorer
```

Cela synthétise l'expérience réelle de l'utilisateur.

---

# 47. My Memories

En dehors d'un événement actif, l'utilisateur dispose d'un espace personnel :

```text
MY MEMORIES
 ├── Events
 ├── Photos of Me
 ├── Favorites
 ├── Videos
 └── Replays
```

Les événements terminés deviennent des archives consultables.

---

# 48. On This Day

Fonction de réengagement à long terme :

> **One year ago today...**

Everia peut faire remonter les souvenirs associés à une date.

---

# 49. Memory Profile

À long terme, un utilisateur peut disposer d'un historique :

```text
Graduation 2025
Family Trip 2026
Birthday 2026
Wedding 2027
Anniversary 2028
```

Everia évolue ainsi vers une bibliothèque de moments de vie.

---

# 50. Memory Graph

Vision avancée : relier :

```text
PERSON ↔ EVENT ↔ MOMENT ↔ MEDIA ↔ PLACE ↔ DATE
```

Exemples de futures requêtes :

> Montre-moi mes souvenirs avec Sarah.

> Quels événements avons-nous vécus ensemble ?

> Montre-moi mes souvenirs à Douala en 2026.

---

# 51. Photographe + invités

Le photographe ne doit pas être considéré comme un concurrent.

Il apporte :

**contenu professionnel**.

Les invités apportent :

**contenu spontané**.

Everia fusionne les deux perspectives.

Concept :

> **Professional + Everyone.**

---

# 52. Flux complet d'un événement

```text
CREATE
  ↓
CONFIGURE
  ↓
INVITE
  ↓
RSVP
  ↓
JOIN
  ↓
CAPTURE
  ↓
UPLOAD
  ↓
PROCESS
  ↓
PUBLISH
  ↓
DISCOVER
  ↓
CHALLENGE
  ↓
INTERACT
  ↓
MOMENTS
  ↓
LIVE
  ↓
CLOSE
  ↓
BEST OF
  ↓
REPLAY
  ↓
ARCHIVE
  ↓
RELIVE
```

---

# 53. Cycle de vie utilisateur

```text
INSTALL
  ↓
ONBOARD
  ↓
AUTH / GUEST
  ↓
HOME
  ↓
CREATE OR JOIN
  ↓
PARTICIPATE
  ↓
PERSONALIZED EXPERIENCE
  ↓
MEMORIES
  ↓
RETURN
```

---

# 54. Boucle d'engagement

```text
CAPTURE
  ↓
CONTRIBUTE
  ↓
DISCOVER
  ↓
CONNECT
  ↓
CHALLENGE
  ↓
PERSONALIZE
  ↓
RELIVE
  ↓
RETURN
```

---

# 55. Boucle virale

```text
ORGANIZER
    ↓
CREATE EVENT
    ↓
INVITE 100 PEOPLE
    ↓
PARTICIPANTS DISCOVER EVERIA
    ↓
CONTRIBUTE
    ↓
EXPERIENCE VALUE
    ↓
SOME CREATE FUTURE EVENTS
```

Chaque événement peut donc devenir un canal d'acquisition.

---

# 56. Modèle économique

Le modèle recommandé est :

> **Freemium + Event Pass + Everia+ + Business**

## 56.1 Free

Objectif : découverte et viralité.

Exemple de limites configurables :

- nombre limité d'événements ;
- stockage limité ;
- nombre limité de médias ;
- fonctionnalités IA réduites.

## 56.2 Event Pass

Paiement unique pour un événement.

Exemples de niveaux :

### Essential

Accès événement, galerie, invités, QR, fonctions de base.

### Premium

Plus de stockage, Live, Guestbook, Best Of, Replay et IA avancée selon offre.

### Legacy

Conservation longue durée et fonctions souvenirs avancées.

Les montants exacts doivent être configurés dans le système de billing plutôt que codés en dur dans l'application.

## 56.3 Everia+

Abonnement personnel pour utilisateurs réguliers.

Fonctions possibles :

- plusieurs événements ;
- stockage plus important ;
- conservation longue durée ;
- recherche intelligente ;
- souvenirs annuels ;
- fonctionnalités IA avancées ;
- Replays personnels.

## 56.4 Business

Destiné aux professionnels.

Fonctions possibles :

- multi-événements ;
- comptes d'équipe ;
- analytics ;
- branding ;
- white-label ;
- API ;
- support renforcé.

---

# 57. Implémentation technique du billing

Le mobile ne décide jamais seul qu'un utilisateur possède une fonctionnalité payante.

Le flux est :

```text
USER
 ↓
SELECT PLAN
 ↓
CHECKOUT
 ↓
PAYMENT PROVIDER
 ↓
WEBHOOK
 ↓
PAYMENT RECORD
 ↓
SUBSCRIPTION / EVENT ENTITLEMENT
 ↓
FEATURE ACCESS
```

### Objets métier

- billing_plans ;
- user_subscriptions ;
- event_entitlements ;
- payments.

### Principe

Le droit d'accès est calculé à partir d'un **entitlement** valide, pas simplement d'une variable locale du téléphone.

### Event Pass

Un paiement unique peut donner un entitlement lié à :

```text
event_id
user_id
plan_id
status
expires_at
features
limits
```

### Abonnement

L'abonnement est lié à :

```text
user_id
plan_id
provider_customer_id
provider_subscription_id
status
current_period_start
current_period_end
```

Les webhooks du prestataire de paiement sont nécessaires pour maintenir l'état réel du système.

---

# 58. Storage et quotas

Les quotas doivent être calculés côté serveur.

Exemples :

- max_storage_bytes ;
- max_media_count ;
- max_events ;
- durée de conservation ;
- fonctionnalités activées.

Le mobile peut afficher une estimation, mais la validation réelle est backend.

---

# 59. Architecture backend fonctionnelle

Services logiques :

```text
AUTH SERVICE
USER SERVICE
EVENT SERVICE
INVITATION SERVICE
GUEST ACCESS SERVICE
MEDIA SERVICE
STORAGE SERVICE
PROCESSING SERVICE
AI SERVICE
MOMENT SERVICE
CHALLENGE SERVICE
GAMIFICATION SERVICE
PERSONALIZATION SERVICE
SOCIAL SERVICE
NOTIFICATION SERVICE
REPLAY SERVICE
MODERATION SERVICE
BILLING SERVICE
ANALYTICS SERVICE
EXPORT SERVICE
AUDIT SERVICE
```

Ils peuvent être implémentés au départ dans une architecture modulaire Supabase sans imposer de véritables microservices indépendants.

---

# 60. Supabase Auth

L'authentification est séparée des données métier.

Modèle :

```text
auth.users
    ↓
public.profiles
```

Le profil utilisateur stocke les informations applicatives.

---

# 61. Base de données fonctionnelle

Entités centrales recommandées :

```text
profiles
user_settings
user_devices
user_consents

events
event_members
invitations
rsvps

guest_profiles
guest_sessions

albums
media
media_processing_jobs
media_moderation_actions

moments
moment_media
people
media_people
moment_people

challenge_templates
challenges
challenge_teams
challenge_team_members
challenge_assignments
challenge_submissions

badges
user_badges

event_participation_profiles
user_event_preferences
personalized_items

media_reactions
comments
mentions
user_favorites

guestbook_entries
live_wall_configs
activity_feed

highlights
highlight_media
replays
replay_items
notifications
reports

analytics_events
event_daily_metrics

billing_plans
user_subscriptions
event_entitlements
payments

export_jobs
data_requests
audit_logs
```

---

# 62. Opérations RPC / métier

Les opérations métier sensibles peuvent passer par des RPC ou Edge Functions :

- create_event ;
- join_event ;
- add_reaction ;
- remove_reaction ;
- submit_challenge ;
- mark_personalized_item_seen ;
- finalize_event ;
- opérations de guest access ;
- opérations d'entitlements ;
- opérations d'export ;
- opérations de génération de Replay.

---

# 63. Edge Functions

Fonctions recommandées :

```text
event-guest

guest-storage-sign
guest-upload

storage-sign
media-process
ai-analyze
challenge-engine
replay-render
notify
stripe-webhook
export-event
```

### event-guest

Créer/valider une session invité.

### guest-storage-sign

Obtenir une autorisation d'upload limitée pour l'invité.

### guest-upload

Finaliser une contribution invitée.

### storage-sign

Créer des URLs temporaires pour les médias privés.

### media-process

Orchestrer les traitements médias.

### ai-analyze

Détection, classification, moments, etc.

### challenge-engine

Évaluer les soumissions.

### replay-render

Construire le fichier final.

### notify

Orchestrer les notifications.

### stripe-webhook

Synchroniser les paiements et abonnements.

### export-event

Produire les exports d'événements.

---

# 64. Traitements asynchrones

Les tâches lourdes ne doivent pas bloquer une transaction utilisateur.

Exemples :

- compression ;
- génération thumbnails ;
- analyse IA ;
- regroupement Moments ;
- Best Of ;
- Replay ;
- exports ;
- analytics agrégés.

Pipeline générique :

```text
Trigger
 ↓
Queue / Job
 ↓
Worker / Edge Function
 ↓
Retry
 ↓
Result
 ↓
Update Entity
 ↓
Notification
```

Chaque tâche doit être idempotente autant que possible.

---

# 65. Analytics

Everia doit suivre des événements comme :

- app_opened ;
- event_created ;
- event_joined ;
- invite_sent ;
- rsvp_updated ;
- media_upload_started ;
- media_upload_completed ;
- media_viewed ;
- challenge_started ;
- challenge_submitted ;
- challenge_completed ;
- reaction_added ;
- comment_created ;
- replay_opened ;
- replay_completed ;
- subscription_started ;
- purchase_completed.

L'analytics produit doit permettre de comprendre :

- adoption ;
- engagement ;
- participation ;
- conversion ;
- rétention ;
- performance des événements.

---

# 66. Architecture de l'application mobile

Navigation recommandée :

```text
HOME
EVENTS
CAPTURE
MEMORIES
PROFILE
```

### Home

Résumé et événements en cours.

### Events

Événements futurs, actifs et passés.

### Capture

Accès rapide à la caméra/galerie.

### Memories

Souvenirs et événements archivés.

### Profile

Compte, paramètres, abonnement et confidentialité.

---

# 67. Event Home

Pour un participant :

```text
EVENT COVER

Event Name
Date
Location

[ Add Memory ]

Photos | Videos | Moments | People

Challenges
My Experience
Guestbook
```

Pour l'organisateur, ajouter :

- Manage Event ;
- Invite ;
- Moderation ;
- Analytics ;
- Settings.

---

# 68. Expérience organisateur

Dashboard :

```text
EVENT
 ├── Overview
 ├── Participants
 ├── Invites
 ├── Media
 ├── Albums
 ├── Challenges
 ├── Moderation
 ├── Live Wall
 ├── Guestbook
 ├── Best Of
 ├── Replay
 ├── Analytics
 ├── Billing
 └── Settings
```

---

# 69. Expérience participant

Le participant doit avoir une interface très rapide :

```text
Event
 ↓
Add Memory
 ↓
Camera / Gallery
 ↓
Send
 ↓
See Result
```

Il doit également recevoir :

- défis ;
- découvertes ;
- moments ;
- notifications ;
- suggestions personnalisées.

---

# 70. Cycle opérationnel d'une photo

```text
Capture
  ↓
Select
  ↓
Upload
  ↓
Storage
  ↓
Media Record
  ↓
Processing
  ↓
Moderation
  ↓
AI
  ↓
Publish
  ↓
Gallery
  ↓
Moment
  ↓
Best Of
  ↓
Replay
  ↓
Memory
```

---

# 71. Cycle opérationnel d'un défi

```text
Challenge Created
 ↓
Challenge Published
 ↓
User Assigned
 ↓
User Starts
 ↓
Capture
 ↓
Submission
 ↓
Validation
 ↓
Approved / Rejected / Review
 ↓
Points / Badge
 ↓
Participation Profile
 ↓
Personalization
```

---

# 72. Cycle opérationnel d'une expérience personnalisée

```text
User joins Event
 ↓
Actions collected
 ↓
Photos / Videos
 ↓
Interactions
 ↓
Challenges
 ↓
People / Moments
 ↓
Participation Profile
 ↓
Personalization Engine
 ↓
Recommendations
 ↓
My Experience
 ↓
My Replay
```

---

# 73. Cycle opérationnel du paiement

```text
Choose Plan
 ↓
Checkout
 ↓
Payment Provider
 ↓
Webhook
 ↓
Validate Payment
 ↓
Payment Record
 ↓
Subscription / Entitlement
 ↓
Feature Access
```

Une application mobile ne doit jamais considérer qu'un paiement est réussi uniquement parce qu'elle a reçu le retour de son interface locale.

---

# 74. Expérience avant / pendant / après

## Avant

- créer ;
- personnaliser ;
- inviter ;
- RSVP ;
- préparer les défis.

## Pendant

- rejoindre ;
- photographier ;
- filmer ;
- relever des défis ;
- interagir ;
- Live ;
- découvrir les Moments.

## Après

- clôturer ;
- traiter ;
- Best Of ;
- Replay ;
- archive ;
- souvenirs personnalisés.

## Long terme

- On This Day ;
- My Memories ;
- nouveaux événements ;
- Memory Profile.

---

# 75. Ce qui rend Everia spécial

La différenciation ne doit pas être :

> « Nous avons un QR code. »

Le QR code est un moyen.

La différenciation fondamentale est :

### 1. Plusieurs perspectives d'un même moment

### 2. Personnalisation individuelle de l'expérience

### 3. Défis adaptatifs

### 4. Construction de Moments

### 5. Best Of et Replay automatiques

### 6. Mémoire à long terme

### 7. Collaboration entre professionnels et invités

---

# 76. Phrase stratégique de différenciation

> **Les autres applications rassemblent les photos d'un événement. Everia cherche à comprendre comment l'événement a été vécu.**

Autre formulation :

> **From Photos to Moments. From Moments to Memories.**

---

# 77. Architecture fonctionnelle résumée

```text
                         EVERIA
                           │
               ┌───────────┴───────────┐
               │                       │
            AUTH                    GUEST
               │                       │
               └───────────┬───────────┘
                           │
                          EVENT
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   PARTICIPANTS          MEDIA             CHALLENGES
        │                  │                  │
        │            ┌─────┴─────┐            │
        │            │           │            │
        │         PHOTOS       VIDEOS       MISSIONS
        │            │           │            │
        │            └─────┬─────┘            │
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
                         MOMENTS
                           │
                    PERSONALIZATION
                           │
             ┌─────────────┼─────────────┐
             │             │             │
          PEOPLE        TIMELINE        LIVE
             │             │             │
             └─────────────┼─────────────┘
                           │
                        SOCIAL
                           │
             ┌─────────────┼─────────────┐
             │             │             │
          REACTION      COMMENTS      GUESTBOOK
                           │
                           ▼
                        BEST OF
                           │
                           ▼
                         REPLAY
                           │
                           ▼
                       MEMORIES
```

---

# 78. Architecture de la donnée de personnalisation

```text
                   EVENT
                     │
              Event Membership
                     │
                     ▼
           Participation Profile
                     │
       ┌─────────────┼─────────────┐
       │             │             │
      Media        Moments      Challenges
       │             │             │
       └─────────────┼─────────────┘
                     │
               Interactions
                     │
                     ▼
          Personalization Engine
                     │
       ┌─────────────┼─────────────┐
       │             │             │
 Recommendations  Challenges   Highlights
       │             │             │
       └─────────────┼─────────────┘
                     │
                     ▼
                My Experience
                     │
                     ▼
                  My Replay
```

---

# 79. Principes UX absolus

## Friction minimale pour l'invité

QR → rejoindre → capturer → envoyer.

## Contrôle maximal pour l'organisateur

Configuration, permissions, modération et analytics.

## Valeur cumulative

Chaque nouvelle contribution améliore l'expérience collective et potentiellement l'expérience personnelle.

## Confidentialité par défaut

Les souvenirs privés restent privés.

## L'IA doit être invisible quand elle fonctionne bien

L'utilisateur voit le résultat, pas la complexité technique.

## L'événement ne doit pas mourir après le jour J

Le Replay et My Memories prolongent sa durée de vie.

---

# 80. Vision produit à long terme

Everia peut évoluer en cinq étapes :

```text
1. Event Photo Sharing
        ↓
2. Collaborative Event Memories
        ↓
3. AI-Powered Event Storytelling
        ↓
4. Personal Memory Platform
        ↓
5. Digital Memory Infrastructure
```

La finalité est de faire d'Everia un lieu où les événements importants ne sont pas simplement stockés : ils sont **structurés, racontés, personnalisés et revécus**.

---

# 81. Formule finale du produit

### Capture

**Capture every perspective.**

### Connect

**Connect people through shared moments.**

### Challenge

**Turn guests into participants.**

### Personalize

**Make the event yours.**

### Remember

**Turn moments into lasting memories.**

---

# 82. Résumé exécutif

Everia est une plateforme mobile de mémoire événementielle collaborative.

Un organisateur crée un événement et invite des participants. Les invités peuvent rejoindre l'événement avec un compte ou, idéalement, sans compte via un QR code ou un lien. Ils photographient, filment, commentent, réagissent et participent à des défis.

Les médias sont sécurisés, traités et enrichis. Everia regroupe plusieurs contenus autour de mêmes instants pour former des Moments, identifie des relations avec des personnes lorsque les conditions de consentement sont réunies, et construit un profil de participation pour chaque personne.

À partir de ces données, l'application ne présente pas uniquement une galerie commune : elle personnalise l'expérience de chaque participant. Les défis, recommandations, souvenirs, highlights et Replay peuvent varier selon ce que chaque personne a réellement vécu et contribué à l'événement.

Après l'événement, Everia génère des Best Of et Replays et transforme l'événement en souvenir durable. À plus long terme, les événements archivés forment une mémoire personnelle qui peut être revisitée via My Memories et des fonctionnalités comme On This Day.

Le modèle économique combine Free, Event Pass, Everia+ et Business. Les droits d'accès sont gérés côté serveur via subscriptions et entitlements, tandis que les paiements sont synchronisés par webhooks d'un prestataire de paiement.

La différenciation stratégique d'Everia repose donc sur quatre idées :

> **Collecter toutes les perspectives.**
>
> **Comprendre les moments.**
>
> **Personnaliser l'expérience.**
>
> **Préserver la mémoire.**

---

# 83. Formule de marque recommandée

> **Everia — One Event. Many Perspectives. One Living Memory.**

Ou :

> **Everia — From Photos to Moments. From Moments to Memories.**

