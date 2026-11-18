# Alimenter le journal avec QuickNode Streams

Configurer un stream Arc Testnet pour l’adresse de déploiement et décoder les événements à l’aide de l’ABI livrée par le chantier contrat. Livrer un point d’ingestion et une sortie normalisée pour l’interface. [Scénario et schéma](../demo.md)

## Critères d’acceptation

- Le filtre retient les événements du contrat à partir de son bloc de déploiement. L’ingestion authentifie les livraisons et publie les événements avec la provenance et les montants attendus.
- La reprise après interruption, les livraisons dupliquées et les réorganisations sont couvertes. La projection respecte l’ordre canonique sur Arc et ne rend les changements de soldes visibles qu’après le seuil de confirmation retenu.
- Un crédit CCTP est rapproché par son hash et compté une fois. Le journal affiche les entrées de simulation produites par le parcours de revue avec leur propre provenance et identifiant.
- Un rejeu local des exemples produit les événements et les soldes attendus. Un test d’intégration sur Arc Testnet valide la réception et la normalisation d’un événement du contrat déployé.
