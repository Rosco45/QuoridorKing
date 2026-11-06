# 👑 QuoridorKing

Application web monopage (SPA) responsive et **Mobile-First** du célèbre jeu de plateau stratégique **Quoridor**, jouable en **Pass-and-Play à 2 joueurs** et **contre l'IA** avec 3 niveaux de difficulté.

Conçue avec **React 19**, **TypeScript**, **Tailwind CSS**, et un plateau vectoriel haute précision en **SVG interactif**.

---

## 🚀 Démarrage Rapide

```bash
# Se déplacer dans le dossier
cd QuoridorKing

# Installer les dépendances
npm install

# Lancer le serveur de développement local
npm run dev

# Lancer les tests automatisés (12 tests)
npm test

# Compiler pour la production
npm run build
```

---

## 🤖 Mode Contre l'IA & Niveaux de Difficulté

Un moteur d'intelligence artificielle dédié ([`src/engine/ai.ts`](file:///home/roserick/QuoridorKing/src/engine/ai.ts)) permet d'affronter l'ordinateur avec trois comportements distincts :

1. 🟢 **Facile (Apprenti)** :
   - Avance calmement le long du plus court chemin.
   - Pose très peu de murs et commet des erreurs occasionnelles.
   - Parfait pour découvrir et s'initier aux règles du jeu.
2. 🟡 **Normal (Stratège)** :
   - Équilibré entre progression du pion et placement de murs gênants.
   - Analyse la distance de l'adversaire et pose des murs dès que le joueur prend l'avantage.
   - Bloque systématiquement un joueur sur le point de gagner au coup suivant.
3. 🔴 **Difficile (Maître Quoridor)** :
   - Évalue instantanément l'ensemble des 128 placements de murs possibles via l'algorithme BFS.
   - Maximise le delta de retard infligé à l'adversaire tout en préservant son propre chemin.
   - Maîtrise les sauts tactiques en vis-à-vis et les bifurcations pour optimiser chaque tempo.

---

## 📱 Ergonomie Latérale Mobile-First (À côté de la grille)

- **Dock de Contrôle Latéral** : Les choix « Avancer » et « Poser Mur » sont positionnés **directement à côté de la grille** dans un dock vertical compact. La grille ne masque plus jamais les options d'action !
- **Inversion Gauche / Droite** : Un bouton dédié permet d'inverser le côté du dock d'un seul tap (idéal pour gauchers ou droitiers).
- **Validation en deux temps** : Taper une intersection affiche une prévisualisation semi-transparente avec vérification instantanée de la Règle d'or. Le dock affiche immédiatement les boutons de validation, de rotation (H ↔ V) et d'annulation.
- **Règles officielles Gigamic** :
  - Déplacement orthogonal 1 case.
  - Saut direct par-dessus l'adversaire en face-à-face.
  - Esquive diagonale automatique si le saut est bloqué par un mur ou le bord du plateau.
  - Règle d'or absolue (BFS) : interdiction totale d'enfermer un joueur sans accès à sa ligne de but.
- **Effets sonores Web Audio API** : Sons de clics, poses de mur, sauts, alertes et fanfare de victoire 100% autonomes hors-ligne.
