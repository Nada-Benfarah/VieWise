import requests
import time

# Configuration de base
base_url = "http://localhost:8000"
login_url = f"{base_url}/auth/login/"
agents_url = f"{base_url}/api/agents/"
marketplace_url = f"{base_url}/api/marketplace/"

email = "sofiene.bouguerra.1996@gmail.com"     # Remplacer par ton vrai email
password = "00000000"            # Remplacer par ton vrai mot de passe
creator_id = 2
datasource_id = 1
modele_id = 1

categories = ["Commercialisation", "Entreprise", "Éducation", "Général", "Ventes", "Ingénierie", "Légal"]
tags_pool = [
    "Assistant, Automatisation", "Réseaux sociaux, Facebook", "Twitter, Blog",
    "LinkedIn, Professionnel", "Analyse, Données", "CRM, Lead", "IA, Machine Learning"
]

# 1. Connexion pour récupérer le token
login_data = {
    "email": email,
    "password": password
}

login_response = requests.post(login_url, json=login_data)

if login_response.status_code != 200:
    print(f"❌ Erreur de connexion : {login_response.text}")
    exit()

token = login_response.json()['access']

# 2. Définir les headers avec Authorization
headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {token}"
}

print("✅ Connexion réussie, token récupéré.")

# Liste pour stocker les IDs des agents créés
created_agents_ids = []

# 3. Création des agents
for i in range(1, 51):
    agent_data = {
        "agentName": f"Agent IA {i}",
        "agentRole": f"Rôle Agent {i}",
        "agentObjective": f"Objectif principal de l'agent numéro {i} : aider les utilisateurs à améliorer leur productivité grâce à l'IA.",
        "agentInstructions": f"Instruisez l'agent {i} d'être précis, amical et efficace.",
        "creator": creator_id,
        "etat": "draft",
        "datasource": datasource_id,
        "modele": modele_id
    }

    try:
        response = requests.post(agents_url, json=agent_data, headers=headers)
        if response.status_code == 201:
            agent_id = response.json().get('agentId') or response.json().get('id')
            if agent_id:
                created_agents_ids.append(agent_id)
                print(f"✅ Agent {i} créé avec ID {agent_id}")
            else:
                print(f"⚠️ Agent {i} créé mais ID non trouvé dans la réponse")
        else:
            print(f"❌ Erreur lors de la création de l'agent {i} : {response.text}")
        time.sleep(0.1)
    except Exception as e:
        print(f"❌ Exception lors de la création de l'agent {i} : {str(e)}")

# 4. Ajout au marketplace
for idx, agent_id in enumerate(created_agents_ids, 1):
    marketplace_data = {
        "agent": agent_id,
        "category": categories[idx % len(categories)],
        "tags": tags_pool[idx % len(tags_pool)]
    }

    try:
        response = requests.post(marketplace_url, json=marketplace_data, headers=headers)
        if response.status_code == 201:
            print(f"✅ Agent {agent_id} ajouté au marketplace")
        else:
            print(f"❌ Erreur lors de l'ajout de l'agent {agent_id} au marketplace : {response.text}")
        time.sleep(0.1)
    except Exception as e:
        print(f"❌ Exception lors de l'ajout au marketplace pour agent {agent_id} : {str(e)}")

print("\n🎯 Script terminé. 50 agents créés et publiés sur le marketplace.")
