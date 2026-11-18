# Construire l’interface de démo

Ajouter les écrans prêteur et négociant, la revue de réserve et le journal dans Next.js. Utiliser les exemples pour construire et vérifier le parcours en local. Relier les actions au contrat Arc et le journal à la sortie normalisée de QuickNode quand ces dépendances sont disponibles. [Scénario et schéma](../demo.md)

## Critères d’acceptation

- Le prêteur peut proposer une ligne et la financer. Le négociant peut l’accepter, voir la validation simulée, tirer 2 USDC et les rembourser.
- La revue montre le signal Gemini simulé, l’apport attendu de 6 USDC et la réception sur Arc. Le disponible reste à 1 USDC jusqu’à la confirmation, passe à 7 USDC, puis à 5 USDC après tirage.
- L’interface affiche le disponible et le principal dû, ainsi que les transactions en attente, confirmées ou échouées. Le journal indique la provenance des entrées et les actions respectent le rôle courant.
- Les deux jeux d’exemple permettent de vérifier les soldes affichés et l’ordre du journal sans service distant.
