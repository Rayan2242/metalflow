# MetalFlow

MetalFlow prépare une démo de lignes de crédit en USDC de test sur Arc pour les négociants en métaux confrontés à un appel de marge.

## Installation

Utiliser Node.js 24 et npm. Depuis la racine du dépôt, `nvm use` sélectionne la version indiquée dans `.nvmrc` si NVM est installé.

```bash
npm ci --prefix contracts
npm ci --prefix web
```

## Démarrage

Compiler le schéma Solidity et démarrer le nœud de développement local dans un premier terminal.

```bash
npm --prefix contracts run compile
npm --prefix contracts run node
```

Le nœud répond sur `http://127.0.0.1:8545` (chain ID local `31337`). Dans un second terminal, démarrer Next.js.

```bash
npm --prefix web run dev
```

Ouvrir [l’accueil local](http://localhost:3000). Ces commandes démarrent les deux squelettes indépendamment, sans compte ni clé API. Le contrat de crédit, la connexion au portefeuille et les intégrations Arc, Base, CCTP, Gemini et QuickNode restent à réaliser.

## Tests et compilation

```bash
npm --prefix contracts run compile
npm --prefix contracts test
npm --prefix contracts exec -- tsc -p contracts/tsconfig.json
npm --prefix web test
npm --prefix web run build
```

Hardhat compile l’interface Solidity et exécute son lanceur de tests, qui affiche zéro test à ce stade. Le script de test web génère les types de routes et vérifie TypeScript. Pour servir le build de production, lancer `npm --prefix web start`.

## Démo et travaux suivants

- [Scénarios de démo et schéma des états et événements](docs/demo.md)
- [Données d’exemple des deux parcours](docs/examples/demo.json)
- [Tâche contrat](docs/tasks/contracts.md)
- [Tâche interface](docs/tasks/web.md)
- [Tâche QuickNode Streams](docs/tasks/quicknode.md)
