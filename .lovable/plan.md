# Réorganisation de Community Manager AI

## Résultat attendu
- Regrouper sous **Community Manager AI** les onglets Posts, Calendrier, Studio image, Studio vidéo et Configuration.
- Retirer Studio vidéo du menu principal pour éviter le doublon.
- Ajouter une vue **Agenda** au calendrier, avec les événements classés chronologiquement par jour.
- Corriger le logo BMC afin qu'une version lisible soit automatiquement utilisée en mode sombre.
- Retirer les trois KPI de l'écran de connexion sans modifier les accès de démonstration.

## Mise en œuvre
- Déplacer la page Studio vidéo vers `/cm/studio-video` et mettre à jour ses liens internes.
- Créer `/cm/studio-image` en réutilisant la médiathèque et le générateur d’images existants.
- Étendre le sélecteur du calendrier avec `Agenda` et une liste groupée par date.
- Adapter le composant du logo au thème actif, sans flash visuel au chargement.
- Conserver le mode clair par défaut et toute la logique locale existante.

## Vérification
- Contrôler le menu et les cinq onglets sur largeur desktop et mobile.
- Tester les vues Mois, Semaine, Jour et Agenda.
- Vérifier le logo en clair et sombre, puis l'écran de connexion sans KPI.
