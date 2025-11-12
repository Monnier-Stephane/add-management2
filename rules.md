# Règles du Projet

## Structure du Code
- Respecter l'architecture définie pour le frontend et le backend
- Maintenir une séparation claire entre les responsabilités des composants
- Utiliser des noms de variables et de fonctions descriptifs
- Organiser les fichiers par fonctionnalité plutôt que par type
- Séparer la logique métier de la présentation

## Style de Code
- Suivre les conventions de nommage camelCase pour les variables et fonctions
- Utiliser PascalCase pour les composants React et les classes
- Indenter avec 2 espaces
- Ajouter des commentaires pour le code complexe
- Utiliser Prettier pour le formatage automatique
- Exécuter `npm run lint` avant chaque commit

## TypeScript
- Éviter l'utilisation de `any` - préférer des types explicites ou `unknown`
- Définir des interfaces/types pour toutes les structures de données
- Utiliser les utilitaires TypeScript (`Partial`, `Pick`, `Omit`, `Record`, etc.)
- Gérer explicitement les valeurs nullable avec `null` ou `undefined`
- Utiliser les types génériques pour la réutilisabilité
- Activer le mode strict de TypeScript dans `tsconfig.json`
- Documenter les types complexes avec des commentaires JSDoc
- Utiliser les types d'union (`|`) et les types d'intersection (`&`) judicieusement
- Typer les props des composants React avec des interfaces dédiées

## React/Next.js
- Utiliser les hooks React correctement (toujours inclure les dépendances dans `useEffect`, `useMemo`, `useCallback`)
- Préférer les Server Components de Next.js quand possible pour de meilleures performances
- Utiliser `'use client'` uniquement quand nécessaire
- Éviter les re-renders inutiles avec `React.memo`, `useMemo`, et `useCallback`
- Gérer proprement le cleanup dans `useEffect` (retourner une fonction de nettoyage)
- Utiliser les Context API avec modération (éviter les Context trop larges)
- Préférer les composants fonctionnels aux composants de classe
- Gérer les états locaux avec `useState` et les états globaux avec des solutions appropriées
- Utiliser `useRouter` de Next.js pour la navigation au lieu de `<Link>` quand nécessaire
- Optimiser les imports pour réduire la taille du bundle

## Accessibilité
- Utiliser les attributs ARIA appropriés (`aria-label`, `aria-labelledby`, `role`, etc.)
- Assurer la navigation au clavier pour tous les éléments interactifs
- Maintenir un contraste de couleur suffisant (ratio WCAG AA minimum)
- Fournir des textes alternatifs pour les images (`alt`)
- Utiliser les balises sémantiques HTML5 (`<nav>`, `<main>`, `<header>`, `<footer>`, etc.)
- Tester avec des lecteurs d'écran quand possible
- Gérer le focus visible pour la navigation au clavier
- S'assurer que les formulaires ont des labels associés

## Documentation
- Ajouter des commentaires JSDoc pour les fonctions publiques et les composants exportés
- Documenter les APIs avec des exemples d'utilisation
- Mettre à jour les README lors de changements majeurs
- Documenter les variables d'environnement nécessaires
- Commenter le code complexe avec des explications claires
- Maintenir la documentation à jour avec le code
- Documenter les décisions techniques importantes (ADR - Architecture Decision Records)

## Gestion des Erreurs
- Toujours gérer les erreurs avec des blocs `try/catch` appropriés
- Logger les erreurs avec des détails utiles (utiliser Sentry pour le monitoring)
- Fournir des messages d'erreur clairs et utiles à l'utilisateur
- Ne jamais exposer d'informations sensibles dans les messages d'erreur
- Gérer les erreurs asynchrones avec `.catch()` ou `try/catch` avec `await`
- Implémenter une gestion d'erreur globale pour les erreurs non capturées
- Utiliser des types d'erreur personnalisés quand nécessaire
- Fournir des fallbacks UI quand une erreur survient

## Git
- Faire des commits atomiques avec des messages descriptifs
- Utiliser le format de commit conventionnel : `type(scope): description`
  - Types : `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`
  - Exemple : `feat(auth): add session timeout warning`
- Travailler sur des branches séparées pour chaque fonctionnalité (`feat/`, `fix/`, etc.)
- Faire des pull requests pour la revue de code avant de merger
- Garder les branches à jour avec `main` (rebase ou merge régulier)
- Ne jamais forcer un push sur `main` (`git push --force` interdit)
- Créer des branches descriptives : `feat/nom-fonctionnalite` ou `fix/nom-bug`
- Faire des commits fréquents et petits plutôt que de gros commits
- Écrire des messages de commit en français pour la cohérence du projet

## Tests
- Écrire des tests unitaires pour les fonctions critiques
- Maintenir une couverture de tests suffisante (minimum 30% actuellement, viser 80%)
- Exécuter tous les tests avant de soumettre du code (`npm test`)
- Utiliser des noms de test descriptifs qui expliquent ce qui est testé
- Tester les cas limites et les cas d'erreur
- Éviter les tests fragiles qui dépendent de l'ordre d'exécution
- Utiliser les mocks et stubs appropriés pour isoler les unités testées
- Écrire des tests pour les nouveaux composants et fonctions
- Maintenir les tests à jour lors des refactorisations

## CI/CD
- Tous les tests doivent passer avant de merger dans `main`
- Le linting est vérifié automatiquement sur chaque PR
- Les builds doivent réussir avant le déploiement
- Ne jamais pousser de code qui casse les tests
- Les workflows CI/CD bloquent les merges si les vérifications échouent
- Corriger les erreurs de linting/TypeScript avant de demander une revue
- Les tests et le build sont exécutés automatiquement sur chaque push/PR
- Respecter les statuts de CI/CD avant de merger une PR

## Environnements
- Ne jamais commiter les fichiers `.env` dans le dépôt
- Documenter toutes les variables d'environnement nécessaires dans les README
- Valider les variables d'environnement au démarrage de l'application
- Utiliser des valeurs par défaut sensées pour le développement local
- Séparer les configurations pour dev, staging et production
- Utiliser des secrets GitHub Actions pour les variables sensibles
- Ne jamais exposer les clés API ou tokens dans le code source
- Utiliser `.env.example` comme template pour les nouvelles variables

## API/Backend
- Utiliser des DTOs (Data Transfer Objects) pour la validation des entrées
- Implémenter la validation avec des librairies appropriées (class-validator)
- Gérer les codes de statut HTTP correctement (200, 201, 400, 401, 403, 404, 500)
- Implémenter la pagination pour les listes de résultats
- Utiliser le cache Redis efficacement pour améliorer les performances
- Logger toutes les requêtes importantes pour le debugging
- Implémenter la gestion des erreurs au niveau global avec des intercepteurs
- Documenter les endpoints API avec des exemples
- Utiliser les bonnes pratiques REST pour la structure des URLs
- Gérer l'authentification et l'autorisation de manière sécurisée

## Sécurité
- Ne jamais stocker d'informations sensibles dans le code source
- Utiliser des variables d'environnement pour les secrets
- Valider toutes les entrées utilisateur (côté client ET serveur)
- Implémenter la protection CSRF pour les formulaires
- Utiliser des tokens JWT avec expiration pour l'authentification
- Hasher les mots de passe avec des algorithmes sécurisés (bcrypt)
- Limiter le taux de requêtes (rate limiting) pour éviter les abus
- Utiliser HTTPS en production
- Sanitizer les entrées utilisateur pour éviter les injections (XSS, SQL, NoSQL)
- Maintenir les dépendances à jour pour éviter les vulnérabilités connues

## Performance
- Optimiser les requêtes de base de données (indexes, requêtes efficaces)
- Minimiser les rendus inutiles dans le frontend
- Suivre les bonnes pratiques de chargement des ressources
- Utiliser le lazy loading pour les composants et routes non critiques
- Implémenter la mise en cache appropriée (Redis, HTTP cache)
- Optimiser les images (compression, formats modernes, lazy loading)
- Réduire la taille des bundles JavaScript (code splitting)
- Utiliser le memoization (`useMemo`, `useCallback`) judicieusement
- Monitorer les performances avec des outils comme Sentry
- Éviter les requêtes N+1 dans les bases de données
