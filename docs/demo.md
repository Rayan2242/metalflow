# Scénarios de démo MetalFlow

Le prêteur finance une ligne de crédit et le négociant l’utilise pour répondre à un appel de marge simulé. Les deux parcours utilisent des USDC de test et se rejouent indépendamment. Les données d’exemple fournissent l’état initial, les événements dans l’ordre d’affichage et l’état final attendu. [Données d’exemple](examples/demo.json)

## Parcours 1 · Dépôt sur Arc, tirage et remboursement

1. Le prêteur propose une ligne de 7 USDC de test et le négociant l’accepte. La réserve et la dette démarrent à zéro.
2. Le prêteur dépose 7 USDC sur Arc Testnet. La réserve disponible passe à 7 USDC.
3. Le négociant présente un appel de marge simulé. Le validateur enregistre sur Arc une autorisation de tirage cumulée de 2 USDC pour cet appel.
4. Le négociant tire 2 USDC. La réserve disponible passe à 5 USDC et le principal restant dû passe à 2 USDC.
5. Le négociant rembourse 2 USDC. La réserve revient à 7 USDC et le principal restant dû à zéro. Le cumul des tirages de l’appel reste à 2 USDC et son autorisation est épuisée.

QuickNode Streams transmet les événements confirmés d’Arc qui alimentent le journal, de la proposition au remboursement.

## Parcours 2 · Revue de la réserve et apport depuis Base

1. Repartir d’une ligne acceptée, avec un appel de marge déjà validé pour 2 USDC et aucun tirage effectué, une réserve disponible de 1 USDC de test et un principal dû de zéro.
2. Un signal Gemini simulé signale que la réserve est inférieure au tirage attendu de 2 USDC. Un opérateur ouvre une revue de la réserve et prévoit un apport net de 6 USDC.
3. CCTP achemine l’apport depuis Base Sepolia vers Arc Testnet. Une fois le message CCTP issu du transfert sur Base identifié, l’opérateur associe son hash à la revue. Pendant le transfert, le disponible reste à 1 USDC. Après confirmation et rapprochement du crédit de 6 USDC nets sur Arc, le disponible passe à 7 USDC et la revue est terminée.
4. Le négociant tire 2 USDC. Le disponible final est de 5 USDC et le principal dû de 2 USDC.

Le journal affiche les entrées simulées hors chaîne à côté du crédit confirmé sur Arc et du tirage reçus via QuickNode Streams. Le montant net correspond à ce que la réserve reçoit sur Arc après les éventuels frais. L’enveloppe de 7 USDC et les soldes des deux parcours supposent zéro intérêt et zéro frais de tirage ou de remboursement pour la démo.

## États partagés

| Champ | Valeurs | Règles de la démo |
| --- | --- | --- |
| `creditLineStatus` | `NONE`, `PROPOSED`, `ACCEPTED` | La proposition crée la ligne. Seul le négociant désigné l’accepte. Dans l’ABI, l’énumération vaut respectivement 0, 1 et 2. |
| `marginCallStatus` | `NONE`, `VALIDATED` | La validation simulée est rattachée à un `marginCallId`. Un tirage référence un appel validé. |
| `marginCallMaxAmountUsdc` | Entier positif après validation | Montant cumulé autorisé pour le couple `lineId` et `marginCallId`. Le validateur le fixe une seule fois. Vaut zéro avant validation. |
| `marginCallDrawnAmountUsdc` | Entier positif ou nul | Somme des tirages confirmés pour cet appel depuis sa validation. Les remboursements la laissent à sa valeur courante. |
| `reserveReviewStatus` | `NONE`, `OPEN`, `COMPLETED` | L’ouverture est liée à un signal et annonce le montant net attendu. Le message CCTP est associé à la revue une fois identifié sur Base. Le crédit confirmé sur Arc termine la revue si la ligne, le hash et le montant net correspondent. |
| `limitUsdc` | Entier positif après proposition | Vaut zéro dans l’état initial `NONE`. Le principal dû après tirage reste inférieur ou égal au plafond. La ligne conserve son plafond après remboursement. |
| `availableReserveUsdc` | Entier positif ou nul | Solde disponible de la réserve associée à la ligne. Les dépôts, apports nets et remboursements le créditent. Les tirages le débitent. |
| `outstandingPrincipalUsdc` | Entier positif ou nul | Le tirage augmente le principal et le remboursement le réduit. Le montant remboursé est borné par le principal dû. |

La démo modélise une réserve par ligne et un seul appel de marge suivi par ligne dans les instantanés. Un tirage requiert une ligne acceptée, un appel de marge validé, assez de réserve et une capacité suffisante sous les deux plafonds. Le plafond de la ligne s’applique au principal encore dû. Le maximum de l’appel s’applique au cumul de ses tirages. Le remboursement modifie les soldes et la ligne reste acceptée.

## Événements partagés

Tous les événements portent un `lineId`. Les adresses et les hashes sont des chaînes hexadécimales avec le préfixe `0x`. Les identifiants Solidity, les numéros de bloc et les montants sont des chaînes décimales en JSON. Utiliser les unités minimales à six décimales, par exemple `"7000000"` pour 7 USDC et `"2000000"` pour 2 USDC.

| Événement | Origine | Données en plus de `lineId` | Effet |
| --- | --- | --- | --- |
| `CreditLineProposed` | Arc | `lender`, `trader`, `limitUsdc` | Crée la ligne proposée. |
| `CreditLineAccepted` | Arc | — | Passe la ligne à `ACCEPTED`. |
| `ReserveDeposited` | Arc | `amountUsdc` | Crédite le dépôt sur Arc. |
| `MarginCallValidated` | Arc | `marginCallId`, `maxAmountUsdc` | Passe l’appel de marge simulé à `VALIDATED` et enregistre le maximum autorisé. |
| `GeminiSignalRecorded` | Simulation | `signalId`, `reason` | Ajoute le signal au journal. |
| `ReserveReviewOpened` | Simulation | `reviewId`, `signalId`, `expectedNetAmountUsdc` | Ouvre la revue de réserve. |
| `ReserveReviewTransferLinked` | Simulation | `reviewId`, `messageHash` | Associe le transfert observé sur Base à la revue. |
| `ReserveFundedViaCctp` | Arc | `messageHash`, `netAmountUsdc` | Crédite une fois le montant net reçu sur Arc et permet de terminer la revue correspondante. |
| `CreditDrawn` | Arc | `marginCallId`, `amountUsdc` | Débite le disponible, augmente le principal dû et incrémente le cumul des tirages de l’appel. |
| `CreditRepaid` | Arc | `amountUsdc` | Crédite le disponible et réduit le principal dû. |

Le schéma Solidity porte les noms et paramètres des événements Arc. Le format normalisé du journal contient `name`, `source` et `data`. Pour `source: "arc"`, les champs de provenance `chainId`, `blockNumber`, `transactionHash` et `logIndex` figurent sur l’enveloppe. `chainId` (5042002 pour Arc Testnet) et `logIndex` sont des entiers JSON. Le journal déduplique sur le triplet `(chainId, transactionHash, logIndex)` et ordonne les événements d’Arc par bloc puis index de log. Un crédit CCTP s’identifie aussi par son `messageHash` pour éviter un second crédit. La source `"simulation"` utilise un `eventId` stable pour les entrées hors chaîne. Toutes les adresses et les transactions des exemples sont fictives. [Interface Solidity](../contracts/contracts/IMetalFlowEvents.sol)
