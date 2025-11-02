# GitHub Actions Workflows

Ce dossier contient les workflows GitHub Actions pour l'automatisation CI/CD du projet.

## Workflows disponibles

### 1. CI (`ci.yml`)
**Déclenchement** : Sur chaque push vers `main` ou `lab`, et sur chaque Pull Request

**Actions** :
- ✅ Installation des dépendances
- ✅ Linting (ESLint) pour frontend et backend
- ✅ Vérification TypeScript pour le frontend
- ✅ Exécution des tests unitaires avec couverture
- ✅ Build du frontend (Next.js)
- ✅ Build du backend (NestJS)
- ✅ Tests E2E du backend (optionnel)

**Environnements de test** :
- Redis est disponible pour les tests backend
- MongoDB peut être configuré via secrets GitHub

### 2. PR Checks (`pr-check.yml`)
**Déclenchement** : Sur chaque Pull Request (ouvert, synchronisé, réouvert)

**Actions** :
- ✅ Vérification du linting frontend et backend
- ✅ Vérification TypeScript pour le frontend
- ✅ Commentaire automatique sur la PR si les vérifications échouent

**Fonctionnalités** :
- Commentaire automatique en cas d'échec avec conseils pour corriger
- Bloque les merges si les vérifications échouent (si branch protection est activée)

## Secrets GitHub nécessaires

Pour une configuration complète, ajoutez ces secrets dans GitHub :
- `Settings` → `Secrets and variables` → `Actions`

### Secrets optionnels (pour les tests)
- `MONGODB_URI` : URI MongoDB pour les tests (défaut : `mongodb://localhost:27017/test`)
- `NEXT_PUBLIC_API_URL` : URL de l'API pour les tests frontend (défaut : `http://localhost:3001`)

## Configuration des Branch Protections

Pour activer la protection des branches et bloquer les merges si les tests échouent :

1. Allez dans `Settings` → `Branches`
2. Ajoutez une règle pour `main` :
   - ✅ Require a pull request before merging
   - ✅ Require status checks to pass before merging
     - Sélectionnez `Frontend CI` et `Backend CI`
   - ✅ Require branches to be up to date before merging

## Exécution locale des vérifications

Avant de pousser votre code, vous pouvez exécuter les mêmes vérifications localement :

```bash
# Frontend
cd frontend
npm ci
npm run lint
npx tsc --noEmit
npm test
npm run build

# Backend
cd backend
npm ci
npm run lint
npm run build
npm test
```

## Dépannage

### Les tests échouent dans CI mais passent localement
- Vérifiez que toutes les dépendances sont à jour (`npm ci`)
- Vérifiez les variables d'environnement nécessaires
- Vérifiez que les fichiers ne sont pas ignorés par `.gitignore`

### Le linting échoue
- Exécutez `npm run lint` qui peut corriger automatiquement certaines erreurs
- Vérifiez que Prettier est configuré correctement

### Les builds échouent
- Vérifiez que toutes les variables d'environnement nécessaires sont définies
- Vérifiez que les dépendances sont installées correctement
- Consultez les logs complets dans l'onglet "Actions" de GitHub

