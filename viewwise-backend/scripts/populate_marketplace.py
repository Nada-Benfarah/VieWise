import django
import random
import sys
import os
import time

# 🔥 Ajouter viewwise-backend/ dans le chemin Python
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


# 📌 Initialise Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ViewWise.settings')
django.setup()

from agents.models import Agent, DataSource, Modele
from marketplace.models import Marketplace
from django.db import connection
from django.apps import apps

# 📌 Données de base
CATEGORIES = ["Commercialisation", "Entreprise", "Éducation", "Général", "Ventes", "Ingénierie", "Légal"]
TAGS_POOL = [
    "Assistant, Automatisation", "Réseaux sociaux, Facebook", "Twitter, Blog",
    "LinkedIn, Professionnel", "Analyse, Données", "CRM, Lead", "IA, Machine Learning"
]

EMAIL_CREATOR_ID = 1  # 👈 Ton user ID ici
NOMBRE_AGENTS = 50

def get_sequence_name(model, field_name='id'):
    meta = model._meta
    table_name = meta.db_table
    if field_name == 'id':
        sequence_name = f"{table_name}_id_seq"
    else:
        sequence_name = f"{table_name}_{field_name}_seq"
    return sequence_name

from django.db import transaction

def reset_database():
    print("=== Réinitialisation complète du système ===")

    Marketplace.objects.all().delete()
    Agent.objects.all().delete()
    print("🗑️ Agents et marketplace supprimés.")

    # 🔄 Correction des séquences
    with connection.cursor() as cursor:
        agent_seq = get_sequence_name(Agent, field_name='agentId')
        marketplace_seq = get_sequence_name(Marketplace, field_name='id')

        try:
            cursor.execute(f"SELECT setval(pg_get_serial_sequence('\"{Agent._meta.db_table}\"', 'agentId'), 1, false);")
            print(f"🔄 Séquence {agent_seq} réinitialisée à 1.")
        except Exception as e:
            print(f"⚠️ Impossible de réinitialiser {agent_seq} : {str(e)}")

        try:
            cursor.execute(f"SELECT setval(pg_get_serial_sequence('\"{Marketplace._meta.db_table}\"', 'id'), 1, false);")
            print(f"🔄 Séquence {marketplace_seq} réinitialisée à 1.")
        except Exception as e:
            print(f"⚠️ Impossible de réinitialiser {marketplace_seq} : {str(e)}")



def get_or_create_datasource():
    datasource, created = DataSource.objects.get_or_create(
        name="Datasource Générique",
        defaults={'type': 'local', 'config': {}}
    )
    if created:
        print(f"✅ Datasource créée : {datasource.name}")
    return datasource

def get_or_create_modele():
    modele, created = Modele.objects.get_or_create(
        name="GPT-4 Turbo",
        defaults={'description': "Modèle IA performant."}
    )
    if created:
        print(f"✅ Modèle IA créé : {modele.name}")
    return modele

def create_agents_and_marketplace(datasource, modele):
    agents_created = []

    for i in range(1, NOMBRE_AGENTS + 1):
        agent = Agent.objects.create(
            agentName=f"Agent IA {i}",
            agentRole=f"Rôle Agent {i}",
            agentObjective=f"Objectif principal de l'agent {i}",
            agentInstructions=f"Instruisez l'agent {i} d'être précis et efficace.",
            creator_id=EMAIL_CREATOR_ID,
            etat='draft',
            datasource=datasource,
            modele=modele
        )
        agents_created.append(agent)

    print(f"✅ {len(agents_created)} agents créés.")

    for idx, agent in enumerate(agents_created, start=1):
        Marketplace.objects.create(
            agent=agent,
            category=CATEGORIES[idx % len(CATEGORIES)],
            tags=TAGS_POOL[idx % len(TAGS_POOL)]
        )

    print(f"✅ {len(agents_created)} agents ajoutés au marketplace.")

def main():
    reset_database()

    datasource = get_or_create_datasource()
    modele = get_or_create_modele()

    create_agents_and_marketplace(datasource, modele)

    print("\n🎯 Script terminé : 50 agents + 50 marketplace recréés avec IDs propres à partir de 1.")

if __name__ == "__main__":
    main()
