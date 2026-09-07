# Everia — Application mobile (React Native / Expo)

> One Event. Many Perspectives. One Everia.

Application complète construite avec **Expo Router**, **Supabase** (auth, base de
données, storage, edge functions) et **Stripe** (paiements), suivant le design
system *Midnight Plum + Champagne* fourni (`src/theme/theme.js`) et le mockup
visuel annexé. Icônes : **Ionicons** (`@expo/vector-icons`) exclusivement.

Ce document explique comment démarrer, comment le projet est organisé, et
liste les points qui nécessitent une action de ta part côté backend avant
mise en production.

---

## 1. Démarrage rapide

```bash
cd everia-app
npm install
cp .env.example .env      # puis renseigner les valeurs Supabase / Stripe
npx expo start
```

Prérequis : Node 18+, Expo CLI, un projet Supabase existant (le fichier SQL
`everia_full_setup_final.sql` que tu as fourni), un compte Stripe.

### Variables d'environnement (`.env`)

```
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=...
EXPO_PUBLIC_SUPABASE_STORAGE_BUCKET=everia-media
```

### Déploiement des Edge Functions Stripe

```bash
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
```

Puis enregistrer l'URL du webhook dans le dashboard Stripe :
`https://<project-ref>.functions.supabase.co/stripe-webhook`
(événements à écouter : `payment_intent.succeeded`,
`payment_intent.payment_failed`, `customer.subscription.updated`,
`customer.subscription.deleted`).

---

## 2. Architecture du projet

```
app/                        # Écrans (Expo Router, file-based)
  _layout.js                 # Providers globaux (fonts, Stripe, Toast)
  index.js                   # Splash + redirection
  onboarding.js
  (auth)/                    # welcome / login / register
  join.js                    # Rejoindre un événement (QR + code)
  create-event/               # Création d'événement en 4 étapes
  (tabs)/                     # Home / Événements / Capture / Souvenirs / Profil
  event/[id]/                 # Sous-app d'un événement (17 écrans)
  organizer/[id]/              # Back-office organisateur (5 écrans)
  profile/                     # Éditer profil, badges, réglages, confidentialité
  subscription/                # Plans + paiement Stripe
  notifications.js / search.js

src/
  theme/                      # Design system (theme.js fourni, fonts)
  constants/                  # icons.js (mapping Ionicons), config.js
  lib/                        # supabase.js, stripe.js, storage.js, format.js, profiles.js
  store/                      # Zustand : authStore, eventStore, uiStore, createEventStore
  hooks/                      # useSupabaseQuery, useRealtimeList, useMediaUpload
  components/
    ui/                       # Kit UI générique (Button, GlassCard, NeuCard, BottomSheet...)
    brand/                    # Logo
    event/                    # EventCard, MediaGrid, ChallengeCard, ReactionBar...
    organizer/                # ModerationCard, SimpleBarChart

supabase/functions/           # Edge Functions Stripe (Deno)
```

### Choix de design notables

- **Glassmorphism** : `components/ui/GlassCard.js` (BlurView + dégradé +
  bordure translucide), utilisé sur les overlays d'événement, badges live,
  et cartes flottantes sur fond sombre.
- **Neomorphism sombre** : `components/ui/NeuCard.js`, simulation d'un
  relief creux/bombé sur fond Midnight Plum via double bordure fine
  (React Native ne supporte qu'une seule ombre par `View`).
- **État global** : Zustand plutôt que Context API, cohérent avec tes autres
  projets (Zender237, DailyWin).
- **Accès invité sans compte** : implémenté via **Supabase Anonymous
  Auth** (`supabase.auth.signInAnonymously()`) plutôt que le couple
  `guest_profiles` / `guest_sessions` à token custom présent dans ton schéma
  SQL. Un utilisateur anonyme obtient un vrai `auth.uid()`, ce qui permet de
  réutiliser telles quelles toutes les RPC et policies RLS existantes
  (`join_event`, `add_reaction`, `submit_challenge`...) sans dupliquer de
  logique dans une Edge Function dédiée. Si l'équipe backend préfère au
  final le flux `guest_profiles`/token, seul `authStore.joinAsGuest()` est à
  remplacer par un appel à une nouvelle Edge Function — le reste de l'app
  n'a pas besoin de changer.
- **Paiements** : suit le principe *"le client ne doit jamais considérer un
  paiement réussi sur la seule foi du retour local du SDK Stripe"* — après
  confirmation du PaymentSheet, le client attend (`waitForPaymentConfirmation`)
  que le **webhook** ait mis à jour `payments`/`user_subscriptions` en base
  avant de débloquer quoi que ce soit.

---

## 3. Points à vérifier / corriger côté backend (SQL)

En croisant le client avec `everia_full_setup_final.sql`, j'ai trouvé une
incohérence dans la fonction SQL elle-même, à corriger côté base :

- **`add_reaction()`** insère dans une colonne `type` sur `media_reactions`,
  mais la table déclare la colonne `reaction` (`reaction public.reaction_type
  not null default 'like'`). Tel quel, l'appel RPC échouera. À corriger dans
  la fonction (`insert into public.media_reactions(media_id, user_id, reaction)
  ...` et `on conflict (...) do update set reaction = ...`).

Autres écarts rencontrés et déjà gérés côté client (aucune action requise,
juste pour information) :

- `media.uploader_user_id`, `event_members.user_id`, `comments.user_id`,
  `guestbook_entries.user_id`, `event_participation_profiles.user_id`
  référencent `auth.users(id)`, pas `public.profiles(id)` : PostgREST ne peut
  donc pas embarquer `profiles:user_id(...)` directement dans un `select`
  imbriqué. Le client récupère les profils séparément et les fusionne
  (`src/lib/profiles.js`). Si tu préfères des embeds natifs plus tard, il
  faudrait soit ajouter une contrainte de clé étrangère directe vers
  `profiles`, soit exposer une vue dédiée.
- Aucune RPC `publish_event`/`activate_event` n'existe : l'écran
  Personnalisation (`organizer/[id]/customize.js`) fait donc une mise à jour
  directe de `events.status` (autorisée par RLS pour le owner/admin).
- `badges` n'a pas de colonnes `label`/`icon` (Ionicons) mais `name`/
  `icon_path` (image stockée) — le client affiche `icon_path` comme image et
  replie sur une icône Ionicons générique si absente.
- Le Best Of / Replay personnel utilise `replays` + `replay_items`
  (`kind`: `best_of` | `event` | `personal`), pas une table `highlights`.

---

## 4. Ce qui est branché "pour de vrai" vs. à finaliser

**Branché et fonctionnel dès que Supabase/Stripe sont configurés :**
authentification (email + invité anonyme), création d'événement, jonction
par QR/code, galerie + upload photo/vidéo, réactions, commentaires, favoris,
défis (soumission), gamification (classement, badges), Live Wall temps réel
(Supabase Realtime), livre d'or (texte/audio/vidéo), modération organisateur,
analytics organisateur, personnalisation d'événement, paiement Stripe
(PaymentSheet + webhook), notifications, profil.

**Nécessite un travail backend/infra complémentaire (hors scope client
mobile) :**
- Traitement IA des médias (détection de visages → `people`/`media_people`,
  génération de `moments`, `personalized_items`) : le client lit ces tables
  mais ne les peuple pas — c'est le rôle des Edge Functions / jobs listés
  dans `media_processing_jobs`.
- Génération vidéo du Replay/Best Of (`replays.output_path`) : le client
  affiche un état "en cours de génération" tant que ce champ est vide.
- Connexion OAuth Apple/Google : le flux `signInWithOAuth` est câblé côté
  client (deep link + `expo-web-browser`), mais nécessite d'activer les
  providers correspondants dans le dashboard Supabase Auth.
- Vrais abonnements récurrents Stripe : le flux actuel crée un
  `PaymentIntent` unique (correct pour l'Event Pass ponctuel). Pour Everia+/
  Business en récurrence automatique, il faudra migrer vers
  `stripe.subscriptions.create()` + `checkout.session.completed`.

---

## 5. Prochaines étapes suggérées

1. Corriger `add_reaction()` côté SQL (colonne `reaction` vs `type`).
2. `npm install` + configurer `.env`, lancer `npx expo start` et parcourir
   les écrans avec de vraies données de test.
3. Générer les assets d'app manquants si besoin (`assets/icon.png`,
   `assets/adaptive-icon.png`, `assets/splash-icon.png` sont déjà dérivés du
   logo fourni).
4. Brancher EAS Build (`eas.json` à créer) pour les builds iOS/Android.
