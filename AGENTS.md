# Consignes MetalFlow

- Travailler depuis une branche dédiée basée sur `main` et préparer les PR vers `main`. Garder les modifications ciblées sur le chantier demandé.
- Utiliser Node.js 24, npm et les fichiers de verrouillage de chaque sous-projet. Installer avec les commandes du README.
- Consulter [le scénario et le schéma commun](docs/demo.md) avant de modifier un état, un événement ou un format. Aligner le schéma Solidity, le document et les données d’exemple en cas de changement. Signaler les changements aux chantiers concernés.
- Exprimer les montants en unités minimales USDC à six décimales. Conserver les grands entiers sous forme de chaînes décimales dans les données JSON et utiliser `bigint` pour les calculs TypeScript.
- Utiliser des données fictives pour les démos et les tests locaux. Garder les clés et les URL privées hors du dépôt. Identifier la provenance de chaque entrée du journal et exiger une confirmation sur Arc avant de mettre à jour les soldes.
- Exécuter les vérifications pertinentes du README. Dans la PR, indiquer les commandes, leurs résultats et les vérifications qui restent à faire.
