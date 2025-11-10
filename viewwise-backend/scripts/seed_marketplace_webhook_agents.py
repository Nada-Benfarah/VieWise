# scripts/seed_marketplace_webhook_agents.py
import os, sys, django
from django.utils.text import Truncator

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "ViewWise.settings")
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
django.setup()

from django.db import transaction
from agents.models import Agent, DataSource, Modele, Link
from marketplace.models import Marketplace
from textwrap import dedent

CREATOR_ID = 12
DATASOURCE_NAME = "Marketplace JSON local"
MODELE_NAME = "GPT-4 Turbo"
MODELE_DESC = "Modèle de conversation IA utilisé par défaut."

def _truncate(txt, n):
    return Truncator(txt).chars(n) if txt else txt

def json_for_webhook(endpoint, inputs, example_curl, success_toast, run_label="Run", method="POST"):
    """
    Payload standardisé pour Link.url (JSONField) des webhooks.
    Le front peut lire:
      - type, method, endpoint, headers
      - inputs: [{name,label,type,required}]
      - example_curl: string
      - ui.run_label / ui.success_toast
    """
    return {
        "type": "webhook",
        "method": method,
        "endpoint": endpoint,
        "headers": {"Content-Type": "application/json"},
        "inputs": inputs,
        "example_curl": example_curl,
        "ui": {
            "run_label": run_label,
            "success_toast": success_toast
        },
        "values": { "email": "", "name": "" }
    }

def doc_guide(title, steps, notes, long_instructions=""):
    return {
        "type": "guide",
        "title": title,
        "steps": steps,
        "notes": notes,
        "long_instructions": long_instructions
    }

# =========================
# Agents with webhook
# =========================

AGENTS = [
    {
        # 1) Social Media Content Creator Agent
        "agentName": "Social Media Content Creator Agent",
        "agentRole": "Création et publication multicanale de posts sociaux automatisés",
        "agentObjective": (
            "Transformer des sources web/RSS en publications adaptées à LinkedIn, Facebook, Instagram et X, "
            "avec texte, visuels et hashtags, et journalisation dans Google Sheets."
        ),
        "agentInstructions": dedent("""\
            • Vous êtes une IA spécialisée dans la création et la diffusion de contenus pour les réseaux sociaux.
            • Vous recevez des informations issues de recherches web (requêtes Tavily, flux RSS, ou autres sources).
            • Votre mission est de :
            1. Analyser et filtrer les données pour ne conserver que les informations les plus pertinentes et d’actualité.
            2. Résumer et reformuler les articles ou sources en contenus clairs, concis et engageants.
            3. Générer des visuels pertinents via une IA d’image (par ex. image d’illustration, infographie, citation visuelle).
            4. Adapter chaque message au ton et au format spécifique de la plateforme :
                LinkedIn : ton professionnel, informatif et valorisant.
                Facebook : ton conversationnel et accessible.
                Instagram : style visuel, hashtags et phrases accrocheuses.
                X/Twitter : format court, percutant, avec mots-clés ou hashtags.
            5. Vérifier la cohérence linguistique, la pertinence et le respect des règles de chaque plateforme avant publication.
            6. Enregistrer les publications (texte, image, lien, date, plateforme) dans Google Sheets pour suivi et archivage.
            • Le ton doit être dynamique, engageant et adapté à l’audience ciblée, tout en conservant une cohérence de marque.
            • Ne pas inclure de contenu spéculatif, confidentiel ou politiquement sensible.
            • Soyez créatif, précis et cohérent. Chaque post doit pouvoir être publié tel quel sans retouche manuelle.
        """).strip(),
        "category": "Commercialisation",
        "tags": "Réseaux sociaux, RSS, OpenAI, Publication",
        "webhook": json_for_webhook(
            endpoint="https://nadabenfarah1.app.n8n.cloud/webhook/41c560fe-eb7a-4122-a7b7-c9f7431629d3",
            inputs=[
                {"name": "email", "label": "Email de notification", "type": "email", "required": True},
                {"name": "name", "label": "Nom de l’expéditeur (optionnel)", "type": "string", "required": False},
            ],
            example_curl=(
                'curl -X POST "https://nadabenfarah1.app.n8n.cloud/webhook/41c560fe-eb7a-4122-a7b7-c9f7431629d3" '
                '-H "Content-Type: application/json" '
                '-d \'{"name": "nada", "email": "nadabenfarah7@gmail.com"}\''
            ),
            success_toast="Exécution lancée. Vérifiez l’email de confirmation."
        ),
        "guide": doc_guide(
            title="Création de contenu social automatisée",
            steps=[
                "Cloner l’agent depuis la marketplace.",
                "Renseigner l’email de notification dans la pop-up.",
                "Cliquer sur Run pour lancer la génération/publication.",
                "Consulter l’email; répéter Run à chaque nouvelle exécution."
            ],
            notes="La notification confirme le déclenchement après Run; l’email récapitule les publications.",
            long_instructions=(
                "L’agent lit des flux web/RSS, sélectionne et reformule en posts adaptés à chaque plateforme, "
                "peut générer des visuels, et journalise les sorties (texte, image, lien, date, plateforme). "
                "Le ton est engageant, concis et cohérent avec la marque."
            )
        )
    },
    {
        # 2) Multi-Timeframe Stock Analysis AI
        "agentName": "Multi-Timeframe Stock Analysis AI",
        "agentRole": "Analyse boursière multi-échelles et sentiment d’actualités",
        "agentObjective": (
            "Analyser un symbole (15m/1h/1j/1w), agréger prix+sentiment et produire un rapport HTML synthétique envoyé par email."
        ),
        "agentInstructions": dedent("""\
            • Vous êtes une IA analyste des marchés financiers.
            • Pour chaque symbole boursier reçu :
              o Collectez et traitez les données de prix (15m, 1h, 1j, 1w).
              o Analysez les actualités financières récentes et évaluez le sentiment (positif, neutre, négatif).
            • Réalisez :
              o Une analyse court terme (15m + 1h) → tendances, volatilité, signaux rapides.
              o Une analyse long terme (1j + 1w) → trajectoires, stabilité, potentiel.
              o Une synthèse globale combinant marché et sentiment :
                 direction dominante,
                 force de la tendance,
                 corrélation entre sentiment et évolution des prix.
            • Fournissez un résumé analytique clair, objectif et structuré, accompagné d’indications visuelles (ex. “see chart below”).
            • Le ton doit être professionnel, analytique et neutre — pas de spéculation financière.
            • La sortie doit être formatée pour un rapport HTML envoyé par email.
        """).strip(),
        "category": "Entreprise",
        "tags": "Bourse, Sentiment, Rapport HTML, OpenAI",
        "webhook": json_for_webhook(
            endpoint="https://nadabenfarah1.app.n8n.cloud/webhook/d3ea6c4b-4ee7-4620-b32a-c95fa7965d31",
            inputs=[
                {"name": "email", "label": "Email de réception", "type": "email", "required": True},
                {"name": "stock_name", "label": "Symbole boursier", "type": "string", "required": True},
            ],
            example_curl=(
                'curl -X POST "https://nadabenfarah1.app.n8n.cloud/webhook/d3ea6c4b-4ee7-4620-b32a-c95fa7965d31" '
                '-H "Content-Type: application/json" '
                '-d \'{"stock_name": "Tesla", "email": "nadabenfarah7@gmail.com"}\''
            ),
            success_toast="Analyse lancée. Rapport envoyé par email."
        ),
        "guide": doc_guide(
            title="Analyse boursière multi-échelles",
            steps=[
                "Cloner l’agent depuis la marketplace.",
                "Saisir l’email et le symbole boursier dans la pop-up.",
                "Cliquer sur Run pour démarrer l’analyse.",
                "Consulter l’email contenant le rapport HTML; relancer via Run si besoin."
            ],
            notes="Le rapport synthétise court/long terme et l’alignement prix/sentiment.",
            long_instructions=(
                "L’agent collecte des prix sur plusieurs horizons, calcule des signaux de tendance et agrège un score "
                "de sentiment d’actualités récentes. La sortie est un rapport HTML concis, exploitable en décisionnel."
            )
        )
    },
    {
        # 3) AI Newsletter System
        "agentName": "AI Newsletter System",
        "agentRole": "Génération et mise en forme de newsletter professionnelle",
        "agentObjective": (
            "Construire une newsletter HTML cohérente sur un sujet donné, avec titre, introduction et trois sections sourcées."
        ),
        "agentInstructions": dedent("""\
            • Vous êtes une IA spécialisée dans la rédaction de newsletters professionnelles assistées par IA.
            • Pour chaque requête, vous recevrez un sujet d’intérêt et des articles de référence issus d’une recherche web.
            • Analysez le contenu et :
              o Extrayez 3 sous-thèmes cohérents et complémentaires.
              o Rédigez un titre créatif et une introduction synthétique.
              o Rédigez 3 sections (une par sous-thème), chacune avec :
                 un titre clair,
                 un texte concis et informatif,
                 au moins une citation ou référence vérifiable avec une URL.
              o Concluez par une phrase de synthèse professionnelle.
            • Le ton doit être formel, clair et engageant, adapté à des lecteurs en entreprise.
            • La sortie doit être un texte HTML complet contenant les champs :
              o subject → objet de l’email
              o content → contenu de la newsletter en HTML
            • Assurez-vous que le texte complet ne dépasse pas 1000 mots.
        """).strip(),
        "category": "Général",
        "tags": "Newsletter, Recherche web, HTML, OpenAI",
        "webhook": json_for_webhook(
            endpoint="https://nadabenfarah1.app.n8n.cloud/webhook/9d23e202-cf8d-4f89-b7e3-312d58c3e7f4",
            inputs=[
                {"name": "email", "label": "Email de réception", "type": "email", "required": True},
                {"name": "topic", "label": "Sujet de la newsletter", "type": "string", "required": True}
            ],
            example_curl=(
                'curl -X POST "https://nadabenfarah1.app.n8n.cloud/webhook/9d23e202-cf8d-4f89-b7e3-312d58c3e7f4" '
                '-H "Content-Type: application/json" '
                '-d \'{"email": "nadabenfarah7@gmail.com", "topic": "Electric cars"}\''
            ),
            success_toast="Newsletter générée. Vérifiez votre boîte de réception."
        ),
        "guide": doc_guide(
            title="Générateur de newsletter IA",
            steps=[
                "Cloner l’agent depuis la marketplace.",
                "Saisir l’email et le sujet dans la pop-up.",
                "Cliquer sur Run pour générer la newsletter.",
                "Ouvrir l’email et récupérer subject et content (HTML)."
            ],
            notes="La notification confirme l’envoi; l’email contient le rendu final.",
            long_instructions=(
                "L’agent réalise une recherche web, sélectionne trois sous-thèmes, produit un titre, une introduction "
                "et trois sections courtes, chacune avec une référence vérifiable. Le rendu final est propre et lisible."
            )
        )
    },
]


def get_or_create_defaults():
    ds, _ = DataSource.objects.get_or_create(
        name=DATASOURCE_NAME,
        defaults={"type": "local", "config": {}}
    )
    mdl, _ = Modele.objects.get_or_create(
        name=MODELE_NAME,
        defaults={"description": MODELE_DESC}
    )
    return ds, mdl

@transaction.atomic
def upsert_agent_with_webhook(entry, datasource, modele):
    role_max = Agent._meta.get_field('agentRole').max_length or 255
    category = _truncate(entry.get("category", "") or "", 100)
    tags = _truncate(entry.get("tags", "") or "", 255)
    role = _truncate(entry.get("agentRole", "") or "", role_max)

    # Upsert Agent
    agent, created = Agent.objects.get_or_create(
        agentName=entry["agentName"],
        defaults={
            "agentRole": role,
            "agentObjective": entry["agentObjective"],
            "agentInstructions": entry["agentInstructions"],
            "creator_id": CREATOR_ID,
            "etat": "draft",
            "datasource": datasource,
            "modele": modele
        }
    )
    if not created:
        agent.agentRole = role
        agent.agentObjective = entry["agentObjective"]
        agent.agentInstructions = entry["agentInstructions"]
        agent.datasource = datasource
        agent.modele = modele
        agent.save()

    # Upsert Marketplace
    mp, mp_created = Marketplace.objects.get_or_create(
        agent=agent,
        defaults={"category": category, "tags": tags}
    )
    if not mp_created:
        mp.category = category
        mp.tags = tags
        mp.save()

    # Link "webhook"
    if entry.get("webhook"):
        payload = entry["webhook"]  # dict (endpoint, inputs, example_curl, ui…)
        wlink, w_created = Link.objects.get_or_create(
            agent=agent,
            source_name="webhook",
            defaults={"url": payload}
        )
        if not w_created:
            wlink.url = payload
            wlink.save()

    # Link "guide"
    if entry.get("guide"):
        glink, g_created = Link.objects.get_or_create(
            agent=agent,
            source_name="guide",
            defaults={"url": entry["guide"]}
        )
        if not g_created:
            glink.url = entry["guide"]
            glink.save()

    return agent, created

def main():
    ds, mdl = get_or_create_defaults()
    created = updated = 0
    for item in AGENTS:
        _, is_created = upsert_agent_with_webhook(item, ds, mdl)
        created += 1 if is_created else 0
        updated += 0 if is_created else 1
    print(f"Créés: {created} | Mis à jour: {updated}")
    print(f"Agents totaux: {Agent.objects.count()}")
    print(f"Marketplace totaux: {Marketplace.objects.count()}")

if __name__ == "__main__":
    main()
