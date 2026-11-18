# Contrat de crédit MetalFlow

Depuis la racine du dépôt, avec Node.js 24 et npm.

```bash
npm ci --prefix contracts
npm --prefix contracts run compile
npm --prefix contracts test
npm --prefix contracts exec -- tsc -p contracts/tsconfig.json
```

## Parcours 1

Le prêteur appelle `proposeCreditLine(trader, 7000000)` et récupère le `lineId` dans `CreditLineProposed`. Le négociant désigné appelle `acceptCreditLine(lineId)`. Le prêteur approuve ensuite le contrat pour `7000000` sur le jeton USDC et appelle `depositReserve(lineId, 7000000)`.

Le validateur désigné appelle `validateMarginCall(lineId, marginCallId)` avec l’identifiant non nul de l’appel simulé. Le négociant appelle `drawCredit(lineId, marginCallId, 2000000)`, approuve le contrat pour `2000000` sur le jeton USDC, puis appelle `repayCredit(lineId, 2000000)`. `creditLines(lineId)` donne le plafond, le disponible et le principal dû en unités USDC à six décimales.

## Déploiement sur Arc Testnet

Définir `ARC_DEPLOYER_PRIVATE_KEY` dans l’environnement avec la clé d’un compte financé en USDC de test pour le gaz et `ARC_MARGIN_VALIDATOR` avec l’adresse qui validera les appels simulés. Le script utilise `https://rpc.testnet.arc.network` par défaut. `ARC_RPC_URL` permet de configurer un autre endpoint Arc Testnet. Le contrat utilise l’interface ERC-20 des USDC d’Arc à l’adresse `0x3600000000000000000000000000000000000000`.

```bash
npm --prefix contracts run deploy:arc
```

Après confirmation de la transaction, le script affiche le `chainId` (5042002), l’`address` du contrat, son `blockNumber` et le `transactionHash`. Transmettre l’adresse et le bloc à QuickNode pour configurer le filtre du stream.

Pour décoder les événements, utiliser la propriété `abi` de `contracts/artifacts/contracts/IMetalFlowEvents.sol/IMetalFlowEvents.json`, généré par la compilation. L’ABI complète du contrat est dans `contracts/artifacts/contracts/MetalFlowCreditLine.sol/MetalFlowCreditLine.json`.
