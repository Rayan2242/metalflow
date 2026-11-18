# Implémenter la ligne de crédit et la réserve sur Arc

Livrer le contrat Solidity qui fait évoluer les états et émet les événements de l’interface commune. Ajouter un déploiement Arc Testnet et des tests Hardhat avec USDC de test ou un jeton simulé. [Scénario et schéma](../demo.md)

## Critères d’acceptation

- Le prêteur propose la ligne et dépose 7 USDC après l’acceptation du négociant désigné. La validation simulée est réservée à un rôle désigné.
- Le contrat vérifie l’appel validé, le plafond, le disponible et les rôles. Pour un tirage puis un remboursement de 2 USDC, les soldes intermédiaires et finaux correspondent aux exemples.
- Un dépôt CCTP depuis Base Sepolia est rapproché d’un crédit USDC vérifié sur Arc. Une réserve ouverte à 1 USDC reçoit une seule fois les 6 USDC nets. Les 2 USDC tirés laissent 5 USDC disponibles et 2 USDC dus.
- Les tests couvrent au minimum les appels non autorisés, le tirage sans validation ou sans solde suffisant, le remboursement excessif et le rejeu du même message CCTP. L’ABI des événements et le bloc de déploiement sont fournis au chantier QuickNode.
