# backend/scripts/add_mock_stops.py
from localisation.models import Arret, Quartier, Ville

ville = Ville.objects.first()  # ou créer une ville
quartier = Quartier.objects.create(nomQuartier="Centre-ville", villeRef=ville)

arrets = [
    {"nomArret": "Analakely", "latitude": -18.9103, "longitude": 47.5255},
    {"nomArret": "Ambohijatovo", "latitude": -18.9150, "longitude": 47.5280},
    {"nomArret": "Antanimena", "latitude": -18.8950, "longitude": 47.5200},
    # ... autres arrêts
]

for data in arrets:
    Arret.objects.create(
        **data,
        villeRef=ville,
        quartier=quartier
    )

print(f"✅ {len(arrets)} arrêts créés")