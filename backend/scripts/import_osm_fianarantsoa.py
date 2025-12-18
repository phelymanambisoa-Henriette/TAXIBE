# scripts/import_osm_fianarantsoa.py
"""
Importe les lignes de bus/TaxiBe de Fianarantsoa depuis OpenStreetMap
dans les modèles existants : Ville, Quartier, Arret, Bus, Trajet, TrajetArret.
"""

import requests

from localisation.models import Ville, Quartier, Arret
from transport.models import Bus, Trajet, TrajetArret

OVERPASS_URL = "https://overpass-api.de/api/interpreter"

# Bounding box approximative de Fianarantsoa : (sud, ouest, nord, est)
BBOX = (-21.50, 47.05, -21.40, 47.15)


def build_overpass_query():
    south, west, north, east = BBOX
    return f"""
    [out:json][timeout:180];

    // Relations de bus/minibus/share_taxi dans la zone
    (
      relation["route"~"bus|minibus|share_taxi"]({south},{west},{north},{east});
    );

    out body;
    >;
    out body qt;
    """


def import_osm_fianarantsoa():
    print("=== Import OSM Fianarantsoa ===")

    # 1) Préparer Ville + Quartier
    ville, created_ville = Ville.objects.get_or_create(
        nomVille="Fianarantsoa",
        defaults={
            "codePostal": "301",
            "pays": "Madagascar",
        },
    )
    if created_ville:
        print("Ville créée :", ville)
    else:
        print("Ville existante utilisée :", ville)

    quartier, created_quartier = Quartier.objects.get_or_create(
        nomQuartier="OSM Import",
        villeRef=ville,
    )
    if created_quartier:
        print("Quartier créé :", quartier)
    else:
        print("Quartier existant utilisé :", quartier)

    # 2) Appel Overpass
    query = build_overpass_query()
    print("Appel Overpass...")
    resp = requests.post(OVERPASS_URL, data={"data": query}, timeout=180)
    resp.raise_for_status()
    data = resp.json()
    elements = data.get("elements", [])
    print(f"{len(elements)} éléments reçus")

    # 3) Indexation des nodes & relations
    nodes = {}
    relations = []

    for el in elements:
        if el.get("type") == "node":
            nodes[el["id"]] = el
        elif el.get("type") == "relation":
            relations.append(el)

    print(f"{len(nodes)} nodes, {len(relations)} relations de type route potentielle")

    # 4) Parcours des relations de bus
    for rel in relations:
        tags = rel.get("tags", {})
        route_type = tags.get("route")
        if route_type not in ("bus", "minibus", "share_taxi"):
            continue

        ref = tags.get("ref") or tags.get("name") or f"OSM_{rel['id']}"
        name = tags.get("name") or ref
        origin = tags.get("from", "")
        destination = tags.get("to", "")

        print(f"\nLigne OSM {rel['id']} - ref={ref} name={name}")

        # 4.a. Extraire les nodes d'arrêt dans l'ordre
        stop_nodes = []
        for m in rel.get("members", []):
            if m.get("type") != "node":
                continue
            node = nodes.get(m["ref"])
            if not node:
                continue
            ntags = node.get("tags", {})
            role = m.get("role", "")

            is_stop_role = role in ("", "stop", "platform", "stop_entry_only", "stop_exit_only")
            is_bus_stop_tag = (
                ntags.get("highway") == "bus_stop"
                or ntags.get("public_transport") in ("platform", "stop_position")
            )

            if is_stop_role or is_bus_stop_tag:
                stop_nodes.append(node)

        if len(stop_nodes) < 2:
            print("  -> ignorée (moins de 2 arrêts identifiables)")
            continue

        print(f"  {len(stop_nodes)} arrêts trouvés")

        # 4.b. Créer / réutiliser les Arrêts
        arrets = []
        for idx, node in enumerate(stop_nodes, start=1):
            ntags = node.get("tags", {})
            nom_arret = ntags.get("name") or f"Arrêt {idx} ({ref})"
            lat = node.get("lat")
            lon = node.get("lon")

            # On utilise nom + lat + lon pour éviter de recréer 50 fois le même arrêt
            arret, created_arret = Arret.objects.get_or_create(
                nomArret=nom_arret,
                latitude=lat,
                longitude=lon,
                defaults={
                    "villeRef": ville,
                    "quartier": quartier,
                },
            )
            arrets.append(arret)
            if created_arret:
                print(f"    + Arrêt créé : {arret.nomArret} ({lat}, {lon})")
            else:
                print(f"    = Arrêt existant réutilisé : {arret.nomArret}")

        # 4.c. Créer / mettre à jour le Bus
        bus, created_bus = Bus.objects.get_or_create(
            numeroBus=ref,
            villeRef=ville,
            defaults={
                "primus": arrets[0],
                "terminus": arrets[-1],
                "quartier": "",
                "status": "Actif",
                "frais": 600,
            },
        )
        if created_bus:
            print(f"  + Bus créé : {bus}")
        else:
            print(f"  = Bus existant mis à jour : {bus}")
            bus.primus = arrets[0]
            bus.terminus = arrets[-1]
            bus.save()

        # 4.d. (re)créer les Trajets et TrajetArret
        # On efface les trajets existants pour ce bus pour éviter les doublons
        bus.trajets.all().delete()

        trajet_aller = Trajet.objects.create(
            busRef=bus,
            typeTrajet="Aller",
            description=name or f"Aller {ref}",
        )
        trajet_retour = Trajet.objects.create(
            busRef=bus,
            typeTrajet="Retour",
            description=name or f"Retour {ref}",
        )

        # Aller
        for ordre, arret in enumerate(arrets, start=1):
            TrajetArret.objects.create(
                trajetRef=trajet_aller,
                arretRef=arret,
                ordrePassage=ordre,
                direction="Aller",
            )

        # Retour (liste inversée)
        for ordre, arret in enumerate(reversed(arrets), start=1):
            TrajetArret.objects.create(
                trajetRef=trajet_retour,
                arretRef=arret,
                ordrePassage=ordre,
                direction="Retour",
            )

        print(f"  Trajets créés pour le bus {bus.numeroBus} (Aller + Retour)")

    print("\n=== Import OSM terminé ===")


# Appel automatique quand le script est exécuté via `python manage.py shell < ...`
if __name__ == "__main__":
    import_osm_fianarantsoa()