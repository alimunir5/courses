# Courses — ma liste de courses (PWA)

La liste de courses du programme « Prise de masse » (34 articles en 6 rayons + « Divers »), à cocher au magasin. PWA installable, **100 % hors ligne**, données **sur le téléphone uniquement**. Elle était avant dans l'onglet Recettes de Muscu.

App en ligne : https://alimunir5.github.io/courses/

## Fonctionnalités

- Articles par rayon avec quantités, pastille « stock », cases à cocher, compteur et barre de progression (en-tête collant).
- Ajout d'articles perso avec choix du rayon, changement de rayon, suppression.
- « Tout décocher » = nouvelle liste (les ajouts perso sont conservés). Encart budget indicatif.
- **Réglages** : « Copier ma liste » (JSON), import (coller un JSON), aide d'installation.

## Installer sur iPhone

Ouvrir l'URL dans **Safari** → bouton **Partager** → **Sur l'écran d'accueil**.

## Données et reprise de la liste de Muscu

Stockage : `localStorage`, clé **`courses-v1`**, même format que l'ancien onglet de Muscu (`{ "checked": [ids], "custom": [{ id, name, group }], "lastGroup": "…" }`). Dans Safari, toutes les apps de `alimunir5.github.io` partagent le même `localStorage` : la liste de Muscu est donc reprise telle quelle.

Sur iOS, **une app installée sur l'écran d'accueil a un stockage séparé de Safari** : la liste peut y apparaître vide. Secours : dans Muscu → Recettes → **Copier ma liste**, puis dans Courses → ⚙︎ Réglages → **Importer** (Coller, puis Importer).

## Développement

Aucune dépendance, aucun build (JavaScript en modules ES), même structure que Valise.

```bash
npm test          # tests unitaires (node --test) sur js/core.js
npm run serve     # serveur local sur http://localhost:4173
```

- `js/core.js` : catalogue, état, persistance, import / export (testé dans `tests/`). `js/app.js` : interface.
- Icônes : fournies par `_design/icons/courses/` (caddie or sur fond noir), copiées dans `icons/`.
- `sw.js` : cache hors ligne — **incrémenter `VERSION`** à chaque modification.
- Déploiement : chaque push sur `main` lance les tests puis publie sur GitHub Pages (`.github/workflows/pages.yml`).
