import os, sys, django, json
from django.utils.text import Truncator

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "ViewWise.settings")
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
django.setup()

from django.db import transaction
from django.core.files.base import File
from django.conf import settings
from django.contrib.auth import get_user_model
from agents.models import Agent, DataSource, Modele, AgentFile, Link
from marketplace.models import Marketplace
from textwrap import dedent

# ───────────────────────────
# Paramètres généraux
# ───────────────────────────
CREATOR_ID = 12
DATASOURCE_NAME = "Marketplace JSON local"
MODELE_NAME = "GPT-4 Turbo"
MODELE_DESC = "Modèle de conversation IA utilisé par défaut."
TEMPLATES_DIR = os.path.join(os.path.dirname(__file__), "templates")  # scripts/templates/*.json

# ───────────────────────────
# Données « sans webhook » extraites du document
# ───────────────────────────


AGENTS = [
    {
        "agentName": "Calendar Management AI Agent",
        "agentRole": "Assistante agenda via Telegram et Google Calendar",
        "agentObjective": "Planifier et tenir à jour l’agenda à partir d’instructions naturelles, texte ou audio.",
        "agentInstructions": dedent("""\
                   • Vous êtes une IA assistante personnelle spécialisée dans la gestion d’agenda.
                   • Vous interagissez avec l’utilisateur via Telegram et traitez aussi bien les messages texte que les commandes vocales.
                   • Votre fonctionnement suit les étapes suivantes :
                   1. Réception du message utilisateur via Telegram (texte ou audio).
                   2. Si un fichier audio est reçu, effectuez une transcription automatique afin de convertir la parole en texte clair et compréhensible.
                   3. Transmettez le texte obtenu à l’Agent IA principal, qui analyse la requête et détermine l’action à exécuter (ajouter, modifier, supprimer ou consulter un événement).
                   4. Utilisez OpenAI (modèle de langage) pour interpréter les intentions de l’utilisateur et formuler des réponses naturelles et pertinentes.
                   5. Maintenez la mémoire du contexte via un module de type Window Buffer Memory pour permettre une conversation fluide sur plusieurs tours.
                   6. Effectuez les opérations demandées sur Google Calendar :
                       Création d’un nouvel événement (titre, date, heure, description).
                       Mise à jour d’un événement existant.
                       Suppression d’un événement.
                       Consultation de la liste des événements planifiés.
                   7. Si nécessaire, laissez la possibilité à l’utilisateur d’effectuer une correction manuelle via un champ d’édition (vérification humaine optionnelle).
                   8. Après chaque action, envoyez un message de confirmation clair et concis sur Telegram, indiquant le résultat de l’opération (ex. : “Votre réunion a bien été ajoutée pour demain à 15h.”).
                   • Le ton doit être courtois, professionnel et fluide, imitant un assistant personnel réactif et organisé.
                   • Ne proposez jamais de contenu non sollicité, et évitez tout traitement d’informations sensibles sans consentement explicite.
               """).strip(),
        "category": "Général",
        "tags": "Calendrier, Telegram, Google",
        "template_file": "calendar_management.json",
        "guide": {
            "type": "guide",
            "title": "Installation du workflow n8n – Agent IA de gestion de calendrier",
            "steps": [
                dedent("""\
                🧠 Guide d’installation du Workflow “Agent IA de gestion de calendrier” sur n8n
                📘 Description du workflow
                Ce workflow est un assistant IA intelligent dédié à la gestion automatisée du calendrier Google à partir de Telegram.
                Il combine OpenAI, Telegram et Google Calendar pour permettre à l’utilisateur de gérer ses événements via des commandes textuelles ou vocales.
                Le processus fonctionne ainsi :
                • L’utilisateur envoie un message (texte ou audio) sur Telegram.
                • Si le message est vocal, il est automatiquement transcrit en texte.
                • Le message est analysé par un agent IA alimenté par OpenAI, qui comprend la demande (créer, mettre à jour, supprimer ou afficher des événements).
                • L’action est exécutée directement sur Google Calendar.
                • Enfin, le bot envoie un retour clair via Telegram (confirmation ou résultat).
                Cet assistant agit comme un secrétaire intelligent capable de gérer vos événements à la voix ou par texte, en maintenant le contexte grâce à une mémoire conversationnelle.
                ________________________________________
                ⚙️ Étapes d’installation et d’activation
                1️⃣ Télécharger le fichier du workflow
                • Rendez-vous sur la marketplace View Wise.
                • Recherchez “Agent IA de gestion de calendrier”.
                • Cliquez sur “Download Template” pour télécharger le fichier .json sur votre ordinateur.
                ________________________________________
                2️⃣ Créer un compte sur n8n
                • Rendez-vous sur le site officiel : 👉 https://app.n8n.cloud
                • Créez un compte gratuit si vous n’en avez pas encore.
                ________________________________________
                3️⃣ Avoir un compte Google (Gmail)
                Assurez-vous d’avoir un compte Google actif avec accès à Google Calendar, car le workflow interagit directement avec ce service.
                ________________________________________
                4️⃣ Configurer Telegram pour le bot
                Le workflow communique via Telegram, il faut donc créer un bot et obtenir un Token ID et un Chat ID.
                🔹 Étapes pour obtenir le Token ID
                1. Ouvrez Telegram et recherchez BotFather.
                2. Ouvrez la conversation et tapez :
                3. /start
                4. /newbot
                5. Donnez un nom à votre bot, par exemple : calendar.
                6. Donnez-lui un identifiant unique, par exemple : nacalendar13_bot.
                7. Vous recevrez un message contenant un Access Token (clé d’accès).
                👉 Copiez ce Token ID, il sera utilisé pour connecter tous les composants Telegram.
                📺 Tutoriel vidéo recommandé :
                👉 Créer un Bot Telegram et obtenir le Token ID - Étape par Étape
                🔹 Connecter Telegram à n8n
                1. Cliquez sur les composants Telegram Trigger et Telegram (send message).
                2. Cliquez sur “Create New Credential”.
                3. Ajoutez votre Token ID .
                4. Cliquez sur Save.
                Une fois connecté, ouvrez votre chat bot Telegram (t.me/nacalendar13_bot) et tapez /start.
                Vous pouvez ensuite interagir avec lui pour :
                • Créer un événement,
                • Mettre à jour un événement,
                • Supprimer un événement,
                • Récupérer la liste des événements.
                ________________________________________
                5️⃣ Configurer les composants OpenAI et Transcribe
                • Cliquez sur les composants OpenAI Chat Model et Transcribe.
                • Il suffit de les ouvrir puis de les fermer, aucune modification n’est requise (ils sont déjà préconfigurés).
                ________________________________________
                6️⃣ Configurer les composants Google Calendar
                Le workflow inclut plusieurs composants liés à Google Calendar :
                • Create Event
                • Update Event
                • Delete Event
                • Get All Events
                Étapes de configuration :
                1. Cliquez sur chaque composant Google Calendar.
                2. Cliquez sur “Create New Credential”.
                3. Connectez-vous avec le compte Gmail que vous souhaitez utiliser pour votre calendrier.
                4. Ajouter votre adresse e-mail associé à votre calendrier dans le champ “Calendar”.
                ________________________________________
                7️⃣ Sauvegarder et activer le workflow
                1. Cliquez sur Save pour enregistrer vos modifications.
                2. Cliquez sur Execute Workflow pour tester manuellement.
                3. Ou basculez le bouton “Inactive → Active” pour activer le workflow.
                👉 Le workflow s’exécutera alors automatiquement à chaque nouveau message Telegram.
                ________________________________________
                💡 Exemple d’utilisation
                Depuis votre chat Telegram (t.me/nacalendar13_bot), vous pouvez envoyer :
                • 🗓️ “Crée un événement demain à 9h : réunion avec l’équipe marketing.”
                • ✏️ “Modifie l’événement de lundi, change l’heure à 14h.”
                • ❌ “Supprime l’événement déjeuner de vendredi.”
                • 📋 “Montre-moi tous mes événements de la semaine prochaine.”
                Le bot exécutera l’action sur votre Google Calendar et vous enverra une confirmation instantanée sur Telegram.
                ________________________________________
                🧩 Résumé du fonctionnement
                Ce workflow relie trois outils puissants :
                • Telegram : interface utilisateur simple et interactive.
                • OpenAI : interprétation intelligente du langage naturel (texte ou audio).
                • Google Calendar : gestion directe de vos événements.
                Vous bénéficiez d’un assistant personnel intelligent capable de :
                • Comprendre vos instructions vocales ou textuelles,
                • Interagir directement avec votre calendrier,
                • Maintenir le contexte de la conversation,
                • Vous informer en temps réel sur Telegram.
                ________________________________________
                ✅ Votre assistant de calendrier IA est prêt !
                Vous pouvez maintenant gérer votre emploi du temps à la voix ou par texte, sans jamais quitter Telegram 🧘‍♀️📅
                """).strip()
            ],
            "notes": "Le bot conserve un contexte (mémoire) et renvoie une confirmation claire pour chaque opération."
        }
    },
    {
        "agentName": "Outlook Management AI Agent",
        "agentRole": "Assistant Outlook pour e-mails et calendrier via Telegram",
        "agentObjective": "Gérer e-mails et événements Outlook par messages texte ou vocaux, avec réponses et confirmations en temps réel.",
         "agentInstructions": dedent("""\
                    • Vous êtes une IA assistante personnelle spécialisée dans la gestion intégrée des e-mails et du calendrier.
                    • Vous communiquez exclusivement via Telegram, en traitant à la fois les messages texte et les notes vocales.
                    • Le processus se déroule comme suit :
                    1. Réception du message utilisateur sur Telegram (texte ou audio).
                    2. Si un message vocal est reçu, il est téléchargé et transcrit automatiquement en texte clair.
                    3. Le message est ensuite transmis à l’Agent IA central, accompagné d’éventuelles données saisies manuellement dans les champs éditables.
                    4. L’agent utilise les modèles de langage d’OpenAI pour comprendre l’intention et répondre de manière naturelle et pertinente.
                    5. Une mémoire contextuelle (Window Buffer Memory) permet de conserver la continuité de la conversation sur plusieurs tours.
                    6. En fonction de la requête, l’assistant exécute des actions liées à Outlook, notamment :
                        📅 Gestion du calendrier : création, mise à jour, consultation ou suppression d’événements.
                        📧 Gestion des e-mails : envoi, réponse, brouillon, suppression ou organisation dans des dossiers.
                        🗂️ Organisation de la boîte mail : récupération des dossiers existants ou création de nouveaux dossiers.
                    7. Une fois l’action effectuée, l’assistant envoie une confirmation claire et immédiate à l’utilisateur sur Telegram (ex. : “Votre e-mail a bien été envoyé à Mme Dupont.”).
                    • Le ton doit rester professionnel, fluide et assistif, adapté à une utilisation en contexte professionnel.
                    • L’assistant doit être capable de gérer plusieurs types de commandes successives sans perdre le contexte.
                    • Aucune donnée sensible ne doit être utilisée ou conservée sans autorisation explicite.
                """).strip(),
        "category": "Entreprise",
        "tags": "Outlook, Email, Calendrier, Telegram",
        "template_file": "outlook_management.json",
        "guide": {
            "type": "guide",
            "title": "Installation du workflow n8n – Gestion Outlook",
            "steps": [
                dedent("""\
                📅 Guide d’installation du Workflow “Gestion Outlook” sur n8n
                🧠 Description du workflow
                Le workflow “Gestion Outlook” est un assistant personnel intelligent conçu pour gérer vos e-mails et événements Outlook directement depuis Telegram.
                Il vous permet d’effectuer, par simple message texte ou vocal, des actions telles que :
                • ✉️ Envoyer, répondre, créer ou supprimer des e-mails,
                • 🗂️ Créer et organiser des dossiers de messagerie,
                • 📆 Créer, modifier, récupérer ou supprimer des événements de calendrier,
                • 🤖 Recevoir en temps réel des réponses et confirmations sur Telegram.
                ________________________________________
                ⚙️ Étapes d’installation et d’activation
                1️⃣ Télécharger le fichier du workflow
                • Rendez-vous sur la marketplace View Wise.
                • Recherchez “Gestion Outlook”.
                • Cliquez sur “Download Template” pour télécharger le fichier .json sur votre ordinateur.
                ________________________________________
                2️⃣ Créer un compte sur n8n
                • Ouvrez le site officiel : 👉 https://app.n8n.cloud
                • Créez un compte gratuit si vous n’en avez pas encore.
                ________________________________________
                3️⃣ Avoir un compte Outlook
                • Assurez-vous d’avoir un compte Microsoft Outlook valide (Outlook.com, Office 365, ou Exchange Online).
                ________________________________________
                4️⃣ Configurer Telegram pour le bot
                Le workflow communique via Telegram. Vous devez créer un bot Telegram et récupérer votre Token ID et Chat ID.
                🔹 Étapes pour obtenir votre Token ID
                1. Ouvrez Telegram et recherchez BotFather.
                2. Ouvrez la discussion et tapez :
                3. /start
                4. /newbot
                5. Donnez un nom à votre bot, par exemple : outlookAuto.
                6. Donnez-lui un identifiant unique, par exemple : outlookAuto_bot.
                7. Vous recevrez un message contenant votre Access Token (clé d’accès).
                👉 Copiez ce Token : vous en aurez besoin pour connecter tous les composants Telegram.
                📺 Tutoriel vidéo recommandé :
                👉 Créer un Bot Telegram et obtenir le Token ID - Étape par Étape
                🔹 Connecter Telegram à n8n
                1. Cliquez sur les composants Telegram Trigger et Telegram (send message).
                2. Cliquez sur “Create New Credential”.
                3. Entrez votre Token ID .
                4. Sauvegardez.
                Une fois connecté, votre bot pourra interagir avec vous dans la discussion Telegram (par exemple : t.me/outlookAuto_bot).
                ________________________________________
                5️⃣ Configurer les composants Outlook
                Le workflow utilise plusieurs composants Outlook pour gérer e-mails et événements :
                • Send Email, Reply Email, Create Draft,
                • Delete Emails, Get Emails,
                • Create Folder, Folder Emails, Get Folders,
                • Create Event, Delete Event, Update Event, Get Events.
                Étapes :
                1. Cliquez sur chaque composant Outlook.
                2. Sélectionnez “Create New Credential”.
                3. Connectez-vous à votre compte Outlook.
                4. Sélectionnez le calendrier (Calendar) approprié dans le champ input (pour les composants liés aux événements).
                ________________________________________
                6️⃣ Configurer OpenAI et Transcribe
                • Cliquez simplement sur les composants OpenAI Chat Model et Transcribe, puis ouvrez et fermez sans modification.
                (Ils sont déjà configurés pour interpréter le texte et les audios envoyés depuis Telegram.)
                ________________________________________
                7️⃣ Sauvegarder et activer le workflow
                1. Cliquez sur le bouton “Save” en haut à droite.
                2. Cliquez sur “Execute Workflow” pour un test manuel.
                3. Ou activez le workflow en basculant le bouton “Inactive → Active”.
                👉 Le workflow s’exécutera alors automatiquement à chaque message Telegram.
                ________________________________________
                🤖 Fonctionnement général
                1. Vous envoyez un message texte ou vocal à votre bot Telegram.
                2. Le workflow le transcrit (si audio) et le comprend grâce à l’agent IA connecté à OpenAI.
                3. L’agent exécute la commande correspondante dans Outlook :
                   o Envoi d’un e-mail,
                   o Création ou suppression d’un événement,
                   o Organisation d’un dossier, etc.
                4. Une confirmation ou un résultat est renvoyé instantanément sur Telegram.
                Cela transforme votre Telegram en centre de commande intelligent Outlook, capable de comprendre vos instructions en langage naturel ou vocal 🎯.
                ________________________________________
                ✅ Votre workflow est prêt !
                Vous pouvez désormais piloter vos e-mails et votre calendrier Outlook directement depuis Telegram.
                Exemples de commandes :
                • 🗓️ « Crée un événement demain à 10h avec Ahmed. »
                • ✉️ « Envoie un mail à Sarah pour confirmer la réunion. »
                • 🗂️ « Supprime les e-mails de la semaine dernière. »
                """).strip()
            ],
            "notes": "Le flux gère des commandes successives sans perdre le contexte, ton professionnel et assistif."
        }
    },
    {
        "agentName": "Email Classification AI Agent",
        "agentRole": "Agent de tri et traitement automatisé des e-mails Gmail",
        "agentObjective": "Classifier, résumer et traiter les e-mails (priorité, support, promotions, finance) et notifier sur Telegram.",
        "agentInstructions": dedent("""\
                    • Vous êtes une IA spécialisée dans la classification et la gestion intelligente des e-mails.
                    • Le workflow démarre avec un déclencheur Gmail, qui surveille en continu la boîte de réception et envoie chaque nouveau message pour traitement.
                    • Chaque e-mail est ensuite analysé par un classificateur de texte basé sur le modèle GPT-4o (OpenAI Chat Model), via l’API OpenAI.
                    • Votre tâche est de catégoriser automatiquement les messages selon l’une des classes suivantes :
                    1. 🔴 Haute priorité
                    2. 🟢 Support client
                    3. 🟣 Promotions
                    4. 🟡 Finance / Facturation
                    • Pour chaque catégorie, des actions spécifiques doivent être appliquées :
                    📌 Cas 1 : Haute priorité
                    • Ajouter une étiquette Gmail “High Priority”.
                    • Générer automatiquement une réponse brouillon à destination du contact.
                    • Sauvegarder le brouillon sans envoi automatique.
                    • Envoyer une notification immédiate sur Telegram à l’utilisateur (ex. : “Un e-mail urgent a été reçu de [nom]. Brouillon généré.”).
                    📌 Cas 2 : Support client
                    • Ajouter une étiquette “Customer Support”.
                    • Créer et envoyer automatiquement un accusé de réception au client.
                    • Notifier l’utilisateur sur Telegram (ex. : “Un message de support a reçu une réponse automatique.”).
                    📌 Cas 3 : Promotions
                    • Ajouter une étiquette “Promotions”.
                    • Résumer le contenu de l’e-mail grâce au modèle GPT-4o.
                    • Générer une courte recommandation (ex. “Offre valable jusqu’à demain, peut valoir le coup”).
                    • Envoyer la notification Telegram contenant le résumé et la recommandation, pour éviter l’encombrement de la boîte principale.
                    📌 Cas 4 : Finance / Facturation
                    • Ajouter une étiquette “Finance/Billing”.
                    • Générer un résumé structuré (montant, date, émetteur, objet).
                    • Transférer automatiquement l’e-mail au service financier.
                    • Notifier l’utilisateur sur Telegram (ex. : “Facture reçue et transmise à Finance.”).
                    • Toutes les notifications Telegram sont envoyées via appels API, garantissant une communication en temps réel.
                    • À chaque étape, le système veille à la transparence totale des actions effectuées et conserve la traçabilité des traitements.
                    • Le ton doit rester professionnel, clair et informatif, adapté à une utilisation en entreprise.
                """).strip(),
        "category": "Entreprise",
        "tags": "Gmail, Classification, Automatisation",
        "template_file": "email_classification.json",
        "guide": {
            "type": "guide",
            "title": "Installation du workflow n8n – Gmail Classification",
            "steps": [
                dedent("""\
                📬 Guide d’installation du Workflow “Gmail Classification” sur n8n
                Ce guide vous explique pas à pas comment importer, configurer et activer le workflow Gmail Classification sur n8n.
                Ce workflow utilise l’IA pour classer automatiquement vos e-mails entrants selon leur type (haute priorité, support client, promotion, finance) et envoie des notifications sur Telegram.
                ________________________________________
                🧩 1. Télécharger le workflow depuis la marketplace
                • Accédez à la marketplace View Wise.
                • Recherchez “Gmail Classification”.
                • Cliquez sur “Download Template” pour télécharger le fichier .json sur votre ordinateur.
                ________________________________________
                🌐 2. Créer un compte sur n8n
                • Ouvrez le site officiel de n8n : 👉 https://app.n8n.cloud
                • Créez un compte gratuit si vous n’en avez pas encore.
                ________________________________________
                ⚙️ 3. Configurer le composant Gmail Trigger
                1. Cliquez sur le nœud “Gmail Trigger”.
                2. Cliquez sur “Create New Credential”.
                3. Connectez-vous avec l’adresse Gmail que vous souhaitez utiliser pour classifier vos e-mails reçus.
                ________________________________________
                ✉️ 4. Configurer les composants Gmail de classification
                Le workflow contient plusieurs catégories d’e-mails :
                • High Priority
                • Customer Support
                • Promotion
                • Finance/Billing
                👉 Pour chacun de ces composants Gmail :
                1. Cliquez dessus.
                2. Cliquez sur “Create New Credential” (ou sélectionnez la même déjà créée).
                3. Connectez-vous avec le même e-mail que celui utilisé pour le Gmail Trigger.
                4. Cela permet au workflow de lire et d’envoyer des e-mails depuis le même compte.
                ________________________________________
                📩 5. Configurer le composant Send to Finance Dept
                1. Cliquez sur le nœud “Send to Finance Dept”.
                2. Connectez-le avec le même compte Gmail.
                3. Dans le champ “To”, saisissez l’adresse e-mail du responsable ou de la personne qui doit répondre à votre place aux e-mails liés à la finance.
                ________________________________________
                🤖 6. Vérifier les composants IA (aucune modification nécessaire)
                Les composants suivants sont déjà configurés avec les prompts et modèles OpenAI adaptés.
                Il suffit simplement de les ouvrir puis de les refermer, sans effectuer de changement :
                • 🧠 OpenAI Chat Model
                • ✉️ Creating Draft
                • 💡 Summary & Rec
                • 💼 Summary for Finance Dept
                💬 7. Configurer les composants Telegram
                Le workflow enverra des notifications Telegram en temps réel pour chaque e-mail classé.
                a) Obtenir le Token ID
                1. Ouvrez Telegram et recherchez BotFather.
                2. Ouvrez la discussion, puis tapez :
                3. /start
                4. /newbot
                5. Choisissez un nom (exemple : yttgetdemo).
                6. Choisissez un identifiant (exemple : yttgetdemo_bot).
                7. Vous recevrez un message contenant un Access Token.
                👉 Copiez ce token : il sera utilisé dans la création des credentials Telegram sur n8n.
                📺 Vidéo tutorielle recommandée :
                👉 Create a Telegram Bot and Obtain the Chat ID - Step-by-Step Guide
                b) Trouver le Chat ID
                1. Dans votre navigateur, entrez :
                2. https://api.telegram.org/bot<VOTRE_ACCESS_TOKEN>/getUpdates
                3. Recherchez dans la réponse :
                4. "chat": {
                5.   "id": 123456789,
                6. }
                👉 Ce nombre est votre Chat ID.
                c) Connecter Telegram à n8n
                1. Dans chaque composant Telegram (Notify, Notify (2), etc.), cliquez sur “Create New Credential”.
                2. Ajoutez votre Token ID et Chat ID.
                3. Ces notifications vous informeront de tous les e-mails reçus, classés et des réponses automatiques envoyées.
                ________________________________________
                💾 8. Sauvegarder et activer le workflow
                1. Cliquez sur le bouton “Save” pour enregistrer vos modifications.
                2. Cliquez sur “Execute Workflow” pour le tester manuellement.
                3. Ou activez le workflow en basculant le bouton “Inactive → Active”.
                👉 Le workflow s’exécutera alors automatiquement à chaque nouvel e-mail.
                ________________________________________
                ✅ Votre workflow est prêt !
                Votre workflow Gmail Classification est désormais configuré 🎉
                Il classifie, répond et notifie vos e-mails de manière totalement automatique via Gmail + OpenAI + Telegram.
                """).strip()
            ],
            "notes": "Les réponses automatiques et résumés sont générés selon la classe détectée."
        }
    },
    {
        "agentName": "Data analyst Agent",
        "agentRole": "Analyste IA pour requêtes naturelles et données Google Sheets",
        "agentObjective": "Transformer demandes simples en analyses prêtes à l’emploi avec JSON labels/values et résumé pro.",
        "agentInstructions": dedent("""\
                    • Vous êtes une IA analyste de données conversationnelle.
                    • Pour chaque message utilisateur, vous recevrez :
                      o une requête textuelle en anglais naturel,
                      o un accès à des données structurées (Google Sheets).
                    • Votre tâche est de :
                      o Identifier les dimensions et mesures pertinentes (ex. année, produit, région).
                      o Produire un objet JSON valide contenant :
                         labels : les catégories (ex. mois, produits)
                         values : les valeurs numériques correspondantes
                      o Rédiger un résumé analytique clair et professionnel, incluant :
                         nombre total d’éléments,
                         valeurs moyennes et extrêmes,
                         commentaires sur les tendances ou écarts observés.
                      o Générer un texte prêt à être inséré dans un email professionnel.
                    • Le ton doit être factuel, concis et neutre.
                    • Si applicable, recommandez le type de graphique le plus adapté (ligne, barres, camembert).
                    • Soyez toujours structuré, explicite et rigoureux dans vos réponses.
                """).strip(),
        "category": "Éducation",
        "tags": "Données, Google Sheets, Analyse",
        "template_file": "data_analyst.json",
        "guide": {
            "type": "guide",
            "title": "Installation du workflow n8n – Data Analyst",
            "steps": [
                dedent("""\
                Guide d’installation du Workflow “Data Analyst” sur n8n
                Ce guide vous explique comment importer, configurer et activer le workflow Data Analyst sur n8n, afin d’analyser automatiquement des données depuis Google Sheets et recevoir des rapports par email.
                ________________________________________
                🧩 1. Télécharger le workflow depuis la marketplace du plateforme View-wise
                • Rendez-vous sur la marketplace du plateforme.
                • Recherchez “Data Analyst”.
                • Cliquez sur “Download template” pour télécharger le fichier .json sur votre ordinateur.
                ________________________________________
                🌐 2. Créer un compte n8n
                • Ouvrez le site officiel de n8n : 👉 https://app.n8n.cloud
                • Cliquez sur “Sign up” et créez un compte gratuit.
                ________________________________________
                📁 3. Importer le workflow sur n8n
                • Une fois connecté à votre espace n8n, cliquez sur “Workflows” → “Import from File”.
                • Sélectionnez le fichier .json que vous avez téléchargé depuis la marketplace.
                • Le workflow “Data Analyst” s’affiche dans votre éditeur.
                ________________________________________
                📊 4. Importer vos données dans Google Sheets
                • Créez ou ouvrez un fichier Google Sheets contenant vos données à analyser.
                • Notez bien l’adresse e-mail utilisée pour ce Google Sheets.
                ________________________________________
                🔑 5. Configurer le composant Google Sheets
                1. Cliquez sur le nœud “Google Sheets” dans le workflow.
                2. Cliquez sur “Create New Credential”.
                3. Connectez-vous avec le même e-mail que celui de votre fichier Google Sheets.
                4. Dans “Input from list”, sélectionnez le nom de votre fichier de données.
                ________________________________________
                📧 6. Configurer le composant Send Email
                1. Cliquez sur le nœud “Send a message”.
                2. Cliquez sur “Create New Credential”.
                3. Connectez-vous avec le même compte Gmail.
                4. Dans le champ “To”, entrez l’adresse e-mail du destinataire qui recevra le rapport.
                ________________________________________
                🤖 7. Vérifier les composants IA
                • Cliquez sur le nœud “OpenAI Chat Model”, puis fermez la fenêtre (pas de modification nécessaire).
                • Cliquez sur le nœud “Write Report”, puis fermez également.
                ________________________________________
                💾 8. Sauvegarder le workflow
                • Cliquez sur le bouton “Save” en haut à droite.
                ________________________________________
                💬 9. Tester le workflow
                1. Cliquez sur “Open Chat”.
                2. Écrivez un message avec les informations que vous souhaitez analyser.
                3. Le workflow traitera vos données, générera des graphiques et vous enverra un rapport par e-mail avec une description détaillée des analyses.
                ________________________________________
                ✅ Votre workflow est prêt !
                Vous pouvez maintenant utiliser Data Analyst pour automatiser vos analyses de données et recevoir des rapports intelligents directement dans votre boîte mail 📈📬
                """).strip()
            ],
            "notes": "Le rapport inclut une recommandation de visuel et un texte prêt pour e-mail."
        }
    },
]


# ───────────────────────────
# Utilitaires
# ───────────────────────────
def require_prereqs():
    User = get_user_model()
    if not User.objects.filter(id=CREATOR_ID).exists():
        raise SystemExit(f"CREATOR_ID introuvable dans la base: {CREATOR_ID}")
    if not os.path.isdir(TEMPLATES_DIR):
        raise SystemExit(f"Dossier templates introuvable: {TEMPLATES_DIR}")
    missing = [a["template_file"] for a in AGENTS
               if not os.path.isfile(os.path.join(TEMPLATES_DIR, a["template_file"])) ]
    if missing:
        raise SystemExit("Templates manquants: " + ", ".join(missing))
    media_root = getattr(settings, "MEDIA_ROOT", None)
    print(f"MEDIA_ROOT = {media_root}")
    if media_root and not os.path.isdir(media_root):
        os.makedirs(media_root, exist_ok=True)

def or_create_defaults():
    ds, _ = DataSource.objects.get_or_create(
        name=DATASOURCE_NAME, defaults={"type": "local", "config": {}}
    )
    mdl, _ = Modele.objects.get_or_create(
        name=MODELE_NAME, defaults={"description": MODELE_DESC}
    )
    return ds, mdl

def safe_trunc(text: str, maxlen: int | None) -> str:
    return Truncator(text or "").chars(maxlen or 255)

# ───────────────────────────
# Upsert principal
# ───────────────────────────
@transaction.atomic
def upsert_without_webhook(entry, ds, mdl):
    role_max = Agent._meta.get_field("agentRole").max_length or 255
    role = safe_trunc(entry["agentRole"], role_max)
    category = safe_trunc(entry.get("category", "Général"), 100)
    tags = safe_trunc(entry.get("tags", ""), 255)

    agent, created = Agent.objects.get_or_create(
        agentName=entry["agentName"],
        defaults={
            "agentRole": role,
            "agentObjective": entry["agentObjective"],
            "agentInstructions": entry["agentInstructions"],
            "creator_id": CREATOR_ID,
            "etat": "draft",
            "datasource": ds,
            "modele": mdl
        }
    )
    if not created:
        agent.agentRole = role
        agent.agentObjective = entry["agentObjective"]
        agent.agentInstructions = entry["agentInstructions"]
        agent.datasource = ds
        agent.modele = mdl
        agent.save()

    # Attacher le template .json (une seule fois par nom exact)
    json_path = os.path.join(TEMPLATES_DIR, entry["template_file"])
    if os.path.isfile(json_path):
        existing = {os.path.basename(f.file.name) for f in agent.files.all()}
        fname = entry["template_file"]
        if fname not in existing:
            with open(json_path, "rb") as fh:
                af = AgentFile(agent=agent)
                af.file.save(fname, File(fh), save=True)  # upload_to='agent_files/'
                try:
                    af.size = af.file.size or os.path.getsize(json_path)
                except Exception:
                    af.size = 0
                af.save(update_fields=["size"])
                print(f"Attaché → {agent.agentName} | {af.file.name} | {af.size} o")
        else:
            print(f"Déjà présent → {agent.agentName} | {fname}")

    # Guide structuré (JSONField)
    guide_payload = entry.get("guide") or {}
    if guide_payload:
        guide_link, created_guide = Link.objects.get_or_create(
            agent=agent, source_name="guide", defaults={"url": guide_payload}
        )
        if not created_guide:
            guide_link.url = guide_payload
            guide_link.save()

    # Publication Marketplace
    mp, mp_created = Marketplace.objects.get_or_create(
        agent=agent, defaults={"category": category, "tags": tags}
    )
    if not mp_created:
        mp.category = category
        mp.tags = tags
        mp.save()

    return agent, created

# ───────────────────────────
# Entrée
# ───────────────────────────
def main():
    require_prereqs()
    ds, mdl = or_create_defaults()
    created, updated = 0, 0
    for item in AGENTS:
        _, c = upsert_without_webhook(item, ds, mdl)
        created += 1 if c else 0
        updated += 0 if c else 1
    print(f"Créés {created} | Mis à jour {updated}")

    from django.db.models import Count
    stats = (Agent.objects.filter(marketplace_entry__isnull=False)
             .annotate(n=Count('files'))
             .values('agentId', 'agentName', 'n'))
    print("Vérification fichiers attachés (Marketplace) →", list(stats))

if __name__ == "__main__":
    os.makedirs(TEMPLATES_DIR, exist_ok=True)
    main()
